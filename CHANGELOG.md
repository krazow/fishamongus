# Changelog

Release notes for Fishamongus!. `/release now` adds a section here for every release, and the GitHub release notes
are taken from it.

## 4.9.4 (2026-11-14)

No changes to how the app works; this release changes how new versions reach you.

### Changed
- New versions come out as a beta first, at https://krazow.github.io/fishamongus/beta/, with its own separate log, and a separate "Fishamongus! Beta" Android app that installs beside the real one. Once it has been tried, it's promoted to the main app. Pushing to `main` no longer changes the live app.
- Every Android update is checked to be signed with the same key as earlier versions, so it always installs over the app on your phone.
- Seven test suites (shellfish, the Now screen and sessions, spots and backups, map location, the 4.9 features, stats and edge cases) plus a smoke test run before every release.

### Fixed
- Opening Fishamongus! no longer clears the offline copies of other krazow apps on the same web address. It only clears its own old caches, and never your saved map tiles.
