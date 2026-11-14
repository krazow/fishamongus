// 4.9 features: weather alerts, best days, route recording, GPX export, GPX/KML/KMZ import, map layers.
const OUTDIR = process.env.OUT || process.cwd();
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), zlib = require('zlib');
const { hilo, meteo } = require('./sim.js');
const ROOT = process.argv[2] || path.join(__dirname, '..');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
const srv = http.createServer((q, r) => { let f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html';
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); r.end(d); }); }).listen(8182);
const log = (...a) => console.log(...a); let fails = 0; const ok = (c, m) => { log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const ORO = { latitude: 47.1452, longitude: -122.6760, accuracy: 6 };
// files to import
const gpx = `<?xml version="1.0"?><gpx version="1.1" xmlns="http://www.topografix.com/GPX/1/1"><wpt lat="47.2001" lon="-122.7002"><name>Hump &amp; ledge</name><desc>40 ft</desc></wpt><wpt lat="47.1453" lon="-122.6761"><name>Oro Bay</name></wpt><wpt lat="47.21" lon="-122.71"></wpt><trk><name>t</name><trkseg><trkpt lat="47.1" lon="-122.6"/><trkpt lat="47.11" lon="-122.61"/></trkseg></trk></gpx>`;
const kml = `<?xml version="1.0" encoding="UTF-8"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document><Placemark><name>Crab pot line</name><description><![CDATA[<b>Pots</b> at 60 ft]]></description><Point><coordinates>-122.651,47.171,0</coordinates></Point></Placemark><Placemark><name>Drift</name><LineString><coordinates>-122.6,47.1 -122.61,47.11</coordinates></LineString></Placemark></Document></kml>`;
fs.mkdirSync('/tmp/geo', { recursive: true });
fs.writeFileSync('/tmp/geo/marks.gpx', gpx); fs.writeFileSync('/tmp/geo/pots.kml', kml);
// a real deflated KMZ
(function makeKmz() {
  const name = Buffer.from('doc.kml'); const data = Buffer.from(kml.replace('Crab pot line', 'KMZ pot')); const comp = zlib.deflateRawSync(data);
  const crc = (() => { let c, t = []; for (let n = 0; n < 256; n++) { c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } let x = 0xFFFFFFFF; for (const b of data) x = t[(x ^ b) & 0xFF] ^ (x >>> 8); return (x ^ 0xFFFFFFFF) >>> 0; })();
  const lh = Buffer.alloc(30); lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(8, 8); lh.writeUInt32LE(crc, 14); lh.writeUInt32LE(comp.length, 18); lh.writeUInt32LE(data.length, 22); lh.writeUInt16LE(name.length, 26);
  const cd = Buffer.alloc(46); cd.writeUInt32LE(0x02014b50, 0); cd.writeUInt16LE(20, 4); cd.writeUInt16LE(20, 6); cd.writeUInt16LE(8, 10); cd.writeUInt32LE(crc, 16); cd.writeUInt32LE(comp.length, 20); cd.writeUInt32LE(data.length, 24); cd.writeUInt16LE(name.length, 28); cd.writeUInt32LE(0, 42);
  const cdOff = 30 + name.length + comp.length; const eocd = Buffer.alloc(22); eocd.writeUInt32LE(0x06054b50, 0); eocd.writeUInt16LE(1, 8); eocd.writeUInt16LE(1, 10); eocd.writeUInt32LE(46 + name.length, 12); eocd.writeUInt32LE(cdOff, 16);
  fs.writeFileSync('/tmp/geo/pots.kmz', Buffer.concat([lh, name, comp, cd, name, eocd]));
})();
(async () => {
  const browser = await chromium.launch((process.env.CHROME ? { executablePath: process.env.CHROME } : {}));
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, geolocation: ORO, permissions: ['geolocation'], locale: 'en-US', timezoneId: 'America/Los_Angeles', serviceWorkers: 'block', acceptDownloads: true });
  const page = await ctx.newPage(); const errors = []; page.on('console', (m) => { if (m.text().includes('ACCESSERR')) console.log(m.text()); }); page.on('pageerror', (e) => errors.push(e.message));
  // Hours from now until midnight in the test's time zone, so the advisory always covers all of tomorrow.
  const laHour = +new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', hour: 'numeric', hourCycle: 'h23' }).format(new Date());
  const TOMORROW = 24 - laHour;
  const nws = [];
  await page.route(/api\.weather\.gov/, (r) => { const u = new URL(r.request().url()); nws.push(u.pathname + u.search);
    const now = Date.now(); const alert = (id, event, severity, h0, h1) => ({ properties: { id, event, severity, status: 'Actual', messageType: 'Alert', headline: `${event} issued by NWS Seattle`, description: 'South winds 15 to 25 kt.\nWind waves 2 to 4 ft.', instruction: 'Inexperienced mariners should avoid navigating.', onset: new Date(now + h0 * 3600000).toISOString(), ends: new Date(now + h1 * 3600000).toISOString(), senderName: 'NWS Seattle WA', areaDesc: 'Puget Sound' } });
    if (u.pathname === '/zones') return r.fulfill({ contentType: 'application/geo+json', body: JSON.stringify({ features: u.searchParams.get('point').startsWith('47.1452') ? [] : [{ properties: { id: 'PZZ135', name: 'Puget Sound and Hood Canal' } }] }) });
    if (u.pathname === '/alerts/active/zone/PZZ135') return r.fulfill({ contentType: 'application/geo+json', body: JSON.stringify({ features: [alert('a1', 'Small Craft Advisory', 'Minor', -1, 30)] }) });
    if (u.pathname === '/alerts/active') return r.fulfill({ contentType: 'application/geo+json', body: JSON.stringify({ features: [alert('a2', 'Wind Advisory', 'Moderate', TOMORROW + 1, TOMORROW + 23), alert('a1', 'Small Craft Advisory', 'Minor', -1, 30), { properties: { id: 'x', event: 'Test', status: 'Test' } }] }) });
    r.fulfill({ status: 404, body: '{}' }); });
  await page.route(/marine-api\.open-meteo/, (r) => { const q = new URL(r.request().url()).searchParams; const past = +(q.get('past_days') || 1), fut = +(q.get('forecast_days') || 1); const h0 = Math.floor(Date.now() / 3600000) * 3600 - past * 86400; const time = [...Array((past + fut) * 24)].map((_, i) => h0 + i * 3600);
    r.fulfill({ contentType: 'application/json', body: JSON.stringify({ hourly: { time, sea_surface_temperature: time.map(() => 10.8), wave_height: time.map(() => 0.3), wave_period: time.map(() => 4), wave_direction: time.map(() => 200) } }) }); });
  await page.route(/\/\/api\.open-meteo\.com/, (r) => { const j = meteo(new URL(r.request().url()));
    // a stormy day 3 and a windy day 5, so the calendar has something to mark down
    if (j.hourly && j.hourly.time) { const d0 = new Date(); d0.setHours(0, 0, 0, 0); j.hourly.time.forEach((t, i) => { const d = Math.floor((t * 1000 - d0.getTime()) / 86400000); if (d === 3) { j.hourly.weather_code[i] = 95; } if (d === 5) { j.hourly.wind_speed_10m[i] = 40; j.hourly.wind_gusts_10m[i] = 60; } }); }
    r.fulfill({ contentType: 'application/json', body: JSON.stringify(j) }); });
  await page.route(/tidesandcurrents\.noaa\.gov/, (r) => { const u = new URL(r.request().url()); if (u.pathname.includes('stations.json')) return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ stations: [{ id: '9446484', name: 'Tacoma', lat: 47.2667, lng: -122.4133, state: 'WA' }] }) });
    return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ predictions: hilo(u.searchParams.get('begin_date'), u.searchParams.get('end_date')) }) }); });
  await page.route(/services8\.arcgis\.com|api\.waterdata\.usgs\.gov|nominatim/, (r) => r.fulfill({ contentType: 'application/json', body: '{"features":[]}' }));
  let wdfwCalls = 0;
  await page.route(/geodataservices\.wdfw\.wa\.gov/, (r) => { wdfwCalls++; const u = r.request().url();
    const f = (x, y, a) => ({ geometry: { x, y }, attributes: a });
    const body = /FeatureServer\/5/.test(u) ? [f(-122.668, 47.142, { BoatRampName: null, Comments: null }), f(-122.6455, 47.1612, { BoatRampName: 'Lake Josephine', Comments: 'Gravel ramp' })]
      : /FeatureServer\/3/.test(u) ? [f(-122.66, 47.15, { FishingPierName: null, Comments: 'ADA platform' })]
      : /ShoreFishingSites/.test(u) ? [f(-122.6685, 47.1425, { LakeName: 'Oro Bay', Description: 'Shore fishing at the launch' })] : [];
    r.fulfill({ contentType: 'application/json', body: JSON.stringify({ features: body }) }); });
  await page.route(/unpkg\.com.*leaflet\.js/, (r) => r.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(path.join(__dirname, 'leaflet-stub.js'), 'utf8') }));
  await page.route(/unpkg\.com.*leaflet\.css|tile\.openstreetmap|charttools/, (r) => r.fulfill({ contentType: 'text/css', body: '' }));
  await page.addInitScript(() => { try { localStorage.setItem('tl.welcomed', '1'); localStorage.setItem('tl.installSnooze', String(Date.now() + 1e11)); localStorage.setItem('tl.units', 'imperial'); localStorage.setItem('tl.lastBackup', String(Date.now())); } catch (e) {} });
  const W = (ms) => page.waitForTimeout(ms);
  await page.goto('http://127.0.0.1:8182/'); await W(2500);

  // 1. Weather alerts on Now
  const alerts = await page.$$eval('#now-alerts .alert summary b', (b) => b.map((x) => x.textContent));
  ok(alerts.length === 2 && alerts[0] === 'Wind Advisory', 'Now alerts: ' + JSON.stringify(alerts));
  ok(nws.some((x) => x.startsWith('/alerts/active/zone/PZZ135')), 'marine zone found off the point and its alerts fetched');
  ok(!(await page.textContent('#now-alerts')).includes('Test'), 'test messages are left out');
  await page.click('#now-alerts .alert summary >> nth=1'); await W(200);
  ok((await page.textContent('#now-alerts')).includes('What to do'), 'alert expands with instructions');

  // 2. Best days ahead
  await W(800);
  const days = await page.$$eval('#now-cal .cal-day', (d) => d.map((x) => ({ l: x.getAttribute('aria-label'), best: x.classList.contains('best'), warn: x.classList.contains('warn') })));
  ok(days.length >= 13 && days.length <= 14, 'calendar days: ' + days.length);
  ok(days.filter((d) => d.best).length >= 1 && days.filter((d) => d.best).length <= 3, 'best days marked: ' + days.filter((d) => d.best).length);
  ok(days[3] && days[3].warn && /Thunderstorms/.test(days[3].l), 'stormy day flagged: ' + (days[3] && days[3].l));
  ok(days[5] && /Windy/.test(days[5].l) && !days[5].best, 'windy day marked down: ' + (days[5] && days[5].l));
  ok(days[1] && /Wind Advisory/.test(days[1].l) && days[1].warn, 'alert day flagged: ' + (days[1] && days[1].l));
  log('  why:', await page.$$eval('#now-cal .cal-why li', (l) => l.map((x) => x.textContent)));
  await page.screenshot({ path: '/tmp/f49-now.png' }); await page.locator('#now-cal').screenshot({ path: '/tmp/f49-cal.png' });
  const bestIdx = days.findIndex((d) => d.best);
  await page.click(`#now-cal .cal-day >> nth=${bestIdx}`); await W(400);
  const trDate = await page.inputValue('#tr-date'); const trStart = await page.inputValue('#tr-start');
  const want = await page.$eval(`#now-cal .cal-day >> nth=${bestIdx}`, (b) => b.dataset.calDay).catch(() => null);
  ok(await page.isVisible('#sheet-trip-form') && trDate && trStart, `trip form opened from a day: ${trDate} ${trStart}`);
  await page.click('#sheet-trip-form [data-close]').catch(() => page.keyboard.press('Escape')); await W(300);

  // 3. Route recording
  await page.click('#ses-start'); await W(500); await page.keyboard.press('Escape').catch(() => {}); await W(300);
  await page.evaluate(() => document.querySelectorAll('.sheet:not([hidden]) [data-close]').forEach((b) => b.click())); await W(300);
  for (let i = 1; i <= 6; i++) { await ctx.setGeolocation({ latitude: 47.1452 + i * 0.0006, longitude: -122.6760 + i * 0.0004, accuracy: 8 }); await W(400); }
  const routeText = await page.textContent('#ses-route').catch(() => '');
  ok(/Route: .* recorded/.test(routeText), 'route line: ' + routeText); await page.locator('#now-session').screenshot({ path: '/tmp/f49-ses.png' });
  await W(10500);
  // the session is short, so make it 20 minutes old before ending it (sessions under 5 minutes with no fish are discarded)
  await page.reload(); await W(1200);
  await page.evaluate(() => new Promise((res) => { const r = indexedDB.open('tightlines'); r.onsuccess = () => { const tx = r.result.transaction('sessions', 'readwrite'); const st = tx.objectStore('sessions'); st.getAll().onsuccess = (e) => { e.target.result.forEach((x) => { if (!x.end) { x.start -= 20 * 60000; st.put(x); } }); }; tx.oncomplete = () => res(); }; }));
  await page.reload(); await W(1200);
  await page.click('#ses-end'); await W(600);
  const track = await page.evaluate(() => new Promise((res) => { const r = indexedDB.open('tightlines'); r.onsuccess = () => { const t = r.result.transaction('sessions').objectStore('sessions').getAll(); t.onsuccess = () => res(t.result.map((s) => (s.track || []).length)); }; }));
  ok(track.some((n) => n >= 5), 'track saved with the session: ' + JSON.stringify(track));

  // 4. GPX export
  const [dl] = await Promise.all([page.waitForEvent('download'), page.evaluate(() => document.querySelector('#btn-export-gpx').click())]);
  const gpxOut = fs.readFileSync(await dl.path(), 'utf8');
  ok(/<gpx version="1.1"/.test(gpxOut) && /<trk>/.test(gpxOut) && (gpxOut.match(/<trkpt/g) || []).length >= 5, 'GPX has the session track');
  ok(/xmlns="http:\/\/www.topografix.com\/GPX\/1\/1"/.test(gpxOut), 'GPX namespace');

  // 5. GPX / KML / KMZ import
  await page.setInputFiles('#f-import-log', '/tmp/geo/marks.gpx'); await W(500);
  ok(await page.isVisible('#sheet-geo'), 'GPX import sheet opens');
  log('  ', await page.textContent('#geo-file'));
  const items = await page.$$eval('#geo-list li', (l) => l.map((x) => [x.querySelector('input').checked, x.innerText.replace(/\n/g, ' | ')]));
  log('  ', JSON.stringify(items));
  ok(items.length === 3 && items[0][0] && items[2][1].includes('Waypoint 3'), 'GPX waypoints listed, unnamed ones numbered');
  ok(/1 route or area not imported/.test(await page.textContent('#geo-file')), 'GPX tracks noted as not imported');
  await page.click('#geo-go'); await W(500);
  let spotNames = await page.evaluate(() => new Promise((res) => { const r = indexedDB.open('tightlines'); r.onsuccess = () => { const t = r.result.transaction('spots').objectStore('spots').getAll(); t.onsuccess = () => res(t.result.map((s) => s.name)); }; }));
  ok(spotNames.includes('Hump & ledge') && spotNames.length === 3, 'GPX spots added: ' + JSON.stringify(spotNames));
  await page.setInputFiles('#f-import-log', '/tmp/geo/marks.gpx'); await W(400);
  const again = await page.$$eval('#geo-list li input', (l) => l.map((x) => x.checked));
  ok(again.every((x) => !x), 'already-saved places left unticked on a second import');
  await page.click('#sheet-geo [data-close]'); await W(300);
  await page.setInputFiles('#f-import-log', '/tmp/geo/pots.kml'); await W(400);
  ok((await page.textContent('#geo-list')).includes('Pots at 60 ft'), 'KML description cleaned of HTML');
  await page.click('#geo-go'); await W(400);
  await page.setInputFiles('#f-import-log', '/tmp/geo/pots.kmz'); await W(600);
  ok((await page.textContent('#geo-list').catch(() => '')).includes('KMZ pot'), 'KMZ unzipped and read');
  if (await page.isEnabled('#geo-go').catch(() => false)) await page.click('#geo-go'); else await page.click('#sheet-geo [data-close]'); await W(400);

  // 6. Map layers
  await page.click('.tab[data-view="spots"]'); await W(300);
  await page.evaluate(() => document.querySelector('#btn-map, [data-mode="map"], #spots-map-toggle, [data-spots="map"]')?.click()); await W(1500);
  ok(await page.isVisible('#map-wrap'), 'map open');
  await page.evaluate(() => { window.__map.setView([47.15, -122.66], 13); window.__map.fire('moveend'); }); await W(800);
  const accM = await page.evaluate(() => (window.__markers || []).filter((m) => m.html && m.html.includes('class="acc ')).map((m) => [m.html.match(/acc-(\w+)/)[1], (m.pop || '').match(/<b>([^<]+)/)[1]]));
  ok(accM.length === 4, 'access markers drawn: ' + JSON.stringify(accM));
  ok(accM.some((m) => m[1] === 'Oro Bay – boat ramp'), 'unnamed ramp named from the WDFW shore site next to it');
  ok(accM.some((m) => m[1] === 'Fishing pier (WDFW)'), 'unnamed pier gets a plain label');
  const lines = await page.evaluate(() => (window.__lines || []).length);
  ok(lines >= 1, 'session route drawn on the map: ' + lines);
  await page.click('#btn-map-layers'); await W(200);
  ok(await page.isVisible('#map-layers'), 'layers panel opens');
  await page.check('#map-layers input[data-layer="charts"]'); await W(300);
  ok(await page.evaluate(() => (window.__wms || 0) >= 1 && !!window.__map._wms), 'NOAA chart layer added');
  await page.uncheck('#map-layers input[data-layer="charts"]'); await W(200);
  ok(await page.evaluate(() => !window.__map._wms), 'NOAA chart layer removed');
  await page.screenshot({ path: '/tmp/f49-map.png' });
  const calls = wdfwCalls; await page.evaluate(() => { window.__map.setView([47.2, -122.7], 13); window.__map.fire('moveend'); }); await W(400);
  ok(wdfwCalls === calls, 'WDFW access data fetched once and reused');
  await page.evaluate(() => { window.__map.setView([45.5, -110], 10); window.__map.fire('moveend'); }); await W(300);
  ok(/cover Washington/.test(await page.textContent('#map-note')), 'outside Washington: note shown');

  // 7. Spot detail alerts + route setting off
  await page.evaluate(() => document.querySelector('#map-layers').hidden = true);
  await page.goto('http://127.0.0.1:8182/'); await W(1500);
  await page.evaluate(() => { localStorage.setItem('tl.route', '0'); }); await page.reload(); await W(1500);
  await page.click('#ses-start'); await W(500); await page.evaluate(() => document.querySelectorAll('.sheet:not([hidden]) [data-close]').forEach((b) => b.click())); await W(300);
  ok(!(await page.$('#ses-route')), 'no route line when recording is off');
  await page.click('#ses-end'); await W(400);
  log('errors', errors);
  ok(!errors.length, 'no page errors');
  log(fails ? `${fails} FAILED` : 'ALL PASSED');
  await browser.close(); srv.close(); process.exit(fails ? 1 : 0);
})();
