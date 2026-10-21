/**
 * MOCK SANAL POS
 * -----------------------------------------------------------------
 * iyzico / Stripe akışını taklit eder:
 *   1) createIntent   → ödeme oturumu açılır (Stripe PaymentIntent / iyzico Checkout token)
 *   2) confirmIntent  → kart bilgileri ile onay istenir
 *   3) requires_action→ 3D Secure doğrulaması (SMS kodu)
 *   4) completeThreeDS→ sonuç: succeeded | failed
 *
 * GERÇEK ENTEGRASYON: Bu dosyadaki fonksiyonların imzası korunarak
 * server/server.js içinde iyzipay veya stripe SDK çağrılarına yönlendirilir.
 * Kart numarası asla kendi sunucunuzda saklanmamalıdır (PCI-DSS).
 *
 * TEST KARTLARI (son kullanma: gelecekte herhangi bir tarih, CVC: herhangi 3 hane)
 *   4242 4242 4242 4242 → Başarılı (3D Secure yok)
 *   4000 0000 0000 3220 → 3D Secure ister (SMS kodu: 123456)
 *   4000 0000 0000 0002 → Banka reddi
 *   4000 0000 0000 9995 → Yetersiz bakiye
 *   Diğer geçerli kartlar → 3D Secure ister
 */
(function (root, factory) {
  var mod = factory();
  if (typeof module === 'object' && module.exports) module.exports = mod;
  else { root.App = root.App || {}; root.App.paymentMock = mod; }
})(typeof self !== 'undefined' ? self : this, function () {
  var THREE_DS_CODE = '123456';
  var intents = {};

  function digits(s) { return (s || '').toString().replace(/\D/g, ''); }

  function luhn(num) {
    var n = digits(num);
    if (n.length < 12) return false;
    var sum = 0, alt = false;
    for (var i = n.length - 1; i >= 0; i--) {
      var d = parseInt(n.charAt(i), 10);
      if (alt) { d *= 2; if (d > 9) d -= 9; }
      sum += d; alt = !alt;
    }
    return sum % 10 === 0;
  }

  function detectBrand(num) {
    var n = digits(num);
    if (/^4/.test(n)) return 'visa';
    if (/^(5[1-5]|2[2-7])/.test(n)) return 'mastercard';
    if (/^9792/.test(n)) return 'troy';
    if (/^3[47]/.test(n)) return 'amex';
    return 'unknown';
  }

  function validateCard(card, now) {
    now = now || new Date();
    var e = {};
    var n = digits(card.number);
    var brand = detectBrand(n);
    var len = brand === 'amex' ? 15 : 16;
    if (n.length !== len || !luhn(n)) e.number = 'Kart numarası geçersiz. 16 haneyi kontrol edin.';
    if (!card.name || card.name.trim().length < 3) e.name = 'Kart üzerindeki adı yazın.';
    var m = parseInt(card.expMonth, 10), y = parseInt(card.expYear, 10);
    if (y < 100) y += 2000;
    if (!m || m < 1 || m > 12 || !y) e.exp = 'Son kullanma tarihini AA/YY biçiminde yazın.';
    else {
      var end = new Date(y, m, 1); // ayın son gününden sonraki ilk an
      if (end <= now) e.exp = 'Kartın son kullanma tarihi geçmiş.';
    }
    var cvc = digits(card.cvc);
    if (cvc.length !== (brand === 'amex' ? 4 : 3)) e.cvc = 'CVC kartın arkasındaki ' + (brand === 'amex' ? '4' : '3') + ' hanedir.';
    return e;
  }

  function rid(prefix) {
    return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function createIntent(opts) {
    var amount = Math.round(Number(opts.amount) * 100); // kuruş
    if (!amount || amount <= 0) throw new Error('Geçersiz tutar');
    var intent = {
      id: rid('pi_mock'),
      amount: amount,
      currency: opts.currency || 'TRY',
      orderRef: opts.orderRef || null,
      status: 'requires_confirmation',
      clientSecret: rid('secret'),
      createdAt: new Date().toISOString(),
    };
    intents[intent.id] = intent;
    return publicIntent(intent);
  }

  function publicIntent(i) {
    return { id: i.id, amount: i.amount, currency: i.currency, status: i.status, clientSecret: i.clientSecret,
      last4: i.last4 || null, brand: i.brand || null, error: i.error || null };
  }

  function confirmIntent(intentId, card) {
    var intent = intents[intentId];
    if (!intent) return { status: 'failed', error: 'Ödeme oturumu bulunamadı. Sayfayı yenileyip tekrar deneyin.' };
    var errs = validateCard(card);
    if (Object.keys(errs).length) return { status: 'invalid', fieldErrors: errs };
    var n = digits(card.number);
    intent.last4 = n.slice(-4);
    intent.brand = detectBrand(n);
    if (n === '4000000000000002') { intent.status = 'failed'; intent.error = 'Kartınız banka tarafından reddedildi. Başka bir kart deneyin veya kapıda ödemeyi seçin.'; }
    else if (n === '4000000000009995') { intent.status = 'failed'; intent.error = 'Kart limitiniz bu işlem için yetersiz.'; }
    else if (n === '4242424242424242') { intent.status = 'succeeded'; }
    else { intent.status = 'requires_action'; intent.threeDS = { phoneHint: '*** *** ** ' + (10 + (parseInt(intent.last4, 10) % 89)) }; }
    var out = publicIntent(intent);
    if (intent.threeDS) out.threeDS = intent.threeDS;
    return out;
  }

  function completeThreeDS(intentId, code) {
    var intent = intents[intentId];
    if (!intent || intent.status !== 'requires_action') return { status: 'failed', error: 'Doğrulama oturumu geçersiz.' };
    intent.tries = (intent.tries || 0) + 1;
    if (digits(code) === THREE_DS_CODE) { intent.status = 'succeeded'; return publicIntent(intent); }
    if (intent.tries >= 3) { intent.status = 'failed'; intent.error = 'Doğrulama kodu 3 kez hatalı girildi. Ödeme iptal edildi.'; return publicIntent(intent); }
    return { status: 'requires_action', error: 'Kod hatalı. Kalan deneme: ' + (3 - intent.tries) };
  }

  function getIntent(id) { return intents[id] ? publicIntent(intents[id]) : null; }

  return {
    luhn: luhn,
    detectBrand: detectBrand,
    validateCard: validateCard,
    createIntent: createIntent,
    confirmIntent: confirmIntent,
    completeThreeDS: completeThreeDS,
    getIntent: getIntent,
    THREE_DS_CODE: THREE_DS_CODE,
  };
});
