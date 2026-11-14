// Runs every test suite and checks its output for the results that must appear.
// Usage: node tests/run.js [suite ...]   (CHROME=/path/to/chrome to use a system Chrome)
// Each suite drives the app in a headless browser with the weather, tide and map services faked,
// so results don't depend on the network or the date.
const { spawnSync } = require('child_process');
const fs = require('fs'), path = require('path'), os = require('os');

const NO_ERRORS = /^errors:? (none|\[\])$/m;
const EXPECT = {
  shell: [
    /^--- fish by default; water near the coast: Fish \/ Both$/m,
    /^shellfish menu: Saltwater: Crab/m,
    /^crab fields: true \| pot fields: true/m,
    /^toast: 3 × Dungeness Crab logged/m,
    /^form remembers shellfish: Shellfish$/m,
    /^crab hint: This crab can't be kept/m,
    /^confirm: This Dungeness Crab can't be kept/m,
    /^manila -> kind: Shellfish \| safety: true/m,
    /^back to fish -> species cleared: "" \| size row: true/m,
    /^butter kept hint: Kept today: 39 of 40 clams/m,
    /^now kept line: Kept today: Dungeness Crab 3 of 5 · clams 39 of 40$/m,
    /^pot card: Catch per pot-hour/m,
    /^crc card: Catch record card/m,
    /^trip cards: .*Tides.*Shellfish safety.*Regulations/m,
    /^clam box: Clam tides/m,
    NO_ERRORS,
  ],
  now: [
    /^active view: view-now \| tab: now$/m,
    /^cond: Where you are.*Weather.*Tide.*Moon.*Sunrise/m,
    /^summary: 📍 GPS .* \| panel hidden: true/m,
    /^after combo tap: species Calico Bass \(Kelp Bass\) \| bait Curly-tail grub$/m,
    /^toast: Session started with Live bait$/m,
    /^quick catch saved: California Halibut Live bait \| has location: true \| weather: true \| sessionId: true$/m,
    /^session lures: Live bait → Curly-tail grub → Live bait$/m,
    /^after reload, session still live: true/m,
    /^end toast: 2 h 00 min · 2 fish · 1 per hour/m,
    /^stats card: Fish per hour/m,
    /^toast: Session discarded – under 5 minutes and no fish \| sessions in db: 1$/m,
    /^msg: No signal – showing conditions from/m,
    /^backup version \d+ \| sessions 1$/m,
    NO_ERRORS,
  ],
  spots: [
    /^toast: North cove dock saved · linked 4 catches$/m,
    /^auto spot: North cove dock – here/m,
    /^no-name error: Give the new spot a name\.$/m,
    /^after delete spots: \[ 'North cove dock', 'Upper creek' \] \| sheets open: 0$/m,
    /^backup spots: \[ 'North cove dock', 'Upper creek' \] catches: 7$/m,
    /^csv: ﻿?Date,Time,Spot,Species,Count/m,
    /^restore toast: Restored 7 catches, 2 spots$/m,
    /^upgrade from v1: \[ 'Walleye' \]$/m,
    NO_ERRORS,
  ],
  maploc: [
    /^dot: \[\{"c":\[34\.0105,-118\.497\]/m,
    /^message covering map: hidden$/m,
    /^locate button visible: true$/m,
    /^last view: \{"c":\[34\.035,-118\.47\],"z":15\}/m,
    /^views: \[\{"c":\[39\.5,-98\.35\],"z":4\}\] \| dot drawn: 2$/m,
    NO_ERRORS,
  ],
  f49: [/^ALL PASSED$/m],
  stats: [
    /^empty: No stats yet/m,
    /^readout: Senko in Partly cloudy: 3 catches/m,
    /^pressure -> Rising Senko 3 of 9/m,
    /^bass tiles: +13Fish/m,
    /^metric temp cols: 7 Lure Below 10°C/m,
    /^page width: 390$/m,
    NO_ERRORS,
  ],
  edge: [/ 0 page errors;/],
};

const only = process.argv.slice(2);
const suites = Object.keys(EXPECT).filter((s) => !only.length || only.includes(s));
const outRoot = process.env.OUT || fs.mkdtempSync(path.join(os.tmpdir(), 'fishamongus-tests-'));
let failed = 0;
for (const s of suites) {
  const dir = path.join(outRoot, s); fs.mkdirSync(dir, { recursive: true });
  const t0 = Date.now();
  const r = spawnSync(process.execPath, [path.join(__dirname, s + '.js')], { cwd: dir, env: { ...process.env, OUT: dir }, encoding: 'utf8', timeout: 300000 });
  const out = (r.stdout || '') + (r.stderr || '');
  fs.writeFileSync(path.join(dir, 'output.txt'), out);
  const missing = EXPECT[s].filter((re) => !re.test(out));
  const ok = r.status === 0 && !missing.length;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${s} (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
  if (!ok) {
    failed++;
    if (r.status !== 0) console.log(`  exited with ${r.status ?? r.signal}`);
    for (const re of missing) console.log(`  missing: ${re}`);
    console.log(out.split('\n').map((l) => '  | ' + l.slice(0, 300)).join('\n'));
  }
}
console.log(failed ? `${failed} of ${suites.length} suites FAILED` : `All ${suites.length} suites passed`);
process.exit(failed ? 1 : 0);
