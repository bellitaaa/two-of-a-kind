/* Free version of the host dashboard's server calls: everything goes to the Google Apps Script. */
(function () {
  'use strict';
  var CFG = window.INVITE_CONFIG || {};
  var SCRIPT = String(CFG.scriptUrl || '');
  var configured = /^https:\/\/script\.google(usercontent)?\.com\//.test(SCRIPT) || /^http:\/\/localhost[:/]/.test(SCRIPT);
  var EV = window.InviteEvent;
  var KEY = 'inv_host_pw';
  var last = null; // last host state, for CSV export

  function pw(v) {
    try { if (v === undefined) return localStorage.getItem(KEY); if (v === null) localStorage.removeItem(KEY); else localStorage.setItem(KEY, v); } catch (e) { /* ignore */ }
    return null;
  }
  function siteBase() { return location.origin + location.pathname.replace(/host\.html$/, '').replace(/\/?$/, '/'); }

  function post(body) {
    if (!configured) return Promise.reject(Object.assign(new Error('Not connected yet: paste your Apps Script Web app URL into config.js (see the guide, Step 3).'), { status: 503 }));
    return fetch(SCRIPT, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) })
      .then(function (r) { return r.text(); })
      .then(function (text) {
        var d;
        try { d = JSON.parse(text); } catch (e) { throw Object.assign(new Error('The Google script didn’t answer properly. Check it’s deployed as a Web app with access “Anyone”.'), { status: 502 }); }
        if (d.status && d.status >= 400) throw Object.assign(new Error(d.error || 'Something went wrong.'), { status: d.status, code: d.code, auth: d.code === 'auth' });
        return d;
      });
  }
  function hostCall(action, extra) {
    var p = pw();
    if (!p) return Promise.reject(Object.assign(new Error('Please sign in.'), { status: 401, auth: true }));
    return post(Object.assign({ action: action, password: p }, extra || {})).catch(function (e) {
      if (e.auth) pw(null);
      throw e;
    });
  }

  // Shape the script's data the way the dashboard expects.
  function build(raw) {
    var s = raw.settings;
    var t = EV.eventTimes(s);
    var base = siteBase();
    var guests = (raw.guests || []).slice().sort(function (a, b) { return String(b.respondedAt || b.createdAt).localeCompare(String(a.respondedAt || a.createdAt)); });
    var st = { invited: guests.length, confirmed: 0, declined: 0, pending: 0, expected: 0, games: [] };
    guests.forEach(function (g) {
      if (g.status === 'attending') { st.confirmed++; st.expected += g.partySize; if (g.bringingGame) st.games.push({ name: g.name, game: g.game || 'A surprise game' }); }
      else if (g.status === 'declined') st.declined++;
      else st.pending++;
    });
    var missing = [!s.eventName && 'event name', !s.celebrants && 'birthday names', !s.hostName && 'host name', !s.date && 'date', !s.time && 'start time',
      !s.area && 'general location', !s.address && 'full address', !s.rsvpDeadline && 'RSVP deadline'].filter(Boolean);
    last = {
      settings: s,
      times: { dateLabel: t.dateLabel, timeLabel: t.timeLabel, deadlineLabel: t.deadlineLabel, deadlinePassed: t.deadlinePassed, mapsLink: EV.mapsLink(s) },
      missing: missing,
      stats: st,
      guests: guests.map(function (g) {
        return { id: g.id, name: g.name, contact: g.contact, maxParty: g.maxParty, status: g.status, partySize: g.partySize, bringingGame: g.bringingGame, game: g.game,
          message: g.message, note: g.hostNote, source: g.source === 'shared link' ? 'open' : 'invite', createdAt: g.createdAt, respondedAt: g.respondedAt || null,
          openedAt: g.openedAt || null, remindedAt: g.remindedAt || null, link: base + '?g=' + g.token };
      }),
      activity: raw.log || [],
      links: { base: base, open: base },
      notify: { status: raw.notifyStatus || {}, ntfyServer: 'https://ntfy.sh' },
      email: { configured: true, gmail: true, hostEmail: s.notifyEmail || raw.ownerEmail || '', ownerEmail: raw.ownerEmail || '', last: null },
      sheetUrl: raw.sheetUrl || '',
      free: true,
    };
    return last;
  }

  function blobToBase64(blob) {
    return new Promise(function (resolve, reject) {
      var fr = new FileReader();
      fr.onload = function () { resolve(String(fr.result).split(',')[1]); };
      fr.onerror = function () { reject(new Error('That file couldn’t be read.')); };
      fr.readAsDataURL(blob);
    });
  }

  function csvCell(v) {
    var s = String(v == null ? '' : v);
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
    return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }

  window.__HOST_API__ = {
    isFree: true,
    exportCsv: function () {
      if (!last) return;
      var head = ['Name', 'Status', 'Party size', 'Max party', 'Contact', 'Bringing a game', 'Game', 'Message', 'Your note', 'Replied', 'Private link'];
      var rows = last.guests.map(function (g) { return [g.name, g.status, g.partySize, g.maxParty, g.contact, g.bringingGame ? 'yes' : 'no', g.game, g.message, g.note, g.respondedAt || '', g.link]; });
      var csv = '﻿' + [head].concat(rows).map(function (r) { return r.map(csvCell).join(','); }).join('\r\n');
      var a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
      a.download = 'guest-list-' + new Date().toISOString().slice(0, 10) + '.csv';
      document.body.appendChild(a); a.click(); a.remove();
    },
    call: function (method, url, body, raw) {
      var m;
      if (url === '/api/host/login') {
        pw(String(body && body.password || ''));
        return hostCall('hostState').then(function (d) { build(d); return { ok: true }; });
      }
      if (url === '/api/host/logout') { pw(null); return Promise.resolve({ ok: true }); }
      if (url === '/api/host/state') return hostCall('hostState').then(build);
      if (url === '/api/host/settings' && method === 'PUT') return hostCall('saveSettings', { patch: body }).then(build);
      if (url === '/api/host/guests' && method === 'POST') return hostCall('addGuests', { guests: body.guests }).then(build);
      if ((m = /^\/api\/host\/guests\/([^/]+)\/token$/.exec(url))) return hostCall('newToken', { id: m[1] }).then(build);
      if ((m = /^\/api\/host\/guests\/([^/]+)$/.exec(url))) {
        if (method === 'DELETE') return hostCall('deleteGuest', { id: m[1] }).then(build);
        return hostCall('updateGuest', Object.assign({}, body, { id: m[1] })).then(build);
      }
      if (url.indexOf('/api/host/upload') === 0) {
        if (/kind=audio/.test(url)) return Promise.reject(new Error('Paste a link to the song instead (see Background music).'));
        return blobToBase64(raw).then(function (data) { return hostCall('upload', { mime: raw.type || 'image/jpeg', data: data }); });
      }
      if (url === '/api/host/remind') return hostCall('remind', { base: siteBase() }).then(function (d) { return { result: d.result, state: build(d.state) }; });
      if (url === '/api/host/test-notify' || url === '/api/host/test-email') {
        return hostCall('testNotify', { channel: (body && body.channel) || 'email' }).then(function (d) { return { ok: true, state: build(d.state) }; });
      }
      return Promise.reject(new Error('Not available in this version.'));
    },
  };
})();
