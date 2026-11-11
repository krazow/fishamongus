// Fishamongus! service worker: keeps the app working with no signal.
// Bump VERSION whenever you change any app file so phones pick up the update.
const VERSION = 'tl-v14';
const TILES = 'tl-tiles';          // map tiles you've looked at, kept across app updates
const MAX_TILES = 1500;            // about 30 MB
const SHELL = ['./', 'index.html', 'styles.css', 'app.js', 'manifest.webmanifest',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION && k !== TILES).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
async function trimTiles(cache) {
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - MAX_TILES; i++) await cache.delete(keys[i]);   // oldest first
}
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Weather, tides and marine data always go to the network.
  if (url.hostname.endsWith('open-meteo.com') || url.hostname.endsWith('noaa.gov')) return;
  // Map tiles: only tiles you've already viewed are kept (no bulk downloading, per OpenStreetMap's tile policy).
  if (url.hostname.endsWith('tile.openstreetmap.org')) {
    e.respondWith(caches.open(TILES).then(async (cache) => {
      try {
        const res = await fetch(req);
        if (res.ok && res.type !== 'opaque') { cache.put(req, res.clone()).then(() => trimTiles(cache)); }
        return res;
      } catch {
        return (await cache.match(req)) || Response.error();
      }
    }));
    return;
  }
  // App files and the map library: answer from cache, refresh in the background.
  if (url.origin === location.origin || url.hostname === 'unpkg.com') {
    e.respondWith(caches.open(VERSION).then(async (cache) => {
      const hit = await cache.match(req, { ignoreSearch: url.origin === location.origin });
      const net = fetch(req).then((res) => { if (res.ok || res.type === 'opaque') cache.put(req, res.clone()); return res; }).catch(() => null);
      return hit || (await net) || (req.mode === 'navigate' ? cache.match('index.html') : Response.error());
    }));
  }
});
