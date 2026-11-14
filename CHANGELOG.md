# Changelog

Release notes for Fishamongus!. `/release now` adds a section here for every release, and the GitHub release notes
are taken from it.

## 4.9.4 (2026-11-14)

No changes to how the app works; this release changes how new versions reach you.

### Changed
- New versions come out as a beta first, at https://krazow.github.io/fishamongus/beta/, with its own separate log. Once it has been tried, it's promoted to the main app. Pushing to `main` no longer changes the live app.
- Releases no longer include an Android APK. On Android, install the web app from Chrome (**Install app**); an APK you already have keeps working with your log. The Windows installer is unchanged.
- Seven test suites (shellfish, the Now screen and sessions, spots and backups, map location, the 4.9 features, stats and edge cases) plus a smoke test run before every release.

### Fixed
- Opening Fishamongus! no longer clears the offline copies of other krazow apps on the same web address. It only clears its own old caches, and never your saved map tiles.
