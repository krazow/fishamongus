const H = (t) => { const h = t / 3600000; const d = h / 24; const A = 0.55 + 0.3 * Math.cos(2 * Math.PI * (d - 2) / 14.77); return 0.85 + A * Math.cos(2 * Math.PI * h / 12.42) + 0.25 * Math.cos(2 * Math.PI * h / 24.84 + 1); };
function hilo(bs, es) { const b = Date.UTC(+bs.slice(0,4), +bs.slice(4,6)-1, +bs.slice(6,8)); const e = Date.UTC(+es.slice(0,4), +es.slice(4,6)-1, +es.slice(6,8)) + 86400000;
  const out = []; let prev = H(b - 60000), cur = H(b); for (let t = b; t < e; t += 60000) { const next = H(t + 60000); if (cur > prev && cur >= next) out.push({ t, v: cur, type: 'H' }); if (cur < prev && cur <= next) out.push({ t, v: cur, type: 'L' }); prev = cur; cur = next; }
  const p = n => String(n).padStart(2, '0'); return out.map(o => { const d = new Date(o.t); return { t: `${d.getUTCFullYear()}-${p(d.getUTCMonth()+1)}-${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`, v: o.v.toFixed(3), type: o.type }; }); }
const STATIONS = { stations: [ { id: '9410840', name: 'Santa Monica', lat: 34.0083, lng: -118.5, state: 'CA' } ] };
function meteo(u) { const q = u.searchParams; const past = +(q.get('past_days') || 0), fut = +(q.get('forecast_days') || 1);
  const h0 = Math.floor(Date.now() / 3600000) * 3600 - past * 86400; const n = (past + fut) * 24 + 24; const time = [...Array(n)].map((_, i) => h0 + i * 3600);
  const codes = [0, 1, 2, 3, 3, 61, 2, 1]; const arr = f => time.map((t, i) => f(i, t));
  const hourly = { time, temperature_2m: arr((i, t) => 13 + 6 * Math.sin((t / 3600 % 24 - 9) / 24 * 2 * Math.PI)), relative_humidity_2m: arr(() => 70), apparent_temperature: arr(() => 12), is_day: arr((i, t) => { const hh = (t / 3600 - 8) % 24; return hh > 6 && hh < 17 ? 1 : 0; }),
    precipitation: arr((i) => (codes[Math.floor(i / 5) % 8] === 61 ? 0.6 : 0)), weather_code: arr((i) => codes[Math.floor(i / 5) % 8]), cloud_cover: arr(() => 50), pressure_msl: arr((i) => 1015 + 4 * Math.sin(i / 20)),
    wind_speed_10m: arr((i) => 4 + (i % 12)), wind_direction_10m: arr(() => 290), wind_gusts_10m: arr((i) => 10 + (i % 12)), precipitation_probability: arr((i) => (codes[Math.floor(i / 5) % 8] === 61 ? 60 : 5)) };
  const res = { hourly }; if (q.get('current')) res.current = { time: Math.floor(Date.now() / 1000), temperature_2m: 17, relative_humidity_2m: 60, apparent_temperature: 16, is_day: 1, precipitation: 0, weather_code: 2, cloud_cover: 40, pressure_msl: 1014, wind_speed_10m: 8, wind_direction_10m: 270, wind_gusts_10m: 14 };
  return res; }

module.exports = { hilo, meteo, STATIONS };
// Choose a lure in the grouped dropdown, or type it under "Other" when it isn't listed.
async function pickBait(page, v) {
  const listed = await page.$eval('#f-bait-select', (s, val) => [...s.options].some((o) => o.value === val), v);
  if (listed) await page.selectOption('#f-bait-select', v);
  else { await page.selectOption('#f-bait-select', '__other'); await page.fill('#f-bait', v); }
}
// Older tests start as a returning user (no welcome screen or install banner).
async function returning(page) { await page.addInitScript(() => { try { localStorage.setItem('tl.welcomed', '1'); localStorage.setItem('tl.installSnooze', String(Date.now() + 1e11)); } catch (e) {} }); }
module.exports.pickBait = pickBait; module.exports.returning = returning;
// Tests written before the Now screen start on the Log tab.
async function logHome(page) { await page.addInitScript(() => { window.addEventListener('load', () => { const t = document.querySelector('.tab[data-view=log]'); if (t) t.click(); }); }); }
const _ret = returning; module.exports.returning = async (page) => { await _ret(page); await logHome(page); }; module.exports.logHome = logHome;
// Picks any fish in the two-level menu: a type ("Bass") and then the kind ("Shoal Bass"), or a one-of-a-kind fish.
async function pickSpecies(page, name) {
  const done = await page.evaluate((n) => {
    const both = document.querySelector('#seg-water [data-water=both]'); if (both && !both.classList.contains('on')) both.click();
    const main = document.querySelector('#f-species-select');
    if ([...main.options].some((o) => o.value === n)) { main.value = n; main.dispatchEvent(new Event('change', { bubbles: true })); return true; }
    for (const o of main.options) {
      main.value = o.value; main.dispatchEvent(new Event('change', { bubbles: true }));
      const sub = document.querySelector('#f-subspecies');
      if (sub && [...sub.options].some((x) => x.value === n)) { sub.value = n; sub.dispatchEvent(new Event('change', { bubbles: true })); return true; }
    }
    return false;
  }, name);
  if (!done) throw new Error('fish not in the menus: ' + name);
}
module.exports.pickSpecies = pickSpecies;
