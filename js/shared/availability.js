/**
 * Sipariş alınabilirlik kuralları — tarayıcı ve sunucu aynı kodu kullanır.
 *   - Çalışma saatleri (Türkiye saati; gece yarısını geçen vardiyalar dahil)
 *   - Dükkân kapalıyken ne anında ne ileri saatli sipariş alınır
 *   - Panelden "Siparişleri durdur" (paused) ve "Tükendi" (soldOut) durumları
 *
 * status = { paused: boolean, soldOut: [ürün id], updatedAt }
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory;
  else { root.App = root.App || {}; root.App.availability = factory(root.App.config, root.App.menu); }
})(typeof self !== 'undefined' ? self : this, function (config, menu) {
  var OFFSET = typeof config.utcOffsetMinutes === 'number' ? config.utcOffsetMinutes : 180;
  var names = {};
  (menu && menu.items || []).forEach(function (it) { names[it.id] = it.name; });

  function toMin(t) { var p = String(t).split(':'); return parseInt(p[0], 10) * 60 + parseInt(p[1], 10); }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function fmt(m) { m = ((m % 1440) + 1440) % 1440; return pad(Math.floor(m / 60)) + ':' + pad(m % 60); }

  /** Restoranın yerel saati: { day (0=Pazar), mins (gün içindeki dakika) } */
  function clock(now) {
    var d = new Date((now ? new Date(now).getTime() : Date.now()) + OFFSET * 60000);
    return { day: d.getUTCDay(), mins: d.getUTCHours() * 60 + d.getUTCMinutes() };
  }

  /**
   * Şu an açık olan vardiya, bugünün 00:00'ından itibaren sürekli dakika ölçeğinde.
   * Açık değilse null. { now, end, close }
   */
  function shift(now, hours) {
    hours = hours || config.hours;
    var c = clock(now), m = c.mins;
    var today = hours[c.day], yest = hours[(c.day + 6) % 7];
    if (yest && yest.open && toMin(yest.close) < toMin(yest.open) && m < toMin(yest.close)) {
      return { now: m, end: toMin(yest.close), close: yest.close };
    }
    if (today && today.open) {
      var o = toMin(today.open), cl = toMin(today.close), crosses = cl < o;
      if (m >= o && (crosses || m < cl)) return { now: m, end: crosses ? cl + 1440 : cl, close: today.close };
    }
    return null;
  }

  /** Rapor günü: restoran saatiyle, gün config.reportDayStart'ta (06:00) başlar → 'YYYY-AA-GG' */
  function businessDay(date) {
    var start = toMin(config.reportDayStart || '06:00');
    var d = new Date(new Date(date).getTime() + (OFFSET - start) * 60000);
    return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate());
  }
  /** 'YYYY-AA-GG' + n gün */
  function addDays(day, n) {
    var d = new Date(day + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  }
  /** Haftanın günü (0 = Pazar) */
  function weekday(day) { return new Date(day + 'T12:00:00Z').getUTCDay(); }

  /** Başlık / sayfalar için açık-kapalı bilgisi */
  function openState(hours, now) {
    hours = hours || config.hours;
    var c = clock(now), today = hours[c.day];
    var s = shift(now, hours);
    if (s) return { open: true, label: 'Açık', detail: s.close + '’e kadar', today: today };
    if (today && today.open && c.mins < toMin(today.open)) return { open: false, label: 'Kapalı', detail: 'Bugün ' + today.open + '’de açılıyor', today: today, opensAt: today.open };
    for (var i = 1; i <= 7; i++) {
      var n = hours[(c.day + i) % 7];
      if (n && n.open) return { open: false, label: 'Kapalı', detail: (i === 1 ? 'Yarın ' : n.label + ' ') + n.open + '’de açılıyor', today: today, opensAt: n.open };
    }
    return { open: false, label: 'Kapalı', detail: '', today: today };
  }

  var LEAD_MIN = 60;   // ileri saat seçeneği en erken şimdiden 60 dk sonra
  var GRACE_MIN = 30;  // sunucu, formun açık kaldığı süreyi tolere eder
  var LAST_MIN = 15;   // kapanıştan en az 15 dk önce

  /** İleri saat seçenekleri: yalnızca şu anki açık vardiyanın içinde, 30 dk aralıklarla */
  function slots(now) {
    var s = shift(now);
    if (!s) return [];
    var out = [];
    for (var m = Math.ceil((s.now + LEAD_MIN) / 30) * 30; m <= s.end - LAST_MIN && out.length < 40; m += 30) out.push(fmt(m));
    return out;
  }

  /** Seçilen saat şu anki vardiyanın içinde mi? */
  function validTime(time, now) {
    if (!/^\d{2}:\d{2}$/.test(time || '')) return false;
    var s = shift(now);
    if (!s) return false;
    var t = toMin(time);
    if (t < s.now) t += 1440;
    return t >= s.now + GRACE_MIN && t <= s.end - LAST_MIN;
  }

  function normalize(st) {
    st = st || {};
    return {
      paused: !!st.paused,
      soldOut: Array.isArray(st.soldOut) ? st.soldOut.filter(function (id) { return !!names[id]; }) : [],
      updatedAt: st.updatedAt || null,
    };
  }

  /** Satırdaki ürün ve menü seçimlerinin id'leri */
  function lineIds(l) {
    var ids = [l.id], c = l.choices;
    if (Array.isArray(c)) c.forEach(function (x) { if (x && x.item) ids.push(x.item); });
    else if (c && typeof c === 'object') Object.keys(c).forEach(function (k) { ids.push(c[k]); });
    return ids;
  }

  function isSoldOut(status, id) { return !!(status && status.soldOut && status.soldOut.indexOf(id) >= 0); }

  /**
   * Genel sipariş durumu (sepetten bağımsız)
   * → { ok: true } | { ok: false, code: 'paused'|'closed', title, message }
   */
  function ordering(status, now) {
    status = normalize(status);
    if (status.paused) return { ok: false, code: 'paused', title: 'Şu an sipariş alamıyoruz', message: 'Yoğunluk nedeniyle sipariş alımına kısa bir ara verdik. Lütfen biraz sonra tekrar deneyin.' };
    var st = openState(config.hours, now);
    if (!st.open) return { ok: false, code: 'closed', title: 'Şu an kapalıyız', message: (st.detail ? st.detail + '. ' : '') + 'Kapalı saatlerde anında veya ileri saatli sipariş alınmıyor.' };
    return { ok: true };
  }

  /**
   * Sipariş formunun alınabilirlik kontrolü (validateCheckout'a ek olarak)
   * → null | { code, error, soldOut?, fieldErrors? }
   */
  function check(p, status, now) {
    p = p || {};
    var o = ordering(status, now);
    if (!o.ok) return { code: o.code, error: o.title + '. ' + o.message };
    var out = [];
    (p.lines || []).forEach(function (l) { lineIds(l).forEach(function (id) { if (isSoldOut(status, id)) out.push(id); }); });
    if (out.length) {
      var list = out.filter(function (id, i) { return out.indexOf(id) === i; });
      return { code: 'soldout', soldOut: list, error: 'Sepetinizdeki şu ürün(ler) tükendi: ' + list.map(function (id) { return names[id] || id; }).join(', ') + '. Lütfen sepetten çıkarın.' };
    }
    if (p.schedule && p.schedule.type === 'later' && !validTime(p.schedule.time, now)) {
      return { code: 'schedule', error: 'Seçtiğiniz teslimat saati artık uygun değil.', fieldErrors: { scheduleTime: 'Bugünkü çalışma saatleri içinde, şimdiden en az 30 dk sonrası bir saat seçin.' } };
    }
    return null;
  }

  return {
    clock: clock, shift: shift, openState: openState, slots: slots, validTime: validTime,
    normalize: normalize, isSoldOut: isSoldOut, lineIds: lineIds, businessDay: businessDay, addDays: addDays, weekday: weekday, ordering: ordering, check: check, toMin: toMin,
  };
});
