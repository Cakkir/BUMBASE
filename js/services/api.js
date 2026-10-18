/**
 * API katmanı — çalışma modunu belirler ve HTTP yardımcılarını sağlar.
 *  local  : Sunucu yok. Siparişler tarayıcıda (localStorage) tutulur, sekmeler arası
 *           BroadcastChannel ile anlık eşitlenir. Demo / statik hosting için.
 *  remote : server/server.js (veya aynı sözleşmeye uyan kendi backend'iniz).
 *           Siparişler sunucuda saklanır, admin paneli SSE ile anlık güncellenir.
 */
(function (App) {
  var cfg = App.config.api;
  var base = (cfg.baseUrl || '').replace(/\/$/, '');

  function detect() {
    if (cfg.mode === 'local') return Promise.resolve('local');
    if (cfg.mode === 'remote') return Promise.resolve('remote');
    if (!/^https?:/.test(location.protocol)) return Promise.resolve('local');
    var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var t = setTimeout(function () { if (ctrl) ctrl.abort(); }, 1500);
    return fetch(base + '/api/health', { cache: 'no-store', signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { return j && j.ok ? 'remote' : 'local'; })
      .catch(function () { return 'local'; })
      .then(function (m) { clearTimeout(t); return m; });
  }

  function http(method, path, body, headers) {
    var h = Object.assign({ 'Content-Type': 'application/json' }, headers || {});
    return fetch(base + path, { method: method, headers: h, body: body ? JSON.stringify(body) : undefined })
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) {
          if (!r.ok) { var e = new Error(j.error || 'İstek başarısız (' + r.status + ')'); e.status = r.status; e.fieldErrors = j.fieldErrors; throw e; }
          return j;
        });
      }, function () {
        var e = new Error('Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edin.');
        e.network = true; throw e;
      });
  }

  var api = { mode: null, base: base, http: http };
  api.ready = detect().then(function (m) { api.mode = m; return m; });
  App.api = api;
})(window.App = window.App || {});
