/*
 * Rachel app service worker: receives pop-ups while the app is closed.
 * Firebase's SDK shows the notification (Rachel sends a "notification"
 * payload with fcm_options.link) and opens that link when it is tapped.
 * A reminder pop-up also carries Done / +1 hr buttons, and a question from
 * Rachel its answer buttons - both handled below.
 */
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');
importScripts('config.js');

var CFG = self.RACHEL_CONFIG || {};
if (CFG.firebase && CFG.firebase.apiKey && CFG.firebase.apiKey !== 'FILL_ME') {
  firebase.initializeApp(CFG.firebase);
  firebase.messaging();
}

self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (event) { event.waitUntil(self.clients.claim()); });

function openApp(url) {
  return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].url.indexOf(self.registration.scope) === 0 && 'focus' in list[i]) {
        list[i].navigate(url);
        return list[i].focus();
      }
    }
    return self.clients.openWindow(url);
  });
}

self.addEventListener('notificationclick', function (event) {
  var data = (event.notification && event.notification.data) || {};
  // Firebase keeps our data payload under FCM_MSG.data.
  var payload = (data.FCM_MSG && data.FCM_MSG.data) || data;

  // The Done / +1 hr buttons on a reminder pop-up (Android, desktop - an
  // iPhone web app does not show buttons, so there the tap below is the way
  // in). Firebase leaves button taps to us. The app opens Rachel on that
  // reminder with act=done|snooze and Rachel does it with its own sign-in -
  // nothing is changed from here.
  if (event.action === 'done' || event.action === 'snooze') {
    event.notification.close();
    var id = /^R\d{6,20}$/.test(String(payload.reminderId || '')) ? payload.reminderId : '';
    if (!id) return;
    var url = self.registration.scope + '?section=reminders&reminder=' + id + '&act=' + event.action;
    event.waitUntil(openApp(url));
    return;
  }

  // The buttons on a question from Rachel (Draft chase / Not now / Open -
  // never Confirm, which is only pressed inside Rachel). Same rule as the
  // reminder buttons: the app opens Rachel on that question with act=... and
  // Rachel does it with its own sign-in.
  if (event.action === 'open' || event.action === 'chase' || event.action === 'skip') {
    event.notification.close();
    var mid = /^M\d{6,20}$/.test(String(payload.messageId || '')) ? payload.messageId : '';
    if (!mid) return;
    event.waitUntil(openApp(self.registration.scope + '?section=rachel&msg=' + mid + '&act=' + event.action));
    return;
  }

  // A plain tap Firebase did not handle itself: open (or focus) the app at its link.
  if (data.FCM_MSG) return; // Firebase's own handler opens fcm_options.link
  event.notification.close();
  event.waitUntil(openApp(data.url || self.registration.scope));
});
