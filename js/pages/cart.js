/* Sepet Sayfası */
(function (App) {
  var U = App.utils, esc = U.esc, money = U.money, cfg = App.config, I = App.ui.I;

  function steps(active) {
    var s = ['Sepet', 'Teslimat & Ödeme', 'Onay'];
    return '<ol class="steps">' + s.map(function (label, i) {
      return '<li class="' + (i < active ? 'done' : i === active ? 'current' : '') + '"><span class="num">' + (i < active ? '✓' : i + 1) + '</span>' + label + '</li>';
    }).join('') + '</ol>';
  }

  function summaryCard(s, opts) {
    opts = opts || {};
    var zones = cfg.delivery.zones.map(function (z) {
      return '<option value="' + z.id + '"' + (z.id === App.store.getState().ui.zone ? ' selected' : '') + '>' + esc(z.label) + (z.extraFee ? ' (+' + money(z.extraFee, true) + ')' : '') + '</option>';
    }).join('');
    return '' +
      '<div class="adisyon">' +
      '  <div class="adisyon-head"><span class="eyebrow">Adisyon</span><span class="num muted">' + U.dateTR(new Date()) + '</span></div>' +
      (opts.lines ? '<ul class="adisyon-lines">' + s.lines.map(function (l) {
        return '<li><span><b class="num">' + l.qty + '×</b> ' + esc(l.name) + (l.portionLabel ? ' <em>' + esc(l.portionLabel) + '</em>' : '') + '</span><i></i><span class="num">' + money(l.total) + '</span></li>';
      }).join('') + '</ul>' : '') +
      (opts.zone && cfg.delivery.zones.length > 1 ? '<label class="field field--inline"><span class="field-label">Teslimat bölgesi</span><select class="select" id="zone-select">' + zones + '</select></label>' : '') +
      '  <dl class="adisyon-sum">' +
      '    <div><dt>Ara toplam</dt><i></i><dd class="num">' + money(s.subtotal) + '</dd></div>' +
      '    <div><dt>Teslimat ücreti</dt><i></i><dd class="num">' + (s.baseFee ? money(s.baseFee) : '<span class="ok-text">Ücretsiz</span>') + '</dd></div>' +
      (s.zoneFee ? '<div><dt>Bölge farkı</dt><i></i><dd class="num">' + money(s.zoneFee) + '</dd></div>' : '') +
      '    <div class="adisyon-total"><dt>Toplam</dt><i></i><dd class="num">' + money(s.total) + '</dd></div>' +
      '  </dl>' +
      '</div>';
  }

  function suggestions() {
    var inCart = {};
    App.store.getState().cart.forEach(function (l) { inCart[l.id] = 1; });
    var pick = ['x-sarimsakli', 'x-patates', 'd-sufle', 'i-kola', 's-ranch', 's-sarimsakli'].filter(function (id) { return !inCart[id] && App.pricing.findItem(id) && !App.storeStatus.isSoldOut(id); }).slice(0, 3);
    if (!pick.length) return '';
    return '<div class="upsell"><h3 class="quick-title">Yanına iyi gider</h3><ul class="quick-list">' + pick.map(function (id) {
      var it = App.pricing.findItem(id);
      return '<li class="quick-row"><div class="quick-thumb">' + App.illustrations.itemMedia(it) + '</div><div class="quick-info"><b>' + esc(it.name) + '</b><span class="muted num">' + money(App.pricing.fromPrice(it), true) + '</span></div>' +
        '<div class="quick-ctrl"><button class="btn btn-sm btn-soft" data-action="add" data-id="' + id + '">' + I.plus + 'Ekle</button></div></li>';
    }).join('') + '</ul></div>';
  }

  function body() {
    var lines = App.store.getState().cart;
    if (!lines.length) return '<div class="card-pad">' + App.ui.emptyCart() + '</div>';
    var s = App.cart.summary();
    var issue = App.storeStatus.cartIssue(lines);
    var canGo = s.meetsMinimum && !issue;
    return '' +
      '<div class="checkout-grid">' +
      '  <div class="panel">' +
      '    <div class="panel-head"><h2 class="display-sm">Ürünler <span class="muted num">(' + s.itemCount + ')</span></h2><button class="link-btn" data-cart="clear">Sepeti boşalt</button></div>' +
      App.ui.freeDeliveryBar(s) +
      '    <ul class="cart-list">' + lines.map(function (l) { return App.ui.cartLine(l); }).join('') + '</ul>' +
      '    <a href="#menu" class="link-arrow">Ürün eklemeye devam et ' + I.arrow + '</a>' +
      '  </div>' +
      '  <aside class="side-col">' +
      summaryCard(s, { zone: true }) +
      (issue ? '<div class="notice notice--warn notice--sm">' + (issue.code === 'paused' ? I.pause : I.clock) + '<span><b>' + esc(issue.title) + '.</b> ' + esc(issue.message) + '</span></div>' : '') +
      (!s.meetsMinimum ? '<p class="warn-line">Minimum sipariş tutarı ' + money(cfg.delivery.minOrder, true) + '. Sepete <b class="num">' + money(s.minOrderLeft) + '</b> daha ekleyin.</p>' : '') +
      '    <a href="#odeme" class="btn btn-primary btn-lg btn-block' + (canGo ? '' : ' is-disabled') + '" id="go-checkout" ' + (canGo ? '' : 'aria-disabled="true"') + '>Ödemeye geç ' + I.arrow + '</a>' +
      '    <p class="muted text-sm center eta-line">' + I.clock + ' Tahmini teslimat ' + cfg.delivery.etaMinutes[0] + '–' + cfg.delivery.etaMinutes[1] + ' dk</p>' +
      suggestions() +
      '  </aside>' +
      '</div>';
  }

  App.router.register('sepet', {
    title: 'Sepetim',
    render: function () {
      return '<section class="page-hero page-hero--slim"><div class="container">' + steps(0) + '<h1 class="display-md">Sepetim</h1></div></section>' +
        '<div class="container page-body" id="cart-body">' + body() + '</div>';
    },
    mount: function (root) {
      var box = U.$('#cart-body', root);
      var clearArmed = false;
      function repaint() { var y = window.scrollY; box.innerHTML = body(); window.scrollTo(0, y); }
      var unsub = App.store.subscribe(function (s, a, prev) {
        if (s.cart !== prev.cart || s.ui.zone !== prev.ui.zone) repaint();
      });
      var unsubStatus = App.storeStatus.subscribe(repaint);
      function onChange(e) { if (e.target.id === 'zone-select') App.store.dispatch({ type: 'UI_SET', patch: { zone: e.target.value } }); }
      function onClick(e) {
        var c = e.target.closest('[data-cart="clear"]');
        if (c) {
          // confirm() kullanmadan iki adımlı onay
          if (!clearArmed) { clearArmed = true; c.textContent = 'Emin misiniz? Tekrar tıklayın'; c.classList.add('danger'); setTimeout(function () { clearArmed = false; if (c.isConnected) { c.textContent = 'Sepeti boşalt'; c.classList.remove('danger'); } }, 3000); return; }
          App.cart.clear(); App.ui.toast('Sepet boşaltıldı');
        }
        var go = e.target.closest('#go-checkout.is-disabled');
        if (go) e.preventDefault();
      }
      root.addEventListener('change', onChange);
      root.addEventListener('click', onClick);
      return function () { unsub(); unsubStatus(); root.removeEventListener('change', onChange); root.removeEventListener('click', onClick); };
    },
  });

  App.cartPage = { steps: steps, summaryCard: summaryCard };
})(window.App = window.App || {});
