# Rachel app

The installable phone app for **Rachel**, the Broken Hill Hotel functions assistant.

It shows the live Rachel web app (Google Apps Script, `bhh-functions` repo) full
screen and adds what a website cannot do alone: installing to the home screen,
remembering the sign-in, and pop-up notifications via Firebase Cloud Messaging.

Everything in this repo is public by design - no secrets. Sending pop-ups needs a
private service-account key that lives only in Rachel's Script Properties.

- `index.html` / `app.js` - the shell; talks to Rachel only via `postMessage` with
  Apps Script's sandbox origin (`*-script.googleusercontent.com`).
- `firebase-messaging-sw.js` - receives pop-ups while the app is closed.
- `config.js` - Rachel's URL and the Firebase web config (public).

Install on iPhone (iOS 16.4+): open the site in Safari > Share > Add to Home Screen,
open Rachel from the icon, tap **Turn on**.
