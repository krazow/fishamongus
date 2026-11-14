const { chromium } = require('playwright');
const OUTDIR = process.env.OUT || process.cwd();
const { pickBait, returning } = require('./sim.js');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.argv[2] || path.join(__dirname, '..');
const types = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.png':'image/png', '.svg':'image/svg+xml' };
const srv = http.createServer((q, r) => { let f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html';
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); r.end(d); }); }).listen(8124);
(async () => {
  const browser = await chromium.launch((process.env.CHROME ? { executablePath: process.env.CHROME } : {}));
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'en-US', timezoneId: 'America/Los_Angeles' });
  const page = await ctx.newPage(); await returning(page);
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.route(/open-meteo|unpkg|openstreetmap/, r => r.abort());
  await page.goto('http://localhost:8124/');
  // empty state
  await page.click('.tab[data-view=stats]'); await page.waitForTimeout(200);
  console.log('empty:', (await page.textContent('#stats-body')).trim().slice(0, 40));
  // seed 40 varied catches
  await page.evaluate(async () => {
    const sp = ['Largemouth Bass','Largemouth Bass','Largemouth Bass','Smallmouth Bass','Bluegill','Rainbow Trout','Calico Bass (Kelp Bass)','Black Crappie','Channel Catfish','Yellow Perch','Walleye'];
    const lures = ['Senko','Senko','Senko','Ned rig','Spinnerbait','Crankbait','Topwater popper','Nightcrawler','Jig','Drop shot','Chatterbait','PowerBait'];
    const codes = [0,1,2,3,3,61,63,45,80];
    const trends = ['rising','steady','falling','falling'];
    let seed = 7; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280; const pick = a => a[Math.floor(rnd() * a.length)];
    const db = await new Promise(r => { const q = indexedDB.open('tightlines', 6); q.onsuccess = () => r(q.result); });
    const tx = db.transaction('catches', 'readwrite'); const st = tx.objectStore('catches');
    for (let i = 0; i < 40; i++) {
      const t = Date.now() - Math.floor(rnd() * 200) * 86400000 - Math.floor(rnd() * 24) * 3600000;
      const s = pick(sp); const code = pick(codes);
      st.put({ id: 'seed' + i, createdAt: t, updatedAt: t, caughtAt: t, species: s, bait: (code === 3 && rnd() < .6) ? 'Senko' : pick(lures),
        lengthCm: rnd() < .7 ? 20 + rnd() * 40 : null, weightKg: rnd() < .6 ? .2 + rnd() * 3 : null, released: rnd() < .6, notes: '', photo: null, thumb: null,
        location: { lat: 34 + rnd(), lon: -118 - rnd(), accuracy: 5, source: 'gps' },
        weather: i % 9 === 0 ? null : { tempC: 4 + rnd() * 30, feelsC: 10, humidity: 60, precipMm: 0, code, isDay: true, cloud: 50, pressure: 1015, pressureTrend: pick(trends), windKmh: rnd() * 40, windDir: 200, gustKmh: 20 }, weatherTries: 9 });
    }
    await new Promise(r => tx.oncomplete = r);
  });
  await page.reload(); await page.waitForTimeout(300);
  await page.click('.tab[data-view=stats]'); await page.waitForTimeout(300);
  await page.screenshot({ path: OUTDIR + '/s1.png' });
  await page.click('.heat tbody tr:first-child td:nth-child(3) button'); await page.waitForTimeout(150);
  console.log('readout:', await page.textContent('#heat-readout'));
  const card = await page.$('#stats-body .card'); await card.screenshot({ path: OUTDIR + '/s2-card.png' });
  for (const d of ['pressure','temp','wind','time','moon']) { await page.click(`[data-dim=${d}]`); await page.waitForTimeout(100); console.log(d, '->', await page.$$eval('.picks li', l => l.map(x => x.textContent.replace(/\s+/g,' ').trim()).join(' | '))); }
  await page.click('[data-dim=time]'); const card2 = await page.$('#stats-body .card'); await card2.screenshot({ path: OUTDIR + '/s3-time.png' });
  await page.evaluate(() => window.scrollTo(0, 99999)); await page.waitForTimeout(100);
  await page.screenshot({ path: OUTDIR + '/s4-bottom.png' });
  await page.selectOption('#st-species', 'Largemouth Bass'); await page.waitForTimeout(150);
  console.log('bass tiles:', await page.$eval('.tiles', e => e.textContent.replace(/\s+/g,' ')));
  await page.selectOption('#st-range', '30'); await page.waitForTimeout(150);
  console.log('30d:', (await page.textContent('#stats-body')).replace(/\s+/g,' ').slice(0, 80));
  await page.selectOption('#st-species', ''); await page.selectOption('#st-range', 'all');
  await page.click('.best-list button'); await page.waitForTimeout(300); console.log('detail open:', !(await page.$eval('#sheet-detail', e => e.hidden)));
  await page.goBack(); await page.waitForTimeout(200);
  await page.click('#btn-menu'); await page.click('[data-units=metric]'); await page.click('#sheet-settings [data-close]'); await page.waitForTimeout(200);
  console.log('metric temp cols:', await page.$$eval('[data-dim]', b => b.length), await (async () => { await page.click('[data-dim=temp]'); return page.$$eval('.heat thead th', t => t.map(x => x.textContent).join(' ')); })());
  await page.emulateMedia({ colorScheme: 'dark' }); await page.click('[data-dim=sky]'); await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: OUTDIR + '/s5-dark.png' });
  // overflow check
  console.log('page width:', await page.evaluate(() => document.documentElement.scrollWidth));
  await page.click('.tab[data-view=log]'); await page.screenshot({ path: OUTDIR + '/s6-log.png' });
  console.log('errors:', errors);
  await browser.close(); srv.close();
})().catch(e => { console.error(e); process.exit(1); });
