/**
 * iyzico Ödeme Formu (Checkout Form) entegrasyonu — bağımlılıksız
 * -----------------------------------------------------------------
 * Akış:
 *   1) initialize(order)  → iyzico ödeme sayfası adresi (paymentPageUrl)
 *   2) Müşteri kart bilgilerini iyzico'nun sayfasında girer (kart verisi bizim sunucumuza hiç gelmez)
 *   3) iyzico, müşteriyi callbackUrl'e POST ile geri gönderir (token)
 *   4) retrieve(token)    → ödeme sonucu (SUCCESS / FAILURE) sunucudan sunucuya doğrulanır
 *
 * Ortam değişkenleri:
 *   IYZICO_API_KEY, IYZICO_SECRET_KEY   iyzico panelinden (Ayarlar → Firma Ayarları)
 *   IYZICO_BASE_URL                     https://sandbox-api.iyzipay.com (test) | https://api.iyzipay.com (canlı)
 *   PUBLIC_URL                          Sitenin herkese açık adresi, ör. https://bumbase.com.tr
 */
'use strict';
const https = require('https');
const crypto = require('crypto');

const cfg = {
  apiKey: process.env.IYZICO_API_KEY || '',
  secretKey: process.env.IYZICO_SECRET_KEY || '',
  baseUrl: (process.env.IYZICO_BASE_URL || 'https://sandbox-api.iyzipay.com').replace(/\/$/, ''),
};

function enabled() { return !!(cfg.apiKey && cfg.secretKey); }
function isSandbox() { return /sandbox/.test(cfg.baseUrl); }

/** iyzico fiyat biçimi: "1180.0", "49.9" */
function price(n) {
  const s = String(Math.round(Number(n) * 100) / 100);
  return s.indexOf('.') === -1 ? s + '.0' : s;
}

/** IYZWSv2 yetkilendirme başlığı (HMAC-SHA256) */
function authHeaders(uriPath, bodyStr) {
  const rnd = Date.now() + crypto.randomBytes(6).toString('hex');
  const signature = crypto.createHmac('sha256', cfg.secretKey).update(rnd + uriPath + bodyStr).digest('hex');
  const auth = Buffer.from('apiKey:' + cfg.apiKey + '&randomKey:' + rnd + '&signature:' + signature).toString('base64');
  return { Authorization: 'IYZWSv2 ' + auth, 'x-iyzi-rnd': rnd };
}

function post(uriPath, body) {
  const bodyStr = JSON.stringify(body);
  const url = new URL(cfg.baseUrl + uriPath);
  const lib = url.protocol === 'http:' ? require('http') : https; // http yalnızca yerel test sunucusu için
  return new Promise((resolve, reject) => {
    const req = lib.request(url, {
      method: 'POST',
      headers: Object.assign({ 'Content-Type': 'application/json', Accept: 'application/json', 'Content-Length': Buffer.byteLength(bodyStr) }, authHeaders(uriPath, bodyStr)),
      timeout: 15000,
    }, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(new Error('iyzico yanıtı okunamadı (' + res.statusCode + ')')); }
      });
    });
    req.on('timeout', () => req.destroy(new Error('iyzico zaman aşımı')));
    req.on('error', reject);
    req.end(bodyStr);
  });
}

function splitName(full) {
  const parts = String(full || '').trim().split(/\s+/);
  const surname = parts.length > 1 ? parts.pop() : '-';
  return { name: parts.join(' ') || 'Müşteri', surname };
}

/**
 * @param order   buildOrder ile oluşturulmuş (henüz onaylanmamış) sipariş
 * @param ctx     { ip, callbackUrl, city, buyerEmail }
 */
async function initialize(order, ctx) {
  const n = splitName(order.customer.name);
  const a = order.address;
  const addressLine = a.neighborhood + ' Mah. ' + a.street + (a.apartment ? ' ' + a.apartment : '') + ' ' + a.zoneLabel;
  const addr = { contactName: order.customer.name, city: ctx.city || 'Ankara', country: 'Turkey', address: addressLine };
  const items = order.lines.map((l, i) => ({
    id: l.id + (l.portion ? '-' + l.portion : '') + '-' + i,
    name: (l.qty > 1 ? l.qty + 'x ' : '') + l.name + (l.portionLabel ? ' (' + l.portionLabel + ')' : ''),
    category1: 'Yemek', itemType: 'PHYSICAL', price: price(l.total),
  }));
  if (order.deliveryFee > 0) items.push({ id: 'teslimat', name: 'Teslimat ücreti', category1: 'Hizmet', itemType: 'VIRTUAL', price: price(order.deliveryFee) });

  const body = {
    locale: 'tr',
    conversationId: order.id,
    price: price(order.total),
    paidPrice: price(order.total),
    currency: 'TRY',
    basketId: order.id,
    paymentGroup: 'PRODUCT',
    callbackUrl: ctx.callbackUrl,
    enabledInstallments: [1],
    buyer: {
      id: 'TEL' + order.customer.phone.replace(/\D/g, ''),
      name: n.name, surname: n.surname,
      gsmNumber: '+9' + order.customer.phone.replace(/\D/g, ''),
      email: ctx.buyerEmail,
      identityNumber: '11111111111', // TC kimlik no toplanmıyor; iyzico bu durumda 11 haneli sabit değer kabul eder
      registrationAddress: addressLine, ip: ctx.ip || '85.34.78.112', city: addr.city, country: 'Turkey',
    },
    shippingAddress: addr,
    billingAddress: addr,
    basketItems: items,
  };
  const r = await post('/payment/iyzipos/checkoutform/initialize/auth/ecom', body);
  if (r.status !== 'success' || !r.paymentPageUrl) {
    const e = new Error('Ödeme sayfası açılamadı: ' + (r.errorMessage || 'bilinmeyen hata'));
    e.status = 502; e.iyzico = r; throw e;
  }
  return { token: r.token, paymentPageUrl: r.paymentPageUrl, expiresIn: r.tokenExpireTime };
}

/** Ödeme sonucunu iyzico'dan doğrular */
async function retrieve(token) {
  const r = await post('/payment/iyzipos/checkoutform/auth/ecom/detail', { locale: 'tr', token: token });
  return {
    ok: r.status === 'success' && r.paymentStatus === 'SUCCESS' && (r.fraudStatus === undefined || r.fraudStatus === 1),
    basketId: r.basketId,
    conversationId: r.conversationId,
    paidPrice: Number(r.paidPrice),
    paymentId: r.paymentId,
    last4: r.lastFourDigits || null,
    brand: ({ VISA: 'visa', MASTER_CARD: 'mastercard', AMERICAN_EXPRESS: 'amex', TROY: 'troy' })[r.cardAssociation] || null,
    error: r.errorMessage || (r.paymentStatus && r.paymentStatus !== 'SUCCESS' ? 'Ödeme onaylanmadı.' : null),
    raw: r,
  };
}

module.exports = { cfg, enabled, isSandbox, initialize, retrieve, price };
