/* Uygulama başlangıcı: kabuğu çizer, store aboneliklerini kurar, yönlendiriciyi başlatır */
(function (App) {
  var U = App.utils;

  function boot() {
    document.getElementById('site-header').innerHTML = App.ui.header();
    document.getElementById('site-footer').innerHTML = App.ui.footer();
    App.ui.bindGlobal();

    function renderCartUi() {
      App.ui.renderCartBadge();
      App.ui.renderDrawer();
      App.ui.renderMobileBar();
    }
    renderCartUi();
    App.store.subscribe(function (s, a, prev) {
      if (s.cart !== prev.cart || s.ui.cartOpen !== prev.ui.cartOpen || s.ui.zone !== prev.ui.zone) renderCartUi();
    });

    App.router.onChange(function (r) {
      App.ui.setActiveNav(r.name);
      App.ui.renderMobileBar();
      if (App.store.getState().ui.cartOpen) App.ui.setCartOpen(false);
      App.ui.closeModal(true);
    });

    // Başlıktaki açık/kapalı durumunu dakikada bir güncelle
    setInterval(function () {
      var h = document.getElementById('site-header');
      var expanded = !document.getElementById('nav-mobile').hidden;
      if (!expanded) { h.innerHTML = App.ui.header(); App.ui.renderCartBadge(); App.ui.setActiveNav(App.router.current().name); }
    }, 60000);

    // Kaydırınca başlığa gölge
    var hdr = document.getElementById('site-header');
    window.addEventListener('scroll', function () { hdr.classList.toggle('is-scrolled', window.scrollY > 8); }, { passive: true });

    // Eski '#admin' adresi artık ayrı panel sayfasına gider
    App.router.register('admin', { title: 'Sipariş Paneli', render: function () { return '<div class="container page-body"><p class="muted">Panele yönlendiriliyorsunuz…</p></div>'; }, mount: function () { location.replace(App.config.panelUrl); } });

    App.router.start();
    App.api.ready.then(function (mode) { document.documentElement.setAttribute('data-api', mode); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  void U;
})(window.App = window.App || {});
