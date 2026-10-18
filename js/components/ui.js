/* Ortak arayüz bileşenleri: başlık, alt bilgi, sepet çekmecesi, modal, bildirim, ürün kartı */
(function (App) {
  var U = App.utils, esc = U.esc, money = U.money, cfg = App.config, R = cfg.restaurant;

  // ---------------- İkonlar ----------------
  var I = {
    flame: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2c1.2 3.2-.6 4.9-2 6.6C8.6 10.3 7 12 7 14.6A5 5 0 0 0 12 20a5 5 0 0 0 5-5.2c0-2-1-3.5-2-4.6.1 1.6-.5 2.7-1.6 3.1.6-3.3-.2-7.3-1.4-11.3Z" fill="currentColor"/></svg>',
    bag: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 8h12l-1 12H7L6 8Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
    menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
    minus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
    trash: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    clock: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 7.5V12l3 2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11Z" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="10" r="2.3" fill="currentColor"/></svg>',
    phone: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3.5h3l1.5 4-2 1.3a10 10 0 0 0 5.7 5.7l1.3-2 4 1.5v3A2 2 0 0 1 18.5 19 15.5 15.5 0 0 1 5 5.5 2 2 0 0 1 7 3.5Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    scooter: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="6" cy="17" r="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="18" cy="17" r="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8.5 17h6.5l2-6h-4M15 6h2.5l1.5 5M4 12h6v3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.2 4L19 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" fill="currentColor"/></svg>',
    lock: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="9.5" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
    search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m16 16 4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-5-5 5 5-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    chili: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6c-1 5-4 10-10 13 7 1 13-3 14-9 .2-1.6-.6-3.3-2-4" fill="currentColor"/><path d="M15 6c0-1.5 1-2.5 2.5-3" stroke="#6FAF4A" stroke-width="2" fill="none" stroke-linecap="round"/></svg>',
    leaf: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19C5 10 10 5 20 4c-1 10-6 15-15 15Z" fill="currentColor"/><path d="M5 19 13 11" stroke="#120D0A" stroke-width="1.6"/></svg>',
    cap: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 14a4 4 0 0 1-.8-7.9A5 5 0 0 1 15.8 5 4 4 0 0 1 17 13v1H7Z" fill="currentColor"/><rect x="7.5" y="15.5" width="9" height="4" rx="1" fill="currentColor"/></svg>',
  };

  var tagIcon = { acili: I.chili, vejetaryen: I.leaf, sef: I.cap, yeni: '' };

  function tagBadges(item, max) {
    return (item.tags || []).slice(0, max || 3).map(function (t) {
      var info = App.menu.tags[t];
      return info ? '<span class="tag tag--' + t + '">' + (tagIcon[t] || '') + esc(info.label) + '</span>' : '';
    }).join('');
  }

  // ---------------- Başlık ----------------
  function header() {
    var st = U.openState(cfg.hours);
    var links = [['anasayfa', 'Ana Sayfa', 'home'], ['menu', 'Menü', 'menu'], ['iletisim', 'Hakkımızda & İletişim', 'iletisim']];
    var nav = links.map(function (l) { return '<a href="#' + l[0] + '" data-nav="' + l[2] + '">' + l[1] + '</a>'; }).join('');
    return '' +
      '<div class="container header-inner">' +
      '  <a href="#anasayfa" class="brand" aria-label="' + esc(R.name) + ' ana sayfa">' + '<img class="brand-logo" src="assets/img/logo-horizontal.svg" alt="' + esc(R.name) + '" width="200" height="45">' + '</a>' +
      '  <nav class="nav-desktop" aria-label="Ana menü">' + nav + '</nav>' +
      '  <div class="header-actions">' +
      '    <span class="status-pill ' + (st.open ? 'is-open' : 'is-closed') + '" title="' + esc(st.detail) + '"><i></i>' + st.label + '<span class="hide-sm"> · ' + esc(st.detail) + '</span></span>' +
      '    <button class="btn-cart" data-action="cart-open" aria-label="Sepeti aç">' + I.bag + '<span class="hide-sm">Sepet</span><b class="cart-badge" data-cart-count hidden>0</b></button>' +
      '    <button class="btn-icon nav-toggle" data-action="nav-toggle" aria-label="Menüyü aç" aria-expanded="false">' + I.menu + '</button>' +
      '  </div>' +
      '</div>' +
      '<nav class="nav-mobile" id="nav-mobile" hidden aria-label="Mobil menü"><div class="container">' + nav +
      '<a href="#sepet" data-nav="sepet">Sepetim</a></div></nav>';
  }

  function footer() {
    var hours = hoursRows(true);
    return '' +
      '<div class="container footer-grid">' +
      '  <div class="footer-brand"><a href="#anasayfa" class="brand brand--footer"><img class="brand-logo-full" src="assets/img/logo-full.svg" alt="' + esc(R.name) + ' — ' + esc(R.tagline) + '" width="220" height="151"></a>' +
      '    <p>' + esc(R.tagline) + '. ' + (R.founded ? R.founded + '’den beri ' : '') + esc(R.district) + '’de ' + (U.hoursSummary(cfg.hours) ? 'her gün ' + cfg.hours[0].open + ' – ' + cfg.hours[0].close + ' arası' : '') + ' paket servis.</p></div>' +
      '  <div><h4>Sayfalar</h4><ul class="footer-links"><li><a href="#menu">Menü</a></li><li><a href="#sepet">Sepetim</a></li><li><a href="#iletisim">Hakkımızda & İletişim</a></li></ul></div>' +
      '  <div><h4>İletişim</h4><ul class="footer-links"><li class="selectable">' + esc(R.phone) + '</li>' + (R.email ? '<li class="selectable">' + esc(R.email) + '</li>' : '') + '<li>' + esc(R.address) + '</li></ul></div>' +
      '  <div><h4>Çalışma Saatleri</h4><ul class="hours-mini">' + hours + '</ul></div>' +
      '</div>' +
      '<div class="container footer-bottom"><span>© ' + new Date().getFullYear() + ' ' + esc(R.name) + '</span><span>Mesafeli satış sözleşmesi · KVKK aydınlatma metni</span></div>';
  }

  /** Çalışma saatleri satırları. Tüm günler aynıysa tek satır gösterir. */
  function hoursRows(mini) {
    var today = new Date().getDay();
    var sum = U.hoursSummary(cfg.hours);
    if (sum) {
      var h = cfg.hours[0];
      return '<li' + (mini ? '' : ' class="is-today"') + '><span>Her gün' + (mini ? '' : ' <em>bugün dahil</em>') + '</span><span class="num">' + (h.open ? h.open + ' – ' + h.close : 'Kapalı') + '</span></li>' +
        (mini || !h.open || U.toMin(h.close) > U.toMin(h.open) ? '' : '<li class="hours-note"><span>Gece yarısından sonra da sipariş alıyoruz.</span></li>');
    }
    return [1, 2, 3, 4, 5, 6, 0].map(function (d) {
      var x = cfg.hours[d];
      var cls = !mini && d === today ? ' class="is-today"' : '';
      return '<li' + cls + '><span>' + x.label + (!mini && d === today ? ' <em>bugün</em>' : '') + '</span><span class="num">' + (x.open ? x.open + ' – ' + x.close : 'Kapalı') + '</span></li>';
    }).join('');
  }

  /** Saat kartı: tüm günler aynıysa büyük saat + 24 saatlik çubuk; değilse gün gün liste */
  function hoursBlock() {
    var sum = U.hoursSummary(cfg.hours), h = cfg.hours[0];
    if (!sum || !h.open) return '<ul class="hours-list">' + hoursRows() + '</ul>';
    var o = U.toMin(h.open), c = U.toMin(h.close);
    if (c <= o) c += 1440;
    var base = 360; // çubuk 06:00'da başlar
    var left = ((o - base + 1440) % 1440) / 14.4, width = (c - o) / 14.4;
    var now = new Date(), nm = now.getHours() * 60 + now.getMinutes();
    var nowPos = ((nm - base + 1440) % 1440) / 14.4;
    var overnight = U.toMin(h.close) < U.toMin(h.open);
    return '' +
      '<div class="hours-big"><span class="eyebrow">Her gün · hafta sonu dahil</span>' +
      '<div class="hours-big-time num"><b>' + h.open + '</b><i aria-hidden="true">→</i><b>' + h.close + '</b></div></div>' +
      '<div class="day-bar" role="img" aria-label="Açık saatler: ' + h.open + ' ile ' + h.close + ' arası">' +
      '<span class="day-bar-seg" style="left:' + left.toFixed(2) + '%;width:' + Math.min(100 - left, width).toFixed(2) + '%"></span>' +
      (left + width > 100 ? '<span class="day-bar-seg" style="left:0;width:' + (left + width - 100).toFixed(2) + '%"></span>' : '') +
      '<span class="day-bar-now" style="left:' + nowPos.toFixed(2) + '%"><em>Şimdi</em></span></div>' +
      '<div class="day-bar-scale num"><span>06</span><span>12</span><span>18</span><span>00</span><span>06</span></div>' +
      (overnight ? '<p class="muted text-sm">Gece yarısından sonra da sipariş alıyoruz; son sipariş ' + h.close + '’e kadar.</p>' : '');
  }

  // ---------------- Ürün kartı ----------------
  function productCard(item, opts) {
    opts = opts || {};
    var priceTxt = item.portions ? '<small>başlayan</small>' + money(App.pricing.fromPrice(item), true) : money(item.price, true);
    var inCart = App.store.getState().cart.filter(function (l) { return l.id === item.id; }).reduce(function (n, l) { return n + l.qty; }, 0);
    return '' +
      '<article class="dish' + (opts.feature ? ' dish--feature' : '') + '" data-item="' + item.id + '">' +
      '  <button class="dish-media" data-action="open-item" data-id="' + item.id + '" aria-label="' + esc(item.name) + ' detayları">' +
           App.illustrations.itemMedia(item) +
      '    <span class="dish-tags">' + tagBadges(item, 1) + '</span>' +
      '  </button>' +
      '  <div class="dish-body">' +
      '    <h3 class="dish-name">' + esc(item.name) + '</h3>' +
      '    <p class="dish-desc">' + esc(item.desc) + '</p>' +
      '    <div class="dish-foot">' +
      '      <span class="dish-price">' + priceTxt + (item.grams ? '<em>' + esc(item.grams) + '</em>' : '') + '</span>' +
      '      <button class="btn btn-add" data-action="add" data-id="' + item.id + '" aria-label="' + esc(item.name) + ' sepete ekle">' + I.plus + '<span>Sepete Ekle</span>' +
      '        <b class="in-cart" ' + (inCart ? '' : 'hidden') + '>' + inCart + '</b></button>' +
      '    </div>' +
      '  </div>' +
      '</article>';
  }

  function refreshCardBadges(root) {
    var counts = {};
    App.store.getState().cart.forEach(function (l) { counts[l.id] = (counts[l.id] || 0) + l.qty; });
    U.$$('[data-item]', root).forEach(function (card) {
      var b = card.querySelector('.in-cart');
      if (!b) return;
      var n = counts[card.getAttribute('data-item')] || 0;
      b.hidden = !n; b.textContent = n;
    });
  }

  function stepper(key, qty, small) {
    return '<div class="stepper' + (small ? ' stepper--sm' : '') + '" role="group" aria-label="Adet">' +
      '<button data-action="cart-dec" data-key="' + esc(key) + '" aria-label="Azalt">' + (qty <= 1 ? I.trash : I.minus) + '</button>' +
      '<output class="num">' + qty + '</output>' +
      '<button data-action="cart-inc" data-key="' + esc(key) + '" aria-label="Artır">' + I.plus + '</button></div>';
  }

  // ---------------- Sepet satırı ----------------
  function cartLine(line, compact) {
    var item = App.pricing.findItem(line.id);
    if (!item) return '';
    var unit = App.pricing.unitPrice(item, line.portion);
    var portionSel = item.portions ? '<label class="sr-only" for="portion-' + esc(line.key) + '">' + esc(item.optionLabel || 'Seçenek') + '</label><select class="select select--sm" id="portion-' + esc(line.key) + '" data-action="cart-portion" data-key="' + esc(line.key) + '">' +
      item.portions.map(function (p) { return '<option value="' + p.id + '"' + (p.id === line.portion ? ' selected' : '') + '>' + esc(p.label) + ' · ' + money(p.price, true) + '</option>'; }).join('') + '</select>' : '';
    return '' +
      '<li class="cart-line' + (compact ? ' cart-line--compact' : '') + '">' +
      '  <div class="cart-thumb">' + App.illustrations.itemMedia(item, { portion: line.portion }) + '</div>' +
      '  <div class="cart-info">' +
      '    <div class="cart-row"><strong>' + esc(item.name) + '</strong><span class="num cart-total">' + money(unit * line.qty) + '</span></div>' +
      (portionSel ? '<div class="cart-portion">' + portionSel + '</div>' : '<div class="muted text-sm num">' + money(unit) + ' / adet</div>') +
      (line.note ? '<div class="cart-note">“' + esc(line.note) + '”</div>' : '') +
      '    <div class="cart-row cart-actions">' + stepper(line.key, line.qty, true) +
      '      <button class="link-btn" data-action="cart-remove" data-key="' + esc(line.key) + '">Kaldır</button></div>' +
      '  </div>' +
      '</li>';
  }

  function freeDeliveryBar(s) {
    var d = cfg.delivery;
    var pct = Math.min(100, Math.round((s.subtotal / d.freeOver) * 100));
    var msg = s.freeDeliveryLeft > 0
      ? 'Ücretsiz teslimata <b class="num">' + money(s.freeDeliveryLeft) + '</b> kaldı'
      : '<b>Teslimat ücretsiz</b> — ' + money(d.freeOver, true) + ' üzeri siparişlerde';
    return '<div class="free-bar"><div class="free-bar-text">' + I.scooter + '<span>' + msg + '</span></div><div class="free-bar-track"><i style="width:' + pct + '%"></i></div></div>';
  }

  // ---------------- Sepet çekmecesi ----------------
  function renderDrawer() {
    var el = document.getElementById('cart-drawer');
    var s = App.cart.summary();
    var lines = App.store.getState().cart;
    var open = App.store.getState().ui.cartOpen;
    el.setAttribute('aria-hidden', open ? 'false' : 'true');
    el.classList.toggle('is-open', open);
    var body = lines.length
      ? '<ul class="cart-list">' + lines.map(function (l) { return cartLine(l, true); }).join('') + '</ul>'
      : emptyCart();
    el.innerHTML = '' +
      '<div class="drawer-backdrop" data-action="cart-close"></div>' +
      '<aside class="drawer" role="dialog" aria-modal="true" aria-label="Sepetiniz">' +
      '  <header class="drawer-head"><h2>Sepetiniz <span class="muted num">(' + s.itemCount + ')</span></h2><button class="btn-icon" data-action="cart-close" aria-label="Kapat">' + I.close + '</button></header>' +
      (lines.length ? freeDeliveryBar(s) : '') +
      '  <div class="drawer-body">' + body + '</div>' +
      (lines.length ? '' +
      '  <footer class="drawer-foot">' +
      '    <dl class="sum"><div><dt>Ara toplam</dt><dd class="num">' + money(s.subtotal) + '</dd></div>' +
      '    <div><dt>Teslimat</dt><dd class="num">' + (s.deliveryFee ? money(s.deliveryFee) : 'Ücretsiz') + '</dd></div>' +
      '    <div class="sum-total"><dt>Toplam</dt><dd class="num">' + money(s.total) + '</dd></div></dl>' +
      (!s.meetsMinimum ? '<p class="warn-line">Minimum sipariş ' + money(cfg.delivery.minOrder, true) + '. <b class="num">' + money(s.minOrderLeft) + '</b> daha ekleyin.</p>' : '') +
      '    <div class="drawer-cta"><a href="#sepet" class="btn btn-ghost" data-action="cart-close-nav">Sepete git</a>' +
      '    <a href="#odeme" class="btn btn-primary' + (s.meetsMinimum ? '' : ' is-disabled') + '" data-action="cart-close-nav" ' + (s.meetsMinimum ? '' : 'aria-disabled="true"') + '>Ödemeye geç ' + I.arrow + '</a></div>' +
      '  </footer>' : '') +
      '</aside>';
  }

  function emptyCart() {
    return '<div class="empty"><div class="empty-art">' + App.illustrations.itemMedia(App.pricing.findItem('p-margarita'), { bare: true, art: true }) + '</div><h3>Sepetiniz boş</h3><p class="muted">Fırından ne çıksın? Menüden seçin, kapınıza getirelim.</p><a href="#menu" class="btn btn-primary" data-action="cart-close-nav">Menüye göz at</a></div>';
  }

  function renderCartBadge() {
    var n = App.cart.count();
    U.$$('[data-cart-count]').forEach(function (b) { b.hidden = !n; b.textContent = n; });
  }

  function renderMobileBar() {
    var el = document.getElementById('mobile-cartbar');
    var route = document.body.getAttribute('data-route');
    var n = App.cart.count();
    var hide = !n || route === 'sepet' || route === 'odeme' || route === 'admin' || route === 'siparis';
    el.hidden = hide;
    if (hide) return;
    var s = App.cart.summary();
    el.innerHTML = '<button class="mobile-cartbar-btn" data-action="cart-open"><span class="mcb-count num">' + n + '</span><span>Sepeti görüntüle</span><span class="num">' + money(s.total) + '</span></button>';
  }

  function bumpBadge() {
    U.$$('.btn-cart, .mobile-cartbar-btn').forEach(function (b) {
      b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump');
    });
  }

  // ---------------- Bildirim (toast) ----------------
  function toast(msg, opts) {
    opts = opts || {};
    var root = document.getElementById('toasts');
    var t = document.createElement('div');
    t.className = 'toast toast--' + (opts.type || 'ok');
    t.setAttribute('role', 'status');
    t.innerHTML = '<span class="toast-ico">' + (opts.type === 'error' ? '!' : I.check) + '</span><span class="toast-msg">' + msg + '</span>' +
      (opts.action ? '<a class="toast-action" href="' + opts.action.href + '">' + esc(opts.action.label) + '</a>' : '');
    root.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('in'); });
    setTimeout(function () { t.classList.remove('in'); setTimeout(function () { t.remove(); }, 300); }, opts.ms || 2800);
  }

  // ---------------- Modal ----------------
  var modalState = null;
  function openModal(html, opts) {
    opts = opts || {};
    closeModal(true);
    var root = document.getElementById('modal-root');
    var lastFocus = document.activeElement;
    root.innerHTML = '<div class="modal-backdrop" ' + (opts.locked ? '' : 'data-action="modal-close"') + '></div>' +
      '<div class="modal ' + (opts.cls || '') + '" role="dialog" aria-modal="true" aria-label="' + esc(opts.label || '') + '">' +
      (opts.locked ? '' : '<button class="btn-icon modal-x" data-action="modal-close" aria-label="Kapat">' + I.close + '</button>') + html + '</div>';
    root.hidden = false;
    document.body.classList.add('no-scroll');
    requestAnimationFrame(function () { root.classList.add('is-open'); var f = root.querySelector('[autofocus], input, button:not(.modal-x)'); if (f) f.focus(); });
    modalState = { onClose: opts.onClose, lastFocus: lastFocus, locked: opts.locked };
    return root.querySelector('.modal');
  }
  function closeModal(silent) {
    var root = document.getElementById('modal-root');
    if (!modalState) return;
    var st = modalState; modalState = null;
    root.classList.remove('is-open');
    root.hidden = true; root.innerHTML = '';
    if (!App.store.getState().ui.cartOpen) document.body.classList.remove('no-scroll');
    if (!silent && st.onClose) st.onClose();
    if (st.lastFocus && st.lastFocus.focus) st.lastFocus.focus({ preventScroll: true });
  }

  // ---------------- Ürün detay / porsiyon seçimi ----------------
  function openItem(id) {
    var item = App.pricing.findItem(id);
    if (!item) return;
    var portion = App.pricing.defaultPortion(item);
    var qty = 1;
    var portions = item.portions ? '<fieldset class="opt-group"><legend>' + esc(item.optionLabel || 'Seçenek') + '</legend>' + item.portions.map(function (p, i) {
      return '<label class="opt"><input type="radio" name="portion" value="' + p.id + '"' + (i === 0 ? ' checked' : '') + '><span>' + esc(p.label) + '</span><b class="num">' + money(p.price, true) + '</b></label>';
    }).join('') + '</fieldset>' : '';
    var m = openModal('' +
      '<div class="item-modal-media' + (item.image ? ' item-modal-media--photo' : '') + '" id="m-media">' + App.illustrations.itemMedia(item, { portion: portion }) + '</div>' +
      '<div class="item-modal-body">' +
      '  <div class="dish-tags static">' + tagBadges(item, 3) + '</div>' +
      '  <h2 class="display-sm">' + esc(item.name) + '</h2>' +
      '  <p class="muted">' + esc(item.desc) + (item.grams ? ' <span class="num">· ' + esc(item.grams) + '</span>' : '') + '</p>' +
      portions +
      '  <label class="field"><span class="field-label">Ürün notu <em>(isteğe bağlı)</em></span><input class="input" id="item-note" maxlength="140" placeholder="Örn: soğansız olsun, turşu olmasın"></label>' +
      '  <div class="item-modal-foot">' +
      '    <div class="stepper" role="group" aria-label="Adet"><button data-m="dec" aria-label="Azalt">' + I.minus + '</button><output class="num" id="m-qty">1</output><button data-m="inc" aria-label="Artır">' + I.plus + '</button></div>' +
      '    <button class="btn btn-primary btn-grow" data-m="add">Sepete ekle · <span class="num" id="m-total"></span></button>' +
      '  </div>' +
      '</div>', { cls: 'modal--item', label: item.name });

    function update() {
      U.$('#m-qty', m).textContent = qty;
      U.$('#m-total', m).textContent = money(App.pricing.unitPrice(item, portion) * qty);
    }
    update();
    m.addEventListener('change', function (e) {
      if (e.target.name !== 'portion') return;
      portion = e.target.value; update();
      if (item.image) U.$('#m-media', m).innerHTML = App.illustrations.itemMedia(item, { portion: portion });
    });
    m.addEventListener('click', function (e) {
      var b = e.target.closest('[data-m]'); if (!b) return;
      var a = b.getAttribute('data-m');
      if (a === 'inc') qty = Math.min(50, qty + 1);
      if (a === 'dec') qty = Math.max(1, qty - 1);
      if (a === 'add') {
        App.cart.add(item.id, portion, qty, U.$('#item-note', m).value.trim());
        closeModal(true);
        added(item, qty);
        return;
      }
      update();
    });
  }

  function added(item, qty) {
    bumpBadge();
    toast('<b>' + esc(item.name) + '</b>' + (qty > 1 ? ' ×' + qty : '') + ' sepete eklendi', { action: { href: '#sepet', label: 'Sepete git' } });
  }

  function quickAdd(id) {
    var item = App.pricing.findItem(id);
    if (!item) return;
    if (item.portions) return openItem(id);
    App.cart.add(id, null, 1);
    added(item, 1);
  }

  function setCartOpen(open) {
    App.store.dispatch({ type: 'UI_SET', patch: { cartOpen: open } });
    document.body.classList.toggle('no-scroll', open);
  }

  // ---------------- Global olay delegasyonu ----------------
  function bindGlobal() {
    document.addEventListener('click', function (e) {
      var el = e.target.closest('[data-action]');
      if (!el) return;
      var a = el.getAttribute('data-action');
      var key = el.getAttribute('data-key');
      switch (a) {
        case 'add': e.preventDefault(); quickAdd(el.getAttribute('data-id')); break;
        case 'open-item': e.preventDefault(); openItem(el.getAttribute('data-id')); break;
        case 'cart-open': setCartOpen(true); break;
        case 'cart-close': setCartOpen(false); break;
        case 'cart-close-nav':
          if (el.classList.contains('is-disabled')) { e.preventDefault(); return; }
          setCartOpen(false); break;
        case 'cart-inc': App.cart.setQty(key, (lineByKey(key) || { qty: 0 }).qty + 1); break;
        case 'cart-dec': App.cart.setQty(key, (lineByKey(key) || { qty: 1 }).qty - 1); break;
        case 'cart-remove': App.cart.remove(key); break;
        case 'modal-close': closeModal(); break;
        case 'nav-toggle': {
          var nav = document.getElementById('nav-mobile');
          nav.hidden = !nav.hidden; el.setAttribute('aria-expanded', String(!nav.hidden)); break;
        }
        case 'copy': e.preventDefault(); U.copyText(el.getAttribute('data-copy'), el); break;
      }
    });
    document.addEventListener('change', function (e) {
      var el = e.target;
      if (el.getAttribute && el.getAttribute('data-action') === 'cart-portion') {
        App.store.dispatch({ type: 'CART_SET_PORTION', key: el.getAttribute('data-key'), portion: el.value });
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if (modalState && !modalState.locked) closeModal();
      else if (App.store.getState().ui.cartOpen) setCartOpen(false);
    });
  }

  function lineByKey(k) { return App.store.getState().cart.filter(function (l) { return l.key === k; })[0]; }

  function setActiveNav(name) {
    U.$$('[data-nav]').forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('data-nav') === name); });
    var nav = document.getElementById('nav-mobile');
    if (nav) nav.hidden = true;
  }

  App.ui = {
    I: I, header: header, footer: footer, hoursRows: hoursRows, hoursBlock: hoursBlock, productCard: productCard, refreshCardBadges: refreshCardBadges, cartLine: cartLine,
    stepper: stepper, freeDeliveryBar: freeDeliveryBar, emptyCart: emptyCart, tagBadges: tagBadges,
    renderDrawer: renderDrawer, renderCartBadge: renderCartBadge, renderMobileBar: renderMobileBar,
    toast: toast, openModal: openModal, closeModal: closeModal, openItem: openItem, quickAdd: quickAdd,
    setCartOpen: setCartOpen, bindGlobal: bindGlobal, setActiveNav: setActiveNav,
  };
})(window.App = window.App || {});
