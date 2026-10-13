/* Host dashboard */
(function () {
  'use strict';
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  var ST = null; // server state
  var filter = 'all';
  var query = '';
  var editing = null;
  var mood = [];

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var tt;
  function toast(m) { var t = $('[data-toast]'); t.textContent = m; t.classList.add('show'); clearTimeout(tt); tt = setTimeout(function () { t.classList.remove('show'); }, 2600); }
  function ago(iso) {
    if (!iso) return '';
    var s = (Date.now() - Date.parse(iso)) / 1000;
    if (s < 60) return 'just now';
    if (s < 3600) return Math.floor(s / 60) + 'm ago';
    if (s < 86400) return Math.floor(s / 3600) + 'h ago';
    return Math.floor(s / 86400) + 'd ago';
  }

  function api(method, url, body, raw) {
    if (window.__HOST_API__) {
      // Free version: the Google Apps Script answers instead of a server.
      return window.__HOST_API__.call(method, url, body, raw).catch(function (e) {
        if (e.auth && url !== '/api/host/login') { showLogin(); throw new Error('Please sign in again.'); }
        throw e;
      });
    }
    var opts = { method: method, headers: { 'x-host-request': '1' }, credentials: 'same-origin' };
    if (raw) { opts.body = raw; opts.headers['Content-Type'] = raw.type || 'application/octet-stream'; }
    else if (body !== undefined) { opts.body = JSON.stringify(body); opts.headers['Content-Type'] = 'application/json'; }
    return fetch(url, opts).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) {
        if (r.status === 401 && url !== '/api/host/login') { showLogin(); throw new Error('Please sign in again.'); }
        if (!r.ok) throw new Error(d.error || 'Something went wrong (' + r.status + ').');
        return d;
      });
    });
  }

  // ---------------------------------------------------------------- auth
  function showLogin() { $('[data-login]').hidden = false; $('[data-app]').hidden = true; setTimeout(function () { $('[data-login-form] input').focus(); }, 50); }
  $('[data-login-form]').addEventListener('submit', function (e) {
    e.preventDefault();
    var err = $('[data-login-err]'); err.hidden = true;
    var btn = $('button', e.target); btn.disabled = true;
    api('POST', '/api/host/login', { password: e.target.password.value }).then(function () {
      e.target.password.value = '';
      load();
    }).catch(function (x) { err.textContent = x.message; err.hidden = false; }).then(function () { btn.disabled = false; });
  });
  $('[data-logout]').addEventListener('click', function () { api('POST', '/api/host/logout').then(showLogin); });

  function load() {
    return api('GET', '/api/host/state').then(function (d) {
      ST = d;
      $('[data-login]').hidden = true; $('[data-app]').hidden = false;
      render();
    }).catch(function (e) { if (!/sign in/i.test(e.message)) toast(e.message); });
  }

  // ---------------------------------------------------------------- tabs
  function showTab(name) {
    $$('[data-tab]').forEach(function (b) { b.setAttribute('aria-selected', String(b.dataset.tab === name)); });
    $$('[data-panel]').forEach(function (p) { p.hidden = p.dataset.panel !== name; });
    try { sessionStorage.setItem('hostTab', name); } catch (e) { /* ignore */ }
    window.scrollTo(0, 0);
  }
  $$('[data-tab]').forEach(function (b) { b.addEventListener('click', function () { showTab(b.dataset.tab); }); });

  // ---------------------------------------------------------------- render
  function render() {
    var s = ST.settings, st = ST.stats;
    $('[data-h-name]').textContent = s.eventName || 'Your gathering';
    $('[data-h-date]').textContent = [ST.times.dateLabel, ST.times.timeLabel].filter(Boolean).join(' · ') || 'Date not set yet';

    var miss = $('[data-missing]');
    if (ST.missing.length) {
      miss.hidden = false;
      miss.innerHTML = '<b>Finish setting up:</b> ' + ST.missing.map(esc).join(', ') + '. Guests see placeholders until these are filled in.<br><button class="b b--primary b--sm" type="button" data-goto-event>Open event settings</button>';
      $('[data-goto-event]').addEventListener('click', function () { showTab('event'); });
    } else miss.hidden = true;

    $('[data-stats]').innerHTML = [
      ['Expected guests', st.expected, true], ['Confirmed', st.confirmed], ['Pending', st.pending],
      ['Declined', st.declined], ['Invited', st.invited], ['Games', st.games.length],
    ].map(function (x) { return '<div class="stat' + (x[2] ? ' stat--hero' : '') + '"><b>' + x[1] + '</b><span>' + x[0] + '</span></div>'; }).join('');

    $('[data-games]').innerHTML = st.games.length ? st.games.map(function (g) { return '<li><span>' + esc(g.game) + '</span><small>' + esc(g.name) + '</small></li>'; }).join('')
      : '<li class="empty-li">No games pledged yet.</li>';
    $('[data-activity]').innerHTML = ST.activity.length ? ST.activity.slice(0, 8).map(function (a) {
      return '<li><span>' + esc(a.name) + ' <span class="pill pill--' + a.status + '">' + label(a.status) + (a.status === 'attending' && a.partySize > 1 ? ' · ' + a.partySize : '') + '</span></span><small>' + ago(a.at) + '</small></li>';
    }).join('') : '<li class="empty-li">Responses will appear here.</li>';

    renderNotify();

    renderGuests();
    renderInvite();
    renderEvent();
  }
  function label(status) { return { attending: 'Confirmed', declined: 'Declined', pending: 'Pending' }[status]; }

  // ---------------------------------------------------------------- notifications
  function stateBadge(ch, on) {
    var st = (ST.notify.status || {})[ch];
    var el = $('[data-ch-state="' + ch + '"]');
    if (!on) { el.innerHTML = '<span class="pill pill--pending">Off</span>'; return; }
    if (st && !st.ok) { el.innerHTML = '<span class="pill pill--declined">Last send failed</span>'; el.title = st.error; return; }
    el.innerHTML = '<span class="pill pill--attending">On</span>';
    el.title = st ? 'Last sent ' + ago(st.at) : '';
  }
  function renderNotify() {
    var s = ST.settings, st = ST.notify.status || {};
    $$('[data-open-sheet]').forEach(function (a) { a.href = ST.sheetUrl || '#'; a.hidden = !ST.sheetUrl; });
    var to = s.notifyEmail || ST.email.ownerEmail;
    $('[data-email-to]').innerHTML = s.notifyOnRsvp ? 'Sent from your Gmail to <b>' + esc(to || 'your Google account') + '</b>.' : 'Off. Replies still go into your sheet.';
    $('[data-email-toggle]').textContent = s.notifyOnRsvp ? 'Turn off' : 'Turn on';
    $('[data-test="email"]').hidden = !s.notifyOnRsvp;
    stateBadge('email', !!s.notifyOnRsvp);
    var pushOn = !!(s.pushTopic && s.pushOnRsvp);
    $('[data-push-off]').hidden = pushOn;
    $('[data-push-on-panel]').hidden = !pushOn;
    if (pushOn) $('[data-push-topic]').value = s.pushTopic;
    stateBadge('push', pushOn);
    $('[data-notify-errors]').innerHTML = ['email', 'push'].map(function (c) { return st[c] && !st[c].ok ? '<p class="msg msg--err">' + ({ email: 'Email', push: 'Phone' }[c]) + ': ' + esc(st[c].error) + '</p>' : ''; }).join('');
  }
  function randomTopic() {
    var a = new Uint8Array(9);
    window.crypto.getRandomValues(a);
    var slug = (ST.settings.eventName || 'rsvp').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 20) || 'rsvp';
    return slug + '-' + Array.from(a, function (b) { return 'abcdefghijkmnpqrstuvwxyz23456789'[b % 32]; }).join('');
  }
  function testNotify(channel, btn) {
    btn.disabled = true;
    api('POST', '/api/host/test-notify', { channel: channel }).then(function (d) {
      ST = d.state; render();
      toast({ push: 'Test sent. Check your phone 📱', email: 'Test email sent. Check your inbox ✉️' }[channel]);
    }).catch(function (e) { toast(e.message); load(); }).then(function () { btn.disabled = false; });
  }
  $('[data-test="email"]').addEventListener('click', function () { testNotify('email', this); });
  $('[data-email-toggle]').addEventListener('click', function () {
    api('PUT', '/api/host/settings', { notifyOnRsvp: !ST.settings.notifyOnRsvp }).then(function (d) { ST = d; render(); toast(ST.settings.notifyOnRsvp ? 'RSVP emails on' : 'RSVP emails off'); }).catch(function (e) { toast(e.message); });
  });
  $('[data-push-on]').addEventListener('click', function () {
    var topic = ST.settings.pushTopic || randomTopic();
    api('PUT', '/api/host/settings', { pushTopic: topic, pushOnRsvp: true }).then(function (d) { ST = d; render(); toast('Now subscribe to the channel in the ntfy app'); }).catch(function (e) { toast(e.message); });
  });
  $('[data-push-off-btn]').addEventListener('click', function () {
    api('PUT', '/api/host/settings', { pushOnRsvp: false }).then(function (d) { ST = d; render(); toast('Phone notifications off'); });
  });
  $('[data-copy-topic]').addEventListener('click', function () { copy(ST.settings.pushTopic, 'Channel name copied'); });
  $('[data-test="push"]').addEventListener('click', function () { testNotify('push', this); });
  $('[data-export]').addEventListener('click', function (ev) {
    if (window.__HOST_API__) { ev.preventDefault(); window.__HOST_API__.exportCsv(); }
  });

  // ---------------------------------------------------------------- guests
  function waLink(g, text) {
    var c = String(g.contact || '');
    var d = c.replace(/\D/g, '');
    var intl = /^\s*(\+|00)/.test(c) ? d.replace(/^00/, '') : /^0\d{9}$/.test(d) ? '256' + d.slice(1) : ''; // Ugandan 07… numbers
    return 'https://wa.me/' + intl + '?text=' + encodeURIComponent(text);
  }
  function inviteText(g) {
    var s = ST.settings;
    return 'Hi ' + g.name.split(' ')[0] + '! 💌 You’re invited to ' + (s.eventName || 'a little get-together') + (ST.times.dateLabel ? ' on ' + ST.times.dateLabel : '') + '. Tap to unwrap your invitation: ' + g.link;
  }
  function nudgeText(g) {
    var s = ST.settings;
    return 'Hi ' + g.name.split(' ')[0] + '! Just a gentle nudge 💌 Your invitation to ' + (s.eventName || 'our get-together') + ' is waiting' + (ST.times.deadlineLabel ? ' (RSVP by ' + ST.times.deadlineLabel + ')' : '') + ': ' + g.link;
  }

  function renderGuests() {
    var counts = { all: ST.guests.length, attending: 0, pending: 0, declined: 0 };
    ST.guests.forEach(function (g) { counts[g.status] += 1; });
    $$('[data-filter]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.filter === filter));
      b.innerHTML = b.textContent.replace(/\s*\d+$/, '') + ' <small>' + counts[b.dataset.filter] + '</small>';
    });
    var q = query.toLowerCase();
    var list = ST.guests.filter(function (g) {
      return (filter === 'all' || g.status === filter) && (!q || (g.name + ' ' + g.contact + ' ' + g.game).toLowerCase().indexOf(q) > -1);
    });
    $('[data-guests-empty]').hidden = ST.guests.length > 0;
    $('[data-guests]').innerHTML = list.map(function (g) {
      var meta = [];
      if (g.contact) meta.push(/^@/.test(g.contact) ? 'Snapchat ' + esc(g.contact) : /@/.test(g.contact) ? esc(g.contact) : 'WhatsApp ' + esc(g.contact));
      if (g.status === 'attending') meta.push('Party of ' + g.partySize);
      else meta.push('Up to ' + g.maxParty);
      if (g.bringingGame) meta.push('🎲 ' + esc(g.game || 'a game'));
      if (g.status === 'pending') meta.push(g.openedAt ? 'Opened ' + ago(g.openedAt) : 'Not opened yet');
      else if (g.respondedAt) meta.push('Replied ' + ago(g.respondedAt));
      if (g.source === 'open') meta.push('via general link');
      return '<li class="g" data-id="' + g.id + '"><div class="g-top"><div><div class="g-name">' + esc(g.name) + '</div><div class="g-meta">' +
        meta.map(function (m) { return '<span>' + m + '</span>'; }).join('') + '</div></div><span class="pill pill--' + g.status + '">' + label(g.status) + '</span></div>' +
        (g.message ? '<p class="g-msg">“' + esc(g.message) + '”</p>' : '') +
        (g.note ? '<p class="g-meta">Note: ' + esc(g.note) + '</p>' : '') +
        '<div class="g-actions"><button class="b b--ghost" type="button" data-act="copy">Copy link</button>' +
        '<a class="b b--ghost" target="_blank" rel="noopener" href="' + esc(waLink(g, inviteText(g))) + '">WhatsApp</a>' +
        '<button class="b b--ghost" type="button" data-act="edit">Edit</button></div></li>';
    }).join('');
  }
  $('[data-guests]').addEventListener('click', function (e) {
    var btn = e.target.closest('[data-act]');
    if (!btn) return;
    var g = ST.guests.find(function (x) { return x.id === +btn.closest('[data-id]').dataset.id; });
    if (btn.dataset.act === 'copy') copy(g.link, 'Link for ' + g.name.split(' ')[0] + ' copied');
    if (btn.dataset.act === 'edit') openEdit(g);
  });
  $('[data-search]').addEventListener('input', function (e) { query = e.target.value; renderGuests(); });
  $$('[data-filter]').forEach(function (b) { b.addEventListener('click', function () { filter = b.dataset.filter; renderGuests(); }); });

  function copy(text, msg) {
    var done = function () { toast(msg || 'Copied'); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback); else fallback();
    function fallback() { var t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove(); done(); }
  }

  // add guests
  $('[data-open-add]').addEventListener('click', function () { $('[data-add]').hidden = false; $('[data-add-text]').focus(); });
  $('[data-cancel-add]').addEventListener('click', function () { $('[data-add]').hidden = true; });
  $('[data-save-add]').addEventListener('click', function () {
    var err = $('[data-add-err]'); err.hidden = true;
    var lines = $('[data-add-text]').value.split('\n').map(function (l) { return l.trim(); }).filter(Boolean);
    if (!lines.length) { err.textContent = 'Add at least one name.'; err.hidden = false; return; }
    var guests = lines.map(function (l) {
      var p = l.split(',').map(function (x) { return x.trim(); });
      var g = { name: p[0], contact: p[1] || '' };
      if (p[2]) g.maxParty = parseInt(p[2], 10);
      return g;
    });
    var btn = $('[data-save-add]'); btn.disabled = true;
    api('POST', '/api/host/guests', { guests: guests }).then(function (d) {
      ST = d; render();
      $('[data-add-text]').value = ''; $('[data-add]').hidden = true;
      toast(guests.length + ' guest' + (guests.length > 1 ? 's' : '') + ' added. Share their links!');
    }).catch(function (e) { err.textContent = e.message; err.hidden = false; }).then(function () { btn.disabled = false; });
  });

  // edit
  var editForm = $('[data-edit-form]');
  function openEdit(g) {
    editing = g;
    editForm.name.value = g.name; editForm.contact.value = g.contact; editForm.maxParty.value = g.maxParty;
    editForm.status.value = g.status; editForm.partySize.value = g.partySize || 1; editForm.note.value = g.note || '';
    $('[data-edit-party]').hidden = g.status !== 'attending';
    $('[data-edit-err]').hidden = true;
    $('[data-edit]').hidden = false;
  }
  editForm.status.addEventListener('change', function () { $('[data-edit-party]').hidden = editForm.status.value !== 'attending'; });
  function closeEdit() { $('[data-edit]').hidden = true; editing = null; }
  $('[data-close-edit]').addEventListener('click', closeEdit);
  $('[data-edit]').addEventListener('click', function (e) { if (e.target === e.currentTarget) closeEdit(); });
  editForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var body = { name: editForm.name.value, contact: editForm.contact.value, maxParty: parseInt(editForm.maxParty.value, 10), note: editForm.note.value };
    if (editForm.status.value !== editing.status || (editForm.status.value === 'attending' && +editForm.partySize.value !== editing.partySize)) {
      body.status = editForm.status.value; body.partySize = parseInt(editForm.partySize.value, 10) || 1;
    }
    api('PATCH', '/api/host/guests/' + editing.id, body).then(function (d) { ST = d; render(); closeEdit(); toast('Saved'); })
      .catch(function (x) { var er = $('[data-edit-err]'); er.textContent = x.message; er.hidden = false; });
  });
  $('[data-delete]').addEventListener('click', function () {
    if (!confirm('Remove ' + editing.name + ' and their RSVP? Their link will stop working.')) return;
    api('DELETE', '/api/host/guests/' + editing.id).then(function (d) { ST = d; render(); closeEdit(); toast('Guest removed'); }).catch(function (x) { toast(x.message); });
  });
  $('[data-newlink]').addEventListener('click', function () {
    if (!confirm('Make a new link for ' + editing.name + '? The old link will stop working.')) return;
    var id = editing.id;
    api('POST', '/api/host/guests/' + id + '/token').then(function (d) {
      ST = d; render(); closeEdit();
      var g = ST.guests.find(function (x) { return x.id === id; });
      copy(g.link, 'New link created and copied');
    }).catch(function (x) { toast(x.message); });
  });

  // ---------------------------------------------------------------- invites tab
  function bindSettings(root) {
    $$('[data-s]', root).forEach(function (el) {
      var v = ST.settings[el.dataset.s];
      if (el.type === 'checkbox') el.checked = !!v; else el.value = v == null ? '' : v;
    });
  }
  function readSettings(root) {
    var out = {};
    $$('[data-s]', root).forEach(function (el) {
      var k = el.dataset.s;
      if (el.type === 'checkbox') out[k] = el.checked;
      else if (el.type === 'number') out[k] = el.value === '' ? 0 : parseInt(el.value, 10);
      else out[k] = el.value.trim();
    });
    return out;
  }
  function renderInvite() {
    var panel = $('[data-panel="invite"]');
    $('[data-open-link]').value = ST.links.open;
    var s0 = ST.settings;
    var msg = '💌 You’re invited to ' + (s0.eventName || 'our celebration') + (s0.celebrants ? ', ' + s0.celebrants + '’s birthday' : '') +
      (ST.times.dateLabel ? ', ' + ST.times.dateLabel : '') + '. Open your invitation and RSVP here: ' + ST.links.open;
    $('[data-share-wa]').href = 'https://wa.me/?text=' + encodeURIComponent(msg);
    bindSettings($('.settings-mini', panel));
    var pending = ST.guests.filter(function (g) { return g.status === 'pending'; });
    $('[data-nudge]').innerHTML = pending.length ? pending.map(function (g) {
      return '<li><span>' + esc(g.name) + ' <small>' + (g.openedAt ? 'opened' : 'not opened') + (g.remindedAt ? ' · reminded ' + ago(g.remindedAt) : '') + '</small></span>' +
        '<a class="b b--ghost b--sm" target="_blank" rel="noopener" href="' + esc(waLink(g, nudgeText(g))) + '">WhatsApp</a></li>';
    }).join('') : '<li class="empty-li">Everyone has replied. 🥂</li>';
    $('[data-remind]').hidden = !ST.email.configured;
  }
  $('[data-copy="open"]').addEventListener('click', function () { copy(ST.links.open, 'General link copied'); });
  $('[data-save-mini]').addEventListener('click', function () {
    api('PUT', '/api/host/settings', readSettings($('.settings-mini'))).then(function (d) { ST = d; render(); toast('Saved'); }).catch(function (e) { toast(e.message); });
  });
  $('[data-remind]').addEventListener('click', function () {
    var b = $('[data-remind]'); b.disabled = true;
    var m = $('[data-remind-msg]');
    api('POST', '/api/host/remind').then(function (d) {
      ST = d.state; render();
      var r = d.result;
      m.className = 'msg' + (r.failed.length ? ' msg--err' : '');
      m.textContent = r.sent + ' sent' + (r.noEmail ? ' · ' + r.noEmail + ' without email (use WhatsApp below)' : '') + (r.recent ? ' · ' + r.recent + ' reminded in the last day' : '') +
        (r.failed.length ? ' · ' + r.failed.length + ' failed: ' + r.failed[0].error : '');
      m.hidden = false;
    }).catch(function (e) { m.className = 'msg msg--err'; m.textContent = e.message; m.hidden = false; }).then(function () { b.disabled = false; });
  });

  // ---------------------------------------------------------------- event tab
  var form = $('[data-event-form]');
  var tzList = $('#tz-list');
  try {
    if (Intl.supportedValuesOf) tzList.innerHTML = Intl.supportedValuesOf('timeZone').map(function (z) { return '<option value="' + z + '">'; }).join('');
  } catch (e) { /* older browser */ }

  function renderEvent() {
    if (!form.contains(document.activeElement)) bindSettings(form);
    mood = ST.settings.moodboard.map(function (m) { return { src: m.src, caption: m.caption, note: m.note || '' }; });
    while (mood.length < 4) mood.push({ src: '', caption: '', note: '' });
    mood = mood.slice(0, 4);
    renderMood();
    var art = $('[data-art-preview]');
    art.src = 'og-default.jpg';
    var mu = ST.settings.musicUrl;
    $('[data-music-now]').textContent = mu ? 'Current track: ' + decodeURIComponent(mu.split('/').pop().split('?')[0]) : 'No music set.';
    if (document.activeElement !== $('[data-music-url]')) $('[data-music-url]').value = mu || '';
    $('[data-music-clear]').hidden = !mu;
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var m = $('[data-save-msg]'); m.hidden = true;
    api('PUT', '/api/host/settings', readSettings(form)).then(function (d) {
      ST = d; render();
      m.className = 'msg'; m.textContent = 'Saved. The invitation is updated. ✓'; m.hidden = false;
    }).catch(function (x) { m.className = 'msg msg--err'; m.textContent = x.message; m.hidden = false; });
  });

  // image helpers: resize on-device before upload
  function loadImage(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () { resolve(img); URL.revokeObjectURL(url); };
      img.onerror = function () { reject(new Error('That image couldn’t be read. Try a JPG or PNG.')); URL.revokeObjectURL(url); };
      img.src = url;
    });
  }
  function coverCrop(img, w, h, quality) {
    var c = document.createElement('canvas'); c.width = w; c.height = h;
    var ctx = c.getContext('2d');
    var s = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    var dw = img.naturalWidth * s, dh = img.naturalHeight * s;
    ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
    return new Promise(function (resolve) { c.toBlob(resolve, 'image/jpeg', quality || 0.84); });
  }
  function uploadBlob(blob, kind) {
    return api('POST', '/api/host/upload?kind=' + kind, undefined, blob).then(function (d) { return d.url; });
  }

  function renderMood() {
    $('[data-mood]').innerHTML = mood.map(function (m, i) {
      var thumb = m.src ? '<img src="' + esc(m.src) + '" alt="">' : (window.ART ? ART.plate(i) : '');
      return '<li data-i="' + i + '"><div class="thumb">' + thumb + '</div><div>' +
        '<input type="text" maxlength="24" value="' + esc(m.caption) + '" data-cap aria-label="Caption ' + (i + 1) + '">' +
        '<div class="row"><label class="b b--ghost file-b">' + (m.src ? 'Replace' : 'Upload photo') + '<input type="file" accept="image/*" data-mood-file></label>' +
        (m.src ? '<button class="b b--ghost" type="button" data-mood-clear>Use illustration</button>' : '') + '</div></div></li>';
    }).join('');
  }
  $('[data-mood]').addEventListener('input', function (e) {
    if (e.target.matches('[data-cap]')) mood[+e.target.closest('li').dataset.i].caption = e.target.value;
  });
  $('[data-mood]').addEventListener('click', function (e) {
    if (e.target.matches('[data-mood-clear]')) { mood[+e.target.closest('li').dataset.i].src = ''; renderMood(); }
  });
  $('[data-mood]').addEventListener('change', function (e) {
    if (!e.target.matches('[data-mood-file]') || !e.target.files[0]) return;
    var i = +e.target.closest('li').dataset.i;
    toast('Uploading…');
    loadImage(e.target.files[0]).then(function (img) { return coverCrop(img, 1080, 1350, 0.82); }).then(function (b) { return uploadBlob(b, 'image'); })
      .then(function (url) { mood[i].src = url; renderMood(); toast('Photo added. Tap “Save photos” to publish.'); })
      .catch(function (x) { toast(x.message); });
  });
  $('[data-save-mood]').addEventListener('click', function () {
    api('PUT', '/api/host/settings', { moodboard: mood }).then(function (d) { ST = d; render(); toast('Photos saved ✨'); }).catch(function (e) { toast(e.message); });
  });

  $('[data-art-file]').addEventListener('change', function (e) {
    if (!e.target.files[0]) return;
    toast('Uploading…');
    loadImage(e.target.files[0]).then(function (img) { return coverCrop(img, 1200, 630, 0.82); }).then(function (b) { return uploadBlob(b, 'image'); })
      .then(function (url) { return api('PUT', '/api/host/settings', { artworkUrl: url }); })
      .then(function (d) { ST = d; render(); toast('Preview artwork updated'); })
      .catch(function (x) { toast(x.message); });
    e.target.value = '';
  });
  $('[data-art-reset]').addEventListener('click', function () {
    api('PUT', '/api/host/settings', { artworkUrl: '' }).then(function (d) { ST = d; render(); toast('Using the default artwork'); });
  });
  $('[data-music-file]').addEventListener('change', function (e) {
    var f = e.target.files[0];
    if (!f) return;
    if (f.size > 15 * 1024 * 1024) { toast('That track is over 15 MB. Try a shorter or smaller file.'); return; }
    toast('Uploading track…');
    uploadBlob(f, 'audio').then(function (url) { return api('PUT', '/api/host/settings', { musicUrl: url }); })
      .then(function (d) { ST = d; render(); toast('Music added 🎶'); }).catch(function (x) { toast(x.message); });
    e.target.value = '';
  });
  $('[data-music-save]').addEventListener('click', function () {
    var u = $('[data-music-url]').value.trim();
    if (u && !/^https:\/\//.test(u)) { toast('The link must start with https://'); return; }
    api('PUT', '/api/host/settings', { musicUrl: u }).then(function (d) { ST = d; render(); toast(u ? 'Music saved 🎶' : 'Music removed'); }).catch(function (e) { toast(e.message); });
  });
  $('[data-music-clear]').addEventListener('click', function () {
    api('PUT', '/api/host/settings', { musicUrl: '' }).then(function (d) { ST = d; render(); toast('Music removed'); });
  });

  // ---------------------------------------------------------------- boot
  document.addEventListener('DOMContentLoaded', function () {
    if (window.ART) $('#sprite').innerHTML = ART.sprite();
  });
  if (window.ART) $('#sprite').innerHTML = ART.sprite();
  var startTab = 'overview';
  try { startTab = sessionStorage.getItem('hostTab') || 'overview'; } catch (e) { /* ignore */ }
  showTab(startTab);
  load();
  setInterval(function () { if (!document.hidden && ST && !$('[data-app]').hidden && !document.querySelector('.modal:not([hidden])')) api('GET', '/api/host/state').then(function (d) { var focused = document.activeElement && document.activeElement.closest('form, [data-add], [data-mood]'); ST = d; if (!focused) render(); }).catch(function () {}); }, 60000);
})();
