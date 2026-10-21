/**
 * Sipariş servisi
 *   create(payload)            → order
 *   get(id)                    → order | null
 *   list()                     → order[]            (admin)
 *   updateStatus(id, status)   → order              (admin)
 *   subscribe(fn)              → unsubscribe        fn({ type: 'order:new'|'order:update'|'sync', order? })
 */
(function (App) {
  var U = App.utils, core = App.ordersCore;
  var KEY = 'koz.orders.v1';
  var MY_KEY = 'koz.myorders.v1';

  // ------------------------------------------------------------------
  // LOCAL (tarayıcı içi demo) adaptörü
  // ------------------------------------------------------------------
  var channel = null;
  try { channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('koz-orders') : null; } catch (e) { channel = null; }
  var localSubs = [];
  var memoryOrders = null; // localStorage kullanılamazsa bellekte tut

  function readAll() {
    var v = U.storage.get(KEY, null);
    if (v === null) return memoryOrders || [];
    return v;
  }
  function writeAll(list) {
    if (!U.storage.set(KEY, list)) memoryOrders = list;
  }
  function emitLocal(evt, broadcast) {
    localSubs.forEach(function (fn) { try { fn(evt); } catch (e) { console.error(e); } });
    if (broadcast && channel) channel.postMessage(evt);
  }
  if (channel) channel.onmessage = function (m) { emitLocal(m.data, false); };
  else window.addEventListener('storage', function (e) { if (e.key === KEY) emitLocal({ type: 'sync' }, false); });

  function requireAdmin() {
    if (App.adminAuth && !App.adminAuth.pin()) { var e = new Error('Yetkisiz'); e.status = 401; throw e; }
  }

  var local = {
    create: function (p) {
      return U.wait(300).then(function () {
        var errs = core.validateCheckout(p);
        if (Object.keys(errs).length) { var e = new Error('Formda eksik alanlar var.'); e.fieldErrors = errs; throw e; }
        // Kapalı saat, durdurulmuş sipariş alımı, tükenen ürün, geçersiz ileri saat (panel demo siparişleri hariç)
        var av = p.demo ? null : App.availability.check(p, App.storeStatus ? App.storeStatus.get() : null);
        if (av) { var e2 = new Error(av.error); e2.code = av.code; e2.soldOut = av.soldOut; e2.fieldErrors = av.fieldErrors; throw e2; }
        var priced = App.pricing.priceCart(p.lines, p.address.zone);
        var payment = { status: 'pending' };
        if (p.paymentMethod === 'card_online') {
          var intent = App.paymentMock.getIntent(p.payment && p.payment.intentId);
          if (!intent || intent.status !== 'succeeded') throw new Error('Ödeme onaylanmadı. Lütfen tekrar deneyin.');
          if (intent.amount !== Math.round(priced.total * 100)) throw new Error('Sepet tutarı ödeme sırasında değişti. Lütfen tekrar ödeyin.');
          payment = { status: 'paid', intentId: intent.id, last4: intent.last4, brand: intent.brand };
        }
        var all = readAll();
        var ids = {};
        all.forEach(function (o) { ids[o.id] = true; });
        var order = core.buildOrder(p, payment, ids);
        all.unshift(order);
        writeAll(all.slice(0, 500));
        emitLocal({ type: 'order:new', order: order }, true);
        return order;
      });
    },
    get: function (id) {
      var o = readAll().filter(function (x) { return x.id === id; })[0];
      return Promise.resolve(o || null);
    },
    list: function () {
      requireAdmin();
      return Promise.resolve(readAll());
    },
    updateStatus: function (id, status) {
      requireAdmin();
      var all = readAll();
      var order = null;
      all = all.map(function (o) {
        if (o.id !== id) return o;
        order = core.applyStatus(JSON.parse(JSON.stringify(o)), status);
        return order;
      });
      if (!order) return Promise.reject(new Error('Sipariş bulunamadı'));
      writeAll(all);
      emitLocal({ type: 'order:update', order: order }, true);
      return Promise.resolve(order);
    },
    subscribe: function (fn) {
      localSubs.push(fn);
      return function () { localSubs = localSubs.filter(function (s) { return s !== fn; }); };
    },
  };

  // ------------------------------------------------------------------
  // REMOTE (server/server.js) adaptörü
  // ------------------------------------------------------------------
  function adminHeaders() { return { 'x-admin-pin': (App.adminAuth && App.adminAuth.pin()) || '' }; }

  var es = null, remoteSubs = [];
  function ensureStream() {
    if (es || typeof EventSource === 'undefined') return;
    var pin = App.adminAuth && App.adminAuth.pin();
    es = new EventSource(App.api.base + '/api/stream' + (pin ? '?pin=' + encodeURIComponent(pin) : ''));
    es.onmessage = function (m) {
      var evt; try { evt = JSON.parse(m.data); } catch (e) { return; }
      remoteSubs.forEach(function (fn) { try { fn(evt); } catch (e) { console.error(e); } });
    };
  }
  function resetStream() { if (es) { es.close(); es = null; } if (remoteSubs.length) ensureStream(); }

  var remote = {
    create: function (p) { return App.api.http('POST', '/api/orders', p); },
    get: function (id) {
      return App.api.http('GET', '/api/orders/' + encodeURIComponent(id)).catch(function (e) { if (e.status === 404) return null; throw e; });
    },
    list: function () { return App.api.http('GET', '/api/orders', null, adminHeaders()).then(function (j) { return j.orders; }); },
    updateStatus: function (id, status) { return App.api.http('PATCH', '/api/orders/' + encodeURIComponent(id), { status: status }, adminHeaders()); },
    subscribe: function (fn) {
      remoteSubs.push(fn);
      ensureStream();
      return function () {
        remoteSubs = remoteSubs.filter(function (s) { return s !== fn; });
        if (!remoteSubs.length && es) { es.close(); es = null; }
      };
    },
  };

  function impl() { return App.api.mode === 'remote' ? remote : local; }
  function call(name, args) {
    return App.api.ready.then(function () { return impl()[name].apply(null, args); });
  }

  // Müşterinin bu cihazdan verdiği siparişler (takip linki için)
  function rememberMine(order) {
    var mine = U.storage.get(MY_KEY, []).filter(function (x) { return x.id !== order.id; });
    mine.unshift({ id: order.id, createdAt: order.createdAt, total: order.total, lines: order.lines.map(function (l) { return { id: l.id, portion: l.portion, qty: l.qty }; }) });
    U.storage.set(MY_KEY, mine.slice(0, 10));
  }

  App.orders = {
    create: function (p, opts) { return call('create', [p]).then(function (o) { if (!(opts && opts.silent)) rememberMine(o); return o; }); },
    get: function (id) { return call('get', [id]); },
    list: function () { return call('list', []); },
    updateStatus: function (id, s) { return call('updateStatus', [id, s]); },
    subscribe: function (fn) {
      var unsub = null, dead = false;
      App.api.ready.then(function () { if (!dead) unsub = impl().subscribe(fn); });
      return function () { dead = true; if (unsub) unsub(); };
    },
    resetStream: resetStream,
    mine: function () { return U.storage.get(MY_KEY, []); },
    remember: rememberMine,
  };
})(window.App = window.App || {});
