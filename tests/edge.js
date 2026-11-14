const { chromium } = require('playwright');
const OUTDIR = process.env.OUT || process.cwd();
const http = require('http'), fs = require('fs'), path = require('path');
const { hilo, meteo, STATIONS, pickBait } = require('./sim.js');
const ROOT = process.argv[2] || path.join(__dirname, '..');
const types = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.png':'image/png', '.svg':'image/svg+xml' };
const srv = http.createServer((q, r) => { let f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html';
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); r.end(d); }); }).listen(8190);
const log = (...a) => console.log(...a);
function marine(u) { const q = u.searchParams; const past = +(q.get('past_days') || 1), fut = +(q.get('forecast_days') || 1);
  const h0 = Math.floor(Date.now() / 3600000) * 3600 - past * 86400; const n = (past + fut) * 24; const time = [...Array(n)].map((_, i) => h0 + i * 3600);
  return { hourly: { time, sea_surface_temperature: time.map(() => 16.4), wave_height: time.map((t, i) => 0.9 + (i % 6) * 0.1), wave_period: time.map(() => 12), wave_direction: time.map(() => 260) } }; }
const VW = +(process.argv[3] || 390), VH = +(process.argv[4] || 844), SCHEME = process.argv[5] || 'light', TAG = `${VW}-${SCHEME}`;
(async () => {
  const browser = await chromium.launch((process.env.CHROME ? { executablePath: process.env.CHROME } : {}));
  const ctx = await browser.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: 1, isMobile: VW < 700, hasTouch: VW < 700, colorScheme: SCHEME, geolocation: { latitude: 34.0105, longitude: -118.497, accuracy: 6 }, permissions: ['geolocation'], locale: 'en-US', timezoneId: 'America/Los_Angeles', acceptDownloads: true, serviceWorkers: 'block' });
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.route(/marine-api\.open-meteo/, r => r.fulfill({ contentType: 'application/json', body: JSON.stringify(marine(new URL(r.request().url()))) }));
  await page.route(/\/\/api\.open-meteo\.com/, r => r.fulfill({ contentType: 'application/json', body: JSON.stringify(meteo(new URL(r.request().url()))) }));
  await page.route(/unpkg\.com.*leaflet\.js/, r => r.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(path.join(__dirname, 'leaflet-stub.js'), 'utf8') }));
  await page.route(/unpkg\.com.*leaflet\.css|openstreetmap/, r => r.fulfill({ contentType: 'text/css', body: '' }));
  await page.route(/tidesandcurrents\.noaa\.gov/, r => { const u = new URL(r.request().url()); if (u.pathname.includes('stations.json')) return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ stations: [...STATIONS.stations, { id: '9446484', name: 'Tacoma', lat: 47.27, lng: -122.41, state: 'WA' }] }) });
    return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ predictions: hilo(u.searchParams.get('begin_date'), u.searchParams.get('end_date')) }) }); });
  await page.addInitScript(() => { try { localStorage.setItem('tl.installSnooze', String(Date.now() + 1e11)); localStorage.setItem('tl.lastBackup', String(Date.now())); localStorage.setItem('tl.units', 'imperial'); } catch (e) {} });
  const consoleErr = []; page.on('console', m => { if (m.type() === 'error') consoleErr.push(m.text()); });
  await page.addInitScript(() => { try { localStorage.setItem('tl.installSnooze', String(Date.now() + 1e11)); localStorage.setItem('tl.lastBackup', String(Date.now())); localStorage.setItem('tl.units', 'imperial'); } catch (e) {} });
  const W = (ms) => page.waitForTimeout(ms); const issues = []; const note = (where, what) => { issues.push(`[${where}] ${what}`); };
  const OUT = path.join(OUTDIR, 'ex'); fs.mkdirSync(OUT, { recursive: true }); let n = 0;
  const snap = async (name, full = false) => { await page.screenshot({ path: `${OUT}/${TAG}-${String(++n).padStart(2, '0')}-${name}.jpg`, type: 'jpeg', quality: 70, fullPage: full }); };
  // generic checks on what is visible now
  const check = async (where) => {
    const r = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth; const out = { overflow: [], small: [], unlabeled: [], clipped: [] };
      const vis = (el) => { const s = getComputedStyle(el); if (s.visibility === 'hidden' || s.display === 'none') return false; const b = el.getBoundingClientRect(); return b.width > 0 && b.height > 0 && b.bottom > 0 && b.top < innerHeight; };
      const top = [...document.querySelectorAll('.sheet:not([hidden])')].pop();
      const scope = top || document.body;
      const name = (el) => (el.id ? '#' + el.id : '') + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '') + ' "' + (el.textContent || el.value || el.getAttribute('aria-label') || '').trim().slice(0, 30) + '"';
      scope.querySelectorAll('*').forEach((el) => { if (!vis(el)) return; const b = el.getBoundingClientRect(); if (b.right > vw + 1 && !el.closest('.heat-scroll,.dims,.chips,.quick,[data-scroll-x],.week,.tide-scroll,.leaflet-container,.strip')) out.overflow.push(name(el) + ` right=${Math.round(b.right)}`); });
      scope.querySelectorAll('button, a, input, select, textarea, [role=button]').forEach((el) => { if (!vis(el)) return; const b = el.getBoundingClientRect();
        if ((b.height < 32 || b.width < 32) && !(el.tagName === 'A' && el.closest('p,li,small'))) out.small.push(name(el) + ` ${Math.round(b.width)}x${Math.round(b.height)}`);
        const lab = el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || (el.id && document.querySelector(`label[for="${el.id}"]`)) || el.closest('label') || (el.textContent || '').trim() || el.title || el.placeholder;
        if (!lab && el.type !== 'hidden') out.unlabeled.push(name(el)); });
      scope.querySelectorAll('h1,h2,h3,b,span,small,p,label,button,td,th,em').forEach((el) => { if (!vis(el) || el.children.length) return; const s = getComputedStyle(el); if ((s.overflow === 'hidden' || s.textOverflow === 'ellipsis') && el.scrollWidth > el.clientWidth + 2) out.clipped.push(name(el)); });
      return out;
    });
    for (const k of Object.keys(r)) { const u = [...new Set(r[k])]; if (u.length) note(where, `${k}: ${u.slice(0, 6).join(' | ')}${u.length > 6 ? ` (+${u.length - 6})` : ''}`); }
  };
  const go = async (view) => { await page.evaluate((v) => { window.scrollTo(0, 0); document.querySelector(`.tab[data-view=${v}]`).click(); }, view); await W(500); };
  const closeTop = async () => { await page.evaluate(() => { const s = [...document.querySelectorAll('.sheet:not([hidden])')].pop(); if (s) { const b = s.querySelector('[data-close]'); if (b) b.click(); } }); await W(350); };
  const fullSheet = async (name) => { const h = await page.evaluate(() => { const s = [...document.querySelectorAll('.sheet:not([hidden]) .sheet-scroll')].pop(); return s ? s.scrollHeight : 0; }); await snap(name); if (h > VH * 1.3) { await page.evaluate(() => { const s = [...document.querySelectorAll('.sheet:not([hidden]) .sheet-scroll')].pop(); s.scrollTop = s.scrollHeight / 2; }); await W(150); await snap(name + '-mid'); await check(name + ' (mid)'); } };

  await page.goto('http://localhost:8190/'); await W(1200); await page.click('#welcome-go'); await W(800);
  // future time
  await page.click('#btn-new'); await W(1500); await page.fill('#f-species-find', 'large'); await W(200); await page.click('#species-find-results [data-find]'); await pickBait(page, 'Senko');
  const fut = new Date(Date.now() + 3 * 86400000); const pad = (x) => String(x).padStart(2, '0');
  await page.fill('#f-time', `${fut.getFullYear()}-${pad(fut.getMonth() + 1)}-${pad(fut.getDate())}T10:00`); await W(1500);
  await page.click('#btn-save-catch'); await W(700);
  note('future time', 'form open: ' + await page.isVisible('#sheet-form') + ' | err: ' + await page.$eval('#form-error', e => e.textContent).catch(() => '') + ' | confirm: ' + (await page.isVisible('#confirm') ? await page.$eval('#confirm-msg', e => e.textContent) : 'none'));
  if (await page.isVisible('#confirm')) { await page.click('#confirm-yes'); await W(500); }
  if (await page.isVisible('#sheet-form')) { await closeTop(); if (await page.isVisible('#confirm')) { await page.click('#confirm-yes'); await W(400); } }
  await go('log'); note('future time log', (await page.$eval('#catch-list', e => e.textContent.replace(/\s+/g, ' ').slice(0, 140))));
  // duplicate spot names
  await go('spots'); for (let i = 0; i < 2; i++) { await page.click('#btn-new-spot'); await W(600); const nm = await page.$('#sp-name'); if (nm) await nm.fill('Dock'); await page.click('#sheet-spot-form button[type=submit]').catch(() => {}); await W(900); if (await page.isVisible('#confirm')) { note('dup spot confirm', await page.$eval('#confirm-msg', e => e.textContent)); await page.click('#confirm-no'); await W(300); } await page.evaluate(() => [...document.querySelectorAll('.sheet:not([hidden]) [data-close]')].forEach(b => b.click())); await W(300); }
  note('duplicate spot names', (await page.$eval('#view-spots', e => e.textContent.replace(/\s+/g, ' ').slice(0, 200))));
  // count max / rapid double tap save
  await page.click('#btn-new'); await W(1500); await page.fill('#f-species-find', 'blueg'); await W(200); await page.click('#species-find-results [data-find]'); await pickBait(page, 'Worm');
  await page.evaluate(() => { const b = document.querySelector('#btn-save-catch'); b.click(); b.click(); b.click(); }); await W(1500);
  await go('log'); note('triple-tap save', 'bluegill entries: ' + await page.$$eval('#catch-list .catch', a => a.filter(x => /Bluegill/.test(x.textContent)).length));
  fs.writeFileSync(`${OUT}/${TAG}-issues.txt`, issues.join('\n') + '\n\nPAGE ERRORS:\n' + errors.join('\n') + '\n\nCONSOLE:\n' + [...new Set(consoleErr)].join('\n'));
  log(issues.length, 'issue lines;', errors.length, 'page errors;', consoleErr.length, 'console errors');
  await browser.close(); srv.close();
})().catch(e => { console.error(e); process.exit(1); });
