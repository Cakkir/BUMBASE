/**
 * Ağ termal yazıcısı (ESC/POS, TCP 9100 "RAW" port)
 * -----------------------------------------------------------------
 * Ortam değişkenleri:
 *   PRINTER_HOST     Yazıcının IP adresi (ör. 192.168.1.50). Boşsa ağ yazdırma kapalı.
 *   PRINTER_PORT     Varsayılan 9100
 *   PRINTER_PAPER    80 veya 58 (mm). Varsayılan 80
 *   PRINTER_CHARSET  cp857 (Türkçe) veya ascii. Varsayılan cp857
 *   PRINTER_CODEPAGE ESC t kod sayfası numarası. Varsayılan 13 (PC857)
 *   PRINTER_COPIES   Her sipariş için nüsha sayısı (1-3). Varsayılan 1
 *   PRINTER_AUTO     1 ise yeni sipariş gelir gelmez sunucu fişi basar (panel kapalı olsa bile)
 */
'use strict';
const net = require('net');
const receipt = require('../js/shared/receipt.js');

const cfg = {
  host: process.env.PRINTER_HOST || '',
  port: Number(process.env.PRINTER_PORT) || 9100,
  paper: Number(process.env.PRINTER_PAPER) === 58 ? 58 : 80,
  charset: process.env.PRINTER_CHARSET === 'ascii' ? 'ascii' : 'cp857',
  codePage: process.env.PRINTER_CODEPAGE != null ? Number(process.env.PRINTER_CODEPAGE) : 13,
  copies: Math.max(1, Math.min(3, Number(process.env.PRINTER_COPIES) || 1)),
  auto: process.env.PRINTER_AUTO === '1' || process.env.PRINTER_AUTO === 'true',
};

function info() {
  return { configured: !!cfg.host, host: cfg.host, port: cfg.port, paper: cfg.paper, copies: cfg.copies, auto: cfg.auto && !!cfg.host };
}

function bytesFor(order, restaurant, copies) {
  const parts = [];
  for (let i = 0; i < copies; i++) {
    const opts = {
      width: receipt.PAPER[cfg.paper], charset: cfg.charset, codePage: cfg.codePage, restaurant,
      copyLabel: copies > 1 ? (['MUTFAK NÜSHASI', 'KURYE NÜSHASI', 'KASA NÜSHASI'][i] || 'Nüsha ' + (i + 1)) : '',
    };
    parts.push(Buffer.from(receipt.toEscPos(receipt.build(order, opts), opts)));
  }
  return Buffer.concat(parts);
}

function send(buf) {
  return new Promise((resolve, reject) => {
    if (!cfg.host) return reject(Object.assign(new Error('Sunucuda yazıcı adresi (PRINTER_HOST) tanımlı değil.'), { status: 400 }));
    const sock = net.createConnection({ host: cfg.host, port: cfg.port });
    let done = false;
    const fail = (e) => { if (done) return; done = true; sock.destroy(); reject(Object.assign(new Error('Yazıcıya ulaşılamadı (' + cfg.host + ':' + cfg.port + '): ' + e.message), { status: 502 })); };
    sock.setTimeout(6000, () => fail(new Error('zaman aşımı')));
    sock.on('error', fail);
    sock.on('connect', () => {
      sock.end(buf, () => { if (!done) { done = true; resolve(); } });
    });
  });
}

// Baskıları sıraya al: iki sipariş aynı anda gelirse fişler karışmasın
let queue = Promise.resolve();
function print(order, restaurant, copies) {
  const job = () => send(bytesFor(order, restaurant, copies || cfg.copies));
  const run = queue.then(job, job);
  queue = run.catch(() => {});
  return run;
}

module.exports = { cfg, info, print };
