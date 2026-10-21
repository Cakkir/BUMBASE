/* Yayın öncesi kontrol: npm run check */
'use strict';
const config = require('../js/config.js');
const menu = require('../js/data/menu.js');
const fs = require('fs');
const path = require('path');
const out = [];
const warn = (m) => out.push('  ⚠ ' + m), ok = (m) => out.push('  ✓ ' + m);
const l = config.legal || {};
['company', 'taxOffice', 'taxNumber', 'email'].forEach((k) => (l[k] ? ok('legal.' + k + ' dolu') : warn('js/config.js → legal.' + k + ' boş (yasal sayfalarda sarı görünür)')));
config.restaurant.whatsapp === '+905000000000' && warn('restaurant.whatsapp örnek değerde (sitede gösterilmiyor, isterseniz doldurun)');
config.showReviews ? warn('showReviews açık: yorumların gerçek olduğundan emin olun') : ok('örnek yorumlar gizli');
const missing = menu.items.filter((i) => i.image && !fs.existsSync(path.join(__dirname, '..', i.image)));
missing.length ? warn('eksik ürün fotoğrafı: ' + missing.map((i) => i.id).join(', ')) : ok('tüm ürün fotoğrafları yerinde');
const env = process.env;
if (env.NODE_ENV === 'production') {
  (env.ADMIN_PIN || '').length >= 6 ? ok('ADMIN_PIN ayarlı') : warn('ADMIN_PIN eksik veya kısa');
  env.IYZICO_API_KEY ? ok('iyzico anahtarı var (' + (/sandbox/.test(env.IYZICO_BASE_URL || 'sandbox') ? 'TEST' : 'CANLI') + ')') : warn('iyzico anahtarı yok: online kart kapalı olacak');
  env.PUBLIC_URL ? ok('PUBLIC_URL ' + env.PUBLIC_URL) : warn('PUBLIC_URL eksik');
  env.DATA_DIR ? ok('DATA_DIR ' + env.DATA_DIR) : warn('DATA_DIR eksik: siparişler yeniden başlatmada kaybolabilir');
}
console.log('\nYayın öncesi kontrol\n' + out.join('\n') + '\n');
