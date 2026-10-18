/**
 * Merkezi state yönetimi (Redux benzeri, bağımlılıksız)
 * -----------------------------------------------------------------
 * - dispatch(action) → reducer → yeni state → aboneler bilgilendirilir
 * - Sepet localStorage'a yazılır ve sekmeler arasında eşitlenir
 */
(function (App) {
  var U = App.utils;
  var CART_KEY = 'koz.cart.v1';
  var UI_KEY = 'koz.ui.v1';

  function createStore(reducer, initial) {
    var state = initial;
    var subs = [];
    return {
      getState: function () { return state; },
      dispatch: function (action) {
        var prev = state;
        state = reducer(state, action);
        if (state !== prev) subs.slice().forEach(function (fn) { fn(state, action, prev); });
        return action;
      },
      subscribe: function (fn) {
        subs.push(fn);
        return function () { subs = subs.filter(function (s) { return s !== fn; }); };
      },
    };
  }

  function lineKey(id, portion) { return id + '|' + (portion || ''); }

  function cartReducer(items, a) {
    switch (a.type) {
      case 'CART_ADD': {
        var key = lineKey(a.id, a.portion);
        var found = false;
        var next = items.map(function (l) {
          if (l.key !== key) return l;
          found = true;
          return Object.assign({}, l, { qty: Math.min(50, l.qty + (a.qty || 1)), note: a.note || l.note });
        });
        if (!found) next = next.concat([{ key: key, id: a.id, portion: a.portion || null, qty: a.qty || 1, note: a.note || '' }]);
        return next;
      }
      case 'CART_SET_QTY':
        if (a.qty <= 0) return items.filter(function (l) { return l.key !== a.key; });
        return items.map(function (l) { return l.key === a.key ? Object.assign({}, l, { qty: Math.min(50, a.qty) }) : l; });
      case 'CART_SET_PORTION': {
        var src = items.filter(function (l) { return l.key === a.key; })[0];
        if (!src) return items;
        var newKey = lineKey(src.id, a.portion);
        var rest = items.filter(function (l) { return l.key !== a.key; });
        var merged = false;
        rest = rest.map(function (l) {
          if (l.key !== newKey) return l;
          merged = true;
          return Object.assign({}, l, { qty: Math.min(50, l.qty + src.qty) });
        });
        if (!merged) {
          var idx = items.indexOf(src);
          rest.splice(idx, 0, Object.assign({}, src, { key: newKey, portion: a.portion }));
        }
        return rest;
      }
      case 'CART_SET_NOTE':
        return items.map(function (l) { return l.key === a.key ? Object.assign({}, l, { note: (a.note || '').slice(0, 140) }) : l; });
      case 'CART_REMOVE':
        return items.filter(function (l) { return l.key !== a.key; });
      case 'CART_CLEAR':
        return [];
      case 'CART_HYDRATE':
        return Array.isArray(a.items) ? a.items : items;
      default:
        return items;
    }
  }

  function uiReducer(ui, a) {
    if (a.type === 'UI_SET') return Object.assign({}, ui, a.patch);
    return ui;
  }

  function rootReducer(state, a) {
    var cart = cartReducer(state.cart, a);
    var ui = uiReducer(state.ui, a);
    if (cart === state.cart && ui === state.ui) return state;
    return { cart: cart, ui: ui };
  }

  var savedUi = U.storage.get(UI_KEY, {});
  var store = createStore(rootReducer, {
    cart: U.storage.get(CART_KEY, []).filter(function (l) { return App.pricing.findItem(l.id); }),
    ui: { cartOpen: false, zone: App.pricing.zoneById(savedUi.zone) ? savedUi.zone : App.config.delivery.zones[0].id },
  });

  // Kalıcılık
  store.subscribe(function (s, a, prev) {
    if (s.cart !== prev.cart && a.type !== 'CART_HYDRATE') U.storage.set(CART_KEY, s.cart);
    if (s.ui.zone !== prev.ui.zone) U.storage.set(UI_KEY, { zone: s.ui.zone });
  });

  // Başka sekmede sepet değişirse eşitle
  window.addEventListener('storage', function (e) {
    if (e.key === CART_KEY) store.dispatch({ type: 'CART_HYDRATE', items: U.storage.get(CART_KEY, []) });
  });

  // ---- Seçiciler (selectors) ----
  var cart = {
    lines: function () { return store.getState().cart; },
    summary: function (zoneId) {
      var s = store.getState();
      return App.pricing.priceCart(s.cart, zoneId === undefined ? s.ui.zone : zoneId);
    },
    count: function () { return store.getState().cart.reduce(function (n, l) { return n + l.qty; }, 0); },
    qtyOf: function (id, portion) {
      var k = lineKey(id, portion);
      var l = store.getState().cart.filter(function (x) { return x.key === k; })[0];
      return l ? l.qty : 0;
    },
    add: function (id, portion, qty, note) { store.dispatch({ type: 'CART_ADD', id: id, portion: portion, qty: qty || 1, note: note }); },
    setQty: function (key, qty) { store.dispatch({ type: 'CART_SET_QTY', key: key, qty: qty }); },
    remove: function (key) { store.dispatch({ type: 'CART_REMOVE', key: key }); },
    clear: function () { store.dispatch({ type: 'CART_CLEAR' }); },
    key: lineKey,
  };

  App.store = store;
  App.cart = cart;
  App.createStore = createStore;
})(window.App = window.App || {});
