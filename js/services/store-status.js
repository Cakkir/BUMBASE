/**
 * Dükkân durumu servisi: "Siparişleri durdur" ve "Tükendi" ürünler
 *   get()            → { paused, soldOut: [id], updatedAt }
 *   ordering()       → { ok } | { ok:false, code:'paused'|'closed', title, message }  (saat dahil)
 *   canAdd(id)       → null | hata mesajı
 *   cartIssue(lines) → null | { code, title, message, soldOut? }
 *   set(patch)       → yeni durum (yalnızca panel / PIN)
 *   subscribe(fn)    → durum veya açık/kapalı değişince fn(status)
 *
 * Sunucu modunda durum sunucuda tutulur ve SSE ile tüm müşterilere anında iletilir.
 * Tarayıcı (demo) modunda localStorage + BroadcastChannel ile sekmeler arası eşitlenir.
 */
(function (App) {
  var U = App.utils, A = App.availability;
  var KEY = 'koz.storeStatus.v1';
  var status = A.normalize(U.storage.get(KEY, null));
  var subs = [];
  var lastSig = null;

  var channel = null;
  try { channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('koz-status') : null; } catch (e) { channel = null; }

  function sig() { var o = A.ordering(status); return JSON.stringify([o.ok, o.code, status.soldOut.slice().sort(), status.paused]); }
  function emit(force) {
    var s = sig();
    if (!force && s === lastSig) return;
    lastSig = s;
    subs.slice().forEach(function (fn) { try { fn(status); } catch (e) { console.error(e); } });
  }
  function apply(next, broadcast) {
    status = A.normalize(next);
    if (App.api.mode !== 'remote') U.storage.set(KEY, status);
    if (broadcast && channel) channel.postMessage(status);
    emit();
  }

  if (channel) channel.onmessage = function (m) { if (App.api.mode !== 'remote') apply(m.data, false); };
  window.addEventListener('storage', function (e) { if (e.key === KEY && App.api.mode !== 'remote') apply(U.storage.get(KEY, null), false); });

  function fetchRemote() {
    return App.api.http('GET', '/api/store-status').then(function (j) { apply(j, false); }, function () { /* ağ hatası: eski durum kalır */ });
  }

  var ready = App.api.ready.then(function (mode) {
    if (mode !== 'remote') { lastSig = sig(); return; }
    if (App.api.health && App.api.health.status) apply(App.api.health.status, false);
    // Canlı akış: panelden yapılan değişiklik müşterilere anında düşer
    App.orders.subscribe(function (evt) { if (evt && evt.type === 'status') apply(evt.status, false); });
    document.addEventListener('visibilitychange', function () { if (!document.hidden) fetchRemote(); });
  });

  // Açılış / kapanış saatini yakalamak için dakikada bir kontrol
  setInterval(function () { emit(); }, 30000);

  function itemName(id) { var it = App.pricing.findItem(id); return it ? it.name : id; }

  App.storeStatus = {
    ready: ready,
    get: function () { return status; },
    ordering: function () { return A.ordering(status); },
    isSoldOut: function (id) { return A.isSoldOut(status, id); },
    canAdd: function (id) {
      if (A.isSoldOut(status, id)) return itemName(id) + ' şu an tükendi.';
      var o = A.ordering(status);
      return o.ok ? null : o.title + '. ' + o.message;
    },
    cartIssue: function (lines) {
      var o = A.ordering(status);
      if (!o.ok) return o;
      var out = (lines || App.store.getState().cart).filter(function (l) { return A.isSoldOut(status, l.id); }).map(function (l) { return l.id; });
      if (out.length) return { ok: false, code: 'soldout', soldOut: out, title: 'Sepetinizde tükenen ürün var', message: out.filter(function (id, i) { return out.indexOf(id) === i; }).map(itemName).join(', ') + ' şu an tükendi. Devam etmek için sepetten çıkarın.' };
      return null;
    },
    set: function (patch) {
      return App.api.ready.then(function (mode) {
        if (mode === 'remote') {
          return App.api.http('PATCH', '/api/store-status', patch, { 'x-admin-pin': (App.adminAuth && App.adminAuth.pin()) || '' }).then(function (j) { apply(j, false); return status; });
        }
        if (App.adminAuth && !App.adminAuth.pin()) throw new Error('Yetkisiz');
        apply(Object.assign({}, status, patch, { updatedAt: new Date().toISOString() }), true);
        return status;
      });
    },
    refresh: function () { return App.api.mode === 'remote' ? fetchRemote() : Promise.resolve(); },
    subscribe: function (fn) { subs.push(fn); return function () { subs = subs.filter(function (s) { return s !== fn; }); }; },
  };
})(window.App = window.App || {});
