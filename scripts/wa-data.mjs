// Fishamongus! Washington data job. Runs on a schedule in GitHub Actions (see .github/workflows/wa-data.yml).
// Reads WDFW's emergency fishing and shellfishing rules and the catchable trout stocking report, and writes
//   data/wa-rules.json     rules currently in effect (and coming up), with marine areas, species groups and waters
//   data/wa-stocking.json  trout plants from the last 60 days
//   data/wa-status.json    when each source was last checked, and whether the check worked
// If a page can't be read, or the parse suddenly finds nothing, the previous data is kept and the status says so,
// so the app shows "Couldn't verify – check WDFW" instead of quietly showing old data. The job then fails, so GitHub emails the owner.
// No dependencies: Node 20+ (global fetch).
import { readFile, writeFile, mkdir } from 'node:fs/promises';

const BASE = process.env.WDFW_BASE || 'https://wdfw.wa.gov';
const OUT = process.env.OUT_DIR || 'data';
const UA = 'Fishamongus-data/1.0 (+https://krazow.github.io/fishamongus/; personal fishing log)';
const DAY = 86400000;
const now = Date.now();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function get(url) {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'text/html' } });
      if (r.ok) return await r.text();
      if (r.status === 404) throw new Error('404 ' + url);
    } catch (e) { if (i === 2 || /^404/.test(e.message)) throw e; }
    await sleep(1500 * (i + 1));
  }
  throw new Error('failed ' + url);
}
const readJSON = async (f, d) => { try { return JSON.parse(await readFile(`${OUT}/${f}`, 'utf8')); } catch { return d; } };
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', hellip: '…' };
const decode = (s) => s.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e) => (e[0] === '#' ? String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : Number(e.slice(1))) : ENT[e.toLowerCase()] ?? m));
const textOf = (html) => decode(html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<br\s*\/?>|<\/?(p|div|li|h\d|tr|dt|dd)\b[^>]*>/gi, '\n').replace(/<[^>]+>/g, ' ')).replace(/[ \t ]+/g, ' ').replace(/\s*\n\s*/g, '\n').trim();

// ---------- dates
const MONTHS = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, sept: 8, oct: 9, nov: 10, dec: 11 };
const DATE_RE = /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sept?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s*(\d{4}))?/gi;
function dates(text, yearHint) {
  const out = []; let m; DATE_RE.lastIndex = 0;
  while ((m = DATE_RE.exec(text))) { const mo = MONTHS[m[1].toLowerCase().slice(0, m[1].toLowerCase().startsWith('sept') ? 4 : 3)]; out.push({ mo, d: Number(m[2]), y: m[3] ? Number(m[3]) : null, at: m.index }); }
  // years carry backwards (June 22 through June 30, 2019) and forwards
  for (let i = out.length - 1; i >= 0; i--) if (out[i].y == null) out[i].y = (out[i + 1] && out[i + 1].y) || yearHint;
  return out.map((x) => ({ ...x, ms: new Date(x.y, x.mo, x.d).getTime() }));
}
// "Effective date: May 15, 2025, until further notice." / "June 22 through June 30, 2019." / "Immediately through June 30, 2019."
function effective(text, posted) {
  const y = new Date(posted || now).getFullYear();
  const ds = dates(text || '', y);
  const open = /until further notice|until rescinded|until changed/i.test(text || '');
  const immediate = /immediately/i.test(text || '');
  let start = ds[0] ? ds[0].ms : null; let end = null;
  if (immediate && (!ds[0] || /immediately\s+(through|until|to)/i.test(text))) { start = posted || now; end = ds[0] ? ds[0].ms + DAY - 1 : null; }
  else if (ds[1]) end = ds[1].ms + DAY - 1;
  else if (ds[0] && !open && /\bonly\b|one day|\bon\b/i.test(text)) end = ds[0].ms + DAY - 1;
  if (start && end && end < start) end += 365 * DAY; // "Dec 1 through Jan 15"
  return { start, end: open ? null : end, untilFurtherNotice: open };
}

// ---------- tags
function marineAreas(text) {
  const out = new Set(); const t = (text || '').replace(/–|—/g, '-');
  const re = /marine (?:catch )?(?:record card )?areas?\s+((?:\d{1,2}(?:-\d)?)(?:\s*(?:,|and|through|to|-|&)\s*(?:\d{1,2}(?:-\d)?))*)/gi; let m;
  while ((m = re.exec(t))) {
    const part = m[1].replace(/\s+/g, ' ');
    const rng = part.match(/^(\d{1,2})\s*(?:through|to|-)\s*(\d{1,2})$/i);
    if (rng && Number(rng[2]) > Number(rng[1]) && !/^\d-\d$/.test(part.replace(/\s/g, ''))) { for (let i = Number(rng[1]); i <= Number(rng[2]); i++) out.add(String(i)); continue; }
    part.split(/\s*(?:,|and|&)\s*/).forEach((p) => { const r2 = p.match(/^(\d{1,2})\s*(?:through|to)\s*(\d{1,2})$/i); if (r2) { for (let i = Number(r2[1]); i <= Number(r2[2]); i++) out.add(String(i)); } else if (/^\d{1,2}(-\d)?$/.test(p.trim())) out.add(p.trim()); });
  }
  const named = { 'puget sound': [], 'hood canal': ['12'], 'south puget sound': ['13'], 'san juan islands': ['7'], 'tacoma-vashon': ['11'], 'seattle/bremerton': ['10'], 'admiralty inlet': ['9'], 'neah bay': ['4'], 'la push': ['3'], 'westport': ['2'], 'ilwaco': ['1'], 'sekiu': ['5'], 'port angeles': ['6'] };
  for (const [k, v] of Object.entries(named)) if (t.toLowerCase().includes(k)) v.forEach((a) => out.add(a));
  return [...out].sort((a, b) => parseFloat(a) - parseFloat(b));
}
const GROUPS = [
  ['Razor clams', /razor clam/i], ['Clams', /\bclams?\b|geoduck|cockle/i], ['Oysters', /oyster/i], ['Crab', /\bcrab/i], ['Shrimp', /shrimp|prawn/i], ['Octopus/Squid', /octopus|squid/i],
  ['Salmon', /salmon|chinook|coho|sockeye|chum\b|pink\b|kokanee/i], ['Steelhead', /steelhead/i], ['Sturgeon', /sturgeon/i], ['Halibut', /halibut/i], ['Lingcod', /lingcod/i],
  ['Rockfish', /rockfish/i], ['Bottomfish', /bottomfish|groundfish|cabezon|greenling|sole\b|flounder/i], ['Tuna', /tuna|mackerel/i], ['Trout', /\btrout\b|cutthroat|char\b|bull trout|dolly/i],
  ['Bass', /\bbass\b/i], ['Walleye', /walleye/i], ['Shad', /\bshad\b/i], ['Smelt', /smelt|eulachon/i], ['Other', /all species|game fish|all fishing|fishing closed|closes? (to )?(all )?fishing/i],
];
const groupsOf = (text) => { const g = GROUPS.filter(([, re]) => re.test(text || '')).map(([x]) => x); return g.includes('Razor clams') && !/other clams|clams other|hardshell|littleneck|manila|butter clam/i.test(text || '') ? g.filter((x) => x !== 'Clams') : g; };
function waters(text) {
  const out = new Set(); const t = (text || '').replace(/\s+/g, ' ');
  const re = /\b((?:North|South|East|West|Middle|Upper|Lower|Little|Big|Fork of the |[A-Z][a-z]+\.? ?){1,4})(River|Creek|Lake|Reservoir|Pond|Slough|Bay|Inlet|Canal|Harbor)\b|\b(Lake|Lk\.?) ([A-Z][a-z]+(?: [A-Z][a-z]+)?)/g; let m;
  while ((m = re.exec(t))) { const n = (m[3] ? `Lake ${m[4]}` : `${m[1].trim()} ${m[2]}`).replace(/^(The|And|To|In|On|Of|For|At) /, ''); if (n.length > 5 && !/^(Marine|Puget|Washington|Columbia Basin)$/.test(n.split(' ')[0])) out.add(n); }
  return [...out].slice(0, 12);
}
const kindOf = (action, title) => { const t = `${action} ${title}`.toLowerCase();
  if (/\b(close|closes|closed|closure|remain closed|not open|will not open)\b/.test(t) && !/\breopen/.test(t)) return 'closed';
  if (/\b(open|opens|reopen|reopens|approved|dig)\b/.test(t)) return 'open'; return 'changed'; };

// ---------- emergency rules
function ruleLinks(html) {
  const out = new Map(); const re = /<a[^>]+href="((?:https?:\/\/wdfw\.wa\.gov)?\/fishing\/regulations\/emergency-rules\/([a-z0-9-]+))"[^>]*>([\s\S]*?)<\/a>/gi; let m;
  while ((m = re.exec(html))) { const slug = m[2]; if (slug === 'search' || out.has(slug)) continue; const title = textOf(m[3]); if (title.length < 6) continue;
    const after = textOf(html.slice(m.index + m[0].length, m.index + m[0].length + 400)); const dr = after.match(/^[\s–-]*([A-Z][a-z]{2} \d{1,2}, \d{4})\s*to\s*([A-Z][a-z]{2} \d{1,2}, \d{4})?/);
    out.set(slug, { slug, title, url: BASE + '/fishing/regulations/emergency-rules/' + slug, listFrom: dr ? dr[1] : null, listTo: dr ? dr[2] || null : null }); }
  return [...out.values()];
}
const FIELD_NAMES = ['Action', 'Effective dates?', 'Species affected', 'Locations?', 'Rule', 'Reason for (?:action|rule)', 'Additional information', 'Other information', 'Information contact'];
function fields(text) {
  const out = {}; const all = new RegExp(`(?:^|\\n)\\s*(${FIELD_NAMES.join('|')})\\s*:\\s*`, 'gi'); const hits = []; let m;
  while ((m = all.exec(text))) hits.push({ name: m[1].toLowerCase(), start: m.index + m[0].length, at: m.index });
  hits.forEach((h, i) => { const v = text.slice(h.start, i + 1 < hits.length ? hits[i + 1].at : h.start + 1200).trim().replace(/\n+/g, ' ');
    const key = h.name.startsWith('effective') ? 'effective' : h.name.startsWith('species') ? 'species' : h.name.startsWith('location') ? 'location' : h.name.startsWith('reason') ? 'reason' : h.name.startsWith('rule') ? 'rule' : h.name.startsWith('action') ? 'action' : null;
    if (key && !out[key]) out[key] = v.slice(0, 900); });
  return out;
}
function parseRule(link, html) {
  const text = textOf(html);
  const h1 = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1]; const title = h1 ? textOf(h1) : link.title;
  const f = fields(text);
  const postedM = text.match(/\b([A-Z][a-z]+ \d{1,2}, \d{4})\b/); const posted = postedM ? Date.parse(postedM[1]) || null : null;
  const eff = effective(f.effective || `${link.listFrom || ''}${link.listTo ? ' through ' + link.listTo : ''}`, posted);
  if (!eff.start && link.listFrom) eff.start = Date.parse(link.listFrom) || null;
  if (!eff.end && link.listTo && !eff.untilFurtherNotice) eff.end = (Date.parse(link.listTo) || 0) + DAY - 1 || null;
  const where = `${title} ${f.location || ''}`; const what = `${title} ${f.species || ''} ${f.action || ''}`;
  return { id: link.slug, url: link.url, title, posted, action: f.action || null, species: f.species || null, location: f.location || null, rule: f.rule || null, reason: f.reason || null,
    start: eff.start, end: eff.end, untilFurtherNotice: eff.untilFurtherNotice, kind: kindOf(f.action || '', title),
    areas: marineAreas(where), groups: groupsOf(what), waters: waters(where), salt: /marine area|puget sound|hood canal|coast|ocean|strait|bay\b/i.test(where), fetchedAt: now };
}
async function rules(prev) {
  const old = new Map((prev.rules || []).map((r) => [r.id, r]));
  const links = new Map();
  for (let p = 0; p < 8; p++) {
    const html = await get(`${BASE}/fishing/regulations/emergency-rules${p ? `?page=${p}` : ''}`);
    const ls = ruleLinks(html); let added = 0; ls.forEach((l) => { if (!links.has(l.slug)) { links.set(l.slug, l); added++; } });
    if (!added || !/[?&]page=/.test(html)) break;
  }
  if (!links.size) throw new Error('no rules found on the current-rules page (page layout may have changed)');
  const out = [];
  for (const l of links.values()) {
    const o = old.get(l.slug);
    if (o && now - (o.fetchedAt || 0) < DAY && o.title === l.title) { out.push(o); continue; }
    try { out.push(parseRule(l, await get(l.url))); await sleep(400); } catch (e) { if (o) out.push(o); else out.push({ id: l.slug, url: l.url, title: l.title, kind: kindOf('', l.title), areas: marineAreas(l.title), groups: groupsOf(l.title), waters: waters(l.title), start: Date.parse(l.listFrom) || null, end: l.listTo ? Date.parse(l.listTo) + DAY - 1 : null, partial: true, fetchedAt: now }); }
  }
  const parsedOk = out.filter((r) => r.action || r.rule || r.species).length;
  if (out.length >= 3 && parsedOk === 0) throw new Error(`found ${out.length} rules but could not read any rule details (page layout may have changed)`);
  const prevIds = new Set(old.keys());
  return { rules: out.sort((a, b) => (b.start || 0) - (a.start || 0)), added: out.filter((r) => !prevIds.has(r.id)).map((r) => r.id), removed: [...prevIds].filter((id) => !links.has(id)) };
}

// ---------- trout stocking
const ABBR = { LK: 'Lake', LKS: 'Lakes', PD: 'Pond', PDS: 'Ponds', CR: 'Creek', RES: 'Reservoir', R: 'River', SL: 'Slough', N: 'North', S: 'South', E: 'East', W: 'West', LTL: 'Little', MT: 'Mount', PRK: 'Park', CO: 'County' };
const tidyLake = (n) => n.replace(/\s*\(([A-Z/]+)\)\s*$/, '').split(/\s+/).map((w) => ABBR[w.replace(/[.,]/g, '')] || (w.length <= 2 && /^[A-Z]+$/.test(w) ? w : w.charAt(0) + w.slice(1).toLowerCase())).join(' ').replace(/^(.*) Lake$/, (m, a) => (/\bLake\b/.test(a) ? m : m));
function stockingRows(html) {
  const out = []; const rows = html.split(/<tr[\s>]/i).slice(1);
  for (const r of rows) {
    const cells = r.split(/<\/t[dh]>/i).map((c) => textOf(c)).filter((c, i, a) => i < a.length - 1);
    if (cells.length < 4) continue;
    const lakeCell = cells[0].split('\n'); const raw = lakeCell[0].trim(); const cr = (lakeCell[1] || '').match(/^(.+?)\s*-\s*Region\s*(\d)/i);
    const date = Date.parse(cells[1]); const number = Number(String(cells[3]).replace(/[^\d]/g, ''));
    if (!raw || !Number.isFinite(date) || !number) continue;
    out.push({ lake: tidyLake(raw), raw, county: cr ? cr[1].trim() : ((raw.match(/\(([A-Z]{4})/) || [])[1] || null), region: cr ? Number(cr[2]) : null, date, species: cells[2], number, perLb: Number(cells[4]) || null, hatchery: cells[5] || null, notes: cells[6] || null });
  }
  return out;
}
async function stocking(prev) {
  const html = await get(`${BASE}/fishing/reports/stocking/trout-plants`);
  const rows = stockingRows(html);
  if (!rows.length && (prev.plants || []).length) throw new Error('no rows found on the trout stocking page (page layout may have changed)');
  const key = (x) => `${x.raw}|${x.date}|${x.species}|${x.number}`;
  const merged = new Map((prev.plants || []).filter((x) => now - x.date < 60 * DAY).map((x) => [key(x), x])); rows.forEach((x) => merged.set(key(x), x));
  return [...merged.values()].sort((a, b) => b.date - a.date);
}

// ---------- run
// Files are only rewritten when something changed, or every 3 hours to show the check is still running,
// so the repository (and the GitHub Pages site) isn't rebuilt every half hour for nothing.
const strip = (o) => JSON.stringify(o, (k, v) => (k === 'updated' || k === 'fetchedAt' ? undefined : v));
const KEEPALIVE = 3 * 3600000;
await mkdir(OUT, { recursive: true });
const status = await readJSON('wa-status.json', {});
const before = JSON.stringify(status);
const failed = [];
const prevRules = await readJSON('wa-rules.json', { rules: [] });
try {
  const r = await rules(prevRules);
  const next = { updated: now, source: `${BASE}/fishing/regulations/emergency-rules`, rules: r.rules };
  const changed = strip(next) !== strip(prevRules);
  if (changed) await writeFile(`${OUT}/wa-rules.json`, JSON.stringify(next, null, 1));
  if (changed || !status.rules || !status.rules.ok || now - (status.rules.checked || 0) > KEEPALIVE) status.rules = { ok: true, checked: now, count: r.rules.length, added: r.added, removed: r.removed };
  if (r.added.length || r.removed.length) status.rulesChanged = now;
} catch (e) { status.rules = { ...(status.rules || {}), ok: false, checked: now, error: e.message }; failed.push('rules: ' + e.message); }
const prevStock = await readJSON('wa-stocking.json', { plants: [] });
try {
  const plants = await stocking(prevStock);
  const next = { updated: now, source: `${BASE}/fishing/reports/stocking/trout-plants`, plants };
  const changed = strip(next) !== strip(prevStock);
  if (changed) await writeFile(`${OUT}/wa-stocking.json`, JSON.stringify(next, null, 1));
  if (changed || !status.stocking || !status.stocking.ok || now - (status.stocking.checked || 0) > KEEPALIVE) status.stocking = { ok: true, checked: now, count: plants.length };
} catch (e) { status.stocking = { ...(status.stocking || {}), ok: false, checked: now, error: e.message }; failed.push('stocking: ' + e.message); }
if (JSON.stringify(status) !== before) await writeFile(`${OUT}/wa-status.json`, JSON.stringify(status, null, 1));
console.log(JSON.stringify(status));
if (failed.length) { console.error('FAILED: ' + failed.join(' | ')); process.exitCode = 1; }
