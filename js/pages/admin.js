/* Restoran Sipariş Yönetim Paneli */
(function (App) {
  var U = App.utils, esc = U.esc, money = U.money, cfg = App.config, I = App.ui.I, core = App.ordersCore;
  var PIN_KEY = 'koz.admin.pin';
  var SOUND_KEY = 'koz.admin.sound';

  // ---------------- Yetkilendirme ----------------
  App.adminAuth = {
    pin: function () { return U.session.get(PIN_KEY); },
    login: function (pin) {
      return App.api.ready.then(function (mode) {
        if (mode === 'local') {
          if (pin !== cfg.admin.pin) throw new Error('PIN hatalı.');
          U.session.set(PIN_KEY, pin); return true;
        }
        return App.api.http('GET', '/api/orders', null, { 'x-admin-pin': pin }).then(function () {
          U.session.set(PIN_KEY, pin); App.orders.resetStream(); return true;
        }, function (e) { throw new Error(e.status === 401 ? 'PIN hatalı.' : e.message); });
      });
    },
    logout: function () { U.session.remove(PIN_KEY); App.orders.resetStream(); },
  };

  // ---------------- Ses bildirimi ----------------
  var audioCtx = null;
  function ding() {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      [[880, 0], [1320, .16], [1760, .32]].forEach(function (n) {
        var o = audioCtx.createOscillator(), g = audioCtx.createGain(), t = audioCtx.currentTime + n[1];
        o.type = 'sine'; o.frequency.value = n[0];
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.25, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
        o.connect(g).connect(audioCtx.destination); o.start(t); o.stop(t + 0.4);
      });
    } catch (e) { /* ses desteklenmiyor */ }
  }

  // ---------------- Demo sipariş üretici ----------------
  var demoNames = ['Elif Y.', 'Mert K.', 'Zeynep A.', 'Can D.', 'Ayşe T.', 'Emre S.', 'Derya B.', 'Kaan Ö.'];
  var demoStreets = ['Fatih Cad. No: 41', 'Örnek Sok. No: 12', 'Lale Sok. No: 7', 'Çınar Cad. No: 30', 'Gül Sok. No: 5'];
  var demoNotes = ['', '', 'Zili çalmayın, kapıyı tıklatın.', 'Acısız olsun lütfen.', 'Para üstü 1000 TL’ye.', ''];
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function demoOrder() {
    var pool = App.menu.items.filter(function (i) { return i.cat !== 'sos' && !App.storeStatus.isSoldOut(i.id); });
    var lines = [], total = 0;
    while (total < 600) {
      var it = pick(pool), portion = App.pricing.defaultPortion(it), qty = 1 + Math.floor(Math.random() * 2);
      lines.push({ id: it.id, portion: portion, qty: qty }); total += App.pricing.unitPrice(it, portion) * qty;
    }
    var zone = pick(cfg.delivery.zones).id;
    return {
      customer: { name: pick(demoNames), phone: '05' + (30 + Math.floor(Math.random() * 69)) + String(Math.floor(1000000 + Math.random() * 8999999)) },
      address: { zone: zone, neighborhood: pick(cfg.delivery.neighborhoods), street: pick(demoStreets), apartment: 'Kat ' + (1 + Math.floor(Math.random() * 6)), directions: '' },
      demo: true, note: pick(demoNotes), schedule: { type: 'asap' }, paymentMethod: pick(['cash_door', 'card_door']), acceptTerms: true, cutlery: Math.random() > .5, lines: lines,
    };
  }

  // ---------------- Görünümler ----------------
  function loginView() {
    return '' +
      '<div class="admin-login">' +
      '  <form class="admin-login-card" id="admin-login">' +
      '    <a href="#anasayfa" class="brand"><img class="brand-logo" src="assets/img/logo-horizontal.svg" alt="' + esc(cfg.restaurant.name) + '" width="200" height="45"></a>' +
      '    <h1 class="display-sm">Sipariş Paneli</h1>' +
      '    <p class="muted">Gelen siparişleri görmek için yönetici PIN kodunu girin.</p>' +
      '    <label class="field"><span class="field-label">PIN</span><input class="input input--code num" id="admin-pin" type="password" inputmode="numeric" autocomplete="current-password" maxlength="8" autofocus></label>' +
      '    <p class="field-error" id="admin-err" hidden></p>' +
      '    <button class="btn btn-primary btn-block" type="submit">Giriş yap</button>' +
      '    <p class="muted text-sm" id="pin-hint"></p>' +
      '    <a href="#anasayfa" class="link-arrow">Siteye dön</a>' +
      '  </form>' +
      '</div>';
  }

  function isToday(d) { var x = new Date(d), n = new Date(); return x.toDateString() === n.toDateString(); }

  function stats(orders) {
    var today = orders.filter(function (o) { return isToday(o.createdAt); });
    var valid = today.filter(function (o) { return o.status !== 'iptal'; });
    var revenue = valid.reduce(function (s, o) { return s + o.total; }, 0);
    var active = orders.filter(function (o) { return ['yeni', 'hazirlaniyor', 'yolda'].indexOf(o.status) >= 0; }).length;
    var avg = valid.length ? revenue / valid.length : 0;
    var waiting = orders.filter(function (o) { return o.status === 'yeni'; }).length;
    var tile = function (label, value, sub, cls) { return '<div class="stat ' + (cls || '') + '"><span class="stat-label">' + label + '</span><b class="num">' + value + '</b><span class="stat-sub">' + sub + '</span></div>'; };
    return '<div class="stat-row">' +
      tile('Bugünkü sipariş', valid.length, today.length - valid.length ? (today.length - valid.length) + ' iptal' : 'iptal yok') +
      tile('Bugünkü ciro', money(revenue, false), 'iptaller hariç') +
      tile('Aktif sipariş', active, waiting ? waiting + ' tanesi onay bekliyor' : 'onay bekleyen yok', waiting ? 'stat--alert' : '') +
      tile('Ortalama sepet', money(avg, false), 'bugün') +
      '</div>';
  }

  function ageClass(o) {
    var m = U.minutesAgo(o.timeline && o.timeline.length ? o.timeline[o.timeline.length - 1].at : o.createdAt);
    if (o.status === 'yeni') return m >= 10 ? 'age-crit' : m >= 5 ? 'age-warn' : '';
    if (o.status === 'hazirlaniyor') return m >= 30 ? 'age-crit' : m >= 20 ? 'age-warn' : '';
    if (o.status === 'yolda') return m >= 40 ? 'age-warn' : '';
    return '';
  }

  var PRN = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 8V3.5h10V8M7 17H4.5V10a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v7H17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><rect x="7" y="14" width="10" height="6.5" rx="1" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>';
  var DRIVERS = [
    { id: 'browser', label: 'Bilgisayara kurulu yazıcı', hint: 'Windows’a sürücüsü kurulu her yazıcı. Önerilen yöntem.' },
    { id: 'usb', label: 'USB yazıcı (doğrudan)', hint: 'Sürücüsüz, ESC/POS komutlarıyla. Chrome / Edge gerekir.' },
    { id: 'serial', label: 'Seri port / COM yazıcı', hint: 'USB-seri veya RS232 bağlantılı yazıcılar. Chrome / Edge gerekir.' },
    { id: 'network', label: 'Ağ yazıcısı (IP)', hint: 'Ethernet / Wi-Fi yazıcı. Sipariş sunucusu yazıcıya doğrudan basar.' },
  ];

  function ensureReceiptCss() {
    if (document.getElementById('rc-css')) return;
    var st = document.createElement('style'); st.id = 'rc-css'; st.textContent = App.receipt.CSS; document.head.appendChild(st);
  }

  function printerBtn() {
    var s = App.printer.status();
    return '<button class="btn btn-sm btn-ghost prn-btn" data-adm="printer" title="' + esc(s.label) + '">' + PRN + 'Yazıcı<i class="prn-dot ' + (s.connected ? 'on' : 'off') + '"></i></button>';
  }

  function appBtns() {
    var out = '';
    if (App.pwa && App.pwa.canInstall()) out += '<button class="btn btn-sm btn-primary" data-adm="install">Uygulamayı yükle</button>';
    if (App.notify && App.notify.supported()) {
      var on = App.notify.enabled();
      out += '<button class="btn btn-sm btn-ghost" data-adm="notify" aria-pressed="' + on + '">' + (on ? 'Bildirim açık' : 'Bildirimleri aç') + '</button>';
    }
    return out;
  }

  // ---------------- Sipariş alımı ve stok ----------------
  function controlBtns() {
    var st = App.storeStatus.get(), n = st.soldOut.length;
    return '<button class="btn btn-sm ' + (st.paused ? 'btn-danger' : 'btn-ghost') + ' pause-btn" data-adm="' + (st.paused ? 'resume' : 'pause') + '" aria-pressed="' + st.paused + '">' + I.pause + (st.paused ? 'Durduruldu · Aç' : 'Siparişleri durdur') + '</button>' +
      '<button class="btn btn-sm btn-ghost" data-adm="stock">Ürünler' + (n ? ' <b class="stock-count num">' + n + ' tükendi</b>' : '') + '</button>';
  }

  function itemNames(ids) { return ids.map(function (id) { var it = App.pricing.findItem(id); return it ? it.name : id; }); }

  function statusAlert() {
    var st = App.storeStatus.get(), os = U.openState(cfg.hours);
    var out = '';
    if (st.paused) out += '<div class="adm-alert adm-alert--paused" role="status">' + I.pause + '<div><b>Sipariş alımı durduruldu.</b> Müşteriler sitede “Şu an sipariş alamıyoruz” uyarısı görüyor; yeni sipariş veremiyorlar. Gelen siparişler etkilenmez.</div><button class="btn btn-sm btn-primary" data-adm="resume">Siparişleri aç</button></div>';
    else if (!os.open) out += '<div class="adm-alert" role="status">' + I.clock + '<div><b>Çalışma saatleri dışındasınız.</b> Site şu an sipariş almıyor (ileri saatli dahil). ' + esc(os.detail) + '.</div></div>';
    if (st.soldOut.length) out += '<div class="adm-alert adm-alert--info">' + I.bag + '<div><b>' + st.soldOut.length + ' ürün tükendi olarak işaretli:</b> ' + esc(itemNames(st.soldOut).join(', ')) + '. Müşteriler bu ürünleri sepete ekleyemez.</div><button class="btn btn-sm btn-ghost" data-adm="stock">Düzenle</button></div>';
    return out;
  }

  function confirmPause() {
    var m = App.ui.openModal('<div class="confirm-box"><div class="blocked-ico">' + I.pause + '</div><h2 class="display-sm">Sipariş alımı durdurulsun mu?</h2>' +
      '<p class="muted">Sitede “Şu an sipariş alamıyoruz” uyarısı çıkar ve müşteriler sipariş veremez. Mevcut siparişler etkilenmez. Yoğunluk geçince <b>Siparişleri aç</b>’a basmayı unutmayın.</p>' +
      '<div class="confirm-actions"><button class="btn btn-ghost" data-action="modal-close">Vazgeç</button><button class="btn btn-danger" data-c="yes">' + I.pause + 'Siparişleri durdur</button></div></div>', { cls: 'modal--confirm', label: 'Siparişleri durdur' });
    m.addEventListener('click', function (e) {
      var b = e.target.closest('[data-c="yes"]'); if (!b) return;
      b.disabled = true;
      App.storeStatus.set({ paused: true }).then(function () { App.ui.closeModal(true); App.ui.toast('Sipariş alımı durduruldu'); }, function (x) { b.disabled = false; App.ui.toast(esc(x.message), { type: 'error' }); });
    });
  }

  function openStock() {
    var q = '';
    function list() {
      var so = App.storeStatus.get().soldOut, ql = q.toLocaleLowerCase('tr');
      var html = App.menu.categories.map(function (c) {
        var items = App.menu.items.filter(function (i) { return i.cat === c.id && (!ql || i.name.toLocaleLowerCase('tr').indexOf(ql) >= 0); });
        if (!items.length) return '';
        return '<section class="stock-cat"><h3>' + esc(c.label) + '</h3><ul>' + items.map(function (i) {
          var off = so.indexOf(i.id) >= 0;
          return '<li class="stock-row' + (off ? ' is-off' : '') + '"><span class="stock-thumb">' + App.illustrations.itemMedia(i) + '</span><span class="stock-name">' + esc(i.name) + '</span>' +
            '<label class="switch"><input type="checkbox" data-stock="' + i.id + '"' + (off ? '' : ' checked') + ' aria-label="' + esc(i.name) + ' satışta"><i></i><span class="switch-label">' + (off ? 'Tükendi' : 'Satışta') + '</span></label></li>';
        }).join('') + '</ul></section>';
      }).join('');
      return html || '<p class="muted">Ürün bulunamadı.</p>';
    }
    function head() {
      var n = App.storeStatus.get().soldOut.length;
      return '<p class="muted">Tükenen ürünün düğmesini kapatın; sitede “Tükendi” görünür ve sepete eklenemez. Değişiklik anında siteye yansır.</p>' +
        (n ? '<div class="stock-sum"><b class="num">' + n + '</b> ürün tükendi <button class="btn btn-sm btn-soft" data-s="all-on">Tümünü satışa aç</button></div>' : '');
    }
    var m = App.ui.openModal('<div class="stock"><h2 class="display-sm">Ürünler ve stok</h2><div id="stock-head">' + head() + '</div>' +
      '<label class="search search--sm"><span class="sr-only">Ürün ara</span>' + I.search + '<input id="stock-q" type="search" placeholder="Ürün ara…" autocomplete="off"></label>' +
      '<div class="stock-list" id="stock-list">' + list() + '</div></div>', { cls: 'modal--stock', label: 'Ürünler ve stok' });
    function repaint() { if (!m.isConnected) return; U.$('#stock-head', m).innerHTML = head(); var l = U.$('#stock-list', m), y = l.scrollTop; l.innerHTML = list(); l.scrollTop = y; }
    var unsub = App.storeStatus.subscribe(repaint);
    var obs = new MutationObserver(function () { if (!m.isConnected) { unsub(); obs.disconnect(); } });
    obs.observe(document.getElementById('modal-root'), { childList: true });
    m.addEventListener('input', U.debounce(function (e) { if (e.target.id === 'stock-q') { q = e.target.value.trim(); repaint(); } }, 120));
    m.addEventListener('change', function (e) {
      var id = e.target.getAttribute('data-stock'); if (!id) return;
      var on = e.target.checked;
      var so = App.storeStatus.get().soldOut.filter(function (x) { return x !== id; });
      if (!on) so.push(id);
      e.target.disabled = true;
      App.storeStatus.set({ soldOut: so }).then(function () {
        var it = App.pricing.findItem(id);
        App.ui.toast(esc(it ? it.name : id) + (on ? ' tekrar satışta' : ' tükendi olarak işaretlendi'));
      }, function (x) { App.ui.toast(esc(x.message), { type: 'error' }); repaint(); });
    });
    m.addEventListener('click', function (e) {
      var b = e.target.closest('[data-s="all-on"]'); if (!b) return;
      b.disabled = true;
      App.storeStatus.set({ soldOut: [] }).then(function () { App.ui.toast('Tüm ürünler satışta'); });
    });
  }

  var nextLabel = { yeni: 'Onayla, hazırlamaya başla', hazirlaniyor: 'Kuryeye teslim et', yolda: 'Teslim edildi' };

  function orderCard(o, st) {
    var a = o.address;
    var pay = o.payment.status === 'paid'
      ? '<span class="chip chip--ok">Ödendi · ' + esc(o.payment.brand ? o.payment.brand.toUpperCase() : 'Kart') + (o.payment.last4 ? ' •••• ' + esc(o.payment.last4) : '') + '</span>'
      : '<span class="chip chip--warn">' + esc(o.payment.methodLabel) + '</span>';
    var actions = '';
    if (st.confirmCancel === o.id) {
      actions = '<div class="ocard-confirm"><span>Sipariş iptal edilsin mi?</span><button class="btn btn-sm btn-danger" data-adm="cancel-yes" data-id="' + o.id + '">Evet, iptal et</button><button class="btn btn-sm btn-ghost" data-adm="cancel-no">Vazgeç</button></div>';
    } else if (core.NEXT[o.status]) {
      actions = '<div class="ocard-actions"><button class="btn btn-sm btn-primary" data-adm="advance" data-id="' + o.id + '">' + nextLabel[o.status] + '</button><button class="btn btn-sm btn-ghost" data-adm="cancel" data-id="' + o.id + '">İptal</button></div>';
    }
    var pAt = App.printer.printedAt(o);
    var tools = '<div class="ocard-tools">' +
      (pAt ? '<span class="chip chip--ok" title="Son baskı">' + PRN + 'Yazdırıldı ' + U.hhmm(pAt) + '</span>' : (o.status !== 'iptal' && o.status !== 'teslim' ? '<span class="chip chip--warn">' + PRN + 'Yazdırılmadı</span>' : '')) +
      '<span class="ocard-tools-btns"><button class="btn btn-sm btn-ghost" data-adm="receipt" data-id="' + o.id + '">Fiş</button>' +
      '<button class="btn btn-sm btn-soft" data-adm="print" data-id="' + o.id + '">' + PRN + (pAt ? 'Tekrar yazdır' : 'Yazdır') + '</button></span></div>';
    var sched = o.schedule && o.schedule.type === 'later' ? '<span class="chip chip--info">' + I.clock + ' ' + esc(o.schedule.time) + '</span>' : '';
    return '' +
      '<article class="ocard status-' + o.status + ' ' + ageClass(o) + (st.fresh[o.id] ? ' is-fresh' : '') + '" data-order-id="' + o.id + '">' +
      '  <header class="ocard-head"><div><b class="num">#' + esc(o.id) + '</b><span class="muted num"> · ' + U.hhmm(o.createdAt) + ' · ' + U.timeAgo(o.createdAt) + '</span></div><span class="status-tag st-' + o.status + '">' + esc(core.statusLabel(o.status).label) + '</span></header>' +
      '  <div class="ocard-cust"><b>' + esc(o.customer.name) + '</b><span class="selectable num">' + esc(U.formatPhone(o.customer.phone)) + '</span></div>' +
      '  <p class="ocard-addr">' + I.pin + '<span>' + esc(a.neighborhood) + ' Mah., ' + esc(a.street) + (a.apartment ? ', ' + esc(a.apartment) : '') + ' · <b>' + esc(a.zoneLabel) + '</b>' + (a.directions ? '<em> — ' + esc(a.directions) + '</em>' : '') + '</span></p>' +
      '  <ul class="ocard-lines">' + o.lines.map(function (l) { return '<li><b class="num">' + l.qty + '×</b><span>' + esc(l.name) + (l.portionLabel ? ' <em>' + esc(l.portionLabel) + '</em>' : '') + (l.note ? '<i>“' + esc(l.note) + '”</i>' : '') + '</span></li>'; }).join('') + '</ul>' +
      (o.note ? '<p class="ocard-note">' + esc(o.note) + '</p>' : '') +
      '  <div class="ocard-meta">' + pay + sched + (o.cutlery ? '<span class="chip">Çatal-bıçak</span>' : '') + '<b class="num ocard-total">' + money(o.total) + '</b></div>' +
      tools + actions +
      '</article>';
  }

  function board(orders, st) {
    var q = st.q.toLocaleLowerCase('tr');
    var list = orders.filter(function (o) {
      if (!q) return true;
      return (o.id + ' ' + o.customer.name + ' ' + o.customer.phone + ' ' + o.address.street).toLocaleLowerCase('tr').indexOf(q) >= 0;
    });
    if (st.tab === 'aktif') {
      var cols = [['yeni', 'Yeni'], ['hazirlaniyor', 'Hazırlanıyor'], ['yolda', 'Yolda']];
      return '<div class="kanban">' + cols.map(function (c) {
        var items = list.filter(function (o) { return o.status === c[0]; }).sort(function (a, b) { return new Date(a.createdAt) - new Date(b.createdAt); });
        return '<section class="kcol kcol-' + c[0] + '"><header><h3>' + c[1] + '</h3><span class="num kcount">' + items.length + '</span></header>' +
          (items.length ? items.map(function (o) { return orderCard(o, st); }).join('') : '<p class="kempty muted">Bu sütunda sipariş yok.</p>') + '</section>';
      }).join('') + '</div>';
    }
    var filtered = list.filter(function (o) { return st.tab === 'tumu' || o.status === st.tab; });
    if (!filtered.length) return '<div class="card-pad empty"><h3>Gösterilecek sipariş yok</h3><p class="muted">Filtreyi değiştirin veya demo sipariş oluşturun.</p></div>';
    return '<div class="ogrid">' + filtered.map(function (o) { return orderCard(o, st); }).join('') + '</div>';
  }

  function dashboard(orders, st) {
    var counts = { aktif: 0, tumu: orders.length, teslim: 0, iptal: 0 };
    orders.forEach(function (o) { if (['yeni', 'hazirlaniyor', 'yolda'].indexOf(o.status) >= 0) counts.aktif++; if (o.status === 'teslim') counts.teslim++; if (o.status === 'iptal') counts.iptal++; });
    var tabs = [['aktif', 'Aktif'], ['teslim', 'Teslim edilen'], ['iptal', 'İptal'], ['tumu', 'Tümü']].map(function (t) {
      return '<button class="tab' + (st.tab === t[0] ? ' is-active' : '') + '" data-adm="tab" data-tab="' + t[0] + '">' + t[1] + ' <span class="num">' + counts[t[0]] + '</span></button>';
    }).join('');
    return stats(orders) +
      '<div class="admin-toolbar"><div class="tabs" role="tablist">' + tabs + '</div>' +
      '<label class="search search--sm"><span class="sr-only">Siparişlerde ara</span>' + I.search + '<input id="adm-q" type="search" placeholder="No, isim, telefon…" value="' + esc(st.q) + '"></label></div>' +
      '<div id="adm-board">' + board(orders, st) + '</div>';
  }

  function shell() {
    var h = App.api.health || {};
    var mode = App.api.mode === 'remote'
      ? '<span class="mode-badge mode-live"><i></i>' + (h.demo ? 'Sunucu · geliştirme' : 'Canlı') + (h.provider === 'iyzico' && h.sandbox ? ' · iyzico TEST' : '') + '</span>'
      : '<span class="mode-badge"><i></i>Demo modu · tarayıcı</span>';
    var sound = U.storage.get(SOUND_KEY, false);
    return '' +
      '<div class="admin">' +
      '  <header class="admin-bar">' +
      '    <div class="admin-bar-inner">' +
      '      <a href="#anasayfa" class="brand"><img class="brand-logo" src="assets/img/logo-horizontal.svg" alt="' + esc(cfg.restaurant.name) + '" width="200" height="45"><span class="panel-tag">Panel</span></a>' +
      mode +
      '      <div class="admin-actions">' +
      '        <span id="app-slot" class="admin-actions">' + appBtns() + '</span>' +
      '        <span id="ctl-slot" class="admin-actions">' + controlBtns() + '</span>' +
      '        <span id="prn-slot">' + printerBtn() + '</span>' +
      '        <button class="btn btn-sm btn-ghost" data-adm="sound" aria-pressed="' + sound + '" id="sound-btn">' + (sound ? 'Ses açık' : 'Sesi aç') + '</button>' +
      (App.api.mode !== 'remote' || App.api.health.demo ? '        <button class="btn btn-sm btn-soft" data-adm="demo">' + I.plus + 'Demo sipariş</button>' : '') +
      '        <button class="btn btn-sm btn-ghost" data-adm="logout">Çıkış</button>' +
      '      </div>' +
      '    </div>' +
      '  </header>' +
      '  <main class="admin-main"><div class="admin-head"><div><h1 class="display-sm">Siparişler</h1><p class="muted"><span class="live-dot"></span>Yeni siparişler sayfa yenilenmeden burada belirir. <span class="num" id="adm-clock"></span></p></div></div>' +
      '  <div id="adm-alert">' + statusAlert() + '</div>' +
      '  <div id="adm-dash"><div class="card-pad center muted"><span class="spinner"></span> Siparişler yükleniyor…</div></div></main>' +
      '</div>';
  }

  // ---------------- Sayfa ----------------
  App.router.register('admin', {
    title: 'Sipariş Paneli',
    render: function () { return '<div id="admin-root"></div>'; },
    mount: function (root) {
      var box = U.$('#admin-root', root);
      var cleanup = [];
      var st = { tab: 'aktif', q: '', confirmCancel: null, fresh: {}, orders: [], known: null };
      var alive = true;

      function showLogin() {
        box.innerHTML = loginView();
        App.api.ready.then(function (m) { var h = U.$('#pin-hint', box); if (h && m === 'local') h.textContent = 'Demo PIN: ' + cfg.admin.pin; });
        U.$('#admin-login', box).addEventListener('submit', function (e) {
          e.preventDefault();
          var err = U.$('#admin-err', box);
          App.adminAuth.login(U.$('#admin-pin', box).value.trim()).then(showDash, function (x) { err.textContent = x.message; err.hidden = false; U.$('#admin-pin', box).select(); });
        });
      }

      function paint() {
        var dash = U.$('#adm-dash', box);
        if (!dash) return;
        var focused = document.activeElement && document.activeElement.id === 'adm-q';
        dash.innerHTML = dashboard(st.orders, st);
        if (focused) { var q = U.$('#adm-q', box); q.focus(); q.setSelectionRange(q.value.length, q.value.length); }
        var waiting = st.orders.filter(function (o) { return o.status === 'yeni'; }).length;
        document.title = (waiting ? '(' + waiting + ') ' : '') + 'Sipariş Paneli · ' + cfg.restaurant.name;
        U.$('#adm-clock', box).textContent = '· Son güncelleme ' + U.hhmm(new Date());
      }

      function load(fromEvent) {
        return App.orders.list().then(function (orders) {
          if (!alive) return;
          var ids = {};
          orders.forEach(function (o) { ids[o.id] = true; });
          if (st.known) {
            var fresh = orders.filter(function (o) { return !st.known[o.id]; });
            if (fresh.length) {
              fresh.forEach(function (o) { st.fresh[o.id] = true; setTimeout(function () { delete st.fresh[o.id]; }, 8000); });
              if (U.storage.get(SOUND_KEY, false)) ding();
              App.ui.toast('<b>Yeni sipariş!</b> #' + esc(fresh[0].id) + ' · ' + esc(fresh[0].customer.name) + ' · ' + money(fresh[0].total), { ms: 5000 });
              if (st.tab !== 'aktif' && st.tab !== 'tumu') st.tab = 'aktif';
              if (App.notify) fresh.forEach(function (o) { App.notify.order(o); });
              if (App.printer.settings().autoPrint) fresh.slice().reverse().forEach(function (o) { if (!App.printer.printedAt(o)) doPrint(o, true); });
            }
          }
          st.known = ids;
          st.orders = orders;
          paint();
        }).catch(function (e) {
          if (e.status === 401) { App.adminAuth.logout(); showLogin(); return; }
          if (!fromEvent) U.$('#adm-dash', box).innerHTML = '<div class="notice notice--error">' + esc(e.message) + '</div>';
        });
      }

      function refreshControls() {
        var c = U.$('#ctl-slot', box); if (c) c.innerHTML = controlBtns();
        var al = U.$('#adm-alert', box); if (al) al.innerHTML = statusAlert();
      }

      function refreshPrinterBtn() { var s = U.$('#prn-slot', box); if (s) s.innerHTML = printerBtn(); }

      function findOrder(id) { return st.orders.filter(function (x) { return x.id === id; })[0]; }

      function doPrint(o, auto) {
        return App.printer.print(o, { auto: auto }).then(function () {
          App.ui.toast((auto ? 'Otomatik yazdırıldı: ' : 'Yazdırıldı: ') + '#' + esc(o.id));
          paint();
        }, function (err) {
          App.ui.toast('<b>Fiş yazdırılamadı.</b> ' + esc(err.message), { type: 'error', ms: 6000 });
        });
      }

      function openReceipt(o) {
        var paper = App.printer.settings().paper;
        function body() {
          return '<div class="rcp"><div class="rcp-head"><h2 class="display-sm">Adisyon #' + esc(o.id) + '</h2>' +
            '<div class="seg-mini" role="group" aria-label="Kağıt genişliği"><button data-r="58" class="' + (paper === 58 ? 'is-on' : '') + '">58 mm</button><button data-r="80" class="' + (paper === 80 ? 'is-on' : '') + '">80 mm</button></div></div>' +
            '<div class="rcp-paper">' + App.printer.preview(o, paper) + '</div>' +
            '<div class="rcp-foot"><button class="btn btn-ghost" data-action="modal-close">Kapat</button><button class="btn btn-primary" data-r="print">' + PRN + 'Yazdır</button></div></div>';
        }
        var m = App.ui.openModal(body(), { cls: 'modal--receipt', label: 'Adisyon önizleme' });
        m.addEventListener('click', function (e) {
          var b = e.target.closest('[data-r]'); if (!b) return;
          var v = b.getAttribute('data-r');
          if (v === 'print') { App.ui.closeModal(true); doPrint(o, false); return; }
          paper = Number(v); m.querySelector('.rcp').outerHTML = body();
        });
      }

      function openPrinterSettings() {
        var info = null;
        function render() {
          var s = App.printer.settings(), sup = App.printer.support(), stt = App.printer.status();
          var drivers = DRIVERS.map(function (d) {
            var ok = sup[d.id];
            var why = !ok ? (d.id === 'network' ? 'Sunucu modunda çalışır (server/server.js).' : 'Bu tarayıcı desteklemiyor; Chrome veya Edge kullanın.') : '';
            return '<label class="pay-opt' + (ok ? '' : ' is-disabled') + '"><input type="radio" name="drv" value="' + d.id + '"' + (s.driver === d.id ? ' checked' : '') + (ok ? '' : ' disabled') + '>' +
              '<span class="pay-opt-body"><b>' + d.label + '</b><span class="muted">' + (why || d.hint) + '</span></span><span class="pay-opt-radio"></span></label>';
          }).join('');
          var net = '';
          if (s.driver === 'network') {
            net = info ? (info.configured
              ? '<div class="notice notice--ok">' + PRN + '<span>Sunucu yazıcısı: <b class="num">' + esc(info.host + ':' + info.port) + '</b> · ' + info.paper + ' mm' + (info.auto ? ' · sipariş gelince sunucu otomatik basar' : '') + '</span></div>'
              : '<div class="notice notice--warn">' + PRN + '<span>Sunucuda yazıcı adresi tanımlı değil. Sunucuyu <code>PRINTER_HOST=192.168.1.50 node server/server.js</code> şeklinde başlatın.</span></div>')
              : '<p class="muted text-sm">Sunucu yazıcı bilgisi alınıyor…</p>';
          }
          var raw = s.driver === 'usb' || s.driver === 'serial' || s.driver === 'network';
          return '<div class="pset">' +
            '<h2 class="display-sm">Adisyon yazıcısı</h2>' +
            '<p class="pset-status"><i class="prn-dot ' + (stt.connected ? 'on' : 'off') + '"></i>' + esc(stt.label) + '</p>' +
            '<fieldset class="pset-group"><legend>Bağlantı yöntemi</legend><div class="pset-drivers">' + drivers + '</div></fieldset>' + net +
            '<div class="pset-row">' +
            '<label class="field"><span class="field-label">Kağıt genişliği</span><select class="select" id="ps-paper"><option value="80"' + (s.paper === 80 ? ' selected' : '') + '>80 mm (48 karakter)</option><option value="58"' + (s.paper === 58 ? ' selected' : '') + '>58 mm (32 karakter)</option></select></label>' +
            '<label class="field"><span class="field-label">Nüsha sayısı</span><select class="select" id="ps-copies">' + [1, 2, 3].map(function (n) { return '<option value="' + n + '"' + (s.copies === n ? ' selected' : '') + '>' + n + (n === 2 ? ' (mutfak + kurye)' : n === 3 ? ' (mutfak + kurye + kasa)' : '') + '</option>'; }).join('') + '</select></label>' +
            (raw ? '<label class="field"><span class="field-label">Karakter seti</span><select class="select" id="ps-charset"><option value="cp857"' + (s.charset === 'cp857' ? ' selected' : '') + '>Türkçe (CP857)</option><option value="ascii"' + (s.charset === 'ascii' ? ' selected' : '') + '>Türkçe karaktersiz</option></select></label>' : '') +
            (s.driver === 'serial' ? '<label class="field"><span class="field-label">Baud hızı</span><select class="select" id="ps-baud">' + [9600, 19200, 38400, 115200].map(function (n) { return '<option' + (s.baud === n ? ' selected' : '') + '>' + n + '</option>'; }).join('') + '</select></label>' : '') +
            '</div>' +
            '<label class="check"><input type="checkbox" id="ps-auto"' + (s.autoPrint ? ' checked' : '') + '><span><b>Yeni sipariş gelince otomatik yazdır.</b> Panel bu bilgisayarda açık kalmalıdır.' + (s.driver === 'browser' ? ' Yazdırma penceresinin çıkmaması için README’deki “sessiz yazdırma” ayarını yapın.' : '') + '</span></label>' +
            '<p class="field-error" id="ps-err" hidden></p>' +
            '<div class="pset-actions">' +
            (s.driver === 'usb' || s.driver === 'serial' ? '<button class="btn btn-soft" data-p="connect">' + (stt.connected ? 'Başka yazıcı seç' : 'Yazıcıya bağlan') + '</button>' : '') +
            '<button class="btn btn-ghost" data-p="preview">Örnek fişi gör</button>' +
            '<button class="btn btn-primary" data-p="test">' + PRN + 'Test fişi yazdır</button></div>' +
            '</div>';
        }
        var m = App.ui.openModal(render(), { cls: 'modal--printer', label: 'Yazıcı ayarları' });
        function rerender() { if (!m.isConnected) return; var y = m.scrollTop; m.querySelector('.pset').outerHTML = render(); m.scrollTop = y; }
        function err(msg) { var e = U.$('#ps-err', m); if (!e) return; e.textContent = msg || ''; e.hidden = !msg; }
        function loadInfo() { if (App.printer.settings().driver === 'network') App.printer.serverInfo().then(function (i) { info = i || { configured: false }; rerender(); }); }
        loadInfo();
        m.addEventListener('change', function (e) {
          var t = e.target;
          if (t.name === 'drv') { App.printer.save({ driver: t.value }); rerender(); App.printer.restore().then(rerender); loadInfo(); }
          if (t.id === 'ps-paper') App.printer.save({ paper: Number(t.value) });
          if (t.id === 'ps-copies') App.printer.save({ copies: Number(t.value) });
          if (t.id === 'ps-charset') App.printer.save({ charset: t.value });
          if (t.id === 'ps-baud') App.printer.save({ baud: Number(t.value) });
          if (t.id === 'ps-auto') App.printer.save({ autoPrint: t.checked });
        });
        m.addEventListener('click', function (e) {
          var b = e.target.closest('[data-p]'); if (!b) return;
          var a = b.getAttribute('data-p'); err('');
          if (a === 'connect') App.printer.connect().then(function (label) { App.ui.toast('Bağlandı: ' + esc(label)); rerender(); }, function (x) { if (x.name !== 'NotFoundError') err(x.message); });
          if (a === 'test') { b.disabled = true; App.printer.test().then(function () { App.ui.toast('Test fişi gönderildi'); }, function (x) { err(x.message); }).then(function () { b.disabled = false; }); }
          if (a === 'preview') { App.ui.closeModal(true); openReceipt(App.printer.sampleOrder()); }
        });
      }

      function showDash() {
        box.innerHTML = shell();
        ensureReceiptCss();
        load();
        App.printer.restore().then(refreshPrinterBtn);
        cleanup.push(App.printer.onChange(refreshPrinterBtn));
        var onPwa = function () { var s = U.$('#app-slot', box); if (s) s.innerHTML = appBtns(); };
        document.addEventListener('pwa-change', onPwa);
        cleanup.push(function () { document.removeEventListener('pwa-change', onPwa); });
        cleanup.push(App.orders.subscribe(function (evt) { if (!evt || evt.type !== 'status') load(true); }));
        cleanup.push(App.storeStatus.subscribe(refreshControls));
        var tick = setInterval(function () { paint(); }, 30000);
        var poll = setInterval(function () { load(true); }, 20000); // güvenlik ağı
        cleanup.push(function () { clearInterval(tick); clearInterval(poll); });
      }

      function onClick(e) {
        var b = e.target.closest('[data-adm]');
        if (!b) return;
        var a = b.getAttribute('data-adm'), id = b.getAttribute('data-id');
        if (a === 'tab') { st.tab = b.getAttribute('data-tab'); st.confirmCancel = null; paint(); }
        if (a === 'advance') {
          var o = st.orders.filter(function (x) { return x.id === id; })[0];
          if (!o) return;
          b.disabled = true;
          App.orders.updateStatus(id, core.NEXT[o.status]).then(function () { return load(true); }).catch(function (err) { App.ui.toast(esc(err.message), { type: 'error' }); b.disabled = false; });
        }
        if (a === 'printer') openPrinterSettings();
        if (a === 'pause') confirmPause();
        if (a === 'resume') { b.disabled = true; App.storeStatus.set({ paused: false }).then(function () { App.ui.toast('Siparişler tekrar açık'); }, function (x) { b.disabled = false; App.ui.toast(esc(x.message), { type: 'error' }); }); }
        if (a === 'stock') openStock();
        if (a === 'install') App.pwa.install();
        if (a === 'notify') {
          if (App.notify.enabled()) { App.notify.disable(); U.$('#app-slot', box).innerHTML = appBtns(); }
          else App.notify.enable().then(function () { U.$('#app-slot', box).innerHTML = appBtns(); App.ui.toast('Bildirimler açık. Panel arka plandayken yeni siparişler bildirim olarak gelir.'); }, function (x) { App.ui.toast(esc(x.message), { type: 'error', ms: 6000 }); });
        }
        if (a === 'print') { var po = findOrder(id); if (po) { b.disabled = true; doPrint(po, false).then(function () { b.disabled = false; }); } }
        if (a === 'receipt') { var ro = findOrder(id); if (ro) openReceipt(ro); }
        if (a === 'cancel') { st.confirmCancel = id; paint(); }
        if (a === 'cancel-no') { st.confirmCancel = null; paint(); }
        if (a === 'cancel-yes') { st.confirmCancel = null; App.orders.updateStatus(id, 'iptal').then(function () { App.ui.toast('#' + esc(id) + ' iptal edildi'); return load(true); }); }
        if (a === 'demo') {
          b.disabled = true;
          App.orders.create(demoOrder(), { silent: true }).catch(function (err) { App.ui.toast(esc(err.message), { type: 'error' }); }).then(function () { b.disabled = false; });
        }
        if (a === 'sound') {
          var on = !U.storage.get(SOUND_KEY, false);
          U.storage.set(SOUND_KEY, on);
          b.textContent = on ? 'Ses açık' : 'Sesi aç'; b.setAttribute('aria-pressed', String(on));
          if (on) ding();
        }
        if (a === 'logout') { cleanup.forEach(function (f) { f(); }); cleanup = []; App.adminAuth.logout(); st.known = null; showLogin(); }
      }
      var onInput = U.debounce(function (e) { if (e.target.id === 'adm-q') { st.q = e.target.value.trim(); U.$('#adm-board', box).innerHTML = board(st.orders, st); } }, 150);

      box.addEventListener('click', onClick);
      box.addEventListener('input', onInput);
      if (App.adminAuth.pin()) App.api.ready.then(showDash); else showLogin();

      return function () { alive = false; cleanup.forEach(function (f) { f(); }); box.removeEventListener('click', onClick); box.removeEventListener('input', onInput); };
    },
  });
})(window.App = window.App || {});
