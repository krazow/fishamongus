const { chromium } = require('playwright');
const OUTDIR = process.env.OUT || process.cwd();
const http = require('http'), fs = require('fs'), path = require('path');
const { hilo, meteo, STATIONS, pickBait } = require('./sim.js');
const ROOT = process.argv[2] || path.join(__dirname, '..');
const types = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.png':'image/png', '.svg':'image/svg+xml' };
const srv = http.createServer((q, r) => { let f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html';
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); r.end(d); }); }).listen(8185);
const log = (...a) => console.log(...a);
function marine(u) { const q = u.searchParams; const past = +(q.get('past_days') || 1), fut = +(q.get('forecast_days') || 1);
  const h0 = Math.floor(Date.now() / 3600000) * 3600 - past * 86400; const n = (past + fut) * 24; const time = [...Array(n)].map((_, i) => h0 + i * 3600);
  return { hourly: { time, sea_surface_temperature: time.map(() => 16.4), wave_height: time.map((t, i) => 0.9 + (i % 6) * 0.1), wave_period: time.map(() => 12), wave_direction: time.map(() => 260) } }; }
(async () => {
  const browser = await chromium.launch((process.env.CHROME ? { executablePath: process.env.CHROME } : {}));
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, geolocation: { latitude: 34.0105, longitude: -118.497, accuracy: 6 }, permissions: ['geolocation'], locale: 'en-US', timezoneId: 'America/Los_Angeles', acceptDownloads: true, serviceWorkers: 'block' });
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.route(/marine-api\.open-meteo/, r => r.fulfill({ contentType: 'application/json', body: JSON.stringify(marine(new URL(r.request().url()))) }));
  await page.route(/\/\/api\.open-meteo\.com/, r => r.fulfill({ contentType: 'application/json', body: JSON.stringify(meteo(new URL(r.request().url()))) }));
  await page.route(/unpkg\.com.*leaflet\.js/, r => r.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(path.join(__dirname, 'leaflet-stub.js'), 'utf8') }));
  await page.route(/unpkg\.com.*leaflet\.css|openstreetmap/, r => r.fulfill({ contentType: 'text/css', body: '' }));
  await page.route(/tidesandcurrents\.noaa\.gov/, r => { const u = new URL(r.request().url()); if (u.pathname.includes('stations.json')) return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ stations: [...STATIONS.stations, { id: '9446484', name: 'Tacoma', lat: 47.27, lng: -122.41, state: 'WA' }] }) });
    return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ predictions: hilo(u.searchParams.get('begin_date'), u.searchParams.get('end_date')) }) }); });
  await page.addInitScript(() => { try { localStorage.setItem('tl.installSnooze', String(Date.now() + 1e11)); localStorage.setItem('tl.lastBackup', String(Date.now())); localStorage.setItem('tl.units', 'imperial'); } catch (e) {} });
  const shot = (n) => page.screenshot({ path: `el-${n}.png` });
  const text = (s) => page.$eval(s, e => e.textContent.replace(/\s+/g, ' ').trim());
  await page.addInitScript(() => localStorage.setItem('tl.welcomed', '1'));
  await page.goto('http://localhost:8185/'); await page.waitForTimeout(900);
  const form = async () => { await page.click('#btn-new'); await page.waitForFunction(() => document.querySelector('#cond-sum-text').textContent.includes('°')); await page.waitForTimeout(500); };
  await form();
  log('--- fish by default; water near the coast:', await page.$eval('#seg-kind .on', b => b.textContent), '/', await page.$eval('#seg-water .on', b => b.textContent));
  await page.click('#seg-kind [data-kind=shellfish]'); await page.waitForTimeout(150);
  log('shellfish menu:', await page.$$eval('#f-species-select optgroup', g => g.map(x => `${x.label}: ${[...x.children].map(o => o.textContent).join(', ')}`).join(' | ')));
  log('labels:', await text('#lbl-bait'), '|', await text('#lbl-count'), '| size row hidden:', await page.$eval('#size-row', e => e.hidden), '| gear options:', await page.$$eval('#f-bait-select optgroup', g => g.map(x => x.label).join(', ')));
  await page.click('#seg-water [data-water=Freshwater]'); log('freshwater shellfish:', await page.$$eval('#f-species-select option', o => o.map(x => x.textContent).join(', ')));
  await page.click('#seg-water [data-water=both]');
  await page.selectOption('#f-species-select', 'Crab'); await page.selectOption('#f-subspecies', 'Dungeness Crab'); await page.selectOption('#f-bait-select', 'Crab pot'); await page.fill('#f-lure-color', 'Chicken');
  log('crab fields:', await page.isVisible('#crab-fields'), '| pot fields:', await page.isVisible('#pot-fields'), '| safety:', await page.isVisible('#shell-safety'));
  await page.click('#seg-sex [data-sex=male]'); await page.click('#seg-shell [data-shell=hard]'); await page.fill('#f-carapace', '6.5'); await page.fill('#f-pots', '2'); await page.fill('#f-soak', '1.5');
  await page.click('#count-plus'); await page.click('#count-plus'); if (!(await page.$eval('#seg-released [data-rel=kept]', b => b.classList.contains('on')))) await page.click('#seg-released [data-rel=kept]');
  await page.screenshot({ path: 'sh-1-form.png' });
  await page.click('#btn-save-catch'); await page.waitForTimeout(600); log('toast:', await text('#toast-text'));
  await page.click('.tab[data-view=log]'); await page.waitForTimeout(200); log('log card:', await text('#catch-list .catch'));
  await page.click('.catch'); await page.waitForTimeout(400); log('detail:', (await text('#detail-body')).slice(0, 260)); await page.click('#sheet-detail [data-close]'); await page.waitForTimeout(200);
  // limits + a female crab
  await page.click('#btn-menu'); await page.click('#btn-limits'); await page.waitForTimeout(200); await page.click('#lim-wa-crab'); await page.waitForTimeout(150);
  log('limits:', await text('#lim-list')); await page.click('#sheet-limits [data-close]'); await page.click('#sheet-settings [data-close]'); await page.waitForTimeout(200);
  await form(); log('form remembers shellfish:', await page.$eval('#seg-kind .on', b => b.textContent));
  await page.fill('#f-species-find', 'dungen'); await page.click('#species-find-results [data-find]'); await page.selectOption('#f-bait-select', 'Crab ring net');
  await page.click('#seg-sex [data-sex=female]'); await page.fill('#f-carapace', '5.5'); if (!(await page.$eval('#seg-released [data-rel=kept]', b => b.classList.contains('on')))) await page.click('#seg-released [data-rel=kept]');
  log('crab hint:', await page.isVisible('#crab-hint') ? await text('#crab-hint') : 'hidden', '| kept hint:', await text('#kept-hint'));
  await page.screenshot({ path: 'sh-2-female.png' });
  await page.click('#btn-save-catch'); await page.waitForTimeout(300); log('confirm:', await page.isVisible('#confirm') ? await text('#confirm-msg') : 'none');
  await page.click('#confirm-no'); await page.click('#seg-released [data-rel=released]'); await page.click('#btn-save-catch'); await page.waitForTimeout(500);
  // clams: safety note; switching back to fish
  await form(); await page.fill('#f-species-find', 'manila'); await page.click('#species-find-results [data-find]'); log('manila -> kind:', await page.$eval('#seg-kind .on', b => b.textContent), '| safety:', await page.isVisible('#shell-safety'), '| crab fields:', await page.isVisible('#crab-fields'));
  await page.click('#seg-kind [data-kind=fish]'); log('back to fish -> species cleared:', JSON.stringify(await page.inputValue('#f-species')), '| size row:', await page.isVisible('#size-row'), '| lure label:', await text('#lbl-bait'));
  await page.fill('#f-species-find', 'shoal'); await page.click('#species-find-results [data-find]'); await pickBait(page, 'Senko'); await page.click('#btn-save-catch'); await page.waitForTimeout(400);
  // clam and oyster limits
  await page.click('#btn-menu'); await page.click('#btn-limits'); await page.waitForTimeout(200); await page.click('#lim-wa-clam'); await page.waitForTimeout(150);
  log('clam limits:', (await text('#lim-list')).slice(0, 700)); await page.screenshot({ path: 'sh-5-limits.png', fullPage: true });
  await page.click('#sheet-limits [data-close]'); await page.click('#sheet-settings [data-close]'); await page.waitForTimeout(200);
  for (const [sp, n] of [['manila', 30], ['butter', 9]]) {
    await form(); await page.click('#seg-kind [data-kind=shellfish]'); await page.fill('#f-species-find', sp); await page.click('#species-find-results [data-find]'); await page.selectOption('#f-bait-select', 'Shovel');
    for (let i = 1; i < n; i++) await page.click('#count-plus');
    if (!(await page.$eval('#seg-released [data-rel=kept]', b => b.classList.contains('on')))) await page.click('#seg-released [data-rel=kept]');
    log(sp, 'kept hint:', await text('#kept-hint'));
    await page.click('#btn-save-catch'); await page.waitForTimeout(400);
    if (await page.isVisible('#confirm')) { log('confirm:', await text('#confirm-msg')); await page.click('#confirm-yes'); await page.waitForTimeout(400); }
  }
  await page.click('.tab[data-view=now]'); await page.waitForTimeout(300); log('now kept line:', await page.$eval('body', e => (e.querySelector('.kept-line') || { textContent: 'none' }).textContent));
  await page.click('.tab[data-view=log]'); await page.waitForTimeout(200);
  // stage 2: stats by kind
  await page.click('.tab[data-view=stats]'); await page.waitForTimeout(300);
  log('stats bar:', await page.$$eval('#stats-kind [data-skind]', b => b.map(x => x.textContent + (x.classList.contains('on') ? '*' : '')).join(' / ')));
  await page.click('#stats-kind [data-skind=shellfish]'); await page.waitForTimeout(300);
  log('shell tiles:', await text('#stats-body .tiles'));
  log('shell cards:', await page.$$eval('#stats-body .card h3', h => h.map(x => x.textContent).join(' | ')));
  const card = (t) => page.$eval('#stats-body', (e, t) => ([...e.querySelectorAll('.card')].find(c => c.querySelector('h3')?.textContent.startsWith(t)) || { textContent: 'none' }).textContent.replace(/\s+/g, ' ').trim().slice(0, 300), t);
  log('pot card:', await card('Catch per pot')); log('crc card:', await card('Catch record'));
  await page.screenshot({ path: 'sh-3-stats.png', fullPage: true });
  await page.click('#stats-kind [data-skind=fish]'); await page.waitForTimeout(200); log('fish tiles:', await text('#stats-body .tiles'));
  // stage 3: a clamming trip on Anderson Island
  await page.evaluate(() => { document.querySelector('.tab[data-view=now]').click(); document.querySelector('#now-trips').click(); }); await page.waitForTimeout(200);
  await page.click('#btn-new-trip'); await page.waitForTimeout(300);
  await page.selectOption('#tr-type', 'clamming'); await page.selectOption('#tr-where', '__coords'); await page.fill('#tr-lat', '47.16'); await page.fill('#tr-lon', '-122.70');
  await page.click('#trip-form button[type=submit]'); await page.waitForTimeout(1800);
  log('trip name:', await text('#trip-body h2, #sheet-trip h2'));
  log('trip cards:', await page.$$eval('#trip-body .card h3', h => h.map(x => x.textContent).join(' | ')));
  log('clam box:', await page.$eval('#trip-body', e => (e.querySelector('.clam-box') || { textContent: 'none' }).textContent.replace(/\s+/g, ' ').trim().slice(0, 300)));
  log('gear:', await page.$eval('#trip-body .gear', e => e.textContent.replace(/\s+/g, ' ').replace(/×/g, '|').trim().slice(0, 300)));
  log('regs:', await page.$$eval('#trip-body a.btn', a => a.map(x => x.textContent).join(' | ')));
  await page.screenshot({ path: 'sh-4-trip.png', fullPage: true });
  await page.click('#sheet-trip [data-close]'); await page.waitForTimeout(200); log('trip list:', await text('#trips-list'));
  log('errors:', errors.length ? errors : 'none');
  await browser.close(); srv.close();
})().catch(e => { console.error(e); process.exit(1); });
