/**
 * Ödeme servisi — sanal POS soyutlaması.
 * Sayfalar yalnızca bu arayüzü kullanır; sağlayıcı (mock / iyzico / Stripe) değiştiğinde
 * sayfa kodu değişmez.
 *
 *   createIntent({ lines, zone })      → { id, amount(kuruş), currency, status }
 *   confirm(intentId, card)            → { status: 'succeeded'|'requires_action'|'failed'|'invalid', ... }
 *   complete3DS(intentId, code)        → { status: 'succeeded'|'requires_action'|'failed', error? }
 *
 * Not: Tutarı istemci belirlemez; sepet sunucuda (veya demo modunda ortak fiyat
 * modülünde) yeniden hesaplanır.
 */
(function (App) {
  var mock = App.paymentMock;
  var U = App.utils;

  var local = {
    createIntent: function (p) {
      return U.wait(350).then(function () {
        var priced = App.pricing.priceCart(p.lines, p.zone);
        return mock.createIntent({ amount: priced.total, currency: 'TRY' });
      });
    },
    confirm: function (id, card) { return U.wait(900).then(function () { return mock.confirmIntent(id, card); }); },
    complete3DS: function (id, code) { return U.wait(700).then(function () { return mock.completeThreeDS(id, code); }); },
  };

  var remote = {
    createIntent: function (p) { return App.api.http('POST', '/api/payments/intent', { lines: p.lines, zone: p.zone }); },
    confirm: function (id, card) { return App.api.http('POST', '/api/payments/' + encodeURIComponent(id) + '/confirm', { card: card }); },
    complete3DS: function (id, code) { return App.api.http('POST', '/api/payments/' + encodeURIComponent(id) + '/3ds', { code: code }); },
  };

  function impl() { return App.api.mode === 'remote' ? remote : local; }

  App.payments = {
    createIntent: function (p) { return App.api.ready.then(function () { return impl().createIntent(p); }); },
    confirm: function (id, card) { return App.api.ready.then(function () { return impl().confirm(id, card); }); },
    complete3DS: function (id, code) { return App.api.ready.then(function () { return impl().complete3DS(id, code); }); },
    detectBrand: mock.detectBrand,
    validateCard: mock.validateCard,
    testCards: [
      { number: '4242 4242 4242 4242', result: 'Başarılı' },
      { number: '4000 0000 0000 3220', result: '3D Secure (kod: ' + mock.THREE_DS_CODE + ')' },
      { number: '4000 0000 0000 0002', result: 'Banka reddi' },
    ],
  };
})(window.App = window.App || {});
