/* Hakkımızda & İletişim + 404 */
(function (App) {
  var U = App.utils, esc = U.esc, cfg = App.config, R = cfg.restaurant, I = App.ui.I;

  function mapBlock() {
    if (R.mapEmbedUrl) {
      return '<div class="map-frame"><iframe src="' + esc(R.mapEmbedUrl) + '" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="' + esc(R.name) + ' konumu"></iframe></div>';
    }
    // Harita gömülü değilse: stilize sokak planı + Google Haritalar bağlantısı
    return '' +
      '<div class="map-frame map-frame--art">' +
      '  <svg viewBox="0 0 600 360" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
      '    <rect width="600" height="360" fill="var(--map-bg)"/>' +
      '    <path d="M0 250 C 120 230, 200 300, 330 270 S 520 210, 600 240 L600 360 L0 360Z" fill="var(--map-water)"/>' +
      '    <g stroke="var(--map-road)" stroke-width="14" fill="none" stroke-linecap="round"><path d="M-20 120 L620 90"/><path d="M180 -20 L230 380"/><path d="M420 -20 L380 260"/></g>' +
      '    <g stroke="var(--map-street)" stroke-width="5" fill="none"><path d="M0 40 L600 20"/><path d="M0 190 L600 170"/><path d="M90 0 L120 260"/><path d="M300 0 L310 280"/><path d="M520 0 L500 230"/></g>' +
      '    <g fill="var(--map-block)"><rect x="250" y="130" width="40" height="30" rx="4"/><rect x="330" y="120" width="60" height="40" rx="4"/><rect x="130" y="140" width="40" height="34" rx="4"/><rect x="440" y="110" width="44" height="50" rx="4"/></g>' +
      '    <g transform="translate(305 112)"><circle r="34" fill="var(--ember)" opacity=".18"/><circle r="18" fill="var(--ember)" opacity=".3"/><path d="M0 8 C -10 -4, -14 -10, -14 -18 a14 14 0 0 1 28 0 c0 8 -4 14 -14 26Z" fill="var(--ember)" transform="translate(0 -14)"/><circle cy="-32" r="5" fill="var(--bg)"/></g>' +
      '  </svg>' +
      '  <div class="map-card"><b>' + esc(R.name) + '</b><span>' + esc(R.address) + '</span><a href="' + esc(R.mapsUrl) + '" target="_blank" rel="noopener" class="btn btn-sm btn-primary">Google Haritalar’da aç ' + I.arrow + '</a></div>' +
      '</div>';
  }

  function render() {
    var st = U.openState(cfg.hours);
    var about = R.about || { title: R.name, paragraphs: [] };
    var h0 = cfg.hours[0];
    return '' +
      '<section class="page-hero page-hero--about">' +
      '  <div class="container about-grid">' +
      '    <div><p class="eyebrow">Hakkımızda</p><h1 class="display-md">' + esc(about.title) + '</h1>' +
      about.paragraphs.map(function (t, i) { return '<p class="' + (i === 0 ? 'lead' : 'muted') + '">' + esc(t) + '</p>'; }).join('') + '</div>' +
      '    <ul class="about-facts">' +
      '      <li><b class="num">' + (h0.open ? h0.open.slice(0, 2) + '–' + h0.close.slice(0, 2) : '—') + '</b><span>' + (U.hoursSummary(cfg.hours) ? 'her gün açık' : 'bugün açık') + '</span></li>' +
      (R.founded ? '<li><b class="num">' + R.founded + '</b><span>yılından beri</span></li>' : '<li><b>' + esc(R.district) + '</b><span>' + esc(R.city || '') + '</span></li>') +
      '      <li><b class="num">' + cfg.delivery.zones.length + '</b><span>teslimat bölgesi</span></li>' +
      '      <li><b class="num">' + cfg.delivery.etaMinutes[0] + '–' + cfg.delivery.etaMinutes[1] + '</b><span>dk teslimat</span></li>' +
      '    </ul>' +
      '  </div>' +
      '</section>' +
      '<div class="container page-body">' +
      '  <div class="contact-grid">' +
      '    <div class="contact-map">' + mapBlock() + '</div>' +
      '    <div class="panel">' +
      '      <div class="info-head"><h2 class="display-sm">İletişim</h2><span class="status-pill ' + (st.open ? 'is-open' : 'is-closed') + '"><i></i>' + st.label + ' · ' + esc(st.detail) + '</span></div>' +
      '      <ul class="contact-list">' +
      '        <li>' + I.pin + '<div><b>Adres</b><span class="selectable">' + esc(R.address) + '</span></div><button class="btn btn-sm btn-ghost" data-action="copy" data-copy="' + esc(R.address) + '">Kopyala</button></li>' +
      '        <li>' + I.phone + '<div><b>Telefon</b><span class="selectable num">' + esc(R.phone) + '</span></div><button class="btn btn-sm btn-ghost" data-action="copy" data-copy="' + esc(R.phone) + '">Kopyala</button></li>' +
      (R.email ? '        <li>' + I.bag + '<div><b>E-posta</b><span class="selectable">' + esc(R.email) + '</span></div><button class="btn btn-sm btn-ghost" data-action="copy" data-copy="' + esc(R.email) + '">Kopyala</button></li>' : '') +
      '        <li>' + I.scooter + '<div><b>Teslimat bölgeleri</b><span>' + cfg.delivery.zones.map(function (z) { return esc(z.label) + (z.extraFee ? ' (+' + z.extraFee + ' TL)' : ''); }).join(', ') + '</span></div></li>' +
      '      </ul>' +
      '      <h3 class="quick-title">Çalışma saatleri</h3>' +
      App.ui.hoursBlock() +
      '    </div>' +
      '  </div>' +
      '  <div class="panel contact-form-panel">' +
      '    <div><p class="eyebrow">Bize yazın</p><h2 class="display-sm">Toplu sipariş, organizasyon ya da öneri</h2><p class="muted">Mesajınıza çalışma saatleri içinde en geç 2 saatte dönüş yapıyoruz.</p></div>' +
      '    <form id="contact-form" class="form-grid" novalidate>' +
      '      <div class="field"><label class="field-label" for="c-name">Ad soyad</label><input class="input" id="c-name" required autocomplete="name"></div>' +
      '      <div class="field"><label class="field-label" for="c-phone">Telefon veya e-posta</label><input class="input" id="c-phone" required></div>' +
      '      <div class="field span-2"><label class="field-label" for="c-msg">Mesajınız</label><textarea class="input" id="c-msg" rows="4" required></textarea></div>' +
      '      <p class="field-error span-2" id="c-err" hidden></p>' +
      '      <div class="span-2"><button class="btn btn-primary" type="submit">Mesajı gönder</button></div>' +
      '    </form>' +
      '  </div>' +
      '</div>';
  }

  App.router.register('iletisim', {
    title: 'Hakkımızda & İletişim',
    render: render,
    mount: function (root) {
      var f = U.$('#contact-form', root);
      function onSubmit(e) {
        e.preventDefault();
        var name = U.$('#c-name', root).value.trim(), ph = U.$('#c-phone', root).value.trim(), msg = U.$('#c-msg', root).value.trim();
        var err = U.$('#c-err', root);
        if (name.length < 3 || ph.length < 5 || msg.length < 10) { err.textContent = 'Lütfen adınızı, iletişim bilginizi ve en az 10 karakterlik mesajınızı yazın.'; err.hidden = false; return; }
        err.hidden = true;
        // Gerçek kurulumda: App.api.http('POST', '/api/contact', {...})
        f.innerHTML = '<div class="notice notice--ok span-2">' + I.check + '<span><b>Mesajınız alındı.</b> En kısa sürede ' + esc(ph) + ' üzerinden size dönüş yapacağız.</span></div>';
      }
      f.addEventListener('submit', onSubmit);
    },
  });

  App.router.register('notfound', {
    title: 'Sayfa bulunamadı',
    render: function () {
      return '<div class="container page-body"><div class="card-pad empty"><h1 class="display-md">Bu sayfa fırından çıkmamış</h1><p class="muted">Aradığınız sayfa taşınmış veya hiç var olmamış olabilir.</p><div class="info-cta"><a class="btn btn-ghost" href="#anasayfa">Ana sayfa</a><a class="btn btn-primary" href="#menu">Menü</a></div></div></div>';
    },
  });
})(window.App = window.App || {});
