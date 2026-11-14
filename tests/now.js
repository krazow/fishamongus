const { chromium } = require('playwright');
const OUTDIR = process.env.OUT || process.cwd();
const http = require('http'), fs = require('fs'), path = require('path');
const { hilo, meteo, STATIONS, pickBait } = require('./sim.js');
const ROOT = process.argv[2] || path.join(__dirname, '..');
const types = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.png':'image/png', '.svg':'image/svg+xml' };
const srv = http.createServer((q, r) => { let f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html';
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); r.end(d); }); }).listen(8140);
const log = (...a) => console.log(...a);
function marine(u) { const q = u.searchParams; const past = +(q.get('past_days') || 1), fut = +(q.get('forecast_days') || 1);
  const h0 = Math.floor(Date.now() / 3600000) * 3600 - past * 86400; const n = (past + fut) * 24; const time = [...Array(n)].map((_, i) => h0 + i * 3600);
  return { hourly: { time, sea_surface_temperature: time.map(() => 16.4), wave_height: time.map((t, i) => 0.9 + (i % 6) * 0.1), wave_period: time.map(() => 12), wave_direction: time.map(() => 260) } }; }
(async () => {
  const browser = await chromium.launch((process.env.CHROME ? { executablePath: process.env.CHROME } : {}));
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, geolocation: { latitude: 34.0105, longitude: -118.497, accuracy: 6 }, permissions: ['geolocation'], locale: 'en-US', timezoneId: 'America/Los_Angeles', acceptDownloads: true, serviceWorkers: 'block' });
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message));
  let noaaDown = false;
  await page.route(/marine-api\.open-meteo/, r => r.fulfill({ contentType: 'application/json', body: JSON.stringify(marine(new URL(r.request().url()))) }));
  await page.route(/\/\/api\.open-meteo\.com/, r => r.fulfill({ contentType: 'application/json', body: JSON.stringify(meteo(new URL(r.request().url()))) }));
  await page.route(/unpkg\.com.*leaflet\.js/, r => r.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(path.join(__dirname, 'leaflet-stub.js'), 'utf8') }));
  await page.route(/unpkg\.com.*leaflet\.css|openstreetmap/, r => r.fulfill({ contentType: 'text/css', body: '' }));
  await page.route(/tidesandcurrents\.noaa\.gov/, r => { if (noaaDown) return r.abort(); const u = new URL(r.request().url()); if (u.pathname.includes('stations.json')) return r.fulfill({ contentType: 'application/json', body: JSON.stringify(STATIONS) });
    return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ predictions: hilo(u.searchParams.get('begin_date'), u.searchParams.get('end_date')) }) }); });
  await page.addInitScript(() => { try { localStorage.setItem('tl.welcomed', '1'); localStorage.setItem('tl.installSnooze', String(Date.now() + 1e11)); } catch (e) {} });
  const shot = (n) => page.screenshot({ path: `nw-${n}.png` });
  const idb = (fn, arg) => page.evaluate(([src, a]) => new Promise((res, rej) => { const r = indexedDB.open('tightlines'); r.onsuccess = () => { const db = r.result; const f = new Function('db', 'a', src); Promise.resolve(f(db, a)).then((v) => { db.close(); res(v); }, rej); }; r.onerror = () => rej(r.error); }), [fn, arg]);
  const getAll = (store) => idb(`return new Promise(res => { const q = db.transaction('${store}').objectStore('${store}').getAll(); q.onsuccess = () => res(q.result); });`);

  await page.goto('http://localhost:8140/'); await page.waitForTimeout(1500);
  log('--- Now screen (empty log)');
  log('active view:', await page.$eval('.view.active', e => e.id), '| tab:', await page.$eval('.tab.active', e => e.dataset.view));
  log('cond:', (await page.textContent('#now-cond')).replace(/\s+/g, ' ').trim());
  log('session card:', (await page.textContent('#now-session')).replace(/\s+/g, ' ').trim().slice(0, 120));
  log('recs:', (await page.textContent('#now-recs')).replace(/\s+/g, ' ').trim().slice(0, 140));
  await shot('1-now-empty');

  log('--- catch form');
  await page.click('#btn-new'); await page.waitForFunction(() => document.querySelector('#cond-sum-text').textContent.includes('°'));
  await page.waitForTimeout(600);
  log('summary:', await page.textContent('#cond-sum-text'), '| panel hidden:', await page.$eval('#cond-panel', e => e.hidden), '| combos hidden:', await page.$eval('#combo-field', e => e.hidden));
  const btn = await page.$eval('#btn-save-catch', e => { const r = e.getBoundingClientRect(); return { y: Math.round(r.top), h: Math.round(r.height), t: e.textContent }; });
  log('save button:', JSON.stringify(btn), '(viewport 844)');
  await shot('2-form');
  await page.click('#cond-summary'); log('panel after tap hidden:', await page.$eval('#cond-panel', e => e.hidden)); await shot('3-form-open'); await page.click('#cond-summary');
  await require('./sim.js').pickSpecies(page, 'Calico Bass (Kelp Bass)'); await pickBait(page, 'Swimbait');
  await page.click('#btn-save-catch'); await page.waitForTimeout(500);
  const more = [['Spotted Bay Bass', 'Swimbait'], ['Barred Sand Bass', 'Curly-tail grub'], ['Calico Bass (Kelp Bass)', 'Curly-tail grub'], ['California Halibut', 'Live bait']];
  for (const [sp, b] of more) {
    await page.click('#btn-new'); await page.waitForFunction(() => document.querySelector('#cond-sum-text').textContent.includes('°'));
    const listed = await page.$eval('#f-species-select', (s, v) => [...s.options].some(o => o.value === v), sp);
    if (listed) await require('./sim.js').pickSpecies(page, sp); else { await page.selectOption('#f-species-select', '__other'); await page.fill('#f-species', sp); }
    await pickBait(page, b); await page.click('#btn-save-catch'); await page.waitForTimeout(400);
  }
  await page.click('#btn-new'); await page.waitForTimeout(500);
  log('combo chips:', await page.$$eval('#combo-chips .chip', a => a.map(x => x.textContent).join(' | ')));
  await page.click('#combo-chips .chip:nth-child(2)'); await page.waitForTimeout(100);
  log('after combo tap: species', await page.inputValue('#f-species'), '| bait', await page.inputValue('#f-bait'));
  await page.click('[data-close]'); await page.waitForTimeout(200); if (!(await page.$eval('#confirm', e => e.hidden))) await page.click('#confirm-yes'); await page.waitForTimeout(300);

  log('--- session');
  await page.click('.tab[data-view=now]'); await page.waitForTimeout(800);
  log('recs:', (await page.textContent('#now-recs')).replace(/\s+/g, ' ').trim().slice(0, 220));
  await page.click('#ses-start'); await page.waitForTimeout(600);
  log('toast:', await page.textContent('#toast-text'));
  log('session card:', (await page.textContent('#now-session')).replace(/\s+/g, ' ').trim().slice(0, 200));
  await shot('4-session');
  await page.click('[data-quick="0"]'); await page.waitForFunction(() => /logged/.test(document.querySelector('#toast-text').textContent), null, { timeout: 15000 }); await page.waitForTimeout(1500);
  log('quick toast:', await page.textContent('#toast-text'), '| action:', await page.textContent('#toast-action'));
  let cs = await getAll('catches'); const q = cs.find(c => c.quick);
  log('quick catch saved:', q.species, q.bait, '| has location:', !!q.location, '| weather:', !!q.weather, '| sessionId:', !!q.sessionId);
  log('fish in card:', await page.$eval('.ses-nums b', e => e.textContent));
  // change lure
  await page.click('#ses-lure'); await page.waitForTimeout(300); await shot('5-lure-picker');
  await page.selectOption('#lp-select', 'Curly-tail grub'); await page.fill('#lp-color', 'Motor oil'); await page.click('#lure-form button[type=submit]'); await page.waitForTimeout(400);
  log('lure now:', await page.$eval('#ses-lure b', e => e.textContent), '| toast:', await page.textContent('#toast-text'));
  // form prefills the session lure
  await page.click('#btn-new'); await page.waitForTimeout(500);
  log('form prefilled bait:', await page.inputValue('#f-bait'), '/', await page.inputValue('#f-lure-color'));
  await require('./sim.js').pickSpecies(page, 'White Seabass'); await pickBait(page, 'Live bait'); await page.click('#btn-save-catch'); await page.waitForTimeout(600);
  let ss = await getAll('sessions'); log('session lures:', ss[0].lures.map(l => l.bait).join(' → '));
  // session bar on other tabs
  await page.click('.tab[data-view=log]'); await page.waitForTimeout(300);
  log('session bar:', await page.$eval('#session-bar', e => e.hidden ? 'hidden' : e.textContent.replace(/\s+/g, ' ').trim()));
  await shot('6-log-bar');
  await page.click('#sb-open'); await page.waitForTimeout(300); log('bar tap -> view:', await page.$eval('.view.active', e => e.id), '| bar hidden on Now:', await page.$eval('#session-bar', e => e.hidden));

  log('--- end + stats (shift the session 2 h into the past)');
  await idb(`return new Promise(res => { const tx = db.transaction(['sessions','catches'], 'readwrite'); const S = tx.objectStore('sessions'); const C = tx.objectStore('catches');
    S.getAll().onsuccess = (e) => { const s = e.target.result[0]; const H = 3600000; const base = s.start - 2 * H; s.start = base; s.lures = [{ bait: 'Curly-tail grub', color: '', size: '', at: base }, { bait: 'Swimbait', color: '', size: '', at: base + 0.6 * H }, { bait: 'Live bait', color: '', size: '', at: base + 1.2 * H }]; S.put(s);
      C.getAll().onsuccess = (e2) => { e2.target.result.filter(c => c.sessionId === s.id).forEach((c, i) => { c.caughtAt = base + (i === 0 ? 1.5 : 1.9) * H; C.put(c); }); }; };
    tx.oncomplete = () => res(); });`);
  await page.reload(); await page.waitForTimeout(1200);
  log('after reload, session still live:', !!(await page.$('#ses-end')), '| elapsed:', await page.textContent('#ses-elapsed'));
  await page.click('#ses-end'); await page.waitForTimeout(400);
  log('end toast:', await page.textContent('#toast-text'), '| action:', await page.textContent('#toast-action'));
  log('card after end:', (await page.textContent('#now-session')).replace(/\s+/g, ' ').trim().slice(0, 120));
  await page.click('.tab[data-view=stats]'); await page.waitForTimeout(500);
  const card = await page.$$eval('#stats-body .card', a => a.map(x => x.textContent.replace(/\s+/g, ' ').trim()).find(t => t.startsWith('Fish per hour')));
  log('stats card:', card);
  const fph = await page.$('#stats-body .fph-rows'); if (fph) await fph.scrollIntoViewIfNeeded(); await shot('7-stats-fph');

  log('--- short accidental session is discarded');
  await page.click('.tab[data-view=now]'); await page.waitForTimeout(300); await page.click('#ses-start'); await page.waitForTimeout(300);
  if (!(await page.$('#ses-end'))) { await page.click('[data-close]'); await page.waitForTimeout(200); }
  await page.click('#ses-end'); await page.waitForTimeout(300); log('toast:', await page.textContent('#toast-text'), '| sessions in db:', (await getAll('sessions')).length);

  log('--- trips from Now');
  await page.click('#now-trips'); await page.waitForTimeout(300);
  log('view:', await page.$eval('.view.active', e => e.id), '| lit tab:', await page.$eval('.tab.active', e => e.dataset.view));
  await page.click('#trips-back'); await page.waitForTimeout(300); log('back ->', await page.$eval('.view.active', e => e.id));

  log('--- offline Now');
  await ctx.setOffline(true); await page.click('#now-refresh'); await page.waitForTimeout(800);
  log('msg:', await page.$eval('#now-cond', e => (e.querySelector('.now-msg') || {}).textContent || '(none)'));
  await ctx.setOffline(false);
  await page.click('#now-refresh'); await page.waitForTimeout(1000); await page.evaluate(() => window.scrollTo(0, 0)); await shot('8-now-full');
  await page.screenshot({ path: 'nw-9-now-fullpage.png', fullPage: true });

  log('--- backup includes sessions');
  const [dl] = await Promise.all([page.waitForEvent('download'), (async () => { await page.click('#btn-menu'); await page.waitForTimeout(200); await page.click('#btn-export-json'); })()]);
  const bk = JSON.parse(fs.readFileSync(await dl.path(), 'utf8')); log('backup version', bk.version, '| sessions', (bk.sessions || []).length);

  log('errors:', errors.length ? errors : 'none');
  await browser.close(); srv.close();
})().catch(e => { console.error(e); process.exit(1); });
