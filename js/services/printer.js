/**
 * ADİSYON YAZICISI
 * -----------------------------------------------------------------
 * Sipariş panelinden termal fiş yazıcısına baskı. Dört bağlantı yolu:
 *   browser : Bilgisayara kurulu herhangi bir yazıcı (Windows sürücüsü). Chrome'u
 *             --kiosk-printing ile açarsanız yazdırma penceresi çıkmadan basar.
 *   usb     : USB termal yazıcıya doğrudan ESC/POS (WebUSB · Chrome / Edge)
 *   serial  : Seri port / USB-seri (COM) yazıcı (Web Serial · Chrome / Edge)
 *   network : Ağ (Ethernet / Wi-Fi) yazıcı, IP:9100 — server/server.js üzerinden basılır
 */
(function (App) {
  var U = App.utils, R = App.receipt;
  var KEY = 'koz.printer.v1', PRINTED_KEY = 'koz.printed.v1';
  var DEFAULTS = { driver: 'browser', paper: 80, charset: 'cp857', codePage: 13, copies: 1, autoPrint: false, baud: 9600 };

  var state = { usb: null, usbEp: null, serial: null, label: '' };
  var queue = Promise.resolve();
  var listeners = [];

  function settings() { return Object.assign({}, DEFAULTS, U.storage.get(KEY, {})); }
  function save(patch) { var s = Object.assign(settings(), patch); U.storage.set(KEY, s); emit(); return s; }
  function emit() { listeners.forEach(function (fn) { try { fn(status()); } catch (e) { /* yok say */ } }); }
  function onChange(fn) { listeners.push(fn); return function () { listeners = listeners.filter(function (f) { return f !== fn; }); }; }

  function support() {
    return {
      browser: true,
      usb: typeof navigator !== 'undefined' && !!navigator.usb,
      serial: typeof navigator !== 'undefined' && !!navigator.serial,
      network: App.api.mode === 'remote',
    };
  }

  function status() {
    var s = settings();
    if (s.driver === 'usb') return { connected: !!state.usb, label: state.usb ? state.label : 'USB yazıcı bağlı değil' };
    if (s.driver === 'serial') return { connected: !!state.serial, label: state.serial ? state.label : 'Seri port yazıcı bağlı değil' };
    if (s.driver === 'network') return { connected: support().network, label: support().network ? 'Ağ yazıcısı (sunucu üzerinden)' : 'Ağ yazıcısı için sunucu gerekli' };
    return { connected: true, label: 'Bilgisayara kurulu yazıcı' };
  }

  // ---------------- basılan siparişler (tekrar basmayı önlemek için) ----------------
  function printedMap() { return U.storage.get(PRINTED_KEY, {}); }
  function printedAt(order) { return (order && order.printedAt) || printedMap()[order && order.id] || null; }
  function markPrinted(id) {
    var m = printedMap(); m[id] = new Date().toISOString();
    var ids = Object.keys(m); if (ids.length > 300) ids.sort(function (a, b) { return m[a] < m[b] ? -1 : 1; }).slice(0, ids.length - 300).forEach(function (k) { delete m[k]; });
    U.storage.set(PRINTED_KEY, m);
  }

  // ---------------- fiş üretimi ----------------
  function receiptOpts(s, copyIdx, copies) {
    var r = App.config.restaurant;
    return {
      width: R.PAPER[s.paper] || 48, charset: s.charset, codePage: s.codePage,
      copyLabel: copies > 1 ? ['MUTFAK NÜSHASI', 'KURYE NÜSHASI', 'KASA NÜSHASI'][copyIdx] || ('Nüsha ' + (copyIdx + 1)) : '',
      restaurant: { name: r.name, tagline: r.tagline, address: r.address, phone: r.phone, city: r.city },
    };
  }
  function bytesFor(order, s, copies) {
    var parts = [];
    for (var i = 0; i < copies; i++) parts.push(R.toEscPos(R.build(order, receiptOpts(s, i, copies)), receiptOpts(s, i, copies)));
    return R.joinBytes(parts);
  }
  function htmlFor(order, s, copies) {
    var out = '';
    for (var i = 0; i < copies; i++) out += '<div class="rc-page">' + R.toHtml(R.build(order, receiptOpts(s, i, copies)), receiptOpts(s, i, copies)) + '</div>';
    return out;
  }
  function preview(order, paper) {
    var s = settings(); if (paper) s.paper = paper;
    return R.toHtml(R.build(order, receiptOpts(s, 0, 1)), receiptOpts(s, 0, 1));
  }

  // ---------------- sürücüler ----------------
  function printBrowser(order, s, copies) {
    return new Promise(function (resolve, reject) {
      var f = document.createElement('iframe');
      f.setAttribute('aria-hidden', 'true');
      f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
      document.body.appendChild(f);
      var doc = f.contentWindow.document;
      doc.open();
      doc.write('<!doctype html><html><head><meta charset="utf-8"><title>Adisyon #' + order.id + '</title><style>' +
        '@page{size:' + s.paper + 'mm auto;margin:0}html,body{margin:0;background:#fff}' +
        'body{padding:2mm ' + (s.paper === 58 ? '2mm' : '4mm') + '}' + R.CSS +
        '.rc{width:100%;font-size:' + (s.paper === 58 ? '9.5pt' : '10pt') + '}.rc-page{page-break-after:always}.rc-page:last-child{page-break-after:auto}.rc-cut{display:none}' +
        '</style></head><body>' + htmlFor(order, s, copies) + '</body></html>');
      doc.close();
      setTimeout(function () {
        try { f.contentWindow.focus(); f.contentWindow.print(); resolve(); }
        catch (e) { reject(new Error('Tarayıcı yazdırmaya izin vermedi.')); }
        setTimeout(function () { f.remove(); }, 1500);
      }, 120);
    });
  }

  function findOutEndpoint(device) {
    var cfgs = device.configuration ? [device.configuration] : device.configurations;
    for (var c = 0; c < cfgs.length; c++) {
      var ifs = cfgs[c].interfaces;
      for (var i = 0; i < ifs.length; i++) {
        var alt = ifs[i].alternate || ifs[i].alternates[0];
        for (var e = 0; e < alt.endpoints.length; e++) {
          var ep = alt.endpoints[e];
          if (ep.direction === 'out' && ep.type === 'bulk') return { cfg: cfgs[c].configurationValue, iface: ifs[i].interfaceNumber, ep: ep.endpointNumber, printer: alt.interfaceClass === 7 };
        }
      }
    }
    return null;
  }

  function openUsb(device) {
    return device.open()
      .then(function () { if (device.configuration === null) return device.selectConfiguration(1); })
      .then(function () {
        var t = findOutEndpoint(device);
        if (!t) throw new Error('Bu USB cihazında yazıcı çıkışı bulunamadı.');
        return device.claimInterface(t.iface).then(function () {
          state.usb = device; state.usbEp = t.ep;
          state.label = (device.manufacturerName ? device.manufacturerName + ' ' : '') + (device.productName || 'USB yazıcı');
          U.storage.set(KEY + '.usb', { vendorId: device.vendorId, productId: device.productId });
          emit();
          return state.label;
        });
      })
      .catch(function (e) {
        if (/claim|Access denied|Unable to claim/i.test(e.message)) throw new Error('Yazıcı Windows sürücüsüne bağlı olduğu için doğrudan erişilemiyor. "Bilgisayara kurulu yazıcı" yöntemini kullanın veya README’deki WinUSB adımını uygulayın.');
        throw e;
      });
  }

  function writeUsb(bytes) {
    if (!state.usb) return Promise.reject(new Error('USB yazıcı bağlı değil. Yazıcı ayarlarından "Bağlan"a basın.'));
    var chain = Promise.resolve(), size = 4096;
    for (var i = 0; i < bytes.length; i += size) (function (part) { chain = chain.then(function () { return state.usb.transferOut(state.usbEp, part); }); })(bytes.slice(i, i + size));
    return chain;
  }

  function openSerial(port, baud) {
    return port.open({ baudRate: baud || 9600 }).catch(function (e) { if (!/already open/i.test(e.message)) throw e; }).then(function () {
      state.serial = port;
      var info = port.getInfo ? port.getInfo() : {};
      state.label = 'Seri port yazıcı' + (info.usbVendorId ? ' (' + info.usbVendorId.toString(16) + ':' + (info.usbProductId || 0).toString(16) + ')' : '');
      emit();
      return state.label;
    });
  }

  function writeSerial(bytes) {
    if (!state.serial || !state.serial.writable) return Promise.reject(new Error('Seri port yazıcı bağlı değil. Yazıcı ayarlarından "Bağlan"a basın.'));
    var w = state.serial.writable.getWriter();
    return w.write(bytes).then(function () { w.releaseLock(); }, function (e) { w.releaseLock(); throw e; });
  }

  function adminHeaders() { return { 'x-admin-pin': (App.adminAuth && App.adminAuth.pin()) || '' }; }

  // ---------------- dışa açık işlemler ----------------
  function connect() {
    var s = settings();
    if (s.driver === 'usb') {
      if (!support().usb) return Promise.reject(new Error('Bu tarayıcı USB yazıcıya doğrudan bağlanamıyor. Chrome veya Edge kullanın.'));
      return navigator.usb.requestDevice({ filters: [] }).then(openUsb);
    }
    if (s.driver === 'serial') {
      if (!support().serial) return Promise.reject(new Error('Bu tarayıcı seri porta bağlanamıyor. Chrome veya Edge kullanın.'));
      return navigator.serial.requestPort().then(function (p) { return openSerial(p, s.baud); });
    }
    return Promise.resolve(status().label);
  }

  /** Daha önce izin verilmiş cihaza sayfa açılışında sessizce yeniden bağlan */
  function restore() {
    var s = settings();
    if (s.driver === 'usb' && support().usb && !state.usb) {
      var saved = U.storage.get(KEY + '.usb', null);
      return navigator.usb.getDevices().then(function (list) {
        var d = list.filter(function (x) { return !saved || (x.vendorId === saved.vendorId && x.productId === saved.productId); })[0];
        return d ? openUsb(d) : null;
      }).catch(function () { return null; });
    }
    if (s.driver === 'serial' && support().serial && !state.serial) {
      return navigator.serial.getPorts().then(function (ports) { return ports[0] ? openSerial(ports[0], s.baud) : null; }).catch(function () { return null; });
    }
    return Promise.resolve(null);
  }

  function print(order, opts) {
    opts = opts || {};
    var s = settings();
    var copies = Math.max(1, Math.min(3, opts.copies || s.copies || 1));
    var job = function () {
      var p;
      if (s.driver === 'network') {
        if (!support().network) return Promise.reject(new Error('Ağ yazıcısı yalnızca sunucu (server/server.js) ile çalışır.'));
        p = App.api.http('POST', '/api/print/' + encodeURIComponent(order.id), { copies: copies, auto: !!opts.auto }, adminHeaders());
      } else if (s.driver === 'usb') p = writeUsb(bytesFor(order, s, copies));
      else if (s.driver === 'serial') p = writeSerial(bytesFor(order, s, copies));
      else p = printBrowser(order, s, copies);
      return p.then(function (res) { if (!order.test) markPrinted(order.id); return res; });
    };
    var run = queue.then(job, job);
    queue = run.catch(function () {});
    return run;
  }

  function sampleOrder() {
    var hoods = App.config.delivery.neighborhoods || ['Şenlik'];
    return {
      id: 'TEST', test: true, createdAt: new Date().toISOString(), schedule: { type: 'asap' },
      customer: { name: 'Test Müşteri', phone: '05XX XXX XX XX' },
      address: { neighborhood: hoods[0], street: 'Örnek Sok. No: 1', apartment: 'Kat 2', zoneLabel: App.config.delivery.zones[0].label, directions: 'Yazıcı deneme fişi' },
      lines: [
        { qty: 1, name: 'Karışık Pizza', portionLabel: 'Dev Boy', unit: 590, total: 590, note: 'Az pişmiş olsun' },
        { qty: 2, name: 'Coca-Cola', portionLabel: '330 ml kutu', unit: 100, total: 200 },
      ],
      subtotal: 790, deliveryFee: 0, total: 790,
      payment: { method: 'cash_door', methodLabel: 'Kapıda Nakit', status: 'pending' },
      note: 'Türkçe karakter testi: ÇĞİÖŞÜ çğıöşü', cutlery: true,
    };
  }

  function test() {
    var s = settings();
    if (s.driver === 'network') {
      if (!support().network) return Promise.reject(new Error('Ağ yazıcısı yalnızca sunucu ile çalışır.'));
      return App.api.http('POST', '/api/print-test', {}, adminHeaders());
    }
    return print(sampleOrder(), { copies: 1 });
  }

  function serverInfo() {
    if (!support().network) return Promise.resolve(null);
    return App.api.http('GET', '/api/printer', null, adminHeaders()).catch(function () { return null; });
  }

  App.printer = {
    settings: settings, save: save, support: support, status: status, onChange: onChange,
    connect: connect, restore: restore, print: print, test: test, preview: preview, sampleOrder: sampleOrder,
    printedAt: printedAt, markPrinted: markPrinted, serverInfo: serverInfo,
  };
})(window.App = window.App || {});
