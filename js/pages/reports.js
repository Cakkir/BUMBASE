/* Panel raporları: ciro, sipariş sayısı, ödeme yöntemleri, sipariş kaynakları (QR), en çok satanlar
 * Gün, config.reportDayStart saatinde (06:00) başlar; gece yarısından sonraki siparişler önceki güne sayılır. */
(function (App) {
  var U = App.utils, esc = U.esc, money = U.money, cfg = App.config, A = App.availability;
  var DAYS = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
  var MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

  function fmtDay(d, long) {
    var p = d.split('-');
    return parseInt(p[2], 10) + ' ' + MONTHS[parseInt(p[1], 10) - 1] + (long ? ' ' + DAYS[A.weekday(d)] : '');
  }

  /** Dönem → { from, to } (iki uç dahil, 'YYYY-AA-GG') */
  function range(period) {
    var today = A.businessDay(new Date());
    var monday = A.addDays(today, -((A.weekday(today) + 6) % 7));
    switch (period) {
      case 'dun': { var y = A.addDays(today, -1); return { from: y, to: y, label: 'Dün' }; }
      case 'hafta': return { from: monday, to: today, label: 'Bu hafta' };
      case 'gecenhafta': return { from: A.addDays(monday, -7), to: A.addDays(monday, -1), label: 'Geçen hafta' };
      case 'ay': return { from: today.slice(0, 8) + '01', to: today, label: 'Bu ay' };
      case 'son30': return { from: A.addDays(today, -29), to: today, label: 'Son 30 gün' };
      default: return { from: today, to: today, label: 'Bugün' };
    }
  }

  function methodLabel(id) {
    var m = cfg.payment.methods.filter(function (x) { return x.id === id; })[0];
    return m ? m.label : id;
  }

  /** Raporu hesaplar (iptaller ciroya dahil edilmez) */
  function compute(orders, r) {
    var inRange = orders.filter(function (o) { var d = A.businessDay(o.createdAt); return d >= r.from && d <= r.to; });
    var valid = inRange.filter(function (o) { return o.status !== 'iptal'; });
    var canceled = inRange.filter(function (o) { return o.status === 'iptal'; });
    var sum = function (list) { return list.reduce(function (s, o) { return s + o.total; }, 0); };

    var days = [], byDay = {};
    for (var d = r.from; d <= r.to; d = A.addDays(d, 1)) { days.push(d); byDay[d] = { count: 0, revenue: 0 }; }
    var methods = {}, sources = {}, products = {}, hours = new Array(24).fill(0);
    cfg.payment.methods.forEach(function (m) { methods[m.id] = { label: m.label, count: 0, revenue: 0 }; });
    Object.keys(cfg.sources || {}).forEach(function (k) { sources[k] = { label: cfg.sources[k], count: 0, revenue: 0 }; });

    valid.forEach(function (o) {
      var day = A.businessDay(o.createdAt);
      if (byDay[day]) { byDay[day].count++; byDay[day].revenue += o.total; }
      var pm = o.payment && o.payment.method;
      if (!methods[pm]) methods[pm] = { label: methodLabel(pm), count: 0, revenue: 0 };
      methods[pm].count++; methods[pm].revenue += o.total;
      var src = o.source && sources[o.source] ? o.source : 'direkt';
      if (!sources[src]) sources[src] = { label: src, count: 0, revenue: 0 };
      sources[src].count++; sources[src].revenue += o.total;
      (o.lines || []).forEach(function (l) {
        var p = products[l.id] || (products[l.id] = { name: l.name, qty: 0, revenue: 0 });
        p.qty += l.qty; p.revenue += l.total;
      });
      var c = A.clock(o.createdAt); hours[Math.floor(c.mins / 60)]++;
    });

    var revenue = sum(valid);
    return {
      range: r, days: days, byDay: byDay, count: valid.length, revenue: revenue, avg: valid.length ? revenue / valid.length : 0,
      canceled: canceled.length, canceledAmount: sum(canceled),
      methods: Object.keys(methods).map(function (k) { return Object.assign({ id: k }, methods[k]); }),
      sources: Object.keys(sources).map(function (k) { return Object.assign({ id: k }, sources[k]); }),
      products: Object.keys(products).map(function (k) { return Object.assign({ id: k }, products[k]); })
        .sort(function (a, b) { return b.qty - a.qty || b.revenue - a.revenue; }),
      hours: hours,
    };
  }

  // ---------------- Görünüm ----------------
  function tile(label, value, sub) {
    return '<div class="stat"><span class="stat-label">' + label + '</span><b class="num">' + value + '</b><span class="stat-sub">' + sub + '</span></div>';
  }

  /** Günlük ciro sütun grafiği (tek seri, tek eksen) */
  function dayChart(rep) {
    if (rep.days.length < 2) return '';
    var max = Math.max.apply(null, rep.days.map(function (d) { return rep.byDay[d].revenue; })) || 1;
    var many = rep.days.length > 10;
    var bars = rep.days.map(function (d) {
      var v = rep.byDay[d], h = v.revenue ? Math.max(2, Math.round(v.revenue / max * 100)) : 0;
      var tip = fmtDay(d, true) + ' · ' + money(v.revenue, false) + ' · ' + v.count + ' sipariş';
      return '<div class="rpc-col" tabindex="0" aria-label="' + esc(tip) + '"><span class="rpc-tip">' + esc(tip) + '</span>' +
        '<div class="rpc-bar-wrap"><i class="rpc-bar" style="height:' + h + '%"></i></div>' +
        '<span class="rpc-x num">' + (many ? parseInt(d.slice(8), 10) : DAYS[A.weekday(d)] + '<br>' + parseInt(d.slice(8), 10)) + '</span></div>';
    }).join('');
    return '<section class="rp-card rp-card--wide"><h3>Günlük ciro</h3><p class="rp-sub">En yüksek: <b class="num">' + money(max, false) + '</b> · çubukların üzerine gelince detay görünür</p>' +
      '<div class="rpc' + (many ? ' rpc--many' : '') + '" role="img" aria-label="Günlük ciro grafiği">' + bars + '</div></section>';
  }

  /** Yatay oran çubuklu liste: ödeme yöntemi, kaynak */
  function shareList(title, rows, total, note) {
    var list = rows.filter(function (r) { return r.count > 0 || r.keep; });
    var body = list.length ? list.sort(function (a, b) { return b.revenue - a.revenue; }).map(function (r) {
      var pct = total ? Math.round(r.revenue / total * 100) : 0;
      return '<li class="sh-row"><div class="sh-top"><span class="sh-name">' + esc(r.label) + '</span><span class="num sh-val">' + money(r.revenue, false) + '</span></div>' +
        '<div class="sh-track"><i style="width:' + pct + '%"></i></div>' +
        '<div class="sh-meta num">' + r.count + ' sipariş · %' + pct + '</div></li>';
    }).join('') : '<li class="muted">Bu dönemde sipariş yok.</li>';
    return '<section class="rp-card"><h3>' + title + '</h3>' + (note ? '<p class="rp-sub">' + note + '</p>' : '') + '<ul class="sh-list">' + body + '</ul></section>';
  }

  function qrCard(rep) {
    var qr = rep.sources.filter(function (s) { return s.id === 'masa' || s.id === 'brosur'; });
    var n = qr.reduce(function (s, x) { return s + x.count; }, 0), rev = qr.reduce(function (s, x) { return s + x.revenue; }, 0);
    return '<section class="rp-card rp-qr"><h3>QR kodlardan gelen</h3>' +
      '<div class="rp-qr-big"><b class="num">' + n + '</b><span>sipariş · <b class="num">' + money(rev, false) + '</b></span></div>' +
      '<ul class="rp-qr-list">' + qr.map(function (s) { return '<li><span>' + esc(s.label) + '</span><b class="num">' + s.count + ' sipariş</b><span class="num muted">' + money(s.revenue, false) + '</span></li>'; }).join('') + '</ul>' +
      '<p class="rp-sub">Tüm siparişlerin <b class="num">%' + (rep.count ? Math.round(n / rep.count * 100) : 0) + '</b>’i QR koddan geldi.</p></section>';
  }

  function topProducts(rep) {
    var top = rep.products.slice(0, 10);
    if (!top.length) return '<section class="rp-card"><h3>En çok satanlar</h3><p class="muted">Bu dönemde satış yok.</p></section>';
    var max = top[0].qty;
    return '<section class="rp-card"><h3>En çok satanlar</h3><table class="rp-table"><thead><tr><th>#</th><th>Ürün</th><th class="r">Adet</th><th class="r">Ciro</th></tr></thead><tbody>' +
      top.map(function (p, i) {
        return '<tr><td class="num muted">' + (i + 1) + '</td><td><span class="rp-pname">' + esc(p.name) + '</span><i class="rp-pbar" style="width:' + Math.round(p.qty / max * 100) + '%"></i></td><td class="r num">' + p.qty + '</td><td class="r num">' + money(p.revenue, false) + '</td></tr>';
      }).join('') + '</tbody></table></section>';
  }

  function hoursCard(rep) {
    var max = Math.max.apply(null, rep.hours) || 1;
    // Çalışma saatlerine göre 12:00 → 05:00 sırası
    var order = []; for (var h = 12; h < 36; h++) order.push(h % 24);
    order = order.filter(function (h) { return h >= 12 || h < 6 || rep.hours[h]; });
    var peak = rep.hours.indexOf(Math.max.apply(null, rep.hours));
    return '<section class="rp-card rp-card--wide"><h3>Saatlere göre sipariş</h3>' + (rep.count ? '<p class="rp-sub">En yoğun saat: <b class="num">' + U.pad(peak) + ':00 – ' + U.pad((peak + 1) % 24) + ':00</b></p>' : '') +
      '<div class="rpc rpc--hours" role="img" aria-label="Saatlere göre sipariş sayısı">' + order.map(function (h) {
        var v = rep.hours[h], tip = U.pad(h) + ':00 · ' + v + ' sipariş';
        return '<div class="rpc-col" tabindex="0" aria-label="' + tip + '"><span class="rpc-tip">' + tip + '</span><div class="rpc-bar-wrap"><i class="rpc-bar rpc-bar--soft" style="height:' + (v ? Math.max(3, Math.round(v / max * 100)) : 0) + '%"></i></div><span class="rpc-x num">' + U.pad(h) + '</span></div>';
      }).join('') + '</div></section>';
  }

  function view(rep, period) {
    var periods = [['bugun', 'Bugün'], ['dun', 'Dün'], ['hafta', 'Bu hafta'], ['gecenhafta', 'Geçen hafta'], ['ay', 'Bu ay'], ['son30', 'Son 30 gün']];
    var r = rep.range;
    return '<div class="rp">' +
      '<header class="rp-head"><div><h2 class="display-sm">Raporlar</h2><p class="muted num">' + esc(r.label) + ' · ' + (r.from === r.to ? fmtDay(r.from, true) : fmtDay(r.from) + ' – ' + fmtDay(r.to)) + ' <span class="rp-note">(gün ' + esc(cfg.reportDayStart || '06:00') + '’da başlar, iptaller hariç)</span></p></div>' +
      '<div class="rp-actions"><button class="btn btn-sm btn-ghost" data-rp="csv">Excel’e aktar</button></div></header>' +
      '<div class="seg-mini rp-periods" role="group" aria-label="Dönem">' + periods.map(function (p) { return '<button data-period="' + p[0] + '" class="' + (p[0] === period ? 'is-on' : '') + '">' + p[1] + '</button>'; }).join('') + '</div>' +
      '<div class="stat-row rp-tiles">' +
      tile('Ciro', money(rep.revenue, false), rep.count + ' sipariş') +
      tile('Sipariş', rep.count, rep.days.length > 1 ? 'günde ort. ' + (rep.count / rep.days.length).toFixed(1).replace('.', ',') : 'teslim + aktif') +
      tile('Ortalama sepet', money(rep.avg, false), 'sipariş başına') +
      tile('İptal', rep.canceled, rep.canceled ? money(rep.canceledAmount, false) + ' tutarında' : 'iptal yok') +
      '</div>' +
      '<div class="rp-grid">' +
      dayChart(rep) +
      shareList('Ödeme yöntemleri', rep.methods, rep.revenue, 'Kasa kapatırken: nakit ve kapıda kart tutarlarını kontrol edin.') +
      qrCard(rep) +
      shareList('Sipariş kaynakları', rep.sources, rep.revenue, 'Müşterinin siteye nereden geldiği.') +
      topProducts(rep) +
      hoursCard(rep) +
      '</div></div>';
  }

  function csv(rep) {
    var rows = [['Tarih', 'Sipariş', 'Ciro (TL)']];
    rep.days.forEach(function (d) { rows.push([d, rep.byDay[d].count, rep.byDay[d].revenue.toFixed(2).replace('.', ',')]); });
    rows.push([]); rows.push(['Ödeme yöntemi', 'Sipariş', 'Ciro (TL)']);
    rep.methods.forEach(function (m) { rows.push([m.label, m.count, m.revenue.toFixed(2).replace('.', ',')]); });
    rows.push([]); rows.push(['Kaynak', 'Sipariş', 'Ciro (TL)']);
    rep.sources.forEach(function (m) { rows.push([m.label, m.count, m.revenue.toFixed(2).replace('.', ',')]); });
    rows.push([]); rows.push(['Ürün', 'Adet', 'Ciro (TL)']);
    rep.products.forEach(function (p) { rows.push([p.name, p.qty, p.revenue.toFixed(2).replace('.', ',')]); });
    var text = '﻿' + rows.map(function (r) { return r.map(function (c) { c = c == null ? '' : String(c); return /[;"\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }).join(';'); }).join('\r\n');
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
    a.download = 'bumbase-rapor-' + rep.range.from + (rep.range.to !== rep.range.from ? '_' + rep.range.to : '') + '.csv';
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  App.reports = {
    compute: compute, range: range,
    /** Rapor penceresini açar; getOrders() güncel sipariş listesini döndürür */
    open: function (getOrders) {
      var period = 'bugun', rep = null;
      function render() { rep = compute(getOrders(), range(period)); return view(rep, period); }
      var m = App.ui.openModal(render(), { cls: 'modal--report', label: 'Raporlar' });
      function repaint() { if (!m.isConnected) return; var y = m.scrollTop; m.querySelector('.rp').outerHTML = render(); m.scrollTop = y; }
      m.addEventListener('click', function (e) {
        var p = e.target.closest('[data-period]');
        if (p) { period = p.getAttribute('data-period'); repaint(); return; }
        if (e.target.closest('[data-rp="csv"]')) csv(rep);
      });
      return { refresh: repaint, isOpen: function () { return m.isConnected; } };
    },
  };
})(window.App = window.App || {});
