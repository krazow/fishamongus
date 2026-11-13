// Video tour, new screens since 4.6 (captured on a GitHub runner, so maps, WDFW access points and NOAA charts are live).
// Weather, tides, alerts and place search are simulated so the tour is the same every time.
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const { hilo, meteo } = require('./sim.js');
const ROOT = process.argv[2] || './app'; const OUT = process.argv[3] || './shots';
fs.mkdirSync(OUT, { recursive: true });
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
const srv = http.createServer((q, r) => { let f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html';
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); r.end(d); }); }).listen(8181);
const log = (...a) => console.log(...a);
const ORO = { latitude: 47.1452, longitude: -122.6760, accuracy: 6 };
function marine(u) { const q = u.searchParams; const past = +(q.get('past_days') || 1), fut = +(q.get('forecast_days') || 1);
  const h0 = Math.floor(Date.now() / 3600000) * 3600 - past * 86400; const time = [...Array((past + fut) * 24)].map((_, i) => h0 + i * 3600);
  return { hourly: { time, sea_surface_temperature: time.map(() => 10.8), wave_height: time.map((t, i) => 0.2 + (i % 6) * 0.03), wave_period: time.map(() => 4), wave_direction: time.map(() => 200) } }; }
const NOM = {
  'oro bay': [{ lat: '47.1440', lon: '-122.6750', category: 'natural', type: 'bay', name: 'Oro Bay', address: { county: 'Pierce County', state: 'Washington', country: 'United States', country_code: 'us' } },
    { lat: '47.1586', lon: '-122.6981', category: 'leisure', type: 'park', name: 'Oro Bay Marina Park', address: { county: 'Pierce County', state: 'Washington', country: 'United States', country_code: 'us' } }],
  'american lake': [{ lat: '47.1310', lon: '-122.5640', category: 'water', type: 'lake', name: 'American Lake', address: { city: 'Lakewood', county: 'Pierce County', state: 'Washington', country: 'United States', country_code: 'us' } },
    { lat: '47.1203', lon: '-122.5617', category: 'leisure', type: 'slipway', name: 'American Lake Park boat launch', address: { city: 'Lakewood', county: 'Pierce County', state: 'Washington', country: 'United States', country_code: 'us' } }],
  'oro bay boat launch': [{ lat: '47.1437', lon: '-122.6702', category: 'leisure', type: 'slipway', name: 'Oro Bay boat launch', address: { county: 'Pierce County', state: 'Washington', country: 'United States', country_code: 'us' } }],
  'lake josephine': [{ lat: '47.1607', lon: '-122.6457', category: 'water', type: 'lake', name: 'Lake Josephine', address: { county: 'Pierce County', state: 'Washington', country: 'United States', country_code: 'us' } },
    { lat: '45.0182', lon: '-93.1497', category: 'water', type: 'lake', name: 'Lake Josephine', address: { city: 'Roseville', county: 'Ramsey County', state: 'Minnesota', country: 'United States', country_code: 'us' } }],
};
async function mocks(page) {
  await page.route(/marine-api\.open-meteo/, (r) => r.fulfill({ contentType: 'application/json', body: JSON.stringify(marine(new URL(r.request().url()))) }));
  await page.route(/\/\/api\.open-meteo\.com/, (r) => { const j = meteo(new URL(r.request().url())); const sh = (a) => (Array.isArray(a) ? a.map((v) => (typeof v === 'number' ? Math.round((v - 7) * 10) / 10 : v)) : a);
    if (j.hourly && j.hourly.temperature_2m) { j.hourly.temperature_2m = sh(j.hourly.temperature_2m); if (j.hourly.apparent_temperature) j.hourly.apparent_temperature = sh(j.hourly.apparent_temperature);
      const d0 = new Date(); d0.setHours(0, 0, 0, 0);
      j.hourly.time.forEach((t, i) => { const d = Math.floor((t * 1000 - d0.getTime()) / 86400000); if (d === 4) j.hourly.weather_code[i] = 95; if (d === 6) { j.hourly.wind_speed_10m[i] = 38; if (j.hourly.wind_gusts_10m) j.hourly.wind_gusts_10m[i] = 58; } }); }
    if (j.current && typeof j.current.temperature_2m === 'number') { j.current.temperature_2m -= 7; if (typeof j.current.apparent_temperature === 'number') j.current.apparent_temperature -= 7; }
    r.fulfill({ contentType: 'application/json', body: JSON.stringify(j) }); });
  await page.route(/tidesandcurrents\.noaa\.gov/, (r) => { const u = new URL(r.request().url()); if (u.pathname.includes('stations.json')) return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ stations: [{ id: '9446484', name: 'Tacoma', lat: 47.2667, lng: -122.4133, state: 'WA' }, { id: '9446969', name: 'Olympia', lat: 47.0533, lng: -122.9017, state: 'WA' }] }) });
    return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ predictions: hilo(u.searchParams.get('begin_date'), u.searchParams.get('end_date')) }) }); });
  await page.route(/services8\.arcgis\.com/, (r) => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ features: [
    { attributes: { BEACHNAME: 'Oro Bay (DNR-8)', FINALSTATUS: 'Open', PopupClosedFor: 'Scallops closed', Vibrio: 'No', Midx: -122.675, Midy: 47.1449 } },
    { attributes: { BEACHNAME: "Andrew's Bay", FINALSTATUS: 'Closed', PopupClosedFor: 'Closed for all species: PSP biotoxin', Vibrio: 'No', Midx: -122.692, Midy: 47.172 } }] }) }));
  await page.route(/api\.waterdata\.usgs\.gov/, (r) => r.fulfill({ contentType: 'application/geo+json', body: '{"features":[]}' }));
  await page.route(/nominatim\.openstreetmap\.org/, (r) => { const q = new URL(r.request().url()).searchParams.get('q').toLowerCase(); r.fulfill({ contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(NOM[q] || []) }); });
  await page.route(/api\.weather\.gov/, (r) => { const u = new URL(r.request().url()); const now = Date.now();
    const al = (id, event, severity, h0, h1, head, desc, instr) => ({ properties: { id, event, severity, status: 'Actual', messageType: 'Alert', headline: head, description: desc, instruction: instr, onset: new Date(now + h0 * 3600000).toISOString(), ends: new Date(now + h1 * 3600000).toISOString(), senderName: 'NWS Seattle WA' } });
    const sca = al('a1', 'Small Craft Advisory', 'Minor', -2, 28, 'Small Craft Advisory until Saturday morning', 'South winds 15 to 25 kt with gusts to 30 kt.\nWind waves 2 to 4 ft.', 'Inexperienced mariners, especially those operating smaller vessels, should avoid navigating in hazardous conditions.');
    const wind = al('a2', 'Wind Advisory', 'Moderate', 22, 40, 'Wind Advisory from Saturday afternoon', 'South winds 20 to 30 mph with gusts up to 50 mph.', 'Use extra caution when driving, especially if operating a high-profile vehicle.');
    if (u.pathname === '/zones') return r.fulfill({ contentType: 'application/geo+json', body: JSON.stringify({ features: [{ properties: { id: 'PZZ135', name: 'Puget Sound and Hood Canal' } }] }) });
    if (u.pathname.startsWith('/alerts/active/zone/')) return r.fulfill({ contentType: 'application/geo+json', body: JSON.stringify({ features: [sca] }) });
    if (u.pathname === '/alerts/active') return r.fulfill({ contentType: 'application/geo+json', body: JSON.stringify({ features: [wind] }) });
    r.fulfill({ status: 404, body: '{}' }); });
  await page.addInitScript(() => { try { localStorage.setItem('tl.installSnooze', String(Date.now() + 1e11)); localStorage.setItem('tl.units', 'imperial'); localStorage.setItem('tl.wtOz', '1'); localStorage.setItem('tl.lastBackup', String(Date.now())); } catch (e) {} });
}
(async () => {
  const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, geolocation: ORO, permissions: ['geolocation'], locale: 'en-US', timezoneId: 'America/Los_Angeles', serviceWorkers: 'block' });
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  await mocks(page);
  const W = (ms) => page.waitForTimeout(ms);
  const shots = []; const fails = []; let n = 0;
  const hideToast = () => page.evaluate(() => { const t = document.querySelector('#toast'); if (t) { t.style.transition = 'none'; t.classList.remove('show'); } });
  const shot = async (key, title, sub, dur = 7, opts = {}) => {
    try { if (!opts.keepToast) await hideToast(); await W(400);
      const f = `n${String(++n).padStart(2, '0')}.jpg`; await (opts.page || page).screenshot({ path: `${OUT}/${f}`, type: 'jpeg', quality: 92 });
      shots.push({ file: f, key, title, sub, dur, ...(opts.wide ? { wide: true } : {}) }); log(f, key, title); } catch (e) { fails.push(title + ': ' + e.message.split('\n')[0]); }
  };
  const step = async (name, fn) => { try { await fn(); } catch (e) { fails.push(name + ': ' + e.message.split('\n')[0]); log('FAIL', name, e.message.split('\n')[0]); } };
  const closeAll = async () => { for (let i = 0; i < 5; i++) { const open = await page.evaluate(() => { const s = [...document.querySelectorAll('.sheet:not([hidden])')].pop(); if (!s) return false; s.querySelector('[data-close]')?.click(); return true; }); if (!open) break; await W(350); if (await page.isVisible('#confirm').catch(() => false)) await page.click('#confirm-yes').catch(() => {}); } };
  const go = async (v) => { await closeAll(); await page.evaluate((x) => { window.scrollTo(0, 0); document.querySelector(`.tab[data-view=${x}]`).click(); }, v); await W(800); };
  const scrollToId = (sel, off = 70) => page.evaluate(([s, o]) => { const el = document.querySelector(s); if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - o); }, [sel, off]);

  await page.goto('http://localhost:8181/'); await W(1200);
  await step('sample data', async () => { await page.click('text=Look around with sample data first'); await W(2500); });
  await go('now'); await W(3500);

  // ---- Now: alerts and best days
  await step('alerts', async () => { await page.waitForSelector('#now-alerts .alert', { timeout: 15000 }); await page.click('#now-alerts .alert summary >> nth=0'); await W(300); await scrollToId('#now-alerts', 70); });
  await shot('alerts', 'Weather alerts', 'National Weather Service warnings and advisories for where you are, including marine ones like a small craft advisory on the water off your spot. Tap one for the details.', 8);
  await step('cal', async () => { await page.waitForSelector('#now-cal .cal-day', { timeout: 20000 }); await scrollToId('#now-cal', 70); });
  await shot('cal', 'Best days ahead', 'Two weeks rated from bite times, the forecast, alerts, tides and the conditions you catch fish in. Storms, strong wind and alerts mark a day down; the best three are picked out with the reasons.', 9);
  await step('cal tap', async () => { await page.click('#now-cal .cal-day.best >> nth=0'); await W(1200); });
  await shot('caltrip', 'Plan the best day', 'Tap a day to plan a trip for its best hours, at the place you’re looking at.', 6.5);
  await closeAll();

  // ---- Session route
  await step('route', async () => { await go('now'); await page.click('#ses-start'); await W(600); await closeAll();
    const pts = [[47.1452, -122.6760], [47.1446, -122.6745], [47.1438, -122.6728], [47.1431, -122.6712], [47.1427, -122.6694], [47.1424, -122.6676], [47.1428, -122.6659], [47.1436, -122.6646], [47.1445, -122.6640], [47.1455, -122.6646], [47.1462, -122.6660]];
    for (const [a, b] of pts) { await ctx.setGeolocation({ latitude: a, longitude: b, accuracy: 8 }); await W(450); }
    await page.evaluate(() => window.scrollTo(0, 0)); await W(400); });
  await shot('route', 'Your route', 'While a session runs and the app is open, your route is recorded and saved with it. Keep the app on screen while you move: phones pause web apps in the background.', 8);

  // ---- Spots: find a place, map, layers, launches, charts, routes, map search
  await step('spot search', async () => { await go('spots'); await page.click('#btn-new-spot'); await W(700); await page.fill('#sp-place input', 'American Lake'); await page.click('#sp-place .ps-go'); await W(1200); });
  await shot('placesearch', 'Find a place by name', 'Type a lake, river, boat launch or town and tap Search. Your saved spots come first, then places from OpenStreetMap, nearest first. Coordinates and map links work too.', 8);
  await step('spot pick', async () => { await page.click('#sp-place .ps-results button >> nth=0'); await W(600); });
  await shot('placepicked', 'Named for you', 'Pick one and the spot gets its place and name. Save it, and catches made there link to it.', 6.5);
  await step('save spot', async () => { await page.click('#spot-form button[type="submit"]').catch(() => page.click('#sp-save')); await W(800); await closeAll(); });

  const mapOpen = async () => { await go('spots'); await page.click('#seg-spots [data-mode="map"]'); await page.waitForSelector('.leaflet-container', { timeout: 20000 }); await page.evaluate(() => window.scrollTo(0, 0)); await W(2500); };
  const mapGo = async (q, pick = 0) => { await page.evaluate(() => window.scrollTo(0, 0)); await page.click('#btn-map-search'); await W(300); await page.fill('#map-search input', q); await page.click('#map-search .ps-go'); await W(1200); await page.click(`#map-search .ps-results button >> nth=${pick}`); await W(3500); };
  await step('map open', async () => { await mapOpen(); });
  await step('map search', async () => { await page.evaluate(() => window.scrollTo(0, 0)); await page.click('#btn-map-search'); await W(200); await page.fill('#map-search input', 'Oro Bay'); await page.click('#map-search .ps-go'); await W(1200); });
  await shot('mapsearch', 'Search the map', 'The magnifying glass finds a place on the map: the map moves there, with New spot here and Plan a trip here.', 6.5);
  await step('map go american', async () => { await page.click('#btn-map-search'); await W(200); await mapGo('American Lake', 1); await page.evaluate(() => document.querySelector('.leaflet-popup-close-button')?.click()); await W(500);
    await page.click('#btn-map-layers'); await W(600); });
  await shot('layers', 'Map layers', 'The layers button adds Washington’s boat ramps, hand launches, fishing piers and shore-fishing sites from WDFW, NOAA nautical charts, and your session routes.', 8);
  await step('acc popup', async () => { await page.click('#btn-map-layers'); await W(400); await page.waitForSelector('.acc-pin', { timeout: 20000 }); await W(1500);
    const pins = await page.$$('.acc-pin'); const box = await page.$eval('#map', (m) => { const r = m.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
    let best = null, bd = 1e9; for (const p of pins) { const b = await p.boundingBox(); if (!b) continue; const d = Math.hypot(b.x - box[0], b.y - box[1]); if (d < bd) { bd = d; best = p; } }
    if (best) { const b = await best.boundingBox(); await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2); } await W(1500); });
  await shot('access', 'Boat launches and access', 'Tap a launch, pier or shore-fishing site for directions, or save it as a spot or plan a trip there. B is a boat ramp, H a hand launch, P a pier, S shore fishing.', 8);
  await step('charts', async () => { await page.evaluate(() => document.querySelector('.leaflet-popup-close-button')?.click()); await mapGo('Oro Bay boat launch', 0); await page.evaluate(() => document.querySelector('.leaflet-popup-close-button')?.click());
    await page.click('#btn-map-layers'); await W(300); await page.check('#map-layers input[data-layer="charts"]'); await W(300); await page.click('#btn-map-layers'); await W(6000); });
  await shot('charts', 'NOAA nautical charts', 'On the water, NOAA’s charts add depths, channels, buoys and hazards – and the orange line is the route from your session. The charts are for planning, not navigation.', 8.5);
  await step('charts off', async () => { await page.click('#btn-map-layers'); await W(300); await page.uncheck('#map-layers input[data-layer="charts"]'); await page.click('#btn-map-layers'); await W(500); });
  await step('end session', async () => { await go('now'); await page.click('#ses-end'); await W(800); await closeAll(); });

  // ---- Settings: import and export
  fs.writeFileSync('/tmp/old-app-export.csv', ['Species,Caught at,Bait,Length (in),Weight (lb),Catch and release,Latitude,Longitude,Notes',
    'Largemouth bass,2026-06-14T06:42:00-07:00,Senko,18.5,3.9,true,47.1607,-122.6457,Dawn bite on the weed edge',
    '"Bass, Smallmouth",2026-06-14T07:15:00-07:00,Ned rig,15,2.4,false,47.1607,-122.6457,"Windy, overcast"',
    'Rainbow trout,2026-06-15T09:05:00-07:00,PowerBait,13,1.3,false,47.1609,-122.6455,',
    'Walleye,2026-06-16T19:30:00-07:00,Jig,21,,true,47.0611,-122.8742,Night bite',
    'Coho salmon,2026-09-20T07:10:00-07:00,Spoon,26,9.2,false,47.1440,-122.6750,'].join('\n'));
  fs.writeFileSync('/tmp/marks.gpx', `<?xml version="1.0"?><gpx version="1.1" xmlns="http://www.topografix.com/GPX/1/1"><wpt lat="47.2001" lon="-122.7002"><name>Hump and ledge</name><desc>40 ft, rocky</desc></wpt><wpt lat="47.1702" lon="-122.6511"><name>Crab pots</name><desc>60 ft</desc></wpt><wpt lat="47.1311" lon="-122.6812"><name>Kelp line</name></wpt><wpt lat="47.1188" lon="-122.7350"><name>Drift start</name></wpt><trk><name>t</name><trkseg><trkpt lat="47.1" lon="-122.6"/><trkpt lat="47.11" lon="-122.61"/></trkseg></trk></gpx>`);
  await step('import csv', async () => { await closeAll(); await page.setInputFiles('#f-import-log', '/tmp/old-app-export.csv'); await page.waitForSelector('#sheet-import:not([hidden])'); await W(800); });
  await shot('import', 'Import a log', 'Bring in catches from another app or your own spreadsheet. Settings → Import a log matches the columns by name and shows a preview; catches already in your log are skipped.', 8.5);
  await step('import map', async () => { await page.evaluate(() => { const sc = document.querySelector('#sheet-import .sheet-scroll'); const h = [...sc.querySelectorAll('h3')].find((x) => x.textContent.includes('Match')); sc.scrollTop = h.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop - 10; }); await W(400); });
  await shot('importmap', 'Check the columns', 'Change any match, the units and how dates are written. Weather is filled in afterwards for catches with a GPS position, and Undo removes the whole import.', 7.5);
  await step('import go', async () => { await page.click('#imp-go'); await W(900); await page.evaluate(() => { window.scrollTo(0, 0); document.querySelector('.tab[data-view=log]').click(); }); await W(900); });
  await shot('imported', 'Imported', 'Done – the catches join your log with their place, lure and size.', 5.5, { keepToast: true });
  await step('gpx', async () => { await closeAll(); await page.setInputFiles('#f-import-log', '/tmp/marks.gpx'); await page.waitForSelector('#sheet-geo:not([hidden])'); await W(700); });
  await shot('gpx', 'Places from your GPS', 'GPX, KML and KMZ files from a GPS, fish finder or Google Earth bring their places in as spots. Export spots, catches and routes as GPX from Settings.', 8);
  await step('gpx add', async () => { await page.click('#geo-go'); await W(800); await closeAll(); });

  // ---- Windows app window (desktop size)
  const dctx = await browser.newContext({ viewport: { width: 1100, height: 760 }, deviceScaleFactor: 1.5, geolocation: ORO, permissions: ['geolocation'], locale: 'en-US', timezoneId: 'America/Los_Angeles', serviceWorkers: 'block' });
  const dp = await dctx.newPage(); await mocks(dp);
  await dp.goto('http://localhost:8181/'); await dp.waitForTimeout(1200);
  await dp.click('text=Look around with sample data first').catch(() => {}); await dp.waitForTimeout(2500);
  await dp.evaluate(() => document.querySelector('.tab[data-view=stats]').click()); await dp.waitForTimeout(2500);
  await shot('windows', 'On Windows', 'The Windows app installs from one file with no administrator rights, opens in its own window and works offline, maps included. Drop a spreadsheet or GPX file on it to import.', 8, { page: dp, wide: true });

  fs.writeFileSync(`${OUT}/new-shots.json`, JSON.stringify(shots, null, 1));
  log('shots', shots.length, 'fails', JSON.stringify(fails), 'errors', JSON.stringify(errors));
  fs.writeFileSync(`${OUT}/log.txt`, JSON.stringify({ shots: shots.length, fails, errors }, null, 1));
  await browser.close(); srv.close();
})();
