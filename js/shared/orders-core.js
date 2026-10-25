/**
 * Sipariş modeli: durumlar, doğrulama ve sipariş nesnesinin oluşturulması.
 * Tarayıcı (demo modu) ve Node.js sunucusu aynı kuralları kullanır.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory;
  else { root.App = root.App || {}; root.App.ordersCore = factory(root.App.pricing, root.App.config); }
})(typeof self !== 'undefined' ? self : this, function (pricing, config) {
  var STATUSES = [
    { id: 'yeni', label: 'Yeni', customerLabel: 'Sipariş alındı' },
    { id: 'hazirlaniyor', label: 'Hazırlanıyor', customerLabel: 'Mutfakta hazırlanıyor' },
    { id: 'yolda', label: 'Yolda', customerLabel: 'Kurye yolda' },
    { id: 'teslim', label: 'Teslim edildi', customerLabel: 'Teslim edildi' },
    { id: 'iptal', label: 'İptal', customerLabel: 'İptal edildi' },
  ];
  var NEXT = { yeni: 'hazirlaniyor', hazirlaniyor: 'yolda', yolda: 'teslim' };
  var METHODS = {};
  config.payment.methods.forEach(function (m) { METHODS[m.id] = m; });

  function statusLabel(id) {
    for (var i = 0; i < STATUSES.length; i++) if (STATUSES[i].id === id) return STATUSES[i];
    return { id: id, label: id, customerLabel: id };
  }

  function clean(s, max) { return (s == null ? '' : String(s)).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max || 200); }

  function normalizePhone(p) {
    var d = clean(p, 30).replace(/\D/g, '');
    if (d.indexOf('90') === 0 && d.length === 12) d = d.slice(2);
    if (d.charAt(0) === '0') d = d.slice(1);
    return d;
  }

  function validateCheckout(p) {
    var e = {};
    p = p || {};
    var c = p.customer || {}, a = p.address || {};
    if (clean(c.name).length < 3) e.name = 'Adınızı ve soyadınızı yazın.';
    var ph = normalizePhone(c.phone);
    if (!/^5\d{9}$/.test(ph)) e.phone = 'Cep telefonunu 05XX XXX XX XX biçiminde yazın.';
    if (!pricing.zoneById(a.zone)) e.zone = 'Teslimat bölgesini seçin.';
    var hoods = config.delivery.neighborhoods;
    if (hoods && hoods.length ? hoods.indexOf(clean(a.neighborhood)) < 0 : clean(a.neighborhood).length < 2) e.neighborhood = 'Teslimat yapılan mahallelerden birini seçin.';
    if (clean(a.street).length < 3) e.street = 'Cadde / sokak ve bina numarasını yazın.';
    if (!METHODS[p.paymentMethod]) e.paymentMethod = 'Bir ödeme yöntemi seçin.';
    if (p.schedule && p.schedule.type === 'later' && !/^\d{2}:\d{2}$/.test(p.schedule.time || '')) e.scheduleTime = 'Teslimat saatini seçin.';
    if (!p.acceptTerms) e.acceptTerms = 'Devam etmek için mesafeli satış sözleşmesini onaylayın.';
    var priced = pricing.priceCart(p.lines, a.zone);
    if (!priced.lines.length) e.cart = 'Sepetiniz boş.';
    else if (!priced.meetsMinimum) e.cart = 'Minimum sipariş tutarına ' + priced.minOrderLeft + ' TL kaldı.';
    return e;
  }

  function makeId(existing) {
    var id;
    do { id = 'BB' + Math.floor(10000 + Math.random() * 90000); } while (existing && existing[id]);
    return id;
  }

  /**
   * @param p        istemciden gelen ödeme formu
   * @param payment  doğrulanmış ödeme bilgisi: { status:'paid'|'pending', intentId, last4, brand }
   * @param existing { [id]: true } benzersiz numara üretimi için
   */
  function buildOrder(p, payment, existing) {
    var priced = pricing.priceCart(p.lines, p.address.zone);
    var now = new Date().toISOString();
    var a = p.address, c = p.customer;
    var zone = pricing.zoneById(a.zone);
    return {
      id: makeId(existing),
      createdAt: now,
      status: 'yeni',
      timeline: [{ status: 'yeni', at: now }],
      customer: { name: clean(c.name, 80), phone: '0' + normalizePhone(c.phone) },
      address: {
        zone: zone.id,
        zoneLabel: zone.label,
        neighborhood: clean(a.neighborhood, 80),
        street: clean(a.street, 160),
        apartment: clean(a.apartment, 60),
        directions: clean(a.directions, 200),
      },
      note: clean(p.note, 300),
      schedule: p.schedule && p.schedule.type === 'later' ? { type: 'later', time: p.schedule.time } : { type: 'asap' },
      cutlery: !!p.cutlery,
      source: config.sources && config.sources[p.source] ? p.source : 'direkt',
      payment: {
        method: p.paymentMethod,
        methodLabel: METHODS[p.paymentMethod].label,
        status: payment.status, // 'paid' | 'pending' (kapıda)
        intentId: payment.intentId || null,
        last4: payment.last4 || null,
        brand: payment.brand || null,
      },
      lines: priced.lines,
      subtotal: priced.subtotal,
      deliveryFee: priced.deliveryFee,
      total: priced.total,
    };
  }

  function applyStatus(order, status) {
    if (!statusLabel(status) || order.status === status) return order;
    order.status = status;
    order.timeline = (order.timeline || []).concat([{ status: status, at: new Date().toISOString() }]);
    return order;
  }

  return {
    STATUSES: STATUSES,
    NEXT: NEXT,
    statusLabel: statusLabel,
    validateCheckout: validateCheckout,
    buildOrder: buildOrder,
    applyStatus: applyStatus,
    normalizePhone: normalizePhone,
  };
});
