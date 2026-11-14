# Changelog

Release notes for Fishamongus!. `/release now` adds a section here for every release, and the GitHub release notes
are taken from it.

## Unreleased

### Changed
- Releases go through the shared Krazow release kit: a beta at `/beta/` first (with its own log, and a separate
  "Fishamongus! Beta" Android app), then `/release promote` puts it live. Pushing to `main` no longer changes the live app.
- The service worker only clears Fishamongus!'s own caches (and the old `tl-v*` ones), never other krazow apps' or the saved map tiles.
- Smoke tests run on every pull request.
