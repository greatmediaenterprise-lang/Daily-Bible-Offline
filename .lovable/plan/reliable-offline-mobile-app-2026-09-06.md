# Reliable offline mobile app

## What will change
- Make the published app save its full screen and navigation files during the first online visit, then open `/`, `/read`, `/search`, and `/library` without data.
- Keep downloaded Bible translations stored on the phone and add a clear offline-ready status after each download.
- Add an Install button with the correct Android prompt and simple iPhone/iPad Safari “Add to Home Screen” instructions.
- Use the existing Bible logo for Android, iPhone, and iPad installation.

## Verification
- Confirm the app builds cleanly.
- Test the published-style app once online, switch the browser offline, reload the URL, and verify a downloaded Bible can still be read and searched.
- Check the install controls and layout at phone size.

## Technical details
- Keep the existing generated service worker, but make its app-shell fallback deterministic and ensure all app routes resolve to the cached shell.
- Keep service workers disabled in the Lovable preview; offline verification targets the production-style local build because browser previews intentionally block service-worker registration.
- No account or cloud storage is required: Bible data remains on the device.
