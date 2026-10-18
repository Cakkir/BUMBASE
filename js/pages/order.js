/* Sipariş Onay & Canlı Takip */
(function (App) {
  var U = App.utils, esc = U.esc, money = U.money, cfg = App.config, I = App.ui.I, core = App.ordersCore;
  var FLOW = ['yeni', 'hazirlaniyor', 'yolda', 'teslim'];

  function eta(o) {
    if (o.schedule && o.schedule.type === 'later') return 'Planlanan teslimat: <b class="num">' + esc(o.schedule.time) + '</b>';
    var t = new Date(o.createdAt).getTime();
    var a = new Date(t + cfg.delivery.etaMinutes[0] * 60000), b = new Date(t + cfg.delivery.etaMinutes[1] * 60000);
    return 'Tahmini teslimat: <b class="num">' + U.hhmm(a) + ' – ' + U.hhmm(b) + '</b>';
  }

  function view(o) {
    if (!o) return '<div class="card-pad empty"><h3>Sipariş bulunamadı</h3><p class="muted">Numarayı kontrol edin. Sorun devam ederse bizi arayın: <span class="selectable num">' + esc(cfg.restaurant.phone) + '</span></p><a href="#anasayfa" class="btn btn-primary">Ana sayfaya dön</a></div>';
    var cancelled = o.status === 'iptal';
    var idx = FLOW.indexOf(o.status);
    var times = {};
    (o.timeline || []).forEach(function (t) { times[t.status] = t.at; });
    var steps = FLOW.map(function (s, i) {
      var cls = cancelled ? '' : i < idx ? 'done' : i === idx ? 'current' : '';
      return '<li class="' + cls + '"><span class="track-dot">' + (i < idx || (i === idx && s === 'teslim') ? I.check : '') + '</span><div><b>' + esc(core.statusLabel(s).customerLabel) + '</b><span class="muted num">' + (times[s] ? U.hhmm(times[s]) : '—') + '</span></div></li>';
    }).join('');
    var headline = cancelled ? 'Siparişiniz iptal edildi' : o.status === 'teslim' ? 'Afiyet olsun!' : o.status === 'yolda' ? 'Kuryemiz yolda' : o.status === 'hazirlaniyor' ? 'Mutfakta hazırlanıyor' : 'Siparişiniz alındı';
    var pay = o.payment.status === 'paid'
      ? '<span class="chip chip--ok">' + I.check + 'Ödendi</span> ' + esc(o.payment.methodLabel) + (o.payment.last4 ? ' <span class="num">•••• ' + esc(o.payment.last4) + '</span>' : '')
      : '<span class="chip chip--warn">Kapıda ödeme</span> ' + esc(o.payment.methodLabel);
    return '' +
      '<div class="track-grid">' +
      '  <div class="panel track-main">' +
      '    <div class="track-head">' +
      '      <div class="track-badge ' + (cancelled ? 'is-cancel' : '') + '">' + (cancelled ? I.close : o.status === 'teslim' ? I.check : I.flame) + '</div>' +
      '      <div><p class="eyebrow">Sipariş <span class="num">#' + esc(o.id) + '</span></p><h2 class="display-sm">' + headline + '</h2>' +
      (cancelled ? '<p class="muted">Ödeme yapıldıysa iade 3–7 iş günü içinde kartınıza yansır. Sorularınız için: <span class="selectable num">' + esc(cfg.restaurant.phone) + '</span></p>' : '<p class="muted">' + eta(o) + '</p>') + '</div>' +
      '    </div>' +
      (cancelled ? '' : '<ol class="track-steps">' + steps + '</ol>') +
      '    <div class="live-note"><span class="live-dot"></span>Bu sayfa canlı güncellenir; yenilemenize gerek yok.</div>' +
      (App.api.mode === 'local' ? '<p class="muted text-sm demo-hint">Demo modu: <a href="' + esc(App.config.panelUrl) + '" target="_blank" rel="noopener">Restoran panelini</a> başka bir sekmede açıp durumu değiştirerek canlı takibi deneyebilirsiniz.</p>' : '') +
      '  </div>' +
      '  <aside class="side-col">' +
      '    <div class="adisyon">' +
      '      <div class="adisyon-head"><span class="eyebrow">Adisyon <span class="num">#' + esc(o.id) + '</span></span><span class="num muted">' + U.hhmm(o.createdAt) + '</span></div>' +
      '      <ul class="adisyon-lines">' + o.lines.map(function (l) { return '<li><span><b class="num">' + l.qty + '×</b> ' + esc(l.name) + (l.portionLabel ? ' <em>' + esc(l.portionLabel) + '</em>' : '') + '</span><i></i><span class="num">' + money(l.total) + '</span></li>'; }).join('') + '</ul>' +
      '      <dl class="adisyon-sum"><div><dt>Ara toplam</dt><i></i><dd class="num">' + money(o.subtotal) + '</dd></div><div><dt>Teslimat</dt><i></i><dd class="num">' + (o.deliveryFee ? money(o.deliveryFee) : 'Ücretsiz') + '</dd></div><div class="adisyon-total"><dt>Toplam</dt><i></i><dd class="num">' + money(o.total) + '</dd></div></dl>' +
      '    </div>' +
      '    <div class="panel panel--tight">' +
      '      <ul class="contact-list">' +
      '        <li>' + I.pin + '<div><b>Teslimat adresi</b><span>' + esc(o.address.neighborhood) + ' Mah., ' + esc(o.address.street) + (o.address.apartment ? ', ' + esc(o.address.apartment) : '') + ' · ' + esc(o.address.zoneLabel) + '</span></div></li>' +
      '        <li>' + I.lock + '<div><b>Ödeme</b><span>' + pay + '</span></div></li>' +
      (o.note ? '<li>' + I.bag + '<div><b>Teslimat notu</b><span>' + esc(o.note) + '</span></div></li>' : '') +
      '      </ul>' +
      '    </div>' +
      '    <button class="btn btn-ghost btn-block" data-order="again">Aynı siparişi tekrar sepete ekle</button>' +
      '  </aside>' +
      '</div>';
  }

  App.router.register('siparis', {
    title: function (id) { return 'Sipariş ' + (id || ''); },
    render: function (id) {
      return '<section class="page-hero page-hero--slim"><div class="container">' + App.cartPage.steps(2) + '<h1 class="display-md">Sipariş takibi</h1></div></section>' +
        '<div class="container page-body" id="order-body"><div class="card-pad center muted"><span class="spinner"></span> Sipariş yükleniyor…</div></div>';
    },
    mount: function (root, id) {
      var box = U.$('#order-body', root), current = null, alive = true;
      function load() {
        return App.orders.get(id).then(function (o) {
          if (!alive) return;
          var changed = current && o && current.status !== o.status;
          current = o; box.innerHTML = view(o);
          if (changed) App.ui.toast('Sipariş durumu: <b>' + esc(core.statusLabel(o.status).customerLabel) + '</b>');
        }).catch(function (e) { if (alive) box.innerHTML = '<div class="card-pad empty"><h3>Sipariş yüklenemedi</h3><p class="muted">' + esc(e.message) + '</p></div>'; });
      }
      load();
      var unsub = App.orders.subscribe(function (evt) {
        if (evt.type === 'sync' || (evt.order && evt.order.id === id) || evt.id === id) load();
      });
      var poll = setInterval(load, 30000); // SSE kopsa bile güncel kalsın
      function onClick(e) {
        if (!e.target.closest('[data-order="again"]') || !current) return;
        current.lines.forEach(function (l) { if (App.pricing.findItem(l.id)) App.cart.add(l.id, l.portion, l.qty); });
        App.ui.toast('Ürünler sepete eklendi', { action: { href: '#sepet', label: 'Sepete git' } });
      }
      root.addEventListener('click', onClick);
      return function () { alive = false; unsub(); clearInterval(poll); root.removeEventListener('click', onClick); };
    },
  });
})(window.App = window.App || {});
