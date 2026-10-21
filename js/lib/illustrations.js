/**
 * Yerleşik ürün illüstrasyonları (SVG).
 * menu.js içindeki `art` tanımından çizilir: { type: 'pizza', t: [['sucuk', 12], …] } gibi.
 * Gerçek fotoğraflarınız olduğunda ürüne `image: 'assets/img/margarita.webp'` vermeniz yeterli.
 * İçecek çizimleri bilerek markasızdır (logo / ticari takdim kullanılmaz).
 */
(function (App) {
  var uidN = 0;

  function rng(seedStr) {
    var h = 2166136261;
    for (var i = 0; i < seedStr.length; i++) { h ^= seedStr.charCodeAt(i); h = Math.imul(h, 16777619); }
    return function () { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 10000) / 10000; };
  }
  function f(n) { return Math.round(n * 10) / 10; }
  function circle(cx, cy, r, fill, extra) { return '<circle cx="' + f(cx) + '" cy="' + f(cy) + '" r="' + f(r) + '" fill="' + fill + '" ' + (extra || '') + '/>'; }
  function ellipse(cx, cy, rx, ry, fill, extra) { return '<ellipse cx="' + f(cx) + '" cy="' + f(cy) + '" rx="' + f(rx) + '" ry="' + f(ry) + '" fill="' + fill + '" ' + (extra || '') + '/>'; }
  function g(inner, t) { return '<g' + (t ? ' transform="' + t + '"' : '') + '>' + inner + '</g>'; }
  function at(x, y, rot, inner, sc) { return g(inner, 'translate(' + f(x) + ' ' + f(y) + ')' + (rot ? ' rotate(' + Math.round(rot) + ')' : '') + (sc ? ' scale(' + sc + ')' : '')); }
  function shadow(cx, cy, rx, ry) { return ellipse(cx + 6, cy + 10, rx, ry || rx, '#000', 'opacity=".38"'); }

  // Ayçiçeği (altın açı) dağılımı: malzemeler pizzaya eşit yayılır
  function sunflower(n, R, r, offset, fn) {
    var s = '', golden = 2.39996;
    for (var i = 0; i < n; i++) {
      var a = i * golden + offset + (r() - .5) * .5;
      var d = Math.sqrt((i + .5) / n) * R * (0.9 + r() * .15);
      s += fn(200 + Math.cos(a) * d, 150 + Math.sin(a) * d, r() * 360, r);
    }
    return s;
  }

  // ---------------- PİZZA ----------------
  var T = {
    sucuk: function (x, y, rot, r) { return circle(x, y, 9.5, '#8E1F16') + circle(x, y, 8, '#B0301F') + circle(x - 2.5, y - 1.5, 1.4, '#F0D2B0') + circle(x + 2.5, y + 2, 1.2, '#F0D2B0') + circle(x + 1, y - 3.5, 1, '#F0D2B0'); },
    kasapsucuk: function (x, y, rot, r) { return circle(x, y, 11, '#6E1710') + circle(x, y, 9.5, '#962516') + circle(x - 3, y, 1.6, '#E9C8A4') + circle(x + 3, y + 3, 1.4, '#E9C8A4') + circle(x + 2, y - 4, 1.2, '#E9C8A4'); },
    devsucuk: function (x, y, rot) { return at(x, y, rot, '<rect x="-15" y="-9" width="30" height="18" rx="6" fill="#7A1A12"/><rect x="-13" y="-7" width="26" height="14" rx="5" fill="#A32A18"/><circle cx="-5" cy="-2" r="1.6" fill="#EBCBA6"/><circle cx="5" cy="2" r="1.6" fill="#EBCBA6"/>'); },
    salam: function (x, y) { return circle(x, y, 11, '#C45E5E') + circle(x, y, 9.5, '#D97A72') + circle(x - 3, y + 2, 1.5, '#F4C9BC') + circle(x + 3, y - 3, 1.3, '#F4C9BC') + circle(x + 4, y + 4, 1.1, '#F4C9BC'); },
    sosis: function (x, y) { return circle(x, y, 6.5, '#A8502F') + circle(x, y, 5, '#CF7A52') + circle(x, y, 2, '#E9A57E'); },
    mantar: function (x, y, rot) { return at(x, y, rot, '<path d="M-10 1 C-10 -9 10 -9 10 1 Z" fill="#E9DCC3" stroke="#9C8262" stroke-width="1.4"/><rect x="-3" y="0" width="6" height="8" rx="2" fill="#E9DCC3" stroke="#9C8262" stroke-width="1.4"/>'); },
    misir: function (x, y) { return circle(x, y, 2.8, '#F3CD34', 'stroke="#D6A51C" stroke-width=".8"'); },
    yesilbiber: function (x, y, rot) { return at(x, y, rot, '<path d="M-9 3 C-6 -8 6 -8 9 3" stroke="#3E8A2C" stroke-width="3.6" fill="none" stroke-linecap="round"/>'); },
    kirmizibiber: function (x, y, rot) { return at(x, y, rot, '<rect x="-8" y="-2.2" width="16" height="4.4" rx="2.2" fill="#D9341E"/>'); },
    kozbiber: function (x, y, rot) { return at(x, y, rot, '<path d="M-11 -3 Q0 -6 11 -2 L10 3 Q0 0 -11 3Z" fill="#A8301C"/><path d="M-6 -2 l3 4 M2 -3 l3 4" stroke="#3A120A" stroke-width="1.4" opacity=".7"/>'); },
    morsogan: function (x, y, rot) { return at(x, y, rot, '<path d="M-8 2 A9 9 0 0 1 8 2" stroke="#8E3B7C" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M-5 3 A6 6 0 0 1 5 3" stroke="#C69ABB" stroke-width="1.4" fill="none"/>'); },
    zeytin: function (x, y) { return circle(x, y, 5, '#1F1A17') + circle(x, y, 2, '#F2C45A'); },
    domates: function (x, y) { return circle(x, y, 10, '#C8301F') + circle(x, y, 8, '#E2533A') + circle(x - 3, y, 1.4, '#F4D36A') + circle(x + 3, y + 1, 1.4, '#F4D36A') + circle(x, y - 3, 1.4, '#F4D36A'); },
    cherry: function (x, y) { return circle(x, y, 6.5, '#C8261A') + circle(x - 2, y - 2, 2.2, '#EE6A55'); },
    feslegen: function (x, y, rot) { return at(x, y, rot, '<path d="M-10 0 Q0 -8 10 0 Q0 8 -10 0Z" fill="#3E8E3A"/><path d="M-8 0 H8" stroke="#2A6A28" stroke-width="1"/>'); },
    beyazpeynir: function (x, y, rot) { return at(x, y, rot, '<rect x="-5" y="-5" width="10" height="10" rx="2" fill="#FBF8F0"/>'); },
    tavuk: function (x, y, rot) { return at(x, y, rot, '<path d="M-8 -5 Q0 -9 8 -5 Q10 2 6 6 Q-2 9 -8 5 Q-10 0 -8 -5Z" fill="#D29A5E"/><path d="M-5 -2 l4 4 M2 -4 l4 4" stroke="#9C6232" stroke-width="1.6" opacity=".7"/>'); },
    patates: function (x, y, rot) { return at(x, y, rot, '<rect x="-5" y="-5" width="10" height="10" rx="2.5" fill="#F2C24A" stroke="#D49A22" stroke-width="1"/>'); },
    ton: function (x, y, rot) { return at(x, y, rot, '<path d="M-7 -3 Q-2 -7 5 -4 Q8 0 4 4 Q-3 6 -7 2Z" fill="#D9B79A"/><path d="M-4 -1 l6 1" stroke="#B48D6E" stroke-width="1"/>'); },
    kavurma: function (x, y, rot) { return at(x, y, rot, '<path d="M-6 -4 Q1 -7 6 -3 Q8 3 3 5 Q-4 7 -7 2Z" fill="#4E2412"/><path d="M-3 -2 l4 3" stroke="#7A3A1E" stroke-width="1.4"/>'); },
    pastirma: function (x, y, rot) { return at(x, y, rot, '<path d="M-13 -4 Q0 -9 13 -4 L12 3 Q0 -2 -12 3Z" fill="#8A2416" stroke="#C9583E" stroke-width="1.4"/>'); },
    kaburga: function (x, y, rot) { return at(x, y, rot, '<rect x="-12" y="-4" width="24" height="8" rx="3" fill="#5E2A14"/><path d="M-7 -4 v8 M0 -4 v8 M7 -4 v8" stroke="#2E130A" stroke-width="1.5" opacity=".7"/>'); },
    jalapeno: function (x, y) { return circle(x, y, 6, '#8FCB5A', 'stroke="#3E8A2C" stroke-width="2"') + circle(x - 1.5, y, 1, '#F3EFC0') + circle(x + 1.5, y + 1, 1, '#F3EFC0'); },
    cheddar: function (x, y, rot) { return at(x, y, rot, '<path d="M-14 -4 Q-6 -12 6 -9 Q15 -3 12 6 Q2 12 -9 8 Q-16 3 -14 -4Z" fill="#F08A24" opacity=".85"/>'); },
    extramoz: function (x, y, rot) { return at(x, y, rot, '<path d="M-13 -3 Q-5 -11 6 -8 Q14 -2 11 6 Q1 11 -8 7 Q-15 2 -13 -3Z" fill="#FFF7DE"/>'); },
    topmoz: function (x, y) { return circle(x, y, 8.5, '#FFFDF4') + circle(x - 2, y - 2, 3, '#ffffff'); },
    kekik: function (x, y) { return circle(x, y, 1.2, '#4E7A2C'); },
  };

  function drizzle(r, color, w) {
    var pts = [], n = 9;
    for (var i = 0; i <= n; i++) {
      var t = -1 + 2 * i / n, x = 200 + t * 92, y = 150 + (i % 2 ? -1 : 1) * (60 - Math.abs(t) * 34) + (r() - .5) * 10;
      pts.push(f(x) + ' ' + f(y));
    }
    return '<polyline points="' + pts.join(' ') + '" fill="none" stroke="' + color + '" stroke-width="' + w + '" stroke-linecap="round" stroke-linejoin="round" opacity=".95"/>';
  }

  function pizza(art, key) {
    var r = rng(key);
    var s = shadow(200, 150, 142) + circle(200, 150, 142, '#8A5A32') + circle(200, 150, 142, 'none', 'stroke="#6E4524" stroke-width="2"');
    for (var k = 0; k < 4; k++) s += circle(200, 150, 60 + k * 22, 'none', 'stroke="#7B4E2A" stroke-width="1.2" opacity=".5"');
    s += circle(200, 150, 128, '#C98638') + circle(200, 150, 124, '#DDA24F');
    for (var c = 0; c < 16; c++) { var a = c / 16 * Math.PI * 2 + r(); s += ellipse(200 + Math.cos(a) * 120, 150 + Math.sin(a) * 120, 5, 2.5, '#A9652A', 'opacity=".55" transform="rotate(' + Math.round(a * 57.3 + 90) + ' ' + f(200 + Math.cos(a) * 120) + ' ' + f(150 + Math.sin(a) * 120) + ')"'); }
    s += circle(200, 150, 111, '#C2412A') + circle(200, 150, 106, '#F0BE52');
    s += sunflower(22, 92, r, 0.3, function (x, y) { return ellipse(x, y, 9 + r() * 8, 6 + r() * 6, '#F8D987', 'opacity=".85"'); });
    s += sunflower(16, 96, r, 1.1, function (x, y) { return ellipse(x, y, 3 + r() * 4, 2 + r() * 3, '#D68F34', 'opacity=".55"'); });
    for (var l = 0; l < 6; l++) { var b = l / 6 * Math.PI * 2 + .3; s += '<line x1="200" y1="150" x2="' + f(200 + Math.cos(b) * 108) + '" y2="' + f(150 + Math.sin(b) * 108) + '" stroke="#A86A2A" stroke-width="1.6" opacity=".35"/>'; }
    var layers = { base: '', top: '', drizzle: '' };
    (art.t || []).forEach(function (pair, idx) {
      var name = pair[0], n = pair[1];
      if (name === 'bbq') { layers.drizzle += drizzle(r, '#4A1E0E', 5) + g(drizzle(r, '#4A1E0E', 5), 'rotate(90 200 150)'); return; }
      if (name === 'mayo') { layers.drizzle += g(drizzle(r, '#FFF8E6', 4), 'rotate(20 200 150)'); return; }
      if (name === 'ketcap') { layers.drizzle += g(drizzle(r, '#C8261A', 4), 'rotate(-25 200 150)'); return; }
      var fn = T[name]; if (!fn) return;
      var R = name === 'misir' || name === 'kekik' ? 96 : 86;
      var out = sunflower(n, R, r, idx * 1.7 + r() * 6, fn);
      if (name === 'cheddar' || name === 'extramoz') layers.base += out; else layers.top += out;
    });
    return s + layers.base + layers.top + layers.drizzle;
  }

  // ---------------- BURGER (yan görünüm) ----------------
  function burger(art, key) {
    var r = rng(key);
    var s = ellipse(206, 268, 130, 12, '#000', 'opacity=".4"') + '<rect x="70" y="248" width="260" height="22" rx="8" fill="#8A5A32"/><rect x="70" y="248" width="260" height="6" rx="3" fill="#A06C3E"/>';
    var y = 248, L = 112, R = 288;
    function layer(h, draw) { y -= h; s += draw(y, h); }
    // alt ekmek
    layer(30, function (t, h) { return '<path d="M' + L + ' ' + t + ' H' + R + ' Q' + (R + 2) + ' ' + (t + h) + ' ' + (R - 18) + ' ' + (t + h) + ' H' + (L + 18) + ' Q' + (L - 2) + ' ' + (t + h) + ' ' + L + ' ' + t + 'Z" fill="#D18A3A"/><rect x="' + L + '" y="' + t + '" width="' + (R - L) + '" height="7" fill="#F1D3A0"/>'; });
    if (art.sauce) layer(5, function (t) { return '<path d="M' + (L + 4) + ' ' + t + ' H' + (R - 4) + ' v5 q-10 6 -20 0 q-14 7 -28 0 q-16 8 -32 0 q-14 6 -28 0 q-16 7 -32 0 q-14 6 -26 0Z" fill="' + art.sauce + '"/>'; });
    function patty(thick) {
      var h = thick ? 32 : 26;
      layer(h, function (t, hh) {
        var p = '<rect x="' + (L - 6) + '" y="' + t + '" width="' + (R - L + 12) + '" height="' + hh + '" rx="' + hh / 2 + '" fill="#4E2614"/>';
        for (var i = 0; i < 14; i++) p += circle(L + r() * (R - L), t + 5 + r() * (hh - 10), 1.6 + r() * 1.4, '#6E3A1E', 'opacity=".8"');
        p += '<path d="M' + (L + 4) + ' ' + (t + 4) + ' H' + (R - 4) + '" stroke="#7A4224" stroke-width="2" opacity=".6"/>';
        return p;
      });
    }
    function cheese() {
      layer(7, function (t) { return '<path d="M' + (L - 4) + ' ' + t + ' H' + (R + 4) + ' v6 l-14 0 l-8 16 l-8 -16 H' + (L + 64) + ' l-10 20 l-10 -20 H' + (L - 4) + 'Z" fill="#F5B52E"/>'; });
    }
    if (art.chicken === 'crispy') {
      layer(34, function (t, h) {
        var p = '<path d="M' + (L - 10) + ' ' + (t + 12) + ' Q' + (L - 4) + ' ' + (t - 2) + ' ' + (L + 30) + ' ' + (t + 2) + ' Q200 ' + (t - 6) + ' ' + (R - 20) + ' ' + (t + 1) + ' Q' + (R + 14) + ' ' + (t + 6) + ' ' + (R + 10) + ' ' + (t + 20) + ' Q' + (R + 6) + ' ' + (t + h + 4) + ' ' + (R - 30) + ' ' + (t + h) + ' Q200 ' + (t + h + 6) + ' ' + (L + 20) + ' ' + (t + h) + ' Q' + (L - 16) + ' ' + (t + h) + ' ' + (L - 10) + ' ' + (t + 12) + 'Z" fill="#C2702A"/>';
        for (var i = 0; i < 22; i++) p += circle(L - 4 + r() * (R - L + 8), t + 4 + r() * (h - 6), 2 + r() * 2.5, r() > .5 ? '#DE9440' : '#A85A1E');
        return p;
      });
    } else if (art.chicken === 'grill') {
      layer(26, function (t, h) {
        var p = '<rect x="' + (L - 8) + '" y="' + t + '" width="' + (R - L + 16) + '" height="' + h + '" rx="12" fill="#D9A465"/>';
        for (var i = 0; i < 6; i++) p += '<path d="M' + (L + 10 + i * 28) + ' ' + (t + 3) + ' l12 ' + (h - 6) + '" stroke="#6E3A1A" stroke-width="3.4" stroke-linecap="round"/>';
        return p;
      });
    } else {
      var n = art.patties || 1;
      for (var pi = 0; pi < n; pi++) { patty(art.thick); if (art.cheese) cheese(); }
    }
    if (art.kaburga) layer(10, function (t) { var p = ''; for (var i = 0; i < 5; i++) p += at(L + 18 + i * 32, t + 5, (r() - .5) * 20, '<rect x="-16" y="-5" width="32" height="10" rx="4" fill="#5E2A14"/><path d="M-8 -5 v10 M2 -5 v10" stroke="#2E130A" stroke-width="1.5" opacity=".7"/>'); return p; });
    if (art.onion) layer(8, function (t) { var p = ''; for (var i = 0; i < 9; i++) p += '<path d="M' + f(L + 4 + i * 20) + ' ' + (t + 6) + ' q8 -9 16 0" stroke="#B5742E" stroke-width="4" fill="none" stroke-linecap="round"/>'; return p; });
    if (art.chicken || art.cheese) {
      layer(8, function (t) { return '<rect x="' + (L + 2) + '" y="' + t + '" width="' + (R - L - 4) + '" height="8" rx="3" fill="#D8402B"/><rect x="' + (L + 70) + '" y="' + t + '" width="4" height="8" fill="#F08A70"/>'; });
    }
    if (art.jalapeno) layer(6, function (t) { var p = ''; for (var i = 0; i < 6; i++) p += ellipse(L + 16 + i * 30, t + 3, 9, 4, '#7FBF4A', 'stroke="#3E8A2C" stroke-width="1.6"'); return p; });
    // marul
    layer(10, function (t) {
      var d = 'M' + (L - 12) + ' ' + (t + 10);
      for (var x = L - 12; x < R + 12; x += 16) d += ' q8 -14 16 0';
      return '<path d="' + d + ' V' + (t + 12) + ' H' + (L - 12) + 'Z" fill="#6DB33F"/><path d="' + d + '" stroke="#4E8F2A" stroke-width="2" fill="none"/>';
    });
    // üst ekmek
    var top = y;
    s += '<path d="M' + (L - 6) + ' ' + top + ' C' + (L - 6) + ' ' + (top - 92) + ' ' + (R + 6) + ' ' + (top - 92) + ' ' + (R + 6) + ' ' + top + 'Z" fill="#D58A36"/>';
    s += '<path d="M' + (L + 14) + ' ' + (top - 30) + ' C' + (L + 24) + ' ' + (top - 70) + ' ' + (L + 80) + ' ' + (top - 78) + ' 200 ' + (top - 74) + '" stroke="#ECB062" stroke-width="10" fill="none" stroke-linecap="round" opacity=".7"/>';
    for (var sd = 0; sd < 16; sd++) {
      var sx = L + 14 + r() * (R - L - 28), dy = Math.abs(sx - 200) / 88;
      var sy = top - 64 + dy * dy * 40 + r() * 14;
      s += ellipse(sx, sy, 3.6, 1.8, '#F6E8C8', 'transform="rotate(' + Math.round((r() - .5) * 70) + ' ' + f(sx) + ' ' + f(sy) + ')"');
    }
    return s;
  }

  // ---------------- ÇITIR LEZZETLER ----------------
  function plateOval(cx, cy, rx, ry) {
    return shadow(cx, cy, rx, ry) + ellipse(cx, cy, rx, ry, '#E9E0D3') + ellipse(cx, cy, rx * .86, ry * .8, '#F4EDE3', 'stroke="#D3C6B4" stroke-width="1.5"');
  }
  function garlic(art, key) {
    var r = rng(key), s = plateOval(200, 154, 168, 104);
    [[120, 150, -20], [178, 146, -12], [236, 150, -4], [292, 158, 6]].forEach(function (p) {
      var inner = '<path d="M-28 -40 Q0 -54 28 -40 L30 40 Q0 52 -30 40Z" fill="#B87430"/><path d="M-22 -34 Q0 -45 22 -34 L24 34 Q0 43 -24 34Z" fill="#EDC679"/>';
      inner += ellipse(-6, -8, 12, 18, '#F6DE9A', 'opacity=".8"');
      for (var i = 0; i < 14; i++) inner += circle((r() - .5) * 38, (r() - .5) * 64, 1.4, '#4E7A2C');
      if (art.cheese) inner += '<path d="M-22 -20 Q-10 -30 4 -24 Q22 -26 20 -8 Q26 10 12 18 Q-4 30 -18 18 Q-28 2 -22 -20Z" fill="#FFF3D2" opacity=".95"/>' + ellipse(6, 4, 9, 7, '#F2A33A', 'opacity=".8"');
      if (art.sucuk) inner += circle(-8, -16, 8, '#A82A1C') + circle(8, 10, 8, '#A82A1C') + circle(-6, 22, 7, '#A82A1C') + circle(-10, -18, 1.4, '#F0D2B0') + circle(9, 8, 1.4, '#F0D2B0');
      s += at(p[0], p[1], p[2], inner);
    });
    return s;
  }
  function fries(art, key) {
    var r = rng(key), s = ellipse(206, 270, 96, 12, '#000', 'opacity=".4"');
    var back = '', front = '';
    for (var i = 0; i < 26; i++) {
      var x = 140 + r() * 120, h = 70 + r() * 70, rot = (r() - .5) * 30;
      if (art.wedge) back += at(x, 150 - h / 3, rot, '<path d="M-10 40 Q-14 -10 0 -44 Q14 -10 10 40Z" fill="#E8A845"/><path d="M6 40 Q11 -10 0 -44" stroke="#9C5A22" stroke-width="5" fill="none"/>' + circle(-3, 0, 1.3, '#4E7A2C'));
      else back += at(x, 150 - h / 3, rot, '<rect x="-6" y="-48" width="12" height="96" rx="3" fill="#F2C24A"/><rect x="-6" y="-48" width="4" height="96" rx="2" fill="#F8DA7A"/><rect x="-6" y="-48" width="12" height="6" rx="3" fill="#D99A2A"/>');
    }
    front += '<path d="M128 150 L272 150 L256 262 L144 262Z" fill="#2A2A2A" opacity=".25"/>';
    var wire = '<path d="M126 148 L274 148 L258 264 L142 264Z" fill="none" stroke="#5E5E5E" stroke-width="5" stroke-linejoin="round"/>';
    for (var k = 1; k < 8; k++) { var xt = 126 + k * 18.5, xb = 142 + k * 14.5; wire += '<line x1="' + f(xt) + '" y1="148" x2="' + f(xb) + '" y2="264" stroke="#6E6E6E" stroke-width="2.4"/>'; }
    for (var j = 1; j < 5; j++) { var yy = 148 + j * 23, inset = j * 23 * 16 / 116; wire += '<line x1="' + f(126 + inset) + '" y1="' + yy + '" x2="' + f(274 - inset) + '" y2="' + yy + '" stroke="#6E6E6E" stroke-width="2.4"/>'; }
    wire += '<path d="M274 160 q40 6 34 40" stroke="#5E5E5E" stroke-width="6" fill="none" stroke-linecap="round"/>';
    var fill = '<path d="M130 150 L270 150 L256 260 L144 260Z" fill="' + (art.wedge ? '#E3A040' : '#F0BE45') + '"/>';
    for (var q = 0; q < 30; q++) fill += circle(146 + r() * 108, 158 + r() * 96, 3 + r() * 3, art.wedge ? '#B8702A' : '#D9A02E', 'opacity=".6"');
    return s + back + fill + front + wire;
  }
  function basket(art, key) {
    var r = rng(key);
    var s = shadow(200, 152, 166, 108) + '<rect x="36" y="48" width="328" height="208" rx="22" fill="#1E1C1B"/><rect x="48" y="60" width="304" height="184" rx="16" fill="#2B2826"/>';
    s += '<path d="M62 74 H338 V232 H62Z" fill="#EFE6D6"/>';
    for (var gx = 0; gx < 9; gx++) s += '<line x1="' + (62 + gx * 34.5) + '" y1="74" x2="' + (62 + gx * 34.5) + '" y2="232" stroke="#D84A34" stroke-width="2" opacity=".35"/>';
    for (var i = 0; i < 22; i++) s += at(214 + r() * 110, 90 + r() * 120, r() * 180, '<rect x="-5" y="-30" width="10" height="60" rx="3" fill="#F2C24A"/><rect x="-5" y="-30" width="3" height="60" rx="1.5" fill="#F8DA7A"/>');
    for (var c = 0; c < 5; c++) {
      var cx = 92 + (c % 3) * 44 + r() * 8, cy = 104 + Math.floor(c / 3) * 62 + r() * 10;
      var p = '<path d="M-26 -12 Q-10 -24 14 -18 Q30 -8 26 8 Q14 22 -10 18 Q-30 12 -26 -12Z" fill="#B5612A"/>';
      for (var k = 0; k < 9; k++) p += circle((r() - .5) * 44, (r() - .5) * 28, 2 + r() * 2.4, r() > .5 ? '#D98A3A' : '#8E4418');
      s += at(cx, cy, r() * 60 - 30, p);
    }
    s += circle(108, 212, 18, 'none', 'stroke="#E6B060" stroke-width="9"') + circle(150, 216, 16, 'none', 'stroke="#D99E4E" stroke-width="8"');
    s += circle(304, 214, 24, '#F4F0E8') + circle(304, 214, 19, '#F7F4EC') + circle(304, 214, 19, 'none', 'stroke="#DDD5C8"');
    s += circle(250, 222, 24, '#F4F0E8') + circle(250, 222, 19, '#C8261A');
    return s;
  }
  function sufle(art, key) {
    var r = rng(key), s = plateOval(200, 160, 150, 96);
    s += ellipse(200, 162, 96, 62, '#7A3A1E') + ellipse(200, 156, 90, 56, '#A2552E') + ellipse(200, 152, 76, 46, '#3A1A10');
    s += ellipse(186, 140, 40, 18, '#5A2C18', 'opacity=".8"');
    s += '<path d="M170 150 l14 -10 l10 12 l14 -14 l12 10" stroke="#24100A" stroke-width="3" fill="none" stroke-linecap="round"/>';
    for (var i = 0; i < 70; i++) { var a = r() * Math.PI * 2, d = Math.sqrt(r()); s += circle(200 + Math.cos(a) * d * 70, 150 + Math.sin(a) * d * 40, .9 + r() * 1.2, '#FFFFFF', 'opacity=".85"'); }
    s += ellipse(300, 214, 22, 12, '#F7F1E4') + ellipse(296, 210, 9, 5, '#ffffff');
    return s;
  }

  // ---------------- İÇECEKLER (markasız) ----------------
  var icons = {
    cola: function (x, y) { return circle(x - 6, y + 4, 3, '#fff', 'opacity=".55"') + circle(x + 5, y - 3, 4, '#fff', 'opacity=".45"') + circle(x + 2, y + 9, 2, '#fff', 'opacity=".5"'); },
    soda: function (x, y) { return circle(x - 6, y + 4, 3, '#6FB6D8', 'opacity=".7"') + circle(x + 5, y - 3, 4, '#6FB6D8', 'opacity=".6"') + circle(x + 2, y + 9, 2, '#6FB6D8', 'opacity=".7"'); },
    orange: function (x, y) { return circle(x, y, 12, '#F7A22E') + circle(x, y, 9, '#FDD08A') + '<path d="M' + x + ' ' + (y - 9) + ' V' + (y + 9) + ' M' + (x - 9) + ' ' + y + ' H' + (x + 9) + ' M' + (x - 6) + ' ' + (y - 6) + ' L' + (x + 6) + ' ' + (y + 6) + ' M' + (x + 6) + ' ' + (y - 6) + ' L' + (x - 6) + ' ' + (y + 6) + '" stroke="#F7A22E" stroke-width="1.4"/>'; },
    lemon: function (x, y) { return circle(x, y, 12, '#F2D33A') + circle(x, y, 9, '#FBEB9A') + '<path d="M' + x + ' ' + (y - 9) + ' V' + (y + 9) + ' M' + (x - 9) + ' ' + y + ' H' + (x + 9) + '" stroke="#F2D33A" stroke-width="1.4"/>'; },
    peach: function (x, y) { return circle(x, y, 12, '#F3A066') + ellipse(x - 3, y - 2, 6, 8, '#F8C79A', 'opacity=".8"') + ellipse(x + 6, y - 13, 6, 3, '#4E8F2A', 'transform="rotate(-30 ' + (x + 6) + ' ' + (y - 13) + ')"'); },
    mango: function (x, y) { return ellipse(x - 4, y, 9, 12, '#F5B731') + ellipse(x + 8, y + 2, 7, 9, '#E8D24A') + '<path d="M' + (x + 8) + ' ' + (y - 7) + ' l-3 -8 M' + (x + 8) + ' ' + (y - 7) + ' l4 -8" stroke="#4E8F2A" stroke-width="2"/>'; },
    cherry: function (x, y) { return circle(x - 6, y + 4, 7, '#9E1B2E') + circle(x + 6, y + 5, 7, '#B42238') + '<path d="M' + (x - 6) + ' ' + (y - 3) + ' Q' + x + ' ' + (y - 16) + ' ' + (x + 4) + ' ' + (y - 16) + ' M' + (x + 6) + ' ' + (y - 2) + ' Q' + (x + 4) + ' ' + (y - 10) + ' ' + (x + 4) + ' ' + (y - 16) + '" stroke="#4E6A2A" stroke-width="2" fill="none"/>'; },
    mixed: function (x, y) { return circle(x - 7, y, 8, '#F7A22E') + circle(x + 6, y - 3, 7, '#C8261A') + circle(x + 2, y + 7, 6, '#F2D33A'); },
  };
  function can(x, color, icon, h) {
    h = h || 150;
    var top = 262 - h;
    return ellipse(x + 4, 266, 40, 7, '#000', 'opacity=".35"') +
      '<rect x="' + (x - 34) + '" y="' + top + '" width="68" height="' + h + '" rx="12" fill="' + color + '"/>' +
      '<rect x="' + (x - 34) + '" y="' + top + '" width="68" height="14" rx="6" fill="#C9CDD2"/><rect x="' + (x - 30) + '" y="' + (top - 4) + '" width="60" height="8" rx="4" fill="#AEB3B9"/>' +
      '<rect x="' + (x - 34) + '" y="' + (262 - 12) + '" width="68" height="12" rx="6" fill="#B7BCC2"/>' +
      '<rect x="' + (x - 34) + '" y="' + (top + h * .38) + '" width="68" height="' + h * .3 + '" fill="#ffffff" opacity=".9"/>' +
      (icons[icon] || icons.cola)(x, top + h * .53) +
      '<rect x="' + (x - 26) + '" y="' + (top + 16) + '" width="7" height="' + (h - 30) + '" rx="3" fill="#fff" opacity=".18"/>';
  }
  function bottle(x, color, icon, liquid) {
    var top = 70;
    return ellipse(x + 4, 266, 36, 7, '#000', 'opacity=".35"') +
      '<rect x="' + (x - 12) + '" y="' + (top - 22) + '" width="24" height="20" rx="4" fill="' + (color === '#E9EEF0' ? '#2E8A4F' : '#D8262A') + '"/>' +
      '<path d="M' + (x - 11) + ' ' + top + ' h22 q4 26 22 40 v134 q0 16 -16 16 h-34 q-16 0 -16 -16 v-134 q18 -14 22 -40z" fill="' + (liquid || color) + '" opacity=".92"/>' +
      '<rect x="' + (x - 33) + '" y="' + (top + 76) + '" width="66" height="54" fill="' + color + '"/>' +
      '<rect x="' + (x - 33) + '" y="' + (top + 84) + '" width="66" height="38" fill="#ffffff" opacity=".9"/>' +
      (icons[icon] || icons.cola)(x, top + 103) +
      '<path d="M' + (x - 22) + ' ' + (top + 54) + ' v150" stroke="#fff" stroke-width="6" opacity=".22" stroke-linecap="round"/>';
  }
  function drinkArt(art) {
    var liquid = art.icon === 'cola' ? '#2A120C' : art.icon === 'soda' || art.icon === 'lemon' && art.color === '#2E9E4F' ? '#DDF0E2' : null;
    if (art.both) return can(150, art.color, art.icon, 140) + bottle(250, art.color, art.icon, liquid);
    return can(200, art.color, art.icon, 170);
  }
  function ayran() {
    var s = ellipse(254, 266, 38, 7, '#000', 'opacity=".35"') +
      '<rect x="240" y="44" width="28" height="22" rx="5" fill="#2A63B8"/>' +
      '<path d="M241 66 h26 q2 22 20 34 v146 q0 16 -16 16 h-34 q-16 0 -16 -16 v-146 q18 -12 20 -34z" fill="#FBFBF8"/>' +
      '<rect x="221" y="150" width="66" height="46" fill="#2A8ED8" opacity=".9"/><path d="M221 196 q33 -16 66 0" fill="#7CC243"/>';
    s += ellipse(150, 266, 46, 8, '#000', 'opacity=".35"') +
      '<path d="M108 150 h84 l-8 108 q-34 10 -68 0z" fill="#FBFBF8"/><ellipse cx="150" cy="150" rx="42" ry="9" fill="#2A63B8"/>' +
      '<rect x="112" y="180" width="76" height="34" fill="#2A8ED8" opacity=".9"/><path d="M113 214 q37 -14 74 0" fill="#7CC243"/>';
    return s;
  }
  function sauce(art, key) {
    var r = rng(key);
    var s = shadow(200, 150, 104) + circle(200, 150, 104, '#E9E3D9') + circle(200, 150, 96, '#F6F2EC') + circle(200, 150, 80, '#DAD2C5') + circle(200, 150, 76, art.color);
    s += '<path d="M150 150 C 160 112, 240 112, 250 150 S 212 186, 192 160" stroke="#ffffff" stroke-width="7" fill="none" stroke-linecap="round" opacity=".28"/>';
    if (art.herbs) for (var i = 0; i < 30; i++) { var a = r() * 6.283, d = Math.sqrt(r()) * 66; s += circle(200 + Math.cos(a) * d, 150 + Math.sin(a) * d, 1.4, '#4E7A2C'); }
    if (art.flakes) for (var j = 0; j < 30; j++) { var b = r() * 6.283, e = Math.sqrt(r()) * 66; s += circle(200 + Math.cos(b) * e, 150 + Math.sin(b) * e, 1.3, '#7A1A0E'); }
    return s;
  }

  var renderers = {
    pizza: pizza, burger: burger, garlic: garlic, fries: fries, basket: basket, sufle: sufle,
    drink: drinkArt, ayran: ayran, sauce: sauce,
  };

  function normalize(art) {
    if (!art) return { type: 'pizza', t: [['extramoz', 6], ['cherry', 6], ['feslegen', 8]] };
    if (typeof art === 'string') return { type: art };
    return art;
  }

  function render(art, opts) {
    opts = opts || {};
    art = normalize(art);
    var key = opts.key || JSON.stringify(art);
    var id = 'il' + (++uidN);
    var fn = renderers[art.type] || renderers.pizza;
    var bg = opts.bare ? '' :
      '<defs><radialGradient id="' + id + 'b" cx="30%" cy="20%" r="95%"><stop offset="0" stop-color="#3A2518"/><stop offset=".55" stop-color="#22160F"/><stop offset="1" stop-color="#150E0A"/></radialGradient></defs>' +
      '<rect width="400" height="300" fill="url(#' + id + 'b)"/>' +
      '<path d="M0 60 C 120 52, 280 70, 400 58 M0 140 C 140 132, 260 150, 400 138 M0 230 C 110 222, 300 240, 400 226" stroke="#ffffff" stroke-opacity=".035" stroke-width="2" fill="none"/>';
    return '<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + (opts.label || '').replace(/"/g, '&quot;') + '" preserveAspectRatio="xMidYMid slice">' + bg + fn(art, key) + '</svg>';
  }

  /** Ürün görselini döndürür: fotoğraf varsa <img>, yoksa SVG illüstrasyon */
  function itemMedia(item, opts) {
    opts = opts || {};
    var src = item.image;
    if (opts.portion && item.portions) item.portions.forEach(function (p) { if (p.id === opts.portion && p.image) src = p.image; });
    if (src && !opts.art) return '<img class="ph ph--' + (item.imageKind || 'food') + '" src="' + src + '" alt="' + item.name.replace(/"/g, '&quot;') + '" loading="lazy" decoding="async">';
    return render(item.art, Object.assign({ label: item.name, key: item.id }, opts || {}));
  }

  App.illustrations = { render: render, itemMedia: itemMedia, has: function (k) { return !!renderers[normalize(k).type]; } };
})(window.App = window.App || {});
