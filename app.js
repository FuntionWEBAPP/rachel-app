/*
 * Rachel phone app shell.
 *
 * Shows the live Rachel web app full screen and adds what a website cannot do
 * on its own: being installed as an app, remembering the sign-in, and pop-ups.
 *
 * Talks to the Rachel page ONLY through postMessage, ONLY with Apps Script's
 * sandbox origin (*-script.googleusercontent.com), and the page in turn only
 * accepts this app's exact origin (AppBridge.html in bhh-functions).
 */
(function () {
  'use strict';
  var CFG = self.RACHEL_CONFIG || {};
  var RACHEL_ORIGIN_RE = /^https:\/\/[a-z0-9-]+-script\.googleusercontent\.com$/;
  var KEY_SESSION = 'rachel_session';
  var KEY_VIEW = 'rachel_view';
  var KEY_PUSH_TOKEN = 'rachel_push_token';
  var KEY_PUSH_ASKED = 'rachel_push_asked';

  var frame = document.getElementById('rachel');
  var rachelWin = null;      // the Rachel page's window, learned from its first message
  var rachelOrigin = null;   // and its exact origin

  function store(k, v) { try { if (v) localStorage.setItem(k, v); else localStorage.removeItem(k); } catch (e) {} }
  function read(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }

  var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  var pushSupported = 'serviceWorker' in navigator && 'Notification' in window && 'PushManager' in window;
  var firebaseReady = CFG.firebase && CFG.firebase.apiKey && CFG.firebase.apiKey !== 'FILL_ME' && CFG.vapidKey && CFG.vapidKey !== 'FILL_ME';

  // ---- Load Rachel ----------------------------------------------------------
  function rachelSrc(view, section) {
    var url = CFG.rachelUrl + '?view=' + (view === 'staff' ? 'staff' : 'manager') + '&app=1';
    if (section === 'reminders') url += '&section=reminders';
    return url;
  }
  var params = new URLSearchParams(location.search);
  frame.src = rachelSrc(read(KEY_VIEW) || 'manager', params.get('section'));

  // ---- Messages from the Rachel page ---------------------------------------
  function toRachel(msg) {
    if (rachelWin && rachelOrigin) rachelWin.postMessage(msg, rachelOrigin);
  }

  window.addEventListener('message', function (e) {
    if (!RACHEL_ORIGIN_RE.test(e.origin)) return;
    var m = e.data || {};
    if (typeof m.type !== 'string' || m.type.indexOf('rachel-') !== 0) return;
    rachelWin = e.source;
    rachelOrigin = e.origin;

    if (m.type === 'rachel-ready') {
      var saved = read(KEY_SESSION);
      if (saved) toRachel({ type: 'rachel-session', token: saved });
      var pushToken = read(KEY_PUSH_TOKEN);
      if (pushToken) toRachel({ type: 'rachel-push-token', fcmToken: pushToken, label: isIOS ? 'iPhone' : 'Phone' });
    } else if (m.type === 'rachel-session') {
      store(KEY_SESSION, typeof m.token === 'string' ? m.token : '');
    } else if (m.type === 'rachel-navigate') {
      store(KEY_VIEW, m.view === 'staff' ? 'staff' : 'manager');
      frame.src = rachelSrc(read(KEY_VIEW), '');
    } else if (m.type === 'rachel-want-push') {
      // "Turn on pop-ups" pressed inside Rachel. The iPhone permission prompt
      // only works from a tap on THIS page, so show the bar for that tap.
      if (pushSupported && firebaseReady) document.getElementById('pushBar').hidden = false;
      else toast(isIOS && !standalone ? 'Install Rachel to your home screen first (Share > Add to Home Screen).' : 'Pop-ups are not available on this device.');
    } else if (m.type === 'rachel-push-registered') {
      toast(m.ok ? 'Pop-ups are on for this phone.' : 'Could not turn pop-ups on: ' + (m.error || 'unknown error'));
    }
  });

  // ---- Toast ---------------------------------------------------------------
  var toastTimer = null;
  function toast(text) {
    var el = document.getElementById('toast');
    el.textContent = text;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.hidden = true; }, 6000);
  }
  document.getElementById('toast').addEventListener('click', function () { this.hidden = true; });

  // ---- Install hint (iPhone pop-ups only work from the home screen icon) ---
  if (isIOS && !standalone && !read('rachel_install_seen')) {
    document.getElementById('installBar').hidden = false;
  }
  document.getElementById('installDismiss').addEventListener('click', function () {
    document.getElementById('installBar').hidden = true;
    store('rachel_install_seen', '1');
  });

  // ---- Pop-ups ---------------------------------------------------------------
  var messaging = null;
  var swReg = null;

  function initFirebase() {
    if (messaging || !firebaseReady || !pushSupported) return messaging;
    firebase.initializeApp(CFG.firebase);
    messaging = firebase.messaging();
    // A pop-up arriving while the app is open: iPhone does not show it, so show it here.
    messaging.onMessage(function (payload) {
      var n = (payload && payload.notification) || {};
      toast((n.title ? n.title + ': ' : '') + (n.body || ''));
    });
    return messaging;
  }

  function getPushToken() {
    initFirebase();
    if (!messaging) return Promise.reject(new Error('Pop-ups are not available on this device yet.'));
    var regP = swReg ? Promise.resolve(swReg) : navigator.serviceWorker.register('firebase-messaging-sw.js').then(function (r) { swReg = r; return r; });
    return regP.then(function (reg) {
      return messaging.getToken({ vapidKey: CFG.vapidKey, serviceWorkerRegistration: reg });
    }).then(function (token) {
      if (!token) throw new Error('No pop-up token returned.');
      store(KEY_PUSH_TOKEN, token);
      toRachel({ type: 'rachel-push-token', fcmToken: token, label: isIOS ? 'iPhone' : 'Phone' });
      return token;
    });
  }

  function turnOnPush() {
    document.getElementById('pushBar').hidden = true;
    store(KEY_PUSH_ASKED, '1');
    // Must run straight from the tap - iPhone only allows the permission prompt from a user gesture.
    Notification.requestPermission().then(function (perm) {
      if (perm !== 'granted') { toast('Pop-ups stay off. You can turn them on later in iPhone Settings > Notifications > Rachel.'); return; }
      return getPushToken().then(function () { toast('Setting up pop-ups...'); });
    }).catch(function (err) { toast('Could not turn pop-ups on: ' + err.message); });
  }

  document.getElementById('pushYes').addEventListener('click', turnOnPush);
  document.getElementById('pushLater').addEventListener('click', function () {
    document.getElementById('pushBar').hidden = true;
    store(KEY_PUSH_ASKED, '1');
  });

  if (firebaseReady && pushSupported && (standalone || !isIOS)) {
    if (Notification.permission === 'granted') {
      // Refresh the token every launch - Firebase rotates them occasionally.
      getPushToken().catch(function () { /* shown when the user next turns them on */ });
    } else if (Notification.permission === 'default' && !read(KEY_PUSH_ASKED)) {
      document.getElementById('pushBar').hidden = false;
    }
  }
})();
