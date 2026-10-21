/**
 * ADİSYON FİŞİ
 * -----------------------------------------------------------------
 * Siparişi termal yazıcı fişine dönüştürür. Tarayıcı ve sunucu ortak kullanır.
 *   build(order, opts)      → satır listesi (ops)
 *   toEscPos(ops, opts)     → Uint8Array (ESC/POS komutları, Türkçe karakter için CP857)
 *   toHtml(ops, opts)       → fiş görünümünde HTML (tarayıcıdan yazdırma / önizleme)
 *
 * opts: { width: 32 (58 mm) | 48 (80 mm), charset: 'cp857' | 'ascii', copyLabel, restaurant }
 */
(function (root, factory) {
  var mod = factory();
  if (typeof module === 'object' && module.exports) module.exports = mod;
  else { root.App = root.App || {}; root.App.receipt = mod; }
})(typeof self !== 'undefined' ? self : this, function () {
  var PAPER = { 58: 32, 80: 48 };

  // ---------------- yardımcılar ----------------
  function pad2(n) { return n < 10 ? '0' + n : '' + n; }
  function tl(n) {
    var s = (Math.round((Number(n) || 0) * 100) / 100).toFixed(2).split('.');
    return s[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + s[1] + ' TL';
  }
  function dt(iso) {
    var d = new Date(iso);
    return pad2(d.getDate()) + '.' + pad2(d.getMonth() + 1) + '.' + d.getFullYear() + ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes());
  }
  function upperTR(s) { return String(s || '').replace(/i/g, 'İ').replace(/ı/g, 'I').toUpperCase(); }
  function normalize(s) {
    return String(s == null ? '' : s)
      .replace(/[’‘`´]/g, "'").replace(/[“”«»]/g, '"').replace(/[–—]/g, '-').replace(/×/g, 'x').replace(/•/g, '*')
      .replace(/₺/g, 'TL').replace(/…/g, '...').replace(/\s+/g, ' ').trim();
  }
  function wrap(text, w) {
    var indent = (String(text || '').match(/^ */) || [''])[0];
    text = normalize(text);
    if (!text) return [''];
    if (indent) return wrap(text, w - indent.length).map(function (l) { return indent + l; });
    var words = text.split(' '), lines = [], cur = '';
    words.forEach(function (word) {
      while (word.length > w) { if (cur) { lines.push(cur); cur = ''; } lines.push(word.slice(0, w)); word = word.slice(w); }
      if (!cur) cur = word;
      else if ((cur + ' ' + word).length <= w) cur += ' ' + word;
      else { lines.push(cur); cur = word; }
    });
    if (cur || !lines.length) lines.push(cur);
    return lines;
  }

  // ---------------- fiş içeriği ----------------
  function build(o, opts) {
    opts = opts || {};
    var R = opts.restaurant || {};
    var ops = [];
    function t(s, f) { ops.push(Object.assign({ t: 'text', s: s }, f || {})); }
    function hr(ch) { ops.push({ t: 'hr', ch: ch || '-' }); }
    function cols(l, r, f) { ops.push(Object.assign({ t: 'cols', l: l, r: r }, f || {})); }
    function feed(n) { ops.push({ t: 'feed', n: n || 1 }); }

    t(R.name || 'RESTORAN', { align: 'center', bold: true, size: 2 });
    if (R.tagline) t(R.tagline, { align: 'center' });
    if (R.address) t(R.address, { align: 'center' });
    if (R.phone) t('Tel: ' + R.phone, { align: 'center' });
    hr('=');
    t('PAKET SERVİS', { align: 'center', bold: true });
    t('#' + o.id, { align: 'center', bold: true, size: 2 });
    t(dt(o.createdAt), { align: 'center' });
    if (opts.copyLabel) t(opts.copyLabel, { align: 'center' });
    if (o.schedule && o.schedule.type === 'later') t('PLANLI TESLİMAT: ' + o.schedule.time, { align: 'center', bold: true, invert: true });
    else t('TESLİMAT: EN KISA SÜREDE', { align: 'center', bold: true });
    hr();

    // Müşteri ve adres
    t('MÜŞTERİ', { bold: true });
    t(o.customer.name);
    t('Tel: ' + o.customer.phone, { bold: true });
    var a = o.address || {};
    t('ADRES', { bold: true });
    t(a.neighborhood + ' Mah. ' + a.street + (a.apartment ? ', ' + a.apartment : ''));
    t((a.zoneLabel || '') + (R.city ? ' / ' + R.city : ''));
    if (a.directions) t('Tarif: ' + a.directions);
    hr();

    // Ürünler
    o.lines.forEach(function (l) {
      cols(l.qty + 'x ' + l.name, tl(l.total), { bold: true });
      if (l.portionLabel) t('   ' + l.portionLabel);
      if (l.qty > 1) t('   (' + l.qty + ' x ' + tl(l.unit) + ')');
      if (l.note) t('   Not: ' + l.note, { bold: true });
    });
    hr();
    cols('Ara toplam', tl(o.subtotal));
    cols('Teslimat', o.deliveryFee ? tl(o.deliveryFee) : 'Ücretsiz');
    cols('TOPLAM', tl(o.total), { bold: true, size: 2 });
    hr();

    // Ödeme
    var p = o.payment || {};
    t('ÖDEME: ' + (p.methodLabel || p.method || ''), { bold: true });
    if (p.status === 'paid') {
      if (p.last4) t('Kart: ' + String(p.brand || '').toUpperCase() + ' **** ' + p.last4);
      t('ONLINE ÖDENDİ - TAHSİLAT YOK', { align: 'center', bold: true, invert: true });
    } else if (p.method === 'card_door') {
      t('KAPIDA KART - POS CİHAZI GÖTÜRÜN', { align: 'center', bold: true, invert: true });
      t('TAHSİL: ' + tl(o.total), { align: 'center', bold: true, size: 2 });
    } else {
      t('KAPIDA NAKİT', { align: 'center', bold: true, invert: true });
      t('TAHSİL: ' + tl(o.total), { align: 'center', bold: true, size: 2 });
    }

    // Notlar
    if (o.note) {
      hr();
      t('SİPARİŞ NOTU', { bold: true, invert: true });
      t(o.note, { bold: true });
    }
    t('Çatal-bıçak: ' + (o.cutlery ? 'İSTENDİ' : 'İstenmedi'), o.cutlery ? { bold: true } : {});
    hr('=');
    t('Afiyet olsun!', { align: 'center' });
    feed(3);
    ops.push({ t: 'cut' });
    return ops;
  }

  // ---------------- satırlara yerleştirme ----------------
  function layout(ops, width) {
    var out = [];
    ops.forEach(function (op) {
      // Çift boy yazı sığmıyorsa normal boya düşür (58 mm kağıtta tutarlar bölünmesin)
      if (op.size === 2) {
        var need = op.t === 'cols' ? normalize(op.l).length + normalize(op.r).length + 1 : normalize(op.s).length;
        if (need > Math.floor(width / 2)) op = Object.assign({}, op, { size: 1, bold: true });
      }
      var w = op.size === 2 ? Math.floor(width / 2) : width;
      if (op.t === 'text') wrap(op.s, w).forEach(function (s) { out.push({ s: s, op: op }); });
      else if (op.t === 'hr') out.push({ s: new Array(width + 1).join(op.ch), op: op });
      else if (op.t === 'cols') {
        var r = normalize(op.r), lw = Math.max(4, w - r.length - 1);
        var left = wrap(op.l, lw);
        left.forEach(function (s, i) {
          if (i === 0) out.push({ s: s + new Array(Math.max(1, w - s.length - r.length) + 1).join(' ') + r, op: op });
          else out.push({ s: '   ' + s, op: op });
        });
      } else out.push({ op: op });
    });
    return out;
  }

  // ---------------- ESC/POS ----------------
  var CP857 = { 'Ç': 0x80, 'ü': 0x81, 'é': 0x82, 'â': 0x83, 'ä': 0x84, 'à': 0x85, 'å': 0x86, 'ç': 0x87, 'ê': 0x88, 'ë': 0x89, 'è': 0x8A, 'ï': 0x8B,
    'î': 0x8C, 'ı': 0x8D, 'Ä': 0x8E, 'Å': 0x8F, 'É': 0x90, 'æ': 0x91, 'Æ': 0x92, 'ô': 0x93, 'ö': 0x94, 'ò': 0x95, 'û': 0x96, 'ù': 0x97,
    'İ': 0x98, 'Ö': 0x99, 'Ü': 0x9A, 'ø': 0x9B, '£': 0x9C, 'Ø': 0x9D, 'Ş': 0x9E, 'ş': 0x9F, 'á': 0xA0, 'í': 0xA1, 'ó': 0xA2, 'ú': 0xA3,
    'ñ': 0xA4, 'Ñ': 0xA5, 'Ğ': 0xA6, 'ğ': 0xA7, 'Â': 0xB6, 'Î': 0xD7, 'Û': 0xEA };
  var ASCII = { 'Ç': 'C', 'ç': 'c', 'Ğ': 'G', 'ğ': 'g', 'İ': 'I', 'ı': 'i', 'Ö': 'O', 'ö': 'o', 'Ş': 'S', 'ş': 's', 'Ü': 'U', 'ü': 'u', 'Â': 'A', 'â': 'a', 'Î': 'I', 'î': 'i', 'Û': 'U', 'û': 'u', 'é': 'e' };

  function encodeText(s, charset) {
    var out = [];
    for (var i = 0; i < s.length; i++) {
      var ch = s.charAt(i), code = s.charCodeAt(i);
      if (code < 128) out.push(code);
      else if (charset !== 'ascii' && CP857[ch] != null) out.push(CP857[ch]);
      else { var r = ASCII[ch] || '?'; for (var j = 0; j < r.length; j++) out.push(r.charCodeAt(j)); }
    }
    return out;
  }

  function toEscPos(ops, opts) {
    opts = opts || {};
    var width = opts.width || 48, charset = opts.charset || 'cp857';
    var b = [0x1B, 0x40]; // başlat
    if (charset !== 'ascii') b.push(0x1B, 0x74, opts.codePage != null ? opts.codePage : 13); // ESC t 13 = PC857 (Türkçe)
    layout(ops, width).forEach(function (row) {
      var op = row.op;
      if (op.t === 'feed') { b.push(0x1B, 0x64, op.n); return; }
      if (op.t === 'cut') { b.push(0x1D, 0x56, 0x42, 0x00); return; } // kağıdı ilerlet ve kes
      b.push(0x1B, 0x61, op.align === 'center' ? 1 : op.align === 'right' ? 2 : 0);
      b.push(0x1B, 0x45, op.bold ? 1 : 0);
      b.push(0x1D, 0x21, op.size === 2 ? 0x11 : 0x00);
      b.push(0x1D, 0x42, op.invert ? 1 : 0);
      b.push.apply(b, encodeText(row.s, charset));
      b.push(0x0A);
    });
    b.push(0x1B, 0x61, 0, 0x1B, 0x45, 0, 0x1D, 0x21, 0, 0x1D, 0x42, 0);
    return typeof Uint8Array !== 'undefined' ? new Uint8Array(b) : b;
  }

  /** Aynı fişten birden fazla nüsha (ör. mutfak + kurye) */
  function joinBytes(list) {
    var len = list.reduce(function (n, a) { return n + a.length; }, 0), out = new Uint8Array(len), o = 0;
    list.forEach(function (a) { out.set(a, o); o += a.length; });
    return out;
  }

  // ---------------- HTML ----------------
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function toHtml(ops, opts) {
    opts = opts || {};
    var width = opts.width || 48;
    var rows = layout(ops, width).map(function (row) {
      var op = row.op;
      if (op.t === 'feed') return '<div class="rc-feed"></div>';
      if (op.t === 'cut') return '<div class="rc-cut"></div>';
      var cls = ['rc-row', op.align === 'center' ? 'rc-c' : '', op.bold ? 'rc-b' : '', op.size === 2 ? 'rc-2' : '', op.invert ? 'rc-i' : ''].join(' ');
      return '<div class="' + cls + '"><span>' + (esc(row.s) || '&nbsp;') + '</span></div>';
    }).join('');
    return '<div class="rc" style="--rc-cols:' + width + '">' + rows + '</div>';
  }

  // Fiş görünümü stilleri (önizleme ve tarayıcıdan yazdırma)
  var CSS = '.rc{width:calc(var(--rc-cols) * 1ch);font:12px/1.35 "Courier New",ui-monospace,Menlo,Consolas,monospace;color:#000;background:#fff;white-space:pre;margin:0 auto}' +
    '.rc-row{overflow:hidden}.rc-c{text-align:center}.rc-b{font-weight:700}.rc-2{font-size:2em;line-height:1.15}' +
    '.rc-i span{background:#000;color:#fff;padding:0 .3ch}.rc-feed{height:1.4em}.rc-cut{border-top:1px dashed #999;margin-top:.6em}';

  return { PAPER: PAPER, build: build, toEscPos: toEscPos, toHtml: toHtml, joinBytes: joinBytes, CSS: CSS, tl: tl, layout: layout };
});
