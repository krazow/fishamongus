/* Fishamongus! – catch log
 * (Storage names below still say "tightlines" on purpose: renaming them would hide catches already saved on phones.)
 * Everything is stored on the device in IndexedDB. Weather comes from Open-Meteo (no API key).
 * Values are stored in metric and converted for display.
 */
(() => {
  'use strict';

  // ---------------------------------------------------------------- constants
  // Common recreational species (North America), grouped for the dropdown.
  const SPECIES_GROUPS = [
    ['Freshwater · Black bass', ['Largemouth Bass', 'Smallmouth Bass', 'Spotted Bass', 'Guadalupe Bass', 'Shoal Bass', 'Redeye Bass', 'Peacock Bass']],
    ['Freshwater · Striped & white bass', ['Striped Bass', 'Hybrid Striped Bass (Wiper)', 'White Bass', 'Yellow Bass', 'White Perch']],
    ['Freshwater · Trout & char', ['Rainbow Trout', 'Steelhead', 'Brown Trout', 'Brook Trout', 'Cutthroat Trout', 'Golden Trout', 'Tiger Trout', 'Lake Trout', 'Splake', 'Bull Trout', 'Dolly Varden', 'Arctic Char']],
    ['Freshwater · Salmon, whitefish & grayling', ['Chinook (King) Salmon', 'Coho (Silver) Salmon', 'Sockeye Salmon', 'Pink Salmon', 'Chum Salmon', 'Atlantic Salmon', 'Kokanee', 'Lake Whitefish', 'Mountain Whitefish', 'Arctic Grayling']],
    ['Freshwater · Panfish', ['Bluegill', 'Redear Sunfish (Shellcracker)', 'Pumpkinseed', 'Green Sunfish', 'Redbreast Sunfish', 'Longear Sunfish', 'Warmouth', 'Rock Bass', 'Black Crappie', 'White Crappie']],
    ['Freshwater · Walleye, perch & pike', ['Walleye', 'Sauger', 'Saugeye', 'Yellow Perch', 'Northern Pike', 'Muskellunge', 'Tiger Muskie', 'Chain Pickerel']],
    ['Freshwater · Catfish', ['Channel Catfish', 'Blue Catfish', 'Flathead Catfish', 'White Catfish', 'Brown Bullhead', 'Black Bullhead', 'Yellow Bullhead']],
    ['Freshwater · Other', ['Common Carp', 'Grass Carp', 'Freshwater Drum', 'Bowfin', 'Longnose Gar', 'Spotted Gar', 'Alligator Gar', 'White Sturgeon', 'Lake Sturgeon', 'Paddlefish', 'American Shad', 'Burbot', 'Tilapia']],
    ['Saltwater · Pacific coast', ['Calico Bass (Kelp Bass)', 'Barred Sand Bass', 'Spotted Bay Bass', 'California Halibut', 'Pacific Halibut', 'Yellowtail', 'White Seabass', 'California Sheephead', 'Lingcod', 'Rockfish', 'Cabezon', 'Barred Surfperch', 'California Corbina', 'Opaleye', 'Pacific Bonito', 'Pacific Mackerel', 'Leopard Shark']],
    ['Saltwater · Inshore (Atlantic & Gulf)', ['Red Drum (Redfish)', 'Black Drum', 'Spotted Seatrout', 'Weakfish', 'Snook', 'Tarpon', 'Bonefish', 'Permit', 'Sheepshead', 'Summer Flounder (Fluke)', 'Southern Flounder', 'Winter Flounder', 'Bluefish', 'Spanish Mackerel', 'Florida Pompano', 'Jack Crevalle', 'Ladyfish', 'Atlantic Croaker', 'Spot', 'Kingfish (Whiting)', 'Tautog', 'Scup (Porgy)']],
    ['Saltwater · Reef & bottom', ['Red Snapper', 'Mangrove (Gray) Snapper', 'Mutton Snapper', 'Yellowtail Snapper', 'Vermilion Snapper', 'Gag Grouper', 'Red Grouper', 'Black Grouper', 'Goliath Grouper', 'Black Sea Bass', 'Gray Triggerfish', 'Hogfish', 'Greater Amberjack', 'Cobia', 'Atlantic Cod', 'Haddock', 'Pollock']],
    ['Saltwater · Offshore', ['Mahi-mahi (Dorado)', 'Yellowfin Tuna', 'Bluefin Tuna', 'Bigeye Tuna', 'Blackfin Tuna', 'Albacore', 'Skipjack Tuna', 'Wahoo', 'King Mackerel', 'Sailfish', 'Blue Marlin', 'White Marlin', 'Striped Marlin', 'Swordfish', 'Mako Shark']],
  ];
  const KNOWN_SPECIES = new Set(SPECIES_GROUPS.flatMap((g) => g[1]));
  const OTHER = '__other';

  const LURE_GROUPS = [
    ['Soft plastics', ['Senko', 'Plastic worm', 'Ned rig', 'Drop shot', 'Texas rig', 'Wacky rig', 'Tube', 'Grub', 'Creature bait', 'Swimbait', 'Paddle tail']],
    ['Hard baits & spinners', ['Crankbait', 'Lipless crankbait', 'Jerkbait', 'Topwater popper', 'Walking bait', 'Frog', 'Spinnerbait', 'Chatterbait', 'Buzzbait', 'Inline spinner', 'Spoon', 'Blade bait', 'Hard swimbait']],
    ['Jigs', ['Jig', 'Bucktail jig', 'Metal jig', 'Flutter jig', 'Hair jig']],
    ['Saltwater lures', ['Surface iron', 'Sabiki', 'Plug', 'Popping cork']],
    ['Flies', ['Fly – dry', 'Fly – nymph', 'Fly – streamer', 'Fly – popper', 'Fly – wet']],
    ['Live & natural bait', ['Nightcrawler', 'Live minnow', 'Shiner', 'Leech', 'Crickets', 'Shrimp', 'Squid', 'Sardine', 'Anchovy', 'Crab', 'Clam', 'Cut bait']],
    ['Prepared bait', ['PowerBait', 'Salmon eggs', 'Corn', 'Dough bait', 'Chicken liver']],
  ];
  const KNOWN_LURES = new Set(LURE_GROUPS.flatMap((g) => g[1]));
  const DEFAULT_BAITS = [
    'Plastic worm', 'Senko', 'Ned rig', 'Drop shot', 'Texas rig', 'Jig', 'Chatterbait', 'Spinnerbait',
    'Crankbait', 'Lipless crankbait', 'Jerkbait', 'Swimbait', 'Topwater popper', 'Walking bait', 'Frog',
    'Inline spinner', 'Spoon', 'Tube', 'Grub', 'Fly – dry', 'Fly – nymph', 'Fly – streamer',
    'Nightcrawler', 'Live minnow', 'Shiner', 'Leech', 'Crickets', 'PowerBait', 'Salmon eggs', 'Corn',
    'Shrimp', 'Squid', 'Cut bait', 'Sardine', 'Anchovy', 'Crab'
  ];
  const WX_VARS = 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m';
  const WMO = {
    0: ['Clear', '☀️', '🌙'], 1: ['Mostly clear', '🌤', '🌙'], 2: ['Partly cloudy', '⛅', '☁️'], 3: ['Overcast', '☁️', '☁️'],
    45: ['Fog', '🌫'], 48: ['Freezing fog', '🌫'],
    51: ['Light drizzle', '🌦'], 53: ['Drizzle', '🌦'], 55: ['Heavy drizzle', '🌧'],
    56: ['Freezing drizzle', '🌧'], 57: ['Freezing drizzle', '🌧'],
    61: ['Light rain', '🌦'], 63: ['Rain', '🌧'], 65: ['Heavy rain', '🌧'],
    66: ['Freezing rain', '🌧'], 67: ['Freezing rain', '🌧'],
    71: ['Light snow', '🌨'], 73: ['Snow', '🌨'], 75: ['Heavy snow', '❄️'], 77: ['Snow grains', '🌨'],
    80: ['Light showers', '🌦'], 81: ['Showers', '🌧'], 82: ['Heavy showers', '⛈'],
    85: ['Snow showers', '🌨'], 86: ['Heavy snow showers', '❄️'],
    95: ['Thunderstorm', '⛈'], 96: ['Thunderstorm, hail', '⛈'], 99: ['Thunderstorm, hail', '⛈']
  };
  const COMPASS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];

  // ---------------------------------------------------------------- helpers
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
  const num = (v) => { if (v == null || v === '') return null; const n = parseFloat(String(v).replace(',', '.')); return Number.isFinite(n) ? n : null; };
  const round = (n, d = 0) => { const p = 10 ** d; return Math.round(n * p) / p; };
  const pad = (n) => String(n).padStart(2, '0');
  const toLocalInput = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const fmtDate = (ms) => new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: new Date(ms).getFullYear() === new Date().getFullYear() ? undefined : 'numeric' });
  const fmtTime = (ms) => new Date(ms).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  const fmtFull = (ms) => new Date(ms).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  const isTouch = matchMedia('(pointer: coarse)').matches;

  function store(key, val) { try { if (val === undefined) return localStorage.getItem(key); localStorage.setItem(key, val); } catch { return null; } }

  // ---------------------------------------------------------------- units
  const APP_VERSION = '2.4 (Nov 10, 2026)';
  const settings = { wtOz: store('tl.wtOz') === '1', units: store('tl.units') || (/^en-(US|LR|MM)/.test(navigator.language) ? 'imperial' : 'metric') };
  const imp = () => settings.units === 'imperial';
  const U = {
    temp: (c) => c == null ? '–' : imp() ? `${round(c * 9 / 5 + 32)}°F` : `${round(c)}°C`,
    wind: (k) => k == null ? '–' : imp() ? `${round(k * 0.621371)} mph` : `${round(k)} km/h`,
    precip: (mm) => mm == null ? '–' : imp() ? `${round(mm / 25.4, 2)} in` : `${round(mm, 1)} mm`,
    pressure: (h) => h == null ? '–' : imp() ? `${round(h * 0.0295300, 2)} inHg` : `${round(h)} hPa`,
    len: (cm) => cm == null ? null : imp() ? `${round(cm / 2.54, 1)} in` : `${round(cm, 1)} cm`,
    wt: (kg) => { if (kg == null) return null; if (!imp()) return `${round(kg, 2)} kg`; if (!settings.wtOz) return `${round(kg / 0.45359237, 2)} lb`;
      const totalOz = Math.round((kg / 0.45359237) * 16); const lb = Math.floor(totalOz / 16); const oz = totalOz % 16;
      return lb ? `${lb} lb${oz ? ` ${oz} oz` : ''}` : `${oz} oz`; },
    lenLabel: () => imp() ? '(in)' : '(cm)',
    wtLabel: () => imp() ? (settings.wtOz ? '(lb, oz)' : '(lb)') : '(kg)',
    lenIn: (v) => v == null ? null : imp() ? v * 2.54 : v,
    wtIn: (v) => v == null ? null : imp() ? v * 0.45359237 : v,
    lenOut: (cm) => cm == null ? '' : String(round(imp() ? cm / 2.54 : cm, 1)),
    wtOut: (kg) => kg == null ? '' : String(round(imp() ? kg / 0.45359237 : kg, 2)),
  };
  const compass = (deg) => deg == null ? '' : COMPASS[Math.round(deg / 22.5) % 16];
  const trendArrow = (t) => ({ rising: '↑', falling: '↓', steady: '→' }[t] || '');
  function wxLabel(w) { const m = WMO[w.code] || ['–', '🎣']; return { text: m[0], icon: (!w.isDay && m[2]) ? m[2] : m[1] }; }

  function moonPhase(ms) {
    const synodic = 29.530588853;
    const ref = Date.UTC(2000, 0, 6, 18, 14);
    let age = ((ms - ref) / 86400000) % synodic; if (age < 0) age += synodic;
    const names = [['New moon', '🌑'], ['Waxing crescent', '🌒'], ['First quarter', '🌓'], ['Waxing gibbous', '🌔'], ['Full moon', '🌕'], ['Waning gibbous', '🌖'], ['Last quarter', '🌗'], ['Waning crescent', '🌘']];
    const i = Math.floor(((age / synodic) * 8) + 0.5) % 8;
    const illum = round((1 - Math.cos(2 * Math.PI * age / synodic)) / 2 * 100);
    return { name: names[i][0], icon: names[i][1], illum, age, synodic };
  }

  // ---------------------------------------------------------------- database
  const DB = {
    _db: null,
    open() {
      if (this._db) return Promise.resolve(this._db);
      return new Promise((res, rej) => {
        const r = indexedDB.open('tightlines', 4);
        r.onupgradeneeded = () => {
          const db = r.result;
          if (!db.objectStoreNames.contains('catches')) db.createObjectStore('catches', { keyPath: 'id' }).createIndex('caughtAt', 'caughtAt');
          if (!db.objectStoreNames.contains('spots')) db.createObjectStore('spots', { keyPath: 'id' });
          if (!db.objectStoreNames.contains('trips')) db.createObjectStore('trips', { keyPath: 'id' });
          if (!db.objectStoreNames.contains('sessions')) db.createObjectStore('sessions', { keyPath: 'id' });
        };
        r.onsuccess = () => { const db = r.result; this._db = db; db.onversionchange = () => { db.close(); if (this._db === db) this._db = null; }; res(db); };
        r.onerror = () => rej(r.error);
      });
    },
    async tx(mode, fn, store = 'catches') {
      const db = await this.open();
      return new Promise((res, rej) => {
        const t = db.transaction(store, mode); const s = t.objectStore(store);
        let out; const req = fn(s); if (req) req.onsuccess = () => { out = req.result; };
        t.oncomplete = () => res(out); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error);
      });
    },
    all() { return this.tx('readonly', (s) => s.getAll()); },
    put(c) { return this.tx('readwrite', (s) => s.put(c)); },
    del(id) { return this.tx('readwrite', (s) => s.delete(id)); },
    allSpots() { return this.tx('readonly', (s) => s.getAll(), 'spots'); },
    putSpot(x) { return this.tx('readwrite', (s) => s.put(x), 'spots'); },
    delSpot(id) { return this.tx('readwrite', (s) => s.delete(id), 'spots'); },
    allTrips() { return this.tx('readonly', (s) => s.getAll(), 'trips'); },
    putTrip(x) { return this.tx('readwrite', (s) => s.put(x), 'trips'); },
    delTrip(id) { return this.tx('readwrite', (s) => s.delete(id), 'trips'); },
    allSessions() { return this.tx('readonly', (s) => s.getAll(), 'sessions'); },
    putSession(x) { return this.tx('readwrite', (s) => s.put(x), 'sessions'); },
    delSession(id) { return this.tx('readwrite', (s) => s.delete(id), 'sessions'); },
  };

  // ---------------------------------------------------------------- state
  let catches = [];
  // A catch can hold several identical fish ("How many fish?").
  const nFish = (c) => Math.max(1, Math.round((c && c.count) || 1));
  const fishIn = (list) => list.reduce((a, c) => a + nFish(c), 0);
  const weightOf = (x) => (x && typeof x === 'object' && !Array.isArray(x) ? nFish(x.c && x.c.species ? x.c : x) : 1);
  let spots = [];
  let sessions = [];
  const spotById = (id) => spots.find((x) => x.id === id) || null;

  // Distance in metres between two {lat, lon} points.
  function distM(a, b) {
    const R = 6371000; const r = Math.PI / 180;
    const dLat = (b.lat - a.lat) * r; const dLon = (b.lon - a.lon) * r;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }
  const fromYou = (d) => (d < 30 ? "You're here" : `${fmtDist(d)} from you`);
  function fmtDist(m) {
    if (m == null) return '';
    if (m < 15) return 'here';
    if (imp()) { const ft = m * 3.28084; return ft < 1000 ? `${Math.round(ft / 10) * 10} ft` : `${round(m / 1609.34, m < 16093 ? 1 : 0)} mi`; }
    return m < 1000 ? `${Math.round(m / 10) * 10} m` : `${round(m / 1000, m < 10000 ? 1 : 0)} km`;
  }
  // The closest saved spot whose radius contains this location.
  function matchSpot(loc) {
    if (!loc) return null;
    let best = null; let bestD = Infinity;
    spots.forEach((sp) => { const d = distM(loc, sp); if (d <= (sp.radiusM || 250) && d < bestD) { best = sp; bestD = d; } });
    return best ? { spot: best, d: bestD } : null;
  }
  let lastLoc = (() => { try { return JSON.parse(store('tl.lastLoc') || 'null'); } catch { return null; } })();
  function rememberLoc(L) { if (L && L.source === 'gps') { lastLoc = { lat: L.lat, lon: L.lon, at: Date.now() }; store('tl.lastLoc', JSON.stringify(lastLoc)); } }
  const thumbUrls = new Map();
  function thumbUrl(c) {
    const key = c.id + ':' + (c.updatedAt || c.createdAt);
    if (!c.thumb) return null;
    if (!thumbUrls.has(key)) {
      for (const k of thumbUrls.keys()) if (k.startsWith(c.id + ':')) { URL.revokeObjectURL(thumbUrls.get(k)); thumbUrls.delete(k); }
      thumbUrls.set(key, URL.createObjectURL(c.thumb));
    }
    return thumbUrls.get(key);
  }
  async function reload() {
    [catches, spots, trips, sessions] = await Promise.all([DB.all(), DB.allSpots(), DB.allTrips(), DB.allSessions()]);
    sessions.sort((a, b) => b.start - a.start);
    catches.sort((a, b) => b.caughtAt - a.caughtAt);
    spots.sort((a, b) => a.name.localeCompare(b.name));
    renderList(); renderSummary(); renderSpots(); updateBackupNudge(); if (map) renderMap();
    if ($('#view-stats').classList.contains('active')) renderStats();
    if (!$('#sheet-spot').hidden && spotDetailId) renderSpotDetail(spotDetailId);
    renderTrips(); updateTripNudge(); if (!$('#sheet-trip').hidden && tripDetailId) renderTrip(tripDetailId);
    renderNow(); paintSessionBar();
  }

  // ---------------------------------------------------------------- toast & confirm
  let toastTimer; let toastActionUntil = 0;
  // Background news ("Weather added…") never covers a message that has a button on it.
  function toastBg(msg) { if (Date.now() < toastActionUntil) return; toast(msg); }
  function toast(msg, action) {
    toastActionUntil = action ? Date.now() + 6000 : 0;
    const t = $('#toast'); $('#toast-text').textContent = msg; const btn = $('#toast-action');
    btn.hidden = !action; btn.onclick = null;
    if (action) { btn.textContent = action.label; btn.onclick = () => { t.classList.remove('show'); action.fn(); }; }
    t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), action ? 6000 : 2600);
  }
  function askConfirm(msg, yes = 'Delete') {
    return new Promise((resolve) => {
      const box = $('#confirm'); $('#confirm-msg').textContent = msg; $('#confirm-yes').textContent = yes; box.hidden = false;
      const done = (v) => { box.hidden = true; $('#confirm-yes').onclick = $('#confirm-no').onclick = null; resolve(v); };
      $('#confirm-yes').onclick = () => done(true); $('#confirm-no').onclick = () => done(false);
    });
  }

  // ---------------------------------------------------------------- sheets (with back-button support)
  const sheetStack = [];
  function openSheet(el) {
    el.hidden = false; el.style.zIndex = 50 + sheetStack.length; sheetStack.push(el); document.body.style.overflow = 'hidden';
    try { history.pushState({ sheet: el.id }, ''); } catch { /* ignore */ }
    const sc = $('.sheet-scroll', el); if (sc) sc.scrollTop = 0;
  }
  function hideTop() {
    const el = sheetStack.pop(); if (el) el.hidden = true;
    if (!sheetStack.length) document.body.style.overflow = '';
    return el;
  }
  function closeSheet() { if (!sheetStack.length) return; if (history.state && history.state.sheet) history.back(); else hideTop(); }
  window.addEventListener('popstate', () => { if (sheetStack.length) { const el = hideTop(); if (el && el.id === 'sheet-form') form.onClosed(); } });
  document.addEventListener('click', (e) => {
    const c = e.target.closest('[data-close]'); if (!c) return;
    if (c.closest('#sheet-form')) form.cancel(); else closeSheet();
  });
  $$('.sheet').forEach((s) => s.addEventListener('click', (e) => { if (e.target === s) { s.id === 'sheet-form' ? form.cancel() : closeSheet(); } }));

  // ---------------------------------------------------------------- list
  function renderSummary() {
    const el = $('#summary');
    if (!catches.length) { el.innerHTML = ''; return; }
    const count = (k) => { const m = new Map(); catches.forEach((c) => { const v = (c[k] || '').trim(); if (v) m.set(v, (m.get(v) || 0) + 1); }); return m; };
    const sp = count('species'); const bt = count('bait');
    const topBait = [...bt.entries()].sort((a, b) => b[1] - a[1])[0];
    el.innerHTML = `
      <div class="stat"><b>${fishIn(catches)}</b><span>Fish</span></div>
      <div class="stat"><b>${sp.size}</b><span>Species</span></div>
      <div class="stat"><b class="txt" title="${esc(topBait ? topBait[0] : '')}">${esc(topBait ? topBait[0] : '–')}</b><span>Top lure</span></div>`;
  }

  function weatherLine(w) {
    if (!w) return '';
    const l = wxLabel(w);
    return `${l.icon} ${U.temp(w.tempC)} · ${l.text} · ${U.wind(w.windKmh)} ${compass(w.windDir)} · ${U.pressure(w.pressure)} ${trendArrow(w.pressureTrend)}`;
  }

  function fillLogFilters() {
    const spSel = $('#lf-spot'); const sp = spSel.value; const fiSel = $('#lf-species'); const fi = fiSel.value;
    spSel.innerHTML = '<option value="">All spots</option>' + spots.map((x) => `<option value="${x.id}">${esc(x.name)}</option>`).join('') + (spots.length ? '<option value="__none">No spot</option>' : '');
    spSel.value = [...spSel.options].some((o) => o.value === sp) ? sp : '';
    const all = [...new Set(catches.map((c) => c.species))].sort((x, y) => x.localeCompare(y));
    fiSel.innerHTML = '<option value="">All species</option>' + all.map((v) => `<option value="${esc(v)}">${esc(v)}</option>`).join('');
    fiSel.value = all.includes(fi) ? fi : '';
  }
  function renderList() {
    const q = $('#search').value.trim().toLowerCase();
    const list = $('#catch-list');
    fillLogFilters();
    const when = $('#lf-when').value; const spF = $('#lf-spot').value; const fiF = $('#lf-species').value;
    const from = when === 'all' ? 0 : when === 'year' ? new Date(new Date().getFullYear(), 0, 1).getTime() : Date.now() - Number(when) * 86400000;
    const filtering = !!q || when !== 'all' || !!spF || !!fiF;
    const shown = catches.filter((c) => c.caughtAt >= from && (!fiF || c.species === fiF) &&
      (!spF || (spF === '__none' ? !(c.spotId && spotById(c.spotId)) : c.spotId === spF)) &&
      (!q || [c.species, c.bait, c.lureColor, c.notes, c.weather && wxLabel(c.weather).text, c.spotId && spotById(c.spotId) && spotById(c.spotId).name].join(' ').toLowerCase().includes(q)));
    $('#empty-log').hidden = catches.length > 0;
    $('#search').parentElement.hidden = catches.length < 2;
    $('#log-filters').hidden = catches.length < 2;
    // Catches grouped by day, with the trip they belong to.
    const days = new Map();
    shown.forEach((c) => { const k = dayStart(c.caughtAt); if (!days.has(k)) days.set(k, []); days.get(k).push(c); });
    const today = dayStart(Date.now());
    const dayLabel = (k) => k === today ? 'Today' : k === dayStart(today - 3600000) ? 'Yesterday' : new Date(k).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: new Date(k).getFullYear() === new Date().getFullYear() ? undefined : 'numeric' });
    list.innerHTML = [...days.entries()].map(([k, cs]) => {
      const trip = trips.find((t) => cs.some((c) => tripCatches(t).includes(c)));
      return `<li class="day-h"><span>${esc(dayLabel(k))}</span><span>${trip ? `Trip: ${esc(trip.name)} · ` : ''}${plural(fishIn(cs), 'fish')}</span></li>` + cs.map((c) => {
      const t = thumbUrl(c);
      const size = [U.len(c.lengthCm), U.wt(c.weightKg)].filter(Boolean).join(', ');
      return `<li><button class="catch" data-id="${c.id}">
        ${t ? `<img class="thumb" src="${t}" alt="">` : `<span class="thumb"><svg viewBox="0 0 32 32"><use href="#i-fish"/></svg></span>`}
        <span class="min-w">
          <h3>${esc(c.species)}${nFish(c) > 1 ? `<span class="count-badge">×${nFish(c)}</span>` : ''}</h3>
          <div class="meta">${esc(c.bait)}${c.lureColor ? ' · ' + esc(c.lureColor) : ''}${size ? ' · ' + esc(size) : ''}</div>
          <div class="meta">${fmtTime(c.caughtAt)}${c.spotId && spotById(c.spotId) ? ' · ' + esc(spotById(c.spotId).name) : ''}</div>
          <div class="wx">${c.weather ? esc(weatherLine(c.weather)) : (c.location ? 'Weather pending…' : 'No location')}</div>
        </span></button></li>`; }).join('');
    }).join('') || (filtering ? `<li class="help" style="text-align:center;padding:20px">No catches match${q ? ` “${esc(q)}”` : ''} these filters.</li>` : '');
  }

  $('#catch-list').addEventListener('click', (e) => { const b = e.target.closest('.catch'); if (b) showDetail(b.dataset.id); });
  $('#search').addEventListener('input', renderList);
  ['#lf-when', '#lf-spot', '#lf-species'].forEach((x) => $(x).addEventListener('change', renderList));

  // ---------------------------------------------------------------- location & weather
  function getPosition(maxAge = 5000) {
    return new Promise((res, rej) => {
      if (!('geolocation' in navigator)) return rej(new Error('This browser has no GPS access.'));
      navigator.geolocation.getCurrentPosition(
        (p) => res({ lat: p.coords.latitude, lon: p.coords.longitude, accuracy: p.coords.accuracy, source: 'gps', at: Date.now() }),
        (err) => rej(new Error(err.code === 1 ? 'Location permission is off. Allow it for this site, or enter coordinates by hand.' : err.code === 3 ? 'GPS timed out. Try again with a clearer view of the sky.' : 'Could not get a GPS fix.')),
        { enableHighAccuracy: true, timeout: 20000, maximumAge: maxAge }
      );
    });
  }

  function pickHourly(h, targetSec) {
    let best = 0; let bestD = Infinity;
    h.time.forEach((t, i) => { const d = Math.abs(t - targetSec); if (d < bestD && h.temperature_2m[i] != null) { bestD = d; best = i; } });
    return best;
  }
  function trendAt(h, i) {
    if (i < 3 || h.pressure_msl[i] == null || h.pressure_msl[i - 3] == null) return null;
    const d = h.pressure_msl[i] - h.pressure_msl[i - 3];
    return d > 1 ? 'rising' : d < -1 ? 'falling' : 'steady';
  }
  function fromBlock(b, i) {
    const g = (k) => (i == null ? b[k] : (b[k] || [])[i]) ?? null;
    return {
      tempC: g('temperature_2m'), feelsC: g('apparent_temperature'), humidity: g('relative_humidity_2m'),
      precipMm: g('precipitation'), code: g('weather_code'), isDay: g('is_day') == null ? true : !!g('is_day'), cloud: g('cloud_cover'),
      pressure: g('pressure_msl'), windKmh: g('wind_speed_10m'), windDir: g('wind_direction_10m'), gustKmh: g('wind_gusts_10m'),
    };
  }
  async function fetchWeather(lat, lon, whenMs) {
    const now = Date.now();
    const target = Math.min(whenMs, now);
    const ageH = (now - target) / 3.6e6;
    let url;
    if (ageH > 80 * 24) {
      const d = new Date(target); const day = (x) => x.toISOString().slice(0, 10);
      url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${day(new Date(target - 86400000))}&end_date=${day(d)}&hourly=${WX_VARS}&timeformat=unixtime&timezone=GMT`;
    } else {
      const past = Math.min(92, Math.max(1, Math.ceil(ageH / 24) + 1));
      url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=${WX_VARS}&hourly=${WX_VARS}&past_days=${past}&forecast_days=1&timeformat=unixtime&timezone=GMT`;
    }
    const r = await fetch(url);
    if (!r.ok) throw new Error('Weather service error ' + r.status);
    const j = await r.json();
    const i = pickHourly(j.hourly, target / 1000);
    let w;
    if (j.current && ageH < 1) w = { ...fromBlock(j.current), source: 'current', time: j.current.time * 1000 };
    else w = { ...fromBlock(j.hourly, i), source: 'hourly', time: j.hourly.time[i] * 1000 };
    w.pressureTrend = trendAt(j.hourly, i);
    w.fetchedAt = now;
    return w;
  }

  // Fill in weather for catches saved without it (e.g. logged with no signal).
  let backfilling = false;
  async function backfillWeather() {
    if (backfilling || !navigator.onLine) return; backfilling = true;
    let n = 0;
    try {
      for (const c of catches.filter((x) => x.location && !x.weather && (x.weatherTries || 0) < 6)) {
        try { c.weather = await fetchWeather(c.location.lat, c.location.lon, c.caughtAt); n++; }
        catch { c.weatherTries = (c.weatherTries || 0) + 1; }
        await DB.put(c);
      }
    } finally { backfilling = false; }
    if (n) { toastBg(`Weather added to ${n} catch${n > 1 ? 'es' : ''}`); reload(); }
  }
  window.addEventListener('online', backfillWeather);

  // ---------------------------------------------------------------- photos
  async function loadBitmap(file) {
    if ('createImageBitmap' in window) { try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch { /* fall back */ } }
    const url = URL.createObjectURL(file);
    try { const img = new Image(); img.src = url; await img.decode(); return img; } finally { setTimeout(() => URL.revokeObjectURL(url), 1000); }
  }
  function canvasBlob(cv, q) { return new Promise((res) => cv.toBlob(res, 'image/jpeg', q)); }
  async function processPhoto(file) {
    const bmp = await loadBitmap(file);
    const W = bmp.width; const H = bmp.height;
    const s = Math.min(1, 1600 / Math.max(W, H));
    const cv = document.createElement('canvas'); cv.width = Math.round(W * s); cv.height = Math.round(H * s);
    cv.getContext('2d').drawImage(bmp, 0, 0, cv.width, cv.height);
    const photo = await canvasBlob(cv, 0.82);
    const T = 240; const side = Math.min(W, H);
    const tc = document.createElement('canvas'); tc.width = tc.height = T;
    tc.getContext('2d').drawImage(bmp, (W - side) / 2, (H - side) / 2, side, side, 0, 0, T, T);
    const thumb = await canvasBlob(tc, 0.8);
    if (bmp.close) bmp.close();
    return { photo, thumb };
  }

  // Reads when and where a JPEG photo was taken (EXIF). Returns {} when the photo has neither.
  async function readExif(file) {
    try {
      if (!/jpe?g/i.test(file.type || '') && !/\.jpe?g$/i.test(file.name || '')) return {};
      const v = new DataView(await file.slice(0, 512 * 1024).arrayBuffer());
      if (v.getUint16(0) !== 0xFFD8) return {};
      let o = 2;
      while (o + 10 < v.byteLength) {
        const marker = v.getUint16(o); if ((marker & 0xFF00) !== 0xFF00 || marker === 0xFFDA) break;
        if (marker === 0xFFE1 && v.getUint32(o + 4) === 0x45786966) return parseTiff(v, o + 10);
        o += 2 + v.getUint16(o + 2);
      }
    } catch { /* unreadable: ignore */ }
    return {};
  }
  function parseTiff(v, t) {
    const le = v.getUint16(t) === 0x4949; const u16 = (p) => v.getUint16(p, le); const u32 = (p) => v.getUint32(p, le);
    const ifd = (off) => { const out = {}; const n = u16(t + off); for (let i = 0; i < n; i++) { const e = t + off + 2 + i * 12; out[u16(e)] = { count: u32(e + 4), at: e + 8 }; } return out; };
    const ascii = (tag) => { if (!tag) return null; const p = tag.count > 4 ? t + u32(tag.at) : tag.at; let str = ''; for (let i = 0; i < tag.count - 1; i++) str += String.fromCharCode(v.getUint8(p + i)); return str; };
    const rats = (tag) => { if (!tag) return null; const p = t + u32(tag.at); const a = []; for (let i = 0; i < tag.count; i++) { const den = u32(p + i * 8 + 4); a.push(den ? u32(p + i * 8) / den : 0); } return a; };
    const res = {}; const ifd0 = ifd(u32(t + 4));
    const ex = ifd0[0x8769] ? ifd(u32(ifd0[0x8769].at)) : {};
    const dt = ascii(ex[0x9003]) || ascii(ifd0[0x0132]); const off = ascii(ex[0x9011]);
    const m = dt && dt.match(/(\d{4}):(\d\d):(\d\d) (\d\d):(\d\d):(\d\d)/);
    if (m) { const ms = Date.parse(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}${off && /^[+-]\d\d:\d\d$/.test(off) ? off : ''}`); if (Number.isFinite(ms)) res.time = ms; }
    if (ifd0[0x8825]) {
      const g = ifd(u32(ifd0[0x8825].at)); const la = rats(g[2]); const lo = rats(g[4]);
      if (la && lo && la.length === 3 && lo.length === 3) {
        let lat = la[0] + la[1] / 60 + la[2] / 3600; let lon = lo[0] + lo[1] / 60 + lo[2] / 3600;
        if (ascii(g[1]) === 'S') lat = -lat; if (ascii(g[3]) === 'W') lon = -lon;
        if (Number.isFinite(lat) && Number.isFinite(lon) && (lat || lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) { res.lat = lat; res.lon = lon; }
      }
    }
    return res;
  }

  // ---------------------------------------------------------------- form
  const form = (() => {
    const el = $('#catch-form');
    let draft = null; let editing = null; let wxToken = 0; let previewUrl = null; let dirty = false;

    function topValues(key, defaults) {
      const m = new Map();
      catches.forEach((c, idx) => { const v = (c[key] || '').trim(); if (!v) return; const e = m.get(v) || { n: 0, recent: idx }; e.n++; e.recent = Math.min(e.recent, idx); m.set(v, e); });
      const used = [...m.entries()].sort((a, b) => b[1].n - a[1].n || a[1].recent - b[1].recent).map((x) => x[0]);
      const all = [...new Set([...used, ...defaults])];
      return { chips: used.slice(0, 6), all };
    }
    function fillChoices() {
      // Lure / bait: grouped dropdown, like the fish type. Lures you've logged that aren't listed get their own group.
      const b = topValues('bait', []);
      const myLures = b.all.filter((v) => !KNOWN_LURES.has(v)).sort((x, y) => x.localeCompare(y));
      const optL = (v) => `<option value="${esc(v)}">${esc(v)}</option>`;
      $('#f-bait-select').innerHTML = '<option value="" disabled>Choose a lure or bait…</option>' +
        (myLures.length ? `<optgroup label="Your other lures">${myLures.map(optL).join('')}</optgroup>` : '') +
        LURE_GROUPS.map(([label, list]) => `<optgroup label="${esc(label)}">${list.map(optL).join('')}</optgroup>`).join('') +
        `<optgroup label="Not listed"><option value="${OTHER}">Other – type it in…</option></optgroup>`;
      $('#bait-chips').innerHTML = b.chips.map((v) => `<button type="button" class="chip" data-bait="${esc(v)}">${esc(v)}</button>`).join('');
      setBait($('#f-bait').value.trim());
      // Species: grouped dropdown. Fish you've logged that aren't on the list get their own group.
      const sp = topValues('species', []);
      const mine = sp.all.filter((v) => !KNOWN_SPECIES.has(v)).sort((x, y) => x.localeCompare(y));
      const opt = (v) => `<option value="${esc(v)}">${esc(v)}</option>`;
      $('#f-species-select').innerHTML =
        '<option value="" disabled>Choose a fish…</option>' +
        (mine.length ? `<optgroup label="Your other species">${mine.map(opt).join('')}</optgroup>` : '') +
        SPECIES_GROUPS.map(([label, list]) => `<optgroup label="${esc(label)}">${list.map(opt).join('')}</optgroup>`).join('') +
        `<optgroup label="Not listed"><option value="${OTHER}">Other – type it in…</option></optgroup>`;
      $('#species-chips').innerHTML = sp.chips.map((v) => `<button type="button" class="chip" data-species="${esc(v)}">${esc(v)}</button>`).join('');
      setSpecies($('#f-species').value.trim());
    }
    // Keeps the dropdown, the "other" text box and the quick-pick chips in step.
    function setSpecies(v, fromOther) {
      const sel = $('#f-species-select'); const input = $('#f-species');
      const listed = v && [...sel.options].some((o) => o.value === v);
      if (!fromOther) {
        if (!v) { sel.value = ''; input.hidden = true; }
        else if (listed) { sel.value = v; input.hidden = true; }
        else { sel.value = OTHER; input.hidden = false; }
        input.value = v || '';
      }
      sel.classList.toggle('placeholder', !sel.value);
      sel.classList.remove('invalid'); input.classList.remove('invalid'); if (v || input.value.trim()) $('#err-species').hidden = true;
      $$('#species-chips .chip').forEach((x) => x.classList.toggle('on', x.dataset.species === input.value.trim()));
    }
    $('#f-species-select').addEventListener('change', (e) => {
      const v = e.target.value; dirty = true;
      if (v === OTHER) { $('#f-species').value = ''; $('#f-species').hidden = false; setSpecies('', true); $('#f-species').focus(); }
      else setSpecies(v);
    });
    $('#f-species').addEventListener('input', () => setSpecies($('#f-species').value, true));
    $('#species-chips').addEventListener('click', (e) => { const c = e.target.closest('.chip[data-species]'); if (c) { dirty = true; setSpecies(c.dataset.species); } });
    let lureAuto = false;   // colour/size were filled in for you (session lure, recent catch), not typed
    $('#f-lure-color').addEventListener('input', () => { lureAuto = false; }); $('#f-lure-size').addEventListener('input', () => { lureAuto = false; });
    function clearAutoLure() { if (lureAuto) { $('#f-lure-color').value = ''; $('#f-lure-size').value = ''; lureAuto = false; } }
    function setBait(v, fromOther) {
      const sel = $('#f-bait-select'); const input = $('#f-bait');
      const listed = v && [...sel.options].some((o) => o.value === v);
      if (!fromOther) {
        if (!v) { sel.value = ''; input.hidden = true; }
        else if (listed) { sel.value = v; input.hidden = true; }
        else { sel.value = OTHER; input.hidden = false; }
        input.value = v || '';
      }
      sel.classList.toggle('placeholder', !sel.value);
      sel.classList.remove('invalid'); input.classList.remove('invalid'); if (v || input.value.trim()) $('#err-bait').hidden = true;
      $$('#bait-chips .chip').forEach((x) => x.classList.toggle('on', x.dataset.bait === input.value.trim()));
    }
    $('#f-bait-select').addEventListener('change', (e) => {
      const v = e.target.value; dirty = true;
      if (v === OTHER) { $('#f-bait').value = ''; $('#f-bait').hidden = false; setBait('', true); $('#f-bait').focus(); }
      else { clearAutoLure(); setBait(v); }
    });
    $('#f-bait').addEventListener('input', () => setBait($('#f-bait').value, true));
    $('#bait-chips').addEventListener('click', (e) => { const c = e.target.closest('.chip[data-bait]'); if (c) { dirty = true; if (c.dataset.bait !== $('#f-bait').value.trim()) clearAutoLure(); setBait(c.dataset.bait); } });

    // How many fish
    let draftCount = 1;
    function paintCount() { $('#count-value').textContent = draftCount; $('#count-minus').disabled = draftCount <= 1; }
    $('#count-minus').addEventListener('click', () => { draftCount = Math.max(1, draftCount - 1); dirty = true; paintCount(); });
    $('#count-plus').addEventListener('click', () => { draftCount = Math.min(999, draftCount + 1); dirty = true; paintCount(); });
    el.addEventListener('input', () => { dirty = true; $('#form-error').textContent = ''; });
    // Errors appear next to the field and the form scrolls to it, so they're never off screen.
    function formError(msg, field) {
      $('#form-error').textContent = msg;
      const target = field || $('#form-error');
      try { target.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch { target.scrollIntoView(); }
      if (field) { try { field.focus({ preventScroll: true }); } catch { field.focus(); } }
      toast(msg);
    }

    // photos: several per catch. The first one is the cover.
    let photoUrls = [];
    function showPhoto() {
      photoUrls.forEach((u) => URL.revokeObjectURL(u)); photoUrls = [];
      const ph = draft.photos || [];
      $('#photo-add').hidden = ph.length > 0; $('#photo-strip').hidden = ph.length === 0 && !draft.photoBusy;
      $('#photo-strip').innerHTML = ph.map((p, i) => { const u = URL.createObjectURL(p.thumb || p.photo); photoUrls.push(u);
        return `<div class="ph"><img src="${u}" alt="Photo ${i + 1}" data-view="${i}"><button type="button" class="rm" data-rm-photo="${i}" aria-label="Remove photo ${i + 1}">×</button></div>`; }).join('') +
        (draft.photoBusy ? '<div class="ph busy"><span><span class="spin"></span><br>Processing…</span></div>' : '') +
        (ph.length ? '<button type="button" class="ph add" id="photo-more" aria-label="Add another photo">+</button>' : '');
    }
    $('#photo-add').addEventListener('click', () => $('#f-photo').click());
    $('#photo-strip').addEventListener('click', (e) => {
      if (e.target.closest('#photo-more')) { $('#f-photo').click(); return; }
      const rm = e.target.closest('[data-rm-photo]');
      if (rm) { draft.photos.splice(Number(rm.dataset.rmPhoto), 1); dirty = true; showPhoto(); if (!draft.photos.length) hidePhotoMeta(); return; }
      const v = e.target.closest('[data-view]'); if (v) openViewer(draft.photos.map((p) => p.photo), Number(v.dataset.view));
    });
    $('#f-photo').addEventListener('change', async (e) => {
      const files = [...e.target.files]; e.target.value = ''; if (!files.length) return;
      draft.photos = draft.photos || []; draft.photoBusy = true; showPhoto();
      let firstMeta = null;
      for (const f of files) {
        try { const meta = await readExif(f); draft.photos.push(await processPhoto(f)); dirty = true; if (!firstMeta && meta.time) firstMeta = meta; }
        catch { toast('Could not read that image'); }
      }
      draft.photoBusy = false; showPhoto(); if (firstMeta) offerPhotoMeta(firstMeta);
    });

    let draftReleased = null;
    function paintReleased() { $$('#seg-released button').forEach((b) => { const on = (b.dataset.rel === 'released' && draftReleased === true) || (b.dataset.rel === 'kept' && draftReleased === false); b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); }); }
    $('#seg-released').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return; dirty = true;
      const v = b.dataset.rel === 'released'; draftReleased = draftReleased === v ? null : v; paintReleased();
    });

    // A photo taken earlier: offer to use the time and place stored in it.
    let photoMeta = null;
    function hidePhotoMeta() { photoMeta = null; $('#photo-meta').hidden = true; }
    function offerPhotoMeta(meta) {
      hidePhotoMeta();
      if (!meta || !meta.time) return;
      const ref = editing ? caughtAtValue() : Date.now();
      if (Math.abs(ref - meta.time) < 15 * 60000 || meta.time > Date.now() + 60000) return;
      photoMeta = meta;
      const hasPlace = meta.lat != null;
      const m = hasPlace ? matchSpot({ lat: meta.lat, lon: meta.lon }) : null;
      $('#photo-meta-text').textContent = `This photo was taken ${fmtFull(meta.time)}${hasPlace ? (m ? ` at ${m.spot.name}` : ` at ${meta.lat.toFixed(4)}, ${meta.lon.toFixed(4)}`) : ''}.` +
        (hasPlace ? ' Use that time and place for this catch?' : " Use that time for this catch? The photo has no location, so the location stays as it is.");
      $('#photo-meta-use').textContent = hasPlace ? "Use photo's time and place" : "Use photo's time";
      $('#photo-meta').hidden = false;
    }
    $('#photo-meta-skip').addEventListener('click', hidePhotoMeta);
    $('#photo-meta-use').addEventListener('click', () => {
      const m = photoMeta; if (!m) return; dirty = true;
      $('#f-time').value = toLocalInput(new Date(m.time));
      if (m.lat != null) { draft.location = { lat: m.lat, lon: m.lon, accuracy: null, source: 'photo', at: Date.now() }; showLoc(); spotTouched = false; autoSpot(); }
      hidePhotoMeta(); loadConditions();
      toast(m.lat != null ? "Using the photo's time and place" : "Using the photo's time");
    });

    // spot picker: auto-matches the nearest saved spot until the angler picks one by hand
    const NEW_SPOT = '__new';
    let spotTouched = false;
    function fillSpots() {
      const L = draft.location; const sel = $('#f-spot');
      const list = spots.map((sp) => ({ sp, d: L ? distM(L, sp) : null })).sort((a, b) => (a.d ?? 0) - (b.d ?? 0) || a.sp.name.localeCompare(b.sp.name));
      sel.innerHTML = '<option value="">No spot</option>' +
        list.map(({ sp, d }) => `<option value="${sp.id}">${esc(sp.name)}${d != null ? ` – ${fmtDist(d)}` : ''}</option>`).join('') +
        `<option value="${NEW_SPOT}">+ New spot here…</option>`;
      sel.value = draft.spotId && spotById(draft.spotId) ? draft.spotId : (draft.newSpot ? NEW_SPOT : '');
      spotHint();
    }
    function autoSpot() {
      if (spotTouched) return fillSpots();
      const m = matchSpot(draft.location);
      draft.spotId = m ? m.spot.id : null; draft.autoMatched = !!m;
      fillSpots(); showTide();
    }
    function spotHint() {
      const v = $('#f-spot').value; const h = $('#spot-hint');
      $('#f-spot-name').hidden = v !== NEW_SPOT;
      if (v === NEW_SPOT) h.textContent = draft.location ? 'The spot is saved at this catch\'s location.' : 'A new spot needs a location. Use GPS or enter coordinates above.';
      else if (v && draft.autoMatched && !spotTouched) { const sp = spotById(v); const dd = distM(draft.location, sp); h.textContent = dd < 15 ? 'Matched automatically – you are at this spot.' : `Matched automatically – ${fmtDist(dd)} from the spot.`; }
      else if (!v && draft.location && spots.length) h.textContent = 'Not inside a saved spot.';
      else h.textContent = '';
      paintCondSummary();
    }
    $('#f-spot').addEventListener('change', (e) => {
      spotTouched = true; dirty = true; const v = e.target.value;
      draft.newSpot = v === NEW_SPOT; draft.spotId = v && v !== NEW_SPOT ? v : null;
      spotHint(); showTide(); if (draft.newSpot) $('#f-spot-name').focus();
    });

    // location & weather UI
    function showLoc(state, msg) {
      const L = draft.location;
      if (state === 'busy') { $('#loc-text').innerHTML = '<span class="spin"></span>Getting GPS fix…'; $('#loc-sub').textContent = ''; }
      else if (state === 'error') { $('#loc-text').textContent = 'No location'; $('#loc-sub').textContent = msg; }
      else if (L) {
        $('#loc-text').textContent = `${L.lat.toFixed(5)}, ${L.lon.toFixed(5)}`;
        $('#loc-sub').textContent = L.source === 'gps' ? `GPS · ±${Math.round(L.accuracy)} m` : L.source === 'photo' ? 'From the photo' : L.source === 'last' ? 'Last GPS fix (quick catch)' : 'Entered by hand';
        $('#f-lat').value = L.lat.toFixed(6); $('#f-lon').value = L.lon.toFixed(6);
      } else { $('#loc-text').textContent = 'No location'; $('#loc-sub').textContent = ''; }
      $('#btn-locate').disabled = state === 'busy';
      locState = state || null; if (state === 'error') setCondOpen(true); paintCondSummary();
    }
    function showWx(state, msg) {
      const w = draft.weather;
      $('#btn-weather').hidden = state !== 'error';
      if (state === 'busy') { $('#wx-text').innerHTML = '<span class="spin"></span>Fetching weather…'; $('#wx-sub').textContent = ''; }
      else if (state === 'error') { $('#wx-text').textContent = 'Weather unavailable'; $('#wx-sub').textContent = msg || 'No connection? It will be added automatically once you are back online.'; }
      else if (w) {
        const l = wxLabel(w);
        $('#wx-text').textContent = `${l.icon} ${U.temp(w.tempC)} · ${l.text}`;
        $('#wx-sub').textContent = `Wind ${U.wind(w.windKmh)} ${compass(w.windDir)} · ${U.pressure(w.pressure)} ${trendArrow(w.pressureTrend)} · ${w.humidity}% humidity`;
      } else { $('#wx-text').textContent = draft.location ? 'No weather yet' : 'Waiting for location…'; $('#wx-sub').textContent = ''; }
      wxState = state || null; paintCondSummary();
    }
    // One-line summary of location, weather and tide. Tap it to see and change the details.
    let locState = null; let wxState = null;
    function setCondOpen(open) { $('#cond-panel').hidden = !open; $('#cond-summary').setAttribute('aria-expanded', String(open)); $('#cond-sum-more').textContent = open ? 'Hide' : 'Details'; }
    function paintCondSummary() {
      if (!draft) return;
      const L = draft.location; const parts = [];
      if (locState === 'busy') parts.push('<span class="spin"></span>Getting GPS fix…');
      else if (!L) parts.push('<span class="warn">📍 No location – tap to fix</span>');
      else { const sp = draft.spotId && spotById(draft.spotId); parts.push(`📍 ${esc(sp ? sp.name : L.source === 'gps' ? `GPS ±${Math.round(L.accuracy)} m` : L.source === 'photo' ? 'From the photo' : `${L.lat.toFixed(3)}, ${L.lon.toFixed(3)}`)}`); }
      const w = draft.weather;
      if (wxState === 'busy') parts.push('<span class="spin"></span>weather…');
      else if (w) { const l = wxLabel(w); parts.push(`${l.icon} ${esc(U.temp(w.tempC))}`); }
      else if (wxState === 'error') parts.push('weather later');
      const t = draft.tide;
      if (t && tideShown({ tide: t }, formWater())) parts.push(`${t.rising ? '↑' : '↓'} ${esc(t.stage.toLowerCase())} tide`);
      else if (!t && draft.tideStatus === 'busy') parts.push('tide…');
      $('#cond-sum-text').innerHTML = parts.join(' · ');
    }
    $('#cond-summary').addEventListener('click', () => setCondOpen($('#cond-panel').hidden));

    // "Same as a recent catch": one tap fills the fish, lure, colour and size.
    let combos = [];
    function fillCombos() {
      combos = editing ? [] : quickCombos();
      $('#combo-field').hidden = !combos.length;
      $('#combo-chips').innerHTML = combos.map((c, i) => `<button type="button" class="chip" data-combo="${i}">${esc(c.species)} · ${esc(c.bait)}</button>`).join('');
    }
    function paintCombos() {
      const sp = $('#f-species').value.trim(); const b = $('#f-bait').value.trim();
      $$('#combo-chips .chip').forEach((x) => { const c = combos[Number(x.dataset.combo)]; x.classList.toggle('on', !!c && c.species === sp && c.bait === b); });
    }
    $('#combo-chips').addEventListener('click', (e) => {
      const x = e.target.closest('[data-combo]'); if (!x) return; const c = combos[Number(x.dataset.combo)]; if (!c) return;
      dirty = true; setSpecies(c.species); setBait(c.bait); $('#f-lure-color').value = c.lureColor || ''; $('#f-lure-size').value = c.lureSize || ''; lureAuto = true; paintCombos();
    });
    el.addEventListener('change', paintCombos); el.addEventListener('click', (e) => { if (e.target.closest('.chip[data-species], .chip[data-bait]')) paintCombos(); });

    // Tide: looked up quietly; the row only appears when tides apply to this place.
    let tideToken = 0;
    function formWater() { if (draft.newSpot) return 'auto'; const sp = draft.spotId && spotById(draft.spotId); return sp ? (sp.water || 'auto') : 'auto'; }
    function showTide() {
      const t = draft.tide; const rowEl = $('#tide-row');
      paintCondSummary();
      if (!t && draft.tideStatus) { rowEl.hidden = false; $('#tide-text').innerHTML = `<span class="tide-status">${draft.tideStatus === 'busy' ? '<span class="spin"></span>Looking up tide…' : "Tide will be added when you're online"}</span>`; $('#tide-sub').textContent = ''; return; }
      if (!t || !tideShown({ tide: t }, formWater())) { rowEl.hidden = true; return; }
      rowEl.hidden = false;
      $('#tide-text').textContent = `${t.rising ? '↑' : '↓'} ${t.stage} · ${tideH(t.heightM)}`;
      $('#tide-sub').textContent = [tideSince(t, caughtAtValue()), t.coef != null ? `coefficient ${t.coef} (${coefShort(t.coef)})` : null, waveText(draft.marine), t.stationName].filter(Boolean).join(' · ');
    }
    // Without any network, the saved NOAA station list still tells us whether this place is coastal.
    function likelyTidal() {
      const w = formWater(); if (w === 'fresh') return false; if (w === 'salt') return true;
      let list = stationsMem; if (!list) { try { const c = JSON.parse(store('tl.noaaStations') || 'null'); list = c && c.list; } catch { list = null; } }
      if (!list || !list.length) return null;
      const st = nearestStations(list, draft.location, 1)[0]; return !!st && st.d <= TIDE_NEAR;
    }
    async function loadTide() {
      const token = ++tideToken; draft.tide = undefined; draft.tideStatus = null; draft.marine = undefined;
      if (!draft.location) { showTide(); return; }
      const near = likelyTidal(); if (near) draft.tideStatus = 'busy'; showTide();
      try {
        const t = await tideFor(draft.location, caughtAtValue()); if (token !== tideToken) return;
        draft.tide = t; draft.tideStatus = null; draft.marine = undefined; showTide();
        if (tideShown({ tide: t }, formWater())) { try { const m = await marineFor(draft.location, caughtAtValue()); if (token === tideToken) { draft.marine = m; showTide(); } } catch { /* added later */ } }
      }
      catch { if (token === tideToken) { draft.tideStatus = near ? 'offline' : null; showTide(); } }
    }
    function loadConditions() { loadWeather(); loadTide(); }

    async function locate() {
      showLoc('busy');
      try { draft.location = await getPosition(); rememberLoc(draft.location); showLoc(); spotTouched = false; autoSpot(); loadConditions(); }
      catch (err) { showLoc('error', err.message); if (!draft.location) showWx(); }
    }
    async function loadWeather() {
      if (!draft.location) return showWx();
      const token = ++wxToken; showWx('busy');
      try {
        const w = await fetchWeather(draft.location.lat, draft.location.lon, caughtAtValue());
        if (token !== wxToken) return; draft.weather = w; showWx();
      } catch {
        if (token !== wxToken) return; draft.weather = null; showWx('error');
      }
    }
    // Untouched "now" keeps its seconds, so lure switches in a session line up with the catch.
    function caughtAtValue() { const v = $('#f-time').value; if (draft && draft.openedAt && v === draft.timeInit) return draft.openedAt; const d = v ? new Date(v) : new Date(); return Number.isNaN(d.getTime()) ? Date.now() : d.getTime(); }
    $('#btn-locate').addEventListener('click', locate);
    $('#btn-weather').addEventListener('click', loadWeather);
    $('#btn-manual-loc').addEventListener('click', () => {
      const lat = num($('#f-lat').value); const lon = num($('#f-lon').value);
      if (lat == null || lon == null || Math.abs(lat) > 90 || Math.abs(lon) > 180) { toast('Enter a valid latitude and longitude'); return; }
      draft.location = { lat, lon, accuracy: null, source: 'manual', at: Date.now() }; dirty = true;
      showLoc(); spotTouched = false; autoSpot(); loadConditions(); $('.manual-loc').open = false;
    });
    $('#f-time').addEventListener('change', () => { if (draft.location) loadConditions(); });

    function open(c, pre) {
      editing = c || null; dirty = false; wxToken++;
      const photos = c ? [c.photo ? { photo: c.photo, thumb: c.thumb } : null, ...(c.extraPhotos || [])].filter((p) => p && p.photo) : [];
      draft = c ? { photos, location: c.location, weather: c.weather, tide: c.tide, marine: c.marine, spotId: c.spotId || null } : { photos: [], location: null, weather: null, tide: undefined, spotId: (pre && pre.spotId) || null };
      tideToken++;
      spotTouched = !!c || !!(pre && pre.spotId); draft.autoMatched = false; draft.newSpot = false;
      el.reset(); $('#form-error').textContent = ''; $$('.invalid', el).forEach((x) => x.classList.remove('invalid'));
      $('#form-title').textContent = c ? 'Edit catch' : 'New catch';
      $$('.unit[data-unit=len]').forEach((x) => { x.textContent = U.lenLabel(); });
      $$('.unit[data-unit=wt]').forEach((x) => { x.textContent = U.wtLabel(); });
      const live = !c && activeSession(); const cl = live && curLure(live);
      const src = c || pre || (cl ? { bait: cl.bait, lureColor: cl.color, lureSize: cl.size } : {});
      locState = null; wxState = null; setCondOpen(false);
      $('#btn-save-catch').textContent = c ? 'Save changes' : 'Save catch';
      $('#f-species').value = src.species || '';
      $('#f-bait').value = src.bait || '';
      $('#f-lure-color').value = src.lureColor || ''; $('#f-lure-size').value = src.lureSize || ''; lureAuto = !c;
      draftCount = c ? nFish(c) : 1; paintCount();
      $('#f-time').value = toLocalInput(new Date(c ? c.caughtAt : Date.now()));
      draft.openedAt = c ? c.caughtAt : Date.now(); draft.timeInit = $('#f-time').value;
      $('#f-length').value = c ? U.lenOut(c.lengthCm) : '';
      const ozMode = imp() && settings.wtOz; $('#f-weight-oz').hidden = !ozMode; $('#weight-row').classList.toggle('oz', ozMode);
      $('#f-weight').placeholder = ozMode ? 'lb' : 'Optional';
      if (c && c.weightKg != null && ozMode) { const t = Math.round((c.weightKg / 0.45359237) * 16); $('#f-weight').value = String(Math.floor(t / 16)); $('#f-weight-oz').value = String(t % 16); }
      else { $('#f-weight').value = c ? U.wtOut(c.weightKg) : ''; $('#f-weight-oz').value = ''; }
      draftReleased = c ? (c.released === true ? true : c.released === false ? false : null) : pre && pre.released != null ? pre.released : ({ released: true, kept: false }[store('tl.lastReleased')] ?? null);
      paintReleased();
      $('#err-species').hidden = true; $('#err-bait').hidden = true; hidePhotoMeta();
      $('#f-notes').value = c ? c.notes || '' : '';
      $('#f-lat').value = ''; $('#f-lon').value = ''; $('.manual-loc').open = false;
      $('#f-spot-name').value = '';
      fillChoices(); fillCombos(); showPhoto(); showLoc(); showWx(); fillSpots(); showTide(); paintCombos();
      openSheet($('#sheet-form'));
      if (!c) locate();
      else { if (c.location && !c.weather) loadWeather(); if (c.location && c.tide === undefined) loadTide(); }
    }
    async function cancel() {
      if (dirty && !(await askConfirm(editing ? 'Discard your changes?' : 'Discard this catch?', 'Discard'))) return;
      closeSheet();
    }
    function onClosed() { wxToken++; photoUrls.forEach((u) => URL.revokeObjectURL(u)); photoUrls = []; }

    el.addEventListener('submit', async (e) => {
      e.preventDefault();
      const species = $('#f-species').value.trim(); const bait = $('#f-bait').value.trim();
      ($('#f-species').hidden ? $('#f-species-select') : $('#f-species')).classList.toggle('invalid', !species); ($('#f-bait').hidden ? $('#f-bait-select') : $('#f-bait')).classList.toggle('invalid', !bait);
      $('#err-species').hidden = !!species; $('#err-bait').hidden = !!bait;
      if (!species || !bait) {
        const missing = [!species && 'the fish type', !bait && 'the lure or bait'].filter(Boolean).join(' and ');
        formError(`Add ${missing} to save.`, !species ? ($('#f-species').hidden ? $('#f-species-select') : $('#f-species')) : ($('#f-bait').hidden ? $('#f-bait-select') : $('#f-bait')));
        return;
      }
      let spotId = draft.newSpot ? null : (draft.spotId || null);
      let createdSpot = null;
      if (draft.newSpot) {
        const name = $('#f-spot-name').value.trim();
        if (!draft.location) { formError('A new spot needs a location. Use GPS or enter coordinates.', $('#btn-locate')); return; }
        if (!name) { $('#f-spot-name').classList.add('invalid'); formError('Give the new spot a name.', $('#f-spot-name')); return; }
        createdSpot = { id: uid(), name, lat: draft.location.lat, lon: draft.location.lon, radiusM: 250, notes: '', createdAt: Date.now(), updatedAt: Date.now() };
        spotId = createdSpot.id;
      }
      const now = Date.now();
      const rec = {
        ...(editing || { id: uid(), createdAt: now }),
        updatedAt: now,
        caughtAt: caughtAtValue(),
        species, bait,
        lengthCm: U.lenIn(num($('#f-length').value)),
        weightKg: (() => { const lb = num($('#f-weight').value); const oz = $('#f-weight-oz').hidden ? null : num($('#f-weight-oz').value);
          if (lb == null && oz == null) return null; return oz == null ? U.wtIn(lb) : ((lb || 0) + oz / 16) * 0.45359237; })(),
        released: draftReleased,
        notes: $('#f-notes').value.trim(),
        photo: draft.photos[0] ? draft.photos[0].photo : null, thumb: draft.photos[0] ? draft.photos[0].thumb : null,
        extraPhotos: draft.photos.slice(1),
        count: draftCount,
        lureColor: $('#f-lure-color').value.trim(), lureSize: $('#f-lure-size').value.trim(),
        location: draft.location || null,
        weather: draft.weather || null,
        weatherTries: 0,
        tide: draft.tide,
        marine: draft.marine,
        tideTries: 0,
        spotId,
      };
      const ses = !editing && sessionFor(rec.caughtAt);
      if (ses) rec.sessionId = ses.id;
      try {
        if (createdSpot) { await DB.putSpot(createdSpot); spots.push(createdSpot); await linkCatchesToSpot(createdSpot); }
        await DB.put(rec);
      } catch (err) { formError('Could not save: ' + ((err && err.message) || 'storage error')); return; }
      store('tl.lastReleased', draftReleased === true ? 'released' : draftReleased === false ? 'kept' : '');
      if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
      if (ses) await sessionCaught(ses, rec);
      const wasEditing = !!editing; dirty = false;
      closeSheet();
      await reload();
      if (wasEditing) toast('Catch updated');
      else toast(`${draftCount > 1 ? draftCount + ' × ' : ''}${species} logged 🎣`, { label: 'Log another', fn: () => open(null, sameAs(rec)) });
      if (wasEditing && !$('#sheet-detail').hidden) renderDetail(rec.id);
    });

    return { open, cancel, onClosed };
  })();
  // What "Log another" and "Same again" carry over to the next catch.
  const sameAs = (c) => ({ species: c.species, bait: c.bait, lureColor: c.lureColor, lureSize: c.lureSize, spotId: c.spotId && spotById(c.spotId) ? c.spotId : null, released: c.released });

  $('#btn-new').addEventListener('click', () => form.open());

  // ---------------------------------------------------------------- full-screen photo viewer
  const viewer = { blobs: [], i: 0, url: null };
  function showViewerPhoto() {
    if (viewer.url) URL.revokeObjectURL(viewer.url);
    viewer.url = URL.createObjectURL(viewer.blobs[viewer.i]); $('#viewer-img').src = viewer.url;
    const many = viewer.blobs.length > 1; $('#viewer-prev').hidden = $('#viewer-next').hidden = !many;
    $('#viewer-count').textContent = many ? `${viewer.i + 1} of ${viewer.blobs.length}` : '';
  }
  function openViewer(blobs, i = 0) { if (!blobs.length) return; viewer.blobs = blobs; viewer.i = Math.min(i, blobs.length - 1); showViewerPhoto(); $('#viewer').hidden = false; }
  function closeViewer() { $('#viewer').hidden = true; if (viewer.url) { URL.revokeObjectURL(viewer.url); viewer.url = null; } }
  const stepViewer = (d) => { viewer.i = (viewer.i + d + viewer.blobs.length) % viewer.blobs.length; showViewerPhoto(); };
  $('#viewer-close').addEventListener('click', closeViewer);
  $('#viewer-prev').addEventListener('click', () => stepViewer(-1));
  $('#viewer-next').addEventListener('click', () => stepViewer(1));
  $('#viewer').addEventListener('click', (e) => { if (e.target.id === 'viewer') closeViewer(); });
  document.addEventListener('keydown', (e) => { if ($('#viewer').hidden) return; if (e.key === 'Escape') closeViewer(); if (e.key === 'ArrowLeft') stepViewer(-1); if (e.key === 'ArrowRight') stepViewer(1); });
  let swipeX = null;
  $('#viewer').addEventListener('pointerdown', (e) => { swipeX = e.clientX; });
  $('#viewer').addEventListener('pointerup', (e) => { if (swipeX != null && Math.abs(e.clientX - swipeX) > 50 && viewer.blobs.length > 1) stepViewer(e.clientX < swipeX ? 1 : -1); swipeX = null; });

  // ---------------------------------------------------------------- detail
  let detailId = null; let detailUrl = null; let detailThumbs = [];
  function mapsLink(L) {
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    return ios ? `https://maps.apple.com/?ll=${L.lat},${L.lon}&q=Catch` : `https://www.google.com/maps/search/?api=1&query=${L.lat},${L.lon}`;
  }
  function row(k, v) { return v == null || v === '' ? '' : `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`; }
  function renderDetail(id) {
    const c = catches.find((x) => x.id === id); if (!c) return closeSheet();
    detailId = id;
    if (detailUrl) URL.revokeObjectURL(detailUrl); detailUrl = c.photo ? URL.createObjectURL(c.photo) : null;
    detailThumbs.forEach((u) => URL.revokeObjectURL(u)); detailThumbs = [];
    const allPhotos = [c.photo, ...(c.extraPhotos || []).map((p) => p.photo)].filter(Boolean);
    const thumbsHtml = allPhotos.length > 1 ? `<div class="detail-thumbs">${[c.thumb || c.photo, ...(c.extraPhotos || []).map((p) => p.thumb || p.photo)].map((b, i) => { const u = URL.createObjectURL(b); detailThumbs.push(u); return `<button type="button" data-view-photo="${i}" aria-label="Photo ${i + 1}"><img src="${u}" alt=""></button>`; }).join('')}</div>` : '';
    const w = c.weather; const L = c.location; const moon = moonPhase(c.caughtAt);
    const wl = w && wxLabel(w);
    $('#detail-title').textContent = fmtDate(c.caughtAt);
    $('#detail-body').innerHTML = `
      ${detailUrl ? `<img class="detail-photo" src="${detailUrl}" alt="Photo of ${esc(c.species)} – tap to enlarge" data-view-photo="0">` : ''}
      ${thumbsHtml}
      <h3 class="detail-title">${nFish(c) > 1 ? `${nFish(c)} × ` : ''}${esc(c.species)}</h3>
      <p class="detail-sub">${esc(fmtFull(c.caughtAt))}${c.released === true ? ' · Released' : c.released === false ? ' · Kept' : ''}</p>
      <div class="kv"><h4>Catch</h4><dl>
        ${row('Lure / bait', c.bait)}${row('Colour', c.lureColor)}${row('Size', c.lureSize)}${nFish(c) > 1 ? row('Number of fish', String(nFish(c))) : ''}${row('Length', U.len(c.lengthCm))}${row('Weight', U.wt(c.weightKg))}${row('Released', c.released === true ? 'Yes' : c.released === false ? 'No – kept' : null)}
      </dl></div>
      <div class="kv"><h4>Conditions</h4><dl>
        ${w ? `${row('Weather', `${wl.icon} ${wl.text}`)}${row('Air temp', U.temp(w.tempC))}${row('Feels like', U.temp(w.feelsC))}
          ${row('Wind', `${U.wind(w.windKmh)} ${compass(w.windDir)}`)}${row('Gusts', U.wind(w.gustKmh))}
          ${row('Pressure', `${U.pressure(w.pressure)}${w.pressureTrend ? ` ${trendArrow(w.pressureTrend)} ${w.pressureTrend}` : ''}`)}
          ${row('Humidity', w.humidity != null ? w.humidity + '%' : null)}${row('Cloud cover', w.cloud != null ? w.cloud + '%' : null)}${row('Precipitation', U.precip(w.precipMm))}`
          : row('Weather', L ? 'Pending – needs a connection' : 'Not recorded')}
        ${row('Moon', `${moon.icon} ${moon.name} (${moon.illum}%)`)}
      </dl></div>
      ${tideShown(c) ? `<div class="kv"><h4>Tide</h4><dl>
        ${row('Stage', `${c.tide.rising ? '↑' : '↓'} ${c.tide.stage}`)}${row('Height', tideH(c.tide.heightM))}
        ${row(`Since last ${c.tide.lastType === 'H' ? 'high' : 'low'}`, durText(c.caughtAt - c.tide.lastT))}
        ${row(`Next ${c.tide.nextType === 'H' ? 'high' : 'low'}`, `${fmtTime(c.tide.nextT)} (in ${durText(c.tide.nextT - c.caughtAt)})`)}
        ${row('Tidal coefficient', c.tide.coef != null ? `${c.tide.coef} – ${coefShort(c.tide.coef)}` : null)}
        ${c.marine && !c.marine.none && c.marine.seaTempC != null ? row('Water temp', U.temp(c.marine.seaTempC)) : ''}
        ${c.marine && !c.marine.none && c.marine.waveM != null ? row('Waves', `${imp() ? `${round(c.marine.waveM * 3.28084, 1)} ft` : `${round(c.marine.waveM, 1)} m`}${c.marine.periodS != null ? `, ${round(c.marine.periodS)} s apart` : ''}${c.marine.waveDir != null ? ` from ${compass(c.marine.waveDir)}` : ''}`) : ''}
        <dt>Station</dt><dd><a href="https://tidesandcurrents.noaa.gov/noaatidepredictions.html?id=${encodeURIComponent(c.tide.stationId)}" target="_blank" rel="noopener">${esc(c.tide.stationName)}</a></dd>
      </dl></div>` : ''}
      <div class="kv"><h4>Location</h4><dl>
        ${c.spotId && spotById(c.spotId) ? `<dt>Spot</dt><dd><button type="button" class="link-btn" data-spot="${c.spotId}">${esc(spotById(c.spotId).name)}</button></dd>` : ''}
        ${L ? `${row('Latitude', L.lat.toFixed(5))}${row('Longitude', L.lon.toFixed(5))}${row('Accuracy', L.accuracy != null ? `±${Math.round(L.accuracy)} m` : L.source === 'photo' ? 'From the photo' : L.source === 'last' ? 'Last GPS fix' : 'Entered by hand')}` : row('Location', 'Not recorded')}
      </dl></div>
      ${c.notes ? `<div class="kv"><h4>Notes</h4><p>${esc(c.notes)}</p></div>` : ''}
      <div class="detail-actions">
        ${L ? `<a class="btn primary" href="${mapsLink(L)}" target="_blank" rel="noopener">Open spot in Maps</a>` : ''}
        ${L && !(c.spotId && spotById(c.spotId)) ? '<button type="button" class="btn" id="btn-make-spot">Save this location as a spot</button>' : ''}
        <button type="button" class="btn" id="btn-same">Same again – log another like this</button>
        ${navigator.share ? '<button type="button" class="btn" id="btn-share">Share catch</button>' : ''}
        <button type="button" class="btn danger" id="btn-delete">Delete catch</button>
      </div>`;
  }
  function showDetail(id) { renderDetail(id); openSheet($('#sheet-detail')); }
  $('#btn-edit').addEventListener('click', () => { const c = catches.find((x) => x.id === detailId); if (c) form.open(c); });
  $('#detail-body').addEventListener('click', async (e) => {
    const c = catches.find((x) => x.id === detailId); if (!c) return;
    const sl = e.target.closest('[data-spot]'); if (sl) { showSpot(sl.dataset.spot); return; }
    const vp = e.target.closest('[data-view-photo]');
    if (vp) { openViewer([c.photo, ...(c.extraPhotos || []).map((p) => p.photo)].filter(Boolean), Number(vp.dataset.viewPhoto)); return; }
    if (e.target.id === 'btn-same') { form.open(null, sameAs(c)); return; }
    if (e.target.id === 'btn-make-spot') { spotForm.open(null, { location: c.location, linkCatchId: c.id }); return; }
    if (e.target.id === 'btn-delete') {
      if (!(await askConfirm(`Delete this ${c.species}?`))) return;
      await DB.del(c.id); closeSheet(); await reload();
      toast('Catch deleted', { label: 'Undo', fn: async () => { await DB.put(c); await reload(); toast('Catch restored'); } });
    }
    if (e.target.id === 'btn-share') {
      const parts = [`${c.species} on ${c.bait}`, fmtFull(c.caughtAt)];
      const size = [U.len(c.lengthCm), U.wt(c.weightKg)].filter(Boolean).join(', '); if (size) parts.push(size);
      if (c.weather) parts.push(weatherLine(c.weather));
      const data = { title: c.species, text: parts.join('\n') };
      if (c.photo) { const f = new File([c.photo], 'catch.jpg', { type: 'image/jpeg' }); if (navigator.canShare && navigator.canShare({ files: [f] })) data.files = [f]; }
      try { await navigator.share(data); } catch { /* cancelled */ }
    }
  });


  // ---------------------------------------------------------------- spots
  const RADII = [100, 250, 500, 1000, 2000];
  let spotsMode = store('tl.spotsMode') === 'map' ? 'map' : 'list';
  let spotDetailId = null;

  // Link catches that have no spot yet and fall inside this spot's radius.
  async function linkCatchesToSpot(sp, extraId) {
    let n = 0;
    for (const c of catches) {
      const inside = c.location && distM(c.location, sp) <= sp.radiusM;
      if ((c.id === extraId) || (!c.spotId && inside) || (c.spotId && !spotById(c.spotId) && inside)) { c.spotId = sp.id; await DB.put(c); n++; }
    }
    return n;
  }
  function spotCatches(id) { return catches.filter((c) => c.spotId === id); }

  function setSpotsMode(m) {
    spotsMode = m; store('tl.spotsMode', m);
    $$('#seg-spots button').forEach((b) => b.classList.toggle('on', b.dataset.mode === m));
    $('#spots-list').hidden = m !== 'list'; $('#map-wrap').hidden = m !== 'map';
    if (m === 'map' && $('#view-spots').classList.contains('active')) showMap();
  }
  $('#seg-spots').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) setSpotsMode(b.dataset.mode); });

  function renderSpots() {
    const el = $('#spots-list');
    const unassigned = catches.filter((c) => !(c.spotId && spotById(c.spotId))).length;
    if (!spots.length) {
      el.innerHTML = `<div class="empty"><svg viewBox="0 0 24 24" aria-hidden="true" style="color:var(--lake-2)"><use href="#i-pin"/></svg>
        <h2>No spots yet</h2><p>Save the places you fish, such as a dock, a point or a stretch of river. Catches made there are linked automatically, and each spot gets its own stats and notes.</p>
        <p>Tap <strong>+ New spot</strong>, or choose <strong>New spot here</strong> when you log a catch.</p></div>`;
      return;
    }
    const rows = spots.map((sp) => {
      const list = spotCatches(sp.id);
      const last = list[0];
      const topSp = ranked(countBy(list, (c) => c.species))[0];
      const topLure = ranked(countBy(list, (c) => c.bait))[0];
      const d = lastLoc ? distM(lastLoc, sp) : null;
      return { sp, list, last, topSp, topLure, d };
    }).sort((a, b) => (b.last ? b.last.caughtAt : 0) - (a.last ? a.last.caughtAt : 0) || a.sp.name.localeCompare(b.sp.name));
    el.innerHTML = rows.map(({ sp, list, last, topSp, topLure, d }) => `
      <button type="button" class="spot-card" data-spot="${sp.id}">
        <span class="pin"><svg viewBox="0 0 24 24"><use href="#i-pin"/></svg></span>
        <span style="min-width:0">
          <h3>${esc(sp.name)}</h3>
          <div class="meta">${last ? `Last catch ${fmtDate(last.caughtAt)}` : 'No catches yet'}${d != null ? (d < 30 ? ' · You are here' : ` · ${fmtDist(d)} away`) : ''}</div>
          ${topSp ? `<div class="meta">${esc(topSp[0])} · ${esc(topLure[0])}</div>` : ''}
        </span>
        <span class="count"><b>${fishIn(list)}</b><small>fish</small></span>
      </button>`).join('') +
      (unassigned ? `<p class="unassigned">${plural(unassigned, 'catch')} not linked to a spot. Open a catch and choose <strong>Save this location as a spot</strong>, or edit it to pick a spot.</p>` : '');
  }
  $('#spots-list').addEventListener('click', (e) => { const b = e.target.closest('[data-spot]'); if (b) showSpot(b.dataset.spot); });
  $('#btn-new-spot').addEventListener('click', () => spotForm.open());

  function renderSpotDetail(id) {
    const sp = spotById(id); if (!sp) { if (!$('#sheet-spot').hidden) closeSheet(); return; }
    spotDetailId = id;
    const list = spotCatches(id);
    $('#spot-title').textContent = 'Spot';
    const species = ranked(countBy(list, (c) => c.species));
    const lures = ranked(countBy(list, (c) => c.bait));
    const heaviest = list.filter((c) => c.weightKg != null).sort((a, b) => b.weightKg - a.weightKg)[0];
    const longest = list.filter((c) => c.lengthCm != null).sort((a, b) => b.lengthCm - a.lengthCm)[0];
    const big = heaviest ? [U.wt(heaviest.weightKg), heaviest] : longest ? [U.len(longest.lengthCm), longest] : null;
    const days = new Set(list.map((c) => new Date(c.caughtAt).toDateString())).size;
    const cells = list.length ? conditionCells(list) : '';
    const top = (rows, n) => { const r = rows.slice(0, n); if (rows.length > n) r.push([rows.length - n === 1 ? rows[n][0] : `${rows.length - n} others`, rows.slice(n).reduce((a, x) => a + x[1], 0)]); return r; };
    const recent = list.slice(0, 5).map((c) => { const t = thumbUrl(c); return `<li><button type="button" data-open="${c.id}">
        ${t ? `<img class="t" src="${t}" alt="">` : '<span class="t"><svg viewBox="0 0 32 32"><use href="#i-fish"/></svg></span>'}
        <span style="min-width:0"><b>${esc(c.species)}</b><small>${esc(c.bait)} · ${fmtDate(c.caughtAt)}${c.weather ? ' · ' + esc(wxLabel(c.weather).icon + ' ' + U.temp(c.weather.tempC)) : ''}</small></span></button></li>`; }).join('');
    const d = lastLoc ? distM(lastLoc, sp) : null;
    $('#spot-body').innerHTML = `
      <div class="spot-head"><h3>${esc(sp.name)}</h3><p>${sp.water === 'salt' ? 'Saltwater · ' : sp.water === 'fresh' ? 'Freshwater · ' : ''}${sp.lat.toFixed(5)}, ${sp.lon.toFixed(5)} · within ${fmtDist(sp.radiusM)}${d != null ? ` · ${fromYou(d)}` : ''}</p></div>
      ${sp.notes ? `<div class="card notes-card" style="margin-bottom:12px"><h3 style="margin-bottom:6px">Notes</h3><p>${esc(sp.notes)}</p></div>` : ''}
      ${list.length ? `
        <div class="tiles" style="margin-bottom:12px">
          <div class="stat"><b>${fishIn(list)}</b><span>Fish</span></div>
          <div class="stat"><b>${days}</b><span>${days === 1 ? 'Day' : 'Days'} with fish</span></div>
          <div class="stat"><b>${species.length}</b><span>Species</span></div>
          <div class="stat"><b>${big ? esc(big[0]) : '–'}</b><span>Biggest</span>${big ? `<small>${esc(big[1].species)}</small>` : ''}</div>
        </div>
        <div class="card" style="margin-bottom:12px"><h3>What works here</h3><p class="sub">Catches per lure or bait at this spot.</p>${barsHtml(top(lures, 6), Math.max(...top(lures, 6).map((x) => x[1])))}</div>
        ${cells ? `<div class="card" style="margin-bottom:12px"><h3>Best conditions here</h3><p class="sub">The most common condition when you caught fish here.</p><div class="cond-grid">${cells}</div></div>` : ''}
        ${species.length > 1 ? `<div class="card" style="margin-bottom:12px"><h3>Species here</h3><p class="sub">&nbsp;</p>${barsHtml(top(species, 6), Math.max(...top(species, 6).map((x) => x[1])))}</div>` : ''}
        <div class="card" style="margin-bottom:12px"><h3>Recent catches</h3><ul class="recent-list">${recent}</ul></div>
      ` : `<div class="card" style="margin-bottom:12px"><p class="sub" style="margin:0">No catches linked yet. New catches within ${fmtDist(sp.radiusM)} are added automatically.</p></div>`}
      <div class="detail-actions">
        ${list.length >= 3 ? '<button type="button" class="btn primary" id="spot-stats">Best lure by conditions here</button>' : ''}
        ${sp.water === 'salt' || (sp.water !== 'fresh' && list.some((c) => tideShown(c))) ? '<button type="button" class="btn" id="spot-tides">Tides at this spot</button>' : ''}
        <a class="btn" href="${mapsLink(sp)}" target="_blank" rel="noopener">Directions in Maps</a>
      </div>`;
    $$('#spot-body .card .sub').forEach((el) => { if (el.innerHTML === '&nbsp;') el.remove(); });
  }
  function showSpot(id) { renderSpotDetail(id); openSheet($('#sheet-spot')); }
  $('#spot-body').addEventListener('click', (e) => {
    const o = e.target.closest('[data-open]'); if (o) { showDetail(o.dataset.open); return; }
    if (e.target.id === 'spot-tides') { const sp = spotById(spotDetailId); if (sp) showTides({ lat: sp.lat, lon: sp.lon }); return; }
    if (e.target.id === 'spot-stats') {
      const id = spotDetailId;
      while (sheetStack.length) hideTop();
      try { if (history.state && history.state.sheet) history.go(-1); } catch { /* ignore */ }
      $('#st-spot').dataset.want = id; $('#st-species').value = ''; $('#st-range').value = 'all';
      $('.tab[data-view=stats]').click(); window.scrollTo(0, 0);
    }
  });
  $('#btn-spot-edit').addEventListener('click', () => { const sp = spotById(spotDetailId); if (sp) spotForm.open(sp); });

  const spotForm = (() => {
    let editing = null; let loc = null; let linkCatchId = null;
    const radiusLabel = (m) => `${fmtDist(m)}${m === 100 ? ' – a dock or small pool' : m === 250 ? ' – a cove or point' : m === 500 ? ' – a bay or bend' : m === 1000 ? ' – part of a lake' : ' – a whole small lake'}`;
    function showLoc(state, msg) {
      if (state === 'busy') { $('#sp-loc-text').innerHTML = '<span class="spin"></span>Getting GPS fix…'; $('#sp-loc-sub').textContent = ''; return; }
      if (loc) { $('#sp-loc-text').textContent = `${loc.lat.toFixed(5)}, ${loc.lon.toFixed(5)}`; $('#sp-loc-sub').textContent = msg || (loc.source === 'gps' ? `GPS · ±${Math.round(loc.accuracy)} m` : loc.source === 'catch' ? 'From the catch' : loc.source === 'map' ? 'Picked on the map' : loc.source === 'saved' ? 'Saved location' : 'Entered by hand'); $('#sp-lat').value = loc.lat.toFixed(6); $('#sp-lon').value = loc.lon.toFixed(6); }
      else { $('#sp-loc-text').textContent = 'No location'; $('#sp-loc-sub').textContent = msg || ''; }
    }
    async function locate() {
      showLoc('busy');
      try { const p = await getPosition(); rememberLoc(p); loc = p; showLoc(); } catch (err) { showLoc(null, err.message); }
    }
    function open(sp, opts = {}) {
      editing = sp || null; linkCatchId = opts.linkCatchId || null;
      $('#spot-form').reset(); $('#sp-error').textContent = ''; $('#sp-name').classList.remove('invalid');
      $('#spot-form-title').textContent = sp ? 'Edit spot' : 'New spot';
      $('#sp-radius').innerHTML = RADII.map((m) => `<option value="${m}">${esc(radiusLabel(m))}</option>`).join('');
      $('#sp-radius').value = String(sp ? sp.radiusM : 250);
      $('#sp-name').value = sp ? sp.name : ''; $('#sp-notes').value = sp ? sp.notes || '' : '';
      $('#sp-delete').hidden = !sp; $('#sp-water').value = sp ? sp.water || 'auto' : 'auto'; $('#sp-manual').open = false;
      loc = sp ? { lat: sp.lat, lon: sp.lon, source: 'saved' } : opts.location ? { ...opts.location, source: opts.location.source === 'map' ? 'map' : 'catch' } : null;
      showLoc();
      openSheet($('#sheet-spot-form'));
      if (!loc) locate();
      if (!sp) setTimeout(() => $('#sp-name').focus(), 250);
    }
    $('#sp-locate').addEventListener('click', locate);
    $('#sp-use-manual').addEventListener('click', () => {
      const lat = num($('#sp-lat').value); const lon = num($('#sp-lon').value);
      if (lat == null || lon == null || Math.abs(lat) > 90 || Math.abs(lon) > 180) { toast('Enter a valid latitude and longitude'); return; }
      loc = { lat, lon, source: 'manual' }; showLoc(); $('#sp-manual').open = false;
    });
    $('#spot-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = $('#sp-name').value.trim();
      if (!name) { $('#sp-name').classList.add('invalid'); $('#sp-error').textContent = 'Give the spot a name.'; $('#sp-name').focus(); return; }
      if (!loc) { $('#sp-error').textContent = 'The spot needs a location. Use GPS or enter coordinates.'; return; }
      const now = Date.now();
      const sp = { ...(editing || { id: uid(), createdAt: now }), name, lat: loc.lat, lon: loc.lon, radiusM: Number($('#sp-radius').value) || 250, water: $('#sp-water').value || 'auto', notes: $('#sp-notes').value.trim(), updatedAt: now };
      await DB.putSpot(sp);
      const i = spots.findIndex((x) => x.id === sp.id); if (i >= 0) spots[i] = sp; else spots.push(sp);
      const linked = await linkCatchesToSpot(sp, linkCatchId);
      closeSheet(); await reload();
      toast(editing ? 'Spot updated' + (linked ? ` · linked ${plural(linked, 'catch')}` : '') : `${name} saved` + (linked ? ` · linked ${plural(linked, 'catch')}` : ''));
      if (!$('#sheet-detail').hidden && detailId) renderDetail(detailId);
    });
    $('#sp-delete').addEventListener('click', async () => {
      if (!editing) return;
      const n = spotCatches(editing.id).length;
      if (!(await askConfirm(`Delete ${editing.name}?${n ? ` Its ${plural(n, 'catch')} stay in your log, just without a spot.` : ''}`))) return;
      for (const c of spotCatches(editing.id)) { c.spotId = null; await DB.put(c); }
      await DB.delSpot(editing.id);
      while (sheetStack.length) hideTop();
      await reload(); toast('Spot deleted');
    });
    return { open };
  })();


  // ---------------------------------------------------------------- tides (NOAA CO-OPS, US coasts)
  // Station list: NOAA metadata API, cached on the phone for 30 days.
  // Predictions: high/low times for about a month around today, used for the curve and the coefficient estimate.
  const NOAA_API = 'https://api.tidesandcurrents.noaa.gov';
  const tideCache = new Map();
  let tideState = null;

  let stationsMem = null;
  async function noaaStations() {
    if (stationsMem) return stationsMem;
    try { const c = JSON.parse(store('tl.noaaStations') || 'null'); if (c && Date.now() - c.at < 30 * 86400000 && c.list.length) return (stationsMem = c.list); } catch { /* refetch */ }
    const r = await fetch(`${NOAA_API}/mdapi/prod/webapi/stations.json?type=tidepredictions`);
    if (!r.ok) throw new Error('NOAA station list unavailable (' + r.status + ')');
    const j = await r.json();
    const raw = j.stations || j.stationList || [];
    const list = raw.map((x) => [String(x.id), x.name, Number(x.lat), Number(x.lng ?? x.lon), x.state || '']).filter((x) => Number.isFinite(x[2]) && Number.isFinite(x[3]));
    if (!list.length) throw new Error('NOAA returned no stations');
    store('tl.noaaStations', JSON.stringify({ at: Date.now(), list }));
    return (stationsMem = list);
  }
  function nearestStations(list, at, n = 5) {
    return list.map((x) => ({ id: x[0], name: x[1], lat: x[2], lon: x[3], state: x[4], d: distM(at, { lat: x[2], lon: x[3] }) }))
      .sort((a, b) => a.d - b.d).slice(0, n);
  }
  const ymd = (d) => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`;
  async function noaaHiLo(id, around = Date.now()) {
    const key = id + ':' + dayStart(around);
    if (tideCache.has(key)) return tideCache.get(key);
    const begin = new Date(around - 16 * 86400000); const end = new Date(around + 16 * 86400000);
    const url = `${NOAA_API}/api/prod/datagetter?product=predictions&application=Fishamongus&begin_date=${ymd(begin)}&end_date=${ymd(end)}&datum=MLLW&station=${encodeURIComponent(id)}&time_zone=gmt&units=metric&interval=hilo&format=json`;
    const r = await fetch(url);
    if (!r.ok) throw new Error('NOAA predictions unavailable (' + r.status + ')');
    const j = await r.json();
    if (j.error) throw new Error(j.error.message || 'NOAA returned an error');
    const ev = (j.predictions || []).map((p) => ({ t: Date.parse(p.t.replace(' ', 'T') + ':00Z'), h: Number(p.v), type: p.type === 'H' ? 'H' : 'L' })).filter((e) => Number.isFinite(e.t) && Number.isFinite(e.h)).sort((a, b) => a.t - b.t);
    if (ev.length < 4) throw new Error('Not enough tide predictions for this station');
    tideCache.set(key, ev);
    return ev;
  }
  // Height between two turning points follows a half cosine – the standard way to draw tides from highs and lows.
  function tideAt(ev, t) {
    let i = ev.findIndex((e) => e.t > t);
    if (i <= 0) return null;
    const a = ev[i - 1]; const b = ev[i]; const f = (t - a.t) / (b.t - a.t);
    return { h: a.h + (b.h - a.h) * (1 - Math.cos(Math.PI * f)) / 2, rising: b.h > a.h, prev: a, next: b, f };
  }
  const dayStart = (t) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
  // Tidal coefficient estimate. NOAA doesn't publish one, so we use the French method's idea:
  // each day's tidal range compared with the average daily range over the surrounding month.
  // 70 ≈ an average day, about 45 ≈ neap tides, about 95 ≈ spring tides.
  function dailyCoefs(ev) {
    // Range per day = highest high minus lowest low within one tidal day (24 h 50 min) centred on local noon,
    // so a calendar day boundary never cuts a tide cycle in half.
    const half = 12.42 * 3600000; const first = dayStart(ev[0].t) + 86400000; const last = dayStart(ev[ev.length - 1].t) - 86400000;
    const ranges = [];
    for (let dd = new Date(first); dd.getTime() <= last; dd.setDate(dd.getDate() + 1)) {
      const day = dd.getTime(); const noon = new Date(day).setHours(12, 0, 0, 0); const w = ev.filter((e) => e.t >= noon - half && e.t <= noon + half);
      const hs = w.filter((e) => e.type === 'H').map((e) => e.h); const ls = w.filter((e) => e.type === 'L').map((e) => e.h);
      if (hs.length && ls.length) ranges.push({ day, range: Math.max(...hs) - Math.min(...ls) });
    }
    const mean = ranges.reduce((acc, x) => acc + x.range, 0) / Math.max(1, ranges.length);
    return ranges.map((x) => ({ ...x, coef: Math.max(20, Math.min(120, Math.round(70 * x.range / mean))) }));
  }
  function coefLabel(c) { return c < 45 ? 'Weak – neap tides' : c < 70 ? 'Moderate' : c < 95 ? 'Strong' : 'Very strong – spring tides'; }
  const tideH = (m) => imp() ? `${(m * 3.28084).toFixed(1)} ft` : `${m.toFixed(2)} m`;

  async function showTides(where) {
    const at = where || (map ? { lat: map.getCenter().lat, lon: map.getCenter().lng } : lastLoc);
    $('#tides-body').innerHTML = '<p class="help"><span class="spin"></span>Finding the nearest NOAA tide station…</p>';
    openSheet($('#sheet-tides'));
    if (!at) { $('#tides-body').innerHTML = '<p class="help">Move the map to a coastline, or log a catch with GPS first, then try again.</p>'; return; }
    try {
      const near = nearestStations(await noaaStations(), at);
      tideState = { at, near, id: near[0].id };
      await renderTides();
    } catch (err) {
      $('#tides-body').innerHTML = `<p class="help">Couldn't reach NOAA: ${esc(err.message)}. Tides need a connection.</p>
        <p class="help"><a href="https://tidesandcurrents.noaa.gov/map/" target="_blank" rel="noopener">Open NOAA's tide map</a></p>`;
    }
  }
  $('#btn-tides').addEventListener('click', () => showTides());

  // ----- water temperature and waves for coastal places (Open-Meteo Marine)
  async function fetchMarine(lat, lon, from, to = from) {
    const now = Date.now(); const past = Math.min(92, Math.max(1, Math.ceil((now - from) / 86400000) + 1));
    const fut = Math.min(8, Math.max(1, Math.ceil((to - now) / 86400000) + 1));
    const r = await fetch(`https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&hourly=sea_surface_temperature,wave_height,wave_period,wave_direction&past_days=${past}&forecast_days=${fut}&timeformat=unixtime&timezone=GMT`);
    if (!r.ok) throw new Error('Marine data unavailable');
    const h = (await r.json()).hourly; if (!h || !h.time) throw new Error('No marine data');
    const at = (t) => { let bi = -1; let bd = Infinity; h.time.forEach((sec, i) => { const d = Math.abs(sec * 1000 - t); if (d < bd) { bd = d; bi = i; } });
      if (bi < 0 || bd > 3 * 3600000) return null;
      const v = { seaTempC: h.sea_surface_temperature ? h.sea_surface_temperature[bi] : null, waveM: h.wave_height ? h.wave_height[bi] : null, periodS: h.wave_period ? h.wave_period[bi] : null, waveDir: h.wave_direction ? h.wave_direction[bi] : null };
      return v.seaTempC == null && v.waveM == null ? null : v; };
    return { at, hours: h.time.map((sec) => sec * 1000) };
  }
  async function marineFor(loc, t) { const m = await fetchMarine(loc.lat, loc.lon, t); const v = m.at(t); return v ? { ...v, fetchedAt: Date.now() } : { none: true, fetchedAt: Date.now() }; }
  const waveText = (m) => m && !m.none ? [m.seaTempC != null ? `water ${U.temp(m.seaTempC)}` : null, m.waveM != null ? `waves ${imp() ? `${round(m.waveM * 3.28084, 1)} ft` : `${round(m.waveM, 1)} m`}${m.periodS != null ? ` @ ${round(m.periodS)} s` : ''}` : null].filter(Boolean).join(' · ') : '';

  // ----- tide for one catch
  const TIDE_NEAR = 25000;   // "Automatic" water: tides count within 25 km (about 15 mi) of a NOAA station
  const TIDE_MAX = 100000;   // beyond 100 km nothing is looked up at all
  async function tideFor(loc, t) {
    const st = nearestStations(await noaaStations(), loc, 1)[0];
    if (!st || st.d > TIDE_MAX) return { none: true, distM: st ? Math.round(st.d) : null, fetchedAt: Date.now() };
    const ev = await noaaHiLo(st.id, t);
    const cur = tideAt(ev, t); if (!cur) throw new Error('No prediction for that time');
    const stage = tideStage(cur, t);
    const day = dailyCoefs(ev).find((x) => x.day === dayStart(t));
    return { stationId: st.id, stationName: st.name + (st.state ? ', ' + st.state : ''), distM: Math.round(st.d), stage, rising: cur.rising,
      heightM: round(cur.h, 3), lastType: cur.prev.type, lastT: cur.prev.t, nextType: cur.next.type, nextT: cur.next.t, coef: day ? day.coef : null, fetchedAt: Date.now() };
  }
  function tideStage(cur, t) {
    const HR = 3600000;
    if (t - cur.prev.t < HR) return cur.prev.type === 'H' ? 'High slack' : 'Low slack';
    if (cur.next.t - t < HR) return cur.next.type === 'H' ? 'High slack' : 'Low slack';
    return cur.rising ? 'Rising' : 'Falling';
  }
  function tideShown(c, water) {
    const t = c.tide; if (!t || t.none) return false;
    const w = water || (c.spotId && spotById(c.spotId) ? spotById(c.spotId).water || 'auto' : 'auto');
    return w === 'salt' || (w === 'auto' && t.distM <= TIDE_NEAR);
  }
  function hmText(ms) { const m = Math.round(ms / 60000); const h = Math.floor(m / 60); return h ? (m % 60 ? `${h} h ${m % 60} min` : `${h} h`) : `${m} min`; }
  function durText(ms) { const m = Math.max(0, Math.round(ms / 60000)); return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${pad(m % 60)} min`; }
  function tideSince(t, at) { return `${durText(at - t.lastT)} after ${t.lastType === 'H' ? 'high' : 'low'}`; }
  function coefShort(c) { return c < 45 ? 'weak' : c < 70 ? 'moderate' : c < 95 ? 'strong' : 'very strong'; }

  // Look up tides for catches that don't have them yet (older catches, or ones saved with no signal).
  let tideFilling = false;
  // Water temperature and waves for coastal catches that don't have them yet.
  async function backfillMarine() {
    if (!navigator.onLine) return; let n = 0;
    for (const c of catches.filter((x) => x.location && x.marine === undefined && tideShown(x) && Date.now() - x.caughtAt < 90 * 86400000 && (x.marineTries || 0) < 3).slice(0, 30)) {
      try { c.marine = await marineFor(c.location, c.caughtAt); n++; } catch { c.marineTries = (c.marineTries || 0) + 1; }
      await DB.put(c);
    }
    if (n) reload();
  }
  async function backfillTides() {
    if (tideFilling || !navigator.onLine) return; tideFilling = true; let n = 0;
    try {
      const todo = catches.filter((c) => c.location && c.tide === undefined && (c.tideTries || 0) < 4).slice(0, 30);
      for (const c of todo) {
        try { c.tide = await tideFor(c.location, c.caughtAt); if (tideShown(c)) n++; }
        catch { c.tideTries = (c.tideTries || 0) + 1; }
        await DB.put(c);
      }
    } finally { tideFilling = false; }
    if (n) { toastBg(`Tide added to ${plural(n, 'catch')}`); reload(); }
  }
  window.addEventListener('online', () => backfillTides());

  async function renderTides() {
    const body = $('#tides-body'); const st = tideState.near.find((x) => x.id === tideState.id);
    const far = st.d > 100000;
    const picker = `<div class="station-row"><div class="select-wrap sm"><select id="tide-station" aria-label="Tide station">${tideState.near.map((x) =>
      `<option value="${x.id}"${x.id === st.id ? ' selected' : ''}>${esc(x.name)}${x.state ? ', ' + esc(x.state) : ''} – ${fmtDist(x.d)}</option>`).join('')}</select></div></div>`;
    body.innerHTML = picker + '<p class="help"><span class="spin"></span>Loading NOAA predictions…</p>';
    let ev;
    try { ev = await noaaHiLo(st.id); }
    catch (err) { body.innerHTML = picker + `<p class="help">Couldn't load predictions for this station: ${esc(err.message)}</p>`; bindStation(); return; }
    if (tideState.id !== st.id) return;
    const now = Date.now(); const cur = tideAt(ev, now);
    const coefs = dailyCoefs(ev); const today = dayStart(now);
    const cToday = coefs.find((x) => x.day === today);
    const week = coefs.filter((x) => x.day >= today).slice(0, 7);
    const nextSpring = coefs.filter((x) => x.day > today).find((x, i, a) => x.coef >= 90 && (!a[i + 1] || a[i + 1].coef <= x.coef) && (!a[i - 1] || a[i - 1].coef <= x.coef));
    const tomorrow = dayStart(today + 36 * 3600000);
    const upcoming = ev.filter((e) => e.t >= today && e.t < dayStart(tomorrow + 36 * 3600000));
    const dayName = (t) => t === today ? 'Today' : t === tomorrow ? 'Tomorrow' : `${new Date(t).toLocaleDateString(undefined, { weekday: 'short' })} ${new Date(t).getDate()}`;
    const dayLower = (t) => t === today || t === tomorrow ? dayName(t).toLowerCase() : new Date(t).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
    const mins = (ms) => { const m = Math.round(ms / 60000); return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${pad(m % 60)} min`; };

    body.innerHTML = picker + `
      ${far ? `<p class="help" style="color:var(--danger)">The nearest NOAA station is ${fmtDist(st.d)} away. Tides there may not match this water, and inland lakes have no meaningful tide.</p>` : ''}
      ${cur ? `<div class="card" style="margin-bottom:12px"><div class="tide-now">
        <span class="arrow" aria-hidden="true">${cur.rising ? '↑' : '↓'}</span>
        <b>${cur.rising ? 'Rising' : 'Falling'} · ${tideH(cur.h)}</b>
        <small>${cur.next.type === 'H' ? 'High' : 'Low'} tide at ${fmtTime(cur.next.t)} (${tideH(cur.next.h)}), in ${mins(cur.next.t - now)}</small>
      </div></div>` : ''}
      <div class="card" style="margin-bottom:12px">
        <h3>Today's tide</h3><p class="sub">Height above mean lower low water (MLLW).</p>
        ${tideChart(ev, today, now)}
        <p class="tide-read" id="tide-read">Tap the curve to read any time.</p>
      </div>
      ${cToday ? `<div class="card" style="margin-bottom:12px">
        <h3>Tidal coefficient</h3><p class="sub">How big today's tide swing is compared with this station's average.</p>
        <div class="coef"><b>${cToday.coef}</b><span>${coefLabel(cToday.coef)}</span></div>
        <div class="coef-scale" aria-hidden="true"><i style="left:${((cToday.coef - 20) / 100) * 100}%"></i></div>
        <div class="coef-ticks"><span>20 weak</span><span>45 neap</span><span>70 avg</span><span>95 spring</span><span>120</span></div>
        <p class="note">Today's range ${tideH(cToday.range)}.${nextSpring ? ` Next spring tides around ${dayLower(nextSpring.day)} (${nextSpring.coef}).` : ''} An estimate from NOAA's predictions: 70 × today's range ÷ the average daily range over the surrounding month. NOAA doesn't publish an official coefficient.</p>
      </div>` : ''}
      <div class="card" style="margin-bottom:12px">
        <h3>Highs and lows</h3>
        <table class="tide-table"><thead><tr><th>Day</th><th>Tide</th><th>Time</th><th>Height</th></tr></thead><tbody>
          ${upcoming.map((e) => `<tr class="${e.t < now ? 'past' : ''}"><td>${dayName(dayStart(e.t))}</td><td>${e.type === 'H' ? 'High' : 'Low'}</td><td>${fmtTime(e.t)}</td><td>${tideH(e.h)}</td></tr>`).join('')}
        </tbody></table>
      </div>
      ${week.length ? `<div class="card" style="margin-bottom:12px"><h3>Coefficient, next 7 days</h3><p class="sub">Bigger numbers mean stronger tidal movement.</p>
        <div class="week">${week.map((x) => `<div class="d${x.day === today ? ' today' : ''}"><span>${dayName(x.day)}</span><span class="track"><span class="fill" style="display:block;width:${(x.coef / 120) * 100}%"></span></span><span class="v">${x.coef}</span></div>`).join('')}</div></div>` : ''}
      <p class="help small">Predictions from NOAA CO-OPS station ${esc(st.id)} (${esc(st.name)}). Predicted tides don't include wind or storm effects. <a href="https://tidesandcurrents.noaa.gov/noaatidepredictions.html?id=${encodeURIComponent(st.id)}" target="_blank" rel="noopener">View on NOAA</a></p>`;
    bindStation(); bindChart(ev, today);
  }
  function bindStation() {
    const sel = $('#tide-station'); if (sel) sel.addEventListener('change', () => { tideState.id = sel.value; renderTides(); });
  }

  // Tide curve for one local day, drawn as SVG.
  const TC = { w: 340, h: 150, l: 34, r: 8, t: 22, b: 22 };
  function tideScale(ev, day) {
    const pts = []; for (let t = day; t <= day + 86400000; t += 600000) { const v = tideAt(ev, t); if (v) pts.push([t, v.h]); }
    const hs = pts.map((p) => p[1]); let lo = Math.min(...hs); let hi = Math.max(...hs); const pad2 = (hi - lo) * 0.15 || 0.2; lo -= pad2; hi += pad2;
    const x = (t) => TC.l + ((t - day) / 86400000) * (TC.w - TC.l - TC.r);
    const y = (h) => TC.t + (1 - (h - lo) / (hi - lo)) * (TC.h - TC.t - TC.b);
    return { pts, lo, hi, x, y };
  }
  function tideChart(ev, day, now, opt = {}) {
    const id = opt.id || 'tide';
    const { pts, lo, hi, x, y } = tideScale(ev, day);
    if (pts.length < 2) return '<p class="help">No curve available for today.</p>';
    const d = pts.map((p, i) => `${i ? 'L' : 'M'}${x(p[0]).toFixed(1)},${y(p[1]).toFixed(1)}`).join('');
    const area = `${d}L${x(pts[pts.length - 1][0]).toFixed(1)},${TC.h - TC.b}L${x(pts[0][0]).toFixed(1)},${TC.h - TC.b}Z`;
    const k = imp() ? 3.28084 : 1; const span = (hi - lo) * k;
    const unitStep = [0.25, 0.5, 1, 2, 5, 10].find((st) => span / st <= 4) || 10;
    const ticks = []; for (let v = Math.ceil((lo * k) / unitStep) * unitStep; v <= hi * k; v += unitStep) ticks.push(v / k);
    const hours = [0, 6, 12, 18, 24];
    const hl = (h) => h === 0 || h === 24 ? '12a' : h === 12 ? '12p' : h < 12 ? `${h}a` : `${h - 12}p`;
    const turns = ev.filter((e) => e.t >= day && e.t <= day + 86400000);
    const nowIn = now >= day && now <= day + 86400000 ? tideAt(ev, now) : null;
    const win = opt.win ? `<rect x="${x(Math.max(day, opt.win[0])).toFixed(1)}" y="${TC.t - 6}" width="${Math.max(0, x(Math.min(day + 86400000, opt.win[1])) - x(Math.max(day, opt.win[0]))).toFixed(1)}" height="${TC.h - TC.b - TC.t + 6}" fill="var(--accent)" opacity=".12"/>` : '';
    return `<svg class="tide-chart" id="${id}-svg" viewBox="0 0 ${TC.w} ${TC.h}" role="img" aria-label="Tide curve for today">
      ${ticks.map((v) => `<line class="grid" x1="${TC.l}" x2="${TC.w - TC.r}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}"/><text x="${TC.l - 4}" y="${(y(v) + 4).toFixed(1)}" text-anchor="end">${round(v * k, 2)}</text>`).join('')}
      <text x="${TC.l - 4}" y="12" text-anchor="end">${imp() ? 'ft' : 'm'}</text>
      ${hours.map((h) => `<text x="${x(day + h * 3600000).toFixed(1)}" y="${TC.h - 6}" text-anchor="${h === 0 ? 'start' : h === 24 ? 'end' : 'middle'}">${hl(h)}</text>`).join('')}
      ${win}<path class="area" d="${area}"/><path class="curve" d="${d}"/>
      ${turns.map((e) => { const up = e.type === 'H'; const tx = Math.min(TC.w - TC.r - 18, Math.max(TC.l + 18, x(e.t)));
        return `<text class="lbl" x="${tx.toFixed(1)}" y="${(y(e.h) + (up ? -7 : 15)).toFixed(1)}" text-anchor="middle">${fmtTime(e.t).replace(/ ?([AP])M/i, (m, a) => a.toLowerCase())}</text>`; }).join('')}
      ${nowIn ? `<line class="now" x1="${x(now).toFixed(1)}" x2="${x(now).toFixed(1)}" y1="${TC.t - 6}" y2="${TC.h - TC.b}"/><circle class="nowdot" cx="${x(now).toFixed(1)}" cy="${y(nowIn.h).toFixed(1)}" r="5"/>` : ''}
      <g id="${id}-hover" style="display:none"><line class="hover" y1="${TC.t - 6}" y2="${TC.h - TC.b}"/><circle class="hoverdot" r="5"/></g>
      <rect x="${TC.l}" y="0" width="${TC.w - TC.l - TC.r}" height="${TC.h}" fill="transparent" id="${id}-hit"/>
    </svg>`;
  }
  function bindChart(ev, day, id = 'tide') {
    const svg = $(`#${id}-svg`); if (!svg) return;
    const { x, y } = tideScale(ev, day); const g = $(`#${id}-hover`); const out = $(`#${id}-read`);
    const show = (clientX) => {
      const r = svg.getBoundingClientRect(); const px = ((clientX - r.left) / r.width) * TC.w;
      const t = day + Math.max(0, Math.min(1, (px - TC.l) / (TC.w - TC.l - TC.r))) * 86400000; const v = tideAt(ev, t); if (!v) return;
      g.style.display = ''; g.querySelector('line').setAttribute('x1', x(t)); g.querySelector('line').setAttribute('x2', x(t));
      g.querySelector('circle').setAttribute('cx', x(t)); g.querySelector('circle').setAttribute('cy', y(v.h));
      out.textContent = `${fmtTime(t)} · ${tideH(v.h)} · ${v.rising ? 'rising' : 'falling'}`;
    };
    svg.addEventListener('pointermove', (e) => show(e.clientX));
    svg.addEventListener('pointerdown', (e) => show(e.clientX));
  }

  // ---------------------------------------------------------------- map (Leaflet, loaded on first use)
  let map = null; let layer = null; let leafletLoading = null; let youLayer = null; let mapCentred = false;
  function loadLeaflet() {
    if (window.L) return Promise.resolve();
    if (leafletLoading) return leafletLoading;
    leafletLoading = new Promise((res, rej) => {
      const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; document.head.appendChild(css);
      const s = document.createElement('script'); s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      s.onload = res; s.onerror = () => { leafletLoading = null; rej(new Error('offline')); }; document.head.appendChild(s);
    });
    return leafletLoading;
  }
  async function showMap() {
    const msg = $('#map-msg');
    try { await loadLeaflet(); } catch { msg.hidden = false; msg.textContent = 'The map needs a connection the first time it opens. Your catches are safe – try again when you have signal.'; return; }
    msg.hidden = true;
    if (!map) {
      map = L.map('map', { zoomControl: false }).setView([39.5, -98.35], 4);
      L.control.zoom({ position: 'topright' }).addTo(map);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, crossOrigin: true, attribution: '© OpenStreetMap' }).addTo(map);
      layer = L.layerGroup().addTo(map);
      youLayer = L.layerGroup().addTo(map);
      // With nothing saved yet, start where you last were rather than on the whole country.
      const hasPts = catches.some((c) => c.location) || spots.length;
      if (!hasPts && lastLoc) { map.setView([lastLoc.lat, lastLoc.lon], 13); mapCentred = true; }
      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        L.popup().setLatLng(e.latlng).setContent(`<div class="pop"><b>This place</b><br>${lat.toFixed(4)}, ${lng.toFixed(4)}<div class="pop-actions"><button type="button" data-map-spot="${lat},${lng}">New spot here</button><button type="button" data-map-trip="${lat},${lng}">Plan a trip here</button></div></div>`).openOn(map);
      });
      map.on('popupopen', (e) => {
        const el = e.popup.getElement();
        const ms = el.querySelector('[data-map-spot]'); if (ms) ms.onclick = () => { const [la, lo] = ms.dataset.mapSpot.split(',').map(Number); map.closePopup(); spotForm.open(null, { location: { lat: la, lon: lo, source: 'map' } }); };
        const mt = el.querySelector('[data-map-trip]'); if (mt) mt.onclick = () => { const [la, lo] = mt.dataset.mapTrip.split(',').map(Number); map.closePopup(); tripForm.open(null, { lat: la, lon: lo }); };
        const b = el.querySelector('[data-open]'); if (b) b.onclick = () => showDetail(b.dataset.open);
        const s2 = el.querySelector('[data-spot]'); if (s2) s2.onclick = () => showSpot(s2.dataset.spot);
      });
    }
    setTimeout(() => { map.invalidateSize(); renderMap(true); }, 30);
    locateOnMap(false);
  }
  // "You are here": a blue dot with its accuracy circle. centre=true (the locate button) always moves the map to you;
  // otherwise the map only moves to you when it has nothing else to show.
  let locating = false;
  async function locateOnMap(centre) {
    if (!map || locating) return; locating = true; $('#btn-map-locate').classList.add('busy');
    try {
      const P = await getPosition(centre ? 0 : 5000); rememberLoc(P); showYou(P);
      const hasPts = catches.some((c) => c.location) || spots.length;
      if (centre || (!hasPts && !mapCentred)) { map.setView([P.lat, P.lon], centre ? Math.max(map.getZoom ? map.getZoom() : 15, 15) : 14); mapCentred = true; }
      if (!hasPts) $('#map-msg').hidden = true;
    } catch (err) {
      if (centre) toast(err.message);
      else if (lastLoc) showYou({ lat: lastLoc.lat, lon: lastLoc.lon, accuracy: null, last: true });
    } finally { locating = false; $('#btn-map-locate').classList.remove('busy'); }
  }
  function showYou(P) {
    if (!youLayer) return; youLayer.clearLayers();
    if (P.accuracy && P.accuracy < 2000) L.circle([P.lat, P.lon], { radius: P.accuracy, color: '#2a7de1', weight: 1, fillColor: '#2a7de1', fillOpacity: 0.12, interactive: false }).addTo(youLayer);
    L.circleMarker([P.lat, P.lon], { radius: 8, bubblingMouseEvents: false, color: '#fff', weight: 3, fillColor: P.last ? '#8aa4b8' : '#2a7de1', fillOpacity: 1 }).addTo(youLayer)
      .bindPopup(`<div class="pop"><b>${P.last ? 'Your last known location' : 'You are here'}</b><br>${P.lat.toFixed(4)}, ${P.lon.toFixed(4)}${P.accuracy ? `<br>±${Math.round(P.accuracy)} m` : ''}<div class="pop-actions"><button type="button" data-map-spot="${P.lat},${P.lon}">New spot here</button><button type="button" data-map-trip="${P.lat},${P.lon}">Plan a trip here</button></div></div>`);
  }
  $('#btn-map-locate').addEventListener('click', () => locateOnMap(true));
  function renderMap(fit) {
    if (!map) return; layer.clearLayers();
    const pts = [];
    const icon = L.divIcon({ className: '', html: '<div style="width:18px;height:18px;border-radius:50%;background:#e8611a;border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>', iconSize: [18, 18], iconAnchor: [9, 9] });
    catches.filter((c) => c.location).forEach((c) => {
      const t = thumbUrl(c);
      L.marker([c.location.lat, c.location.lon], { icon }).addTo(layer).bindPopup(
        `<div class="pop">${t ? `<img src="${t}" alt="">` : ''}<b>${esc(c.species)}</b><br>${esc(c.bait)}<br>${fmtDate(c.caughtAt)}<br><button type="button" data-open="${c.id}">View catch</button></div>`);
      pts.push([c.location.lat, c.location.lon]);
    });
    spots.forEach((sp) => {
      const n = catches.filter((c) => c.spotId === sp.id).length;
      L.circle([sp.lat, sp.lon], { radius: sp.radiusM || 250, color: '#13707f', weight: 2, fillOpacity: 0.08 }).addTo(layer);
      L.marker([sp.lat, sp.lon], { icon: L.divIcon({ className: '', html: `<span class="spot-label">${esc(sp.name)}</span>`, iconSize: [0, 0] }) }).addTo(layer)
        .bindPopup(`<div class="pop"><b>${esc(sp.name)}</b><br>${plural(n, 'catch')}<br><button type="button" data-spot="${sp.id}">View spot</button></div>`);
      pts.push([sp.lat, sp.lon]);
    });
    if (fit && pts.length) { map.fitBounds(pts, { padding: [40, 40], maxZoom: 14 }); mapCentred = true; }
    // Only cover the map with the message when we don't even know where you are.
    $('#map-msg').hidden = pts.length > 0 || mapCentred; if (!pts.length) $('#map-msg').textContent = 'Your spots and catches with a location will show up here. Tap ◎ to find yourself on the map.';
  }

  // Trips opens from the Now screen, so the Now tab stays lit there.
  function showView(v) {
    $$('.tab[data-view]').forEach((x) => x.classList.toggle('active', x.dataset.view === (v === 'trips' ? 'now' : v)));
    $$('.view').forEach((el) => el.classList.toggle('active', el.id === 'view-' + v));
    if (v === 'spots' && spotsMode === 'map') showMap();
    if (v === 'stats') renderStats();
    if (v === 'trips') renderTrips();
    if (v === 'now') refreshNow();
    paintSessionBar(); window.scrollTo(0, 0);
  }
  $$('.tab[data-view]').forEach((t) => t.addEventListener('click', () => showView(t.dataset.view)));


  // ---------------------------------------------------------------- stats
  // Each dimension sorts a catch into one condition bucket. Buckets are listed in display order.
  const DIMENSIONS = {
    sky: { label: 'Sky', needsWx: true, buckets: () => ['Clear', 'Partly cloudy', 'Overcast', 'Fog', 'Rain', 'Snow', 'Storm'],
      of: (c) => { const k = c.weather.code; if (k <= 1) return 'Clear'; if (k === 2) return 'Partly cloudy'; if (k === 3) return 'Overcast'; if (k === 45 || k === 48) return 'Fog';
        if (k >= 95) return 'Storm'; if ((k >= 71 && k <= 77) || k === 85 || k === 86) return 'Snow'; return 'Rain'; } },
    pressure: { label: 'Pressure', needsWx: true, buckets: () => ['Rising', 'Steady', 'Falling'],
      of: (c) => ({ rising: 'Rising', steady: 'Steady', falling: 'Falling' }[c.weather.pressureTrend] || null) },
    temp: { label: 'Air temp', needsWx: true,
      buckets: () => imp() ? ['Below 50°F', '50–65°F', '65–80°F', '80°F +'] : ['Below 10°C', '10–18°C', '18–27°C', '27°C +'],
      of: (c) => { const t = c.weather.tempC; if (t == null) return null; const b = DIMENSIONS.temp.buckets(); return b[t < 10 ? 0 : t < 18.33 ? 1 : t < 26.67 ? 2 : 3]; } },
    wind: { label: 'Wind', needsWx: true,
      buckets: () => imp() ? ['Calm (<5 mph)', 'Light (5–12)', 'Breezy (12–22)', 'Windy (22+)'] : ['Calm (<8 km/h)', 'Light (8–20)', 'Breezy (20–35)', 'Windy (35+)'],
      of: (c) => { const w = c.weather.windKmh; if (w == null) return null; const b = DIMENSIONS.wind.buckets(); return b[w < 8 ? 0 : w < 20 ? 1 : w < 35 ? 2 : 3]; } },
    time: { label: 'Time of day', needsWx: false, buckets: () => ['Dawn (5–8)', 'Morning (8–11)', 'Midday (11–2)', 'Afternoon (2–5)', 'Evening (5–9)', 'Night (9–5)'],
      of: (c) => { const h = new Date(c.caughtAt).getHours(); const b = DIMENSIONS.time.buckets(); return b[h >= 5 && h < 8 ? 0 : h >= 8 && h < 11 ? 1 : h >= 11 && h < 14 ? 2 : h >= 14 && h < 17 ? 3 : h >= 17 && h < 21 ? 4 : 5]; } },
    tide: { label: 'Tide', needsTide: true, buckets: () => ['Low slack', 'Rising', 'High slack', 'Falling'],
      of: (c) => (tideShown(c) ? c.tide.stage : null) },
    coef: { label: 'Tide strength', needsTide: true, buckets: () => ['Weak (under 45)', 'Moderate (45–69)', 'Strong (70–94)', 'Very strong (95+)'],
      of: (c) => { if (!tideShown(c) || c.tide.coef == null) return null; const k = c.tide.coef; return DIMENSIONS.coef.buckets()[k < 45 ? 0 : k < 70 ? 1 : k < 95 ? 2 : 3]; } },
    moon: { label: 'Moon', needsWx: false, buckets: () => ['New moon', 'Waxing', 'Full moon', 'Waning'],
      of: (c) => { const m = moonPhase(c.caughtAt); const q = m.age / m.synodic; return ['New moon', 'Waxing', 'Full moon', 'Waning'][q < 0.125 || q >= 0.875 ? 0 : q < 0.375 ? 1 : q < 0.625 ? 2 : 3]; } },
  };
  let statsDim = store('tl.statsDim') || 'sky';
  if (!DIMENSIONS[statsDim]) statsDim = 'sky';
  let statsSel = null;

  function statsFrom() {
    const range = $('#st-range').value; const now = new Date();
    if (range === 'year') return new Date(now.getFullYear(), 0, 1).getTime();
    return range === 'all' ? 0 : now.getTime() - Number(range) * 86400000;
  }
  function statsFiltered() {
    const sp = $('#st-species').value; const spot = $('#st-spot').value; const from = statsFrom();
    return catches.filter((c) => c.caughtAt >= from && (!sp || c.species === sp) &&
      (!spot || (spot === '__none' ? !(c.spotId && spotById(c.spotId)) : c.spotId === spot)));
  }
  const countBy = (list, fn) => { const m = new Map(); list.forEach((c) => { const k = fn(c); if (k != null && k !== '') m.set(k, (m.get(k) || 0) + weightOf(c)); }); return m; };
  const ranked = (m) => [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const pct = (a, b) => b ? Math.round((a / b) * 100) : 0;
  const plural = (n, w) => `${n} ${n === 1 || w === 'fish' ? w : w + (w.endsWith('h') ? 'es' : 's')}`;

  function barsHtml(rows, max) {
    return `<div class="bars">${rows.map(([k, v]) => `<div class="bar"><span class="lbl" title="${esc(k)}">${esc(k)}</span><span class="track"><span class="fill" style="display:block;width:${Math.max(2, (v / max) * 100)}%"></span></span><span class="v">${v}</span></div>`).join('')}</div>`;
  }

  const MIN_POOL = 5;   // fewer catches than this and a percentage says nothing
  function conditionCells(list) {
    return Object.values(DIMENSIONS).map((d) => {
      const counts = countBy(d.needsWx ? list.filter((c) => c.weather) : list, (c) => d.of(c));
      const total = [...counts.values()].reduce((a, v) => a + v, 0);
      if (total < MIN_POOL) return '';
      const top = ranked(counts)[0];
      return `<div class="cond-cell"><span>${esc(d.label)}</span><b>${esc(top[0])}</b><small>${top[1]} of ${total} fish · ${pct(top[1], total)}%</small></div>`;
    }).join('');
  }

  // Fish per hour from finished trips (the only time the app knows how long you fished).
  function tripsStatsCard() {
    const done = trips.filter((t) => t.end <= Date.now());
    if (!done.length) return '';
    const rows = done.map((t) => ({ t, n: fishIn(tripCatches(t)), h: tripHours(t) }));
    const fish = rows.reduce((a, r) => a + r.n, 0); const hrs = rows.reduce((a, r) => a + r.h, 0);
    const best = [...rows].sort((a, b) => b.n / b.h - a.n / a.h)[0];
    return `<div class="card"><h3>Trips</h3><p class="sub">From trips you planned, so the hours fished are known.</p>
      <div class="tiles" style="margin-bottom:8px">
        <div class="stat"><b>${done.length}</b><span>Trips</span></div>
        <div class="stat"><b>${round(hrs, 1)}</b><span>Hours fished</span></div>
        <div class="stat"><b>${fish}</b><span>Fish</span></div>
        <div class="stat"><b>${round(fish / hrs, 2)}</b><span>Fish per hour</span></div>
      </div>
      <p class="note">Best trip: <button type="button" class="link-btn" data-trip-open="${best.t.id}">${esc(best.t.name)}, ${fmtDate(best.t.start)}</button> – ${round(best.n / best.h, 1)} fish per hour.</p></div>`;
  }

  // Fish per hour from fishing sessions: time each lure was in the water, and what it caught.
  function sessionsStatsCard() {
    const sp = $('#st-species').value; const spot = $('#st-spot').value; const from = statsFrom();
    const list = sessions.filter((x) => x.start >= from && (!spot || (spot === '__none' ? !(x.spotId && spotById(x.spotId)) : x.spotId === spot)));
    if (!list.length) return catches.length >= 3 ? `<div class="card"><h3>Fish per hour</h3><p class="sub" style="margin:0">Tap <b>Start fishing</b> on the Now screen when your line goes in, and <b>End</b> when you're done. Stats then shows which lures catch the most fish per hour, not just the most fish.</p></div>` : '';
    const fishOf = (cs) => fishIn(sp ? cs.filter((c) => c.species === sp) : cs);
    const hrs = list.reduce((a, x) => a + (sessionEnd(x) - x.start), 0) / HOUR_MS;
    const fish = list.reduce((a, x) => a + fishOf(sessionCatches(x)), 0);
    const per = new Map();
    list.forEach((x) => {
      lureTime(x).forEach((ms, lure) => { const e = per.get(lure) || { ms: 0, n: 0 }; e.ms += ms; per.set(lure, e); });
      sessionCatches(x).forEach((c) => { if (sp && c.species !== sp) return; const e = per.get(c.bait) || { ms: 0, n: 0 }; e.n += nFish(c); per.set(c.bait, e); });
    });
    const rows = [...per.entries()].filter(([, e]) => e.ms >= 30 * 60000).map(([lure, e]) => ({ lure, h: e.ms / HOUR_MS, n: e.n, r: e.n / (e.ms / HOUR_MS) })).sort((a, b) => b.r - a.r || b.h - a.h).slice(0, 8);
    const max = Math.max(0.01, ...rows.map((x) => x.r));
    const best = list.filter((x) => x.end && sessionEnd(x) - x.start >= 30 * 60000).map((x) => ({ x, r: fishOf(sessionCatches(x)) / ((sessionEnd(x) - x.start) / HOUR_MS) })).sort((a, b) => b.r - a.r)[0];
    return `<div class="card"><h3>Fish per hour</h3><p class="sub">From ${plural(list.length, 'fishing session')}${sp ? ` · ${esc(sp)} only` : ''}, where the app knows how long each lure was in the water.</p>
      <div class="tiles" style="margin-bottom:12px">
        <div class="stat"><b>${hmText(hrs * HOUR_MS)}</b><span>Time fished</span></div>
        <div class="stat"><b>${hrs >= 0.25 ? round(fish / hrs, 1) : '–'}</b><span>Fish per hour</span><small>${plural(fish, 'fish')}</small></div>
      </div>
      ${rows.length ? `<div class="fph-rows">${rows.map((x) => `<div class="fph-row"><span class="lbl">${esc(x.lure)}</span><span class="v">${round(x.r, 1)}/h</span><span class="track"><span class="fill" style="width:${Math.max(2, (x.r / max) * 100)}%"></span></span><small>${plural(x.n, 'fish')} in ${durText(x.h * HOUR_MS)}</small></div>`).join('')}</div>`
        : '<p class="note" style="margin:0">Lures show up here once one has been in the water for 30 minutes.</p>'}
      ${best ? `<p class="note">Best session: ${esc(fmtDate(best.x.start))}${best.x.spotId && spotById(best.x.spotId) ? ` at ${esc(spotById(best.x.spotId).name)}` : ''} – ${round(best.r, 1)} fish per hour.</p>` : ''}</div>`;
  }

  function renderStats() {
    // species filter options (keep the current choice if it still exists)
    const spSel = $('#st-species'); const cur = spSel.value;
    const spAll = [...new Set(catches.map((c) => c.species))].sort((a, b) => a.localeCompare(b));
    spSel.innerHTML = '<option value="">All species</option>' + spAll.map((v) => `<option value="${esc(v)}">${esc(v)}</option>`).join('');
    spSel.value = spAll.includes(cur) ? cur : '';
    const stSpot = $('#st-spot'); const curSpot = stSpot.dataset.want || stSpot.value; delete stSpot.dataset.want;
    stSpot.innerHTML = '<option value="">All spots</option>' + spots.map((x) => `<option value="${x.id}">${esc(x.name)}</option>`).join('') + (spots.length ? '<option value="__none">No spot</option>' : '');
    stSpot.value = [...stSpot.options].some((o) => o.value === curSpot) ? curSpot : '';
    stSpot.parentElement.hidden = !spots.length;
    $('.filter-row').style.gridTemplateColumns = spots.length ? '' : '1fr 1fr';

    const body = $('#stats-body');
    const list = statsFiltered();
    if (!catches.length) { body.innerHTML = '<div class="stats-empty"><h2>No stats yet</h2><p>Log a few catches and this screen shows which lures work best in which conditions.</p></div>'; return; }
    if (!list.length) { body.innerHTML = '<div class="stats-empty"><p>No catches match these filters.</p></div>'; return; }

    const oneSpecies = !!spSel.value;
    const species = countBy(list, (c) => c.species);
    const lures = countBy(list, (c) => c.bait);
    const released = fishIn(list.filter((c) => c.released === true));
    const relKnown = fishIn(list.filter((c) => c.released === true || c.released === false));
    const heaviest = list.filter((c) => c.weightKg != null).sort((a, b) => b.weightKg - a.weightKg)[0];
    const longest = list.filter((c) => c.lengthCm != null).sort((a, b) => b.lengthCm - a.lengthCm)[0];
    const big = heaviest ? [U.wt(heaviest.weightKg), heaviest] : longest ? [U.len(longest.lengthCm), longest] : null;

    // ----- best lure by conditions
    const anyTide = list.some((c) => tideShown(c));
    if (DIMENSIONS[statsDim].needsTide && !anyTide) statsDim = 'sky';
    const D = DIMENSIONS[statsDim];
    const usable = D.needsWx ? list.filter((c) => c.weather) : list;
    const tagged = usable.map((c) => ({ c, b: D.of(c) })).filter((x) => x.b);
    const skipped = list.length - tagged.length;
    const cols = D.buckets().filter((b) => tagged.some((x) => x.b === b));
    const lureRank = ranked(countBy(tagged, (x) => x.c.bait));
    const MAXROWS = 8;
    const rows = lureRank.slice(0, MAXROWS).map((x) => x[0]);
    const hasOther = lureRank.length > MAXROWS;
    const rowOf = (lure) => rows.includes(lure) ? lure : 'Other lures';
    const cell = new Map(); const colTotal = new Map();
    tagged.forEach(({ c, b }) => { const k = rowOf(c.bait) + '|' + b; cell.set(k, (cell.get(k) || 0) + nFish(c)); colTotal.set(b, (colTotal.get(b) || 0) + nFish(c)); });
    const allRows = hasOther ? [...rows, 'Other lures'] : rows;
    const maxCell = Math.max(1, ...cell.values());
    const shade = (n) => (n ? 'h' + Math.min(5, Math.max(1, Math.ceil((n / maxCell) * 5))) : '');

    // top pick per condition (real lure names only, ties shown together)
    const picks = cols.map((b) => {
      const m = countBy(tagged.filter((x) => x.b === b), (x) => x.c.bait); const r = ranked(m);
      const top = r[0][1]; const tied = r.filter((x) => x[1] === top).map((x) => x[0]);
      return { b, tied, top, total: colTotal.get(b) };
    });

    let lureBlock;
    if (tagged.length < 3) {
      lureBlock = `<p class="sub">${D.needsTide ? 'Needs at least 3 catches with tides recorded.' : D.needsWx ? 'Needs at least 3 catches with weather recorded.' : 'Needs at least 3 catches.'} You have ${tagged.length} so far.</p>`;
    } else {
      lureBlock = `
        <ul class="picks">${picks.map((p) => `<li>
          <span class="cond" title="${esc(p.b)}">${esc(p.b.replace(/ \(.*\)/, ''))}</span>
          ${p.tied.length > 2 ? `<span class="lure none" title="${esc(p.tied.join(', '))}">No clear favorite</span>` : `<span class="lure" title="${esc(p.tied.join(', '))}">${esc(p.tied.join(' / '))}</span>`}
          <span class="n">${p.top} of ${p.total}${p.total < 3 ? '<span class="thin"> · few</span>' : ''}</span></li>`).join('')}</ul>
        <div class="heat-scroll"><table class="heat">
          <thead><tr><th class="row" scope="col">Lure</th>${cols.map((b) => `<th scope="col">${esc(b.replace(/ \(.*\)/, ''))}<small>${colTotal.get(b)}</small></th>`).join('')}</tr></thead>
          <tbody>${allRows.map((r) => `<tr><th class="row" scope="row" title="${esc(r)}">${esc(r)}</th>${cols.map((b) => { const n = cell.get(r + '|' + b) || 0; const k = r + '|' + b;
            return `<td><button type="button" class="${shade(n)}${statsSel === k ? ' sel' : ''}" data-k="${esc(k)}" aria-label="${esc(r)}, ${esc(b)}: ${n}">${n || '·'}</button></td>`; }).join('')}</tr>`).join('')}</tbody>
        </table></div>
        <div class="scale" aria-hidden="true">Fewer <i class="h1"></i><i class="h2"></i><i class="h3"></i><i class="h4"></i><i class="h5"></i> More catches</div>
        <p class="readout" id="heat-readout">${statsSel && cell.has(statsSel) ? readout(statsSel) : 'Tap a square for details.'}</p>`;
    }
    function readout(k) {
      const [lure, b] = k.split('|'); const n = cell.get(k) || 0; const tot = colTotal.get(b) || 0;
      const lureTot = fishIn(tagged.filter((x) => rowOf(x.c.bait) === lure).map((x) => x.c));
      return `<b>${esc(lure)}</b> in <b>${esc(b)}</b>: ${plural(n, 'catch')}, ${pct(n, tot)}% of your ${tot} ${esc(b.toLowerCase().replace(/ \(.*\)/, ''))} catches and ${pct(n, lureTot)}% of this lure's catches.`;
    }

    // ----- when you catch the most
    const condCells = conditionCells(list);

    // ----- personal bests per species
    const bests = ranked(species).slice(0, 10).map(([sp]) => {
      const mine = list.filter((c) => c.species === sp);
      const w = mine.filter((c) => c.weightKg != null).sort((a, b) => b.weightKg - a.weightKg)[0];
      const l = mine.filter((c) => c.lengthCm != null).sort((a, b) => b.lengthCm - a.lengthCm)[0];
      const c = w || l; if (!c) return '';
      const val = [w && U.wt(w.weightKg), l && U.len(l.lengthCm)].filter(Boolean).join(' · ');
      return `<li><button type="button" data-open="${c.id}"><span><b>${esc(sp)}</b><small>${esc(c.bait)} · ${fmtDate(c.caughtAt)}</small></span><span class="big">${esc(val)}</span></button></li>`;
    }).join('');

    const spRank = ranked(species); const spRows = spRank.slice(0, 8);
    if (spRank.length > 8) spRows.push(['Other species', spRank.slice(8).reduce((a, x) => a + x[1], 0)]);
    const lrRank = ranked(lures); const lrRows = lrRank.slice(0, 8);
    if (lrRank.length > 8) lrRows.push(['Other lures', lrRank.slice(8).reduce((a, x) => a + x[1], 0)]);

    body.innerHTML = `
      <div class="tiles">
        <div class="stat"><b>${fishIn(list)}</b><span>Fish</span></div>
        <div class="stat"><b>${oneSpecies ? lures.size : species.size}</b><span>${oneSpecies ? 'Lures that worked' : 'Species'}</span></div>
        <div class="stat"><b>${relKnown ? pct(released, relKnown) + '%' : '–'}</b><span>Released</span>${relKnown && relKnown < list.length ? `<small>of ${relKnown} recorded</small>` : ''}</div>
        <div class="stat"><b>${big ? esc(big[0]) : '–'}</b><span>Biggest</span>${big ? `<small>${esc(big[1].species)}</small>` : ''}</div>
      </div>

      <div class="card">
        <h3>Best lure by conditions</h3>
        <p class="sub">Which lures caught fish in each condition${[oneSpecies && esc(spSel.value), $('#st-spot').value && $('#st-spot').value !== '__none' && spotById($('#st-spot').value) && 'at ' + esc(spotById($('#st-spot').value).name)].filter(Boolean).map((x) => ` (${x})`).join('')}.</p>
        <div class="dims" role="tablist">${Object.entries(DIMENSIONS).filter(([, d]) => anyTide || !d.needsTide).map(([k, d]) => `<button type="button" role="tab" class="chip${k === statsDim ? ' on' : ''}" data-dim="${k}" aria-selected="${k === statsDim}">${esc(d.label)}</button>`).join('')}</div>
        ${lureBlock}
        <p class="note">${skipped && D.needsWx ? `${plural(skipped, 'catch')} without weather data not included. ` : ''}${skipped && D.needsTide ? `${plural(skipped, 'catch')} without tide data (freshwater, inland or not looked up yet) not included. ` : ''}These are counts of fish caught, so a lure you use most will tend to show up most. ${sessions.length ? 'For a fairer comparison, see <b>Fish per hour</b> just below.' : 'Use <b>Start fishing</b> on the Now screen to get fish per hour.'}</p>
      </div>

      ${sessionsStatsCard()}

      ${!condCells ? `<div class="card"><h3>When you catch the most</h3><p class="sub" style="margin:0">Shows up once you've logged ${MIN_POOL} catches. You have ${list.length} so far.</p></div>` : ''}
      ${condCells ? `<div class="card"><h3>When you catch the most</h3><p class="sub">The most common condition across your catches.</p><div class="cond-grid">${condCells}</div></div>` : ''}

      ${bests ? `<div class="card"><h3>Personal bests</h3><p class="sub">Biggest of each species. Tap to open the catch.</p><ul class="best-list">${bests}</ul></div>` : ''}

      ${oneSpecies ? '' : `<div class="card"><h3>Catches by species</h3><p class="sub">&nbsp;</p>${barsHtml(spRows, Math.max(...spRows.map((x) => x[1])))}</div>`}

      <div class="card"><h3>Top lures</h3><p class="sub">Catches per lure or bait.</p>${barsHtml(lrRows, Math.max(...lrRows.map((x) => x[1])))}</div>
      ${tripsStatsCard()}`;
    body.querySelectorAll('.card .sub').forEach((el) => { if (el.innerHTML === '&nbsp;') el.remove(); });
  }

  $('#stats-body').addEventListener('click', (e) => {
    const d = e.target.closest('[data-dim]');
    if (d) { statsDim = d.dataset.dim; store('tl.statsDim', statsDim); statsSel = null; renderStats(); return; }
    const k = e.target.closest('.heat button');
    if (k) { statsSel = statsSel === k.dataset.k ? null : k.dataset.k; renderStats(); return; }
    const o = e.target.closest('[data-open]');
    if (o) showDetail(o.dataset.open);
    const tp = e.target.closest('[data-trip-open]');
    if (tp) showTrip(tp.dataset.tripOpen);
  });
  ['#st-range', '#st-species', '#st-spot'].forEach((sel) => $(sel).addEventListener('change', () => { statsSel = null; renderStats(); }));

  // ---------------------------------------------------------------- trips (Plan Trip)
  let trips = [];
  let tripDetailId = null;
  const tripById = (id) => trips.find((t) => t.id === id) || null;
  const HOUR_MS = 3600000;
  const BASE_GEAR = ['Fishing license', 'Rods and reels', 'Tackle box', 'Pliers and line cutter', 'Landing net', 'Water and snacks', 'Sunscreen and hat'];

  // Sunrise, sunset and civil dawn/dusk from the standard sunrise equation (no network needed).
  function sunTimes(ms, lat, lon) {
    const rad = Math.PI / 180; const J1970 = 2440588; const J2000 = 2451545; const dayMs = 86400000;
    const fromJ = (j) => (j + 0.5 - J1970) * dayMs;
    const lw = -lon * rad; const phi = lat * rad; const e = rad * 23.4397;
    const d = ms / dayMs - 0.5 + J1970 - J2000;
    const n = Math.round(d - 0.0009 - lw / (2 * Math.PI));
    const ds = 0.0009 + lw / (2 * Math.PI) + n;
    const M = rad * (357.5291 + 0.98560028 * ds);
    const L = M + rad * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M)) + rad * 102.9372 + Math.PI;
    const dec = Math.asin(Math.sin(e) * Math.sin(L));
    const Jnoon = J2000 + ds + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);
    const at = (h) => {
      const w = Math.acos((Math.sin(h * rad) - Math.sin(phi) * Math.sin(dec)) / (Math.cos(phi) * Math.cos(dec)));
      if (Number.isNaN(w)) return [null, null];
      const Jset = J2000 + 0.0009 + (w + lw) / (2 * Math.PI) + n + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);
      return [fromJ(Jnoon - (Jset - Jnoon)), fromJ(Jset)];
    };
    const [sunrise, sunset] = at(-0.833); const [dawn, dusk] = at(-6);
    return { sunrise, sunset, dawn, dusk };
  }

  // Rough California outline, used only to pick the regulations link.
  const CA_POLY = [[42, -124.4], [42, -120], [39, -120], [35, -114.6], [34.3, -114.1], [32.7, -114.7], [32.5, -117.1], [34.4, -120.6], [37, -122.6], [40.4, -124.5]];
  function inPoly(lat, lon, poly) { let inside = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [yi, xi] = poly[i]; const [yj, xj] = poly[j]; if ((yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside; } return inside; }

  const fmtRange = (a, b) => `${fmtTime(a)}–${fmtTime(b)}`;
  const fmtDay = (ms) => new Date(ms).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  const tripHours = (t) => Math.max(0.5, (t.end - t.start) / HOUR_MS);
  const tripPoint = (t) => ({ lat: t.lat, lon: t.lon });
  function tripCatches(t) {
    const grace = 30 * 60000;
    return catches.filter((c) => c.caughtAt >= t.start - grace && c.caughtAt <= t.end + grace &&
      ((t.spotId && c.spotId === t.spotId) || (c.location && distM(c.location, tripPoint(t)) <= 5000)));
  }
  function relDay(ms) {
    const d = Math.round((dayStart(ms) - dayStart(Date.now())) / 86400000);
    return d === 0 ? 'Today' : d === 1 ? 'Tomorrow' : d === -1 ? 'Yesterday' : d > 1 ? `In ${d} days` : `${-d} days ago`;
  }

  // ----- data from the network
  async function fetchHourly(t) {
    const now = Date.now(); const from = Math.floor(t.start / HOUR_MS) * HOUR_MS;
    let range;
    if (t.end <= now) { const past = Math.ceil((now - from) / 86400000) + 1; if (past > 92) throw new Error('too old'); range = `past_days=${past}&forecast_days=1`; }
    else { if (from - now > 16 * 86400000) return { fetchedAt: now, hours: [], tooFar: true }; range = 'past_days=1&forecast_days=16'; }
    const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${t.lat}&longitude=${t.lon}&hourly=${WX_VARS},precipitation_probability&${range}&timeformat=unixtime&timezone=GMT`);
    if (!r.ok) throw new Error('Weather service error ' + r.status);
    const h = (await r.json()).hourly; const hours = [];
    h.time.forEach((sec, i) => {
      const ms = sec * 1000; if (ms < from || ms >= t.end) return;
      hours.push({ t: ms, ...fromBlock(h, i), precipProb: (h.precipitation_probability || [])[i] ?? null, pressureTrend: trendAt(h, i) });
    });
    return { fetchedAt: now, hours };
  }
  async function fetchTripTide(t) {
    const st = nearestStations(await noaaStations(), tripPoint(t), 1)[0];
    if (!st || st.d > TIDE_MAX) return { none: true, distM: st ? Math.round(st.d) : null, fetchedAt: Date.now() };
    const ev = await noaaHiLo(st.id, t.start);
    const day = dailyCoefs(ev).find((x) => x.day === dayStart(t.start));
    const lo = dayStart(t.start) - 86400000; const hi = dayStart(t.end) + 2 * 86400000;
    return { stationId: st.id, stationName: st.name + (st.state ? ', ' + st.state : ''), state: st.state || '', distM: Math.round(st.d),
      coef: day ? day.coef : null, ev: ev.filter((e) => e.t >= lo && e.t <= hi), fetchedAt: Date.now() };
  }
  const tripTideShown = (t) => t.tide && !t.tide.none && tideShown({ tide: t.tide, spotId: t.spotId });

  // ----- turning the plan into catch-like hours, so the Stats conditions can score them
  function windowHours(t) {
    const out = []; const fc = t.forecast && t.forecast.hours && t.forecast.hours.length ? t.forecast.hours : null;
    if (fc) return fc;
    for (let ms = Math.floor(t.start / HOUR_MS) * HOUR_MS; ms < t.end; ms += HOUR_MS) out.push({ t: ms, noWx: true });
    return out;
  }
  function hourAsCatch(t, hr) {
    const pc = { caughtAt: hr.t, weather: hr.noWx ? null : hr, spotId: t.spotId };
    if (tripTideShown(t)) { const cur = tideAt(t.tide.ev, hr.t); if (cur) pc.tide = { stage: tideStage(cur, hr.t), rising: cur.rising, coef: t.tide.coef, distM: t.tide.distM }; }
    return pc;
  }
  const bucketOf = (d, c) => (d.needsWx && !c.weather) ? null : d.of(c);

  // Past catches to learn from: this spot first, then nearby, then everything.
  function tripHistory(t) {
    const at = tripPoint(t);
    const here = t.spotId ? catches.filter((c) => c.spotId === t.spotId) : catches.filter((c) => c.location && distM(c.location, at) <= 1000);
    if (here.length >= 5) return { list: here, label: t.spotId ? 'at this spot' : 'here' };
    const near = catches.filter((c) => c.location && distM(c.location, at) <= 25000);
    if (near.length >= 5) return { list: near, label: `within ${fmtDist(25000)}` };
    return { list: catches, label: 'everywhere you fish' };
  }
  // Each hour scores higher when its conditions are ones you've caught more fish in than chance would suggest.
  function hourScores(t, hours, hist) {
    const pools = Object.values(DIMENSIONS).map((d) => { const counts = countBy(hist, (c) => bucketOf(d, c)); return { d, n: [...counts.values()].reduce((a, v) => a + v, 0), counts }; }).filter((p) => p.n >= 3);
    return hours.map((hr) => {
      const pc = hourAsCatch(t, hr); let sum = 0; let k = 0;
      pools.forEach(({ d, n, counts }) => { const b = bucketOf(d, pc); if (!b) return; sum += ((counts.get(b) || 0) / n) * d.buckets().length; k++; });
      return k ? sum / k : null;
    });
  }
  // The top third of the trip's hours (1 to 3 hours), by score.
  function bestHours(t, hours, hist) {
    const scores = hist.list.length >= 5 ? hourScores(t, hours, hist.list) : hours.map(() => null);
    const topIdx = scores.map((v, i) => [v, i]).filter((x) => x[0] != null).sort((a, b) => b[0] - a[0]).slice(0, Math.min(3, Math.max(1, Math.round(hours.length / 3)))).map((x) => x[1]);
    return { scores, topIdx };
  }
  function lureRecs(t, hours, hist) {
    const pcs = hours.map((h) => hourAsCatch(t, h));
    const pool = t.species && t.species.length && hist.filter((c) => t.species.includes(c.species)).length >= 3 ? hist.filter((c) => t.species.includes(c.species)) : hist;
    const score = new Map(); const why = new Map();
    const bare = (b) => b.replace(/ \(.*\)/, '');
    const phrase = { sky: (b) => ({ Clear: 'Clear sky', 'Partly cloudy': 'Partly cloudy', Overcast: 'Overcast' }[b] || b), pressure: (b) => `${b} pressure`, temp: (b) => `${b} air`, wind: (b) => `${bare(b)} wind`, time: (b) => bare(b), tide: (b) => `${b} tide`, coef: (b) => `${bare(b)} tides`, moon: (b) => b };
    Object.entries(DIMENSIONS).forEach(([dk, d]) => {
      const bs = pcs.map((pc) => bucketOf(d, pc)).filter(Boolean); if (!bs.length) return;
      const b = ranked(countBy(bs, (x) => x))[0][0]; const p0 = (phrase[dk] || ((x) => x))(b); const key = p0.charAt(0).toUpperCase() + p0.slice(1).replace(/ (Sky|Pressure|Wind|Tide|Air)$/, (m) => m.toLowerCase());
      pool.forEach((c) => { if (bucketOf(d, c) !== b) return; score.set(c.bait, (score.get(c.bait) || 0) + nFish(c)); const w = why.get(c.bait) || new Map(); w.set(key, (w.get(key) || 0) + nFish(c)); why.set(c.bait, w); });
    });
    return { forSpecies: pool !== hist, recs: ranked(score).slice(0, 3).map(([lure]) => ({ lure, total: fishIn(pool.filter((c) => c.bait === lure)), reasons: ranked(why.get(lure)).slice(0, 3).map(([k, n]) => `${k} (${plural(n, 'fish')})`) })) };
  }
  function gearSuggestions(t, hours, recs, sun) {
    const have = new Set((t.gear || []).map((g) => g.text.toLowerCase()));
    const out = recs.map((r) => r.lure);
    const wx = hours.filter((h) => !h.noWx);
    if (wx.some((h) => (h.precipProb || 0) >= 40 || (h.precipMm || 0) > 0.2)) out.push('Rain jacket');
    if (wx.some((h) => h.tempC != null && h.tempC < 12)) out.push('Warm layers');
    if (wx.some((h) => h.tempC != null && h.tempC > 27)) out.push('Extra water');
    if (wx.some((h) => (h.windKmh || 0) > 25)) out.push('Windbreaker');
    if (sun && ((sun.sunrise && t.start < sun.sunrise) || (sun.sunset && t.end > sun.sunset))) out.push('Headlamp');
    if (tripTideShown(t)) out.push('Sand spike or rod holder');
    return [...new Set(out)].filter((x) => !have.has(x.toLowerCase()));
  }

  // ----- Trips list
  function renderTrips() {
    const el = $('#trips-list'); if (!el) return; updateTripNudge();
    const now = Date.now();
    const up = trips.filter((t) => t.end > now).sort((a, b) => a.start - b.start);
    const past = trips.filter((t) => t.end <= now).sort((a, b) => b.start - a.start);
    if (!trips.length) {
      el.innerHTML = `<div class="empty"><svg viewBox="0 0 24 24" aria-hidden="true" style="color:var(--lake-2)"><use href="#i-calendar"/></svg>
        <h2>No trips yet</h2><p>Plan a trip to get the forecast, tides, sunrise and the best hours to fish, plus the lures that have worked for you in those conditions.</p></div>`;
      return;
    }
    const card = (t) => {
      const isPast = t.end <= now; const d = new Date(t.start);
      let line2;
      if (isPast) { const n = fishIn(tripCatches(t)); line2 = `${plural(n, 'fish')} · ${round(n / tripHours(t), 1)} per hour`; }
      else {
        const wx = (t.forecast && t.forecast.hours) || [];
        if (wx.length) { const ts = wx.map((h) => h.tempC); const l = wxLabel({ code: Number(ranked(countBy(wx, (h) => String(h.code)))[0][0]), isDay: true });
          line2 = `${l.icon} ${U.temp(Math.min(...ts))} to ${U.temp(Math.max(...ts))} · wind up to ${U.wind(Math.max(...wx.map((h) => h.windKmh || 0)))}`; }
        else line2 = t.species && t.species.length ? `Targeting ${t.species.join(', ')}` : 'Tap to see the plan';
      }
      return `<button type="button" class="trip-card${isPast ? ' past' : ''}" data-trip="${t.id}">
        <span class="when"><span><small>${d.toLocaleDateString(undefined, { month: 'short' })}</small><b>${d.getDate()}</b></span></span>
        <span style="min-width:0"><h3>${esc(t.name)}</h3><div class="meta">${esc(new Date(t.start).toLocaleDateString(undefined, { weekday: 'short' }))} · ${fmtRange(t.start, t.end)}${isPast ? '' : ' · ' + relDay(t.start)}</div><div class="meta">${esc(line2)}</div></span>
      </button>`;
    };
    el.innerHTML = (up.length ? `<p class="trips-h">Upcoming</p>${up.map(card).join('')}` : '<p class="help" style="padding:8px 2px">No upcoming trips. Tap <strong>+ Plan a trip</strong>.</p>') +
      (past.length ? `<p class="trips-h">Past trips</p>${past.map(card).join('')}` : '');
  }
  $('#trips-list').addEventListener('click', (e) => { const b = e.target.closest('[data-trip]'); if (b) showTrip(b.dataset.trip); });
  $('#btn-new-trip').addEventListener('click', () => tripForm.open());

  // ----- One trip
  function renderTrip(id) {
    const t = tripById(id); if (!t) { if (!$('#sheet-trip').hidden) closeSheet(); return; }
    tripDetailId = id;
    const now = Date.now(); const isPast = t.end <= now; const sp = t.spotId && spotById(t.spotId);
    const hours = windowHours(t); const hasWx = hours.some((h) => !h.noWx);
    const hist = tripHistory(t);
    const sun = sunTimes(new Date(t.start).setHours(12, 0, 0, 0), t.lat, t.lon);
    const moon = moonPhase(t.start);
    const { scores, topIdx } = bestHours(t, hours, hist);
    const maxS = Math.max(0.0001, ...scores.filter((x) => x != null));
    const topSorted = [...topIdx].sort((a, b) => a - b);
    const bestText = topSorted.length ? topSorted.map((i) => fmtTime(hours[i].t)).join(', ') : null;
    const { recs, forSpecies } = lureRecs(t, hours, hist.list);
    const showTide = tripTideShown(t);
    const tc = tripCatches(t);
    const d = lastLoc ? distM(lastLoc, tripPoint(t)) : null;
    const state = (t.tide && t.tide.state) || (inPoly(t.lat, t.lon, CA_POLY) ? 'CA' : '');
    const species = t.species || [];
    $('#trip-title').textContent = isPast ? 'Past trip' : 'Trip plan';

    // after-trip summary
    let summary = '';
    if (isPast) {
      const n = fishIn(tc); const sp2 = ranked(countBy(tc, (c) => c.species)); const lu = ranked(countBy(tc, (c) => c.bait));
      const fc = t.forecast && t.forecast.hours && t.forecast.hours.length ? t.forecast.hours : null;
      const ac = t.actual && t.actual.hours && t.actual.hours.length ? t.actual.hours : null;
      const avg = (a, k) => a.reduce((s2, h) => s2 + (h[k] || 0), 0) / a.length;
      const sky = (a) => wxLabel({ code: Number(ranked(countBy(a, (h) => String(h.code)))[0][0]), isDay: true });
      const cmp = fc && ac ? `<table class="compare"><thead><tr><th></th><th>Forecast</th><th>Actual</th></tr></thead><tbody>
          <tr><td>Sky</td><td>${sky(fc).icon} ${esc(sky(fc).text)}</td><td>${sky(ac).icon} ${esc(sky(ac).text)}</td></tr>
          <tr><td>Avg temp</td><td>${U.temp(avg(fc, 'tempC'))}</td><td>${U.temp(avg(ac, 'tempC'))}</td></tr>
          <tr><td>Max wind</td><td>${U.wind(Math.max(...fc.map((h) => h.windKmh || 0)))}</td><td>${U.wind(Math.max(...ac.map((h) => h.windKmh || 0)))}</td></tr>
          <tr><td>Rain</td><td>${Math.max(...fc.map((h) => h.precipProb || 0))}% chance</td><td>${U.precip(ac.reduce((s2, h) => s2 + (h.precipMm || 0), 0))}</td></tr>
        </tbody></table>` : `<p class="note">${fc ? 'Actual conditions will be compared with the forecast when the app is online.' : 'No forecast was saved before this trip, so there is nothing to compare.'}</p>`;
      summary = `<div class="card" style="margin-bottom:12px"><h3>Trip summary</h3><p class="sub">Catches logged during the trip near this place.</p>
        <div class="tiles" style="margin-bottom:12px">
          <div class="stat"><b>${n}</b><span>Fish</span></div>
          <div class="stat"><b>${round(n / tripHours(t), 1)}</b><span>Fish per hour</span></div>
          <div class="stat"><b>${round(tripHours(t), 1)}</b><span>Hours</span></div>
          <div class="stat"><b>${lu.length ? esc(lu[0][0]) : '–'}</b><span>Top lure</span></div>
        </div>
        ${sp2.length ? `<p style="margin:0 0 10px">${sp2.map(([k, v]) => `${esc(k)} ×${v}`).join(' · ')}</p>` : ''}
        ${tc.length ? `<ul class="recent-list" style="margin-bottom:10px">${tc.slice(0, 6).map((c) => `<li><button type="button" data-open="${c.id}"><span class="t"><svg viewBox="0 0 32 32"><use href="#i-fish"/></svg></span><span style="min-width:0"><b>${esc(c.species)}</b><small>${esc(c.bait)} · ${fmtTime(c.caughtAt)}</small></span></button></li>`).join('')}</ul>` : ''}
        <h3 style="font-size:15px;margin:6px 0">Forecast vs actual</h3>${cmp}</div>`;
    }

    // hour by hour
    let hourCard;
    if (!hours.length) hourCard = '';
    else {
      const rows = hours.map((h, i) => {
        const sc = scores[i]; const wl = h.noWx ? null : wxLabel(h);
        return `<div class="hr${topIdx.includes(i) ? ' top' : ''}"><span class="t">${fmtTime(h.t).replace(':00', '')}</span><span>${wl ? wl.icon : ''}</span><span>${h.noWx ? '' : U.temp(h.tempC)}</span>
          <span class="w">${h.noWx ? '' : `${U.wind(h.windKmh)} ${compass(h.windDir)}`}${sc != null ? `<span class="sc" style="display:block;margin-top:4px;width:${Math.max(4, (sc / maxS) * 100)}%"></span>` : ''}</span>
          <span class="rain">${h.noWx || h.precipProb == null ? '' : `${h.precipProb}%`}</span></div>`;
      }).join('');
      const why = hist.list.length < 5 ? 'Log at least 5 catches and the app will rank these hours from your own history.' :
        `★ marks the hours whose conditions best match when you've caught fish ${hist.label}. The longer bar means a better match.`;
      hourCard = `<div class="card" style="margin-bottom:12px"><h3>Hour by hour</h3>
        ${bestText && !isPast ? `<p class="headline">Best hours: ${bestText}</p>` : ''}
        <p class="sub">${hasWx ? 'Forecast: sky, temperature, wind and chance of rain.' : (t.forecast && t.forecast.tooFar ? `The hourly forecast opens up about 16 days ahead (from ${fmtDay(t.start - 16 * 86400000)}). Tides, sun and moon are already filled in.` : isPast ? 'No forecast was saved for this trip.' : 'Forecast not loaded yet – it needs a connection.')} ${why}</p>
        <div class="hours">${rows}</div></div>`;
    }

    // tides
    let tideCard = '';
    if (showTide) {
      const tdDay = dayStart(t.start);
      const turns = t.tide.ev.filter((e) => e.t >= tdDay && e.t < dayStart(tdDay + 36 * HOUR_MS));
      const inWin = t.tide.ev.filter((e) => e.t >= t.start && e.t <= t.end);
      tideCard = `<div class="card" style="margin-bottom:12px"><h3>Tides</h3><p class="sub">${esc(t.tide.stationName)} · the shaded band is your trip.</p>
        ${tideChart(t.tide.ev, tdDay, now, { id: 'trip-tide', win: [t.start, t.end] })}<p class="tide-read" id="trip-tide-read">${inWin.length ? `During the trip: ${inWin.map((e) => `${e.type === 'H' ? 'high' : 'low'} at ${fmtTime(e.t)}`).join(', ')}.` : 'No high or low during the trip.'}</p>
        ${t.tide.coef != null ? `<p style="margin:8px 0 0"><b>Coefficient ${t.tide.coef}</b> – ${esc(coefLabel(t.tide.coef))}</p>` : ''}
        ${t.marine && t.marine.vals && t.marine.vals.length ? (() => { const v = t.marine.vals; const st = v.map((x) => x.seaTempC).filter((x) => x != null); const wv = v.map((x) => x.waveM).filter((x) => x != null); const pr = v.map((x) => x.periodS).filter((x) => x != null);
          const ft = (m) => imp() ? `${round(m * 3.28084, 1)} ft` : `${round(m, 1)} m`;
          return `<p style="margin:6px 0 0">${st.length ? `Water ${U.temp(Math.min(...st))}${Math.round(Math.min(...st)) !== Math.round(Math.max(...st)) ? `–${U.temp(Math.max(...st))}` : ''}` : ''}${st.length && wv.length ? ' · ' : ''}${wv.length ? `waves ${ft(Math.min(...wv))}${Math.min(...wv) !== Math.max(...wv) ? `–${ft(Math.max(...wv))}` : ''}${pr.length ? `, ${round(Math.max(...pr))} s apart` : ''}` : ''}</p>`; })() : ''}
        <table class="tide-table" style="margin-top:8px"><tbody>${turns.map((e) => `<tr><td>${e.type === 'H' ? 'High' : 'Low'}</td><td>${fmtTime(e.t)}</td><td>${tideH(e.h)}</td></tr>`).join('')}</tbody></table></div>`;
    }

    // target species
    let speciesCard = '';
    if (species.length) {
      const at = tripPoint(t);
      speciesCard = `<div class="card" style="margin-bottom:12px"><h3>Target species</h3>${species.map((s2) => {
        const all = catches.filter((c) => c.species === s2);
        const here = all.filter((c) => (t.spotId && c.spotId === t.spotId) || (c.location && distM(c.location, at) <= 1000));
        const near = all.filter((c) => c.location && distM(c.location, at) <= 25000);
        const src = here.length ? here : near.length ? near : all;
        const lures = ranked(countBy(src, (c) => c.bait)).slice(0, 3).map(([k, v]) => `${k} (${v})`);
        return `<div class="rec"><b>${esc(s2)}</b><small>${all.length ? `${here.length} caught here · ${near.length} within ${fmtDist(25000)} · ${all.length} in total${all[0] ? ` · last ${fmtDate(all[0].caughtAt)}` : ''}` : 'Not caught yet in your log.'}</small>
          ${lures.length ? `<small>Best lures ${here.length ? 'here' : near.length ? 'nearby' : 'anywhere'}: ${esc(lures.join(', '))}</small>` : ''}</div>`;
      }).join('')}</div>`;
    }

    // gear
    const sugg = isPast ? [] : gearSuggestions(t, hours, recs, sun);
    const gear = t.gear || [];
    const gearCard = `<div class="card" style="margin-bottom:12px"><h3>Gear checklist</h3><p class="sub">${gear.length ? `${gear.filter((g) => g.done).length} of ${gear.length} packed.` : 'Nothing on the list yet. Tap a suggestion or add your own.'}</p>
      <ul class="gear">${gear.map((g, i) => `<li class="${g.done ? 'done' : ''}"><input type="checkbox" data-gear="${i}" ${g.done ? 'checked' : ''} aria-label="Packed ${esc(g.text)}"><span>${esc(g.text)}</span><button type="button" class="x" data-gear-del="${i}" aria-label="Remove ${esc(g.text)}">×</button></li>`).join('')}</ul>
      ${sugg.length ? `<p class="sub" style="margin:0 0 6px">Suggested for this trip:</p><div class="chips">${sugg.map((x) => `<button type="button" class="chip add" data-gear-add="${esc(x)}">+ ${esc(x)}</button>`).join('')}</div>` : ''}
      <div class="gear-add"><input id="gear-new" placeholder="Add an item" autocomplete="off"><button type="button" class="btn sm" id="gear-add-btn" style="margin:0">Add</button></div></div>`;

    $('#trip-body').innerHTML = `
      <div class="trip-head"><h3>${esc(t.name)}</h3><p>${esc(fmtDay(t.start))} · ${fmtRange(t.start, t.end)} · ${relDay(t.start)}</p>
        <p>${sp ? 'Saved spot' : `${t.lat.toFixed(4)}, ${t.lon.toFixed(4)}`}${d != null ? ` · ${fromYou(d)}` : ''}</p></div>
      <div class="trip-actions">
        <a class="btn primary" href="${mapsLink(tripPoint(t))}" target="_blank" rel="noopener">Directions</a>
        <button type="button" class="btn" id="trip-share">Share plan</button>
        ${t.end > Date.now() ? '<button type="button" class="btn" id="trip-cal" style="grid-column:1 / -1">Add to calendar (with reminders)</button>' : ''}
      </div>
      ${summary}
      ${hourCard}
      <div class="card" style="margin-bottom:12px"><h3>Sun and moon</h3>
        <div class="sun-grid">
          <div class="cond-cell"><span>First light</span><b>${sun.dawn ? fmtTime(sun.dawn) : '–'}</b></div>
          <div class="cond-cell"><span>Sunrise</span><b>${sun.sunrise ? fmtTime(sun.sunrise) : '–'}</b></div>
          <div class="cond-cell"><span>Sunset</span><b>${sun.sunset ? fmtTime(sun.sunset) : '–'}</b></div>
          <div class="cond-cell"><span>Last light</span><b>${sun.dusk ? fmtTime(sun.dusk) : '–'}</b></div>
        </div>
        <p style="margin:10px 0 0">${moon.icon} ${esc(moon.name)}, ${moon.illum}% lit</p></div>
      ${tideCard}
      <div class="card" style="margin-bottom:12px"><h3>Lures to bring</h3>
        <p class="sub">${hist.list.length ? `From your catches ${hist.label}${forSpecies ? ' of your target species' : ''}, in conditions like this trip's.` : 'Log some catches and the app will suggest lures from your own history.'}</p>
        ${recs.length ? recs.map((r) => `<div class="rec"><b>${esc(r.lure)}</b><small>${esc(r.reasons.join('; '))}</small></div>`).join('') : (hist.list.length ? '<p class="sub" style="margin:0">Not enough matching catches yet.</p>' : '')}</div>
      ${speciesCard}
      ${gearCard}
      <div class="card" style="margin-bottom:12px"><h3>Regulations</h3>
        <p style="margin:0 0 8px">Carry your fishing license, and check size limits, bag limits, seasons and closures${species.length ? ` for ${esc(species.join(', '))}` : ''} before you go. Rules change during the year.</p>
        <div class="stack">
          ${state === 'CA' ? '<a class="btn" href="https://wildlife.ca.gov/regulations" target="_blank" rel="noopener">California regulations (CDFW)</a>' : ''}
          <a class="btn" href="https://www.takemefishing.org/select-a-state/" target="_blank" rel="noopener">Licenses and regulations by state</a>
        </div></div>
      ${t.notes ? `<div class="card notes-card" style="margin-bottom:12px"><h3 style="margin-bottom:6px">Notes</h3><p>${esc(t.notes)}</p></div>` : ''}
      <p class="help small">${t.forecast && t.forecast.fetchedAt ? `Forecast updated ${fmtDate(t.forecast.fetchedAt)}, ${fmtTime(t.forecast.fetchedAt)}.` : ''}${showTide ? ' Tide predictions from NOAA.' : ''}</p>`;
    if (showTide) bindChart(t.tide.ev, dayStart(t.start), 'trip-tide');
  }

  async function refreshTrip(t) {
    if (!navigator.onLine) return;
    const now = Date.now(); let changed = false;
    const upcoming = t.end > now;
    if (upcoming && (!t.forecast || now - t.forecast.fetchedAt > HOUR_MS || (!t.forecast.hours.length && t.start - now < 16 * 86400000))) {
      try { const f = await fetchHourly(t); if (f.hours.length || !t.forecast || !t.forecast.hours.length) { t.forecast = f; changed = true; } } catch { /* keep the saved copy */ }
    }
    if (!t.tide) { try { t.tide = await fetchTripTide(t); changed = true; } catch { /* retry next time */ } }
    if (tripTideShown(t) && t.start - now < 7 * 86400000 && (upcoming || !t.marine) && (!t.marine || now - t.marine.fetchedAt > HOUR_MS)) {
      try { const m = await fetchMarine(t.lat, t.lon, t.start, t.end); const vals = []; for (let ms = Math.floor(t.start / HOUR_MS) * HOUR_MS; ms < t.end; ms += HOUR_MS) { const v = m.at(ms); if (v) vals.push(v); }
        if (vals.length) { t.marine = { fetchedAt: now, vals }; changed = true; } } catch { /* optional */ }
    }
    if (!upcoming && !t.actual) { try { const a = await fetchHourly(t); if (a.hours.length) { t.actual = a; changed = true; } } catch { /* too old or offline */ } }
    if (changed) { await DB.putTrip(t); renderTrips(); if (tripDetailId === t.id && !$('#sheet-trip').hidden) renderTrip(t.id); }
  }
  function showTrip(id) { const t = tripById(id); if (!t) return; renderTrip(id); openSheet($('#sheet-trip')); refreshTrip(t); }

  async function saveTrip(t) { t.updatedAt = Date.now(); await DB.putTrip(t); const i = trips.findIndex((x) => x.id === t.id); if (i >= 0) trips[i] = t; else trips.push(t); }
  $('#trip-body').addEventListener('click', async (e) => {
    const t = tripById(tripDetailId); if (!t) return;
    const o = e.target.closest('[data-open]'); if (o) { showDetail(o.dataset.open); return; }
    const add = e.target.closest('[data-gear-add]');
    if (add) { t.gear = [...(t.gear || []), { text: add.dataset.gearAdd, done: false }]; await saveTrip(t); renderTrip(t.id); return; }
    const del = e.target.closest('[data-gear-del]');
    if (del) { t.gear.splice(Number(del.dataset.gearDel), 1); await saveTrip(t); renderTrip(t.id); return; }
    if (e.target.id === 'gear-add-btn') { const v = $('#gear-new').value.trim(); if (!v) return; t.gear = [...(t.gear || []), { text: v, done: false }]; await saveTrip(t); renderTrip(t.id); $('#gear-new').focus(); return; }
    if (e.target.id === 'trip-share') shareTrip(t);
    if (e.target.id === 'trip-cal') addToCalendar(t);
  });
  $('#trip-body').addEventListener('change', async (e) => {
    const cb = e.target.closest('[data-gear]'); if (!cb) return;
    const t = tripById(tripDetailId); t.gear[Number(cb.dataset.gear)].done = cb.checked; await saveTrip(t); renderTrip(t.id);
  });
  $('#trip-body').addEventListener('keydown', (e) => { if (e.target.id === 'gear-new' && e.key === 'Enter') { e.preventDefault(); $('#gear-add-btn').click(); } });
  $('#btn-trip-edit').addEventListener('click', () => { const t = tripById(tripDetailId); if (t) tripForm.open(t); });

  function tripText(t) {
    const hours = windowHours(t); const hist = tripHistory(t); const wx = hours.filter((h) => !h.noWx);
    const sun = sunTimes(new Date(t.start).setHours(12, 0, 0, 0), t.lat, t.lon);
    const best = [...bestHours(t, hours, hist).topIdx].sort((a, b) => a - b).map((i) => fmtTime(hours[i].t));
    const lines = [`Fishing trip: ${t.name}`, `${fmtDay(t.start)}, ${fmtRange(t.start, t.end)}`];
    if (best.length) lines.push(`Best hours: ${best.join(', ')}`);
    if (wx.length) { const ts = wx.map((h) => h.tempC); lines.push(`Forecast: ${U.temp(Math.min(...ts))}–${U.temp(Math.max(...ts))}, wind up to ${U.wind(Math.max(...wx.map((h) => h.windKmh || 0)))}, rain chance up to ${Math.max(...wx.map((h) => h.precipProb || 0))}%`); }
    if (tripTideShown(t)) { const inWin = t.tide.ev.filter((e) => e.t >= t.start && e.t <= t.end); lines.push(`Tide: ${inWin.length ? inWin.map((e) => `${e.type === 'H' ? 'high' : 'low'} ${fmtTime(e.t)}`).join(', ') : 'no turn during the trip'}${t.tide.coef != null ? ` (coefficient ${t.tide.coef})` : ''}`); }
    if (sun.sunrise) lines.push(`Sunrise ${fmtTime(sun.sunrise)}, sunset ${fmtTime(sun.sunset)}`);
    const recs = lureRecs(t, hours, hist.list).recs; if (recs.length) lines.push(`Lures: ${recs.map((r) => r.lure).join(', ')}`);
    if (t.species && t.species.length) lines.push(`Targeting: ${t.species.join(', ')}`);
    if (t.gear && t.gear.length) lines.push(`Gear: ${t.gear.map((g) => g.text).join(', ')}`);
    lines.push(`Directions: ${mapsLink(tripPoint(t))}`);
    return lines.join('\n');
  }
  // A calendar event with two reminders (the evening before and an hour before). The phone's calendar does the reminding.
  async function addToCalendar(t) {
    const z = (ms) => new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const escI = (x) => String(x).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/[,;]/g, (m) => '\\' + m);
    const eve = new Date(t.start); eve.setDate(eve.getDate() - 1); eve.setHours(19, 0, 0, 0);
    const before = Math.max(60, Math.round((t.start - eve.getTime()) / 60000));
    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Fishamongus//Trip//EN', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT',
      `UID:${t.id}@fishamongus`, `DTSTAMP:${z(Date.now())}`, `DTSTART:${z(t.start)}`, `DTEND:${z(t.end)}`,
      `SUMMARY:${escI('Fishing: ' + t.name)}`, `GEO:${t.lat};${t.lon}`, `LOCATION:${escI(`${t.lat.toFixed(5)}, ${t.lon.toFixed(5)}`)}`,
      `DESCRIPTION:${escI(tripText(t) + '\nOpen Fishamongus! for the updated forecast and tides.')}`,
      'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${escI('Fishing trip tomorrow: check the forecast in Fishamongus!')}`, `TRIGGER:-PT${before}M`, 'END:VALARM',
      'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${escI('Fishing trip in 1 hour')}`, 'TRIGGER:-PT60M', 'END:VALARM',
      'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    const ok = await deliverFile(new Blob([ics], { type: 'text/calendar' }), `fishing-trip-${new Date(t.start).toISOString().slice(0, 10)}.ics`);
    if (ok) toast('Calendar file ready – open it to add the trip');
  }
  // In-app reminder for a trip in the next 24 hours.
  function updateTripNudge() {
    const el = $('#trip-nudge'); if (!el) return; const now = Date.now();
    const t = trips.filter((x) => x.start > now && x.start - now < 24 * HOUR_MS && store('tl.tripNudgeHidden') !== x.id).sort((a, b) => a.start - b.start)[0];
    el.hidden = !t; if (!t) return; el.dataset.trip = t.id;
    const wx = (t.forecast && t.forecast.hours || []).filter((h) => h.tempC != null);
    $('#trip-nudge-text').innerHTML = `<b>${esc(relDay(t.start))} at ${fmtTime(t.start)}:</b> ${esc(t.name)}.${wx.length ? ` Forecast ${U.temp(Math.min(...wx.map((h) => h.tempC)))}–${U.temp(Math.max(...wx.map((h) => h.tempC)))}, wind up to ${U.wind(Math.max(...wx.map((h) => h.windKmh || 0)))}.` : ''} Check the gear list before you go.`;
  }
  $('#trip-nudge-go').addEventListener('click', () => showTrip($('#trip-nudge').dataset.trip));
  $('#trip-nudge-later').addEventListener('click', () => { store('tl.tripNudgeHidden', $('#trip-nudge').dataset.trip); updateTripNudge(); });
  async function shareTrip(t) {
    const text = tripText(t);
    if (navigator.share) { try { await navigator.share({ title: t.name, text }); return; } catch (err) { if (err && err.name === 'AbortError') return; } }
    try { await navigator.clipboard.writeText(text); toast('Trip plan copied – paste it into a message'); } catch { toast('Sharing is not available here'); }
  }

  // ----- Plan / edit form
  const tripForm = (() => {
    let editing = null; let picked = [];
    const OTHER_PT = '__coords'; const GPS = '__gps';
    function speciesChips() {
      $('#tr-species-chips').innerHTML = picked.map((s2) => `<button type="button" class="chip on" data-rm="${esc(s2)}">${esc(s2)}<span class="rm" aria-hidden="true">×</span></button>`).join('');
      const used = [...new Set(catches.map((c) => c.species))].filter((x) => !KNOWN_SPECIES.has(x)).sort((a, b) => a.localeCompare(b));
      $('#tr-species-add').innerHTML = '<option value="">Add a species…</option>' + (used.length ? `<optgroup label="Your other species">${used.map((v) => `<option>${esc(v)}</option>`).join('')}</optgroup>` : '') +
        SPECIES_GROUPS.map(([label, list]) => `<optgroup label="${esc(label)}">${list.filter((v) => !picked.includes(v)).map((v) => `<option>${esc(v)}</option>`).join('')}</optgroup>`).join('');
    }
    function whereHint() {
      const v = $('#tr-where').value; $('#tr-coords').hidden = v !== OTHER_PT;
      $('#tr-where-hint').textContent = v === GPS ? 'Uses where you are when you save.' : v === OTHER_PT ? 'Enter the latitude and longitude of the place.' : '';
      if (!editing && v && v !== GPS && v !== OTHER_PT && !picked.length) {
        const top = ranked(countBy(catches.filter((c) => c.spotId === v), (c) => c.species)).slice(0, 2).map((x) => x[0]);
        if (top.length) { picked = top; speciesChips(); }
      }
    }
    function open(t, pre) {
      editing = t || null; $('#trip-form').reset(); $('#tr-error').textContent = '';
      $('#trip-form-title').textContent = t ? 'Edit trip' : 'Plan a trip'; $('#tr-delete').hidden = !t;
      const opts = spots.map((sp) => ({ sp, d: lastLoc ? distM(lastLoc, sp) : null })).sort((a, b) => (b.sp.id === (t && t.spotId) ? 1 : 0) - (a.sp.id === (t && t.spotId) ? 1 : 0) || a.sp.name.localeCompare(b.sp.name));
      $('#tr-where').innerHTML = (opts.length ? `<optgroup label="Saved spots">${opts.map(({ sp }) => `<option value="${sp.id}">${esc(sp.name)}</option>`).join('')}</optgroup>` : '') +
        `<option value="${GPS}">My current location</option><option value="${OTHER_PT}">Enter coordinates…</option>`;
      if (t) { $('#tr-where').value = t.spotId && spotById(t.spotId) ? t.spotId : OTHER_PT; $('#tr-lat').value = t.lat; $('#tr-lon').value = t.lon; }
      else if (pre && pre.lat != null) { $('#tr-where').value = OTHER_PT; $('#tr-lat').value = round(pre.lat, 6); $('#tr-lon').value = round(pre.lon, 6); }
      else $('#tr-where').value = opts.length ? opts[0].sp.id : GPS;
      const start = t ? new Date(t.start) : (() => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(6, 0, 0, 0); return d; })();
      const end = t ? new Date(t.end) : new Date(start.getTime() + 5 * HOUR_MS);
      $('#tr-date').value = toLocalInput(start).slice(0, 10); $('#tr-start').value = toLocalInput(start).slice(11); $('#tr-end').value = toLocalInput(end).slice(11);
      $('#tr-notes').value = t ? t.notes || '' : '';
      picked = t ? [...(t.species || [])] : [];
      speciesChips(); whereHint();
      openSheet($('#sheet-trip-form'));
    }
    $('#tr-where').addEventListener('change', whereHint);
    $('#tr-species-add').addEventListener('change', (e) => { const v = e.target.value; if (v && !picked.includes(v)) picked.push(v); speciesChips(); });
    $('#tr-species-chips').addEventListener('click', (e) => { const b = e.target.closest('[data-rm]'); if (b) { picked = picked.filter((x) => x !== b.dataset.rm); speciesChips(); } });
    $('#trip-form').addEventListener('submit', async (e) => {
      e.preventDefault(); const err = $('#tr-error'); err.textContent = '';
      const where = $('#tr-where').value; let lat; let lon; let spotId = null; let name;
      if (where === GPS) { err.innerHTML = '<span class="spin"></span>Getting your location…'; try { const p = await getPosition(); rememberLoc(p); lat = p.lat; lon = p.lon; } catch (x) { err.textContent = x.message; return; } err.textContent = ''; name = 'Fishing trip'; }
      else if (where === OTHER_PT) { lat = num($('#tr-lat').value); lon = num($('#tr-lon').value); if (lat == null || lon == null || Math.abs(lat) > 90 || Math.abs(lon) > 180) { err.textContent = 'Enter a valid latitude and longitude.'; return; } name = editing && !editing.spotId ? editing.name : 'Fishing trip'; }
      else { const sp = spotById(where); lat = sp.lat; lon = sp.lon; spotId = sp.id; name = sp.name; }
      const date = $('#tr-date').value; const st = $('#tr-start').value; const en = $('#tr-end').value;
      if (!date || !st || !en) { err.textContent = 'Pick a date, a start time and an end time.'; return; }
      const start = new Date(`${date}T${st}`).getTime(); let end = new Date(`${date}T${en}`).getTime();
      if (!(start > 0) || !(end > 0)) { err.textContent = 'Check the date and times.'; return; }
      if (end <= start) end += 86400000;
      if (end - start > 24 * HOUR_MS) { err.textContent = 'Keep a trip to 24 hours or less.'; return; }
      const now = Date.now();
      const base = editing || { id: uid(), createdAt: now, gear: BASE_GEAR.map((text) => ({ text, done: false })) };
      const moved = !editing || editing.lat !== lat || editing.lon !== lon || editing.start !== start || editing.end !== end;
      const t = { ...base, name, spotId, lat, lon, start, end, species: [...picked], notes: $('#tr-notes').value.trim(), ...(moved ? { forecast: null, tide: null, actual: null } : {}) };
      await saveTrip(t);
      const wasNew = !editing; closeSheet();
      renderTrips(); toast(wasNew ? 'Trip planned' : 'Trip updated');
      if (wasNew) setTimeout(() => showTrip(t.id), 50); else { renderTrip(t.id); refreshTrip(t); }
    });
    $('#tr-delete').addEventListener('click', async () => {
      if (!editing || !(await askConfirm(`Delete the trip to ${editing.name}? Catches from it stay in your log.`))) return;
      await DB.delTrip(editing.id); trips = trips.filter((x) => x.id !== editing.id);
      while (sheetStack.length) hideTop();
      renderTrips(); toast('Trip deleted');
    });
    return { open };
  })();

  // ---------------------------------------------------------------- fishing sessions
  // "Start fishing" … "End": the app then knows how long you fished and which lure was on when,
  // so Stats can show fish per hour instead of raw counts.
  const activeSession = () => sessions.find((x) => !x.end) || null;
  const sessionCatches = (s) => catches.filter((c) => c.sessionId === s.id);
  const sessionEnd = (s) => s.end || Date.now();
  const curLure = (s) => (s && s.lures && s.lures.length ? s.lures[s.lures.length - 1] : null);
  const lureDesc = (l) => (l ? [l.color, l.size].filter(Boolean).join(', ') : '');
  // A catch belongs to the running session when it was caught after the session started.
  function sessionFor(at) { const s = activeSession(); return s && at >= s.start - 5 * 60000 && at <= Date.now() + 5 * 60000 ? s : null; }
  async function saveSession(s) {
    s.updatedAt = Date.now(); await DB.putSession(s);
    const i = sessions.findIndex((x) => x.id === s.id); if (i >= 0) sessions[i] = s; else sessions.unshift(s);
  }
  function paintSessionViews() { renderNow(); paintSessionBar(); }
  async function startSession() {
    if (activeSession()) return;
    const now = Date.now(); const last = catches[0];
    const s = { id: uid(), start: now, end: null, lat: null, lon: null, spotId: null, createdAt: now,
      lures: last ? [{ bait: last.bait, color: last.lureColor || '', size: last.lureSize || '', at: now }] : [] };
    const L = lastLoc && now - lastLoc.at < 30 * 60000 ? lastLoc : null;
    if (L) { s.lat = L.lat; s.lon = L.lon; const m = matchSpot(L); s.spotId = m ? m.spot.id : null; }
    await saveSession(s); paintSessionViews();
    if (s.lures.length) toast(`Session started with ${s.lures[0].bait}`, { label: 'Change lure', fn: () => lurePicker.open() });
    else lurePicker.open();
    getPosition().then(async (P) => {
      rememberLoc(P); const cur = sessions.find((x) => x.id === s.id); if (!cur) return;
      cur.lat = P.lat; cur.lon = P.lon; const m = matchSpot(P); if (m) cur.spotId = m.spot.id;
      await saveSession(cur); paintSessionViews();
    }).catch(() => {});
  }
  async function setSessionLure(l, at = Date.now()) {
    const s = activeSession(); if (!s || !l || !l.bait) return;
    const c = curLure(s);
    if (c && c.bait === l.bait && (c.color || '') === (l.color || '') && (c.size || '') === (l.size || '')) return;
    s.lures = [...(s.lures || []), { bait: l.bait, color: l.color || '', size: l.size || '', at: Math.max(at, s.start) }].sort((a, b) => a.at - b.at);
    await saveSession(s);
  }
  // A catch on a different lure means you switched since the last change or catch: we split that gap down the middle.
  async function sessionCaught(s, rec) {
    const c = curLure(s); const same = c && c.bait === rec.bait;
    if (!same) {
      const prev = Math.max(s.start, c ? c.at : s.start, ...sessionCatches(s).filter((x) => x.id !== rec.id && x.caughtAt <= rec.caughtAt).map((x) => x.caughtAt));
      const t = Math.max(prev, rec.caughtAt);
      await setSessionLure({ bait: rec.bait, color: rec.lureColor, size: rec.lureSize }, c ? Math.max(c.at + 1, Math.round((prev + t) / 2)) : s.start);
    } else if ((c.color || '') !== (rec.lureColor || '') || (c.size || '') !== (rec.lureSize || '')) await setSessionLure({ bait: rec.bait, color: rec.lureColor, size: rec.lureSize }, Math.max(c.at + 1, rec.caughtAt));
    if (!s.spotId && rec.spotId) { s.spotId = rec.spotId; await saveSession(s); }
    if (s.lat == null && rec.location) { s.lat = rec.location.lat; s.lon = rec.location.lon; await saveSession(s); }
    paintSessionViews();
  }
  async function endSession() {
    const s = activeSession(); if (!s) return;
    const cs = sessionCatches(s); const now = Date.now();
    if (now - s.start < 5 * 60000 && !cs.length) {
      await DB.delSession(s.id); sessions = sessions.filter((x) => x.id !== s.id); paintSessionViews();
      toast('Session discarded – under 5 minutes and no fish'); return;
    }
    let end = now; let forgot = false;
    // Left running by mistake: end it 30 minutes after the last thing you did.
    if (now - s.start > 12 * HOUR_MS) {
      const lastAct = Math.max(s.start, ...cs.map((c) => c.caughtAt), ...(s.lures || []).map((l) => l.at));
      end = Math.min(now, Math.max(lastAct + 30 * 60000, s.start + HOUR_MS)); forgot = true;
    }
    s.end = end; await saveSession(s); paintSessionViews(); if ($('#view-stats').classList.contains('active')) renderStats();
    const n = fishIn(cs); const h = (end - s.start) / HOUR_MS;
    toast(`${forgot ? `Ended at ${fmtTime(end)} (it ran over 12 h). ` : ''}${durText(end - s.start)} · ${plural(n, 'fish')}${h >= 0.25 ? ` · ${round(n / h, 1)} per hour` : ''}`,
      { label: 'Undo', fn: async () => { s.end = null; await saveSession(s); paintSessionViews(); } });
  }
  // Time each lure was in the water during a session, in ms.
  function lureTime(s) {
    const out = new Map(); const ls = (s.lures || []).slice().sort((a, b) => a.at - b.at); const end = sessionEnd(s);
    ls.forEach((l, i) => { const a = Math.max(l.at, s.start); const b = Math.min(end, i + 1 < ls.length ? ls[i + 1].at : end); if (b > a) out.set(l.bait, (out.get(l.bait) || 0) + (b - a)); });
    return out;
  }
  function paintSessionBar() {
    const s = activeSession(); const onNow = $('#view-now').classList.contains('active');
    const show = !!s && !onNow; $('#session-bar').hidden = !show; document.body.classList.toggle('has-session-bar', show);
    if (!s) return;
    const l = curLure(s);
    $('#sb-text').textContent = `Fishing ${durText(Date.now() - s.start)} · ${plural(fishIn(sessionCatches(s)), 'fish')}${l ? ' · ' + l.bait : ''}`;
  }
  $('#sb-open').addEventListener('click', () => showView('now'));
  $('#sb-end').addEventListener('click', endSession);
  setInterval(() => { if (!activeSession()) return; paintSessionBar(); const e = $('#ses-elapsed'); if (e) e.textContent = durText(Date.now() - activeSession().start); }, 30000);

  // ----- lure picker (what's on the line right now)
  const lurePicker = (() => {
    const sel = $('#lp-select'); const other = $('#lp-other');
    function paint() { const v = other.value.trim(); $$('#lp-chips .chip').forEach((x) => x.classList.toggle('on', x.dataset.lp === v)); }
    function set(v) {
      const listed = v && [...sel.options].some((o) => o.value === v && o.value !== OTHER);
      sel.value = !v ? '' : listed ? v : OTHER; other.hidden = !v || listed; other.value = v || ''; sel.classList.toggle('placeholder', !sel.value); $('#lp-error').textContent = ''; paint();
    }
    function open() {
      const used = []; catches.forEach((c) => { if (c.bait && !used.includes(c.bait)) used.push(c.bait); });
      const mine = used.filter((v) => !KNOWN_LURES.has(v)).sort((a, b) => a.localeCompare(b));
      const opt = (v) => `<option value="${esc(v)}">${esc(v)}</option>`;
      sel.innerHTML = '<option value="" disabled>Choose a lure or bait…</option>' + (mine.length ? `<optgroup label="Your other lures">${mine.map(opt).join('')}</optgroup>` : '') +
        LURE_GROUPS.map(([label, list]) => `<optgroup label="${esc(label)}">${list.map(opt).join('')}</optgroup>`).join('') + `<optgroup label="Not listed"><option value="${OTHER}">Other – type it in…</option></optgroup>`;
      $('#lp-chips').innerHTML = used.slice(0, 6).map((v) => `<button type="button" class="chip" data-lp="${esc(v)}">${esc(v)}</button>`).join('');
      const c = curLure(activeSession());
      set(c ? c.bait : ''); $('#lp-color').value = c ? c.color || '' : ''; $('#lp-size').value = c ? c.size || '' : '';
      openSheet($('#sheet-lure'));
    }
    sel.addEventListener('change', () => { if (sel.value === OTHER) { other.value = ''; other.hidden = false; other.focus(); paint(); } else set(sel.value); });
    other.addEventListener('input', paint);
    $('#lp-chips').addEventListener('click', (e) => { const x = e.target.closest('[data-lp]'); if (x) set(x.dataset.lp); });
    $('#lure-form').addEventListener('submit', async (e) => {
      e.preventDefault(); const bait = other.value.trim();
      if (!bait) { $('#lp-error').textContent = 'Choose a lure or bait.'; return; }
      await setSessionLure({ bait, color: $('#lp-color').value.trim(), size: $('#lp-size').value.trim() });
      closeSheet(); paintSessionViews(); toast(`Now fishing ${bait}`);
    });
    return { open };
  })();

  // ---------------------------------------------------------------- quick catch
  // Your most recent fish-and-lure pairs (the lure that's on now first). One tap saves; details can come later.
  function quickCombos() {
    const out = []; const seen = new Set();
    const l = curLure(activeSession());
    if (l && catches.length) {
      const sp = (catches.find((c) => c.bait === l.bait) || catches[0]).species;
      out.push({ species: sp, bait: l.bait, lureColor: l.color || '', lureSize: l.size || '' }); seen.add(sp + '|' + l.bait);
    }
    for (const c of catches) {
      const k = c.species + '|' + c.bait; if (seen.has(k)) continue; seen.add(k);
      out.push({ species: c.species, bait: c.bait, lureColor: c.lureColor || '', lureSize: c.lureSize || '' }); if (out.length >= 3) break;
    }
    return out.slice(0, 3);
  }
  const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);
  let quickBusy = false;
  async function quickSave(combo) {
    if (quickBusy) return; quickBusy = true;
    toast(`Saving ${combo.species}…`);
    try {
      const now = Date.now(); let loc = null;
      try { loc = await withTimeout(getPosition(), 12000); rememberLoc(loc); }
      catch { if (lastLoc && now - lastLoc.at < 15 * 60000) loc = { lat: lastLoc.lat, lon: lastLoc.lon, accuracy: null, source: 'last', at: lastLoc.at }; }
      let weather = null;
      if (loc) { try { weather = await withTimeout(fetchWeather(loc.lat, loc.lon, now), 8000); } catch { /* added later */ } }
      const m = loc ? matchSpot(loc) : null; const ses = sessionFor(now);
      const rel = { released: true, kept: false }[store('tl.lastReleased')] ?? null;
      const rec = { id: uid(), createdAt: now, updatedAt: now, caughtAt: now, species: combo.species, bait: combo.bait, lureColor: combo.lureColor || '', lureSize: combo.lureSize || '',
        lengthCm: null, weightKg: null, released: rel, notes: '', photo: null, thumb: null, extraPhotos: [], count: 1,
        location: loc, weather, weatherTries: 0, tide: undefined, marine: undefined, tideTries: 0,
        spotId: m ? m.spot.id : (ses && ses.spotId) || null, quick: true };
      if (ses) rec.sessionId = ses.id;
      await DB.put(rec);
      if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
      await reload(); if (ses) await sessionCaught(ses, rec);
      toast(`${combo.species} logged 🎣${loc ? '' : ' (no location)'}`, { label: 'Add details', fn: () => { const c = catches.find((x) => x.id === rec.id); if (c) form.open(c); } });
      backfillWeather().then(backfillTides).then(backfillMarine).catch(() => {});
    } catch (err) { toast('Could not save: ' + ((err && err.message) || 'storage error')); }
    finally { quickBusy = false; }
  }

  // ---------------------------------------------------------------- Now (home screen)
  // Conditions where you are, lures that have worked for you in conditions like these, and your next trip.
  let nowState = (() => { try { return JSON.parse(store('tl.now') || 'null'); } catch { return null; } })();
  let nowBusy = false; let nowErr = null;
  async function refreshNow(force) {
    if (nowBusy) return;
    if (!force && nowState && Date.now() - nowState.at < 10 * 60000) { renderNow(); return; }
    nowBusy = true; nowErr = null; renderNow();
    try {
      let loc;
      try { loc = await getPosition(); rememberLoc(loc); }
      catch (e) { if (lastLoc) loc = { lat: lastLoc.lat, lon: lastLoc.lon, source: 'last', at: lastLoc.at }; else throw e; }
      if (!navigator.onLine) throw new Error('offline');
      const at = Date.now(); const st = { at, loc: { lat: loc.lat, lon: loc.lon, source: loc.source, accuracy: loc.accuracy ?? null } };
      const start = Math.floor(at / HOUR_MS) * HOUR_MS; const pt = { lat: loc.lat, lon: loc.lon, start, end: start + 3 * HOUR_MS };
      const [wx, tide, fc] = await Promise.allSettled([fetchWeather(loc.lat, loc.lon, at), tideFor(loc, at), fetchHourly(pt)]);
      st.wx = wx.status === 'fulfilled' ? wx.value : null;
      st.tide = tide.status === 'fulfilled' ? tide.value : null;
      st.forecast = fc.status === 'fulfilled' ? fc.value : null;
      if (!st.wx && !st.tide && !st.forecast) throw new Error('offline');
      const m = matchSpot(loc);
      if (st.tide && tideShown({ tide: st.tide, spotId: m ? m.spot.id : null })) {
        const [mar, tt] = await Promise.allSettled([marineFor(loc, at), fetchTripTide(pt)]);
        st.marine = mar.status === 'fulfilled' ? mar.value : null; st.tripTide = tt.status === 'fulfilled' ? tt.value : null;
      }
      nowState = st; store('tl.now', JSON.stringify(st));
    } catch (e) { nowErr = e && e.message === 'offline' ? 'offline' : (e && e.message) || 'error'; }
    finally { nowBusy = false; renderNow(); }
  }
  function nowPlace(loc) {
    const m = matchSpot(loc); if (m) return { name: m.spot.name, sub: "You're at this spot", spotId: m.spot.id };
    const near = spots.map((sp) => ({ sp, d: distM(loc, sp) })).sort((a, b) => a.d - b.d)[0];
    if (near && near.d < 5000) return { name: `Near ${near.sp.name}`, sub: `${fmtDist(near.d)} away`, spotId: null };
    return { name: 'Where you are', sub: `${loc.lat.toFixed(4)}, ${loc.lon.toFixed(4)}`, spotId: null };
  }
  function renderNowSession() {
    const s = activeSession(); const combos = quickCombos();
    const today = catches.filter((c) => c.caughtAt >= dayStart(Date.now()));
    const quick = combos.length ? `<div class="quick"><h4>Quick catch <small>– one tap saves it, add details later</small></h4><div class="quick-grid">${combos.map((c, i) =>
      `<button type="button" class="quick-btn" data-quick="${i}"><span class="plus" aria-hidden="true">+</span><span><b>${esc(c.species)}</b><small>${esc(c.bait)}${c.lureColor || c.lureSize ? ' · ' + esc([c.lureColor, c.lureSize].filter(Boolean).join(', ')) : ''}</small></span></button>`).join('')}</div></div>` : '';
    if (!s) {
      const last = sessions.find((x) => x.end);
      $('#now-session').innerHTML = `<div class="card session-card">
        <button type="button" class="btn go big block" id="ses-start">Start fishing</button>
        <p class="sub" style="margin-bottom:0">Tap when your line goes in. Fishamongus! times the session and tracks your lure, so Stats can show fish per hour.</p>
        ${today.length ? `<p class="today-line">Today so far: <b>${plural(fishIn(today), 'fish')}</b></p>` : last ? `<p class="today-line">Last session: ${esc(relDay(last.start))}, ${durText(last.end - last.start)}, ${plural(fishIn(sessionCatches(last)), 'fish')}</p>` : ''}
        ${quick}</div>`;
      return;
    }
    const cs = sessionCatches(s); const n = fishIn(cs); const h = (Date.now() - s.start) / HOUR_MS; const l = curLure(s);
    const sp = s.spotId && spotById(s.spotId);
    $('#now-session').innerHTML = `<div class="card session-card live">
      <div class="ses-top"><span class="live-dot" aria-hidden="true"></span><b>Fishing</b><span class="ses-elapsed" id="ses-elapsed">${durText(Date.now() - s.start)}</span><button type="button" class="btn sm" id="ses-end">End session</button></div>
      <div class="ses-nums">
        <div><b>${n}</b><span>Fish</span></div>
        <div><b>${h >= 0.25 ? round(n / h, 1) : '–'}</b><span>Per hour</span></div>
        <div><b title="${esc(sp ? sp.name : '')}">${sp ? esc(sp.name) : '–'}</b><span>Spot</span></div>
      </div>
      <button type="button" class="ses-lure" id="ses-lure"><span><small>On your line</small><b>${l ? esc(l.bait) + (lureDesc(l) ? ' · ' + esc(lureDesc(l)) : '') : 'Not set yet'}</b></span><em>${l ? 'Change' : 'Set lure'}</em></button>
      ${quick}</div>`;
  }
  function renderNowCond() {
    const box = $('#now-cond');
    if (!nowState) {
      box.innerHTML = `<div class="card"><div class="now-place"><svg viewBox="0 0 24 24"><use href="#i-pin"/></svg><span><b>Conditions here</b><small>${nowBusy ? '<span class="spin"></span>Getting your location and the weather…' : esc(nowErr === 'offline' ? 'No signal. Conditions will load when you are back online.' : nowErr || '')}</small></span>${nowBusy ? '' : '<button type="button" class="icon-btn" id="now-refresh" aria-label="Refresh conditions">↻</button>'}</div></div>`;
      return;
    }
    const st = nowState; const pl = nowPlace(st.loc); const w = st.wx; const t = st.tide;
    const tidal = t && tideShown({ tide: t, spotId: pl.spotId });
    const age = Date.now() - st.at; const moon = moonPhase(Date.now()); const sun = sunTimes(Date.now(), st.loc.lat, st.loc.lon);
    const nextSun = [['Sunrise', sun.sunrise], ['Sunset', sun.sunset]].find(([, v]) => v && v > Date.now()) || ['Sunrise', sunTimes(Date.now() + 86400000, st.loc.lat, st.loc.lon).sunrise];
    const cells = [];
    if (w) { const l = wxLabel(w); cells.push(`<div class="now-cell"><span>Weather</span><b>${l.icon} ${esc(U.temp(w.tempC))}</b><small>${esc(l.text)}</small></div>`);
      cells.push(`<div class="now-cell"><span>Wind</span><b>${esc(U.wind(w.windKmh))} ${compass(w.windDir)}</b><small>gusts ${esc(U.wind(w.gustKmh))}</small></div>`);
      cells.push(`<div class="now-cell"><span>Pressure</span><b>${esc(U.pressure(w.pressure))}</b><small>${w.pressureTrend ? `${trendArrow(w.pressureTrend)} ${esc(w.pressureTrend.charAt(0).toUpperCase() + w.pressureTrend.slice(1))}` : 'Trend unknown'}</small></div>`); }
    if (tidal) {
      // Recompute the stage from the saved high/low times, so it stays right as time passes.
      let stage = t.stage; let rising = t.rising;
      if (st.tripTide && st.tripTide.ev) { const cur = tideAt(st.tripTide.ev, Date.now()); if (cur) { stage = tideStage(cur, Date.now()); rising = cur.rising; } }
      const nxt = st.tripTide && st.tripTide.ev ? st.tripTide.ev.find((e) => e.t > Date.now()) : (t.nextT > Date.now() ? { t: t.nextT, type: t.nextType } : null);
      cells.push(`<div class="now-cell"><span>Tide</span><b>${rising ? '↑' : '↓'} ${esc(stage)}</b>${nxt ? `<small>${nxt.type === 'H' ? 'High' : 'Low'} at ${fmtTime(nxt.t)}</small>` : ''}${t.coef != null ? `<small>Coefficient ${t.coef} (${coefShort(t.coef)})</small>` : ''}</div>`);
    }
    cells.push(`<div class="now-cell"><span>Moon</span><b>${moon.icon} ${moon.illum}%</b><small>${esc(moon.name)}</small></div>`);
    cells.push(`<div class="now-cell"><span>${nextSun[0]}</span><b>${nextSun[1] ? fmtTime(nextSun[1]) : '–'}</b><small>${nextSun[1] ? durText(nextSun[1] - Date.now()) + ' from now' : ''}</small></div>`);
    if (tidal && st.marine && !st.marine.none) { const mr = st.marine; const wv = mr.waveM != null ? `${imp() ? `${round(mr.waveM * 3.28084, 1)} ft` : `${round(mr.waveM, 1)} m`}${mr.periodS != null ? `, ${round(mr.periodS)} s apart` : ''}` : '';
      cells.push(`<div class="now-cell wide"><span>Water</span><b>${mr.seaTempC != null ? esc(U.temp(mr.seaTempC)) : '–'}</b>${wv ? `<small>Waves ${esc(wv)}</small>` : ''}</div>`); }
    const msg = nowErr === 'offline' ? `No signal – showing conditions from ${fmtTime(st.at)}.` : nowErr ? `Couldn't update: ${nowErr}` : age > 60 * 60000 ? `From ${fmtTime(st.at)}. Tap ↻ to update.` : '';
    box.innerHTML = `<div class="card">
      <div class="now-place"><svg viewBox="0 0 24 24"><use href="#i-pin"/></svg><span><b>${esc(pl.name)}</b><small>${esc(pl.sub)}${st.loc.source === 'last' ? ' · last known location' : ''}</small></span>
        <button type="button" class="icon-btn" id="now-refresh" aria-label="Refresh conditions"${nowBusy ? ' disabled' : ''}>${nowBusy ? '<span class="spin" style="margin:0"></span>' : '↻'}</button></div>
      ${msg ? `<p class="now-msg">${esc(msg)}</p>` : ''}
      <div class="now-grid">${cells.join('')}</div></div>`;
  }
  function renderNowRecs() {
    const box = $('#now-recs');
    if (!nowState) { box.innerHTML = ''; return; }
    if (catches.length < 5) { box.innerHTML = `<div class="card"><h3>Lures for right now</h3><p class="sub" style="margin:0">Log ${5 - catches.length} more catch${5 - catches.length === 1 ? '' : 'es'} and this card will suggest lures that have worked for you in conditions like these.</p></div>`; return; }
    const st = nowState; const pl = nowPlace(st.loc);
    const start = Math.floor(Date.now() / HOUR_MS) * HOUR_MS;
    const fcHours = st.forecast && st.forecast.hours ? st.forecast.hours.filter((h) => h.t >= start - HOUR_MS) : [];
    const t = { lat: st.loc.lat, lon: st.loc.lon, spotId: pl.spotId, start, end: start + 3 * HOUR_MS, species: [], forecast: fcHours.length ? { hours: fcHours } : null, tide: st.tripTide || null };
    const hist = tripHistory(t); const r = lureRecs(t, windowHours(t), hist.list);
    if (!r.recs.length) { box.innerHTML = ''; return; }
    const live = activeSession(); const on = curLure(live);
    box.innerHTML = `<div class="card"><h3>Lures for right now</h3><p class="sub">What has caught fish for you ${esc(hist.label)} in conditions like the next few hours.</p>
      <ol class="rec-list">${r.recs.map((x, i) => `<li><span class="rk">${i + 1}</span><span><b>${esc(x.lure)}</b><small>${esc(x.reasons.slice(0, 2).join(' · '))}</small></span>${live && (!on || on.bait !== x.lure) ? `<button type="button" class="btn sm" data-use-lure="${esc(x.lure)}">Use</button>` : ''}</li>`).join('')}</ol>
      <p class="note">Counts of your own catches. They get more reliable the more you log${sessions.some((x) => x.end) ? '' : ', and with fishing sessions'}.</p></div>`;
  }
  function renderNowTrip() {
    const now = Date.now(); const up = trips.filter((t) => t.end > now).sort((a, b) => a.start - b.start); const next = up[0];
    $('#now-trip').innerHTML = `<div class="card"><h3>Trips</h3><p class="sub">${next ? (up.length > 1 ? `Next of ${up.length} planned trips.` : 'Your next planned trip.') : 'Plan ahead with the forecast, tides and your best lures.'}</p>
      ${next ? `<button type="button" class="next-trip" data-trip-open="${next.id}"><svg viewBox="0 0 24 24"><use href="#i-calendar"/></svg><span><b>${esc(next.name)}</b><small>${esc(relDay(next.start))} · ${fmtRange(next.start, next.end)}</small></span></button>` : ''}
      <div class="btn-row"><button type="button" class="btn" id="now-plan">+ Plan a trip</button><button type="button" class="btn" id="now-trips">All trips${trips.length ? ` (${trips.length})` : ''}</button></div></div>`;
  }
  function renderNow() {
    if (!$('#view-now')) return;
    renderNowSession(); renderNowCond(); renderNowRecs(); renderNowTrip();
  }
  $('#view-now').addEventListener('click', (e) => {
    if (e.target.closest('#ses-start')) return startSession();
    if (e.target.closest('#ses-end')) return endSession();
    if (e.target.closest('#ses-lure')) return lurePicker.open();
    if (e.target.closest('#now-refresh')) return refreshNow(true);
    if (e.target.closest('#now-plan')) return tripForm.open();
    if (e.target.closest('#now-trips')) return showView('trips');
    const q = e.target.closest('[data-quick]'); if (q) { const c = quickCombos()[Number(q.dataset.quick)]; if (c) quickSave(c); return; }
    const u = e.target.closest('[data-use-lure]'); if (u) { setSessionLure({ bait: u.dataset.useLure }).then(() => { paintSessionViews(); toast(`Now fishing ${u.dataset.useLure}`); }); return; }
    const tp = e.target.closest('[data-trip-open]'); if (tp) showTrip(tp.dataset.tripOpen);
  });
  $('#trips-back').addEventListener('click', () => showView('now'));
  document.addEventListener('visibilitychange', () => { if (!document.hidden && $('#view-now').classList.contains('active')) refreshNow(); });
  window.addEventListener('online', () => { if ($('#view-now').classList.contains('active')) refreshNow(true); });

  // ---------------------------------------------------------------- collapsible sections
  // Every section card on the long screens folds open or shut from its header, and the app remembers your choice.
  // Cards are rebuilt often, so new ones are found with a MutationObserver instead of wiring each screen by hand.
  const SECTION_SCOPES = [['#view-now', 'now'], ['#stats-body', 'stats'], ['#sheet-spot', 'spot'], ['#sheet-trip', 'trip'], ['#sheet-detail', 'catch'], ['#sheet-tides', 'tides']];
  // Folded until you open them: the long or less-used sections.
  const SECTION_DEFAULT_SHUT = new Set(['stats:catches by species', 'stats:top lures', 'stats:trips', 'spot:species here', 'trip:regulations',
    'catch:conditions', 'catch:tide', 'catch:location']);
  let sectionState = (() => { try { return JSON.parse(store('tl.sections') || '{}'); } catch { return {}; } })();
  const sectionShut = (key) => (key in sectionState ? sectionState[key] : SECTION_DEFAULT_SHUT.has(key));
  function sectionKey(sec, scope) {
    const h = sec.firstElementChild; const first = [...h.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim()) || h;
    return `${scope}:${first.textContent.trim().toLowerCase().replace(/\s+/g, ' ')}`;
  }
  // A folded table of values (a catch's Conditions, Tide, Location) still shows its first two values in the header.
  function sectionSummary(sec) {
    if (!sec.classList.contains('kv')) return '';
    return [...sec.querySelectorAll('dd')].map((d) => d.textContent.trim()).filter((v) => v && !/^-?\d+\.\d{4,}$/.test(v)).slice(0, 2).join(' · ');
  }
  let sectionSeq = 0;
  function makeCollapsible(root) {
    SECTION_SCOPES.forEach(([sel, scope]) => {
      const box = root.matches && root.matches(sel) ? root : root.querySelector ? (root.closest && root.closest(sel)) || root.querySelector(sel) : null;
      if (!box) return;
      box.querySelectorAll('.card, .kv').forEach((sec) => {
        const h = sec.firstElementChild;
        if (!h || !/^H[34]$/.test(h.tagName) || sec.dataset.sec || sec.classList.contains('no-collapse') || sec.children.length < 2) return;
        const key = sectionKey(sec, scope); sec.dataset.sec = key; sec.classList.add('sec');
        const id = `sec-${++sectionSeq}`; const sum = sectionSummary(sec);
        [...sec.children].slice(1).forEach((c) => { if (!c.id) c.dataset.secBody = id; });
        h.innerHTML = `<button type="button" class="sec-toggle"><span class="sec-title">${h.innerHTML}</span>${sum ? `<span class="sec-sum">${esc(sum)}</span>` : ''}<span class="sec-chev" aria-hidden="true"></span></button>`;
        setSection(sec, sectionShut(key));
      });
    });
  }
  function setSection(sec, shut) {
    sec.classList.toggle('collapsed', shut);
    const b = sec.querySelector(':scope > :first-child .sec-toggle'); if (b) { b.setAttribute('aria-expanded', String(!shut)); b.title = shut ? 'Show this section' : 'Hide this section'; }
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('.sec-toggle'); if (!b) return;
    const sec = b.closest('.sec'); const shut = !sec.classList.contains('collapsed');
    setSection(sec, shut); sectionState[sec.dataset.sec] = shut; store('tl.sections', JSON.stringify(sectionState));
  });
  const sectionObserver = new MutationObserver((list) => {
    const roots = new Set(); list.forEach((m) => { if (m.addedNodes.length) roots.add(m.target); });
    roots.forEach((r) => makeCollapsible(r));
  });
  SECTION_SCOPES.forEach(([sel]) => { const el = $(sel); if (el) { sectionObserver.observe(el, { childList: true, subtree: true }); makeCollapsible(el); } });
  function resetSections() { sectionState = {}; store('tl.sections', '{}'); $$('.sec').forEach((s) => setSection(s, sectionShut(s.dataset.sec))); }
  $('#btn-reset-sections').addEventListener('click', () => { resetSections(); toast('Sections are back to how they started'); });

  // ---------------------------------------------------------------- settings, export, import
  function paintBackupInfo() {
    const { last, since } = backupState();
    $('#backup-info').textContent = last ? `Last backup: ${fmtDate(last)}, ${fmtTime(last)}${since ? ` · ${plural(since, 'catch')} since` : ' · up to date'}.` : 'No backup yet.';
  }
  function paintUnits() {
    $$('#seg-units button').forEach((b) => b.classList.toggle('on', b.dataset.units === settings.units));
    $('#seg-weight').hidden = !imp(); $$('#seg-weight button').forEach((b) => b.classList.toggle('on', (b.dataset.wt === 'oz') === settings.wtOz));
  }
  $('#seg-weight').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; settings.wtOz = b.dataset.wt === 'oz'; store('tl.wtOz', settings.wtOz ? '1' : '0'); paintUnits(); renderList(); renderSpots(); });
  $('#btn-menu').addEventListener('click', async () => {
    paintUnits(); $('#app-version').textContent = `Fishamongus! version ${APP_VERSION}`;
    $('#storage-info').textContent = ''; paintBackupInfo();
    if (navigator.storage && navigator.storage.estimate) {
      try { const e = await navigator.storage.estimate(); const p = navigator.storage.persisted ? await navigator.storage.persisted() : false;
        $('#storage-info').textContent = `${plural(catches.length, 'catch')} · ${round((e.usage || 0) / 1048576, 1)} MB used${p ? ' · protected from automatic cleanup' : ''}`; } catch { /* ignore */ }
    }
    openSheet($('#sheet-settings'));
  });
  $('#seg-units').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    settings.units = b.dataset.units; store('tl.units', settings.units); paintUnits(); renderList(); renderSpots(); if ($('#view-stats').classList.contains('active')) renderStats();
  });

  // Returns false when the person cancels the share sheet.
  async function deliverFile(blob, name) {
    const file = new File([blob], name, { type: blob.type });
    if (isTouch && navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: name }); return true; } catch (e) { if (e.name === 'AbortError') return false; }
    }
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 5000);
    return true;
  }
  // Backup reminder: after 5 catches with no backup, 20 new catches, or 30 days with anything new.
  function backupState() {
    const last = Number(store('tl.lastBackup') || 0);
    const since = catches.filter((c) => (c.createdAt || 0) > last).length;
    return { last, since };
  }
  function updateBackupNudge() {
    const el = $('#backup-nudge'); if (!el) return;
    const { last, since } = backupState(); const now = Date.now();
    const snoozed = now < Number(store('tl.backupSnooze') || 0);
    const due = catches.length >= 5 && (!last || since >= 20 || (now - last > 30 * 86400000 && since >= 1));
    el.hidden = snoozed || !due;
    if (!el.hidden) $('#backup-nudge-text').textContent = last
      ? `${plural(since, 'catch')} since your last backup on ${fmtDate(last)}. Your log is only on this phone, so back it up now and then.`
      : `Your ${plural(catches.length, 'catch')} are saved only on this phone. If the app is deleted they're gone, so back them up.`;
  }
  $('#backup-nudge-later').addEventListener('click', () => { store('tl.backupSnooze', String(Date.now() + 7 * 86400000)); updateBackupNudge(); });
  $('#backup-nudge-go').addEventListener('click', () => exportBackup());
  const blobToDataURL = (b) => new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(b); });
  const dataURLToBlob = async (d) => (await fetch(d)).blob();
  const stamp = () => new Date().toISOString().slice(0, 10);

  $('#btn-export-json').addEventListener('click', () => exportBackup());
  async function exportBackup() {
    if (!catches.length && !spots.length && !trips.length && !sessions.length) return toast('Nothing to export yet');
    toast('Preparing backup…');
    const out = [];
    for (const c of catches) {
      const extra = []; for (const p of c.extraPhotos || []) extra.push({ photo: await blobToDataURL(p.photo), thumb: p.thumb ? await blobToDataURL(p.thumb) : null });
      out.push({ ...c, photo: c.photo ? await blobToDataURL(c.photo) : null, thumb: c.thumb ? await blobToDataURL(c.thumb) : null, extraPhotos: extra });
    }
    const ok = await deliverFile(new Blob([JSON.stringify({ app: 'fishamongus', version: 4, exportedAt: new Date().toISOString(), spots, trips, sessions, catches: out })], { type: 'application/json' }), `fishamongus-backup-${stamp()}.json`);
    if (ok) { store('tl.lastBackup', String(Date.now())); store('tl.backupSnooze', '0'); updateBackupNudge(); paintBackupInfo(); toast('Backup saved'); }
  }
  $('#btn-export-csv').addEventListener('click', async () => {
    if (!catches.length) return toast('Nothing to export yet');
    const q = (v) => { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
    const head = ['Date', 'Time', 'Spot', 'Species', 'Count', 'Lure/Bait', 'Lure colour', 'Lure size', `Length ${U.lenLabel()}`, `Weight ${U.wtLabel()}`, 'Released', 'Latitude', 'Longitude', 'GPS accuracy (m)', 'Weather', `Temp ${imp() ? '(°F)' : '(°C)'}`, `Wind ${imp() ? '(mph)' : '(km/h)'}`, 'Wind dir', `Pressure ${imp() ? '(inHg)' : '(hPa)'}`, 'Pressure trend', 'Humidity (%)', 'Moon', 'Tide stage', `Tide height ${imp() ? '(ft)' : '(m)'}`, 'Tidal coefficient', 'Tide station', `Water temp ${imp() ? '(°F)' : '(°C)'}`, `Waves ${imp() ? '(ft)' : '(m)'}`, 'Wave period (s)', 'Session', 'Notes'];
    const rows = catches.map((c) => { const w = c.weather; const L = c.location; const d = new Date(c.caughtAt);
      return [toLocalInput(d).slice(0, 10), toLocalInput(d).slice(11), (c.spotId && spotById(c.spotId) ? spotById(c.spotId).name : ''), c.species, nFish(c), c.bait, c.lureColor || '', c.lureSize || '', U.lenOut(c.lengthCm), U.wtOut(c.weightKg), c.released === true ? 'yes' : c.released === false ? 'no' : '',
        L ? L.lat.toFixed(6) : '', L ? L.lon.toFixed(6) : '', L && L.accuracy != null ? Math.round(L.accuracy) : '',
        w ? wxLabel(w).text : '', w ? (imp() ? round(w.tempC * 9 / 5 + 32, 1) : round(w.tempC, 1)) : '', w ? (imp() ? round(w.windKmh * 0.621371, 1) : round(w.windKmh, 1)) : '',
        w ? compass(w.windDir) : '', w ? (imp() ? round(w.pressure * 0.02953, 2) : round(w.pressure, 1)) : '', w ? w.pressureTrend || '' : '', w ? w.humidity : '',
        moonPhase(c.caughtAt).name,
        tideShown(c) ? c.tide.stage : '', tideShown(c) ? round(c.tide.heightM * (imp() ? 3.28084 : 1), 2) : '', tideShown(c) && c.tide.coef != null ? c.tide.coef : '', tideShown(c) ? c.tide.stationName : '',
        c.marine && !c.marine.none && c.marine.seaTempC != null ? round(imp() ? c.marine.seaTempC * 9 / 5 + 32 : c.marine.seaTempC, 1) : '',
        c.marine && !c.marine.none && c.marine.waveM != null ? round(c.marine.waveM * (imp() ? 3.28084 : 1), 1) : '',
        c.marine && !c.marine.none && c.marine.periodS != null ? round(c.marine.periodS, 1) : '',
        (() => { const x = c.sessionId && sessions.find((y) => y.id === c.sessionId); return x ? `${toLocalInput(new Date(x.start)).replace('T', ' ')} (${durText(sessionEnd(x) - x.start)})` : ''; })(),
        c.notes].map(q).join(','); });
    await deliverFile(new Blob(['﻿' + [head.map(q).join(','), ...rows].join('\n')], { type: 'text/csv' }), `fishamongus-${stamp()}.csv`);
  });
  $('#f-import').addEventListener('change', async (e) => {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    try {
      const j = JSON.parse(await f.text());
      if (!j || !['fishamongus', 'tightlines'].includes(j.app) || !Array.isArray(j.catches)) throw new Error('not a Fishamongus! backup');
      let n = 0; let ns = 0;
      let nt = 0;
      for (const x of (Array.isArray(j.trips) ? j.trips : [])) { if (x && x.id && Number.isFinite(x.start) && Number.isFinite(x.lat)) { await DB.putTrip(x); nt++; } }
      for (const x of (Array.isArray(j.sessions) ? j.sessions : [])) { if (x && x.id && Number.isFinite(x.start)) await DB.putSession(x); }
      for (const x of (Array.isArray(j.spots) ? j.spots : [])) { if (x && x.id && x.name && Number.isFinite(x.lat) && Number.isFinite(x.lon)) { await DB.putSpot(x); ns++; } }
      for (const c of j.catches) {
        if (!c.id || !c.species) continue;
        const extra = []; for (const p of c.extraPhotos || []) if (p && p.photo) extra.push({ photo: await dataURLToBlob(p.photo), thumb: p.thumb ? await dataURLToBlob(p.thumb) : null });
        await DB.put({ ...c, photo: c.photo ? await dataURLToBlob(c.photo) : null, thumb: c.thumb ? await dataURLToBlob(c.thumb) : null, extraPhotos: extra }); n++;
      }
      await reload(); toast(`Restored ${plural(n, 'catch')}${ns ? `, ${plural(ns, 'spot')}` : ''}${nt ? `, ${plural(nt, 'trip')}` : ''}`);
    } catch (err) { toast('Could not restore: ' + err.message); }
  });

  // ---------------------------------------------------------------- boot
  // ---------------------------------------------------------------- first run and install guide
  const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  let installEvent = null;
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installEvent = e; updateInstallNudge(); });
  window.addEventListener('appinstalled', () => { installEvent = null; store('tl.installSnooze', String(Date.now() + 3650 * 86400000)); updateInstallNudge(); });
  function updateInstallNudge() {
    const el = $('#install-nudge');
    const show = !standalone() && isTouch && Date.now() > Number(store('tl.installSnooze') || 0) && !!store('tl.welcomed');
    el.hidden = !show; if (!show) return;
    $('#install-go').hidden = !installEvent;
    $('#install-text').innerHTML = isIOS
      ? '<b>Install Fishamongus!</b> In Safari, tap <b>Share</b> (the square with an arrow), then <b>Add to Home Screen</b>. It then opens full screen, works with no signal, and iPhone keeps your log more safely.'
      : installEvent ? '<b>Install Fishamongus!</b> It opens full screen and works with no signal.'
        : '<b>Install Fishamongus!</b> Open your browser menu (⋮) and choose <b>Install app</b> or <b>Add to Home screen</b>. It then opens full screen and works with no signal.';
  }
  $('#install-go').addEventListener('click', async () => { if (!installEvent) return; installEvent.prompt(); try { await installEvent.userChoice; } catch { /* ignore */ } installEvent = null; updateInstallNudge(); });
  $('#install-later').addEventListener('click', () => { store('tl.installSnooze', String(Date.now() + 30 * 86400000)); updateInstallNudge(); });
  const firstRun = !store('tl.welcomed');
  $('#welcome-go').addEventListener('click', () => { closeSheet(); updateInstallNudge(); refreshNow(true); });
  if (!store('tl.welcomed')) { store('tl.welcomed', '1'); setTimeout(() => openSheet($('#sheet-welcome')), 50); } else updateInstallNudge();

  setSpotsMode(spotsMode);
  reload().then(() => { if (!firstRun) refreshNow(); }).then(backfillWeather).then(backfillTides).then(backfillMarine).catch((err) => { console.error(err); toast('Storage is unavailable in this browser mode'); });
  if ('serviceWorker' in navigator && window.isSecureContext) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
