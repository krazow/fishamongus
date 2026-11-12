/* Fishamongus! – catch log
 * (Storage names below still say "tightlines" on purpose: renaming them would hide catches already saved on phones.)
 * Everything is stored on the device in IndexedDB. Weather comes from Open-Meteo (no API key).
 * Values are stored in metric and converted for display.
 */
(() => {
  'use strict';

  // ---------------------------------------------------------------- constants
  // Common recreational species (North America), grouped for the dropdown.
  // The fish list, by type. Main menu: fish types ('Bass', 'Trout & char', 'Tuna') and one-of-a-kind fish ('Bowfin').
  // A type's kinds appear in a second menu, in labelled sections where a type is large: ['Bass', [['Black bass', […]], …]].
  const SPECIES_TREE = [
    ['Freshwater', [
      ['Bass', [['Black bass', ['Largemouth Bass', 'Florida Bass', 'Smallmouth Bass', 'Spotted Bass', 'Alabama Bass', 'Guadalupe Bass', 'Shoal Bass', 'Redeye Bass', 'Suwannee Bass', 'Choctaw Bass', 'Bartram’s Bass', 'Altamaha Bass', 'Cahaba Bass', 'Chattahoochee Bass', 'Tallapoosa Bass', 'Warrior Bass']], ['Striped & white bass', ['Striped Bass', 'Hybrid Striped Bass (Wiper)', 'Sunshine Bass', 'White Bass', 'Yellow Bass']], ['Rock bass', ['Rock Bass', 'Ozark Bass', 'Shadow Bass', 'Roanoke Bass']], ['Peacock bass', ['Peacock Bass']]]],
      ['Trout & char', [['Rainbow trout', ['Rainbow Trout', 'Steelhead', 'Redband Trout', 'Golden Trout']], ['Cutthroat trout', ['Cutthroat Trout', 'Westslope Cutthroat Trout', 'Yellowstone Cutthroat Trout', 'Lahontan Cutthroat Trout', 'Bonneville Cutthroat Trout', 'Colorado River Cutthroat Trout', 'Greenback Cutthroat Trout', 'Rio Grande Cutthroat Trout', 'Coastal Cutthroat Trout', 'Cutbow']], ['Brown & brook trout', ['Brown Trout', 'Brook Trout', 'Tiger Trout']], ['Southwest native trout', ['Apache Trout', 'Gila Trout']], ['Lake trout & char', ['Lake Trout', 'Splake', 'Bull Trout', 'Dolly Varden', 'Arctic Char']]]],
      ['Salmon', ['Chinook (King) Salmon', 'Coho (Silver) Salmon', 'Sockeye Salmon', 'Kokanee', 'Pink Salmon', 'Chum Salmon', 'Atlantic Salmon', 'Landlocked Atlantic Salmon']],
      ['Whitefish & grayling', ['Lake Whitefish', 'Mountain Whitefish', 'Round Whitefish', 'Broad Whitefish', 'Humpback Whitefish', 'Cisco (Lake Herring)', 'Inconnu (Sheefish)', 'Arctic Grayling']],
      ['Sunfish & bream', ['Bluegill', 'Redear Sunfish (Shellcracker)', 'Pumpkinseed', 'Green Sunfish', 'Redbreast Sunfish', 'Longear Sunfish', 'Spotted Sunfish (Stumpknocker)', 'Orangespotted Sunfish', 'Dollar Sunfish', 'Bluespotted Sunfish', 'Flier', 'Warmouth', 'Hybrid Sunfish']],
      ['Crappie', ['Black Crappie', 'White Crappie']],
      ['Perch', ['Yellow Perch', 'White Perch', 'Sacramento Perch']],
      ['Walleye & sauger', ['Walleye', 'Sauger', 'Saugeye']],
      ['Pike, muskie & pickerel', ['Northern Pike', 'Muskellunge', 'Tiger Muskie', 'Chain Pickerel', 'Redfin Pickerel', 'Grass Pickerel']],
      ['Catfish', ['Channel Catfish', 'Blue Catfish', 'Flathead Catfish', 'White Catfish', 'Headwater Catfish', 'Stonecat', 'Walking Catfish', 'Sailfin Catfish (Pleco)']],
      ['Bullhead', ['Brown Bullhead', 'Black Bullhead', 'Yellow Bullhead', 'Flat Bullhead', 'Snail Bullhead', 'Spotted Bullhead']],
      ['Carp & goldfish', ['Common Carp', 'Mirror Carp', 'Koi', 'Grass Carp', 'Silver Carp', 'Bighead Carp', 'Black Carp', 'Goldfish']],
      ['Buffalo & carpsucker', ['Bigmouth Buffalo', 'Smallmouth Buffalo', 'Black Buffalo', 'River Carpsucker', 'Quillback']],
      ['Sucker & redhorse', ['White Sucker', 'Longnose Sucker', 'Largescale Sucker', 'Sacramento Sucker', 'Northern Hog Sucker', 'Blue Sucker', 'Shorthead Redhorse', 'Golden Redhorse', 'Silver Redhorse', 'River Redhorse', 'Greater Redhorse']],
      ['Minnow, chub & pikeminnow', ['Fallfish', 'Creek Chub', 'Tui Chub', 'Hitch', 'Hardhead', 'Peamouth', 'Chiselmouth', 'Golden Shiner', 'Northern Pikeminnow', 'Sacramento Pikeminnow', 'Colorado Pikeminnow']],
      ['Gar', ['Longnose Gar', 'Spotted Gar', 'Shortnose Gar', 'Florida Gar', 'Alligator Gar']],
      ['Sturgeon & paddlefish', ['White Sturgeon', 'Green Sturgeon', 'Lake Sturgeon', 'Shovelnose Sturgeon', 'Pallid Sturgeon', 'Atlantic Sturgeon', 'Paddlefish']],
      ['Shad, herring & smelt', ['American Shad', 'Hickory Shad', 'Gizzard Shad', 'Threadfin Shad', 'Skipjack Herring', 'Alewife', 'Blueback Herring', 'Rainbow Smelt']],
      ['Mooneye & goldeye', ['Mooneye', 'Goldeye']],
      ['Tilapia & cichlids', ['Tilapia', 'Oscar', 'Mayan Cichlid', 'Jaguar Guapote']],
      ['Snakehead', ['Northern Snakehead', 'Bullseye Snakehead']],
      'Bowfin',
      'Burbot',
      'Freshwater Drum',
      'American Eel',
      'Clown Knifefish',
      'Round Goby',
      'Ruffe',
    ]],
    ['Saltwater', [
      ['Saltwater bass', ['Calico Bass (Kelp Bass)', 'Barred Sand Bass', 'Spotted Bay Bass', 'Black Sea Bass']],
      ['Drum, croaker & seatrout', ['Red Drum (Redfish)', 'Black Drum', 'White Seabass', 'Spotted Seatrout', 'Weakfish', 'California Corbina', 'Atlantic Croaker', 'Spot', 'Kingfish (Whiting)']],
      ['Halibut & flounder', ['California Halibut', 'Pacific Halibut', 'Summer Flounder (Fluke)', 'Southern Flounder', 'Winter Flounder']],
      ['Snapper', ['Red Snapper', 'Mangrove (Gray) Snapper', 'Mutton Snapper', 'Yellowtail Snapper', 'Vermilion Snapper']],
      ['Grouper', ['Gag Grouper', 'Red Grouper', 'Black Grouper', 'Goliath Grouper']],
      ['Jacks & amberjack', ['Yellowtail', 'Greater Amberjack', 'Jack Crevalle', 'Florida Pompano', 'Permit']],
      ['Tuna', ['Yellowfin Tuna', 'Bluefin Tuna', 'Bigeye Tuna', 'Blackfin Tuna', 'Albacore', 'Skipjack Tuna']],
      ['Mackerel, bonito & wahoo', ['Pacific Mackerel', 'Spanish Mackerel', 'King Mackerel', 'Pacific Bonito', 'Wahoo']],
      ['Billfish', ['Sailfish', 'Blue Marlin', 'White Marlin', 'Striped Marlin', 'Swordfish']],
      ['Rockfish, lingcod & cabezon', ['Rockfish', 'Lingcod', 'Cabezon']],
      ['Cod, haddock & pollock', ['Atlantic Cod', 'Haddock', 'Pollock']],
      ['Shark', ['Leopard Shark', 'Mako Shark']],
      ['Wrasse & porgy', ['California Sheephead', 'Hogfish', 'Tautog', 'Sheepshead', 'Scup (Porgy)']],
      ['Tarpon, snook & bonefish', ['Tarpon', 'Snook', 'Bonefish', 'Ladyfish']],
      'Mahi-mahi (Dorado)',
      'Cobia',
      'Bluefish',
      'Gray Triggerfish',
      'Barred Surfperch',
      'Opaleye',
    ]],
  ];
  // Shellfish, laid out the same way: a type ('Crab') and its kinds, by water.
  const SHELLFISH_TREE = [
    ['Saltwater', [
      ['Crab', [['Pacific', ['Dungeness Crab', 'Red Rock Crab', 'Graceful Crab', 'Tanner Crab']], ['Atlantic & Gulf', ['Blue Crab', 'Stone Crab', 'Jonah Crab']], ['Alaska', ['King Crab', 'Snow Crab']]]],
      ['Shrimp & prawns', [['Pacific', ['Spot Prawn', 'Coonstripe Shrimp', 'Sidestripe Shrimp', 'Pink Shrimp', 'Ghost Shrimp']], ['Atlantic & Gulf', ['Brown Shrimp', 'White Shrimp']]]],
      ['Clams', ['Manila Clam', 'Native Littleneck Clam', 'Butter Clam', 'Horse Clam (Gaper)', 'Razor Clam', 'Geoduck', 'Softshell Clam', 'Cockle', 'Hard Clam (Quahog)']],
      ['Oysters', ['Pacific Oyster', 'Olympia Oyster', 'Eastern Oyster']],
      ['Mussels', ['Blue Mussel', 'California Mussel']],
      ['Scallops', ['Pink Scallop', 'Rock Scallop', 'Bay Scallop', 'Weathervane Scallop']],
      ['Lobster', ['American Lobster', 'Spiny Lobster']],
      ['Squid & octopus', ['Market Squid', 'Octopus']],
    ]],
    ['Freshwater', [
      ['Crayfish', ['Signal Crayfish', 'Red Swamp Crayfish', 'Rusty Crayfish', 'Virile Crayfish']],
    ]],
  ];
  // Clams, oysters, mussels and scallops are the ones that carry marine biotoxins.
  const BIVALVE_TYPES = new Set(['Clams', 'Oysters', 'Mussels', 'Scallops']);
  // Lookups: a type ('Bass', 'Crab') → its kinds (with optional sections); each kind → its type, its water and fish or shellfish.
  const FISH_TYPES = new Map(); const PARENT_SPECIES = new Map(); const SUBSPECIES = new Map(); const SPECIES_INFO = new Map();
  [['fish', SPECIES_TREE], ['shellfish', SHELLFISH_TREE]].forEach(([kind, tree]) => tree.forEach(([region, items]) => items.forEach((it) => {
    if (!Array.isArray(it)) { SPECIES_INFO.set(it, { kind, region, type: null }); return; }
    const sections = it[1].map((g) => (Array.isArray(g) ? g : [null, [g]]));
    const flat = sections.flatMap((g) => g[1]);
    FISH_TYPES.set(it[0], { region, kind, sections, flat }); SUBSPECIES.set(it[0], flat); SPECIES_INFO.set(it[0], { kind, region, type: it[0] });
    flat.forEach((x) => { PARENT_SPECIES.set(x, it[0]); SPECIES_INFO.set(x, { kind, region, type: it[0] }); });
  })));
  // Fish or shellfish for any catch: saved on new catches, worked out from the name for older ones.
  const kindOf = (c) => (c && (c.kind || (SPECIES_INFO.get(c.species) || {}).kind)) || 'fish';
  const typeOf = (name) => (SPECIES_INFO.get(name) || {}).type || null;
  // Every fish and shellfish, flat, for the other species menus (filters, bag limits): one group per type.
  const SPECIES_GROUPS = [['', SPECIES_TREE], ['Shellfish · ', SHELLFISH_TREE]].flatMap(([pre, tree]) => tree.flatMap(([region, items]) => [
    ...items.filter(Array.isArray).map((it) => [`${pre}${region} · ${it[0]}`, FISH_TYPES.get(it[0]).flat]),
    ...(items.some((it) => !Array.isArray(it)) ? [[`${pre}${region} · Other`, items.filter((it) => !Array.isArray(it))]] : []),
  ]));
  // Gear for shellfish, in place of lures.
  const GEAR_GROUPS = [
    ['Pots & traps', ['Crab pot', 'Crab ring net', 'Crab snare', 'Shrimp pot', 'Crayfish trap']],
    ['Digging & gathering', ['Clam gun', 'Shovel', 'Rake', 'By hand']],
    ['Other', ['Dip net', 'Squid jig', 'Diving']],
  ];
  const KNOWN_GEAR = new Set(GEAR_GROUPS.flatMap((g) => g[1]));
  const isPotGear = (g) => /pot|ring|trap|snare/i.test(g || '');
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
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition; // speech recognition, where the browser has it
  const APP_VERSION = '4.7 (Nov 11, 2026)';
  // Night (dim red) mode and large text, applied before anything is drawn.
  function applyDisplay() {
    const night = store('tl.theme') === 'night'; const large = store('tl.text') === 'large';
    document.documentElement.classList.toggle('night', night); document.documentElement.classList.toggle('large', large);
    const m = document.querySelector('meta[name=theme-color]'); if (m) m.content = night ? '#120000' : '#0e4f5c';
  }
  applyDisplay();
  // One clear line when there's no signal, instead of a message on every card.
  function paintOffline() { const off = !navigator.onLine; $('#offline-bar').hidden = !off; document.body.classList.toggle('is-offline', off); }
  window.addEventListener('online', paintOffline); window.addEventListener('offline', paintOffline);
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
        const r = indexedDB.open('tightlines', 6);
        r.onupgradeneeded = () => {
          const db = r.result;
          if (!db.objectStoreNames.contains('catches')) db.createObjectStore('catches', { keyPath: 'id' }).createIndex('caughtAt', 'caughtAt');
          if (!db.objectStoreNames.contains('spots')) db.createObjectStore('spots', { keyPath: 'id' });
          if (!db.objectStoreNames.contains('trips')) db.createObjectStore('trips', { keyPath: 'id' });
          if (!db.objectStoreNames.contains('sessions')) db.createObjectStore('sessions', { keyPath: 'id' });
          if (!db.objectStoreNames.contains('tackle')) db.createObjectStore('tackle', { keyPath: 'id' });
          if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta');
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
    allTackle() { return this.tx('readonly', (s) => s.getAll(), 'tackle'); },
    putTackle(x) { return this.tx('readwrite', (s) => s.put(x), 'tackle'); },
    delTackle(id) { return this.tx('readwrite', (s) => s.delete(id), 'tackle'); },
    getMeta(k) { return this.tx('readonly', (s) => s.get(k), 'meta'); },
    putMeta(k, v) { return this.tx('readwrite', (s) => s.put(v, k), 'meta'); },
    delMeta(k) { return this.tx('readwrite', (s) => s.delete(k), 'meta'); },
  };

  // ---------------------------------------------------------------- state
  let catches = [];
  // A catch can hold several identical fish ("How many fish?").
  const nFish = (c) => Math.max(1, Math.round((c && c.count) || 1));
  const fishIn = (list) => list.reduce((a, c) => a + nFish(c), 0);
  const weightOf = (x) => (x && typeof x === 'object' && !Array.isArray(x) ? nFish(x.c && x.c.species ? x.c : x) : 1);
  let spots = [];
  let sessions = [];
  let tackle = [];
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
    [catches, spots, trips, sessions, tackle] = await Promise.all([DB.all(), DB.allSpots(), DB.allTrips(), DB.allSessions(), DB.allTackle()]);
    tackle.sort((a, b) => (a.name || a.bait).localeCompare(b.name || b.bait));
    sessions.sort((a, b) => b.start - a.start);
    catches.sort((a, b) => b.caughtAt - a.caughtAt);
    spots.sort((a, b) => a.name.localeCompare(b.name));
    renderList(); renderSummary(); renderSpots(); updateBackupNudge(); if (map) renderMap();
    if ($('#view-stats').classList.contains('active')) renderStats();
    if (!$('#sheet-spot').hidden && spotDetailId) renderSpotDetail(spotDetailId);
    renderTrips(); updateTripNudge(); if (!$('#sheet-trip').hidden && tripDetailId) renderTrip(tripDetailId);
    renderNow(); paintSessionBar(); paintDemoBar();
  }

  // ---------------------------------------------------------------- toast & confirm
  let toastTimer; let toastActionUntil = 0;
  // Background news ("Weather added…") never covers a message that has a button on it.
  function toastBg(msg) { if (Date.now() < toastActionUntil) return; toast(msg); }
  function toast(msg, action, cls) {
    toastActionUntil = action ? Date.now() + 6000 : 0;
    $('#toast').classList.toggle('pb', cls === 'pb');
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
    document.body.classList.add('sheet-open');
    if (Date.now() < toastActionUntil) { $('#toast').classList.remove('show'); toastActionUntil = 0; }
    try { history.pushState({ sheet: el.id }, ''); } catch { /* ignore */ }
    const sc = $('.sheet-scroll', el); if (sc) sc.scrollTop = 0;
  }
  function hideTop() {
    const el = sheetStack.pop(); if (el) el.hidden = true;
    if (!sheetStack.length) { document.body.style.overflow = ''; document.body.classList.remove('sheet-open'); }
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
      (!q || [c.species, c.bait, c.lureColor, c.notes, c.from, c.shellBait, c.weather && wxLabel(c.weather).text, c.spotId && spotById(c.spotId) && spotById(c.spotId).name].join(' ').toLowerCase().includes(q)));
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
      return `<li class="swipe-row"><div class="swipe-acts" aria-hidden="true"><button type="button" tabindex="-1" data-act="edit" data-id="${c.id}">Edit</button><button type="button" tabindex="-1" data-act="same" data-id="${c.id}">Same again</button><button type="button" tabindex="-1" data-act="del" data-id="${c.id}">Delete</button></div><button class="catch" data-id="${c.id}">
        ${t ? `<img class="thumb" src="${t}" alt="">` : `<span class="thumb"><svg viewBox="0 0 32 32"><use href="#i-fish"/></svg></span>`}
        <span class="min-w">
          <h3>${esc(c.species)}${nFish(c) > 1 ? `<span class="count-badge">×${nFish(c)}</span>` : ''}</h3>
          <div class="meta">${esc(c.bait)}${c.shellBait ? ' · ' + esc(c.shellBait) : ''}${c.lureColor ? ' · ' + esc(c.lureColor) : ''}${c.crabSex ? ' · ' + (c.crabSex === 'male' ? 'male' : 'female') : ''}${c.carapaceCm ? ' · ' + esc(U.len(c.carapaceCm)) : ''}${size ? ' · ' + esc(size) : ''}${c.from ? ' · from ' + esc(c.from) : ''}</div>
          <div class="meta">${fmtTime(c.caughtAt)}${c.spotId && spotById(c.spotId) ? ' · ' + esc(spotById(c.spotId).name) : ''}</div>
          <div class="wx">${c.weather ? esc(weatherLine(c.weather)) : (c.location ? 'Weather pending…' : 'No location')}</div>
        </span></button></li>`; }).join('');
    }).join('') || (filtering ? `<li class="help" style="text-align:center;padding:20px">No catches match${q ? ` “${esc(q)}”` : ''} these filters.</li>` : '');
  }

  // Swipe a catch left for Edit, Same again and Delete. (A catch's page has the same buttons, for anyone who doesn't swipe.)
  let swipeOpen = null;
  function closeSwipe(except) { if (swipeOpen && swipeOpen !== except) { swipeOpen.style.transform = ''; swipeOpen.classList.remove('open'); swipeOpen = null; } }
  (() => {
    const list = $('#catch-list'); let st = null; const W = 252;
    list.addEventListener('touchstart', (e) => { const b = e.target.closest('.catch'); if (!b || e.touches.length > 1) return; st = { b, x: e.touches[0].clientX, y: e.touches[0].clientY, dx: 0, base: b.classList.contains('open') ? -W : 0, lock: null }; }, { passive: true });
    list.addEventListener('touchmove', (e) => {
      if (!st) return; const dx = e.touches[0].clientX - st.x; const dy = e.touches[0].clientY - st.y;
      if (st.lock == null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) st.lock = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (st.lock !== 'x') return; e.preventDefault(); closeSwipe(st.b);
      st.dx = dx; st.b.style.transition = 'none'; st.b.style.transform = `translateX(${Math.max(-W - 24, Math.min(0, st.base + dx))}px)`;
    }, { passive: false });
    list.addEventListener('touchend', () => {
      if (!st) return; const { b, dx, base, lock } = st; st = null; if (lock !== 'x') return;
      b.style.transition = ''; const open = base + dx < -W / 3;
      b.style.transform = open ? `translateX(${-W}px)` : ''; b.classList.toggle('open', open); swipeOpen = open ? b : null; b.dataset.swiped = '1'; setTimeout(() => { delete b.dataset.swiped; }, 350);
    });
    document.addEventListener('touchstart', (e) => { if (swipeOpen && !e.target.closest('.swipe-row')) closeSwipe(); }, { passive: true });
  })();
  $('#catch-list').addEventListener('click', async (e) => {
    const a = e.target.closest('[data-act]');
    if (a) {
      const c = catches.find((x) => x.id === a.dataset.id); closeSwipe(); if (!c) return;
      if (a.dataset.act === 'edit') form.open(c);
      if (a.dataset.act === 'same') form.open(null, sameAs(c));
      if (a.dataset.act === 'del') { if (!(await askConfirm(`Delete this ${c.species}?`))) return; await DB.del(c.id); await reload(); toast('Catch deleted', { label: 'Undo', fn: async () => { await DB.put(c); await reload(); toast('Catch restored'); } }); }
      return;
    }
    const b = e.target.closest('.catch'); if (!b) return;
    if (b.dataset.swiped) return; if (b.classList.contains('open')) { closeSwipe(); return; }
    showDetail(b.dataset.id);
  });
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
    // Fish or shellfish, and which water. Water sets itself from the spot or the coast until you choose it.
    let draftKind = 'fish'; let draftWater = 'both'; let waterTouched = false;
    function fillChoices() { fillBaitMenu(); fillSpeciesMenu(); }
    function fillBaitMenu() {
      // Lure / bait for fish, gear for shellfish: grouped dropdowns. Ones you've logged that aren't listed get their own group.
      const shell = draftKind === 'shellfish'; const groups = shell ? GEAR_GROUPS : LURE_GROUPS; const known = shell ? KNOWN_GEAR : KNOWN_LURES;
      const used = []; const cnt = new Map();
      catches.forEach((c) => { if (kindOf(c) !== draftKind || !c.bait) return; cnt.set(c.bait, (cnt.get(c.bait) || 0) + 1); if (!used.includes(c.bait)) used.push(c.bait); });
      const chips = [...cnt.entries()].sort((a, b) => b[1] - a[1] || used.indexOf(a[0]) - used.indexOf(b[0])).map((x) => x[0]).slice(0, 6);
      const mine = used.filter((v) => !known.has(v)).sort((x, y) => x.localeCompare(y));
      const optL = (v) => `<option value="${esc(v)}">${esc(v)}</option>`;
      $('#f-bait-select').innerHTML = `<option value="" disabled>${shell ? 'Choose your gear…' : 'Choose a lure or bait…'}</option>` +
        (mine.length ? `<optgroup label="${shell ? 'Your other gear' : 'Your other lures'}">${mine.map(optL).join('')}</optgroup>` : '') +
        groups.map(([label, list]) => `<optgroup label="${esc(label)}">${list.map(optL).join('')}</optgroup>`).join('') +
        `<optgroup label="Not listed"><option value="${OTHER}">Other – type it in…</option></optgroup>`;
      $('#bait-chips').innerHTML = chips.map((v) => `<button type="button" class="chip" data-bait="${esc(v)}">${esc(v)}</button>`).join('');
      setBait($('#f-bait').value.trim());
    }
    function fillSpeciesMenu() {
      // Main menu: types and one-of-a-kind fish for the chosen kind and water. Things you've logged that aren't listed get their own group.
      const tree = draftKind === 'shellfish' ? SHELLFISH_TREE : SPECIES_TREE;
      const regions = tree.filter(([r]) => draftWater === 'both' || r === draftWater);
      const sp = topValues('species', []);
      const mine = sp.all.filter((v) => !KNOWN_SPECIES.has(v) && !FISH_TYPES.has(v)).sort((x, y) => x.localeCompare(y));
      const opt = (v) => `<option value="${esc(v)}">${esc(v)}</option>`;
      $('#f-species-select').innerHTML =
        `<option value="" disabled>${draftKind === 'shellfish' ? 'Choose a shellfish…' : 'Choose a fish…'}</option>` +
        (mine.length && draftKind === 'fish' ? `<optgroup label="Your other species">${mine.map(opt).join('')}</optgroup>` : '') +
        regions.map(([label, items]) => `<optgroup label="${esc(label)}">${items.map((it) => (Array.isArray(it) ? `<option value="${esc(it[0])}">${esc(it[0])} ▸</option>` : opt(it))).join('')}</optgroup>`).join('') +
        `<optgroup label="Not listed"><option value="${OTHER}">Other – type it in…</option></optgroup>`;
      $('#species-chips').innerHTML = sp.chips.filter((v) => (SPECIES_INFO.get(v) || { kind: 'fish' }).kind === draftKind).map((v) => `<button type="button" class="chip" data-species="${esc(v)}">${esc(v)}</button>`).join('');
      setSpecies($('#f-species').value.trim());
    }
    // Switches the form between fish and shellfish: gear instead of lures, count instead of size, crab and pot details.
    function paintKind() {
      const shell = draftKind === 'shellfish';
      $$('#seg-kind button').forEach((b) => { const on = b.dataset.kind === draftKind; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
      $$('#seg-water button').forEach((b) => { const on = b.dataset.water === draftWater; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
      $('#lbl-bait').firstChild.textContent = shell ? 'Gear & bait ' : 'Lure or bait ';
      $('#f-lure-color').placeholder = shell ? 'Bait used (optional)' : 'Colour (optional)'; $('#f-lure-color').setAttribute('aria-label', shell ? 'Bait used' : 'Lure colour');
      $('#f-lure-size').hidden = shell; $('#size-row').hidden = shell; if (shell) $('#wt-est').hidden = true;
      $('#tackle-chips').hidden = shell || !tackle.length;
      $('#lbl-count').textContent = shell ? 'How many?' : 'How many fish?';
      $('#f-species-find').placeholder = 'Search 280+ fish and shellfish';
      paintShellExtras();
    }
    function setKind(k, keepSpecies) {
      if (k === draftKind) return; draftKind = k;
      if (!keepSpecies) { $('#f-species').value = ''; $('#f-bait').value = ''; $('#f-lure-color').value = ''; draft.tackleId = null; }
      fillChoices(); paintKind(); paintCombos();
    }
    function setWater(w) { if (w === draftWater) return; draftWater = w; fillSpeciesMenu(); paintKind(); }
    // Water from the place: a spot set to Freshwater or Saltwater decides; far from any tide station means freshwater;
    // near the coast it could be either (a lake on an island), so both are shown.
    function autoWater() {
      if (waterTouched || $('#f-species').value.trim()) return;
      const sp = draft.spotId && spotById(draft.spotId);
      let w = 'both';
      if (sp && sp.water === 'fresh') w = 'Freshwater'; else if (sp && sp.water === 'salt') w = 'Saltwater';
      else if (draft.tide && (draft.tide.none || draft.tide.distM > TIDE_MAX / 2)) w = 'Freshwater';
      setWater(w);
    }
    $('#seg-kind').addEventListener('click', (e) => { const b = e.target.closest('[data-kind]'); if (!b) return; dirty = true; setKind(b.dataset.kind); store('tl.lastKind', draftKind); });
    $('#seg-water').addEventListener('click', (e) => { const b = e.target.closest('[data-water]'); if (!b) return; waterTouched = true; setWater(b.dataset.water); });

    // Crab sex, shell and width; pots and soak time; a biotoxin note for clams, oysters, mussels and scallops.
    let draftSex = null; let draftShell = null;
    let beachKey = '';
    function paintBeachStatus() {
      const L = draft && draft.location; const box = $('#shell-live'); if (!box) return;
      if (!L || !inWA(L.lat, L.lon) || !navigator.onLine) { box.innerHTML = ''; return; }
      const key = `${L.lat.toFixed(3)},${L.lon.toFixed(3)}`; if (key === beachKey) return; beachKey = key;
      box.innerHTML = '<span class="help small"><span class="spin"></span>Checking beach status…</span>';
      beachesNear(L, 600).then((list) => { if (beachKey === key) box.innerHTML = list.length ? beachHtml(list, { max: 2 }) : '<span class="help small">No public shellfish beach mapped within 600 m.</span>'; })
        .catch(() => { if (beachKey === key) box.innerHTML = ''; });
    }
    function paintShellExtras() {
      const shell = draftKind === 'shellfish'; const sp = $('#f-species').value.trim(); const type = typeOf(sp) || (FISH_TYPES.has($('#f-species-select').value) ? $('#f-species-select').value : null);
      $('#shell-extras').hidden = !shell;
      const crab = shell && (type === 'Crab' || sp === 'Crab'); $('#crab-fields').hidden = !crab;
      $('#pot-fields').hidden = !shell || !isPotGear($('#f-bait').value);
      $('#shell-safety').hidden = !shell || !BIVALVE_TYPES.has(type || sp);
      if (!$('#shell-safety').hidden) paintBeachStatus();
      $$('#seg-sex button').forEach((b) => b.classList.toggle('on', b.dataset.sex === draftSex));
      $$('#seg-shell button').forEach((b) => b.classList.toggle('on', b.dataset.shell === draftShell));
      const h = $('#crab-hint'); const problems = crab ? keepProblems({ species: sp, crabSex: draftSex, shellHard: draftShell ? draftShell === 'hard' : null, carapaceCm: U.lenIn(num($('#f-carapace').value)) }) : [];
      h.hidden = !problems.length || draftReleased === true;
      if (!h.hidden) h.textContent = `This crab can't be kept under your limits (${problems.join('; ')}). Release it.`;
    }
    $('#seg-sex').addEventListener('click', (e) => { const b = e.target.closest('[data-sex]'); if (!b) return; dirty = true; draftSex = draftSex === b.dataset.sex ? null : b.dataset.sex; paintShellExtras(); });
    $('#seg-shell').addEventListener('click', (e) => { const b = e.target.closest('[data-shell]'); if (!b) return; dirty = true; draftShell = draftShell === b.dataset.shell ? null : b.dataset.shell; paintShellExtras(); });
    $('#f-carapace').addEventListener('input', paintShellExtras);
    // Keeps the dropdown, the "other" text box and the quick-pick chips in step.
    // Second dropdown for a primary species' subspecies and variants. Its first choice records just the primary species.
    // Second menu: every kind of the chosen fish type, in sections for big types. "Not sure which" records just the type.
    const typeWord = (t) => t.toLowerCase().replace(' & ', ' or ');   // 'Trout & char' → 'trout or char'
    function paintSubspecies(type, value) {
      const T = type && FISH_TYPES.get(type); const wrap = $('#sub-species-wrap'); const sub = $('#f-subspecies');
      if (!T) { wrap.hidden = true; sub.innerHTML = ''; return; }
      wrap.hidden = false; $('#sub-species-label').textContent = `Which ${typeWord(type)}?`;
      const opt = (x) => `<option value="${esc(x)}">${esc(x)}</option>`;
      sub.innerHTML = `<option value="" disabled>Choose a kind…</option>` +
        T.sections.map(([label, list]) => (label ? `<optgroup label="${esc(label)}">${list.map(opt).join('')}</optgroup>` : list.map(opt).join(''))).join('') +
        `<optgroup label="Not sure"><option value="${esc(type)}">Not sure which – save as “${esc(type)}”</option></optgroup>`;
      sub.value = value && (T.flat.includes(value) || value === type) ? value : '';
      sub.classList.toggle('placeholder', !sub.value); sub.classList.remove('invalid');
    }
    function setSpecies(v, fromOther) {
      const info = v && SPECIES_INFO.get(v);
      if (info && !fromOther && (info.kind !== draftKind || (draftWater !== 'both' && info.region !== draftWater))) {
        draftKind = info.kind; if (draftWater !== 'both' && info.region !== draftWater) draftWater = info.region;
        $('#f-species').value = v; fillBaitMenu(); fillSpeciesMenu(); paintKind(); return;
      }
      const sel = $('#f-species-select'); const input = $('#f-species');
      const parent = v && (PARENT_SPECIES.get(v) || (FISH_TYPES.has(v) ? v : null));
      const listed = v && (parent || [...sel.options].some((o) => o.value === v && o.value !== OTHER));
      if (!fromOther) {
        if (!v) { sel.value = ''; input.hidden = true; paintSubspecies(null); }
        else if (listed) { sel.value = parent || v; input.hidden = true; paintSubspecies(parent || v, v); }
        else { sel.value = OTHER; input.hidden = false; paintSubspecies(null); }
        input.value = v || '';
      }
      sel.classList.toggle('placeholder', !sel.value);
      sel.classList.remove('invalid'); input.classList.remove('invalid'); if (v || input.value.trim()) $('#err-species').hidden = true;
      if (draft) { paintWtEst(); paintKept(); paintShellExtras(); }
      $$('#species-chips .chip').forEach((x) => x.classList.toggle('on', x.dataset.species === input.value.trim()));
    }
    $('#f-species-select').addEventListener('change', (e) => {
      const v = e.target.value; dirty = true;
      if (v === OTHER) { $('#f-species').value = ''; $('#f-species').hidden = false; paintSubspecies(null); setSpecies('', true); $('#f-species').focus(); }
      else if (FISH_TYPES.has(v)) { $('#f-species').value = ''; $('#f-species').hidden = true; paintSubspecies(v, ''); setSpecies('', true); $('#f-subspecies').focus(); }
      else setSpecies(v);
    });
    $('#f-species').addEventListener('input', () => setSpecies($('#f-species').value, true));
    $('#f-subspecies').addEventListener('change', (e) => { dirty = true; setSpecies(e.target.value); });
    // Type part of a name ("crappie", "cutthroat", "gar") to find a fish without scrolling the long list.
    function findFish() {
      const q = $('#f-species-find').value.trim().toLowerCase(); const box = $('#species-find-results');
      if (q.length < 2) { box.hidden = true; box.innerHTML = ''; return; }
      const all = [...new Set([...catches.map((c) => c.species), ...KNOWN_SPECIES])];
      const words = q.split(/\s+/);
      const hits = all.filter((n) => words.every((w) => n.toLowerCase().includes(w)))
        .sort((a, b) => (b.toLowerCase().startsWith(q) - a.toLowerCase().startsWith(q)) || a.length - b.length || a.localeCompare(b)).slice(0, 8);
      box.hidden = false;
      box.innerHTML = hits.length ? hits.map((n) => `<button type="button" class="chip" data-find="${esc(n)}">${esc(n)}</button>`).join('')
        : (() => { const raw = $('#f-species-find').value.trim().replace(/\s+/g, ' '); const name = raw.replace(/(^|[\s-])\S/g, (m) => m.toUpperCase());
          return `<span class="help small">Not in the list.</span> <button type="button" class="chip" data-find="${esc(name)}">Use “${esc(name)}”</button>`; })();
    }
    $('#f-species-find').addEventListener('input', findFish);
    $('#species-find-results').addEventListener('click', (e) => { const c = e.target.closest('[data-find]'); if (!c) return; dirty = true; setSpecies(c.dataset.find); $('#f-species-find').value = ''; findFish(); });
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
      if (draft) paintShellExtras();
      if (draft && draft.tackleId) { const t = tackle.find((y) => y.id === draft.tackleId); if (!t || t.bait !== input.value.trim()) { draft.tackleId = null; paintTackleChips(); } }
      $$('#bait-chips .chip').forEach((x) => x.classList.toggle('on', x.dataset.bait === input.value.trim()));
    }
    $('#f-bait-select').addEventListener('change', (e) => {
      const v = e.target.value; dirty = true;
      if (v === OTHER) { $('#f-bait').value = ''; $('#f-bait').hidden = false; setBait('', true); $('#f-bait').focus(); }
      else { clearAutoLure(); setBait(v); }
    });
    $('#f-bait').addEventListener('input', () => setBait($('#f-bait').value, true));
    $('#bait-chips').addEventListener('click', (e) => { const c = e.target.closest('.chip[data-bait]'); if (c) { dirty = true; if (c.dataset.bait !== $('#f-bait').value.trim()) clearAutoLure(); setBait(c.dataset.bait); } });

    // Tackle box: one tap picks the exact lure (type, colour and size).
    function fillTackleChips() {
      $('#tackle-chips').hidden = !tackle.length || draftKind === 'shellfish';
      $('#tackle-chips').innerHTML = tackle.length ? `<span class="tk-chips-label">From your tackle box</span><div class="tk-chip-row">${tackle.map((t) => { const u = tackleThumb(t);
        return `<button type="button" class="tk-chip" data-tk="${t.id}">${u ? `<img src="${u}" alt="">` : '<span class="tk-dot" aria-hidden="true">🎣</span>'}<span><b>${esc(t.name || t.bait)}</b><small>${esc([t.name ? t.bait : '', t.color, t.size].filter(Boolean).join(' · '))}</small></span></button>`; }).join('')}</div>` : '';
      paintTackleChips();
    }
    function paintTackleChips() { $$('#tackle-chips .tk-chip').forEach((x) => { const on = x.dataset.tk === (draft && draft.tackleId); x.classList.toggle('on', on); x.setAttribute('aria-pressed', String(on)); }); }
    $('#tackle-chips').addEventListener('click', (e) => {
      const x = e.target.closest('[data-tk]'); if (!x) return; const t = tackle.find((y) => y.id === x.dataset.tk); if (!t) return;
      dirty = true; setBait(t.bait); $('#f-lure-color').value = t.color || ''; $('#f-lure-size').value = t.size || ''; lureAuto = false;
      draft.tackleId = t.id; paintTackleChips(); if (typeof paintCombos === 'function') paintCombos();
    });

    // Estimated weight from length: the standard weight-for-length of a typical fish of that species.
    function paintWtEst() {
      const box = $('#wt-est'); const sp = $('#f-species').value.trim(); const cm = U.lenIn(num($('#f-length').value));
      const hasWt = $('#f-weight').value.trim() || (!$('#f-weight-oz').hidden && $('#f-weight-oz').value.trim());
      const kg = cm ? typicalWeightKg(sp, cm) : null;
      box.hidden = !kg || !!hasWt || draftKind === 'shellfish'; if (box.hidden) return;
      $('#wt-est-text').textContent = `A typical ${U.len(cm)} ${sp} weighs about ${U.wt(kg)}.`;
      box.dataset.kg = String(kg);
    }
    $('#wt-est-use').addEventListener('click', () => {
      const kg = Number($('#wt-est').dataset.kg); if (!kg) return; dirty = true;
      if (!$('#f-weight-oz').hidden) { const t = Math.round((kg / 0.45359237) * 16); $('#f-weight').value = String(Math.floor(t / 16)); $('#f-weight-oz').value = String(t % 16); }
      else $('#f-weight').value = U.wtOut(kg);
      draft.weightEst = true; $('#wt-est').hidden = true; toast('Estimated weight filled in – change it if you weighed the fish');
    });
    ['#f-weight', '#f-weight-oz'].forEach((x) => $(x).addEventListener('input', () => { if (draft) draft.weightEst = false; paintWtEst(); }));
    ['#f-length', '#f-species'].forEach((x) => $(x).addEventListener('input', paintWtEst));

    // Daily bag limit: how many of this fish you've kept today.
    function paintKept() {
      const el = $('#kept-hint'); const sp = $('#f-species').value.trim(); const lim = bagLimit(sp);
      if (!lim) { el.hidden = true; return; }
      const before = keptToday(sp, editing && editing.id); const after = before + (draftReleased === false ? draftCount : 0);
      el.hidden = false; el.classList.toggle('over', after > lim); el.classList.toggle('full', after === lim);
      el.textContent = draftReleased === false
        ? `Kept today: ${after} of ${lim} ${limitLabel(sp)} with this one${after > lim ? ' – over your limit' : after === lim ? ' – that’s your limit' : ''}.`
        : `Kept today: ${before} of ${lim} ${limitLabel(sp)}.`;
    }

    // How many fish
    let draftCount = 1;
    function paintCount() { $('#count-value').textContent = draftCount; $('#count-minus').disabled = draftCount <= 1; if (draft) paintKept(); }
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

    // Say it: fills the fish, lure or gear, count and kept/released from speech.
    $('#f-say').hidden = !SR;
    $('#f-say').addEventListener('click', async () => {
      toast('Listening…');
      let alts; try { alts = await listen(); } catch (e) { toast(e.message); return; }
      const p = bestSpoken(alts); if (!p.species && !p.bait) { toast(`Heard “${alts[0]}” – nothing to fill in.`); return; }
      dirty = true;
      if (p.species) setSpecies(p.species);
      if (p.bait) setBait(p.bait);
      if (p.count > 1) { draftCount = p.count; paintCount(); }
      if (p.released !== undefined) { draftReleased = p.released; paintReleased(); paintKept(); paintShellExtras(); }
      toast(`Heard “${p.text}”`);
    });
    let draftReleased = null;
    function paintReleased() { $$('#seg-released button').forEach((b) => { const on = (b.dataset.rel === 'released' && draftReleased === true) || (b.dataset.rel === 'kept' && draftReleased === false); b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); }); }
    $('#seg-released').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return; dirty = true;
      const v = b.dataset.rel === 'released'; draftReleased = draftReleased === v ? null : v; paintReleased(); paintKept(); paintShellExtras();
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
      if (spotTouched) { fillSpots(); autoWater(); return; }
      const m = matchSpot(draft.location);
      draft.spotId = m ? m.spot.id : null; draft.autoMatched = !!m;
      fillSpots(); showTide(); autoWater();
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
      spotHint(); showTide(); autoWater(); if (draft.newSpot) $('#f-spot-name').focus();
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
        draft.tide = t; draft.tideStatus = null; draft.marine = undefined; showTide(); autoWater();
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
      draft = c ? { photos, location: c.location, weather: c.weather, tide: c.tide, marine: c.marine, spotId: c.spotId || null, tackleId: c.tackleId || null, weightEst: !!c.weightEst } : { photos: [], location: null, weather: null, tide: undefined, spotId: (pre && pre.spotId) || null, tackleId: (pre && pre.tackleId) || null, weightEst: false };
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
      $('#err-species').hidden = true; $('#err-bait').hidden = true; hidePhotoMeta(); $('#f-species-find').value = ''; $('#species-find-results').hidden = true;
      $('#f-notes').value = c ? c.notes || '' : '';
      $('#f-lat').value = ''; $('#f-lon').value = ''; $('.manual-loc').open = false;
      $('#f-spot-name').value = '';
      const kindSrc = c || (src.species ? { species: src.species } : null);
      draftKind = kindSrc ? kindOf(kindSrc) : (store('tl.lastKind') === 'shellfish' ? 'shellfish' : 'fish');
      waterTouched = false; draftWater = 'both';
      draftSex = c ? c.crabSex || null : null; draftShell = c ? (c.shellHard === true ? 'hard' : c.shellHard === false ? 'soft' : null) : null;
      $('#f-carapace').value = c ? U.lenOut(c.carapaceCm) : ''; $('#f-pots').value = c && c.pots ? String(c.pots) : (pre && pre.pots ? String(pre.pots) : '');
      $('#f-soak').value = c && c.soakH ? String(c.soakH) : (pre && pre.soakH ? String(pre.soakH) : '');
      if (kindOf(kindSrc || {}) === 'shellfish' || draftKind === 'shellfish') $('#f-lure-color').value = (c ? c.shellBait : src.shellBait) || '';
      fillChoices(); paintKind(); fillTackleChips(); fillCombos(); showPhoto(); showLoc(); showWx(); fillSpots(); showTide(); paintCombos(); paintWtEst(); paintKept();
      openSheet($('#sheet-form'));
      if (!c) locate();
      else { if (c.location && !c.weather) loadWeather(); if (c.location && c.tide === undefined) loadTide(); }
    }
    async function cancel() {
      if (dirty && !(await askConfirm(editing ? 'Discard your changes?' : 'Discard this catch?', 'Discard'))) return;
      closeSheet();
    }
    function onClosed() { wxToken++; photoUrls.forEach((u) => URL.revokeObjectURL(u)); photoUrls = []; }

    let saving = false;
    el.addEventListener('submit', async (e) => {
      e.preventDefault(); if (saving) return;
      saving = true; $('#btn-save-catch').disabled = true;
      try { await submitCatch(); } finally { saving = false; $('#btn-save-catch').disabled = false; }
    });
    async function submitCatch() {
      const species = $('#f-species').value.trim(); const bait = $('#f-bait').value.trim();
      const typeOpen = !species && FISH_TYPES.has($('#f-species-select').value);
      const spField = typeOpen ? $('#f-subspecies') : ($('#f-species').hidden ? $('#f-species-select') : $('#f-species'));
      spField.classList.toggle('invalid', !species); ($('#f-bait').hidden ? $('#f-bait-select') : $('#f-bait')).classList.toggle('invalid', !bait);
      $('#err-species').hidden = !!species; $('#err-bait').hidden = !!bait;
      if (!species || !bait) {
        const shell = draftKind === 'shellfish';
        const missing = [!species && (typeOpen ? `which ${typeWord($('#f-species-select').value)} it is` : shell ? 'the shellfish' : 'the fish type'), !bait && (shell ? 'the gear' : 'the lure or bait')].filter(Boolean).join(' and ');
        $('#err-species').textContent = typeOpen ? `Choose which ${typeWord($('#f-species-select').value)} (or "Not sure which").` : shell ? 'Choose the shellfish.' : 'Choose the fish type.';
        $('#err-bait').textContent = shell ? 'Add the gear you used.' : 'Add the lure or bait.';
        formError(`${typeOpen ? 'Choose' : 'Add'} ${missing} to save.`, !species ? spField : ($('#f-bait').hidden ? $('#f-bait-select') : $('#f-bait')));
        return;
      }
      if (caughtAtValue() > Date.now() + 15 * 60000) { formError('That time is in the future. Check the date and time it was caught.', $('#f-time')); return; }
      if (draftKind !== 'shellfish') {
        const len = num($('#f-length').value); const wt = num($('#f-weight').value); const oz = $('#f-weight-oz').hidden ? null : num($('#f-weight-oz').value);
        if ((len != null && len <= 0) || (wt != null && wt < 0) || (oz != null && oz < 0) || (wt === 0 && !oz)) { formError('Length and weight must be more than 0. Leave them empty if you didn\u2019t measure.', len != null && len <= 0 ? $('#f-length') : $('#f-weight')); return; }
        const lenIn = len == null ? null : (imp() ? len : len / 2.54); const lb = wt == null ? null : (imp() ? wt + (oz || 0) / 16 : wt * 2.20462);
        if ((lenIn != null && lenIn > 120) || (lb != null && lb > 400)) {
          if (!(await askConfirm(`${lenIn != null && lenIn > 120 ? U.len(len * (imp() ? 2.54 : 1)) : U.wt(lb / 2.20462)} is bigger than almost any fish. Save it anyway?`, 'Save anyway'))) return;
        }
      }
      const shellFields = draftKind === 'shellfish' ? { crabSex: $('#crab-fields').hidden ? null : draftSex, shellHard: $('#crab-fields').hidden || !draftShell ? null : draftShell === 'hard', carapaceCm: $('#crab-fields').hidden ? null : U.lenIn(num($('#f-carapace').value)) } : {};
      if (draftReleased === false && !(await overLimitOk(species, draftCount, editing && editing.id, shellFields))) return;
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
        tackleId: draft.tackleId && tackle.some((t) => t.id === draft.tackleId && t.bait === bait) ? draft.tackleId : null,
        weightEst: !!draft.weightEst && $('#f-weight').value.trim() !== '',
        kind: draftKind,
      };
      if (draftKind === 'shellfish') {
        Object.assign(rec, shellFields, { shellBait: $('#f-lure-color').value.trim(), lureColor: '', lureSize: '', lengthCm: null, weightKg: null, weightEst: false, tackleId: null,
          pots: $('#pot-fields').hidden ? null : Math.round(num($('#f-pots').value) || 0) || null, soakH: $('#pot-fields').hidden ? null : num($('#f-soak').value) });
      } else { ['crabSex', 'shellHard', 'carapaceCm', 'shellBait', 'pots', 'soakH'].forEach((k) => { delete rec[k]; }); }
      const pb = personalBest(rec);
      const ses = !editing && sessionFor(rec.caughtAt);
      if (ses) rec.sessionId = ses.id;
      try {
        if (createdSpot) { await DB.putSpot(createdSpot); spots.push(createdSpot); await linkCatchesToSpot(createdSpot); }
        await DB.put(rec);
      } catch (err) { formError('Could not save: ' + ((err && err.message) || 'storage error')); return; }
      store('tl.lastReleased', draftReleased === true ? 'released' : draftReleased === false ? 'kept' : ''); store('tl.lastKind', draftKind);
      if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
      if (ses) await sessionCaught(ses, rec);
      const wasEditing = !!editing; dirty = false;
      closeSheet();
      await reload(); backfillFlow().catch(() => {});
      if (pb) celebrate(pb, rec, wasEditing ? null : { label: 'Log another', fn: () => open(null, sameAs(rec)) });
      else if (wasEditing) toast('Catch updated');
      else toast(`${draftCount > 1 ? draftCount + ' × ' : ''}${species} logged 🎣${needsCrc(rec) ? ' · now record it on your catch record card' : ''}`, { label: 'Log another', fn: () => open(null, sameAs(rec)) });
      if (wasEditing && !$('#sheet-detail').hidden) renderDetail(rec.id);
    }

    return { open, cancel, onClosed };
  })();
  // What "Log another" and "Same again" carry over to the next catch.
  const sameAs = (c) => ({ species: c.species, bait: c.bait, lureColor: c.lureColor, lureSize: c.lureSize, tackleId: c.tackleId || null, shellBait: c.shellBait || '', pots: c.pots || null, soakH: c.soakH || null, spotId: c.spotId && spotById(c.spotId) ? c.spotId : null, released: c.released });

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
      <p class="detail-sub">${c.from ? `Caught by ${esc(c.from)} · ` : ''}${esc(fmtFull(c.caughtAt))}${c.released === true ? ' · Released' : c.released === false ? ' · Kept' : ''}</p>
      <div class="kv"><h4>Catch</h4><dl>
        ${kindOf(c) === 'shellfish' ? `${row('Gear', c.bait)}${row('Bait', c.shellBait)}${nFish(c) > 1 ? row('Number caught', String(nFish(c))) : ''}${row('Sex', c.crabSex === 'male' ? 'Male' : c.crabSex === 'female' ? 'Female' : null)}${row('Shell', c.shellHard === true ? 'Hard' : c.shellHard === false ? 'Soft' : null)}${row('Carapace width', U.len(c.carapaceCm))}${row('Pots or rings', c.pots ? String(c.pots) : null)}${row('Soak time', c.soakH ? `${round(c.soakH, 1)} h` : null)}${row('Released', c.released === true ? 'Yes' : c.released === false ? 'No – kept' : null)}` : `${row('Lure / bait', c.bait)}${c.tackleId && tackle.find((t) => t.id === c.tackleId && t.name) ? row('From tackle box', tackle.find((t) => t.id === c.tackleId).name) : ''}${row('Colour', c.lureColor)}${row('Size', c.lureSize)}${nFish(c) > 1 ? row('Number of fish', String(nFish(c))) : ''}${row('Length', U.len(c.lengthCm))}${row(c.weightEst ? 'Weight (estimated)' : 'Weight', c.weightEst && c.weightKg != null ? '≈ ' + U.wt(c.weightKg) : U.wt(c.weightKg))}${row('Released', c.released === true ? 'Yes' : c.released === false ? 'No – kept' : null)}`}
      </dl></div>
      ${kindOf(c) === 'shellfish' && BIVALVE_TYPES.has(typeOf(c.species)) ? '<p class="safety-note">Before eating clams, oysters, mussels or scallops from Washington beaches, check the <a href="https://fortress.wa.gov/doh/biotoxin/biotoxin.html" target="_blank" rel="noopener">Shellfish Safety Map</a> for biotoxin closures (hotline 1-800-562-5632).</p>' : ''}
      <div class="kv"><h4>Conditions</h4><dl>
        ${w ? `${row('Weather', `${wl.icon} ${wl.text}`)}${row('Air temp', U.temp(w.tempC))}${row('Feels like', U.temp(w.feelsC))}
          ${row('Wind', `${U.wind(w.windKmh)} ${compass(w.windDir)}`)}${row('Gusts', U.wind(w.gustKmh))}
          ${row('Pressure', `${U.pressure(w.pressure)}${w.pressureTrend ? ` ${trendArrow(w.pressureTrend)} ${w.pressureTrend}` : ''}`)}
          ${row('Humidity', w.humidity != null ? w.humidity + '%' : null)}${row('Cloud cover', w.cloud != null ? w.cloud + '%' : null)}${row('Precipitation', U.precip(w.precipMm))}`
          : row('Weather', L ? 'Pending – needs a connection' : 'Not recorded')}
        ${row('Moon', `${moon.icon} ${moon.name} (${moon.illum}%)`)}
      </dl></div>
      ${c.flow ? `<div class="kv"><h4>River</h4><dl>${row('Flow', `${trendSym(c.flow.trend)} ${cfsText(c.flow.cfs)}${c.flow.trend ? ' · ' + c.flow.trend.toLowerCase() : ''}`)}${row('Gauge', `${c.flow.name || c.flow.site} (${fmtDist(c.flow.distM)})`)}</dl></div>` : ''}
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
        <span class="pin heat-${spotHeat(sp)}" title="${spotHeat(sp) === 'hot' ? 'Fish in the last 30 days' : spotHeat(sp) === 'warm' ? 'Fish in the last 31–90 days' : 'No fish in 90 days'}"><svg viewBox="0 0 24 24"><use href="#i-pin"/></svg></span>
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
      ${sp.water !== 'salt' && !list.some((c) => tideShown(c)) ? '<div id="spot-flow"></div>' : ''}
      ${inWA(sp.lat, sp.lon) ? '<div id="spot-wa"></div>' : ''}
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
    if ($('#spot-wa')) fillShellSafety($('#spot-wa'), { lat: sp.lat, lon: sp.lon, salt: sp.water === 'salt' || (sp.water !== 'fresh' && list.some((c) => tideShown(c))) }, { title: 'Shellfish safety nearby' }).catch(() => {});
    if ($('#spot-flow') && navigator.onLine) {
      flowNear(sp).then((f) => { const box = $('#spot-flow'); if (box && f && spotDetailId === id) box.innerHTML = `<div class="card" style="margin-bottom:12px"><div class="now-grid">${flowCell(f)}</div></div>`; }).catch(() => {});
    }
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
      if (e.target.dataset.busy) return;
      const others = spots.filter((x) => !editing || x.id !== editing.id);
      const same = others.find((x) => x.name.trim().toLowerCase() === name.toLowerCase());
      const near = others.find((x) => distM(x, loc) < 50);
      if (same || near) {
        e.target.dataset.busy = '1';
        const ok = await askConfirm(same ? `You already have a spot called ${same.name}${near === same ? ' here' : ''}. Save another one?` : `${near.name} is already saved within 50 m of here. Save a second spot anyway?`, 'Save anyway');
        delete e.target.dataset.busy; if (!ok) return;
      }
      e.target.dataset.busy = '1'; setTimeout(() => { delete e.target.dataset.busy; }, 1500);
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
      ${!far ? `<div class="card" style="margin-bottom:12px"><h3>Best clam tides</h3><p class="sub">Daylight low tides below 0, next two weeks. Dig 1–2 hours either side of the low.</p>
        ${clamTideList(minusLows(ev, st.lat, st.lon, today, 14).slice(0, 10))}</div>` : ''}
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
        el.querySelectorAll('[data-open]').forEach((b) => { b.onclick = () => showDetail(b.dataset.open); });
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
  // Spots are coloured by how recently you caught fish there; nearby catches merge into one numbered pin.
  let mapSpecies = ''; let catchLayer = null; let mapList = [];
  const HEAT = { hot: '#e8611a', warm: '#13707f', cold: '#7f8c8e' };
  function spotHeat(sp) {
    const last = Math.max(0, ...catches.filter((c) => c.spotId === sp.id).map((c) => c.caughtAt)); if (!last) return 'cold';
    const d = (Date.now() - last) / 86400000; return d <= 30 ? 'hot' : d <= 90 ? 'warm' : 'cold';
  }
  function fillMapSpecies() {
    const all = [...new Set(catches.filter((c) => c.location).map((c) => c.species))].sort((a, b) => a.localeCompare(b));
    if (!all.includes(mapSpecies)) mapSpecies = '';
    $('#map-species').innerHTML = `<option value="">All fish</option>${all.map((v) => `<option value="${esc(v)}">${esc(v)}</option>`).join('')}`;
    $('#map-species').value = mapSpecies; $('.map-filter').hidden = all.length < 2;
  }
  function catchPopup(c) { const t = thumbUrl(c); return `<div class="pop">${t ? `<img src="${t}" alt="">` : ''}<b>${esc(c.species)}</b><br>${esc(c.bait)}<br>${fmtDate(c.caughtAt)}<br><button type="button" data-open="${c.id}">View catch</button></div>`; }
  const pinIcon = () => L.divIcon({ className: '', html: '<div class="map-pin"></div>', iconSize: [18, 18], iconAnchor: [9, 9] });
  function drawCatches() {
    if (!catchLayer) return; catchLayer.clearLayers();
    if (!map.project || !map.getZoom) { mapList.forEach((c) => L.marker([c.location.lat, c.location.lon], { icon: pinIcon() }).addTo(catchLayer).bindPopup(catchPopup(c))); return; }
    const z = map.getZoom(); const cells = new Map();
    mapList.forEach((c) => { const p = map.project([c.location.lat, c.location.lon], z); const k = `${Math.floor(p.x / 52)}:${Math.floor(p.y / 52)}`; if (!cells.has(k)) cells.set(k, []); cells.get(k).push(c); });
    cells.forEach((g) => {
      if (g.length === 1) { L.marker([g[0].location.lat, g[0].location.lon], { icon: pinIcon() }).addTo(catchLayer).bindPopup(catchPopup(g[0])); return; }
      const lat = g.reduce((a, c) => a + c.location.lat, 0) / g.length; const lon = g.reduce((a, c) => a + c.location.lon, 0) / g.length;
      const size = g.length < 10 ? 34 : g.length < 100 ? 40 : 46;
      const m = L.marker([lat, lon], { icon: L.divIcon({ className: '', html: `<div class="map-cluster" style="width:${size}px;height:${size}px" aria-label="${g.length} catches">${g.length}</div>`, iconSize: [size, size], iconAnchor: [size / 2, size / 2] }) }).addTo(catchLayer);
      if (z >= 17) m.bindPopup(`<div class="pop"><b>${plural(g.length, 'catch')} here</b><ul class="pop-list">${g.slice(0, 8).map((c) => `<li><button type="button" data-open="${c.id}">${esc(c.species)} · ${fmtDate(c.caughtAt)}</button></li>`).join('')}</ul>${g.length > 8 ? `<small>and ${g.length - 8} more</small>` : ''}</div>`);
      else m.on('click', () => map.fitBounds(g.map((c) => [c.location.lat, c.location.lon]), { padding: [60, 60], maxZoom: Math.min(18, z + 3) }));
    });
  }
  function renderMap(fit) {
    if (!map) return; layer.clearLayers(); fillMapSpecies();
    if (!catchLayer) { catchLayer = L.layerGroup().addTo(map); if (map.on) map.on('zoomend', drawCatches); }
    mapList = catches.filter((c) => c.location && (!mapSpecies || c.species === mapSpecies));
    const pts = mapList.map((c) => [c.location.lat, c.location.lon]);
    drawCatches();
    spots.filter((sp) => !mapSpecies || catches.some((c) => c.spotId === sp.id && c.species === mapSpecies)).forEach((sp) => {
      const n = fishIn(catches.filter((c) => c.spotId === sp.id && (!mapSpecies || c.species === mapSpecies))); const heat = spotHeat(sp);
      L.circle([sp.lat, sp.lon], { radius: sp.radiusM || 250, color: HEAT[heat], weight: 2, fillOpacity: heat === 'hot' ? 0.14 : 0.08, interactive: false }).addTo(layer);
      L.marker([sp.lat, sp.lon], { icon: L.divIcon({ className: '', html: `<span class="spot-label heat-${heat}">${esc(sp.name)}</span>`, iconSize: [0, 0] }) }).addTo(layer)
        .bindPopup(`<div class="pop"><b>${esc(sp.name)}</b><br>${plural(n, 'fish')}${mapSpecies ? ` (${esc(mapSpecies)})` : ''}<br><button type="button" data-spot="${sp.id}">View spot</button></div>`);
      pts.push([sp.lat, sp.lon]);
    });
    $('#map-legend').hidden = !spots.length;
    if (fit && pts.length) { map.fitBounds(pts, { padding: [40, 40], maxZoom: 14 }); mapCentred = true; }
    $('#map-msg').hidden = pts.length > 0 || mapCentred; if (!pts.length) $('#map-msg').textContent = mapSpecies ? `No ${mapSpecies} on the map yet.` : 'Your spots and catches with a location will show up here. Tap ◎ to find yourself on the map.';
  }
  $('#map-species').addEventListener('change', (e) => { mapSpecies = e.target.value; renderMap(true); });

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
    solunar: { label: 'Solunar', needsWx: false, buckets: () => ['Major period', 'Minor period', 'Outside periods'],
      of: (c) => { const L = c.location || (c.spotId && spotById(c.spotId)); if (!L) return null; const p = SOL.at(c.caughtAt, L.lat, L.lon); return p ? (p.kind === 'major' ? 'Major period' : 'Minor period') : 'Outside periods'; } },
    flow: { label: 'River flow', needsFlow: true, buckets: () => ['Rising', 'Steady', 'Falling'], of: (c) => (c.flow && c.flow.trend) || null },
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
  // Fish, shellfish or both. Shown only once you've logged shellfish; fish is the default so lures and gear don't mix.
  let statsKind = store('tl.statsKind') || 'fish';
  const hasShellfish = () => catches.some((c) => kindOf(c) === 'shellfish');
  const kindPass = (c) => !hasShellfish() || statsKind === 'all' || kindOf(c) === statsKind;
  function statsFiltered() {
    const sp = $('#st-species').value; const spot = $('#st-spot').value; const from = statsFrom();
    return catches.filter((c) => c.caughtAt >= from && kindPass(c) && (!sp || c.species === sp) &&
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

  // Crab (or shrimp) per pot-hour: how many you caught for each pot fished for an hour.
  function potHourCard(list) {
    const rows = new Map();
    list.filter((c) => kindOf(c) === 'shellfish' && c.pots > 0 && c.soakH > 0).forEach((c) => {
      const k = `${c.bait}${c.shellBait ? ' · ' + c.shellBait : ''}`; const e = rows.get(k) || { n: 0, ph: 0 }; e.n += nFish(c); e.ph += c.pots * c.soakH; rows.set(k, e);
    });
    if (!rows.size) return '';
    const r = [...rows.entries()].map(([k, e]) => ({ k, n: e.n, ph: e.ph, rate: e.n / e.ph })).sort((a, b) => b.rate - a.rate);
    const max = Math.max(...r.map((x) => x.rate)); const tn = r.reduce((a, x) => a + x.n, 0); const tph = r.reduce((a, x) => a + x.ph, 0);
    return `<div class="card"><h3>Catch per pot-hour</h3><p class="sub">Shellfish caught for each pot or ring fished for an hour, by gear and bait. Overall: ${round(tn / tph, 2)} per pot-hour.</p>
      <div class="fph-rows">${r.slice(0, 8).map((x) => `<div class="fph-row"><span class="lbl">${esc(x.k)}</span><span class="v">${round(x.rate, 2)}</span><span class="track"><span class="fill" style="width:${Math.max(2, (x.rate / max) * 100)}%"></span></span><small>${x.n} caught in ${round(x.ph, 1)} pot-hours</small></div>`).join('')}</div></div>`;
  }
  // Puget Sound Dungeness crab must go on a catch record card: summer (June through Labor Day) and winter (after Labor Day to Dec 31).
  function laborDay(y) { const d = new Date(y, 8, 1); while (d.getDay() !== 1) d.setDate(d.getDate() + 1); return d; }
  // Washington catch record cards (WAC 220-310): salmon, steelhead, sturgeon and halibut on the fish card (license year April 1 – March 31,
  // due April 30), Puget Sound Dungeness crab on the summer card (due Oct 1) and winter card (due Feb 1).
  const CRC_FISH = {
    Salmon: ['Chinook (King) Salmon', 'Coho (Silver) Salmon', 'Sockeye Salmon', 'Pink Salmon', 'Chum Salmon'],
    Steelhead: ['Steelhead'], Sturgeon: ['White Sturgeon', 'Green Sturgeon'], Halibut: ['Pacific Halibut'],
  };
  const crcGroup = (sp) => Object.keys(CRC_FISH).find((g) => CRC_FISH[g].includes(sp)) || (/\b(chinook|coho|sockeye|chum|pink) salmon\b|king salmon|silver salmon/i.test(sp || '') ? 'Salmon' : null);
  const HALIBUT_YEAR_LIMIT = 6; // WDFW 2026: six halibut per angler per year
  const fishesInWA = () => spots.some((x) => inWA(x.lat, x.lon)) || catches.some((c) => c.location && inWA(c.location.lat, c.location.lon)) || !!(nowState && nowState.loc && inWA(nowState.loc.lat, nowState.loc.lon));
  const catchWA = (c) => { const L = c.location || (c.spotId && spotById(c.spotId)); return L ? inWA(L.lat, L.lon) : fishesInWA(); };
  const needsCrc = (c) => c.released === false && catchWA(c) && (crcGroup(c.species) || (c.species === 'Dungeness Crab' && (() => { const L = c.location || (c.spotId && spotById(c.spotId)); return !L || L.lon > -124.4; })()));
  function licenseYear(ms) { const d = new Date(ms); const y = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1; return { start: new Date(y, 3, 1).getTime(), end: new Date(y + 1, 3, 1).getTime(), due: new Date(y + 1, 3, 30), label: `${y}–${String(y + 1).slice(2)}` }; }
  function crcFishCard() {
    const ly = licenseYear(Date.now());
    const kept = catches.filter((c) => c.released === false && crcGroup(c.species) && catchWA(c) && c.caughtAt >= ly.start && c.caughtAt < ly.end);
    if (!kept.length) return '';
    const yr0 = new Date(new Date().getFullYear(), 0, 1).getTime();
    const n = (g) => fishIn(kept.filter((c) => crcGroup(c.species) === g && (g !== 'Halibut' || c.caughtAt >= yr0)));
    const groups = Object.keys(CRC_FISH).filter((g) => n(g));
    return `<div class="card"><h3>Fish catch record card</h3><p class="sub">Salmon, steelhead, sturgeon and halibut you kept in the ${ly.label} license year (April 1 – March 31). Record each one in ink, or in the eCRC, before you keep fishing; this is only a check.</p>
      <div class="tiles">${groups.map((g) => `<div class="stat"><b>${n(g)}</b><span>${g}</span>${g === 'Halibut' ? `<small>of ${HALIBUT_YEAR_LIMIT} this year</small>` : g === 'Sturgeon' ? '<small>record each length</small>' : ''}</div>`).join('')}</div>
      <p class="note">Report by ${ly.due.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}, even if you kept nothing. <a href="https://wdfw.wa.gov/licenses/fishing/catch-reporting" target="_blank" rel="noopener">WDFW catch reporting</a></p></div>`;
  }
  // Reminders on the Now screen in the month before a card is due.
  function crcReminders() {
    const now = Date.now(); const out = [];
    const done = (() => { try { return JSON.parse(store('tl.crcDone') || '{}'); } catch { return {}; } })();
    const add = (key, title, due, list, what) => { if (done[key] || !list.length) return; const days = Math.ceil((due.getTime() + 86400000 - now) / 86400000); if (days < 0 || days > 31) return;
      out.push({ key, title, due, days, text: `${what}. Report it by ${due.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}${days <= 1 ? ' – that’s ' + (days === 1 ? 'tomorrow' : 'today') : ` (${days} days)`}, even if you kept nothing.` }); };
    // fish card for the license year that just ended
    const prev = licenseYear(now - 31 * 86400000);
    if (now >= prev.end) { const k = catches.filter((c) => crcGroup(c.species) && catchWA(c) && c.caughtAt >= prev.start && c.caughtAt < prev.end);
      add('fish' + prev.label, 'Fish catch record card due', prev.due, k, `You logged ${fishIn(k)} salmon, steelhead, sturgeon or halibut in the ${prev.label} license year (${fishIn(k.filter((c) => c.released === false))} kept)`); }
    const y = new Date(now).getFullYear();
    const crab = (a, b) => catches.filter((c) => c.species === 'Dungeness Crab' && catchWA(c) && c.caughtAt >= a && c.caughtAt < b);
    const ld = laborDay(y); const summerEnd = new Date(y, ld.getMonth(), ld.getDate() + 1).getTime();
    const sc = crab(new Date(y, 5, 1).getTime(), summerEnd); add('crabS' + y, 'Summer crab card due', new Date(y, 9, 1), sc, `You logged ${fishIn(sc)} Dungeness crab this summer (${fishIn(sc.filter((c) => c.released === false))} kept)`);
    const ldp = laborDay(y - 1); const wc = crab(new Date(y - 1, ldp.getMonth(), ldp.getDate() + 1).getTime(), new Date(y, 0, 1).getTime());
    add('crabW' + (y - 1), 'Winter crab card due', new Date(y, 1, 1), wc, `You logged ${fishIn(wc)} Dungeness crab last winter (${fishIn(wc.filter((c) => c.released === false))} kept)`);
    return out;
  }
  let nowWAKey = '';
  function renderNowWA() {
    const box = $('#now-wa'); if (!box) return;
    if (!nowState || !nowState.loc || !inWA(nowState.loc.lat, nowState.loc.lon)) { box.innerHTML = ''; nowWAKey = ''; return; }
    const st = nowState; const pl = nowPlace(st.loc); const sp = pl.spotId ? spotById(pl.spotId) : null;
    const salt = sp ? sp.water === 'salt' || (sp.water !== 'fresh' && !!(st.tide && tideShown({ tide: st.tide, spotId: sp.id }))) : !!(st.tide && tideShown({ tide: st.tide }));
    const key = `${st.at}|${pl.spotId}|${salt}`; if (key === nowWAKey && box.innerHTML) return; nowWAKey = key;
    fillShellSafety(box, { lat: st.loc.lat, lon: st.loc.lon, salt }, { title: 'Shellfish safety nearby' }).catch(() => {});
  }
  function renderNowCrc() {
    const box = $('#now-crc'); if (!box) return;
    const r = crcReminders();
    box.innerHTML = r.map((x) => `<div class="card crc-due"><h3>${esc(x.title)}</h3><p class="sub" style="margin:0 0 10px">${esc(x.text)}</p>
      <div class="btn-row"><a class="btn sm" href="https://wdfw.wa.gov/licenses/fishing/catch-reporting" target="_blank" rel="noopener">Report to WDFW</a><button type="button" class="btn sm" data-crc-done="${esc(x.key)}">I've reported it</button></div></div>`).join('');
  }

  function crcCard() {
    const kept = catches.filter((c) => c.species === 'Dungeness Crab' && c.released === false);
    if (!kept.length) return '';
    const y = new Date().getFullYear(); const ld = laborDay(y); const endSummer = new Date(y, ld.getMonth(), ld.getDate() + 1).getTime();
    const summer = fishIn(kept.filter((c) => c.caughtAt >= new Date(y, 5, 1).getTime() && c.caughtAt < endSummer));
    const winter = fishIn(kept.filter((c) => c.caughtAt >= endSummer && c.caughtAt < new Date(y + 1, 0, 1).getTime()));
    return `<div class="card"><h3>Catch record card</h3><p class="sub">Dungeness crab you kept in ${y}, for your Puget Sound catch record cards. Record each crab in ink right away; this is only a check.</p>
      <div class="tiles"><div class="stat"><b>${summer}</b><span>Summer card</span><small>June 1 – ${ld.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</small></div>
      <div class="stat"><b>${winter}</b><span>Winter card</span><small>After Labor Day – Dec 31</small></div></div>
      <p class="note">Report your cards to WDFW even if you caught nothing. <a href="https://wdfw.wa.gov/fishing/shellfishing-regulations/crab" target="_blank" rel="noopener">WDFW crab seasons and rules</a></p></div>`;
  }

  function renderStats() {
    // species filter options (keep the current choice if it still exists)
    const spSel = $('#st-species'); const cur = spSel.value;
    const spAll = [...new Set(catches.filter(kindPass).map((c) => c.species))].sort((a, b) => a.localeCompare(b));
    spSel.innerHTML = '<option value="">All species</option>' + spAll.map((v) => `<option value="${esc(v)}">${esc(v)}</option>`).join('');
    spSel.value = spAll.includes(cur) ? cur : '';
    const stSpot = $('#st-spot'); const curSpot = stSpot.dataset.want || stSpot.value; delete stSpot.dataset.want;
    stSpot.innerHTML = '<option value="">All spots</option>' + spots.map((x) => `<option value="${x.id}">${esc(x.name)}</option>`).join('') + (spots.length ? '<option value="__none">No spot</option>' : '');
    stSpot.value = [...stSpot.options].some((o) => o.value === curSpot) ? curSpot : '';
    stSpot.parentElement.hidden = !spots.length;
    $('.filter-row').style.gridTemplateColumns = spots.length ? '' : '1fr 1fr';

    const body = $('#stats-body');
    const list = statsFiltered();
    const kindBar = hasShellfish() ? `<div class="seg seg-sm stats-kind" id="stats-kind" role="group" aria-label="Fish or shellfish">${[['fish', 'Fish'], ['shellfish', 'Shellfish'], ['all', 'All']].map(([k, l]) => `<button type="button" data-skind="${k}" class="${statsKind === k ? 'on' : ''}" aria-pressed="${statsKind === k}">${l}</button>`).join('')}</div>` : '';
    const shellView = hasShellfish() && statsKind === 'shellfish';
    if (catches.length && !list.length && kindBar) { body.innerHTML = kindBar + `<div class="stats-empty"><p>No ${statsKind === 'shellfish' ? 'shellfish' : 'catches'} match these filters.</p></div>`; return; }
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
    const anyFlow = list.filter((c) => c.flow && c.flow.trend).length >= 3;
    if ((DIMENSIONS[statsDim].needsTide && !anyTide) || (DIMENSIONS[statsDim].needsFlow && !anyFlow)) statsDim = 'sky';
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

    body.innerHTML = `${kindBar}
      <div class="tiles">
        <div class="stat"><b>${fishIn(list)}</b><span>${shellView ? 'Caught' : 'Fish'}</span></div>
        <div class="stat"><b>${oneSpecies ? lures.size : species.size}</b><span>${oneSpecies ? (shellView ? 'Gear that worked' : 'Lures that worked') : (shellView ? 'Kinds' : 'Species')}</span></div>
        <div class="stat"><b>${relKnown ? pct(released, relKnown) + '%' : '–'}</b><span>Released</span>${relKnown && relKnown < list.length ? `<small>of ${relKnown} recorded</small>` : ''}</div>
        ${shellView ? (() => { const wide = list.filter((c) => c.carapaceCm != null).sort((a, b) => b.carapaceCm - a.carapaceCm)[0];
          return `<div class="stat"><b>${wide ? esc(U.len(wide.carapaceCm)) : '–'}</b><span>Widest crab</span>${wide ? `<small>${esc(wide.species)}</small>` : ''}</div>`; })()
          : `<div class="stat"><b>${big ? esc(big[0]) : '–'}</b><span>Biggest</span>${big ? `<small>${esc(big[1].species)}</small>` : ''}</div>`}
      </div>

      ${insightsCard(list)}
      ${potHourCard(list)}
      ${crcCard()}
      ${shellView ? '' : crcFishCard()}

      <div class="card">
        <h3>${shellView ? 'Best gear by conditions' : 'Best lure by conditions'}</h3>
        <p class="sub">Which ${shellView ? 'gear caught the most' : 'lures caught fish'} in each condition${[oneSpecies && esc(spSel.value), $('#st-spot').value && $('#st-spot').value !== '__none' && spotById($('#st-spot').value) && 'at ' + esc(spotById($('#st-spot').value).name)].filter(Boolean).map((x) => ` (${x})`).join('')}.</p>
        <div class="dims" role="tablist">${Object.entries(DIMENSIONS).filter(([, d]) => (anyTide || !d.needsTide) && (anyFlow || !d.needsFlow)).map(([k, d]) => `<button type="button" role="tab" class="chip${k === statsDim ? ' on' : ''}" data-dim="${k}" aria-selected="${k === statsDim}">${esc(d.label)}</button>`).join('')}</div>
        ${lureBlock}
        <p class="note">${skipped && D.needsWx ? `${plural(skipped, 'catch')} without weather data not included. ` : ''}${skipped && D.needsTide ? `${plural(skipped, 'catch')} without tide data (freshwater, inland or not looked up yet) not included. ` : ''}${shellView ? 'These are counts, so gear you use most will tend to show up most. Catch per pot-hour above is the fairer comparison for pots.' : `These are counts of fish caught, so a lure you use most will tend to show up most. ${sessions.length ? 'For a fairer comparison, see <b>Fish per hour</b> just below.' : 'Use <b>Start fishing</b> on the Now screen to get fish per hour.'}`}</p>
      </div>

      ${shellView ? '' : sessionsStatsCard()}

      ${!condCells ? `<div class="card"><h3>When you catch the most</h3><p class="sub" style="margin:0">Shows up once you've logged ${MIN_POOL} catches. You have ${list.length} so far.</p></div>` : ''}
      ${condCells ? `<div class="card"><h3>When you catch the most</h3><p class="sub">The most common condition across your catches.</p><div class="cond-grid">${condCells}</div></div>` : ''}

      ${bests ? `<div class="card"><h3>Personal bests</h3><p class="sub">Biggest of each species. Tap to open the catch.</p><ul class="best-list">${bests}</ul></div>` : ''}

      ${oneSpecies ? '' : `<div class="card"><h3>Catches by species</h3><p class="sub">&nbsp;</p>${barsHtml(spRows, Math.max(...spRows.map((x) => x[1])))}</div>`}

      <div class="card"><h3>${shellView ? 'Top gear' : 'Top lures'}</h3><p class="sub">${shellView ? 'Catches per kind of gear.' : 'Catches per lure or bait.'}</p>${barsHtml(lrRows, Math.max(...lrRows.map((x) => x[1])))}</div>
      ${tackleStatsCard(list)}
      ${tripsStatsCard()}`;
    body.querySelectorAll('.card .sub').forEach((el) => { if (el.innerHTML === '&nbsp;') el.remove(); });
  }

  $('#stats-body').addEventListener('click', (e) => {
    const sk = e.target.closest('[data-skind]'); if (sk) { statsKind = sk.dataset.skind; store('tl.statsKind', statsKind); statsSel = null; renderStats(); return; }
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
  const TYPE_GEAR = {
    fishing: BASE_GEAR,
    crabbing: ['Shellfish license with crab endorsement', 'Catch record card', 'Crab pots or ring nets', 'Bait (chicken or fish carcass) and bait cages', 'Crab gauge', 'Buoys marked with your name and address', 'Line and weights', 'Gloves', 'Cooler with ice'],
    clamming: ['Shellfish license', 'Shovel or clam gun', 'Bucket or mesh bag', 'Measuring gauge', 'Rubber boots and gloves', 'Headlamp for evening low tides', 'Check the Shellfish Safety Map before you go'],
    shrimping: ['Shellfish license', 'Shrimp pots', 'Shrimp bait (pellets or fish)', 'Long line and buoys', 'Gloves', 'Cooler with ice'],
  };
  // Washington, roughly: for the WDFW and Department of Health links.
  const inWA = (lat, lon) => lat > 45.5 && lat < 49.05 && lon > -124.9 && lon < -116.9;
  // Clam tides: low tides below 0 ft (MLLW) in daylight, give or take 45 minutes.
  function minusLows(ev, lat, lon, from, days) {
    return ev.filter((e) => e.type === 'L' && e.h < 0 && e.t >= from && e.t < from + days * 86400000).filter((e) => {
      const s2 = sunTimes(e.t, lat, lon); return s2.sunrise && s2.sunset && e.t >= s2.sunrise - 45 * 60000 && e.t <= s2.sunset + 45 * 60000;
    }).map((e) => ({ t: e.t, h: e.h }));
  }
  function clamTideList(list, opt = {}) {
    if (!list.length) return `<p class="help small" style="margin:6px 0 0">${opt.none || 'No daylight minus tides in the next two weeks.'}</p>`;
    const best = Math.min(...list.map((x) => x.h));
    return `<ul class="clam-list">${list.map((x) => `<li class="${x.h === best ? 'best' : ''}"><b>${esc(fmtDay(x.t))}</b><span>${fmtTime(x.t)}</span><span class="h">${tideH(x.h)}</span>${x.h === best ? '<em>lowest</em>' : ''}</li>`).join('')}</ul>`;
  }

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
  // ---------------------------------------------------------------- solunar (bite times)
  // Moon position from the low-precision formulas used by SunCalc (Meeus): good to a few minutes for rise, set and transit.
  // Major periods: 2 hours centred on the moon overhead and underfoot. Minor periods: 1 hour centred on moonrise and moonset.
  const SOL = (() => {
    const rad = Math.PI / 180; const dayMs = 86400000; const J2000 = Date.UTC(2000, 0, 1, 12); const e = rad * 23.4397;
    function moonState(ms, lat, lon) {
      const d = (ms - J2000) / dayMs;
      const L = rad * (218.316 + 13.176396 * d); const M = rad * (134.963 + 13.064993 * d); const F = rad * (93.272 + 13.229350 * d);
      const l = L + rad * 6.289 * Math.sin(M); const b = rad * 5.128 * Math.sin(F);
      const dec = Math.asin(Math.sin(b) * Math.cos(e) + Math.cos(b) * Math.sin(e) * Math.sin(l));
      const ra = Math.atan2(Math.sin(l) * Math.cos(e) - Math.tan(b) * Math.sin(e), Math.cos(l));
      const st = rad * (280.16 + 360.9856235 * d) + rad * lon;
      let H = (st - ra) % (2 * Math.PI); if (H > Math.PI) H -= 2 * Math.PI; if (H < -Math.PI) H += 2 * Math.PI;
      const phi = rad * lat; const alt = Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H));
      return { alt: alt / rad, H };
    }
    // Finds the moments in [from, to) when f changes sign, refined by bisection to under a minute.
    function crossings(from, to, step, f) {
      const out = []; let t0 = from; let v0 = f(t0);
      for (let t1 = from + step; t1 <= to; t1 += step) {
        const v1 = f(t1);
        if (v0 != null && v1 != null && (v0 < 0) !== (v1 < 0)) {
          let a = t0; let b = t1; let va = v0;
          for (let i = 0; i < 12; i++) { const m = (a + b) / 2; const vm = f(m); if ((vm < 0) === (va < 0)) { a = m; va = vm; } else b = m; }
          out.push({ t: Math.round((a + b) / 2), rising: v1 > v0 });
        }
        t0 = t1; v0 = v1;
      }
      return out;
    }
    const memo = new Map();
    // Everything for the local calendar day that contains dayMs.
    function day(dayMs, lat, lon) {
      const d0 = new Date(dayMs); d0.setHours(0, 0, 0, 0); const from = d0.getTime(); const d1 = new Date(from); d1.setDate(d1.getDate() + 1); const to = d1.getTime();
      const key = `${from}|${lat.toFixed(2)}|${lon.toFixed(2)}`; if (memo.has(key)) return memo.get(key);
      const step = 10 * 60000; const h0 = 0.133;   // the moon's centre at rise and set, allowing for refraction and its size
      const rs = crossings(from, to, step, (t) => moonState(t, lat, lon).alt - h0);
      // Overhead: hour angle passes 0. Underfoot: it passes ±180° (a jump from +π to −π, so test the cosine's sign instead).
      const over = crossings(from, to, step, (t) => { const s = moonState(t, lat, lon); return Math.cos(s.H) > 0 ? s.H : null; }).map((x) => x.t);
      const under = crossings(from, to, step, (t) => { const s = moonState(t, lat, lon); return Math.cos(s.H) < 0 ? -Math.sin(s.H) : null; }).map((x) => x.t);
      const majors = [...over.map((t) => ({ t, what: 'Moon overhead' })), ...under.map((t) => ({ t, what: 'Moon underfoot' }))].map((x) => ({ ...x, kind: 'major', s: x.t - HOUR_MS, e: x.t + HOUR_MS }));
      const minors = rs.map((x) => ({ t: x.t, what: x.rising ? 'Moonrise' : 'Moonset', kind: 'minor', s: x.t - HOUR_MS / 2, e: x.t + HOUR_MS / 2 }));
      const periods = [...majors, ...minors].sort((a, b) => a.t - b.t);
      // Day rating, the traditional way: best near new and full moon, better again when a period lines up with sunrise or sunset.
      const ph = moonPhase(from + 12 * HOUR_MS); const q = ph.age / ph.synodic; const fromNF = Math.min(q, Math.abs(q - 0.5), 1 - q) * ph.synodic;
      let score = fromNF <= 1.5 ? 3 : fromNF <= 4 ? 2 : fromNF <= 6 ? 1 : 0;
      const sun = sunTimes(from + 12 * HOUR_MS, lat, lon);
      const sunEdges = [sun.sunrise, sun.sunset].filter(Boolean);
      const lined = periods.filter((p) => sunEdges.some((s) => s >= p.s - HOUR_MS && s <= p.e + HOUR_MS));
      if (lined.length) score += 1;
      const rating = Math.max(1, Math.min(4, score + (score === 0 ? 1 : 0)));
      const out = { from, to, periods, majors, minors, rise: rs.find((x) => x.rising)?.t ?? null, set: rs.find((x) => !x.rising)?.t ?? null, rating, ratingText: ['', 'Fair', 'Good', 'Very good', 'Best'][rating], lined };
      memo.set(key, out); if (memo.size > 400) memo.delete(memo.keys().next().value);
      return out;
    }
    // Which period (if any) a moment falls in; looks at the neighbouring days for periods that cross midnight.
    function at(ms, lat, lon) {
      const ds = [ms - dayMs, ms, ms + dayMs].map((x) => day(x, lat, lon));
      const ps = ds.flatMap((x) => x.periods).filter((p) => ms >= p.s && ms < p.e).sort((a, b) => (a.kind === 'major' ? -1 : 1) - (b.kind === 'major' ? -1 : 1));
      return ps[0] || null;
    }
    function next(ms, lat, lon) {
      return [ms, ms + dayMs].map((x) => day(x, lat, lon)).flatMap((x) => x.periods).filter((p) => p.s > ms).sort((a, b) => a.s - b.s)[0] || null;
    }
    return { day, at, next, moonState };
  })();


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
      coef: day ? day.coef : null, ev: ev.filter((e) => e.t >= lo && e.t <= hi), clam: minusLows(ev, t.lat, t.lon, dayStart(t.start), 14).slice(0, 10), fetchedAt: Date.now() };
  }
  const tripTideShown = (t) => t.tide && !t.tide.none && tideShown({ tide: t.tide, spotId: t.spotId }, ['crabbing', 'clamming', 'shrimping'].includes(t.type) && !(t.spotId && spotById(t.spotId) && spotById(t.spotId).water === 'fresh') ? 'salt' : undefined);

  // ----- turning the plan into catch-like hours, so the Stats conditions can score them
  function windowHours(t) {
    const out = []; const fc = t.forecast && t.forecast.hours && t.forecast.hours.length ? t.forecast.hours : null;
    if (fc) return fc;
    for (let ms = Math.floor(t.start / HOUR_MS) * HOUR_MS; ms < t.end; ms += HOUR_MS) out.push({ t: ms, noWx: true });
    return out;
  }
  function hourAsCatch(t, hr) {
    const pc = { caughtAt: hr.t, weather: hr.noWx ? null : hr, spotId: t.spotId, location: { lat: t.lat, lon: t.lon } };
    if (tripTideShown(t)) { const cur = tideAt(t.tide.ev, hr.t); if (cur) pc.tide = { stage: tideStage(cur, hr.t), rising: cur.rising, coef: t.tide.coef, distM: t.tide.distM }; }
    return pc;
  }
  const bucketOf = (d, c) => (d.needsWx && !c.weather) ? null : d.of(c);

  // Past catches to learn from: this spot first, then nearby, then everything.
  // Shellfish trips learn from shellfish catches, fishing trips (and the Now screen) from fish.
  const TRIP_TYPES = { fishing: 'Fishing', crabbing: 'Crabbing', clamming: 'Clamming & oysters', shrimping: 'Shrimping' };
  const tripKind = (t) => (t.type && t.type !== 'fishing' ? 'shellfish' : 'fish');
  function tripHistory(t) {
    const TYPE_OF_TRIP = { crabbing: (ty) => ty === 'Crab', clamming: (ty) => BIVALVE_TYPES.has(ty), shrimping: (ty) => ty === 'Shrimp & prawns' };
    const want = TYPE_OF_TRIP[t.type];
    const pool = catches.filter((c) => kindOf(c) === tripKind(t) && (!want || want(typeOf(c.species))));
    const at = tripPoint(t);
    const here = t.spotId ? pool.filter((c) => c.spotId === t.spotId) : pool.filter((c) => c.location && distM(c.location, at) <= 1000);
    if (here.length >= 5) return { list: here, label: t.spotId ? 'at this spot' : 'here' };
    const near = pool.filter((c) => c.location && distM(c.location, at) <= 25000);
    if (near.length >= 5) return { list: near, label: `within ${fmtDist(25000)}` };
    return { list: pool, label: 'everywhere you fish' };
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
    const phrase = { sky: (b) => ({ Clear: 'Clear sky', 'Partly cloudy': 'Partly cloudy', Overcast: 'Overcast' }[b] || b), pressure: (b) => `${b} pressure`, temp: (b) => `${b} air`, wind: (b) => `${bare(b)} wind`, time: (b) => bare(b), tide: (b) => `${b} tide`, coef: (b) => `${bare(b)} tides`, moon: (b) => b, solunar: (b) => (b === 'Outside periods' ? 'Outside solunar periods' : `Solunar ${b.toLowerCase()}`) };
    Object.entries(DIMENSIONS).forEach(([dk, d]) => {
      const bs = pcs.map((pc) => bucketOf(d, pc)).filter(Boolean); if (!bs.length) return;
      const b = ranked(countBy(bs, (x) => x))[0][0]; const p0 = (phrase[dk] || ((x) => x))(b); const key = p0.charAt(0).toUpperCase() + p0.slice(1).replace(/ (Sky|Pressure|Wind|Tide|Air)$/, (m) => m.toLowerCase());
      pool.forEach((c) => { if (bucketOf(d, c) !== b) return; score.set(c.bait, (score.get(c.bait) || 0) + nFish(c)); const w = why.get(c.bait) || new Map(); w.set(key, (w.get(key) || 0) + nFish(c)); why.set(c.bait, w); });
    });
    return { forSpecies: pool !== hist, recs: ranked(score).slice(0, 3).map(([lure]) => ({ lure, total: fishIn(pool.filter((c) => c.bait === lure)), reasons: ranked(why.get(lure)).slice(0, 3).map(([k, n]) => `${k} (${tripKind(t) === 'shellfish' ? n : plural(n, 'fish')})`) })) };
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
        <span style="min-width:0"><h3>${esc(t.name)}</h3><div class="meta">${t.type && t.type !== 'fishing' && !t.name.startsWith(TRIP_TYPES[t.type]) ? esc(TRIP_TYPES[t.type]) + ' · ' : ''}${esc(new Date(t.start).toLocaleDateString(undefined, { weekday: 'short' }))} · ${fmtRange(t.start, t.end)}${isPast ? '' : ' · ' + relDay(t.start)}</div><div class="meta">${esc(line2)}</div></span>
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
        <table class="tide-table" style="margin-top:8px"><tbody>${turns.map((e) => `<tr><td>${e.type === 'H' ? 'High' : 'Low'}</td><td>${fmtTime(e.t)}</td><td>${tideH(e.h)}</td></tr>`).join('')}</tbody></table>
        ${t.type === 'clamming' ? (() => { const lows = turns.filter((e) => e.type === 'L'); const minus = lows.filter((e) => e.h < 0);
          return `<div class="clam-box"><h4>Clam tides</h4><p class="help small" style="margin:0 0 6px">${minus.length ? `This day has a minus tide: ${minus.map((e) => `${fmtTime(e.t)} (${tideH(e.h)})`).join(', ')}. Dig in the 1–2 hours either side.` : `No minus tide this day${lows.length ? ` – the lowest is ${tideH(Math.min(...lows.map((e) => e.h)))}` : ''}. Clamming is best on tides below 0 ft.`}</p>
            ${t.tide.clam ? `<p class="help small" style="margin:6px 0 2px">Daylight minus tides from this date, next two weeks:</p>${clamTideList(t.tide.clam)}` : ''}</div>`; })() : ''}</div>`;
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
      <ul class="gear">${gear.map((g, i) => `<li class="${g.done ? 'done' : ''}"><label class="gear-row"><input type="checkbox" data-gear="${i}" ${g.done ? 'checked' : ''}><span>${esc(g.text)}</span></label><button type="button" class="x" data-gear-del="${i}" aria-label="Remove ${esc(g.text)}">×</button></li>`).join('')}</ul>
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
      <div class="card" style="margin-bottom:12px"><h3>Sun, moon and bite times</h3>
        <div class="sun-grid">
          <div class="cond-cell"><span>First light</span><b>${sun.dawn ? fmtTime(sun.dawn) : '–'}</b></div>
          <div class="cond-cell"><span>Sunrise</span><b>${sun.sunrise ? fmtTime(sun.sunrise) : '–'}</b></div>
          <div class="cond-cell"><span>Sunset</span><b>${sun.sunset ? fmtTime(sun.sunset) : '–'}</b></div>
          <div class="cond-cell"><span>Last light</span><b>${sun.dusk ? fmtTime(sun.dusk) : '–'}</b></div>
        </div>
        <p style="margin:10px 0 0">${moon.icon} ${esc(moon.name)}, ${moon.illum}% lit</p>
        ${(() => { const sd = SOL.day(t.start, t.lat, t.lon); const during = [t.start - 86400000, t.start, t.start + 86400000].flatMap((x) => SOL.day(x, t.lat, t.lon).periods).filter((p) => p.e > t.start && p.s < t.end);
          return `<p class="sol-trip">Solunar rating <b>${sd.ratingText}</b> <span class="sol-dots">${'●'.repeat(sd.rating)}${'○'.repeat(4 - sd.rating)}</span></p>
            ${during.length ? `<p class="sol-trip-h">During your trip:</p><ul class="sol-list">${during.map((p) => periodRow(p, 0)).join('')}</ul>` : `<p class="help small" style="margin:6px 0 0">No solunar period falls inside the trip. ${(() => { const n = sd.periods.filter((p) => p.kind === 'major').map((p) => fmtRange(p.s, p.e)); return n.length ? `Major periods that day: ${n.join(' and ')}.` : ''; })()}</p>`}`; })()}</div>
      ${tideCard}
      <div class="card" style="margin-bottom:12px"><h3>${tripKind(t) === 'shellfish' ? 'Gear that has worked' : 'Lures to bring'}</h3>
        <p class="sub">${hist.list.length ? `From your ${tripKind(t) === 'shellfish' ? 'shellfish' : 'catches'} ${hist.label}${forSpecies ? ' of your target species' : ''}, in conditions like this trip's.` : `Log some ${tripKind(t) === 'shellfish' ? 'shellfish' : 'catches'} and the app will suggest ${tripKind(t) === 'shellfish' ? 'gear' : 'lures'} from your own history.`}</p>
        ${recs.length ? recs.map((r) => `<div class="rec"><b>${esc(r.lure)}</b><small>${esc(r.reasons.join('; '))}</small></div>`).join('') : (hist.list.length ? '<p class="sub" style="margin:0">Not enough matching catches yet.</p>' : '')}</div>
      ${speciesCard}
      ${gearCard}
      ${inWA(t.lat, t.lon) ? '<div id="trip-wa"></div>' : ''}
      <div class="card" style="margin-bottom:12px"><h3>Regulations</h3>
        <p style="margin:0 0 8px">${t.type === 'crabbing' ? 'Carry your license with its crab endorsement and, in Puget Sound, your catch record card. Check seasons and open days – they change every year and some areas are closed.'
          : t.type === 'clamming' ? 'Carry your shellfish license, check the beach is open for the species you want, and check for biotoxin closures on the day – they can start without warning.'
            : `Carry your fishing license, and check size limits, bag limits, seasons and closures${species.length ? ` for ${esc(species.join(', '))}` : ''} before you go. Rules change during the year.`}</p>
        <div class="stack">
          ${state === 'CA' ? '<a class="btn" href="https://wildlife.ca.gov/regulations" target="_blank" rel="noopener">California regulations (CDFW)</a>' : ''}
          ${inWA(t.lat, t.lon) ? (t.type === 'crabbing' ? '<a class="btn" href="https://wdfw.wa.gov/fishing/shellfishing-regulations/crab" target="_blank" rel="noopener">Washington crab seasons and rules (WDFW)</a>'
            : t.type === 'clamming' || t.type === 'shrimping' ? '<a class="btn" href="https://wdfw.wa.gov/fishing/shellfishing-regulations" target="_blank" rel="noopener">Washington shellfish seasons and rules (WDFW)</a>'
              : '<a class="btn" href="https://wdfw.wa.gov/fishing/regulations" target="_blank" rel="noopener">Washington fishing rules (WDFW)</a>') : ''}
          ${inWA(t.lat, t.lon) && (t.type === 'clamming' || t.type === 'shrimping') ? '<a class="btn" href="https://fortress.wa.gov/doh/biotoxin/biotoxin.html" target="_blank" rel="noopener">Shellfish Safety Map (biotoxin closures)</a>' : ''}
          <a class="btn" href="https://www.takemefishing.org/select-a-state/" target="_blank" rel="noopener">Licenses and regulations by state</a>
        </div></div>
      ${t.notes ? `<div class="card notes-card" style="margin-bottom:12px"><h3 style="margin-bottom:6px">Notes</h3><p>${esc(t.notes)}</p></div>` : ''}
      <p class="help small">${t.forecast && t.forecast.fetchedAt ? `Forecast updated ${fmtDate(t.forecast.fetchedAt)}, ${fmtTime(t.forecast.fetchedAt)}.` : ''}${showTide ? ' Tide predictions from NOAA.' : ''}</p>`;
    if (showTide) bindChart(t.tide.ev, dayStart(t.start), 'trip-tide');
    if ($('#trip-wa')) {
      const sp = t.spotId ? spotById(t.spotId) : null; const shellTrip = ['crabbing', 'clamming', 'shrimping'].includes(t.type);
      fillShellSafety($('#trip-wa'), { lat: t.lat, lon: t.lon, salt: shellTrip || (sp ? sp.water === 'salt' : showTide) }, { title: 'Shellfish safety' }).catch(() => {});
    }
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
      else { const near = opts.filter((o) => o.d != null).sort((a, b) => a.d - b.d)[0]; $('#tr-where').value = near ? near.sp.id : opts.length ? opts[0].sp.id : GPS; }
      const start = t ? new Date(t.start) : (() => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(6, 0, 0, 0); return d; })();
      const end = t ? new Date(t.end) : new Date(start.getTime() + 5 * HOUR_MS);
      $('#tr-date').value = toLocalInput(start).slice(0, 10); $('#tr-start').value = toLocalInput(start).slice(11); $('#tr-end').value = toLocalInput(end).slice(11);
      $('#tr-notes').value = t ? t.notes || '' : '';
      $('#tr-type').value = t ? t.type || 'fishing' : (pre && pre.type) || 'fishing';
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
      const type = $('#tr-type').value || 'fishing';
      const base = editing || { id: uid(), createdAt: now, gear: (TYPE_GEAR[type] || BASE_GEAR).map((text) => ({ text, done: false })) };
      if (name === 'Fishing trip') name = `${TRIP_TYPES[type]} trip`;
      const moved = !editing || editing.lat !== lat || editing.lon !== lon || editing.start !== start || editing.end !== end;
      const t = { ...base, type, name, spotId, lat, lon, start, end, species: [...picked], notes: $('#tr-notes').value.trim(), ...(moved ? { forecast: null, tide: null, actual: null } : {}) };
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
    setTimeout(() => autoBackup().catch(() => {}), 7000);
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
  // ---------------------------------------------------------------- river flows (USGS Water Data API)
  // Nearest stream gauge with discharge (parameter 00060, cubic feet per second) within about 10 km.
  // Uses api.waterdata.usgs.gov (the old waterservices.usgs.gov shuts down in February 2027). 50 requests an hour without a key, so results are cached.
  const USGS = 'https://api.waterdata.usgs.gov/ogcapi/v1/collections';
  const FLOW_MAX = 10000;
  const flowCache = new Map();
  const ftNum = (v) => { const n = Number(v); return Number.isFinite(n) && n > -999999 ? n : null; };
  function flowTrend(vals) { // vals: [{t, v}] oldest first
    if (vals.length < 2) return null; const last = vals[vals.length - 1]; const ref = vals.find((x) => x.t >= last.t - 3 * HOUR_MS) || vals[0];
    if (!ref || ref === last || !ref.v) return 'Steady'; const ch = (last.v - ref.v) / ref.v;
    return ch > 0.05 ? 'Rising' : ch < -0.05 ? 'Falling' : 'Steady';
  }
  // "NISQUALLY RIVER AT MCKENNA, WA" -> "Nisqually River at McKenna, WA"
  function gaugeName(n) {
    const small = new Set(['at', 'near', 'nr', 'of', 'the', 'and', 'below', 'above', 'blw', 'abv', 'in', 'on']);
    return String(n).toLowerCase().replace(/\b(nr)\b/g, 'near').replace(/\b(blw)\b/g, 'below').replace(/\b(abv)\b/g, 'above').replace(/\b(r)\b/g, 'river').replace(/\b(cr)\b/g, 'creek')
      .split(' ').map((w, i) => (/^[a-z]{2}$/.test(w) && i > 0 && /,$/.test(String(n).split(' ')[i - 1] || '') ? w.toUpperCase() : small.has(w) && i ? w : w.replace(/^(mc)?([a-z])/, (m, mc, ch) => (mc ? 'Mc' : '') + ch.toUpperCase()))).join(' ');
  }
  async function usgsJSON(url) { const r = await fetch(url, { headers: { Accept: 'application/geo+json, application/json' } }); if (!r.ok) throw new Error('USGS ' + r.status); return r.json(); }
  async function nearestGauges(loc) {
    const key = `${loc.lat.toFixed(2)},${loc.lon.toFixed(2)}`; const memo = (() => { try { return JSON.parse(store('tl.gauges') || '{}'); } catch { return {}; } })();
    if (memo[key] && Date.now() - memo[key].at < 30 * 86400000) return memo[key].list;
    const dLat = 0.1; const dLon = 0.14;
    const j = await usgsJSON(`${USGS}/monitoring-locations/items?f=json&bbox=${(loc.lon - dLon).toFixed(4)},${(loc.lat - dLat).toFixed(4)},${(loc.lon + dLon).toFixed(4)},${(loc.lat + dLat).toFixed(4)}&site_type_code=ST&limit=100`);
    const list = (j.features || []).map((f) => { const c = f.geometry && f.geometry.coordinates; const p = f.properties || {};
      return c ? { id: String(f.id || p.id || p.monitoring_location_id), name: gaugeName(p.monitoring_location_name || p.name || ''), lat: c[1], lon: c[0], d: distM(loc, { lat: c[1], lon: c[0] }) } : null; })
      .filter((x) => x && x.d <= FLOW_MAX).sort((a, b) => a.d - b.d).slice(0, 6);
    memo[key] = { at: Date.now(), list }; const keys = Object.keys(memo); if (keys.length > 40) delete memo[keys[0]]; store('tl.gauges', JSON.stringify(memo));
    return list;
  }
  // Discharge at a gauge around a time (default now): value, trend over the past 3 hours.
  async function gaugeFlow(g, atMs) {
    const at = atMs || Date.now(); const ck = g.id + ':' + Math.floor(at / (30 * 60000)); if (flowCache.has(ck)) return flowCache.get(ck);
    const from = new Date(at - 4 * HOUR_MS).toISOString(); const to = new Date(at + 30 * 60000).toISOString();
    const j = await usgsJSON(`${USGS}/continuous/items?f=json&monitoring_location_id=${encodeURIComponent(g.id)}&parameter_code=00060&time=${from}/${to}&limit=200`);
    const vals = (j.features || []).map((f) => { const p = f.properties || {}; return { t: Date.parse(p.time || p.datetime || p.phenomenon_time), v: ftNum(p.value ?? p.result) }; })
      .filter((x) => Number.isFinite(x.t) && x.v != null && x.t <= at + 30 * 60000).sort((a, b) => a.t - b.t);
    const out = vals.length ? { site: g.id, name: g.name, distM: Math.round(g.d), cfs: vals[vals.length - 1].v, time: vals[vals.length - 1].t, trend: flowTrend(vals) } : null;
    flowCache.set(ck, out); return out;
  }
  async function flowNear(loc, atMs) {
    const gs = await nearestGauges(loc);
    for (const g of gs.slice(0, 3)) { try { const f = await gaugeFlow(g, atMs); if (f) return f; } catch (e) { if (/USGS 429/.test(e.message)) throw e; } }
    return null;
  }
  const gaugeUrl = (site) => `https://waterdata.usgs.gov/monitoring-location/${encodeURIComponent(String(site).replace(/^USGS-/, ''))}/`;
  const cfsText = (v) => (imp() ? `${Math.round(v).toLocaleString()} cfs` : `${round(v * 0.0283168, v * 0.0283168 < 10 ? 1 : 0).toLocaleString()} m³/s`);
  const trendSym = (t) => (t === 'Rising' ? '↑' : t === 'Falling' ? '↓' : '→');
  function flowCell(f, cls = 'now-cell wide') {
    if (!f) return '';
    return `<div class="${cls}"><span>River flow</span><b>${trendSym(f.trend)} ${esc(cfsText(f.cfs))}</b><small>${f.trend ? esc(f.trend) + ' · ' : ''}<a href="${gaugeUrl(f.site)}" target="_blank" rel="noopener">${esc(f.name || 'USGS gauge')}</a> · ${esc(fmtDist(f.distM))}</small></div>`;
  }
  // Add the river flow to recent freshwater catches near a gauge (within a day of the catch).
  async function backfillFlow() {
    if (!navigator.onLine) return;
    const todo = catches.filter((c) => c.location && c.flow === undefined && (c.flowTries || 0) < 2 && Date.now() - c.caughtAt < 86400000 && kindOf(c) === 'fish' && !(c.tide && tideShown(c))).slice(0, 3);
    for (const c of todo) {
      let f = null; try { f = await flowNear(c.location, c.caughtAt); } catch { c.flowTries = (c.flowTries || 0) + 1; await DB.put(c); continue; }
      c.flow = f || null; await DB.put(c);
    }
  }

  // ---------------------------------------------------------------- shellfish safety (Washington Department of Health)
  // Public shellfish beach status near saltwater places, straight from the Department of Health's Shellfish Safety Map layer (updated hourly).
  // (WDFW emergency rules and trout stocking are planned for later; see the to-do list.)
  // Department of Health shellfish beaches near a point (status: Open, Closed, Conditionally Open, Unclassified).
  const beachMemo = new Map();
  async function beachesNear(loc, radiusM = 800) {
    const key = `${loc.lat.toFixed(3)},${loc.lon.toFixed(3)},${radiusM}`; const hit = beachMemo.get(key); if (hit && Date.now() - hit.at < 30 * 60000) return hit.list;
    const f = 'BEACHNAME,FINALSTATUS,DOHDFWStatus,PopupStatus,PopupClosedFor,PopupEmergency,PopupMessage,Vibrio,ALLSPECIEDESCRIPTIONS,COUNTYNAME,Cseason,Oseason,BIDN,UPDATED,Midx,Midy';
    const url = `https://services8.arcgis.com/rGGrs6HCnw87OFOT/ArcGIS/rest/services/Recreational_Shellfish_Beaches/FeatureServer/0/query?where=1%3D1&geometry=${loc.lon},${loc.lat}&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&distance=${radiusM}&units=esriSRUnit_Meter&outFields=${f}&returnGeometry=false&f=json`;
    const r = await fetch(url); if (!r.ok) throw new Error('DOH map ' + r.status); const j = await r.json(); if (j.error) throw new Error('DOH map error');
    const list = (j.features || []).map((x) => x.attributes || {}).map((a) => ({ name: a.BEACHNAME || 'Beach', status: a.FINALSTATUS || a.DOHDFWStatus || a.PopupStatus || 'Unknown', closedFor: a.PopupClosedFor || a.ALLSPECIEDESCRIPTIONS || '', emergency: a.PopupEmergency || '',
      message: a.PopupMessage || '', vibrio: /^y/i.test(a.Vibrio || ''), clams: a.Cseason || '', oysters: a.Oseason || '', id: a.BIDN || null, updated: a.UPDATED || null, d: Number.isFinite(a.Midy) && Number.isFinite(a.Midx) ? distM(loc, { lat: a.Midy, lon: a.Midx }) : null }))
      .sort((a, b) => (a.d ?? 1e9) - (b.d ?? 1e9));
    beachMemo.set(key, { at: Date.now(), list }); store('tl.beach.' + key, JSON.stringify({ at: Date.now(), list })); return list;
  }
  const lastBeaches = (loc, radiusM = 800) => { try { return JSON.parse(store(`tl.beach.${loc.lat.toFixed(3)},${loc.lon.toFixed(3)},${radiusM}`) || 'null'); } catch { return null; } };
  const beachClass = (st) => (/^open/i.test(st) ? 'ok' : /closed/i.test(st) ? 'bad' : 'warn');
  function beachHtml(list, opts = {}) {
    if (!list || !list.length) return opts.none ? `<p class="help small" style="margin:0">${opts.none}</p>` : '';
    return `<ul class="wa-list">${list.slice(0, opts.max || 3).map((b) => `<li><span class="wa-chip ${beachClass(b.status)}">${esc(b.status)}</span><span><b>${esc(b.name)}</b>${b.d != null ? ` <small>${esc(fmtDist(b.d))}</small>` : ''}
      ${b.closedFor ? `<small class="wa-why">${esc(b.closedFor)}</small>` : ''}${b.emergency ? `<small class="wa-why">${esc(b.emergency)}</small>` : ''}${b.vibrio ? '<small class="wa-why">Vibrio advisory: cook shellfish thoroughly.</small>' : ''}</span></li>`).join('')}</ul>`;
  }
  // Fills a box with the shellfish safety card for a saltwater place in Washington. place: { lat, lon, salt }
  async function fillShellSafety(box, place, opts = {}) {
    if (!box || !place || !place.salt || !inWA(place.lat, place.lon)) { if (box) box.innerHTML = ''; return; }
    const draw = (beaches) => { if (!box.isConnected) return;
      box.innerHTML = `<div class="card wa-card" style="margin-bottom:12px"><h3>${esc(opts.title || 'Shellfish safety')}</h3>
        ${beaches == null ? '<p class="help small" style="margin:0">Couldn’t reach the Department of Health map. <a href="https://fortress.wa.gov/doh/biotoxin/biotoxin.html" target="_blank" rel="noopener">Check the Shellfish Safety Map</a> before you harvest.</p>'
          : beachHtml(beaches, { none: 'No public shellfish beach mapped here. <a href="https://fortress.wa.gov/doh/biotoxin/biotoxin.html" target="_blank" rel="noopener">Shellfish Safety Map</a>' })}
        ${beaches && beaches.length ? '<p class="wa-fresh">Department of Health, updated hourly · <a href="https://fortress.wa.gov/doh/biotoxin/biotoxin.html" target="_blank" rel="noopener">Shellfish Safety Map</a> · hotline 1-800-562-5632</p>' : ''}</div>`; };
    const lb = lastBeaches(place); if (lb) draw(lb.list);
    try { draw(await beachesNear(place, 800)); } catch { if (!lb) draw(null); }
  }

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
      const rel = combo.released !== undefined ? combo.released : ({ released: true, kept: false }[store('tl.lastReleased')] ?? null);
      const n = Math.max(1, Math.min(999, Math.round(combo.count || 1)));
      if (rel === false && !(await overLimitOk(combo.species, n))) { toast('Not saved'); return; }
      const rec = { id: uid(), createdAt: now, updatedAt: now, caughtAt: now, species: combo.species, bait: combo.bait, lureColor: combo.lureColor || '', lureSize: combo.lureSize || '',
        lengthCm: null, weightKg: null, released: rel, notes: '', photo: null, thumb: null, extraPhotos: [], count: 1,
        location: loc, weather, weatherTries: 0, tide: undefined, marine: undefined, tideTries: 0,
        spotId: m ? m.spot.id : (ses && ses.spotId) || null, quick: true, kind: (SPECIES_INFO.get(combo.species) || {}).kind || 'fish' };
      rec.count = n; if (combo.shellBait) rec.shellBait = combo.shellBait; if (combo.via) rec.via = combo.via;
      if (ses) rec.sessionId = ses.id;
      await DB.put(rec);
      if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
      await reload(); if (ses) await sessionCaught(ses, rec);
      const said = `${n > 1 ? n + ' × ' : ''}${combo.species}${combo.via ? ` · ${combo.bait}${rel === false ? ' · kept' : rel === true ? ' · released' : ''}` : ''} logged 🎣${loc ? '' : ' (no location)'}${needsCrc(rec) ? ' · record it on your catch record card' : ''}`;
      if (combo.via) toast(said, { label: 'Undo', fn: async () => { await DB.del(rec.id); await reload(); toast('Removed'); } });
      else toast(said, { label: 'Add details', fn: () => { const c = catches.find((x) => x.id === rec.id); if (c) form.open(c); } });
      backfillWeather().then(backfillTides).then(backfillMarine).then(backfillFlow).catch(() => {});
    } catch (err) { toast('Could not save: ' + ((err && err.message) || 'storage error')); }
    finally { quickBusy = false; }
  }

  // ---------------------------------------------------------------- hands-free logging
  // Spoken catches ("two Dungeness, kept, crab pot") and quick-log links (?log=Dungeness%20Crab&gear=Crab%20pot&n=2&kept=1).
  const NUMWORDS = { a: 1, an: 1, one: 1, two: 2, to: 2, too: 2, three: 3, four: 4, for: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, couple: 2, pair: 2, dozen: 12 };
  const sing = (w) => (w.length > 3 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w);
  const norm = (t) => ' ' + String(t).toLowerCase().replace(/[()]/g, ' ').replace(/[^a-z0-9'’ -]/g, ' ').replace(/-/g, ' ').split(/\s+/).filter(Boolean).map(sing).join(' ') + ' ';
  const GENERIC = new Set(['bass', 'trout', 'salmon', 'crab', 'clam', 'oyster', 'shrimp', 'perch', 'catfish', 'sunfish', 'rockfish', 'flounder', 'sole', 'common', 'pacific', 'atlantic', 'eastern', 'western', 'northern', 'southern', 'lake', 'river', 'sea', 'bay', 'native', 'american']);
  function speechPhrases(name) {
    const out = new Set([norm(name).trim(), norm(name.replace(/\(.*?\)/g, '')).trim()]);
    const par = (name.match(/\(([^)]+)\)/) || [])[1]; const words = name.replace(/\(.*?\)/g, '').trim().split(/\s+/);
    if (par) { out.add(norm(par + ' ' + words[words.length - 1]).trim()); out.add(norm(par).trim()); }
    if (words.length > 1 && !GENERIC.has(words[0].toLowerCase())) out.add(norm(words[0]).trim());
    return [...out].filter((x) => x.length > 2);
  }
  let speechIndex = null;
  function bestMatch(text, names) {
    const t = norm(text); let best = null;
    for (const n of names) for (const ph of speechPhrases(n)) { if (t.includes(' ' + ph + ' ') && (!best || ph.length > best.len)) best = { name: n, len: ph.length }; }
    return best ? best.name : null;
  }
  function parseSpoken(text) {
    if (!speechIndex || speechIndex.n !== catches.length) speechIndex = { n: catches.length, sp: [...new Set([...catches.map((c) => c.species), ...KNOWN_SPECIES])], bait: [...new Set([...catches.map((c) => c.bait), ...KNOWN_GEAR, ...KNOWN_LURES])] };
    const t = norm(text);
    const species = bestMatch(text, speechIndex.sp);
    let bait = bestMatch(text, speechIndex.bait); if (bait && species && norm(bait).trim() === norm(species).trim()) bait = null;
    let count = 1; const num = t.match(/ (\d{1,3}) /); if (num) count = Number(num[1]); else for (const w of t.trim().split(' ')) if (NUMWORDS[w] && w !== 'a' && w !== 'an' && w !== 'to' && w !== 'too' && w !== 'for') { count = NUMWORDS[w]; break; }
    const released = / (kept|keep|keeper|keeping) /.test(t) ? false : / (released|release|releasing|let (it|them) go|threw (it|them) back|throw back|let go) /.test(t) ? true : undefined;
    return { species, bait, count, released };
  }
  function listen() {
    return new Promise((resolve, reject) => {
      if (!SR) { reject(new Error('Speech isn’t available in this browser')); return; }
      const r = new SR(); r.lang = navigator.language || 'en-US'; r.interimResults = false; r.maxAlternatives = 4;
      let done = false;
      r.onresult = (e) => { done = true; resolve([...e.results[0]].map((a) => a.transcript)); };
      r.onerror = (e) => { if (!done) { done = true; reject(new Error(e.error === 'not-allowed' ? 'Microphone access is off for this app' : e.error === 'no-speech' ? 'Didn’t hear anything' : 'Couldn’t listen: ' + e.error)); } };
      r.onend = () => { if (!done) { done = true; reject(new Error('Didn’t hear anything')); } };
      try { r.start(); } catch (err) { reject(err); }
    });
  }
  // Pick the alternative that names a fish; fill the gaps from your history.
  function bestSpoken(alts) {
    const parsed = alts.map((a) => ({ text: a, ...parseSpoken(a) }));
    return parsed.find((p) => p.species && p.bait) || parsed.find((p) => p.species) || parsed[0];
  }
  const lastBaitFor = (sp) => (catches.find((c) => c.species === sp) || {}).bait || null;
  async function sayCatch() {
    toast('Listening… say what you caught, e.g. “two Dungeness, kept, crab pot”');
    let alts; try { alts = await listen(); } catch (e) { toast(e.message); return; }
    const p = bestSpoken(alts);
    if (!p.species) { toast(`Heard “${alts[0]}” – no fish in that. Try again, or tap +.`); return; }
    const bait = p.bait || lastBaitFor(p.species);
    if (!bait) { form.open(null, { species: p.species }); toast(`Heard “${p.text}” – add the ${(SPECIES_INFO.get(p.species) || {}).kind === 'shellfish' ? 'gear' : 'lure'} to save.`); return; }
    await quickSave({ species: p.species, bait, count: p.count, released: p.released, via: 'voice' });
  }
  function quickLink(c) {
    const u = new URL(location.href.split('?')[0].split('#')[0]);
    u.searchParams.set('log', c.species); u.searchParams.set('gear', c.bait); if (c.count > 1) u.searchParams.set('n', c.count); if (c.released === false) u.searchParams.set('kept', '1'); if (c.released === true) u.searchParams.set('kept', '0');
    return u.toString();
  }
  // Links and home-screen shortcuts: ?new=1, ?start=1, ?voice=1, ?log=…
  async function runLinkAction() {
    const q = new URLSearchParams(location.search); if (![...q.keys()].length) return;
    try { history.replaceState(null, '', location.pathname); } catch { /* ignore */ }
    if (q.get('log')) {
      const species = q.get('log').trim().slice(0, 80); const bait = (q.get('gear') || q.get('bait') || lastBaitFor(species) || '').trim().slice(0, 80);
      if (!species) return; if (!bait) { form.open(null, { species }); return; }
      const k = q.get('kept'); await quickSave({ species, bait, count: Number(q.get('n')) || 1, released: k === '1' ? false : k === '0' ? true : undefined, via: 'link' });
    } else if (q.get('new')) form.open();
    else if (q.get('start')) startSession();
    else if (q.get('voice')) sayCatch();
    else if (q.get('import')) importFromLink(q.get('import'));
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
      if (!(st.tide && tideShown({ tide: st.tide, spotId: m ? m.spot.id : null }))) { try { st.flow = await withTimeout(flowNear(loc), 8000); } catch { st.flow = null; } }
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
    const say = SR ? '<button type="button" class="btn sm say-btn" id="now-say" aria-label="Say a catch out loud"><span aria-hidden="true">🎤</span> Say it</button>' : '';
    const quick = combos.length ? `<div class="quick"><h4>Quick catch <small>– one tap saves it, add details later</small>${say}</h4><div class="quick-grid">${combos.map((c, i) =>
      `<button type="button" class="quick-btn" data-quick="${i}"><span class="plus" aria-hidden="true">+</span><span><b>${esc(c.species)}</b><small>${esc(c.bait)}${c.lureColor || c.lureSize ? ' · ' + esc([c.lureColor, c.lureSize].filter(Boolean).join(', ')) : ''}</small></span></button>`).join('')}</div></div>` : (say ? `<div class="quick"><h4>Log by voice <small>– tap and say what you caught</small>${say}</h4></div>` : '');
    if (!s) {
      const last = sessions.find((x) => x.end);
      $('#now-session').innerHTML = `<div class="card session-card">
        <button type="button" class="btn go big block" id="ses-start">Start fishing</button>
        <p class="sub" style="margin-bottom:0">Tap when your line goes in. Fishamongus! times the session and tracks your lure, so Stats can show fish per hour.</p>
        ${keptLine()}${today.length ? `<p class="today-line">Today so far: <b>${plural(fishIn(today), 'fish')}</b></p>` : last ? `<p class="today-line">Last session: ${esc(relDay(last.start))}, ${durText(last.end - last.start)}, ${plural(fishIn(sessionCatches(last)), 'fish')}</p>` : ''}
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
      ${keptLine()}
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
    if (!tidal && st.flow) cells.push(flowCell(st.flow));
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
  // Solunar periods for today where you are, on a 24-hour strip.
  function solunarStrip(d, sun, now) {
    const pos = (t) => Math.max(0, Math.min(100, ((t - d.from) / (d.to - d.from)) * 100));
    const blocks = d.periods.map((p) => `<span class="sol-blk ${p.kind}" style="left:${pos(p.s)}%;width:${pos(p.e) - pos(p.s)}%"></span>`).join('');
    const night = [sun.sunrise ? `<span class="sol-night" style="left:0;width:${pos(sun.sunrise)}%"></span>` : '', sun.sunset ? `<span class="sol-night" style="left:${pos(sun.sunset)}%;width:${100 - pos(sun.sunset)}%"></span>` : ''].join('');
    const nowM = now >= d.from && now < d.to ? `<span class="sol-now-mark" style="left:${pos(now)}%"></span>` : '';
    return `<div class="sol-strip" aria-hidden="true">${night}${blocks}${nowM}</div><div class="sol-ticks" aria-hidden="true"><span>12a</span><span>6a</span><span>12p</span><span>6p</span><span>12a</span></div>`;
  }
  function periodRow(p, now) {
    const past = p.e <= now; const on = p.s <= now && now < p.e;
    return `<li class="${past ? 'past' : ''}${on ? ' on' : ''}"><span class="sol-k ${p.kind}">${p.kind === 'major' ? 'Major' : 'Minor'}</span><b>${fmtRange(p.s, p.e)}</b><small>${esc(p.what)}</small></li>`;
  }
  function renderNowSolunar() {
    const box = $('#now-sol'); const L = (nowState && nowState.loc) || lastLoc; if (!L) { box.innerHTML = ''; return; }
    const now = Date.now(); const d = SOL.day(now, L.lat, L.lon); const sun = sunTimes(now, L.lat, L.lon);
    const cur = SOL.at(now, L.lat, L.lon); const nx = SOL.next(now, L.lat, L.lon);
    const status = cur ? `<p class="sol-status on"><b>${cur.kind === 'major' ? 'Major' : 'Minor'} period now</b> – until ${fmtTime(cur.e)} (${esc(cur.what.toLowerCase())})</p>`
      : nx ? `<p class="sol-status">Next: <b>${nx.kind} period at ${fmtTime(nx.s)}</b> (${esc(nx.what.toLowerCase())}), in ${durText(nx.s - now)}</p>` : '';
    box.innerHTML = `<div class="card sol-card"><h3>Bite times today</h3>
      <p class="sub">Solunar periods from the moon's position. Today rates <b>${d.ratingText}</b> <span class="sol-dots" aria-label="${d.rating} of 4">${'●'.repeat(d.rating)}${'○'.repeat(4 - d.rating)}</span>${d.lined.length ? ' – a period lines up with sunrise or sunset' : ''}.</p>
      ${status}${solunarStrip(d, sun, now)}
      <ul class="sol-list">${d.periods.map((p) => periodRow(p, now)).join('')}</ul>
      <p class="note">Major periods: the 2 hours around the moon overhead and underfoot. Minor: the hour around moonrise and moonset. Stats shows whether they work for you.</p></div>`;
  }
  function renderNow() {
    if (!$('#view-now')) return;
    renderNowSession(); renderNowCrc(); renderNowCond(); renderNowWA(); renderNowSolunar(); renderNowRecs(); renderNowTrip();
  }
  $('#view-now').addEventListener('click', (e) => {
    if (e.target.closest('#ses-start')) return startSession();
    if (e.target.closest('#ses-end')) return endSession();
    if (e.target.closest('#ses-lure')) return lurePicker.open();
    if (e.target.closest('#now-refresh')) return refreshNow(true);
    const cd = e.target.closest('[data-crc-done]'); if (cd) { const d = (() => { try { return JSON.parse(store('tl.crcDone') || '{}'); } catch { return {}; } })(); d[cd.dataset.crcDone] = Date.now(); store('tl.crcDone', JSON.stringify(d)); renderNowCrc(); toast('Marked as reported'); return; }
    if (e.target.closest('#now-plan')) return tripForm.open();
    if (e.target.closest('#now-trips')) return showView('trips');
    if (e.target.closest('#now-say')) return sayCatch();
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

  // ---------------------------------------------------------------- personal bests
  // Compared with your earlier catches of the same fish: weight first (weighed, not estimated), then length.
  function personalBest(rec) {
    const prev = catches.filter((c) => c.species === rec.species && c.id !== rec.id);
    if (rec.weightKg != null && !rec.weightEst) {
      const ws = prev.filter((c) => c.weightKg != null && !c.weightEst).map((c) => c.weightKg);
      if (ws.length && rec.weightKg > Math.max(...ws) + 1e-6) return { what: U.wt(rec.weightKg), was: U.wt(Math.max(...ws)) };
    }
    if (rec.lengthCm != null) {
      const ls = prev.filter((c) => c.lengthCm != null).map((c) => c.lengthCm);
      if (ls.length && rec.lengthCm > Math.max(...ls) + 1e-6) return { what: U.len(rec.lengthCm), was: U.len(Math.max(...ls)) };
    }
    return null;
  }
  function celebrate(pb, rec, action) {
    toast(`🏆 New personal best! ${pb.what} ${rec.species} (was ${pb.was})`, action || { label: 'View', fn: () => showDetail(rec.id) }, 'pb');
    if (navigator.vibrate) try { navigator.vibrate([40, 60, 40]); } catch { /* ignore */ }
  }

  // ---------------------------------------------------------------- weight from length
  // Standard weight (Ws) equations, Anderson & Neumann (1996) and Henson (1991): log10(W g) = a + b·log10(total length mm).
  // They give the weight of a typical fish in good condition, so the app labels the result as an estimate.
  const WS = { 'Largemouth Bass': [-5.528, 3.273], 'Smallmouth Bass': [-5.329, 3.200], 'Spotted Bass': [-5.392, 3.215], 'Bluegill': [-5.374, 3.316],
    'Black Crappie': [-5.618, 3.345], 'White Crappie': [-5.642, 3.332], 'Walleye': [-5.453, 3.180], 'Yellow Perch': [-5.386, 3.230],
    'Channel Catfish': [-5.800, 3.294], 'Rainbow Trout': [-4.898, 2.990], 'Hybrid Striped Bass (Wiper)': [-5.201, 3.139], 'Common Carp': [-4.418, 2.859] };
  function typicalWeightKg(species, cm) {
    const k = WS[species]; if (!k || !cm || cm < 8 || cm > 200) return null;
    return Math.pow(10, k[0] + k[1] * Math.log10(cm * 10)) / 1000;
  }

  // ---------------------------------------------------------------- daily bag limits
  // A limit is a daily number, optionally with rules: { n: 5, males: true, hard: true, minCm: 15.9 }. Older saves are just numbers.
  const getLimits = () => { try { return JSON.parse(store('tl.limits') || '{}') || {}; } catch { return {}; } };
  function limitOf(sp) { const v = getLimits()[sp]; if (v == null) return null; const o = typeof v === 'number' ? { n: v } : v; return Number.isFinite(o.n) && o.n > 0 ? o : null; }
  const bagLimit = (sp) => { const o = limitOf(sp); return o ? o.n : null; };
  // Legal minimums keep their exact value (6.25 in, not 6.3).
  const minLen = (cm) => (imp() ? `${String(round(cm / 2.54, 2))} in` : `${round(cm, 1)} cm`);
  const SHARED_NAME = { clams: 'clams', oysters: 'oysters' };
  function ruleText(o) {
    return [o.shared === 'clams' ? `${o.n} clams of all kinds combined, up to 10 lb in the shell` : '', o.males ? 'males only' : '', o.hard ? 'hard shell' : '',
      o.minCm ? `at least ${minLen(o.minCm)} across` : '', o.firstDug ? `keep the first ${o.n === 1 ? 'one' : o.n} dug, any size or condition` : '', o.shuck ? 'shuck on the beach and leave the shells' : ''].filter(Boolean).join(', ');
  }
  // Species counted together under one limit (WDFW: 40 clams of all kinds combined).
  function limitMates(sp) { const o = limitOf(sp); if (!o || !o.shared) return [sp]; const lim = getLimits(); return Object.keys(lim).filter((k) => { const x = limitOf(k); return x && x.shared === o.shared; }); }
  const limitLabel = (sp) => { const o = limitOf(sp); return o && o.shared ? (SHARED_NAME[o.shared] || o.shared) : sp; };
  // Why a crab (or other catch) can't be kept under its rules.
  function keepProblems(c) {
    const o = limitOf(c.species); if (!o) return [];
    const out = [];
    if (o.males && c.crabSex === 'female') out.push('females must go back');
    if (o.hard && c.shellHard === false) out.push('soft-shell crab must go back');
    if (o.minCm && c.carapaceCm != null && c.carapaceCm < o.minCm - 0.05) out.push(`under the ${minLen(o.minCm)} minimum`);
    return out;
  }
  function keptToday(sp, exceptId) { const from = dayStart(Date.now()); const mates = limitMates(sp); return fishIn(catches.filter((c) => mates.includes(c.species) && c.released === false && c.caughtAt >= from && c.id !== exceptId)); }
  async function overLimitOk(sp, n, exceptId, fields) {
    const problems = keepProblems({ species: sp, ...(fields || {}) });
    if (problems.length && !(await askConfirm(`This ${sp} can't be kept under your limits: ${problems.join(', ')}. Save it as kept anyway?`, 'Save anyway'))) return false;
    const lim = bagLimit(sp); if (!lim) return true;
    const after = keptToday(sp, exceptId) + n; if (after <= lim) return true;
    return askConfirm(`That makes ${after} ${limitLabel(sp)} kept today. Your daily limit is ${lim}. Save it as kept anyway?`, 'Save anyway');
  }
  function keptLine() {
    const lim = getLimits(); const from = dayStart(Date.now());
    const seen = new Set();
    const parts = Object.keys(lim).filter((sp) => { const k = limitLabel(sp); if (seen.has(k)) return false; seen.add(k); return true; })
      .map((sp) => ({ sp: limitLabel(sp), n: keptToday(sp), lim: bagLimit(sp) })).filter((x) => x.n > 0 && x.lim);
    return parts.length ? `<p class="kept-line">Kept today: ${parts.map((x) => `<span class="${x.n > x.lim ? 'over' : x.n === x.lim ? 'full' : ''}">${esc(x.sp)} ${x.n} of ${x.lim}</span>`).join(' · ')}</p>` : '';
  }
  // WDFW Puget Sound sport crab limits (marine areas 4 east of Bonilla-Tatoosh through 13).
  const PUGET_SOUND_CRAB = { 'Dungeness Crab': { n: 5, males: true, hard: true, minCm: 6.25 * 2.54 }, 'Red Rock Crab': { n: 6, minCm: 5 * 2.54 } };
  // WDFW statewide clam and oyster limits (WAC 220-330-010 as amended March 31, 2026). Beaches have their own seasons.
  const WA_CLAMS = {
    'Manila Clam': { n: 40, shared: 'clams', minCm: 1.5 * 2.54 }, 'Native Littleneck Clam': { n: 40, shared: 'clams', minCm: 1.5 * 2.54 },
    'Butter Clam': { n: 40, shared: 'clams', minCm: 1.5 * 2.54 }, 'Cockle': { n: 40, shared: 'clams', minCm: 2.5 * 2.54 }, 'Softshell Clam': { n: 40, shared: 'clams' },
    'Horse Clam (Gaper)': { n: 7, firstDug: true }, 'Geoduck': { n: 1, firstDug: true }, 'Razor Clam': { n: 15 },
    'Pacific Oyster': { n: 18, shared: 'oysters', minCm: 2.5 * 2.54, shuck: true },
  };
  const limitsSheet = (() => {
    function paint() {
      const lim = getLimits(); const names = Object.keys(lim).filter((sp) => limitOf(sp)).sort((a, b) => a.localeCompare(b));
      $('#lim-list').innerHTML = names.length ? `<ul class="lim-list">${names.map((sp) => { const o = limitOf(sp); return `<li><span><b>${esc(sp)}</b><small>${o && ruleText(o) ? esc(ruleText(o)) + ' · ' : ''}Kept today: ${keptToday(sp)}</small></span><input inputmode="numeric" value="${o.n}" data-lim="${esc(sp)}" aria-label="Daily limit for ${esc(sp)}"><button type="button" class="icon-x" data-lim-rm="${esc(sp)}" aria-label="Remove limit for ${esc(sp)}">×</button></li>`; }).join('')}</ul>`
        : '<p class="help small">No limits yet.</p>';
      const used = [...new Set(catches.map((c) => c.species))].sort((a, b) => a.localeCompare(b));
      const opt = (v) => `<option value="${esc(v)}">${esc(v)}</option>`;
      $('#lim-species').innerHTML = '<option value="">Choose…</option>' + (used.length ? `<optgroup label="What you've caught">${used.map(opt).join('')}</optgroup>` : '') + SPECIES_GROUPS.map(([g, l]) => `<optgroup label="${esc(g)}">${l.map(opt).join('')}</optgroup>`).join('');
    }
    function save(lim) { store('tl.limits', JSON.stringify(lim)); renderNow(); }
    $('#lim-add').addEventListener('click', () => {
      const sp = $('#lim-species').value; const n = Math.round(num($('#lim-n').value) || 0);
      if (!sp || n < 1) { toast('Choose a fish and enter a limit of 1 or more'); return; }
      const lim = getLimits(); const o = limitOf(sp); lim[sp] = o ? { ...o, n } : n; save(lim); $('#lim-n').value = ''; paint();
    });
    $('#lim-wa-crab').addEventListener('click', () => {
      const lim = getLimits(); Object.assign(lim, JSON.parse(JSON.stringify(PUGET_SOUND_CRAB))); save(lim); paint();
      toast('Added: 5 male hard-shell Dungeness (6¼ in), 6 red rock crab (5 in)');
    });
    $('#lim-wa-clam').addEventListener('click', () => {
      const lim = getLimits(); Object.assign(lim, JSON.parse(JSON.stringify(WA_CLAMS))); save(lim); paint();
      toast('Added: 40 clams combined, 7 horse clams, 1 geoduck, 15 razor clams, 18 oysters');
    });
    $('#lim-list').addEventListener('change', (e) => { const i = e.target.closest('[data-lim]'); if (!i) return; const n = Math.round(num(i.value) || 0); const lim = getLimits(); const o = limitOf(i.dataset.lim);
      const keys = o && o.shared ? limitMates(i.dataset.lim) : [i.dataset.lim];
      keys.forEach((k) => { const x = limitOf(k); if (n > 0) lim[k] = x && Object.keys(x).length > 1 ? { ...x, n } : n; else delete lim[k]; }); save(lim); paint(); });
    $('#lim-list').addEventListener('click', (e) => { const b = e.target.closest('[data-lim-rm]'); if (!b) return; const lim = getLimits(); delete lim[b.dataset.limRm]; save(lim); paint(); });
    $('#btn-limits').addEventListener('click', () => { paint(); openSheet($('#sheet-limits')); });
    return { paint };
  })();

  // ---------------------------------------------------------------- tackle box
  const tackleUrls = new Map();
  function tackleThumb(t) {
    if (!t.thumb) return null; const k = t.id + ':' + (t.updatedAt || 0);
    if (!tackleUrls.has(k)) tackleUrls.set(k, URL.createObjectURL(t.thumb)); return tackleUrls.get(k);
  }
  const tackleCatches = (t) => catches.filter((c) => c.tackleId === t.id);
  const tackleBox = (() => {
    let editingT = null; let thumb = null;
    function list() {
      $('#tk-list').innerHTML = tackle.length ? `<ul class="tk-list">${tackle.map((t) => { const u = tackleThumb(t); const n = fishIn(tackleCatches(t));
        return `<li><button type="button" data-tk-edit="${t.id}">${u ? `<img src="${u}" alt="">` : '<span class="tk-ph" aria-hidden="true">🎣</span>'}<span><b>${esc(t.name || t.bait)}</b><small>${esc([t.name ? t.bait : '', t.color, t.size].filter(Boolean).join(' · '))}</small></span><em>${plural(n, 'fish')}</em></button></li>`; }).join('')}</ul>`
        : '<p class="help small">Your tackle box is empty. Tap <b>Add</b> to save your first lure.</p>';
    }
    function fillTypes(v) {
      const opt = (x) => `<option value="${esc(x)}">${esc(x)}</option>`;
      $('#tk-type').innerHTML = '<option value="">Choose a type…</option>' + LURE_GROUPS.map(([g, l]) => `<optgroup label="${esc(g)}">${l.map(opt).join('')}</optgroup>`).join('') + `<optgroup label="Not listed"><option value="${OTHER}">Other – type it in…</option></optgroup>`;
      const listed = v && KNOWN_LURES.has(v); $('#tk-type').value = !v ? '' : listed ? v : OTHER; $('#tk-type-other').hidden = !v || listed; $('#tk-type-other').value = v && !listed ? v : '';
    }
    function paintThumb() { $('#tk-thumb').innerHTML = thumb ? `<img src="${URL.createObjectURL(thumb)}" alt="Lure photo">` : '<span aria-hidden="true">🎣</span>'; $('#tk-photo-btn').textContent = thumb ? 'Change photo' : 'Add a photo'; }
    function edit(t) {
      editingT = t || null; thumb = t ? t.thumb || null : null;
      $('#tk-form-title').textContent = t ? 'Edit lure' : 'Add a lure'; fillTypes(t ? t.bait : '');
      $('#tk-name').value = t ? t.name || '' : ''; $('#tk-color').value = t ? t.color || '' : ''; $('#tk-size').value = t ? t.size || '' : '';
      $('#tk-error').textContent = ''; $('#tk-delete').hidden = !t; paintThumb();
      $('#tk-form').hidden = false; $('#tk-list').hidden = true; $('#tk-add').hidden = true; $('#tk-type').focus();
    }
    function done() { $('#tk-form').hidden = true; $('#tk-list').hidden = false; $('#tk-add').hidden = false; list(); }
    $('#tk-type').addEventListener('change', () => { const o = $('#tk-type').value === OTHER; $('#tk-type-other').hidden = !o; if (o) $('#tk-type-other').focus(); });
    $('#tk-photo-btn').addEventListener('click', () => $('#tk-photo').click());
    $('#tk-photo').addEventListener('change', async (e) => { const f = e.target.files[0]; e.target.value = ''; if (!f) return; try { thumb = (await processPhoto(f)).thumb; paintThumb(); } catch { toast('Could not read that image'); } });
    $('#tk-cancel').addEventListener('click', done);
    $('#tk-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const bait = $('#tk-type').value === OTHER ? $('#tk-type-other').value.trim() : $('#tk-type').value;
      if (!bait) { $('#tk-error').textContent = 'Choose the type of lure or bait.'; return; }
      const now = Date.now();
      const t = { ...(editingT || { id: uid(), createdAt: now }), updatedAt: now, bait, name: $('#tk-name').value.trim(), color: $('#tk-color').value.trim(), size: $('#tk-size').value.trim(), thumb };
      await DB.putTackle(t); await reload(); done(); toast(editingT ? 'Lure updated' : `${t.name || t.bait} added to your tackle box`);
    });
    $('#tk-delete').addEventListener('click', async () => {
      if (!editingT || !(await askConfirm(`Remove ${editingT.name || editingT.bait} from your tackle box? Catches made with it keep their lure.`, 'Remove'))) return;
      await DB.delTackle(editingT.id); await reload(); done();
    });
    $('#tk-list').addEventListener('click', (e) => { const b = e.target.closest('[data-tk-edit]'); if (b) edit(tackle.find((t) => t.id === b.dataset.tkEdit)); });
    $('#tk-add').addEventListener('click', () => edit(null));
    $('#btn-tackle').addEventListener('click', () => { done(); openSheet($('#sheet-tackle')); });
    return { list };
  })();
  function tackleStatsCard(list) {
    if (!tackle.length) return '';
    const rows = tackle.map((t) => ({ t, n: fishIn(list.filter((c) => c.tackleId === t.id)) })).sort((a, b) => b.n - a.n);
    const max = Math.max(1, ...rows.map((r) => r.n));
    return `<div class="card"><h3>My tackle box</h3><p class="sub">Fish caught on each lure you've saved, with its colour and size.</p>
      <ul class="tk-stats">${rows.map(({ t, n }) => { const u = tackleThumb(t); return `<li>${u ? `<img src="${u}" alt="">` : '<span class="tk-ph" aria-hidden="true">🎣</span>'}<span class="tk-st-main"><b>${esc(t.name || t.bait)}</b><small>${esc([t.name ? t.bait : '', t.color, t.size].filter(Boolean).join(' · '))}</small><span class="track"><span class="fill" style="width:${Math.max(2, (n / max) * 100)}%"></span></span></span><em>${n}</em></li>`; }).join('')}</ul>
      <p class="note">Only catches logged by picking the lure from your tackle box count here.</p></div>`;
  }

  // ---------------------------------------------------------------- display (night mode, large text)
  function paintDisplay() {
    $$('#seg-theme button').forEach((b) => b.classList.toggle('on', b.dataset.theme === (store('tl.theme') === 'night' ? 'night' : 'auto')));
    $$('#seg-text button').forEach((b) => b.classList.toggle('on', b.dataset.text === (store('tl.text') === 'large' ? 'large' : 'normal')));
  }
  $('#seg-theme').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; store('tl.theme', b.dataset.theme); applyDisplay(); paintDisplay(); });
  $('#seg-text').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; store('tl.text', b.dataset.text); applyDisplay(); paintDisplay(); if (map) setTimeout(() => map.invalidateSize(), 50); });

  // ---------------------------------------------------------------- plain-language insights (top of Stats)
  const INSIGHT_PHRASE = {
    sky: (b) => ({ Clear: 'under clear skies', 'Partly cloudy': 'under partly cloudy skies', Overcast: 'under overcast skies', Fog: 'in fog', Rain: 'in rain', Snow: 'in snow', Storm: 'in storms' }[b] || b),
    pressure: (b) => `when the pressure was ${b.toLowerCase()}`,
    temp: (b) => `with the air at ${b}`,
    wind: (b) => `in ${b.replace(/ \(.*\)/, '').toLowerCase()} wind`,
    time: (b) => { const x = b.replace(/ \(.*\)/, '').toLowerCase(); return x === 'dawn' || x === 'night' || x === 'midday' ? `at ${x}` : `in the ${x}`; },
    tide: (b) => `on a ${b.toLowerCase()} tide`,
    coef: (b) => `on ${b.replace(/ \(.*\)/, '').toLowerCase()} tides`,
    moon: (b) => (b === 'Waxing' || b === 'Waning' ? `while the moon was ${b.toLowerCase()}` : `around the ${b.toLowerCase()}`),
    solunar: (b) => (b === 'Outside periods' ? 'outside the solunar periods' : `during a ${b.toLowerCase()}`),
  };
  function insightsCard(list) {
    if (fishIn(list) < 5) return '';
    const out = [];
    // 1. The strongest lure-and-condition pair
    let best = null;
    Object.entries(DIMENSIONS).forEach(([dk, d]) => {
      const pool = list.filter((c) => bucketOf(d, c) != null);
      const byB = new Map(); pool.forEach((c) => { const b = bucketOf(d, c); const m = byB.get(b) || new Map(); m.set(c.bait, (m.get(c.bait) || 0) + nFish(c)); byB.set(b, m); });
      byB.forEach((m, b) => { const tot = [...m.values()].reduce((a, v) => a + v, 0); const [lure, n] = ranked(m)[0];
        if (n >= 3 && n / tot >= 0.4 && (!best || n > best.n || (n === best.n && n / tot > best.n / best.tot))) best = { dk, b, lure, n, tot }; });
    });
    if (best) out.push(`<b>${esc(best.lure)}</b> caught ${best.n} of your ${best.tot} fish ${esc(INSIGHT_PHRASE[best.dk](best.b))}.`);
    // 2. When most fish come
    const tc = ranked(countBy(list, (c) => DIMENSIONS.time.of(c))); const total = fishIn(list);
    if (tc.length && tc[0][1] / total >= 0.35) out.push(`${pct(tc[0][1], total)}% of your fish came ${esc(INSIGHT_PHRASE.time(tc[0][0]))} (${tc[0][0].match(/\((.*)\)/) ? tc[0][0].match(/\((.*)\)/)[1] : ''}).`.replace(' ()', ''));
    // 3. Fish per hour, when sessions are timed
    const per = new Map(); sessions.filter((x) => x.end).forEach((x) => { lureTime(x).forEach((ms, l) => { const e = per.get(l) || { ms: 0, n: 0 }; e.ms += ms; per.set(l, e); }); sessionCatches(x).forEach((c) => { const e = per.get(c.bait) || { ms: 0, n: 0 }; e.n += nFish(c); per.set(c.bait, e); }); });
    const fr = [...per.entries()].filter(([, e]) => e.ms >= HOUR_MS && e.n > 0).map(([l, e]) => ({ l, r: e.n / (e.ms / HOUR_MS) })).sort((a, b) => b.r - a.r)[0];
    if (fr) out.push(`When you time it, <b>${esc(fr.l)}</b> is your fastest lure: ${round(fr.r, 1)} fish per hour.`);
    // 4. Solunar periods: they cover about a quarter of the day
    const located = list.filter((c) => DIMENSIONS.solunar.of(c) != null); const inP = located.filter((c) => DIMENSIONS.solunar.of(c) !== 'Outside periods');
    if (fishIn(located) >= 10) { const sh = pct(fishIn(inP), fishIn(located)); out.push(`${sh}% of your fish came during solunar periods, which cover about a quarter of the day${sh >= 35 ? ' – more than chance would give' : sh <= 15 ? ' – fewer than chance would give' : ''}.`); }
    // 5. Recent trend
    const now = Date.now(); const a = fishIn(catches.filter((c) => c.caughtAt >= now - 30 * 86400000)); const b2 = fishIn(catches.filter((c) => c.caughtAt < now - 30 * 86400000 && c.caughtAt >= now - 60 * 86400000));
    if (a + b2 >= 5 && a !== b2) out.push(`${plural(a, 'fish')} in the last 30 days, ${a > b2 ? 'up' : 'down'} from ${b2} the 30 days before.`);
    if (!out.length) return '';
    return `<div class="card insights"><h3>What your log says</h3><ul>${out.slice(0, 5).map((x) => `<li>${x}</li>`).join('')}</ul><p class="note">From your own catches, so small numbers can mislead.</p></div>`;
  }

  // ---------------------------------------------------------------- sample data
  // A realistic month of fishing around Santa Monica, so a new user can see what Stats, Spots and Trips do.
  // In Washington, the sample is a month around Anderson Island instead (salmon and crab in Oro Bay, trout in Lake Josephine).
  async function demoInWA() {
    if (nowState && nowState.loc) return inWA(nowState.loc.lat, nowState.loc.lon);
    try { const P = await withTimeout(getPosition(3600000), 4000); return inWA(P.lat, P.lon); } catch { return false; }
  }
  async function loadDemo() {
    const H = 3600000, D = 86400000, now = Date.now(); let seed = 11; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    const waDemo = await demoInWA();
    const sp = (waDemo ? [{ id: 'demo-sp1', name: 'Oro Bay (sample)', lat: 47.1440, lon: -122.6750, radiusM: 400, notes: 'Sample spot.', water: 'salt' }, { id: 'demo-sp2', name: 'Lake Josephine (sample)', lat: 47.1607, lon: -122.6457, radiusM: 400, notes: '', water: 'fresh' }]
      : [{ id: 'demo-sp1', name: 'Santa Monica Pier (sample)', lat: 34.0092, lon: -118.4976, radiusM: 250, notes: 'Sample spot.', water: 'salt' }, { id: 'demo-sp2', name: 'Malibu Lagoon (sample)', lat: 34.0335, lon: -118.6795, radiusM: 500, notes: '', water: 'salt' }]).map((x) => ({ ...x, demo: true, createdAt: now, updatedAt: now }));
    const kindsCA = [['Calico Bass (Kelp Bass)', 'Swimbait', 'Sardine', '5 in'], ['Barred Sand Bass', 'Curly-tail grub', 'Motor oil', ''], ['California Halibut', 'Live bait', '', ''], ['Spotted Bay Bass', 'Curly-tail grub', 'Motor oil', ''], ['California Corbina', 'Sand crab', '', ''], ['Calico Bass (Kelp Bass)', 'Curly-tail grub', '', '']];
    const kindsSalt = [['Coho (Silver) Salmon', 'Spoon', 'Chrome', ''], ['Coho (Silver) Salmon', 'Jig', 'Glow', ''], ['Chinook (King) Salmon', 'Spoon', 'Green', ''], ['Dungeness Crab', 'Crab pot', '', '']];
    const kindsFresh = [['Rainbow Trout', 'PowerBait', 'Chartreuse', ''], ['Rainbow Trout', 'Inline spinner', 'Gold', ''], ['Cutthroat Trout', 'Inline spinner', 'Gold', ''], ['Largemouth Bass', 'Senko', 'Green pumpkin', '5 in']];
    const cs = [];
    for (let i = 0; i < 24; i++) { const p = rnd() < 0.6 ? sp[0] : sp[1]; const kinds = waDemo ? (p === sp[0] ? kindsSalt : kindsFresh) : kindsCA; const [s, b, col, size] = kinds[Math.floor(rnd() * kinds.length)]; const t = now - (1 + Math.floor(rnd() * 40)) * D + Math.floor(rnd() * 12) * H - 6 * H;
      cs.push({ id: 'demo-c' + i, demo: true, createdAt: t, updatedAt: t, caughtAt: t, species: s, bait: b, lureColor: col, lureSize: size, count: rnd() < 0.15 ? 2 : 1,
        lengthCm: rnd() < 0.6 ? round(28 + rnd() * 30, 1) : null, weightKg: rnd() < 0.45 ? round(0.4 + rnd() * 2.2, 2) : null, released: rnd() < 0.75, notes: '', photo: null, thumb: null, extraPhotos: [],
        location: { lat: p.lat + (rnd() - 0.5) * 0.002, lon: p.lon + (rnd() - 0.5) * 0.002, accuracy: 8, source: 'gps', at: t }, spotId: p.id,
        weather: { tempC: round(13 + rnd() * 10, 1), feelsC: 15, humidity: 70, precipMm: 0, code: [0, 1, 2, 3, 3, 61][Math.floor(rnd() * 6)], isDay: true, cloud: 40, pressure: round(1009 + rnd() * 10, 1), pressureTrend: ['rising', 'steady', 'falling', 'falling'][Math.floor(rnd() * 4)], windKmh: round(rnd() * 28, 1), windDir: 270, gustKmh: 20, source: 'hourly', time: t },
        weatherTries: 0, tide: { stationId: '9410840', stationName: 'Santa Monica, CA', distM: 300, stage: ['Rising', 'Falling', 'High slack', 'Low slack', 'Falling'][Math.floor(rnd() * 5)], rising: rnd() < 0.5, heightM: round(rnd() * 1.6, 2), lastType: 'L', lastT: t - 2 * H, nextType: 'H', nextT: t + 4 * H, coef: Math.round(40 + rnd() * 60) },
        marine: { seaTempC: 17, waveM: 0.9, periodS: 12 }, tideTries: 0 }); }
    const ses = { id: 'demo-s1', demo: true, start: now - 4 * D - 3 * H, end: now - 4 * D, lat: 34.0092, lon: -118.4976, spotId: 'demo-sp1', createdAt: now, lures: [{ bait: 'Swimbait', color: 'Sardine', size: '5 in', at: now - 4 * D - 3 * H }, { bait: 'Curly-tail grub', color: 'Motor oil', size: '', at: now - 4 * D - 1.5 * H }] };
    cs[0].sessionId = ses.id; cs[0].caughtAt = now - 4 * D - 2.5 * H; cs[0].bait = 'Swimbait'; cs[1].sessionId = ses.id; cs[1].caughtAt = now - 4 * D - 1 * H; cs[1].bait = 'Curly-tail grub'; cs[2].sessionId = ses.id; cs[2].caughtAt = now - 4 * D - 0.5 * H; cs[2].bait = 'Curly-tail grub';
    const ts = new Date(now + 2 * D); ts.setHours(6, 0, 0, 0);
    const trip = { id: 'demo-t1', demo: true, name: 'Pier dawn session (sample)', lat: 34.0092, lon: -118.4976, spotId: 'demo-sp1', start: ts.getTime(), end: ts.getTime() + 4 * H, species: ['Calico Bass (Kelp Bass)'], gear: [], notes: '', createdAt: now, updatedAt: now };
    if (waDemo) {
      for (const c of cs) {
        const salt = c.spotId === 'demo-sp1';
        c.kind = (SPECIES_INFO.get(c.species) || {}).kind || 'fish';
        if (c.weather) c.weather.tempC = round(4 + rnd() * 10, 1);
        if (salt) { c.tide = { ...c.tide, stationId: '9446484', stationName: 'Tacoma, WA', distM: 14000 }; c.marine = { seaTempC: 11, waveM: 0.3, periodS: 4 }; }
        else { c.tide = null; c.marine = null; }
        if (c.kind === 'shellfish') { Object.assign(c, { lengthCm: null, weightKg: null, lureColor: '', lureSize: '', shellBait: 'Chicken', crabSex: 'male', shellHard: true, carapaceCm: round(16 + rnd() * 2.5, 1), pots: 2, soakH: 1.5, released: rnd() < 0.4 }); }
        else if (/Salmon/.test(c.species)) { c.lengthCm = c.lengthCm && round(55 + rnd() * 20, 1); c.weightKg = c.weightKg && round(2.5 + rnd() * 3, 2); }
        else { c.lengthCm = c.lengthCm && round(25 + rnd() * 15, 1); c.weightKg = c.weightKg && round(0.3 + rnd() * 0.8, 2); }
      }
      Object.assign(ses, { lat: sp[0].lat, lon: sp[0].lon, lures: [{ bait: 'Spoon', color: 'Chrome', size: '', at: ses.start }, { bait: 'Jig', color: 'Glow', size: '', at: ses.start + 1.5 * H }] });
      [[0, 'Coho (Silver) Salmon', 'Spoon', 'Chrome'], [1, 'Coho (Silver) Salmon', 'Jig', 'Glow'], [2, 'Coho (Silver) Salmon', 'Jig', 'Glow']].forEach(([k, sp1, b, col]) => Object.assign(cs[k], { species: sp1, bait: b, lureColor: col, lureSize: '', kind: 'fish', spotId: 'demo-sp1', location: { ...cs[k].location, lat: sp[0].lat, lon: sp[0].lon }, crabSex: undefined, carapaceCm: undefined, pots: undefined, soakH: undefined, shellBait: undefined, shellHard: undefined }));
      Object.assign(trip, { name: 'Oro Bay morning (sample)', lat: sp[0].lat, lon: sp[0].lon, species: ['Coho (Silver) Salmon'] });
    }
    for (const x of sp) await DB.putSpot(x); for (const c of cs) await DB.put(c); await DB.putSession(ses); await DB.putTrip(trip);
    await reload(); toast('Sample data loaded – look around, then clear it from the banner');
  }
  async function clearDemo() {
    if (!(await askConfirm('Remove all the sample data? Anything you logged yourself stays.', 'Remove'))) return;
    for (const c of catches.filter((x) => x.demo)) await DB.del(c.id); for (const x of spots.filter((y) => y.demo)) await DB.delSpot(x.id);
    for (const x of sessions.filter((y) => y.demo)) await DB.delSession(x.id); for (const x of trips.filter((y) => y.demo)) await DB.delTrip(x.id);
    await reload(); toast('Sample data removed');
  }
  function paintDemoBar() { $('#demo-bar').hidden = !(catches.some((c) => c.demo) || spots.some((x) => x.demo) || trips.some((x) => x.demo)); }
  $('#demo-clear').addEventListener('click', clearDemo);
  $('#demo-try-log').addEventListener('click', loadDemo);

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
  $('#quick-links').addEventListener('click', async (e) => {
    const b = e.target.closest('[data-qlink]'); if (!b) return; const c = quickCombos()[Number(b.dataset.qlink)]; if (!c) return;
    const url = quickLink(c);
    try { await navigator.clipboard.writeText(url); toast('Link copied'); } catch { toast(url); }
  });
  $('#btn-menu').addEventListener('click', async () => {
    paintUnits(); paintDisplay(); $('#app-version').textContent = `Fishamongus! version ${APP_VERSION}`;
    const qc = quickCombos().slice(0, 3);
    $('#quick-links').innerHTML = qc.length ? `<p class="help small" style="margin:8px 0 6px">One-tap links for your usual catches:</p><ul class="qlinks">${qc.map((c, i) => `<li><span>${esc(c.species)} · ${esc(c.bait)}</span><button type="button" class="btn sm" data-qlink="${i}">Copy link</button></li>`).join('')}</ul>` : '';
    $('#storage-info').textContent = ''; paintBackupInfo(); paintAutoBackup();
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
  // ---------------------------------------------------------------- automatic backup
  // A web app can't put files in iCloud or Google Drive by itself. So:
  //  - where the browser lets an app keep a file (Chrome on a computer, and some Android phones), you pick a backup file once
  //    and the app rewrites it whenever a backup is due, with no taps;
  //  - everywhere else (iPhone), the app tells you when a backup is due and one tap opens the share sheet.
  const FS_OK = typeof window.showSaveFilePicker === 'function';
  const abMode = () => store('tl.autoBackup') || 'weekly';
  const realOnly = (a) => a.filter((x) => !x.demo);
  function backupState() {
    const last = Number(store('tl.lastBackup') || 0);
    const since = realOnly(catches).filter((c) => (c.createdAt || 0) > last).length;
    const changed = Math.max(0, ...[...realOnly(catches), ...realOnly(spots), ...realOnly(trips), ...realOnly(sessions), ...tackle].map((x) => x.updatedAt || x.createdAt || 0)) > last;
    return { last, since, changed };
  }
  function backupDue() {
    const mode = abMode(); const { last, changed } = backupState(); const now = Date.now();
    if (!realOnly(catches).length || !changed) return false;
    if (mode === 'off') return realOnly(catches).length >= 5 && (!last || now - last > 30 * 86400000);   // the old gentle reminder
    if (!last) return true;
    if (mode === 'session') return realOnly(sessions).some((x) => x.end && x.end > last) || now - last > 7 * 86400000;
    return now - last >= (mode === 'daily' ? 20 * HOUR_MS : 7 * 86400000 - HOUR_MS);
  }
  async function backupHandle() { if (!FS_OK) return null; try { return (await DB.getMeta('backupHandle')) || null; } catch { return null; } }
  async function writeBackupFile(h) { const w = await h.createWritable(); await w.write(await buildBackupBlob()); await w.close(); markBackedUp(); }
  // Called when the app opens or comes back to the front, and when a fishing session ends.
  async function autoBackup() {
    if (!backupDue()) { updateBackupNudge(); return; }
    const h = await backupHandle();
    if (h) { try { if ((await h.queryPermission({ mode: 'readwrite' })) === 'granted') { await writeBackupFile(h); toastBg(`Backed up to ${h.name}`); return; } } catch { /* fall back to the reminder */ } }
    updateBackupNudge();
  }
  // The one-tap "Back up now": rewrite the chosen file if there is one (the tap lets the browser ask for permission), else share sheet.
  async function backupNow() {
    const h = await backupHandle();
    if (h) { try { if ((await h.requestPermission({ mode: 'readwrite' })) === 'granted') { toast('Backing up…'); await writeBackupFile(h); toast(`Backed up to ${h.name}`); return; } } catch { /* use the share sheet */ } }
    await exportBackup();
  }
  function updateBackupNudge() {
    const el = $('#backup-nudge'); if (!el) return;
    const { last, since } = backupState(); const now = Date.now(); const mode = abMode();
    const snoozed = now < Number(store('tl.backupSnooze') || 0);
    el.hidden = snoozed || !backupDue();
    if (el.hidden) return;
    const n = realOnly(catches).length;
    $('#backup-nudge-text').textContent = !last ? `${n === 1 ? 'Your catch is' : `Your ${n} catches are`} saved only on this phone. Back ${n === 1 ? 'it' : 'them'} up to iCloud Drive, Google Drive or your computer so ${n === 1 ? "it's" : "they're"} safe.`
      : mode === 'off' ? `${plural(since, 'catch')} since your last backup on ${fmtDate(last)}. Your log is only on this phone.`
        : `Time for your ${mode === 'session' ? 'after-session' : mode} backup${since ? `: ${plural(since, 'new catch')} since ${fmtDate(last)}` : ` (last one ${fmtDate(last)})`}. One tap saves it.`;
  }
  $('#backup-nudge-later').addEventListener('click', () => { store('tl.backupSnooze', String(Date.now() + (abMode() === 'weekly' || abMode() === 'off' ? 3 : 1) * 86400000)); updateBackupNudge(); });
  $('#backup-nudge-go').addEventListener('click', () => backupNow());
  async function paintAutoBackup() {
    $('#ab-mode').value = abMode();
    const h = await backupHandle(); $('#ab-file-row').hidden = !FS_OK || abMode() === 'off';
    if (FS_OK) { $('#ab-file-text').textContent = h ? `Backing up to "${h.name}" automatically – no taps needed.` : 'This browser can keep one backup file up to date by itself. Choose where to keep it (a synced folder is best).'; $('#ab-file-btn').textContent = h ? 'Choose a different file' : 'Choose a backup file'; }
    const mode = abMode(); const { last } = backupState();
    $('#ab-status').textContent = mode === 'off' ? 'You\'ll still get a reminder if your log goes 30 days without a backup.'
      : backupDue() ? 'A backup is due now.' : last ? `Next backup: ${mode === 'session' ? 'after your next fishing session' : fmtDate(last + (mode === 'daily' ? 86400000 : 7 * 86400000))}, if anything has changed.` : '';
  }
  $('#ab-mode').addEventListener('change', (e) => { store('tl.autoBackup', e.target.value); paintAutoBackup(); updateBackupNudge(); });
  $('#ab-file-btn').addEventListener('click', async () => {
    try {
      const h = await window.showSaveFilePicker({ suggestedName: 'fishamongus-backup.json', types: [{ description: 'Fishamongus! backup', accept: { 'application/json': ['.json'] } }] });
      await DB.putMeta('backupHandle', h); toast('Backing up…'); await writeBackupFile(h); toast(`Backed up to ${h.name}. Future backups update it automatically.`); paintAutoBackup();
    } catch (err) { if (!err || err.name !== 'AbortError') toast('Could not use that file'); }
  });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) autoBackup().catch(() => {}); });
  const blobToDataURL = (b) => new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(b); });
  const dataURLToBlob = async (d) => (await fetch(d)).blob();
  const stamp = () => toLocalInput(new Date()).slice(0, 10);

  $('#btn-export-json').addEventListener('click', () => exportBackup());
  async function exportBackup() {
    if (!catches.length && !spots.length && !trips.length && !sessions.length) return toast('Nothing to export yet');
    toast('Preparing backup…');
    const ok = await deliverFile(await buildBackupBlob(), `fishamongus-backup-${stamp()}.json`);
    if (ok) { markBackedUp(); toast('Backup saved'); }
  }
  async function buildBackupBlob() {
    const out = [];
    const tk = []; for (const t of tackle) tk.push({ ...t, thumb: t.thumb ? await blobToDataURL(t.thumb) : null });
    for (const c of catches.filter((x) => !x.demo)) {
      const extra = []; for (const p of c.extraPhotos || []) extra.push({ photo: await blobToDataURL(p.photo), thumb: p.thumb ? await blobToDataURL(p.thumb) : null });
      out.push({ ...c, photo: c.photo ? await blobToDataURL(c.photo) : null, thumb: c.thumb ? await blobToDataURL(c.thumb) : null, extraPhotos: extra });
    }
    return new Blob([JSON.stringify({ app: 'fishamongus', version: 6, exportedAt: new Date().toISOString(), spots: spots.filter((x) => !x.demo), trips: trips.filter((x) => !x.demo), sessions: sessions.filter((x) => !x.demo), tackle: tk, limits: getLimits(), catches: out })], { type: 'application/json' });
  }
  function markBackedUp() { store('tl.lastBackup', String(Date.now())); store('tl.backupSnooze', '0'); updateBackupNudge(); paintBackupInfo(); }
  $('#btn-export-csv').addEventListener('click', async () => {
    if (!catches.length) return toast('Nothing to export yet');
    const q = (v) => { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
    const head = ['Date', 'Time', 'Spot', 'Species', 'Count', 'Lure/Bait', 'Lure colour', 'Lure size', `Length ${U.lenLabel()}`, `Weight ${U.wtLabel()}`, 'Released', 'Latitude', 'Longitude', 'GPS accuracy (m)', 'Weather', `Temp ${imp() ? '(°F)' : '(°C)'}`, `Wind ${imp() ? '(mph)' : '(km/h)'}`, 'Wind dir', `Pressure ${imp() ? '(inHg)' : '(hPa)'}`, 'Pressure trend', 'Humidity (%)', 'Moon', 'Tide stage', `Tide height ${imp() ? '(ft)' : '(m)'}`, 'Tidal coefficient', 'Tide station', `Water temp ${imp() ? '(°F)' : '(°C)'}`, `Waves ${imp() ? '(ft)' : '(m)'}`, 'Wave period (s)', 'Session', 'Fish or shellfish', 'Bait (shellfish)', 'Crab sex', 'Shell', `Carapace ${U.lenLabel()}`, 'Pots', 'Soak (h)', 'River flow (cfs)', 'Flow trend', 'From', 'Notes'];
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
        kindOf(c), c.shellBait || '', c.crabSex || '', c.shellHard === true ? 'hard' : c.shellHard === false ? 'soft' : '', U.lenOut(c.carapaceCm), c.pots || '', c.soakH || '',
        c.flow ? Math.round(c.flow.cfs) : '', c.flow ? c.flow.trend || '' : '', c.from || '',
        c.notes].map(q).join(','); });
    await deliverFile(new Blob(['﻿' + [head.map(q).join(','), ...rows].join('\n')], { type: 'text/csv' }), `fishamongus-${stamp()}.csv`);
  });
  // Add someone else's log (a fishing partner, or an old phone) without overwriting yours.
  // Their spots join yours when within 100 m; catches already in your log (same fish, same minute, same place) are skipped.
  async function mergeBackup(j, from) {
    const out = { catches: 0, dup: 0, spots: 0, trips: 0 };
    const spotMap = new Map();
    for (const x of (Array.isArray(j.spots) ? j.spots : [])) {
      if (!x || !x.id || !x.name || !Number.isFinite(x.lat) || !Number.isFinite(x.lon)) continue;
      const mine = spots.find((sp) => sp.id === x.id) || spots.map((sp) => ({ sp, d: distM(sp, x) })).filter((o) => o.d <= 100).sort((a, b) => a.d - b.d).map((o) => o.sp)[0];
      if (mine) { spotMap.set(x.id, mine.id); continue; }
      const sp = { ...x, id: uid(), updatedAt: Date.now() }; await DB.putSpot(sp); spots.push(sp); spotMap.set(x.id, sp.id); out.spots++;
    }
    const mapSpot = (id) => (id ? spotMap.get(id) || (spotById(id) ? id : null) : null);
    const ids = new Set(catches.map((c) => c.id));
    const same = (a, b) => a.species === b.species && Math.abs(a.caughtAt - b.caughtAt) < 60000 && (!a.location || !b.location || distM(a.location, b.location) < 200);
    for (const c of (Array.isArray(j.catches) ? j.catches : [])) {
      if (!c || !c.id || !c.species || !Number.isFinite(c.caughtAt)) continue;
      if (ids.has(c.id) || catches.some((m) => same(m, c))) { out.dup++; continue; }
      const extra = []; for (const p of c.extraPhotos || []) if (p && p.photo) extra.push({ photo: await dataURLToBlob(p.photo), thumb: p.thumb ? await dataURLToBlob(p.thumb) : null });
      const rec = { ...c, spotId: mapSpot(c.spotId), sessionId: null, photo: c.photo ? await dataURLToBlob(c.photo) : null, thumb: c.thumb ? await dataURLToBlob(c.thumb) : null, extraPhotos: extra };
      if (from) rec.from = from; delete rec.sample;
      await DB.put(rec); ids.add(rec.id); out.catches++;
    }
    const tripIds = new Set(trips.map((t) => t.id));
    for (const x of (Array.isArray(j.trips) ? j.trips : [])) { if (x && x.id && !tripIds.has(x.id) && Number.isFinite(x.start) && Number.isFinite(x.lat)) { await DB.putTrip({ ...x, spotId: mapSpot(x.spotId) }); out.trips++; } }
    return out;
  }
  $('#f-merge').addEventListener('change', async (e) => {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    try {
      const j = JSON.parse(await f.text());
      if (!j || !['fishamongus', 'tightlines'].includes(j.app) || !Array.isArray(j.catches)) throw new Error('not a Fishamongus! backup');
      const from = $('#merge-from').value.trim().slice(0, 40);
      const r = await mergeBackup(j, from);
      await reload();
      toast(`Added ${plural(r.catches, 'catch')}${r.spots ? `, ${plural(r.spots, 'spot')}` : ''}${r.trips ? `, ${plural(r.trips, 'trip')}` : ''}${r.dup ? ` · ${r.dup} already in your log` : ''}`);
    } catch (err) { toast('Could not add: ' + err.message); }
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
      for (const x of (Array.isArray(j.tackle) ? j.tackle : [])) { if (x && x.id && x.bait) await DB.putTackle({ ...x, thumb: x.thumb ? await dataURLToBlob(x.thumb) : null }); }
      if (j.limits && typeof j.limits === 'object' && !Object.keys(getLimits()).length) store('tl.limits', JSON.stringify(j.limits));
      for (const x of (Array.isArray(j.spots) ? j.spots : [])) { if (x && x.id && x.name && Number.isFinite(x.lat) && Number.isFinite(x.lon)) { await DB.putSpot(x); ns++; } }
      for (const c of j.catches) {
        if (!c.id || !c.species) continue;
        const extra = []; for (const p of c.extraPhotos || []) if (p && p.photo) extra.push({ photo: await dataURLToBlob(p.photo), thumb: p.thumb ? await dataURLToBlob(p.thumb) : null });
        await DB.put({ ...c, photo: c.photo ? await dataURLToBlob(c.photo) : null, thumb: c.thumb ? await dataURLToBlob(c.thumb) : null, extraPhotos: extra }); n++;
      }
      await reload(); toast(`Restored ${plural(n, 'catch')}${ns ? `, ${plural(ns, 'spot')}` : ''}${nt ? `, ${plural(nt, 'trip')}` : ''}`);
    } catch (err) { toast('Could not restore: ' + err.message); }
  });


  // ---------------------------------------------------------------- import a log
  // Bring in a log kept somewhere else: a spreadsheet (CSV) from another fishing app, a hand-kept log,
  // this app's own CSV export, or a Fishamongus! backup. Columns are matched by name, you check the
  // matches and a preview, and catches already in your log are skipped. Undo removes the whole import.
  const IMP_FIELDS = [
    ['date', 'Date (or date and time)', true, ['date', 'caught at', 'caught on', 'catch date', 'datetime', 'date time', 'date/time', 'timestamp', 'when', 'day', 'fecha', 'datum']],
    ['time', 'Time', false, ['time', 'catch time', 'time caught', 'hour', 'hora']],
    ['species', 'Fish or shellfish', true, ['species', 'fish', 'fish type', 'fish species', 'species name', 'catch', 'kind of fish', 'type', 'especie', 'art']],
    ['count', 'How many', false, ['count', 'number', 'qty', 'quantity', 'how many', 'number of fish', 'fish count', 'amount', 'n']],
    ['bait', 'Lure or bait', false, ['lure/bait', 'lure', 'bait', 'lure or bait', 'bait/lure', 'lure name', 'bait used', 'lure used', 'tackle', 'fly', 'gear', 'method', 'technique', 'rig']],
    ['lureColor', 'Lure colour', false, ['lure colour', 'lure color', 'colour', 'color', 'bait color']],
    ['lureSize', 'Lure size', false, ['lure size', 'size of lure', 'hook size']],
    ['length', 'Length', false, ['length', 'size', 'length (in)', 'length (cm)', 'len', 'fish length', 'total length', 'tl']],
    ['weight', 'Weight', false, ['weight', 'weight (lb)', 'weight (kg)', 'wt', 'fish weight', 'lbs', 'pounds']],
    ['released', 'Released or kept', false, ['released', 'kept', 'catch and release', 'catch & release', 'c&r', 'cnr', 'release', 'harvested', 'kept/released', 'kept or released']],
    ['lat', 'Latitude', false, ['latitude', 'lat', 'gps latitude', 'location latitude', 'y']],
    ['lon', 'Longitude', false, ['longitude', 'lon', 'lng', 'long', 'gps longitude', 'location longitude', 'x']],
    ['spot', 'Spot or place', false, ['spot', 'spot name', 'place', 'location', 'location name', 'water', 'water body', 'waterbody', 'lake', 'river', 'fishing spot', 'site', 'venue']],
    ['notes', 'Notes', false, ['notes', 'note', 'comments', 'comment', 'description', 'remarks', 'details', 'memo']],
    ['from', 'Whose catch', false, ['from', 'angler', 'caught by', 'fisherman', 'name', 'who']],
  ];
  const impNorm = (s) => String(s || '').toLowerCase().replace(/﻿/g, '').replace(/\s+/g, ' ').trim();
  function parseCsv(text) {
    text = text.replace(/^﻿/, '');
    // The separator is the one splitting the first few lines the most (a title line may come first).
    const lines = text.split(/\r?\n/).filter((l) => l.trim()).slice(0, 6);
    const delim = [',', ';', '\t', '|'].map((d) => [d, Math.max(...lines.map((l) => l.split(d).length))]).sort((a, b) => b[1] - a[1])[0][0];
    const rows = []; let row = []; let f = ''; let q = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (q) {
        if (ch === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += ch;
      } else if (ch === '"' && f === '') q = true;
      else if (ch === delim) { row.push(f); f = ''; }
      else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(f); rows.push(row); row = []; f = ''; }
      else f += ch;
    }
    if (f !== '' || row.length) { row.push(f); rows.push(row); }
    return rows.map((r) => r.map((c) => c.trim())).filter((r) => r.some((c) => c !== ''));
  }
  // Pick the column for each field: exact header names first, then headers that start with or contain one.
  function guessColumns(head) {
    const h = head.map(impNorm); const used = new Set(); const map = {};
    const strip = (s) => s.replace(/\s*[([].*?[)\]]\s*/g, ' ').trim();
    for (const pass of [0, 1, 2]) {
      for (const [key, , , syn] of IMP_FIELDS) {
        if (map[key] != null) continue;
        const i = h.findIndex((x, j) => !used.has(j) && syn.some((s) => pass === 0 ? x === s : pass === 1 ? strip(x) === s : (s.length > 3 && x.includes(s))));
        if (i >= 0) { map[key] = i; used.add(i); }
      }
    }
    // "Kept" means the opposite of "Released".
    map.keptCol = map.released != null && /^(kept|harvested)/.test(h[map.released]);
    return map;
  }
  function unitFrom(header, kind) {
    const h = impNorm(header);
    if (kind === 'len') return /\bcm\b|centim/.test(h) ? 'cm' : /\bmm\b/.test(h) ? 'mm' : /\bin\b|inch|"/.test(h) ? 'in' : '';
    return /\bkg\b|kilo/.test(h) ? 'kg' : /\bg\b|gram/.test(h) ? 'g' : /\boz\b|ounce/.test(h) && !/lb/.test(h) ? 'oz' : /\blbs?\b|pound/.test(h) ? 'lb' : '';
  }
  // Dates: ISO, US (5/3/2026) or day-first (3/5/2026) – the order is worked out from the whole column.
  function dateOrder(values) {
    let dmy = 0; let mdy = 0;
    for (const v of values) { const m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/.exec(v || ''); if (!m) continue; if (+m[1] > 12) dmy++; if (+m[2] > 12) mdy++; }
    if (dmy && !mdy) return 'dmy'; if (mdy && !dmy) return 'mdy';
    return /^en-(us|ph)|^es-(us|mx)/i.test(navigator.language || 'en-US') || !navigator.language ? 'mdy' : 'dmy';
  }
  function parseWhen(dateStr, timeStr, order) {
    const d = String(dateStr || '').trim(); if (!d) return null;
    let y; let mo; let da; let rest = '';
    let m;
    if (/^\d{5}(\.\d+)?$/.test(d) && +d > 20000 && +d < 80000) { // a spreadsheet serial date
      const ms = Math.round((+d - 25569) * 864e5); const t = new Date(ms);
      return new Date(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate(), t.getUTCHours(), t.getUTCMinutes()).getTime();
    }
    if ((m = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(.*)$/.exec(d))) { y = +m[1]; mo = +m[2]; da = +m[3]; rest = m[4]; }
    else if ((m = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})(.*)$/.exec(d))) {
      y = +m[3]; if (y < 100) y += 2000; rest = m[4];
      if (order === 'dmy') { da = +m[1]; mo = +m[2]; } else { mo = +m[1]; da = +m[2]; }
    } else {
      const t = Date.parse(d); if (!Number.isFinite(t)) return null;
      if (/[zZ]|[+-]\d\d:?\d\d$/.test(d) || /T\d/.test(d)) return t;
      const x = new Date(t); y = x.getFullYear(); mo = x.getMonth() + 1; da = x.getDate(); rest = /\d{1,2}:\d{2}/.test(d) ? d.slice(d.search(/\d{1,2}:\d{2}/)) : '';
    }
    if (!(mo >= 1 && mo <= 12 && da >= 1 && da <= 31)) return null;
    if (rest && /^T/.test(rest) && /[zZ]|[+-]\d\d:?\d\d$/.test(rest)) { const t = Date.parse(`${y}-${String(mo).padStart(2, '0')}-${String(da).padStart(2, '0')}${rest}`); if (Number.isFinite(t)) return t; }
    let hh = 12; let mm = 0; // no time given: midday, so the date never shifts
    const tm = /(\d{1,2})[:.h](\d{2})(?::\d{2})?\s*([ap])?\.?\s*m?\.?/i.exec(String(timeStr || '').trim() || rest);
    if (tm) { hh = +tm[1]; mm = +tm[2]; if (tm[3]) { const pm = /p/i.test(tm[3]); if (hh === 12) hh = pm ? 12 : 0; else if (pm) hh += 12; } }
    else { const t2 = /^(\d{1,2})\s*([ap])\.?m\.?$/i.exec(String(timeStr || '').trim()); if (t2) { hh = (+t2[1] % 12) + (/p/i.test(t2[2]) ? 12 : 0); } }
    if (hh > 23 || mm > 59) return null;
    const out = new Date(y, mo - 1, da, hh, mm).getTime();
    return out > Date.now() + 864e5 ? null : out;
  }
  const impNum = (v) => { const s = String(v ?? '').replace(/,(?=\d{1,2}$)/, '.').replace(/[^\d.-]/g, ''); const n = parseFloat(s); return Number.isFinite(n) ? n : null; };
  function impLength(v, unit) {
    const s = String(v || '').trim(); if (!s) return null;
    const u = unitFrom(s, 'len') || unit; const n = impNum(s.replace(/(cm|mm|in|inches|")$/i, '')); if (n == null || n <= 0) return null;
    const cm = u === 'cm' ? n : u === 'mm' ? n / 10 : n * 2.54;
    return cm > 0 && cm < 1000 ? cm : null;
  }
  function impWeight(v, unit) {
    const s = String(v || '').trim().toLowerCase(); if (!s) return null;
    const lbOz = /([\d.]+)\s*(?:lbs?|pounds?|#)\s*(?:([\d.]+)\s*(?:oz|ounces?))?/.exec(s);
    if (lbOz) return (+lbOz[1] + (lbOz[2] ? +lbOz[2] / 16 : 0)) * 0.45359237;
    const u = unitFrom(s, 'wt') || unit; const n = impNum(s); if (n == null || n <= 0) return null;
    const kg = u === 'kg' ? n : u === 'g' ? n / 1000 : u === 'oz' ? n / 16 * 0.45359237 : n * 0.45359237;
    return kg > 0 && kg < 1500 ? kg : null;
  }
  function impReleased(v, keptCol) {
    const s = impNorm(v); if (!s) return null;
    let yes = /^(y|yes|true|1|x|✓|✔|released|release|c&r|cnr|catch and release|r)$/.test(s);
    let no = /^(n|no|false|0|kept|keep|harvested|harvest|k|killed|retained)$/.test(s);
    if (!yes && !no) return null;
    if (/^(kept|keep|harvested|harvest|killed|retained|k)$/.test(s)) return false;
    if (/^(released|release|c&r|cnr|catch and release|r)$/.test(s)) return true;
    if (keptCol) { const t = yes; yes = no; no = t; }
    return yes ? true : no ? false : null;
  }
  // Match a species name to the app's list (any case, "Bass, Largemouth" order, or a word in it); otherwise keep it as written.
  const speciesIndex = (() => { let m = null; return () => { if (m) return m; m = new Map();
    const names = [...new Set([...KNOWN_SPECIES, ...FISH_TYPES.keys(), ...SPECIES_INFO.keys()])];
    names.forEach((n) => { m.set(impNorm(n), n); const bare = impNorm(n.replace(/\s*\(.*?\)/g, '')); if (!m.has(bare)) m.set(bare, n);
      (n.match(/\(([^)]+)\)/g) || []).forEach((p) => { const k = impNorm(p.slice(1, -1)); if (!m.has(k)) m.set(k, n); }); });
    return m; }; })();
  function impSpecies(v) {
    const s = String(v || '').trim().slice(0, 80); if (!s) return '';
    const idx = speciesIndex(); const k = impNorm(s);
    if (idx.has(k)) return idx.get(k);
    const flip = /^([^,]+),\s*(.+)$/.exec(k); if (flip && idx.has(`${flip[2]} ${flip[1]}`)) return idx.get(`${flip[2]} ${flip[1]}`);
    const sing = k.replace(/s$/, ''); if (idx.has(sing)) return idx.get(sing);
    const mine = catches.find((c) => impNorm(c.species) === k); if (mine) return mine.species;
    // "Pike" → "Northern Pike": a name ending in it, when only one does (or you've logged one of them before).
    const ends = [...new Set([...idx.entries()].filter(([n]) => n.endsWith(' ' + k) || n.endsWith(' ' + sing)).map(([, v]) => v))];
    if (ends.length === 1) return ends[0];
    const used = ends.filter((v) => catches.some((c) => c.species === v)); if (used.length === 1) return used[0];
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  let impState = null;
  async function openImport(file) {
    if (!file) return;
    let text;
    try { text = await file.text(); } catch { return toast('Could not read that file'); }
    const name = file.name || 'file';
    if (/^\s*[{[]/.test(text)) {
      try {
        const j = JSON.parse(text);
        if (!j || !['fishamongus', 'tightlines'].includes(j.app) || !Array.isArray(j.catches)) throw new Error();
        if (!(await askConfirm(`${name} is a Fishamongus! backup with ${plural(j.catches.length, 'catch')}. Add them to your log? Nothing of yours is replaced, and catches already here are skipped.`, 'Add to my log'))) return;
        const r = await mergeBackup(j, ''); await reload();
        toast(`Added ${plural(r.catches, 'catch')}${r.spots ? `, ${plural(r.spots, 'spot')}` : ''}${r.dup ? ` · ${r.dup} already in your log` : ''}`);
        backfillWeather().then(backfillTides).catch(() => {});
      } catch { toast("That file isn't a spreadsheet or a Fishamongus! backup"); }
      return;
    }
    const rows = parseCsv(text);
    if (rows.length < 2) return toast(rows.length ? 'That spreadsheet has a header row but no catches' : "Couldn't find any rows in that file");
    // The header is the first row that looks like names, within the first 5 rows (some exports start with a title line).
    let hr = 0; let best = -1;
    for (let i = 0; i < Math.min(5, rows.length - 1); i++) { const g = guessColumns(rows[i]); const n = IMP_FIELDS.filter(([k]) => g[k] != null).length + (g.species != null && g.date != null ? 10 : 0); if (n > best) { best = n; hr = i; } }
    const head = rows[hr]; const body = rows.slice(hr + 1).filter((r) => r.length > 1 || r[0]);
    const map = guessColumns(head);
    impState = { name, head, body, map, keptCol: map.keptCol, hiRow: hr,
      lenUnit: (map.length != null && unitFrom(head[map.length], 'len')) || (imp() ? 'in' : 'cm'),
      wtUnit: (map.weight != null && unitFrom(head[map.weight], 'wt')) || (imp() ? 'lb' : 'kg'),
      order: dateOrder(body.map((r) => r[map.date])) };
    $('#imp-file').textContent = `${name} · ${plural(body.length, 'row')}`;
    $('#imp-label').value = '';
    renderImportMap(); renderImportPreview();
    openSheet($('#sheet-import'));
  }
  function renderImportMap() {
    const s = impState; const opts = (sel) => `<option value="">– not in this file –</option>` + s.head.map((h, i) => `<option value="${i}"${sel === i ? ' selected' : ''}>${esc(h || `Column ${i + 1}`)}${s.body[0] && s.body[0][i] ? ` (e.g. ${esc(s.body[0][i].slice(0, 24))})` : ''}</option>`).join('');
    $('#imp-map').innerHTML = IMP_FIELDS.map(([key, label, req]) => `<div class="field imp-row"><label for="imp-${key}">${esc(label)}${req ? ' <span class="req">required</span>' : ''}</label><div class="select-wrap"><select id="imp-${key}" data-key="${key}">${opts(s.map[key])}</select></div></div>`).join('');
    $('#imp-len-unit').value = s.lenUnit; $('#imp-wt-unit').value = s.wtUnit; $('#imp-order').value = s.order;
    $('#imp-kept').checked = !!s.keptCol;
  }
  function buildImport() {
    const s = impState; const m = s.map; const out = []; const skipped = []; let dup = 0;
    const cell = (r, k) => (m[k] != null ? (r[m[k]] || '').trim() : '');
    const label = $('#imp-label').value.trim().slice(0, 40);
    const same = (a, b) => impNorm(a.species) === impNorm(b.species) && Math.abs(a.caughtAt - b.caughtAt) < 60000 && (!a.location || !b.location || distM(a.location, b.location) < 200);
    s.body.forEach((r, i) => {
      const species = impSpecies(cell(r, 'species'));
      const at = parseWhen(cell(r, 'date'), cell(r, 'time'), s.order);
      if (!species || !at) { skipped.push({ row: i + hi(s) + 2, why: !species ? 'no fish' : 'no date' }); return; }
      const lat = impNum(cell(r, 'lat')); const lon = impNum(cell(r, 'lon'));
      const location = lat != null && lon != null && Math.abs(lat) <= 90 && Math.abs(lon) <= 180 && !(lat === 0 && lon === 0) ? { lat, lon, accuracy: null, source: 'import' } : null;
      const cnt = Math.max(1, Math.min(999, Math.round(impNum(cell(r, 'count')) || 1)));
      const info = SPECIES_INFO.get(species) || {};
      const rec = { species, caughtAt: at, count: cnt, bait: cell(r, 'bait').slice(0, 80), lureColor: cell(r, 'lureColor').slice(0, 40), lureSize: cell(r, 'lureSize').slice(0, 40),
        lengthCm: impLength(cell(r, 'length'), s.lenUnit), weightKg: impWeight(cell(r, 'weight'), s.wtUnit), released: impReleased(cell(r, 'released'), s.keptCol),
        notes: cell(r, 'notes').slice(0, 2000), location, spotName: cell(r, 'spot').slice(0, 60), from: (label || cell(r, 'from')).slice(0, 40), kind: info.kind || 'fish' };
      if (catches.some((c) => same(c, rec)) || out.some((c) => same(c, rec) && c.count === rec.count && c.bait === rec.bait)) { dup++; return; }
      out.push(rec);
    });
    return { recs: out, skipped, dup };
  }
  const hi = (s) => s.hiRow || 0;
  function renderImportPreview() {
    const r = buildImport(); impState.built = r;
    const n = r.recs.length; const fish = r.recs.reduce((a, c) => a + c.count, 0);
    const btn = $('#imp-go'); btn.disabled = !n; btn.textContent = n ? `Import ${plural(n, 'catch')}` : 'Nothing to import';
    const needs = IMP_FIELDS.filter(([k, , req]) => req && impState.map[k] == null).map(([, l]) => l.toLowerCase());
    const parts = [];
    if (needs.length) parts.push(`<p class="form-error" style="display:block">Choose the column for ${esc(needs.join(' and '))}.</p>`);
    parts.push(`<p class="help small"><b>${plural(n, 'catch')}</b> ready (${plural(fish, 'fish')})${r.dup ? ` · ${r.dup} already in your log, skipped` : ''}${r.skipped.length ? ` · ${r.skipped.length} row${r.skipped.length === 1 ? '' : 's'} without a ${r.skipped.every((x) => x.why === 'no date') ? 'date' : r.skipped.every((x) => x.why === 'no fish') ? 'fish' : 'fish or date'}, skipped` : ''}.</p>`);
    const fmt = (t) => new Date(t).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
    parts.push('<ul class="lim-list imp-prev">' + r.recs.slice(0, 5).map((c) => `<li><span><b>${c.count > 1 ? c.count + ' × ' : ''}${esc(c.species)}</b><small>${esc([fmt(c.caughtAt), c.bait, U.len(c.lengthCm), U.wt(c.weightKg), c.released === true ? 'released' : c.released === false ? 'kept' : '', c.spotName || (c.location ? 'GPS' : '')].filter(Boolean).join(' · '))}</small></span></li>`).join('') + '</ul>');
    if (n > 5) parts.push(`<p class="help small">…and ${n - 5} more.</p>`);
    const custom = [...new Set(r.recs.map((c) => c.species).filter((x) => !SPECIES_INFO.has(x) && !KNOWN_SPECIES.has(x)))];
    if (custom.length) parts.push(`<p class="help small">Not in the app's fish list, kept as written: ${esc(custom.slice(0, 8).join(', '))}${custom.length > 8 ? '…' : ''}.</p>`);
    $('#imp-preview').innerHTML = parts.join('');
  }
  $('#imp-map').addEventListener('change', (e) => { const k = e.target.dataset.key; if (!k) return; impState.map[k] = e.target.value === '' ? null : Number(e.target.value);
    if (k === 'date') impState.order = dateOrder(impState.body.map((r) => r[impState.map.date])), $('#imp-order').value = impState.order;
    if (k === 'released') { impState.keptCol = impState.map.released != null && /^(kept|harvested)/.test(impNorm(impState.head[impState.map.released])); $('#imp-kept').checked = impState.keptCol; }
    renderImportPreview(); });
  $('#imp-len-unit').addEventListener('change', (e) => { impState.lenUnit = e.target.value; renderImportPreview(); });
  $('#imp-wt-unit').addEventListener('change', (e) => { impState.wtUnit = e.target.value; renderImportPreview(); });
  $('#imp-order').addEventListener('change', (e) => { impState.order = e.target.value; renderImportPreview(); });
  $('#imp-kept').addEventListener('change', (e) => { impState.keptCol = e.target.checked; renderImportPreview(); });
  $('#imp-label').addEventListener('input', () => renderImportPreview());
  $('#imp-go').addEventListener('click', async () => {
    const { recs } = buildImport(); if (!recs.length) return;
    const btn = $('#imp-go'); btn.disabled = true; btn.textContent = 'Importing…';
    const batch = 'imp-' + Date.now(); const now = Date.now(); let newSpots = 0;
    try {
      for (const c of recs) {
        let spotId = null;
        if (c.location) { const ms = matchSpot(c.location); if (ms) spotId = ms.spot.id; }
        if (!spotId && c.spotName) {
          const named = spots.find((sp) => impNorm(sp.name) === impNorm(c.spotName));
          if (named && (!c.location || distM(named, c.location) < 5000)) spotId = named.id;
          else if (c.location) {
            const sp = { id: uid(), name: c.spotName, lat: c.location.lat, lon: c.location.lon, radiusM: 250, notes: 'Added by an import.', createdAt: now, updatedAt: now, imported: batch };
            await DB.putSpot(sp); spots.push(sp); spotId = sp.id; newSpots++;
          }
        }
        const notes = !spotId && c.spotName ? [c.notes, `Spot: ${c.spotName}`].filter(Boolean).join('\n') : c.notes;
        const rec = { id: uid(), createdAt: now, updatedAt: now, caughtAt: c.caughtAt, species: c.species, bait: c.bait, lureColor: c.lureColor, lureSize: c.lureSize,
          lengthCm: c.lengthCm, weightKg: c.weightKg, released: c.released, notes, photo: null, thumb: null, extraPhotos: [], count: c.count,
          location: c.location, weather: null, weatherTries: 0, tide: undefined, marine: undefined, tideTries: 0, spotId, kind: c.kind, imported: batch };
        if (c.from) rec.from = c.from;
        await DB.put(rec);
      }
    } catch (err) { await reload(); btn.disabled = false; return toast('Import stopped: ' + ((err && err.message) || 'storage error')); }
    await reload(); closeSheet(); impState = null;
    toast(`Imported ${plural(recs.length, 'catch')}${newSpots ? `, ${plural(newSpots, 'new spot')}` : ''}`, { label: 'Undo', fn: async () => {
      for (const c of catches.filter((x) => x.imported === batch)) await DB.del(c.id);
      for (const sp of spots.filter((x) => x.imported === batch)) await DB.delSpot(sp.id);
      await reload(); toast('Import undone');
    } });
    // Catches with a place get their weather (and tides by the coast) looked up in the background.
    backfillWeather().then(backfillTides).then(backfillMarine).catch(() => {});
  });
  $('#f-import-log').addEventListener('change', (e) => { const f = e.target.files[0]; e.target.value = ''; openImport(f); });
  // Drop a spreadsheet or backup anywhere on the window (computers, and the Windows app).
  let dragDepth = 0;
  const hasFiles = (e) => e.dataTransfer && [...(e.dataTransfer.types || [])].includes('Files');
  window.addEventListener('dragenter', (e) => { if (!hasFiles(e)) return; e.preventDefault(); dragDepth++; document.body.classList.add('dropping'); });
  window.addEventListener('dragleave', (e) => { if (!hasFiles(e)) return; dragDepth = Math.max(0, dragDepth - 1); if (!dragDepth) document.body.classList.remove('dropping'); });
  window.addEventListener('dragover', (e) => { if (hasFiles(e)) e.preventDefault(); });
  window.addEventListener('drop', (e) => {
    if (!hasFiles(e)) return; e.preventDefault(); dragDepth = 0; document.body.classList.remove('dropping');
    if (e.target.closest && e.target.closest('#sheet-form, #sheet-tackle')) return; // photo drops belong to those forms
    const f = e.dataTransfer.files[0]; if (!f) return;
    if (/\.(csv|tsv|txt|json)$/i.test(f.name) || /csv|json|text\/plain|tab-separated/.test(f.type)) openImport(f);
    else toast('Drop a spreadsheet (.csv) or a Fishamongus! backup (.json) to import it');
  });
  // The Windows app passes a file opened with it (dragged onto the shortcut, or Open with) as ?import=<token>.
  async function importFromLink(token) {
    try {
      const r = await fetch(`/__open/${encodeURIComponent(token)}`); if (!r.ok) throw new Error();
      const name = decodeURIComponent(r.headers.get('X-File-Name') || 'file.csv');
      await openImport(new File([await r.blob()], name));
    } catch { toast("Couldn't open that file"); }
  }

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
  $('#welcome-demo').addEventListener('click', async () => { closeSheet(); updateInstallNudge(); await loadDemo(); refreshNow(true); });
  if (!store('tl.welcomed')) { store('tl.welcomed', '1'); setTimeout(() => openSheet($('#sheet-welcome')), 50); } else updateInstallNudge();

  setSpotsMode(spotsMode); paintOffline();
  reload().then(() => { if (!firstRun) { refreshNow(); return runLinkAction(); } }).then(() => autoBackup()).then(backfillWeather).then(backfillTides).then(backfillMarine).then(backfillFlow).catch((err) => { console.error(err); toast('Storage is unavailable in this browser mode'); });
  if ('serviceWorker' in navigator && window.isSecureContext) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
