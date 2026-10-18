/* Ana Sayfa */
(function (App) {
  var U = App.utils, esc = U.esc, money = U.money, cfg = App.config, R = cfg.restaurant, I = App.ui.I;

  // ÖRNEK yorumlar — gerçek müşteri yorumlarınızla değiştirin
  var reviews = [
    { name: 'Selin A.', where: 'Etlik', rating: 5, text: 'Karışık pizza geldiğinde hâlâ sıcaktı, malzemesi bol. Gece üçte sipariş verebildiğimiz nadir yerlerden.' },
    { name: 'Burak T.', where: 'Kalaba', rating: 5, text: 'Bum Base Burger’daki füme kaburga çok iyiydi. Patatesler de çıtır geldi.' },
    { name: 'Deniz K.', where: 'Aktepe', rating: 4, text: 'Cajun tavuk sepeti iki kişiye yetti, soslar ayrı paketlenmişti. Teslimat tahmin edilen sürede oldu.' },
  ];

  function hero() {
    var st = U.openState(cfg.hours);
    var d = cfg.delivery;
    return '' +
      '<section class="hero">' +
      '  <canvas class="hero-embers" aria-hidden="true"></canvas>' +
      '  <div class="container hero-grid">' +
      '    <div class="hero-copy">' +
      '      <p class="eyebrow">' + esc(R.district) + ' · ' + (R.founded ? R.founded + '’den beri' : esc(U.hoursSummary(cfg.hours) || st.detail)) + '</p>' +
      '      <h1 class="display">Hızlı, <span class="ember-text">Sıcak</span>,<br>Lezzetli.</h1>' +
      '      <p class="lead">Bol malzemeli pizzalar, 240 grama kadar burgerler ve çıtır lezzetler. ' + esc(R.district) + '’de her gün ' + esc(cfg.hours[new Date().getDay()].close) + '’e kadar paket servis; ' + d.etaMinutes[0] + '–' + d.etaMinutes[1] + ' dakikada kapında.</p>' +
      '      <div class="hero-cta"><a href="#menu" class="btn btn-primary btn-lg">Sipariş ver ' + I.arrow + '</a><a href="#hizli" class="btn btn-ghost btn-lg" data-scroll="hizli">Hızlı sipariş</a></div>' +
      '      <ul class="hero-facts">' +
      '        <li><span class="fact-ico ' + (st.open ? 'ok' : 'off') + '">' + I.clock + '</span><div><b>' + st.label + '</b><span>' + esc(st.detail) + '</span></div></li>' +
      '        <li><span class="fact-ico">' + I.scooter + '</span><div><b class="num">' + d.etaMinutes[0] + '–' + d.etaMinutes[1] + ' dk</b><span>Ortalama teslimat</span></div></li>' +
      '        <li><span class="fact-ico">' + I.bag + '</span><div><b class="num">' + money(d.freeOver, true) + ' üzeri</b><span>Ücretsiz teslimat</span></div></li>' +
      '      </ul>' +
      '    </div>' +
      '    <div class="hero-visual" aria-hidden="true">' +
      '      <div class="hero-plate">' + App.illustrations.itemMedia(App.pricing.findItem('p-bumbase'), { bare: true, art: true }) + '</div>' +
      '      <div class="hero-ticket"><span class="eyebrow">Fırından yeni çıktı</span><b>Bum Base Pizza</b><span class="num">Orta boy ' + money(App.pricing.fromPrice(App.pricing.findItem('p-bumbase')), true) + '</span></div>' +
      '    </div>' +
      '  </div>' +
      '</section>';
  }

  function featured() {
    var items = App.menu.items.filter(function (i) { return i.featured; }).slice(0, 4);
    return '' +
      '<section class="section">' +
      '  <div class="container">' +
      '    <div class="section-head"><div><p class="eyebrow">Öne çıkanlar</p><h2 class="display-md">İmza lezzetlerimiz</h2></div><a href="#menu" class="link-arrow">Tüm menü ' + I.arrow + '</a></div>' +
      '    <div class="dish-grid dish-grid--4">' + items.map(function (i) { return App.ui.productCard(i); }).join('') + '</div>' +
      '  </div>' +
      '</section>';
  }

  function quickList() {
    var popular = App.menu.items.filter(function (i) { return i.popular; }).slice(0, 6);
    return popular.map(function (item) {
      var portion = App.pricing.defaultPortion(item);
      var key = App.cart.key(item.id, portion);
      var qty = App.cart.qtyOf(item.id, portion);
      var price = App.pricing.unitPrice(item, portion);
      var ctrl = qty
        ? App.ui.stepper(key, qty, true)
        : '<button class="btn btn-sm btn-soft" data-action="quick" data-id="' + item.id + '" data-portion="' + (portion || '') + '">' + I.plus + 'Ekle</button>';
      return '<li class="quick-row"><div class="quick-thumb">' + App.illustrations.itemMedia(item) + '</div>' +
        '<div class="quick-info"><b>' + esc(item.name) + '</b><span class="muted num">' + (item.portions ? esc(item.portions[0].label) + ' · ' : '') + money(price, true) + '</span></div>' +
        '<div class="quick-ctrl">' + ctrl + '</div></li>';
    }).join('');
  }

  function quick() {
    var combos = App.menu.items.filter(function (i) { return i.highlight; }).slice(0, 3);
    var mine = App.orders.mine()[0];
    var again = mine ? '<div class="reorder"><div><b>Son siparişiniz</b><span class="muted num"> · ' + esc(mine.id) + ' · ' + money(mine.total) + '</span></div><button class="btn btn-sm btn-ghost" data-action="reorder">Tekrarla</button></div>' : '';
    return '' +
      '<section class="section section--band" id="hizli">' +
      '  <div class="container">' +
      '    <div class="section-head"><div><p class="eyebrow">Hızlı sipariş</p><h2 class="display-md">Düşünmeye gerek yok, tek dokunuşla sepette</h2></div></div>' +
      '    <div class="quick-grid">' +
      '      <div class="combo-list">' + combos.map(function (c) {
        return '<article class="combo"><div class="combo-media">' + App.illustrations.itemMedia(c) + '</div><div class="combo-body"><h3>' + esc(c.name) + '</h3><p class="muted">' + esc(c.desc) + '</p>' +
          '<div class="combo-foot"><span class="dish-price">' + (c.portions ? '<small>başlayan</small>' : '') + money(App.pricing.fromPrice(c), true) + '</span><button class="btn btn-primary btn-sm" data-action="add" data-id="' + c.id + '">' + I.plus + 'Sepete ekle</button></div></div></article>';
      }).join('') + '</div>' +
      '      <aside class="quick-panel">' + again +
      '        <h3 class="quick-title">En çok sipariş edilenler</h3>' +
      '        <ul class="quick-list" id="quick-list">' + quickList() + '</ul>' +
      '        <a href="#odeme" class="btn btn-primary btn-block" id="quick-checkout" hidden>Ödemeye geç · <span class="num" id="quick-total"></span></a>' +
      '      </aside>' +
      '    </div>' +
      '  </div>' +
      '</section>';
  }

  function stars(n) {
    var s = '';
    for (var i = 0; i < 5; i++) s += '<span class="' + (i < n ? 'on' : '') + '">' + I.star + '</span>';
    return '<span class="stars" aria-label="5 üzerinden ' + n + '">' + s + '</span>';
  }

  function reviewsSection() {
    return '' +
      '<section class="section">' +
      '  <div class="container">' +
      '    <div class="section-head"><div><p class="eyebrow">Müşteri yorumları</p><h2 class="display-md">Sofradan gelen notlar</h2></div>' +
      (cfg.showSampleBadges ? '<span class="sample-badge" title="Bu yorumlar örnektir; gerçek yorumlarınızla değiştirin.">Örnek içerik</span>' : '') + '</div>' +
      '    <div class="review-grid">' + reviews.map(function (r) {
        return '<figure class="review">' + stars(r.rating) + '<blockquote>' + esc(r.text) + '</blockquote><figcaption><span class="avatar">' + esc(r.name.charAt(0)) + '</span><b>' + esc(r.name) + '</b><span class="muted">' + esc(r.where) + '</span></figcaption></figure>';
      }).join('') + '</div>' +
      '  </div>' +
      '</section>';
  }

  function infoSection() {
    var st = U.openState(cfg.hours);
    return '' +
      '<section class="section">' +
      '  <div class="container info-grid">' +
      '    <div class="info-card">' +
      '      <div class="info-head"><h2 class="display-sm">Çalışma saatleri</h2><span class="status-pill ' + (st.open ? 'is-open' : 'is-closed') + '"><i></i>' + st.label + '</span></div>' +
      App.ui.hoursBlock() +
      '    </div>' +
      '    <div class="info-card info-card--contact">' +
      '      <h2 class="display-sm">Bize ulaşın</h2>' +
      '      <ul class="contact-list">' +
      '        <li>' + I.pin + '<div><b>Adres</b><span>' + esc(R.address) + '</span></div></li>' +
      '        <li>' + I.phone + '<div><b>Telefon</b><span class="selectable num">' + esc(R.phone) + '</span></div><button class="btn btn-sm btn-ghost" data-action="copy" data-copy="' + esc(R.phone) + '">Kopyala</button></li>' +
      '        <li>' + I.scooter + '<div><b>Teslimat bölgeleri</b><span>' + cfg.delivery.zones.map(function (z) { return z.label; }).join(', ') + '</span></div></li>' +
      '      </ul>' +
      '      <div class="info-cta"><a href="#iletisim" class="btn btn-ghost">Harita ve detaylar</a><a href="#menu" class="btn btn-primary">Sipariş ver</a></div>' +
      '    </div>' +
      '  </div>' +
      '</section>';
  }

  function activeOrderBanner() {
    var mine = App.orders.mine()[0];
    if (!mine || U.minutesAgo(mine.createdAt) > 180) return '';
    return '<div class="container"><a class="track-banner" href="#siparis-' + esc(mine.id) + '">' + I.scooter + '<span><b>Siparişiniz yolda mı?</b> ' + esc(mine.id) + ' numaralı siparişi canlı takip edin.</span>' + I.arrow + '</a></div>';
  }

  // ---------------- Kor (ember) animasyonu ----------------
  function embers(canvas) {
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var ctx = canvas.getContext('2d');
    var parts = [], raf = null, w = 0, h = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
    function size() {
      var r = canvas.getBoundingClientRect(); w = r.width; h = r.height;
      canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function spawn(initial) {
      return { x: Math.random() * w, y: initial ? Math.random() * h : h + 10, r: .6 + Math.random() * 2.2, vy: .25 + Math.random() * .8, vx: (Math.random() - .5) * .3, life: 0, max: 220 + Math.random() * 260, hue: 18 + Math.random() * 22 };
    }
    function frame() {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        p.life++; p.y -= p.vy; p.x += p.vx + Math.sin((p.life + i * 20) / 40) * .25;
        var a = Math.max(0, 1 - p.life / p.max);
        ctx.beginPath(); ctx.fillStyle = 'hsla(' + p.hue + ',100%,' + (55 + a * 15) + '%,' + (a * .85).toFixed(3) + ')';
        ctx.shadowColor = 'hsla(' + p.hue + ',100%,55%,.8)'; ctx.shadowBlur = 8;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
        if (p.life > p.max || p.y < -10) parts[i] = spawn(false);
      }
      raf = requestAnimationFrame(frame);
    }
    size();
    var n = Math.round(Math.min(70, w / 16));
    for (var i = 0; i < n; i++) parts.push(spawn(true));
    if (reduce) { frame(); cancelAnimationFrame(raf); return function () {}; }
    frame();
    var onR = U.debounce(size, 150);
    window.addEventListener('resize', onR);
    return function () { cancelAnimationFrame(raf); window.removeEventListener('resize', onR); };
  }

  App.router.register('home', {
    title: null,
    render: function () {
      return hero() + activeOrderBanner() + featured() + quick() + reviewsSection() + infoSection();
    },
    mount: function (root) {
      var stopEmbers = embers(U.$('.hero-embers', root));
      function refresh() {
        App.ui.refreshCardBadges(root);
        var list = U.$('#quick-list', root);
        if (list) list.innerHTML = quickList();
        var s = App.cart.summary();
        var btn = U.$('#quick-checkout', root);
        btn.hidden = !s.itemCount;
        U.$('#quick-total', root).textContent = money(s.total);
      }
      refresh();
      var unsub = App.store.subscribe(function (s, a, prev) { if (s.cart !== prev.cart) refresh(); });
      function onClick(e) {
        var q = e.target.closest('[data-action="quick"]');
        if (q) { App.cart.add(q.getAttribute('data-id'), q.getAttribute('data-portion') || null, 1); App.ui.toast('Sepete eklendi'); return; }
        var sc = e.target.closest('[data-scroll]');
        if (sc) { e.preventDefault(); U.$('#' + sc.getAttribute('data-scroll')).scrollIntoView({ behavior: 'smooth' }); return; }
        if (e.target.closest('[data-action="reorder"]')) {
          var mine = App.orders.mine()[0];
          (mine.lines || []).forEach(function (l) { if (App.pricing.findItem(l.id)) App.cart.add(l.id, l.portion, l.qty); });
          App.ui.toast('Son siparişiniz sepete eklendi', { action: { href: '#sepet', label: 'Sepete git' } });
        }
      }
      root.addEventListener('click', onClick);
      return function () { stopEmbers(); unsub(); root.removeEventListener('click', onClick); };
    },
  });
})(window.App = window.App || {});
