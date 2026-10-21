/* BUM BASE Panel — başlangıç: paneli açar, uygulama olarak kurulmayı ve bildirimleri yönetir */
(function (App) {
  // Panel sayfasında yalnızca sipariş paneli vardır
  App.config.startPage = 'admin';
  if (location.hash && location.hash !== '#admin') {
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* sandbox */ }
  }

  // ---------------- Uygulama olarak kurulum (PWA) ----------------
  var deferred = null;
  var standalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
  App.pwa = {
    standalone: standalone,
    canInstall: function () { return !!deferred && !standalone; },
    install: function () {
      if (!deferred) return Promise.resolve(false);
      deferred.prompt();
      return deferred.userChoice.then(function (c) { deferred = null; document.dispatchEvent(new Event('pwa-change')); return c.outcome === 'accepted'; });
    },
  };
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault(); deferred = e; document.dispatchEvent(new Event('pwa-change'));
  });
  window.addEventListener('appinstalled', function () {
    deferred = null; document.dispatchEvent(new Event('pwa-change'));
    App.ui.toast('Panel uygulama olarak kuruldu. Masaüstündeki simgeden açabilirsiniz.', { ms: 5000 });
  });

  // Service worker (yalnızca https veya localhost üzerinde çalışır)
  var swReg = null;
  if ('serviceWorker' in navigator && /^https:|^http:\/\/(localhost|127\.0\.0\.1)/.test(location.href)) {
    navigator.serviceWorker.register('panel/sw.js', { scope: 'panel/' }).then(function (r) { swReg = r; }).catch(function () { /* yok say */ });
  }

  // ---------------- Bildirimler ----------------
  var NOTIFY_KEY = 'koz.panel.notify';
  var granted = false;
  App.notify = {
    supported: function () { return 'Notification' in window; },
    enabled: function () { return App.notify.supported() && (granted || Notification.permission === 'granted') && App.utils.storage.get(NOTIFY_KEY, true) !== false; },
    enable: function () {
      if (!App.notify.supported()) return Promise.reject(new Error('Bu tarayıcı bildirim göstermiyor.'));
      return Notification.requestPermission().then(function (p) {
        if (p !== 'granted') throw new Error('Bildirim izni verilmedi. Tarayıcının site ayarlarından izin verebilirsiniz.');
        granted = true;
        App.utils.storage.set(NOTIFY_KEY, true);
        return true;
      });
    },
    disable: function () { App.utils.storage.set(NOTIFY_KEY, false); },
    /** Yeni sipariş bildirimi. Panel önde ve odaktaysa göstermez (zaten ekranda görünür). */
    order: function (o) {
      if (!App.notify.enabled()) return;
      if (document.visibilityState === 'visible' && document.hasFocus()) return;
      var title = 'Yeni sipariş #' + o.id;
      var body = o.customer.name + ' · ' + o.address.neighborhood + ' Mah. · ' + App.utils.money(o.total) + ' · ' + o.payment.methodLabel;
      var opts = { body: body, icon: 'panel/icons/icon-192.png', badge: 'panel/icons/icon-192.png', tag: 'order-' + o.id, requireInteraction: true };
      function direct() {
        try { var n = new Notification(title, opts); n.onclick = function () { window.focus(); n.close(); }; } catch (e) { /* yok say */ }
      }
      if (swReg && swReg.showNotification) swReg.showNotification(title, opts).catch(direct);
      else direct();
    },
  };

  // ---------------- Başlat ----------------
  function boot() {
    App.ui.bindGlobal();
    App.router.start();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window.App = window.App || {});
