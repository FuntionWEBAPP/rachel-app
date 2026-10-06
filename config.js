/*
 * Rachel app settings. Everything here is PUBLIC BY DESIGN:
 *  - Firebase web config: identifies the "rachel-push" Firebase project to the
 *    browser; it grants no access on its own (sending needs the private
 *    service account key, which lives only in Rachel's Script Properties).
 *  - vapidKey: the PUBLIC half of the Web Push key pair.
 *  - rachelUrl: the live Rachel web app (already public; it has its own login).
 * Loaded by both the page (index.html) and the service worker.
 */
self.RACHEL_CONFIG = {
  rachelUrl: 'https://script.google.com/macros/s/AKfycbwPp3KNmcQ391rPRcRSLpQYWChdhp06UHgfVsj6rFKSX8aiQEWpXmBwrRBYFvsFDDrKTQ/exec',
  firebase: {
    apiKey: 'FILL_ME',
    authDomain: 'FILL_ME',
    projectId: 'FILL_ME',
    storageBucket: 'FILL_ME',
    messagingSenderId: 'FILL_ME',
    appId: 'FILL_ME'
  },
  vapidKey: 'FILL_ME'
};
