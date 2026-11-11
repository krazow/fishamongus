# Fishamongus! – Catch Log

**[Watch the 2½-minute video tour](https://krazow.github.io/fishamongus/demo/)**

A phone app (installable web app) for logging fish you catch. Each catch records:

- **GPS coordinates** from your phone, with accuracy (or type coordinates in by hand)
- **Weather at that spot**: temperature, feels-like, sky, wind speed/direction/gusts, barometric pressure and whether it's rising or falling, humidity, cloud cover, rain, plus the moon phase
- **Lure or bait** used
- **Fish type**, picked from a dropdown of about 140 common recreational species grouped by family and water type (freshwater bass, trout & char, panfish, catfish, Pacific coast, inshore, reef, offshore and more). Use "Other" to type one that isn't listed; it's added to the dropdown under "Your other species".
- **Photo** (take one with the camera or choose from your photos)
- Optional length, weight, released yes/no and notes

**New in 4.0: shellfish.** Above the species list, **Fish / Shellfish** and **Freshwater / Saltwater / Both** buttons filter the list. Water is set from your spot or the distance to the nearest tide station. The shellfish list has crab, shrimp and prawns, clams, oysters, mussels, scallops, lobster, squid and octopus, plus crayfish for freshwater. For shellfish:

- the lure menu becomes **gear** (crab pot, ring net, snare, shrimp pot, clam gun, shovel, rake and more), with an optional bait;
- crab catches record **sex**, **hard or soft shell** and **carapace width**, and pots record **how many** and the **soak time**;
- **Limits → Add Puget Sound crab limits (WDFW)** sets 5 Dungeness (males only, hard shell, at least 6¼ in) and 6 red rock crab (at least 5 in). The form warns before you keep a crab that breaks a rule;
- **Limits → Add Washington clam & oyster limits (WDFW)** sets the 2026 statewide limits: 40 clams of all kinds combined (up to 10 lb; Manila, littleneck and butter at least 1½ in, cockles at least 2½ in), the first 7 horse clams and the first geoduck dug, 15 razor clams, and 18 Pacific oysters (at least 2½ in, shucked on the beach). Clams count together toward the 40;
- clams, oysters, mussels and scallops show a reminder to check the Department of Health **Shellfish Safety Map** for biotoxin closures;
- **Stats** gets a **Fish / Shellfish / All** bar, **catch per pot-hour** by gear and bait, and a **catch record card** count of kept Dungeness for the summer and winter cards;
- **trips** have a type: fishing, crabbing, clamming & oysters, or shrimping. Each type gets its own gear checklist. Clamming trips list **daylight minus tides** for the next two weeks, and the **Tides** screen has a **Best clam tides** card. Trips in Washington link to WDFW rules and the Shellfish Safety Map.

Rules change during the year and some areas close (South Puget Sound, Marine Area 13, is currently closed to crabbing). Always check WDFW before you go.

The **Now** screen opens first. It shows:

- **Start fishing / End session.** Tap when your line goes in and again when you're done. While a session runs, the screen shows the time, the fish so far, fish per hour, the spot, and the lure **on your line**. Tap the lure to change it whenever you switch. Logging a catch on a different lure also counts as a switch. A bar above the tabs keeps the session visible on every other screen. A session left running over 12 hours ends 30 minutes after your last catch, a session under 5 minutes with no fish is thrown away, and **Undo** reopens a session you ended by mistake.
- **Quick catch:** large buttons for your three most recent fish-and-lure pairs (the lure on your line first). One tap saves the catch with GPS, weather, tide and spot, and **Add details** in the message lets you add a photo or size later.
- **Conditions here:** your spot (or the nearest one), weather, wind, pressure trend, tide stage with the next high or low and the coefficient, moon, next sunrise or sunset, and water temperature and waves on the coast. Without signal it shows the last conditions with their time.
- **Lures for right now:** the lures that caught the most fish for you in conditions like the next three hours, with the reasons. During a session, **Use** puts that lure on your line.
- **Trips:** your next planned trip, **+ Plan a trip** and **All trips**.

The **Spots** tab keeps your fishing places:

- **Saved spots** each have a name, a location and private notes (access, parking, structure, hazards). You also set how close a catch must be to count, from 330 ft (a dock) to 1.2 mi (a whole small lake).
- **Automatic linking:** when you log a catch inside a spot's range, it's filled in for you. You can change it, or choose **+ New spot here…** to save a new place right from the catch form. Creating a spot also links any earlier catches you made there. A catch that already has a location can be turned into a spot with **Save this location as a spot**.
- **Analysis for each spot:** catches, days with fish, species, biggest fish, which lures work there, the most common conditions when you caught fish there, and recent catches. **Best lure by conditions here** opens the Stats tab filtered to that spot.
- A **map** of all your spots (with their ranges) and catches, and **Directions in Maps** for each spot. A blue dot shows where you are, and the ◎ button centres the map on you. Before you've saved anything, the map opens on your location instead of the whole country. Tap anywhere on the map to make a new spot there or plan a trip there. Map areas you've looked at while online stay available with no signal.
- A **Tides** button on the map finds the nearest NOAA tide station to the middle of the map. It shows:
  - Whether the tide is rising or falling now, and when the next high or low comes.
  - Today's tide curve (tap it to read any time).
  - Highs and lows for today and tomorrow.
  - An estimated **tidal coefficient** for today and the next 7 days, with the next spring tides.
  - You can switch between the 5 nearest stations. NOAA covers US coasts only; for inland water the app warns that the nearest station is far away. Saltwater spots also have a **Tides at this spot** button.
  - NOAA doesn't publish a tidal coefficient, so the app estimates one: 70 × today's range ÷ the average daily range over the surrounding month. About 45 means neap tides, 70 an average day and 95 spring tides.
- Deleting a spot keeps its catches; they just no longer have a spot.

**Trips** (from the Now screen) plans a fishing trip. Pick a saved spot (or your location or coordinates), a date, start and end times, and your target species. The trip plan shows:

- **Hour by hour:** the forecast for each hour of the trip (sky, temperature, wind, chance of rain), up to 16 days ahead. ★ marks the **best hours**: the ones whose conditions best match when you've caught fish at that spot (or nearby, or anywhere, when the spot has fewer than 5 catches).
- **Sun and moon:** first light, sunrise, sunset, last light and the moon phase. These are calculated on the phone, so they work offline.
- **Tides** (saltwater and coastal spots): the NOAA tide curve for the day with your trip shaded, highs and lows, and the tidal coefficient.
- **Lures to bring:** the lures that caught the most fish in conditions like the trip's, with the reasons ("Rising tide · 5 fish").
- **Target species:** how many you've caught there and nearby, and the best lures for them.
- **Gear checklist:** a starter packing list you can tick off and edit, plus suggestions for the trip, such as your best lures, a rain jacket if rain is likely, or a headlamp if you start before sunrise.
- **Regulations:** a reminder to carry your license and check limits and closures, with links to California's rules (CDFW) and to every state's licenses and rules.
- **Add to calendar** saves the trip to your phone's calendar with two reminders: the evening before and an hour before. On the day before a trip, the Now screen also shows it with the latest forecast.
- **Share plan** sends the date, best hours, forecast, tides, lures and gear list to your fishing partners, and **Directions** opens Maps.
- **After the trip:** catches logged during the trip near that place are linked automatically. The trip shows a summary (fish, fish per hour, top lure) and compares the forecast with the actual weather. Stats gains a **Trips** card with your overall fish per hour.

The forecast and tides refresh when you open an upcoming trip, and the last copy is kept on the phone for use with no signal.

The **Stats** tab shows:

- **Best lure by conditions:** pick sky, pressure trend, air temperature, wind, time of day or moon phase. You see the lure that caught the most fish in each condition, plus a grid of every lure against every condition. Tap any square for its numbers.
- **When you catch the most:** the condition that shows up most often across your catches, one card per condition.
- **Personal bests** for each species, and totals by species and by lure.
- **Filters** for time range (30 days, 90 days, this year, 12 months, all time), a single species and a single spot.

Most stats count fish caught, so lures you use most naturally rank higher. **Fish per hour** fixes that for time you tracked with **Start fishing**: hours fished, overall fish per hour, and fish per hour for each lure that was in the water at least 30 minutes, including lures that caught nothing.

**Quick logging:**
- The catch form's **Save catch** button sits at the bottom, under your thumb. Quick-pick buttons are large, and **Same as a recent catch** fills the fish, lure, colour and size in one tap. During a session the lure on your line is filled in for you.
- Location, weather and tide are folded into one line (for example "📍 Santa Monica Pier · ⛅ 63°F · ↓ falling tide"). Tap it for the details, to refresh GPS or to type coordinates. It opens by itself if the GPS fails.
- After saving, tap **Log another** in the message at the bottom, or **Same again** on a catch's page. The fish, lure and spot are filled in for you.
- **How many fish?** logs several identical fish as one entry. Stats count every fish.
- The lure is picked from a grouped list (soft plastics, hard baits, jigs, saltwater lures, flies, live bait, prepared bait), with optional colour and size. Choose **Other** to type your own.
- A catch can have several photos. Tap a photo to see it full screen and swipe between them.
- Deleted a catch by mistake? Tap **Undo** in the message that appears.

**Finding catches:** the Log can be filtered by date, spot and species as well as searched. Catches are grouped by day, with the trip they belong to.

**Logging a catch later from a photo:** when you add a photo that was taken earlier, the app reads when (and, if the photo has it, where) it was taken and offers to use that time and place, so the weather, tide and spot match the moment you caught the fish. Some phones remove the location when a photo is shared with a website; then only the time is offered.

**Released or kept:** choose Released or Kept for each catch (tap again to leave it unrecorded). The app remembers your last choice, and Stats counts only catches where you recorded it.

**Tides on each catch:** near the coast, each catch also records the water temperature and waves (from Open-Meteo Marine) and the tide from the nearest NOAA station: the stage (low slack, rising, high slack, falling), the height, the time since the last high or low, the next turn, and the tidal coefficient. Tides appear in the catch form, on the catch's page, in Stats ("Tide" and "Tide strength" in *Best lure by conditions* and *When you catch the most*), on each spot's *Best conditions here*, and in the spreadsheet export. Catches logged earlier, or with no signal, get their tide filled in automatically when the app is online.

Tides show only where they apply:
- **Automatic** (the default): within about 15 mi of a NOAA tide station.
- **Saltwater spot:** always.
- **Freshwater spot:** never. Use this for lakes and rivers near the coast.

**New in 3.3: fish organised by type**
- The main fish menu now lists fish *types*, under Freshwater and Saltwater: Bass, Trout & char, Salmon, Sunfish & bream, Crappie, Perch, Walleye & sauger, Pike, muskie & pickerel, Catfish, Bullhead, Carp, Gar, Sturgeon and more; Saltwater bass, Drum & croaker, Halibut & flounder, Snapper, Grouper, Tuna, Billfish and more. One-of-a-kind fish such as Bowfin, Burbot and Cobia are listed on their own.
- Choosing a type opens a second menu with every kind of it, in sections for big types. **Bass** holds all the freshwater bass: black bass (Largemouth, Smallmouth, Spotted and the rest), striped and white bass (including Wiper and Sunshine Bass), rock bass and peacock bass.
- You choose the exact fish, or **Not sure which** to save just the type. Search still finds any fish by name and sets both menus.

**New in 3.2: a much bigger fish list, with subspecies and search**
- About 250 species: 177 freshwater fish from lakes and rivers across the US and Canada (black bass, temperate bass, trout and char, salmon and whitefish, panfish and sunfish, walleye, perch and pike, catfish and bullheads, carp and buffalo, suckers and redhorse, minnows and chubs, gar, sturgeon and bowfin, shad and mooneye, and invasive species), plus the saltwater list.
- **Two-level picker:** the main menu lists primary species. Fish marked ▸ have subspecies or close variants, which appear in a second menu: for example Cutthroat Trout → Westslope, Yellowstone, Lahontan and more; Redeye Bass → Bartram's, Altamaha, Cahaba, Chattahoochee, Tallapoosa and Warrior Bass; Rainbow Trout → Steelhead, Redband and Golden Trout; Largemouth Bass → Florida Bass; plus hybrids such as Wiper, Saugeye, Tiger Muskie, Tiger Trout and Splake. "Any / not sure" records just the primary species.
- **Search:** type part of a name ("cutthroat", "gar", "red horse") above the menu and tap a result. A subspecies sets both menus.
- Catches you've already logged keep their exact names.

**New in 3.1:**
- **Bite times (solunar):** the Now screen shows today's major periods (2 hours around the moon overhead and underfoot) and minor periods (1 hour around moonrise and moonset) on a 24-hour strip, with what's on now or next and a day rating (Fair to Best: best near new and full moon, better when a period lines up with sunrise or sunset). Trip plans show the periods that fall inside the trip. Stats has a **Solunar** condition, so you can see whether these periods actually work for you. Everything is calculated on the phone and works offline; moon times match published tables to within a couple of minutes.
- **Automatic backup** (Settings → Backup): after each fishing session, once a day or once a week, whenever something has changed.
  - **Chrome on a computer, and Android phones that support it:** choose a backup file once (a synced folder such as Google Drive is best) and the app rewrites it on schedule with no taps. If the browser has forgotten its permission, the reminder appears and one tap updates the file.
  - **iPhone and other browsers:** web apps can't write to iCloud by themselves, so when a backup is due the Now screen shows a reminder. One tap opens the share sheet: choose **Save to Files → iCloud Drive**.
  - Sample data is never backed up and never makes a backup due.

**New in 3.0:**
- **What your log says:** the top of Stats sums up your log in plain sentences, each with the number of fish behind it. For example: "Curly-tail grub caught 8 of your 13 fish around the new moon", your best time of day, your fastest lure per hour, and how the last 30 days compare with the 30 before.
- **Personal-best moments:** when a catch beats your heaviest (or, without a weight, longest) fish of that species, a gold message says so and the phone buzzes. Estimated weights don't count.
- **My tackle box** (Settings): save the lures you own, with type, name, colour, size and a photo. They appear as one-tap picks in the catch form, and Stats shows how many fish each one caught.
- **Map:** nearby catches merge into a numbered pin that zooms in when tapped. Spots are coloured orange for fish in the last 30 days, teal for 31–90 days and grey for older or none, on the map and in the Spots list. A menu shows one species at a time.
- **Night mode and large text** (Settings → Display): a dim red screen that doesn't spoil your night vision, and 15% larger text everywhere.
- **Daily bag limits** (Settings): set a limit per species. The catch form shows "Kept today: 2 of 5", the Now screen shows what you've kept today, and the app asks before saving a fish over the limit. Limits differ by place and season, so check your state's rules.
- **No-signal banner:** one line at the top when the phone is offline.
- **Swipe a catch** in the Log to the left for Edit, Same again and Delete.
- **Weight from length:** for 12 common freshwater species, entering a length offers the weight of a typical fish that long (standard weight equations, Anderson & Neumann 1996). It's saved as an estimate and shown as "≈" on the catch's page.
- **Sample data:** "Look around with sample data first" on the welcome screen, or "Try it with sample data" on an empty log, loads a month of example fishing. A banner clears it in one tap and leaves anything you logged yourself. Sample data is never included in backups.
- Screen-reader labels on every field and button.

**Collapsible sections:** on the Now screen, Stats, a spot's page, a trip plan, the tides panel and a catch's page, tap a section's header to fold it away or open it again. The app remembers what you folded. Long or less-used sections start folded: Catches by species, Top lures and Trips in Stats; Species here on a spot; Regulations on a trip; and a catch's Conditions, Tide and Location, which still show their key values (for example "⛅ Partly cloudy · 58°F") while folded. **Reset folded sections** in Settings puts them back.

Settings (units, pounds or pounds and ounces, backup, and Help) is the gear icon at the top right. The app also has a map of all your catch spots, search, an "Open spot in Maps" button for getting back to a spot, sharing, and imperial/metric units.

## Get it on your phone (about 2 minutes)

Fishamongus! is live at **https://krazow.github.io/fishamongus/**, published by GitHub Pages from the `main` branch of this repository.

1. Open that link on your phone:
   - **iPhone (Safari, not Chrome):** tap Share → **Add to Home Screen**.
   - **Android (Chrome):** tap **Install**, or ⋮ → **Install app**.
2. Open Fishamongus! from your home screen, tap **Get started** and allow **Location**. Allow **Camera** when you add a photo.
3. In Settings → Backup, choose how often to back up.

**Updating:** push changes to `main` and GitHub Pages republishes in a minute or two. Bump `VERSION` in `sw.js` with every change so installed copies pick up the update the next time they open online. Keep the same web address: your log is stored on the phone and tied to it.

## How it works

- **Storage:** catches and photos are saved only on your phone, in the app's own storage. Nothing is uploaded anywhere. Photos are shrunk to about 1600 px to save space.
- **Backup reminder:** once you have 5 catches, the Log screen reminds you to back up (and again after 20 new catches, or 30 days with new ones). Settings shows when you last backed up.
- **Back up regularly:** use Settings → *Export full backup*. You get one `.json` file that includes your photos, spots and trips. Use *Restore from backup* to load it on a new phone. *Export spreadsheet (CSV)* opens in Excel or Google Sheets.
  - On iPhone, if you delete the home-screen app, its stored data is deleted with it, so export a backup first.
- **No signal on the water:** the app still opens and saves catches with GPS. GPS doesn't need cell service. Weather for those catches is filled in automatically the next time you open the app with a connection. It looks up the weather for the time and place of the catch.
- **Logging a catch later:** change the "Caught at" time and the weather is looked up for that hour. Weather history goes back years.
- **Weather source:** [Open-Meteo](https://open-meteo.com/). It's free for non-commercial use and needs no API key. If you ever sell the app, you'll need their paid plan.
- **Map:** OpenStreetMap. The map needs a connection to load map tiles.
- **Tides:** NOAA CO-OPS tide predictions (public, no key). The station list is saved on the phone for 30 days; predictions need a connection. A catch's tide is saved with it, so it stays available offline.

## Files

| File | What it is |
|---|---|
| `index.html` | The app's screens |
| `styles.css` | Look and feel, with automatic light and dark mode |
| `app.js` | All the logic: GPS, weather, photos, storage, map, export |
| `sw.js` | Service worker that makes the app open with no signal |
| `manifest.webmanifest`, `icons/` | Home-screen name and icon |

**Updating the app:** after you change any file, open `sw.js` and bump `VERSION`, for example from `tl-v1` to `tl-v2`. Then drag the folder onto Netlify again. Phones pick up the new version the next time the app is opened twice.

**Renamed from Tight Lines:** the app was renamed Fishamongus!. Catches saved under the old name are kept, and backups made by the old version can still be restored. If the app is already on your home screen, delete the icon and add it again to see the new name. Before you delete it, export a backup (Settings → *Export full backup*): on iPhone, deleting the home-screen app also deletes its saved data. Then restore the backup in the new copy.
