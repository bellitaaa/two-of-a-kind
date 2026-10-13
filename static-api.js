/* Free version: talks to the Google Apps Script back end, then starts the invitation (app.js). */
(function () {
  'use strict';
  var CFG = window.INVITE_CONFIG || {};
  var SCRIPT = String(CFG.scriptUrl || '');
  var configured = /^https:\/\/script\.google(usercontent)?\.com\//.test(SCRIPT) || /^http:\/\/localhost[:/]/.test(SCRIPT);
  var EV = window.InviteEvent;
  var HOST_KEY = 'inv_host_pw';
  var STATE_KEY = 'inv_last_state';

  function ls(op, k, v) {
    try { if (op === 'get') return localStorage.getItem(k); if (op === 'set') localStorage.setItem(k, v); else localStorage.removeItem(k); } catch (e) { /* private mode */ }
    return null;
  }
  function pageBase() { return location.origin + location.pathname.replace(/index\.html$/, ''); }
  function param(name) { var m = new RegExp('[?&]' + name + '=([^&#]+)').exec(location.search); return m ? decodeURIComponent(m[1]) : ''; }

  function call(body, method) {
    if (!configured) return Promise.reject(Object.assign(new Error('This invitation isn’t connected yet. (Hosts: paste the Apps Script link into config.js.)'), { status: 503, code: 'setup' }));
    var opts = method === 'GET'
      ? { method: 'GET' }
      : { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) };
    var url = method === 'GET' ? SCRIPT + (SCRIPT.indexOf('?') > -1 ? '&' : '?') + Object.keys(body).map(function (k) { return k + '=' + encodeURIComponent(body[k]); }).join('&') : SCRIPT;
    return fetch(url, opts).then(function (r) { return r.text(); }).then(function (text) {
      var d;
      try { d = JSON.parse(text); } catch (e) {
        throw Object.assign(new Error('The invitation’s Google script didn’t answer properly. (Hosts: check it’s deployed with access “Anyone”.)'), { status: 502 });
      }
      if (d.status && d.status >= 400) throw Object.assign(new Error(d.error || 'Something went wrong.'), { status: d.status, code: d.code, fields: d.fields });
      return d;
    });
  }

  // Turn the script's answer into what the invitation page renders.
  function toState(raw) {
    var s = merge(EV.DEFAULTS, raw.settings || {});
    var st = EV.inviteState(s, raw.guest, { mode: raw.mode, token: raw.token });
    if (raw.settings && raw.settings.rsvpOpenNow === false && !s.allowLate) st.event.rsvpOpen = false;
    if (ls('get', HOST_KEY) && raw.mode !== 'invalid') st.canEdit = true;
    return st;
  }
  function merge(a, b) { var o = JSON.parse(JSON.stringify(a)), k; for (k in b) o[k] = (k === 'texts' || k === 'amp') ? Object.assign({}, a[k], b[k]) : b[k]; return o; }

  function blobToBase64(blob) {
    return new Promise(function (resolve, reject) {
      var fr = new FileReader();
      fr.onload = function () { resolve(String(fr.result).split(',')[1]); };
      fr.onerror = function () { reject(new Error('That photo couldn’t be read.')); };
      fr.readAsDataURL(blob);
    });
  }

  function icsData(S) {
    var e = S.event;
    if (!e.startUtc) return null;
    var d = function (ms) { return new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); };
    var esc = function (t) { return String(t || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n'); };
    var where = S.location && S.location.address ? S.location.address : [e.venue, e.area].filter(Boolean).join(', ');
    var link = S.token ? pageBase() + '?g=' + S.token : pageBase();
    var ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Invitation//EN', 'BEGIN:VEVENT',
      'UID:' + (e.startUtc || 0) + '@invitation', 'DTSTAMP:' + d(Date.now()), 'DTSTART:' + d(e.startUtc), 'DTEND:' + d(e.endUtc),
      'SUMMARY:' + esc(e.name || 'Celebration'), 'LOCATION:' + esc(where), 'DESCRIPTION:' + esc('Your invitation: ' + link), 'URL:' + link,
      'BEGIN:VALARM', 'TRIGGER:-PT3H', 'ACTION:DISPLAY', 'DESCRIPTION:' + esc(e.name || 'Celebration'), 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    try { return URL.createObjectURL(new Blob([ics], { type: 'text/calendar' })); } catch (x) { return 'data:text/calendar;charset=utf-8,' + encodeURIComponent(ics); }
  }

  window.__STATIC_API__ = {
    personalLink: function (token) { return pageBase() + '?g=' + token; },
    rsvp: function (payload) { return call(Object.assign({ action: 'rsvp' }, payload)).then(toState); },
    icsUrl: function (token, S) { return S ? icsData(S) : null; },
    saveSettings: function (patch) {
      var pw = ls('get', HOST_KEY);
      if (!pw) return Promise.reject(new Error('Sign in to your dashboard (host.html) on this phone first.'));
      return call({ action: 'saveSettings', password: pw, patch: patch }).catch(function (e) {
        if (e.code === 'auth') { ls('del', HOST_KEY); e.message = 'Your dashboard password changed. Sign in to host.html again.'; }
        throw e;
      });
    },
    upload: function (blob) {
      var pw = ls('get', HOST_KEY);
      if (!pw) return Promise.reject(new Error('Sign in to your dashboard (host.html) on this phone first.'));
      return blobToBase64(blob).then(function (data) { return call({ action: 'upload', password: pw, mime: blob.type || 'image/jpeg', data: data }); }).then(function (d) { return d.url; });
    },
  };

  // ---------------------------------------------------------------- boot
  function start(state) {
    window.__BOOT__ = state;
    document.body.classList.remove('is-loading');
    var s = document.createElement('script');
    s.src = 'app.js?v=' + (CFG.version || '');
    document.body.appendChild(s);
  }
  function fallback(err) {
    var st = toState({ mode: 'open', token: null, settings: {}, guest: null });
    st.offline = true;
    st.offlineReason = err && err.message;
    start(st);
  }
  // Show the envelope's artwork and date straight away while the details load.
  try {
    document.body.insertAdjacentHTML('afterbegin', window.ART.sprite());
    var early = { 'stamp-rose': function () { return ART.stamp('rose'); }, 'stamp-heart': function () { return ART.stamp('heart'); }, cherries: ART.cherries, seal: ART.seal };
    Array.prototype.forEach.call(document.querySelectorAll('.opening [data-art]'), function (el) { var f = early[el.dataset.art]; if (f) el.innerHTML = f(); });
    var cached = JSON.parse(ls('get', STATE_KEY) || 'null');
    var dateEl = document.querySelector('[data-slot="env-date"]');
    if (dateEl) dateEl.textContent = (cached && cached.numericDate) || EV.eventTimes(EV.DEFAULTS).numericDate;
  } catch (x) { /* fine, app.js fills these in */ }
  var token = param('g');
  if (!token) {
    // People who replied through the shared link come back to their own invitation.
    var saved = ls('get', 'inv_token');
    if (saved && /^[A-Za-z0-9_-]{16,80}$/.test(saved)) { location.replace(pageBase() + '?g=' + saved); return; }
  }
  var done = false;
  var timer = setTimeout(function () { if (!done) { done = true; fallback(new Error('The invitation is taking too long to load. Check your connection and try again.')); } }, 15000);
  call({ action: 'invite', g: token }, 'GET').then(function (raw) {
    if (done) return;
    done = true; clearTimeout(timer);
    if (raw.mode === 'invalid') ls('del', 'inv_token');
    var st = toState(raw);
    ls('set', STATE_KEY, JSON.stringify({ numericDate: st.event.numericDate }));
    start(st);
  }).catch(function (err) {
    if (done) return;
    done = true; clearTimeout(timer);
    fallback(err);
  });
})();
