/* BUM BASE Panel — service worker
 * Panelin uygulama olarak kurulabilmesini ve internet kısa süre kesildiğinde açılabilmesini sağlar.
 * Siparişler (/api/...) asla önbelleğe alınmaz; her zaman canlı sunucudan gelir. */
var CACHE = 'bumbase-panel-v1';

self.addEventListener('install', function (e) { self.skipWaiting(); });
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin || url.pathname.indexOf('/api/') === 0) return;
  // Önce ağ, olmazsa önbellek
  e.respondWith(fetch(req).then(function (res) {
    if (res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
    return res;
  }).catch(function () { return caches.match(req); }));
});

// Bildirime tıklanınca paneli öne getir
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
    for (var i = 0; i < list.length; i++) if (list[i].url.indexOf('/panel/') >= 0 && 'focus' in list[i]) return list[i].focus();
    return self.clients.openWindow('./index.html');
  }));
});
