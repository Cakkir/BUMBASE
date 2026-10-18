/* Yardımcı fonksiyonlar */
(function (App) {
  var moneyFmt = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 2 });
  var moneyFmt0 = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 });

  function money(n, short) {
    if (short && Math.round(n) === n) return moneyFmt0.format(n);
    return moneyFmt.format(n || 0);
  }

  function esc(s) {
    return (s == null ? '' : String(s)).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  // localStorage gizli pencerede / engellendiğinde hata fırlatabilir: her erişim korumalı
  var storage = {
    get: function (k, fallback) {
      try { var v = localStorage.getItem(k); return v == null ? fallback : JSON.parse(v); } catch (e) { return fallback; }
    },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
    remove: function (k) { try { localStorage.removeItem(k); } catch (e) { /* yok say */ } },
  };
  var session = {
    get: function (k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* yok say */ } },
    remove: function (k) { try { sessionStorage.removeItem(k); } catch (e) { /* yok say */ } },
  };

  function debounce(fn, ms) {
    var t;
    return function () { var a = arguments, s = this; clearTimeout(t); t = setTimeout(function () { fn.apply(s, a); }, ms); };
  }

  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function hhmm(d) { d = new Date(d); return pad(d.getHours()) + ':' + pad(d.getMinutes()); }
  function dateTR(d) {
    return new Date(d).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' });
  }

  function minutesAgo(d) { return Math.max(0, Math.round((Date.now() - new Date(d).getTime()) / 60000)); }
  function timeAgo(d) {
    var m = minutesAgo(d);
    if (m < 1) return 'şimdi';
    if (m < 60) return m + ' dk önce';
    var h = Math.floor(m / 60);
    if (h < 24) return h + ' sa önce';
    return dateTR(d);
  }

  function toMin(t) { var p = t.split(':'); return parseInt(p[0], 10) * 60 + parseInt(p[1], 10); }

  /** Çalışma saatlerine göre şu an açık mı? Gece yarısını geçen kapanışları da dikkate alır. */
  function openState(hours, now) {
    now = now || new Date();
    var day = now.getDay(), mins = now.getHours() * 60 + now.getMinutes();
    var today = hours[day], yest = hours[(day + 6) % 7];
    // Dünün gece yarısını geçen vardiyası hâlâ sürüyor mu?
    if (yest && yest.open && toMin(yest.close) < toMin(yest.open) && mins < toMin(yest.close)) {
      return { open: true, label: 'Açık', detail: yest.close + '’e kadar', today: today };
    }
    if (today && today.open) {
      var o = toMin(today.open), c = toMin(today.close);
      var crosses = c < o;
      if (mins >= o && (crosses || mins < c)) return { open: true, label: 'Açık', detail: today.close + '’e kadar', today: today };
      if (mins < o) return { open: false, label: 'Kapalı', detail: 'Bugün ' + today.open + '’de açılıyor', today: today };
    }
    for (var i = 1; i <= 7; i++) {
      var n = hours[(day + i) % 7];
      if (n && n.open) return { open: false, label: 'Kapalı', detail: (i === 1 ? 'Yarın ' : n.label + ' ') + n.open + '’de açılıyor', today: today };
    }
    return { open: false, label: 'Kapalı', detail: '', today: today };
  }

  /** Tüm günler aynıysa "Her gün 12:00 – 05:00" döndürür, değilse null */
  function hoursSummary(hours) {
    var f = hours[0];
    var same = hours.every(function (h) { return h.open === f.open && h.close === f.close; });
    if (!same) return null;
    return f.open ? 'Her gün ' + f.open + ' – ' + f.close : 'Kapalı';
  }

  function formatPhone(p) {
    var d = (p || '').replace(/\D/g, '');
    if (d.length === 11) return d.replace(/(\d{4})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4');
    return p;
  }

  function copyText(text, btn) {
    function done(ok) {
      if (!btn) return;
      var old = btn.getAttribute('data-label') || btn.textContent;
      btn.setAttribute('data-label', old);
      btn.textContent = ok ? 'Kopyalandı' : 'Seçip kopyalayın';
      setTimeout(function () { btn.textContent = old; }, 1600);
    }
    try {
      navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
    } catch (e) { done(false); }
  }

  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  App.utils = {
    money: money, esc: esc, $: $, $$: $$, storage: storage, session: session, debounce: debounce,
    hhmm: hhmm, dateTR: dateTR, timeAgo: timeAgo, minutesAgo: minutesAgo, openState: openState, hoursSummary: hoursSummary, toMin: toMin, pad: pad,
    formatPhone: formatPhone, copyText: copyText, wait: wait,
  };
})(window.App = window.App || {});
