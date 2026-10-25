/**
 * Sipariş kaynağı: müşterinin siteye nereden geldiğini hatırlar (QR kod, Google, Instagram…)
 *   https://bumbase.com.tr/?k=masa   → masa kartındaki QR
 *   https://bumbase.com.tr/?k=brosur → broşürdeki QR
 * Kaynak bu cihazda 24 saat saklanır; o sürede verilen sipariş bu kaynağa sayılır.
 */
(function (App) {
  var U = App.utils, KEY = 'koz.source.v1', TTL = 24 * 3600 * 1000;
  var known = App.config.sources || {};

  function fromReferrer() {
    var r = (document.referrer || '').toLowerCase();
    if (!r || r.indexOf(location.host) >= 0) return null;
    if (/google\./.test(r)) return 'google';
    if (/instagram\./.test(r)) return 'instagram';
    if (/facebook\.|fb\.com|fb\.me/.test(r)) return 'facebook';
    if (/whatsapp|wa\.me/.test(r)) return 'whatsapp';
    return null;
  }

  var params = null;
  try { params = new URLSearchParams(location.search); } catch (e) { params = null; }
  var k = params && (params.get('k') || params.get('kaynak') || params.get('utm_source'));
  k = k ? k.toLowerCase() : null;
  var found = (k && known[k]) ? k : fromReferrer();
  if (found) U.storage.set(KEY, { k: found, at: Date.now() });
  // Adres çubuğunu temizle (?k=... paylaşılan linklere taşınmasın)
  if (k) { try { params.delete('k'); params.delete('kaynak'); params.delete('utm_source'); var q = params.toString(); history.replaceState(null, '', location.pathname + (q ? '?' + q : '') + location.hash); } catch (e) { /* sandbox */ } }

  App.source = {
    get: function () {
      var v = U.storage.get(KEY, null);
      return v && v.k && Date.now() - v.at < TTL ? v.k : 'direkt';
    },
    label: function (k) { return known[k] || known.direkt || k; },
  };
})(window.App = window.App || {});
