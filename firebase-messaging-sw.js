/*
 * Rachel app service worker: receives pop-ups while the app is closed.
 * Firebase's SDK shows the notification (Rachel sends a "notification"
 * payload with fcm_options.link) and opens that link when it is tapped.
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

// A tap on a notification Firebase did not handle itself: open (or focus) the app at its link.
self.addEventListener('notificationclick', function (event) {
  var data = (event.notification && event.notification.data) || {};
  if (data.FCM_MSG) return; // Firebase's own handler opens fcm_options.link
  event.notification.close();
  var url = data.url || self.registration.scope;
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].url.indexOf(self.registration.scope) === 0 && 'focus' in list[i]) {
        list[i].navigate(url);
        return list[i].focus();
      }
    }
    return self.clients.openWindow(url);
  }));
});
