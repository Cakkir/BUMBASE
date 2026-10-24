/**
 * BUM BASE — Sipariş sunucusu (bağımlılıksız Node.js)
 * -----------------------------------------------------------------
 *   node server/server.js                         → http://localhost:3000 (geliştirme)
 *   NODE_ENV=production ADMIN_PIN=... node server/server.js   (yayın)
 *
 * Ortam değişkenleri (tamamı için .env.example dosyasına bakın):
 *   PORT, NODE_ENV, ADMIN_PIN, DATA_DIR, PUBLIC_URL, TRUST_PROXY
 *   IYZICO_API_KEY, IYZICO_SECRET_KEY, IYZICO_BASE_URL, IYZICO_BUYER_EMAIL
 *   PRINTER_HOST, PRINTER_PORT, PRINTER_PAPER, PRINTER_CHARSET, PRINTER_CODEPAGE, PRINTER_COPIES, PRINTER_AUTO
 *
 * Uç noktalar:
 *   GET    /api/health
 *   POST   /api/orders                     kapıda ödeme siparişi (veya geliştirmede mock kart)
 *   POST   /api/checkout/iyzico            online kart: iyzico ödeme sayfası adresini döner
 *   POST   /api/payments/iyzico/callback   iyzico dönüşü (müşteri tarayıcısı buraya yönlenir)
 *   GET    /api/orders/:id                 müşteri sipariş takibi
 *   GET    /api/orders              [x-admin-pin]
 *   PATCH  /api/orders/:id          [x-admin-pin] { status }
 *   GET    /api/stream?pin=                SSE canlı akış
 *   GET    /api/store-status               sipariş alımı durumu ve tükenen ürünler
 *   PATCH  /api/store-status       [x-admin-pin] { paused?, soldOut? }
 *   GET    /api/printer, POST /api/print/:id, POST /api/print-test   [x-admin-pin]
 *   POST   /api/payments/intent | /:id/confirm | /:id/3ds   (yalnızca geliştirme: mock sanal POS)
 */
'use strict';
// Fiş ve kayıt saatleri Türkiye saatiyle (sunucu yurt dışında olsa bile)
process.env.TZ = process.env.TZ || 'Europe/Istanbul';
const http = require('http');
const fs = require('fs');
const path = require('path');

const PROD = process.env.NODE_ENV === 'production';
const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'orders.json');
const PENDING_FILE = path.join(DATA_DIR, 'pending-payments.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'store-status.json');
const TRUST_PROXY = process.env.TRUST_PROXY ? process.env.TRUST_PROXY === '1' || process.env.TRUST_PROXY === 'true' : PROD;

const config = require('../js/config.js');
const menu = require('../js/data/menu.js');
const pricing = require('../js/shared/pricing.js')(menu, config);
const core = require('../js/shared/orders-core.js')(pricing, config);
const avail = require('../js/shared/availability.js')(config, menu);
const mockPay = require('../js/shared/payment-mock.js');
const printer = require('./printer.js');
const iyzico = require('./iyzico.js');
const R = config.restaurant;
const RECEIPT_HEAD = { name: R.name, tagline: R.tagline, address: R.address, phone: R.phone, city: R.city };

const PORT = Number(process.env.PORT) || 3000;

// ---------------------------------------------------------------- başlangıç kontrolleri
const ADMIN_PIN = process.env.ADMIN_PIN || (PROD ? '' : config.admin.pin);
if (PROD && (!ADMIN_PIN || ADMIN_PIN.length < 6 || ADMIN_PIN === config.admin.pin)) {
  console.error('\n[HATA] Yayın modunda ADMIN_PIN ortam değişkeni zorunludur (en az 6 karakter, 1234 olamaz).\n');
  process.exit(1);
}
if (!process.env.ADMIN_PIN) console.warn('[uyarı] ADMIN_PIN verilmedi; geliştirme PIN’i kullanılıyor (' + ADMIN_PIN + ').');

// Ödeme sağlayıcısı: iyzico anahtarı varsa iyzico; yayında anahtar yoksa online kart kapalı; geliştirmede mock
const PROVIDER = iyzico.enabled() ? 'iyzico' : (PROD ? 'none' : 'mock');
if (PROD && PROVIDER === 'iyzico' && !process.env.PUBLIC_URL) console.warn('[uyarı] PUBLIC_URL verilmedi; iyzico dönüş adresi istek başlıklarından hesaplanacak.');

// ---------------------------------------------------------------- veri
function readJson(file, fallback) { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { return fallback; } }
let orders = readJson(DB_FILE, []);
let storeStatus = avail.normalize(readJson(SETTINGS_FILE, {})); // { paused, soldOut, updatedAt }
let pending = readJson(PENDING_FILE, {}); // iyzico ödemesi bekleyen siparişler { id: { order, token, createdAt } }
const usedIntents = new Set(orders.map((o) => o.payment && (o.payment.intentId || o.payment.paymentId)).filter(Boolean));

function writeAtomic(file, data) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, file);
}
let saveTimer = null;
function persist() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { writeAtomic(DB_FILE, orders); writeAtomic(PENDING_FILE, pending); }, 100);
}
// 45 dakikadan eski, tamamlanmamış ödemeleri temizle
setInterval(() => {
  const limit = Date.now() - 45 * 60000; let changed = false;
  Object.keys(pending).forEach((id) => { if (new Date(pending[id].createdAt).getTime() < limit) { delete pending[id]; changed = true; } });
  if (changed) persist();
}, 10 * 60000);

function allIds() { const ids = {}; orders.forEach((o) => { ids[o.id] = true; }); Object.keys(pending).forEach((id) => { ids[id] = true; }); return ids; }

// ---------------------------------------------------------------- SSE
const clients = new Set(); // { res, admin }
function broadcastStatus() {
  const msg = 'data: ' + JSON.stringify({ type: 'status', status: storeStatus }) + '\n\n';
  for (const c of clients) c.res.write(msg);
}
function broadcast(type, order) {
  for (const c of clients) {
    const payload = c.admin ? { type, order } : { type, order: { id: order.id, status: order.status, timeline: order.timeline } };
    c.res.write('data: ' + JSON.stringify(payload) + '\n\n');
  }
}
setInterval(() => { for (const c of clients) c.res.write(': ping\n\n'); }, 25000);

function printOrder(order, copies) {
  return printer.print(order, RECEIPT_HEAD, copies).then(() => {
    order.printedAt = new Date().toISOString();
    persist();
    broadcast('order:update', order);
    console.log('[yazıcı] #' + order.id + ' yazdırıldı');
  });
}

/** Onaylanmış siparişi kaydet, panele bildir, gerekiyorsa yazdır */
function commitOrder(order) {
  orders.unshift(order);
  if (orders.length > 5000) orders.length = 5000;
  persist();
  broadcast('order:new', order);
  console.log('[sipariş] ' + order.id + ' · ' + order.customer.name + ' · ' + order.total + ' TL · ' + order.payment.methodLabel + (order.payment.status === 'paid' ? ' (ödendi)' : ''));
  if (printer.info().auto) printOrder(order).catch((e) => console.error('[yazıcı] #' + order.id + ' basılamadı: ' + e.message));
}

// ---------------------------------------------------------------- yardımcılar
function send(res, status, body, headers) {
  res.writeHead(status, Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }, headers || {}));
  res.end(JSON.stringify(body));
}
function redirect(res, location) { res.writeHead(303, { Location: location, 'Cache-Control': 'no-store' }); res.end(); }
function readRaw(req, limit) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', (c) => { size += c.length; if (size > (limit || 100 * 1024)) { reject(Object.assign(new Error('İstek çok büyük'), { status: 413 })); req.destroy(); } else chunks.push(c); });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}
async function readBody(req) {
  const raw = await readRaw(req);
  if (!raw) return {};
  if (/application\/x-www-form-urlencoded/.test(req.headers['content-type'] || '')) return Object.fromEntries(new URLSearchParams(raw));
  try { return JSON.parse(raw); } catch (e) { throw Object.assign(new Error('Geçersiz JSON'), { status: 400 }); }
}
function clientIp(req) {
  if (TRUST_PROXY && req.headers['x-forwarded-for']) return String(req.headers['x-forwarded-for']).split(',')[0].trim();
  return (req.socket.remoteAddress || '').replace(/^::ffff:/, '');
}
function publicUrl(req) {
  if (process.env.PUBLIC_URL) return process.env.PUBLIC_URL.replace(/\/$/, '');
  const proto = TRUST_PROXY && req.headers['x-forwarded-proto'] ? String(req.headers['x-forwarded-proto']).split(',')[0] : 'http';
  const host = (TRUST_PROXY && req.headers['x-forwarded-host']) || req.headers.host;
  return proto + '://' + host;
}

// PIN deneme sınırı: IP başına 15 dakikada 10 hatalı deneme
const pinFails = new Map();
function isAdmin(req, url) {
  const pin = req.headers['x-admin-pin'] || url.searchParams.get('pin');
  return typeof pin === 'string' && pin.length > 0 && pin === ADMIN_PIN;
}
function adminCheck(req, res, url) {
  const ip = clientIp(req), now = Date.now();
  const f = (pinFails.get(ip) || []).filter((t) => now - t < 15 * 60000);
  if (f.length >= 10) { send(res, 429, { error: 'Çok fazla hatalı PIN denemesi. 15 dakika sonra tekrar deneyin.' }); return false; }
  if (isAdmin(req, url)) return true;
  f.push(now); pinFails.set(ip, f);
  send(res, 401, { error: 'Yetkisiz' });
  return false;
}

// Basit hız sınırlama (IP başına dakikada 60 yazma isteği)
const hits = new Map();
function rateLimited(req) {
  const ip = clientIp(req), now = Date.now();
  const h = (hits.get(ip) || []).filter((t) => now - t < 60000);
  h.push(now); hits.set(ip, h);
  return h.length > 60;
}
setInterval(() => { const now = Date.now(); for (const [k, v] of hits) if (!v.some((t) => now - t < 60000)) hits.delete(k); }, 5 * 60000);

// ---------------------------------------------------------------- API
async function api(req, res, url) {
  const p = url.pathname;
  const m = req.method;
  if (m !== 'GET' && p !== '/api/payments/iyzico/callback' && rateLimited(req)) return send(res, 429, { error: 'Çok fazla istek. Lütfen biraz bekleyin.' });

  if (p === '/api/health') return send(res, 200, { ok: true, mode: 'remote', provider: PROVIDER, sandbox: PROVIDER === 'iyzico' && iyzico.isSandbox(), demo: !PROD, status: storeStatus });

  // ---- Dükkân durumu: siparişleri durdur / tükendi
  if (p === '/api/store-status' && m === 'GET') return send(res, 200, storeStatus);
  if (p === '/api/store-status' && m === 'PATCH') {
    if (!adminCheck(req, res, url)) return;
    const b = await readBody(req);
    const next = Object.assign({}, storeStatus);
    if (typeof b.paused === 'boolean') next.paused = b.paused;
    if (Array.isArray(b.soldOut)) next.soldOut = b.soldOut.map(String).slice(0, 500);
    next.updatedAt = new Date().toISOString();
    storeStatus = avail.normalize(next);
    writeAtomic(SETTINGS_FILE, storeStatus);
    broadcastStatus();
    console.log('[durum] sipariş alımı ' + (storeStatus.paused ? 'DURDURULDU' : 'açık') + ' · tükenen: ' + (storeStatus.soldOut.join(', ') || 'yok'));
    return send(res, 200, storeStatus);
  }

  // ---- SSE
  if (p === '/api/stream' && m === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
    res.write('retry: 3000\n\n');
    const client = { res, admin: isAdmin(req, url) };
    clients.add(client);
    req.on('close', () => clients.delete(client));
    return;
  }

  // ---- Mock sanal POS (yalnızca geliştirme)
  let mm;
  if (p.indexOf('/api/payments/') === 0 && p !== '/api/payments/iyzico/callback') {
    if (PROVIDER !== 'mock') return send(res, 404, { error: 'Bulunamadı' });
    if (p === '/api/payments/intent' && m === 'POST') {
      const b = await readBody(req);
      const priced = pricing.priceCart(b.lines, b.zone);
      if (!priced.lines.length || !priced.meetsMinimum) return send(res, 400, { error: 'Sepet minimum sipariş tutarının altında.' });
      const av = avail.check({ lines: b.lines }, storeStatus);
      if (av) return send(res, 409, av);
      return send(res, 201, mockPay.createIntent({ amount: priced.total, currency: 'TRY' }));
    }
    mm = p.match(/^\/api\/payments\/([\w-]+)\/confirm$/);
    if (mm && m === 'POST') { const b = await readBody(req); return send(res, 200, mockPay.confirmIntent(mm[1], b.card || {})); }
    mm = p.match(/^\/api\/payments\/([\w-]+)\/3ds$/);
    if (mm && m === 'POST') { const b = await readBody(req); return send(res, 200, mockPay.completeThreeDS(mm[1], b.code)); }
    return send(res, 404, { error: 'Bulunamadı' });
  }

  // ---- Sipariş (kapıda ödeme / geliştirmede mock kart)
  if (p === '/api/orders' && m === 'POST') {
    const b = await readBody(req);
    const errs = core.validateCheckout(b);
    if (Object.keys(errs).length) return send(res, 400, { error: 'Formda eksik alanlar var.', fieldErrors: errs });
    const av = PROD || !b.demo ? avail.check(b, storeStatus) : null; // geliştirmede panel demo siparişleri hariç
    if (av) return send(res, 409, av);
    const priced = pricing.priceCart(b.lines, b.address.zone);
    let payment = { status: 'pending' };
    if (b.paymentMethod === 'card_online') {
      if (PROVIDER === 'iyzico') return send(res, 400, { error: 'Online kart ödemesi iyzico ödeme sayfası üzerinden yapılır. Sayfayı yenileyip tekrar deneyin.' });
      if (PROVIDER !== 'mock') return send(res, 400, { error: 'Online kart ödemesi şu an kapalı. Kapıda ödemeyi seçin.' });
      const id = b.payment && b.payment.intentId;
      const intent = id && mockPay.getIntent(id);
      if (!intent || intent.status !== 'succeeded') return send(res, 402, { error: 'Ödeme onaylanmadı. Lütfen tekrar deneyin.' });
      if (usedIntents.has(id)) return send(res, 409, { error: 'Bu ödeme zaten bir siparişte kullanıldı.' });
      if (intent.amount !== Math.round(priced.total * 100)) return send(res, 409, { error: 'Sepet tutarı ödeme sırasında değişti. Lütfen tekrar ödeyin.' });
      usedIntents.add(id);
      payment = { status: 'paid', intentId: id, last4: intent.last4, brand: intent.brand };
    }
    const order = core.buildOrder(b, payment, allIds());
    commitOrder(order);
    return send(res, 201, order);
  }

  // ---- iyzico: ödeme sayfasını başlat
  if (p === '/api/checkout/iyzico' && m === 'POST') {
    if (PROVIDER !== 'iyzico') return send(res, 400, { error: 'Online kart ödemesi şu an kapalı.' });
    const b = await readBody(req);
    b.paymentMethod = 'card_online';
    const errs = core.validateCheckout(b);
    if (Object.keys(errs).length) return send(res, 400, { error: 'Formda eksik alanlar var.', fieldErrors: errs });
    const av = avail.check(b, storeStatus);
    if (av) return send(res, 409, av);
    const order = core.buildOrder(b, { status: 'awaiting', provider: 'iyzico' }, allIds());
    const base = publicUrl(req);
    const host = base.replace(/^https?:\/\//, '').replace(/[:/].*$/, '');
    const init = await iyzico.initialize(order, {
      ip: clientIp(req), city: R.city, callbackUrl: base + '/api/payments/iyzico/callback?o=' + order.id,
      buyerEmail: process.env.IYZICO_BUYER_EMAIL || ('siparis@' + (/\./.test(host) ? host : 'example.com')),
    });
    pending[order.id] = { order, token: init.token, createdAt: new Date().toISOString() };
    persist();
    console.log('[ödeme] #' + order.id + ' iyzico ödeme sayfası açıldı (' + order.total + ' TL)');
    return send(res, 201, { orderId: order.id, paymentPageUrl: init.paymentPageUrl });
  }

  // ---- iyzico: dönüş (müşterinin tarayıcısı buraya POST ile gelir)
  if (p === '/api/payments/iyzico/callback') {
    const id = url.searchParams.get('o') || '';
    const done = orders.find((o) => o.id === id);
    if (done) return redirect(res, '/#siparis-' + id); // yenileme / tekrar gönderim
    if (m !== 'POST' || PROVIDER !== 'iyzico') return redirect(res, '/#odeme-hata');
    const b = await readBody(req);
    const pend = pending[id];
    if (!pend || !b.token) return redirect(res, '/#odeme-hata');
    let result;
    try { result = await iyzico.retrieve(b.token); }
    catch (e) { console.error('[ödeme] #' + id + ' doğrulanamadı: ' + e.message); return redirect(res, '/#odeme-hata'); }
    const order = pend.order;
    const amountOk = Math.abs(result.paidPrice - order.total) < 0.01;
    if (!result.ok || result.basketId !== id || !amountOk || usedIntents.has(result.paymentId)) {
      console.warn('[ödeme] #' + id + ' reddedildi: ' + (result.error || (!amountOk ? 'tutar uyuşmuyor' : 'doğrulama başarısız')));
      delete pending[id]; persist();
      return redirect(res, '/#odeme-hata');
    }
    usedIntents.add(result.paymentId);
    order.payment = Object.assign({}, order.payment, { status: 'paid', provider: 'iyzico', paymentId: result.paymentId, last4: result.last4, brand: result.brand });
    delete pending[id];
    commitOrder(order);
    return redirect(res, '/#siparis-' + id);
  }

  // ---- Yazıcı
  if (p === '/api/printer' && m === 'GET') {
    if (!adminCheck(req, res, url)) return;
    return send(res, 200, printer.info());
  }
  if (p === '/api/print-test' && m === 'POST') {
    if (!adminCheck(req, res, url)) return;
    const sample = { id: 'TEST', createdAt: new Date().toISOString(), schedule: { type: 'asap' }, customer: { name: 'Test Müşteri', phone: '05XX XXX XX XX' },
      address: { neighborhood: (config.delivery.neighborhoods || ['Şenlik'])[0], street: 'Örnek Sok. No: 1', zoneLabel: config.delivery.zones[0].label, directions: 'Yazıcı deneme fişi' },
      lines: [{ qty: 1, name: 'Karışık Pizza', portionLabel: 'Dev Boy', unit: 590, total: 590 }], subtotal: 590, deliveryFee: 0, total: 590,
      payment: { method: 'cash_door', methodLabel: 'Kapıda Nakit', status: 'pending' }, note: 'Türkçe karakter testi: ÇĞİÖŞÜ çğıöşü', cutlery: false };
    await printer.print(sample, RECEIPT_HEAD, 1);
    return send(res, 200, { ok: true });
  }
  mm = p.match(/^\/api\/print\/([A-Z0-9]+)$/);
  if (mm && m === 'POST') {
    if (!adminCheck(req, res, url)) return;
    const order = orders.find((o) => o.id === mm[1]);
    if (!order) return send(res, 404, { error: 'Sipariş bulunamadı' });
    const b = await readBody(req);
    if (b.auto && order.printedAt) return send(res, 200, { ok: true, skipped: true, printedAt: order.printedAt });
    await printOrder(order, Math.max(1, Math.min(3, Number(b.copies) || printer.cfg.copies)));
    return send(res, 200, { ok: true, printedAt: order.printedAt });
  }

  // ---- Siparişler
  if (p === '/api/orders' && m === 'GET') {
    if (!adminCheck(req, res, url)) return;
    return send(res, 200, { orders });
  }
  mm = p.match(/^\/api\/orders\/([A-Z0-9]+)$/);
  if (mm) {
    const order = orders.find((o) => o.id === mm[1]);
    if (!order) return send(res, 404, { error: 'Sipariş bulunamadı' });
    if (m === 'GET') return send(res, 200, order);
    if (m === 'PATCH') {
      if (!adminCheck(req, res, url)) return;
      const b = await readBody(req);
      if (!core.STATUSES.some((s) => s.id === b.status)) return send(res, 400, { error: 'Geçersiz durum' });
      core.applyStatus(order, b.status);
      persist();
      broadcast('order:update', order);
      return send(res, 200, order);
    }
  }
  return send(res, 404, { error: 'Bulunamadı' });
}

// ---------------------------------------------------------------- statik
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.json': 'application/json', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8' };
const BLOCKED = ['server', 'node_modules', 'scripts'].map((d) => path.join(ROOT, d) + path.sep);
function securityHeaders(req) {
  const h = { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin', 'X-Frame-Options': 'SAMEORIGIN', 'Permissions-Policy': 'camera=(), microphone=(), geolocation=()' };
  if (PROD && TRUST_PROXY && req.headers['x-forwarded-proto'] === 'https') h['Strict-Transport-Security'] = 'max-age=15552000';
  return h;
}
function serveStatic(req, res, url) {
  let rel;
  try { rel = decodeURIComponent(url.pathname); } catch (e) { res.writeHead(400); return res.end(); }
  if (rel === '/panel') { res.writeHead(301, { Location: '/panel/' }); return res.end(); }
  if (rel.endsWith('/')) rel += 'index.html';
  const file = path.normalize(path.join(ROOT, rel));
  if (!file.startsWith(ROOT + path.sep) || BLOCKED.some((d) => file.startsWith(d)) || /(^|[\\/])\./.test(path.relative(ROOT, file)) || /\.(md|env|example|json\.tmp)$|Dockerfile|package(-lock)?\.json$/.test(file)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('Bulunamadı');
  }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('Bulunamadı'); }
    res.writeHead(200, Object.assign({
      'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': /\.html$|sw\.js$|\.webmanifest$/.test(rel) ? 'no-cache' : (/\/js\/|\.css$/.test(rel) ? 'no-cache' : 'public, max-age=86400'),
    }, securityHeaders(req)));
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(file).pipe(res);
  });
}

const server = http.createServer((req, res) => {
  // Yayında http isteklerini https'e yönlendir (Railway/Render gibi proxy arkasında)
  if (PROD && TRUST_PROXY && req.headers['x-forwarded-proto'] === 'http') { res.writeHead(301, { Location: 'https://' + req.headers.host + req.url }); return res.end(); }
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname.startsWith('/api/')) {
    api(req, res, url).catch((e) => { console.error(e); if (!res.headersSent) send(res, e.status || 500, { error: e.status ? e.message : 'Sunucu hatası' }); });
  } else if (req.method === 'GET' || req.method === 'HEAD') serveStatic(req, res, url);
  else { res.writeHead(405); res.end(); }
});

server.listen(PORT, () => {
  console.log('\n  ' + config.restaurant.name + ' çalışıyor' + (PROD ? ' (yayın modu)' : ' (geliştirme modu)'));
  console.log('  Site  : http://localhost:' + PORT);
  console.log('  Panel : http://localhost:' + PORT + '/panel/');
  console.log('  Veri  : ' + DATA_DIR);
  console.log('  Ödeme : ' + ({ iyzico: 'iyzico' + (iyzico.isSandbox() ? ' (TEST ortamı)' : ' (CANLI)'), mock: 'simülasyon (mock sanal POS)', none: 'online kart kapalı, yalnızca kapıda ödeme' })[PROVIDER]);
  const pi = printer.info();
  console.log('  Yazıcı: ' + (pi.configured ? pi.host + ':' + pi.port + ' · ' + pi.paper + ' mm' + (pi.auto ? ' · otomatik baskı açık' : '') : 'ağ yazıcısı tanımlı değil (PRINTER_HOST)') + '\n');
});
