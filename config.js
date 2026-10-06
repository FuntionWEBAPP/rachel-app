/*
 * Rachel app settings. Everything here is PUBLIC BY DESIGN:
 *  - Firebase web config: identifies the "rachel-push" Firebase project to the
 *    browser; it grants no access on its own (sending needs the private
 *    service account key, which lives only in Rachel's Script Properties).
 *  - vapidKey: the PUBLIC half of the Web Push key pair.
 *  - rachelUrl: the live Rachel web app (already public; it has its own login).
 * Loaded by both the page (index.html) and the service worker.
 * Analytics is deliberately NOT loaded - nothing about use is tracked.
 */
self.RACHEL_CONFIG = {
  rachelUrl: 'https://script.google.com/macros/s/AKfycbwPp3KNmcQ391rPRcRSLpQYWChdhp06UHgfVsj6rFKSX8aiQEWpXmBwrRBYFvsFDDrKTQ/exec',
  firebase: {
    apiKey: 'AIzaSyARZKk93MVyr28jEAJZTg4MRnVnBpi7XIM',
    authDomain: 'rachel-push.firebaseapp.com',
    projectId: 'rachel-push',
    storageBucket: 'rachel-push.firebasestorage.app',
    messagingSenderId: '269692864110',
    appId: '1:269692864110:web:2d13d1918ad09b41f1487f'
  },
  vapidKey: 'BAzEIW8-oGrIyVtSC4hRP9CEkt2Lzvl1zL2XIRqfw2uUU8fB8tdP1JThVjuPZVpIlBgl4ARrx3aO3X2cZ6bLcSI'
};
