/* Menü Sayfası */
(function (App) {
  var U = App.utils, esc = U.esc, I = App.ui.I;
  var filters = { q: '', tags: [] };

  function matches(item) {
    if (filters.tags.length && !filters.tags.every(function (t) { return (item.tags || []).indexOf(t) >= 0; })) return false;
    if (!filters.q) return true;
    var q = filters.q.toLocaleLowerCase('tr');
    return (item.name + ' ' + item.desc).toLocaleLowerCase('tr').indexOf(q) >= 0;
  }

  /** Kategorinin kapak görseli (menu.js → categories[].cover ürününün fotoğrafı) */
  function catThumb(c, cls) {
    var item = c.cover && App.pricing.findItem(c.cover);
    if (!item) return '';
    return '<span class="' + cls + (item.imageKind === 'product' ? ' is-product' : '') + '" aria-hidden="true">' + App.illustrations.itemMedia(item) + '</span>';
  }

  function sections() {
    var html = '', total = 0;
    App.menu.categories.forEach(function (c) {
      var items = App.menu.items.filter(function (i) { return i.cat === c.id && matches(i); });
      total += items.length;
      if (!items.length) return;
      html += '<section class="menu-section" id="cat-' + c.id + '" data-cat="' + c.id + '">' +
        '<header class="menu-section-head">' + catThumb(c, 'sec-thumb') + '<div><h2 class="menu-section-title">' + esc(c.label) + '</h2><p class="muted">' + esc(c.blurb) + '</p></div><span class="sec-count num">' + items.length + ' ürün</span></header>' +
        '<div class="dish-grid">' + items.map(function (i) { return App.ui.productCard(i); }).join('') + '</div></section>';
    });
    if (!total) html = '<div class="empty"><h3>Aramanıza uygun ürün bulunamadı</h3><p class="muted">Farklı bir kelime deneyin veya filtreleri temizleyin.</p><button class="btn btn-ghost" data-menu="reset">Filtreleri temizle</button></div>';
    return html;
  }

  function render() {
    var cats = App.menu.categories.map(function (c) {
      var n = App.menu.items.filter(function (i) { return i.cat === c.id; }).length;
      return '<a href="#menu-' + c.id + '" class="cat-chip" data-cat-link="' + c.id + '">' + catThumb(c, 'cat-thumb') + '<span class="cat-label">' + esc(c.label) + '</span><b class="cat-count num">' + n + '</b></a>';
    }).join('');
    var tagChips = ['acili', 'vejetaryen', 'sef'].map(function (t) {
      return '<button class="filter-chip' + (filters.tags.indexOf(t) >= 0 ? ' is-on' : '') + '" data-tag="' + t + '" aria-pressed="' + (filters.tags.indexOf(t) >= 0) + '">' + esc(App.menu.tags[t].label) + '</button>';
    }).join('');
    return '' +
      '<section class="page-hero page-hero--menu">' +
      '  <div class="container"><p class="eyebrow">Paket servis menüsü</p><h1 class="display-md">Menü</h1>' +
      '  <p class="lead">Fiyatlara KDV dahildir. Pizzalarda listede orta boy fiyatı gösterilir; dev boyu ürünü eklerken seçebilirsiniz.</p></div>' +
      '</section>' +
      '<div class="menu-toolbar">' +
      '  <div class="container menu-toolbar-inner">' +
      '    <nav class="cat-scroller" aria-label="Kategoriler">' + cats + '</nav>' +
      '    <div class="menu-filters">' +
      '      <label class="search"><span class="sr-only">Menüde ara</span>' + I.search + '<input id="menu-search" type="search" placeholder="Menüde ara: margarita, cheeseburger, ranch…" value="' + esc(filters.q) + '" autocomplete="off"></label>' +
      '      <div class="filter-chips">' + tagChips + '</div>' +
      '    </div>' +
      '  </div>' +
      '</div>' +
      '<div class="container menu-body" id="menu-sections">' + sections() + '</div>';
  }

  App.router.register('menu', {
    title: 'Menü',
    keepScroll: true,
    render: render,
    mount: function (root, param) {
      var box = U.$('#menu-sections', root);
      var observer = null;

      function setActive(id) {
        U.$$('[data-cat-link]', root).forEach(function (a) {
          var on = a.getAttribute('data-cat-link') === id;
          a.classList.toggle('is-active', on);
          if (on && a.scrollIntoView) {
            var sc = a.parentNode;
            sc.scrollTo({ left: a.offsetLeft - sc.clientWidth / 2 + a.clientWidth / 2, behavior: 'smooth' });
          }
        });
      }

      function spy() {
        if (observer) observer.disconnect();
        if (!('IntersectionObserver' in window)) return;
        observer = new IntersectionObserver(function (entries) {
          entries.forEach(function (en) { if (en.isIntersecting) setActive(en.target.getAttribute('data-cat')); });
        }, { rootMargin: '-35% 0px -60% 0px' });
        U.$$('.menu-section', box).forEach(function (s) { observer.observe(s); });
      }

      function rerender() { box.innerHTML = sections(); spy(); }

      function scrollToCat(id, smooth) {
        var el = U.$('#cat-' + id, root);
        if (!el) return;
        // Yapışkan başlık + kategori çubuğunun altına hizala
        var hdr = document.getElementById('site-header'), bar = U.$('.menu-toolbar', root);
        var offset = (hdr ? hdr.offsetHeight : 0) + (bar ? bar.offsetHeight : 0) + 12;
        window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - offset, behavior: smooth ? 'smooth' : 'auto' });
      }

      spy();
      if (param) setTimeout(function () { scrollToCat(param, false); setActive(param); }, 30);
      else window.scrollTo(0, 0);

      var onSearch = U.debounce(function (e) { filters.q = e.target.value.trim(); rerender(); }, 160);
      var search = U.$('#menu-search', root);
      search.addEventListener('input', onSearch);

      function onClick(e) {
        var link = e.target.closest('[data-cat-link]');
        if (link) {
          e.preventDefault();
          var id = link.getAttribute('data-cat-link');
          scrollToCat(id, true); setActive(id);
          try { history.replaceState(null, '', '#menu-' + id); } catch (err) { /* sandbox */ }
          return;
        }
        var chip = e.target.closest('[data-tag]');
        if (chip) {
          var t = chip.getAttribute('data-tag');
          var i = filters.tags.indexOf(t);
          if (i >= 0) filters.tags.splice(i, 1); else filters.tags.push(t);
          chip.classList.toggle('is-on', i < 0); chip.setAttribute('aria-pressed', String(i < 0));
          rerender(); return;
        }
        if (e.target.closest('[data-menu="reset"]')) {
          filters = { q: '', tags: [] }; search.value = '';
          U.$$('[data-tag]', root).forEach(function (c) { c.classList.remove('is-on'); c.setAttribute('aria-pressed', 'false'); });
          rerender();
        }
      }
      root.addEventListener('click', onClick);
      var unsub = App.store.subscribe(function (s, a, prev) { if (s.cart !== prev.cart) App.ui.refreshCardBadges(root); });

      return function () { if (observer) observer.disconnect(); root.removeEventListener('click', onClick); unsub(); };
    },
  });
})(window.App = window.App || {});
