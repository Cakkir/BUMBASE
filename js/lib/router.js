/**
 * Hash tabanlı yönlendirici. Her statik hostingte (ve dosyadan açıldığında) çalışır.
 *   #            → ana sayfa
 *   #menu        → menü   (#menu-corbalar → menüde ilgili kategoriye kaydırır)
 *   #sepet, #odeme, #iletisim, #admin
 *   #siparis-KZ12345 → sipariş takibi
 * Sayfa modülü sözleşmesi: { title, render(param) → html, mount(root, param) → cleanup? }
 */
(function (App) {
  var routes = {};
  var current = { name: null, cleanup: null };
  var listeners = [];

  function register(name, page) { routes[name] = page; }

  function parse() {
    var h = decodeURIComponent((location.hash || '').replace(/^#\/?/, ''));
    if (!h) return { name: (App.config.startPage && routes[App.config.startPage]) ? App.config.startPage : 'home', param: null };
    if (h === 'anasayfa') return { name: 'home', param: null };
    if (routes[h]) return { name: h, param: null };
    var dash = h.indexOf('-');
    if (dash > 0 && routes[h.slice(0, dash)]) return { name: h.slice(0, dash), param: h.slice(dash + 1) };
    return { name: 'notfound', param: h };
  }

  function go(hash) {
    var target = '#' + (hash || '');
    if (location.hash === target || (!hash && !location.hash)) render();
    else location.hash = target;
  }

  function render() {
    var r = parse();
    var page = routes[r.name] || routes.notfound || routes[App.config.startPage];
    var view = document.getElementById('view');
    var sameRoute = current.name === r.name;
    if (current.cleanup) { try { current.cleanup(); } catch (e) { console.error(e); } }
    current = { name: r.name, cleanup: null, param: r.param };

    document.body.setAttribute('data-route', r.name);
    view.innerHTML = page.render(r.param);
    var cleanup = page.mount ? page.mount(view, r.param) : null;
    current.cleanup = typeof cleanup === 'function' ? cleanup : null;

    var name = App.config.restaurant.name;
    var seo = App.config.restaurant.seoTitle || App.config.restaurant.tagline;
    var pt = page.title ? (typeof page.title === 'function' ? page.title(r.param) : page.title) : '';
    document.title = (pt ? pt + ' · ' : '') + name + ' · ' + seo;
    if (!(sameRoute && page.keepScroll)) window.scrollTo(0, 0);
    view.focus({ preventScroll: true });
    listeners.forEach(function (fn) { fn(r); });
  }

  function onChange(fn) { listeners.push(fn); }

  function start() {
    window.addEventListener('hashchange', render);
    render();
  }

  App.router = { register: register, go: go, start: start, onChange: onChange, current: function () { return current; } };
})(window.App = window.App || {});
