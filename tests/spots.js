const { chromium } = require('playwright');
const OUTDIR = process.env.OUT || process.cwd();
const { pickBait, returning } = require('./sim.js');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.argv[2] || path.join(__dirname, '..');
const types = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.png':'image/png', '.svg':'image/svg+xml' };
const srv = http.createServer((q, r) => { let f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html';
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); r.end(d); }); }).listen(8125);
const now = Math.floor(Date.now()/1000/3600)*3600;
function wx() { const n = 72; const time = [...Array(n)].map((_, i) => now - (n - 24 - i) * 3600); const arr = f => time.map((t, i) => f(i));
  return { current: { time: Math.floor(Date.now()/1000), temperature_2m: 17.8, relative_humidity_2m: 62, apparent_temperature: 17.1, is_day: 1, precipitation: 0, weather_code: 3, cloud_cover: 90, pressure_msl: 1012, wind_speed_10m: 9, wind_direction_10m: 300, wind_gusts_10m: 19 },
    hourly: { time, temperature_2m: arr(i=>12+i%10), relative_humidity_2m: arr(()=>70), apparent_temperature: arr(i=>11), is_day: arr(()=>1), precipitation: arr(()=>0), weather_code: arr(()=>3), cloud_cover: arr(()=>90), pressure_msl: arr(i=>1020 - i*0.6), wind_speed_10m: arr(()=>8), wind_direction_10m: arr(()=>180), wind_gusts_10m: arr(()=>14) } }; }
const A = { latitude: 34.14560, longitude: -118.81330, accuracy: 6 };
const B = { latitude: 34.16300, longitude: -118.81330, accuracy: 8 };   // ~1.9 km north
const log = (...a) => console.log(...a);
(async () => {
  const browser = await chromium.launch((process.env.CHROME ? { executablePath: process.env.CHROME } : {}));
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, geolocation: A, permissions: ['geolocation'], locale: 'en-US', timezoneId: 'America/Los_Angeles' });
  const page = await ctx.newPage(); await returning(page);
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.route(/open-meteo/, r => r.fulfill({ contentType: 'application/json', body: JSON.stringify(wx()) }));
  await page.route(/unpkg|openstreetmap/, r => r.abort());
  await page.goto('http://localhost:8125/');
  // seed 4 older catches near A with no spot, plus 1 far away
  await page.evaluate(async () => {
    const db = await new Promise(r => { const q = indexedDB.open('tightlines', 6); q.onupgradeneeded = () => { q.result.createObjectStore('catches', { keyPath: 'id' }); q.result.createObjectStore('spots', { keyPath: 'id' }); }; q.onsuccess = () => r(q.result); });
    const tx = db.transaction('catches', 'readwrite'); const st = tx.objectStore('catches');
    const lures = ['Senko', 'Senko', 'Ned rig', 'Topwater popper'];
    lures.forEach((b, i) => { const t = Date.now() - (i + 2) * 86400000; st.put({ id: 'old' + i, createdAt: t, updatedAt: t, caughtAt: t, species: i === 3 ? 'Bluegill' : 'Largemouth Bass', bait: b, lengthCm: 30 + i * 5, weightKg: i < 2 ? 1 + i : null, released: true, notes: '', photo: null, thumb: null,
      location: { lat: 34.1456 + i * 0.0003, lon: -118.8133, accuracy: 5, source: 'gps' }, weather: { tempC: 15 + i * 4, feelsC: 15, humidity: 60, precipMm: 0, code: i % 2 ? 3 : 1, isDay: true, cloud: 50, pressure: 1015, pressureTrend: i % 2 ? 'falling' : 'steady', windKmh: 6 + i * 5, windDir: 200, gustKmh: 20 }, weatherTries: 9 }); });
    st.put({ id: 'far', createdAt: Date.now() - 9e8, updatedAt: 1, caughtAt: Date.now() - 9e8, species: 'Rainbow Trout', bait: 'PowerBait', released: false, notes: '', photo: null, thumb: null, location: { lat: 34.5, lon: -118.2, accuracy: 5, source: 'gps' }, weather: null, weatherTries: 9 });
    await new Promise(r => tx.oncomplete = r); db.close();
  });
  await page.reload(); await page.waitForTimeout(400);
  await page.click('.tab[data-view=spots]'); await page.waitForTimeout(200);
  await page.screenshot({ path: 'p1-empty.png' });
  // create a spot with GPS
  await page.click('#btn-new-spot'); await page.waitForFunction(() => document.querySelector('#sp-loc-text').textContent.includes('34.14'));
  await page.fill('#sp-name', 'North cove dock'); await page.fill('#sp-notes', 'Park at the boat ramp lot.\nWeed line 20 yd off the end of the dock.');
  await page.screenshot({ path: 'p2-form.png' });
  await page.click('#spot-form button[type=submit]'); await page.waitForTimeout(500);
  log('toast:', await page.textContent('#toast'));
  log('spot cards:', await page.$$eval('.spot-card', e => e.map(x => x.textContent.replace(/\s+/g, ' ').trim())));
  log('unassigned note:', await page.$eval('#spots-list', e => (e.querySelector('.unassigned') || {}).textContent || '').catch(() => ''));
  // log a catch at A -> auto match
  await page.click('#btn-new'); await page.waitForFunction(() => document.querySelector('#wx-text').textContent.includes('°'));
  log('auto spot:', await page.$eval('#f-spot', e => e.selectedOptions[0].textContent), '|', await page.textContent('#spot-hint'));
  await require('./sim.js').pickSpecies(page, 'Largemouth Bass'); await pickBait(page, 'Senko');
  await page.click('#catch-form button[type=submit]'); await page.waitForTimeout(500);
  await page.click('.tab[data-view=log]');
  log('log meta:', await page.$eval('.catch .meta:nth-of-type(2)', e => e.textContent));
  // move to B -> no match -> create new spot from form
  await ctx.setGeolocation(B); await page.waitForTimeout(5500);
  await page.click('#btn-new'); await page.waitForFunction(() => document.querySelector('#wx-text').textContent.includes('°'));
  log('at B spot:', await page.$eval('#f-spot', e => e.value || '(none)'), '|', await page.textContent('#spot-hint'), '| options:', await page.$$eval('#f-spot option', o => o.map(x => x.textContent).join(' / ')));
  await page.selectOption('#f-spot', '__new'); await require('./sim.js').pickSpecies(page, 'Smallmouth Bass'); await pickBait(page, 'Ned rig');
  await page.click('#catch-form button[type=submit]'); await page.waitForTimeout(200);
  log('no-name error:', await page.textContent('#form-error'));
  await page.fill('#f-spot-name', 'Rocky point'); await page.click('#catch-form button[type=submit]'); await page.waitForTimeout(500);
  await page.click('.tab[data-view=spots]'); await page.waitForTimeout(200);
  log('spots now:', await page.$$eval('.spot-card h3', e => e.map(x => x.textContent)));
  await page.screenshot({ path: 'p3-list.png' });
  // spot detail
  await page.click('.spot-card:has-text("North cove dock")'); await page.waitForTimeout(400);
  await page.screenshot({ path: 'p4-detail.png' });
  const sc = await page.$('#sheet-spot .sheet-scroll'); await sc.evaluate(e => e.scrollTop = 700); await page.waitForTimeout(100);
  await page.screenshot({ path: 'p5-detail2.png' });
  // open catch from recent list then go back
  await page.click('#spot-body .recent-list button'); await page.waitForTimeout(300);
  log('catch detail spot row:', await page.$eval('#detail-body', e => (e.querySelector('[data-spot]') || {}).textContent));
  await page.goBack(); await page.waitForTimeout(300);
  // stats for this spot
  await page.click('#spot-stats'); await page.waitForTimeout(400);
  log('stats active:', await page.$eval('#view-stats', e => e.classList.contains('active')), 'spot filter:', await page.$eval('#st-spot', e => e.selectedOptions[0].textContent), '| tiles:', await page.$eval('.tiles', e => e.textContent.replace(/\s+/g, ' ')));
  log('sheets open:', await page.$$eval('.sheet', s => s.filter(x => !x.hidden).length));
  await page.screenshot({ path: 'p6-stats.png' });
  // far catch: save as spot from catch detail
  await page.click('.tab[data-view=log]'); await page.fill('#search', 'Rainbow'); await page.click('.catch'); await page.waitForTimeout(300);
  await page.click('#btn-make-spot'); await page.waitForTimeout(300);
  log('make-spot loc:', await page.textContent('#sp-loc-text'), await page.textContent('#sp-loc-sub'));
  await page.fill('#sp-name', 'Upper creek'); await page.click('#spot-form button[type=submit]'); await page.waitForTimeout(500);
  log('detail after:', await page.$eval('#detail-body', e => (e.querySelector('[data-spot]') || {}).textContent));
  await page.goBack(); await page.waitForTimeout(200); await page.fill('#search', '');
  await page.dispatchEvent('#search', 'input');
  // edit spot -> delete
  await page.click('.tab[data-view=spots]'); await page.click('.spot-card:has-text("Rocky point")'); await page.waitForTimeout(300);
  await page.click('#btn-spot-edit'); await page.waitForTimeout(300); await page.click('#sp-delete'); await page.click('#confirm-yes'); await page.waitForTimeout(500);
  log('after delete spots:', await page.$$eval('.spot-card h3', e => e.map(x => x.textContent)), '| sheets open:', await page.$$eval('.sheet', s => s.filter(x => !x.hidden).length));
  log('smallmouth unlinked:', await page.evaluate(() => new Promise(r => { const q = indexedDB.open('tightlines', 6); q.onsuccess = () => { const g = q.result.transaction('catches').objectStore('catches').getAll(); g.onsuccess = () => r(g.result.filter(c => c.species === 'Smallmouth Bass').map(c => c.spotId)); }; })));
  // map mode (leaflet blocked)
  await page.click('#seg-spots [data-mode=map]'); await page.waitForTimeout(400); log('map msg:', await page.textContent('#map-msg'));
  await page.click('#seg-spots [data-mode=list]');
  // backup round trip
  await page.click('#btn-menu'); const dl = page.waitForEvent('download'); await page.click('#btn-export-json'); const d = await dl; await d.saveAs('' + OUTDIR + '/bk.json');
  const bk = JSON.parse(fs.readFileSync('' + OUTDIR + '/bk.json')); log('backup spots:', bk.spots.map(x => x.name), 'catches:', bk.catches.length);
  const dl2 = page.waitForEvent('download'); await page.click('#btn-export-csv'); const d2 = await dl2; await d2.saveAs('' + OUTDIR + '/bk.csv');
  log('csv:', fs.readFileSync('' + OUTDIR + '/bk.csv', 'utf8').split('\n').slice(0, 2).join(' || ').slice(0, 160));
  await page.evaluate(() => new Promise(r => { const q = indexedDB.deleteDatabase('tightlines'); q.onsuccess = q.onblocked = r; }));
  await page.reload(); await page.waitForTimeout(300); await page.click('#btn-menu'); await page.setInputFiles('#f-import', '' + OUTDIR + '/bk.json'); await page.waitForTimeout(800);
  log('restore toast:', await page.textContent('#toast'));
  // v1 -> v2 upgrade path, in a fresh profile
  const ctx2 = await browser.newContext(); const p2 = await ctx2.newPage(); p2.on('pageerror', e => errors.push('p2 ' + e.message));
  await p2.route(/open-meteo|unpkg|openstreetmap/, r => r.abort());
  await p2.goto('http://localhost:8125/sw.js');
  await p2.evaluate(() => new Promise(r => { const q = indexedDB.open('tightlines', 1); q.onupgradeneeded = () => { q.result.createObjectStore('catches', { keyPath: 'id' }).put({ id: 'v1', createdAt: 1, caughtAt: Date.now(), species: 'Walleye', bait: 'Jig', location: null, weather: null, weatherTries: 9 }); }; q.onsuccess = () => { q.result.close(); r(); }; }));
  await p2.goto('http://localhost:8125/'); await p2.waitForTimeout(500);
  log('upgrade from v1:', await p2.$$eval('.catch h3', e => e.map(x => x.textContent)));
  log('errors:', errors);
  await browser.close(); srv.close();
})().catch(e => { console.error(e); process.exit(1); });
