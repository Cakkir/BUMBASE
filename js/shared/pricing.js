/**
 * Fiyat hesaplama — tarayıcı ve sunucu aynı kodu kullanır.
 * Sunucu, istemciden gelen fiyatlara güvenmez; sepeti bu fonksiyonla yeniden hesaplar.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory;
  else { root.App = root.App || {}; root.App.pricing = factory(root.App.menu, root.App.config); }
})(typeof self !== 'undefined' ? self : this, function (menu, config) {
  var byId = {};
  menu.items.forEach(function (it) { byId[it.id] = it; });

  function round2(n) { return Math.round(n * 100) / 100; }

  function findItem(id) { return byId[id] || null; }

  function defaultPortion(item) {
    return item && item.portions ? item.portions[0].id : null;
  }

  function portionOf(item, portionId) {
    if (!item || !item.portions) return null;
    for (var i = 0; i < item.portions.length; i++) if (item.portions[i].id === portionId) return item.portions[i];
    return item.portions[0];
  }

  function unitPrice(item, portionId) {
    if (!item) return 0;
    var p = portionOf(item, portionId);
    return p ? p.price : item.price;
  }

  /** Ürünün listede gösterilecek "başlangıç" fiyatı */
  function fromPrice(item) {
    if (!item.portions) return item.price;
    return Math.min.apply(null, item.portions.map(function (p) { return p.price; }));
  }

  function zoneById(zoneId) {
    var zones = config.delivery.zones;
    for (var i = 0; i < zones.length; i++) if (zones[i].id === zoneId) return zones[i];
    return null;
  }

  /**
   * @param lines  [{ id, portion, qty, note }]
   * @param zoneId teslimat bölgesi (opsiyonel)
   */
  function priceCart(lines, zoneId) {
    var d = config.delivery;
    var out = [];
    var errors = [];
    (lines || []).forEach(function (l) {
      var item = byId[l.id];
      var qty = Math.max(0, Math.min(50, parseInt(l.qty, 10) || 0));
      if (!item) { errors.push('Menüde bulunmayan ürün: ' + l.id); return; }
      if (!qty) return;
      var p = portionOf(item, l.portion);
      var unit = p ? p.price : item.price;
      out.push({
        id: item.id,
        name: item.name,
        portion: p ? p.id : null,
        portionLabel: p ? p.label : null,
        qty: qty,
        unit: unit,
        total: round2(unit * qty),
        note: (l.note || '').toString().slice(0, 140),
      });
    });

    var subtotal = round2(out.reduce(function (s, l) { return s + l.total; }, 0));
    var zone = zoneById(zoneId);
    var zoneFee = zone ? zone.extraFee : 0;
    // fee 0 → teslimat her zaman ücretsiz; freeOver > 0 ise o tutarın üzerinde ücretsiz
    var baseFee = !d.fee || (d.freeOver > 0 && subtotal >= d.freeOver) ? 0 : d.fee;
    var deliveryFee = subtotal > 0 ? round2(baseFee + zoneFee) : 0;
    var meetsMinimum = subtotal >= d.minOrder;

    return {
      lines: out,
      itemCount: out.reduce(function (s, l) { return s + l.qty; }, 0),
      subtotal: subtotal,
      baseFee: subtotal > 0 ? baseFee : 0,
      zoneFee: subtotal > 0 ? zoneFee : 0,
      deliveryFee: deliveryFee,
      total: round2(subtotal + deliveryFee),
      freeDeliveryLeft: d.fee && d.freeOver > 0 ? Math.max(0, round2(d.freeOver - subtotal)) : 0,
      minOrderLeft: Math.max(0, round2(d.minOrder - subtotal)),
      meetsMinimum: meetsMinimum,
      errors: errors,
    };
  }

  return {
    findItem: findItem,
    defaultPortion: defaultPortion,
    portionOf: portionOf,
    unitPrice: unitPrice,
    fromPrice: fromPrice,
    zoneById: zoneById,
    priceCart: priceCart,
    round2: round2,
  };
});
