/* Guest-facing invitation. Data arrives in window.__BOOT__ (rendered by the server). */
(function () {
  'use strict';

  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  var S = window.__BOOT__;
  var MOCK = window.__MOCK_API__ || null;
  var STATIC = !MOCK && window.__STATIC_API__ ? window.__STATIC_API__ : null; // free version: Google Apps Script back end
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var startedOpen = S.mode === 'open';
  var body = document.body;

  var ls = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } },
  };

  // Guests who registered through the general link get sent back to their own invitation.
  if (!MOCK && !STATIC && S.mode === 'open') {
    var saved = ls.get('inv_token');
    if (saved && /^[A-Za-z0-9_-]{16,64}$/.test(saved)) { location.replace('/i/' + saved); return; }
  }
  if (S.mode === 'invalid') ls.del('inv_token');

  function personalLink(token) { return STATIC ? STATIC.personalLink(token) : location.origin + '/i/' + token; }
  var API = MOCK || STATIC || {
    rsvp: function (payload) {
      return fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'same-origin',
      }).then(function (r) {
        return r.json().catch(function () { return { error: 'Unexpected response from the server.' }; }).then(function (data) {
          if (!r.ok) {
            var err = new Error(data.error || 'Something went wrong. Please try again.');
            err.fields = data.fields; err.code = data.code; err.status = r.status;
            throw err;
          }
          return data;
        });
      });
    },
    icsUrl: function (token) { return '/calendar.ics' + (token ? '?t=' + encodeURIComponent(token) : ''); },
    // Host-only (the server checks the signed-in host session).
    saveSettings: function (patch) {
      return fetch('/api/host/settings', {
        method: 'PUT', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', 'x-host-request': '1' },
        body: JSON.stringify(patch),
      }).then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (d) {
          if (r.status === 401) throw new Error('Your host session has ended. Sign in at /host again, then reopen this page.');
          if (!r.ok) throw new Error(d.error || 'Couldn’t save that change.');
          return d;
        });
      });
    },
    upload: function (blob) {
      return fetch('/api/host/upload?kind=image', {
        method: 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': blob.type || 'image/jpeg', 'x-host-request': '1' },
        body: blob,
      }).then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (d) {
          if (!r.ok) throw new Error(d.error || 'Couldn’t upload that photo.');
          return d.url;
        });
      });
    },
  };

  var PH = {
    name: '[INSERT EVENT NAME]', names: '[INSERT BOTH BIRTHDAY GIRLS’ NAMES]', host: '[INSERT HOST NAME]',
    date: '[INSERT EVENT DATE]', time: '[INSERT START TIME]', area: '[INSERT GENERAL LOCATION]',
    address: '[INSERT AIRBNB ADDRESS]', deadline: '[INSERT DEADLINE]',
  };
  var DEFAULT_PHOTOS = [
    { caption: 'the flowers', note: 'blooms for the birthday girls' },
    { caption: 'candlelight', note: 'candles lit, music on' },
    { caption: 'cheers to us', note: 'food & drinks sorted' },
    { caption: 'game night', note: 'winner picks the next song' },
  ];
  var DEFAULT_TEXTS = {
    linerScript: 'cheers to the twins', tape: 'for {name} ♡', kicker: 'Please join us to celebrate',
    byobTitle: 'UGX 150,000', byobText: 'Per person. Covers food, drinks & all the fun.', byobBack: 'Send it by Mobile Money to any of Asherbell’s numbers ♡',
    gamesTitle: 'Got games?', gamesText: 'Bring your favourites along!', gamesBack: 'Cards, board games, anything that gets everyone laughing.',
    comfyTitle: 'Come comfortable', comfyText: 'No dress code. Just good vibes.', comfyBack: 'Sneakers, sundress or sweats. You do you.',
  };
  function texts() { var t = {}, src = (S.event && S.event.texts) || {}; Object.keys(DEFAULT_TEXTS).forEach(function (k) { t[k] = src[k] != null && src[k] !== '' ? (src[k] === ' ' ? '' : src[k]) : DEFAULT_TEXTS[k]; }); return t; }
  function photos() {
    var list = ((S.event && S.event.moodboard) || []).slice(0, 4).map(function (m, i) { return { src: m.src || '', caption: m.caption || '', note: m.note != null ? m.note : (DEFAULT_PHOTOS[i] || {}).note || '' }; });
    while (list.length < 4) list.push({ src: '', caption: DEFAULT_PHOTOS[list.length].caption, note: DEFAULT_PHOTOS[list.length].note });
    return list;
  }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function slot(name) { return $$('[data-slot="' + name + '"]'); }
  function setText(name, value, placeholder) {
    slot(name).forEach(function (el) {
      el.textContent = value || placeholder || '';
      el.classList.toggle('is-placeholder', !value && !!placeholder);
    });
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  var toastTimer;
  function toast(msg, ms) {
    var t = $('[data-toast]');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, ms || 2800);
  }
  function openExternal(url) {
    var a = document.createElement('a');
    a.href = url; a.target = '_blank'; a.rel = 'noopener';
    document.body.appendChild(a); a.click(); a.remove();
  }
  function isNote() { return S.mode === 'invalid' || S.mode === 'closed'; }
  function firstName() { return S.guest ? S.guest.firstName : ''; }
  var lockSvg = '<svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>';

  // ------------------------------------------------------------------ artwork
  body.insertAdjacentHTML('afterbegin', window.ART.sprite());
  var ARTS = {
    'stamp-rose': function () { return ART.stamp('rose'); },
    'stamp-heart': function () { return ART.stamp('heart'); },
    'stamp-cherries': function () { return ART.stamp('cherries'); },
    seal: ART.seal, cherries: ART.cherries, two: ART.twoOfHearts, cardback: ART.cardBack, sparkles: function () { return ART.sparkles('#3B0C13'); },
    kiss: function () { return ART.kiss('#8C2B35'); }, 'kiss-dark': function () { return ART.kiss('#2A080D'); }, candles: ART.candles,
  };
  $$('[data-art]').forEach(function (el) { var f = ARTS[el.dataset.art]; if (f) el.innerHTML = f(); });
  $('.liner').innerHTML = '<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="lnr" x1="0" y1="0" x2=".5" y2="1">' +
    '<stop offset="0" stop-color="#82222F"/><stop offset=".55" stop-color="#6B1824"/><stop offset="1" stop-color="#561320"/></linearGradient></defs>' +
    '<path d="M0 19L50 0L100 19V100H0Z" fill="url(#lnr)"/>' +
    '<path d="M3.5 20.4L50 3.6L96.5 20.4V97H3.5Z" fill="none" stroke="#F5E3B5" stroke-opacity=".3" stroke-width="1" vector-effect="non-scaling-stroke"/></svg>';

  // ------------------------------------------------------------------ envelope + main card
  function splitTitle(name) {
    var words = name.split(/\s+/);
    if (words.length < 3) return [name];
    var best = 1, diff = Infinity;
    for (var i = 1; i < words.length; i++) {
      var d = Math.abs(words.slice(0, i).join(' ').length - words.slice(i).join(' ').length);
      if (d < diff) { diff = d; best = i; }
    }
    return [words.slice(0, best).join(' '), words.slice(best).join(' ')];
  }

  function renderEnvelope() {
    var e = S.event || {};
    setText('env-date', e.numericDate, PH.date);
    setText('env-to', S.guest && firstName() ? 'for ' + firstName() : '');
    setText('ec-title', e.name || 'You’re invited');
    var note = $('[data-op-note]');
    if (S.mode === 'invalid') {
      setText('env-script', 'oh dear');
      setText('env-date', 'THIS LINK HAS WANDERED OFF');
      note.innerHTML = 'Double-check the link you were sent, or ask the hosts for a fresh one.' + (e.openInvite ? '<br><a href="/">Open the general invitation</a>' : '');
      note.hidden = false;
      $('[data-open]').hidden = true;
    } else if (S.mode === 'closed') {
      setText('env-date', 'BY PERSONAL INVITATION');
      note.textContent = 'Check your messages for your own link 💌';
      note.hidden = false;
      $('[data-open]').hidden = true;
    }
  }

  function renderCollage() {
    var e = S.event;
    var title = $('[data-slot="title"]');
    if (e.name) {
      var lines = splitTitle(e.name);
      var longest = Math.max.apply(null, lines.map(function (l) { return l.length; }));
      var size = longest <= 7 ? 'clamp(48px, 15vw, 72px)' : longest <= 10 ? 'clamp(40px, 12.5vw, 60px)' : longest <= 14 ? 'clamp(34px, 10vw, 50px)' : 'clamp(28px, 8vw, 40px)';
      title.style.setProperty('--title-size', size);
      title.innerHTML = lines.map(function (l) { return '<span>' + esc(l) + '</span>'; }).join('');
      title.classList.remove('is-placeholder');
    } else {
      title.textContent = PH.name;
      title.style.setProperty('--title-size', '22px');
      title.classList.add('is-placeholder');
    }
    setText('tagline', e.tagline);
    setText('names', e.celebrants, PH.names);
    setText('ldate', e.longDateLabel, PH.date);
    // Each guest's personal link fills in their own first name; the general link says "you".
    var who = S.guest && firstName() ? firstName() : 'you';
    var tapeText = (texts().tape || DEFAULT_TEXTS.tape).replace(/\{name\}/gi, who);
    var tape = slot('tape')[0];
    tape.textContent = tapeText;
    tape.hidden = !tapeText.trim();
    setText('signoff', e.host ? 'with love, ' + e.host : '');

    var t = texts();
    $$('[data-text]').forEach(function (el) { el.textContent = t[el.dataset.text] || ''; });
    renderPolaroids();
    renderAmp();
  }

  // ------------------------------------------------------------------ the "&" between the photos
  var AMP_DEFAULT = { text: '&', x: 50, y: 47, size: 26, color: 'canvas', show: true };
  var AMP_COLORS = { canvas: '#FAF6EF', ivory: '#F5E3B5', pink: '#EBBDB1', burgundy: '#3B0C13' };
  var ampEl = $('[data-amp]');
  var collageEl = $('.collage');
  function ampState() { var a = {}, src = (S.event && S.event.amp) || {}; Object.keys(AMP_DEFAULT).forEach(function (k) { a[k] = src[k] != null ? src[k] : AMP_DEFAULT[k]; }); return a; }
  function renderAmp(a) {
    a = a || ampState();
    $('[data-amp-ch]').textContent = a.text || '&';
    ampEl.setAttribute('aria-label', a.text === '&' ? 'and' : a.text);
    ampEl.style.left = a.x + '%';
    ampEl.style.top = a.y + '%';
    ampEl.style.color = AMP_COLORS[a.color] || AMP_COLORS.canvas;
    ampEl.style.textShadow = a.color === 'burgundy' ? '0 2px 6px rgba(255,255,255,.35)' : '';
    var w = collageEl.clientWidth || Math.min(innerWidth, 520) - 32;
    ampEl.style.fontSize = (w * a.size / 100).toFixed(1) + 'px';
    ampEl.classList.toggle('is-off', !a.show);
  }
  window.addEventListener('resize', function () { renderAmp(); });

  function renderPolaroids() {
    var list = photos();
    var short = S.event.numericDate ? S.event.numericDate.replace(/\.(\d{2})(\d{2})$/, '.$2') : '21.11.26';
    $$('[data-polaroid]').forEach(function (fig) {
      var i = +fig.dataset.polaroid;
      var m = list[i];
      var art = m.src
        ? '<img src="' + esc(m.src) + '" alt="' + esc(m.caption || 'Photo') + '" loading="' + (i < 2 ? 'eager' : 'lazy') + '" decoding="async">'
        : ART.plate(i);
      fig.classList.remove('flipped');
      fig.innerHTML = '<button class="pol-flip" type="button" aria-label="' + esc((m.caption || 'Photo') + ', tap to turn over') + '" aria-pressed="false">' +
        '<span class="pol-face pol-front"><span class="ph" data-px-img>' + art + '</span><span class="pol-cap">' + (m.caption ? esc(m.caption) : '&nbsp;') + '</span></span>' +
        '<span class="pol-face pol-back"><span class="pol-note">' + esc(m.note || '♡') + '</span><span class="pol-stamp">' + esc(short) + '</span></span></button>';
    });
  }

  // ------------------------------------------------------------------ details
  function renderDetails() {
    var e = S.event;
    setText('d-date', e.dateLabel, PH.date);
    setText('d-time', e.timeLabel ? e.timeLabel + (e.endTimeLabel ? ' – ' + e.endTimeLabel : ' till late') : '', PH.time);
    setText('d-venue', e.venue || 'Private Airbnb');
    setText('d-deadline', e.deadlineLabel, PH.deadline);
    var loc = slot('d-location')[0];
    var area = e.area ? esc(e.area) : '<span class="is-placeholder">' + PH.area + '</span>';
    if (S.location && S.location.address) {
      loc.innerHTML = esc(S.location.address) + (S.location.mapsUrl ? '<br><a href="' + esc(S.location.mapsUrl) + '" target="_blank" rel="noopener">Get directions →</a>' : '');
    } else if (S.locationLocked) {
      loc.innerHTML = area + '<small>' + lockSvg + 'Exact address shared once you RSVP.</small>';
    } else {
      loc.innerHTML = area;
    }
    $$('[data-directions]').forEach(function (b) { b.classList.toggle('is-locked', !(S.location && S.location.mapsUrl)); });
    slot('rsvp-by')[0].textContent = e.deadlineLabel ? 'Kindly reply by ' + e.deadlineLabel : '';
    setText('closed-msg', e.deadlineLabel ? 'RSVPs closed on ' + e.deadlineLabel + '. If your plans have changed, message ' + (e.host || 'the hosts') + ' directly.' : 'Message the hosts directly if your plans have changed.');
    tick();
  }

  var cd = $('[data-countdown]');
  function tick() {
    var e = S.event;
    if (!cd) return;
    if (!e.startUtc) { cd.innerHTML = ''; return; }
    var now = Date.now();
    if (now >= e.endUtc) { cd.innerHTML = '<span class="msg">What a celebration. Thank you for coming 💕</span>'; return; }
    if (now >= e.startUtc) { cd.innerHTML = '<span class="msg">It’s happening right now! 🥂</span>'; return; }
    var diff = Math.floor((e.startUtc - now) / 60000);
    var d = Math.floor(diff / 1440), h = Math.floor((diff % 1440) / 60), m = diff % 60;
    cd.setAttribute('aria-label', d + ' days, ' + h + ' hours and ' + m + ' minutes to go');
    cd.innerHTML = '<div class="u"><b>' + pad(d) + '</b><small>Days</small></div><span class="sep">:</span>' +
      '<div class="u"><b>' + pad(h) + '</b><small>Hours</small></div><span class="sep">:</span>' +
      '<div class="u"><b>' + pad(m) + '</b><small>Mins</small></div>';
  }
  setInterval(function () { if (!document.hidden) tick(); }, 20000);

  // ------------------------------------------------------------------ the RSVP card on the canvas
  var card = $('[data-rsvp-card]');
  function renderReplyCard() {
    var g = S.guest, e = S.event;
    var t = { top: 'Kindly', script: 'Rsvp', bottom: 'here', note: 'Tap to reply ♡', label: 'RSVP' + (e.deadlineLabel ? ', kindly reply by ' + e.deadlineLabel : '') };
    if (g && g.status === 'attending') t = { top: 'You’re', script: 'on the list', bottom: 'confirmed ✓', note: 'Tap for your guest pass', label: 'You’re on the list. Open your guest pass' };
    else if (g && g.status === 'declined') t = { top: 'Thank you', script: 'for replying', bottom: 'we’ll miss you', note: 'Changed your mind? Tap to update', label: 'Update your RSVP' };
    else if (!e.rsvpOpen) t = { top: 'RSVPs', script: 'closed', bottom: '', note: 'Message the hosts if your plans changed', label: 'RSVPs are closed' };
    $('[data-rc="top"]').textContent = t.top;
    $('[data-rc="script"]').textContent = t.script;
    $('[data-rc="bottom"]').textContent = t.bottom;
    $('[data-rc="bottom"]').hidden = !t.bottom;
    $('[data-rc="note"]').textContent = t.note;
    card.setAttribute('aria-label', t.label);
    card.classList.toggle('is-done', !!(g && g.status !== 'pending'));
  }
  card.addEventListener('click', function () {
    if (editing) { toast('Tap Done to try the RSVP card.'); return; }
    openSheet(currentView());
  });

  // ------------------------------------------------------------------ the sheet
  var sheet = $('[data-sheet]');
  var rsvp = $('[data-rsvp]');
  var formYes = $('[data-pane="yes"]');
  var formNo = $('[data-pane="no"]');
  var lastFocus = null;

  function openSheet(view) {
    lastFocus = document.activeElement;
    prefill();
    setView(view || currentView(), false);
    sheet.hidden = false;
    body.style.overflow = 'hidden';
    setTimeout(function () { var f = $('.rsvp-pane:not([hidden]) button, .sheet-x', sheet); try { $('.sheet-x', sheet).focus({ preventScroll: true }); } catch (e) { /* ignore */ } }, 60);
    updateFab();
  }
  function closeSheet() {
    sheet.hidden = true;
    body.style.overflow = '';
    $('[data-cal-menu]').hidden = true;
    if (lastFocus && lastFocus.focus) try { lastFocus.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
    updateFab();
  }
  $('[data-close-sheet]').addEventListener('click', closeSheet);
  sheet.addEventListener('click', function (ev) { if (ev.target === sheet) closeSheet(); });

  function maxParty() { return S.guest ? S.guest.maxParty : (S.event.openMaxParty || 1); }
  function currentView() {
    var g = S.guest;
    if (g && g.status === 'attending') return 'done-yes';
    if (g && g.status === 'declined') return 'done-no';
    if (!S.event.rsvpOpen) return 'closed';
    return 'choose';
  }
  function setView(v, focus) {
    rsvp.dataset.view = v;
    $('.sheet-card', sheet).scrollTop = 0;
    if (focus) {
      var pane = $('[data-pane="' + v + '"]', rsvp);
      setTimeout(function () {
        var nameInput = $('input[name="name"]', pane);
        var target = nameInput && !nameInput.value ? nameInput : pane;
        if (target === pane) pane.setAttribute('tabindex', '-1');
        try { target.focus({ preventScroll: true }); } catch (e) { target.focus(); }
      }, 80);
    }
  }

  function prefill() {
    var g = S.guest;
    [formYes, formNo].forEach(function (f) { f.elements.name.value = g ? g.name : ''; });
    party = g && g.partySize ? Math.min(g.partySize, maxParty()) : 1;
    renderParty();
    var bring = !!(g && g.bringingGame);
    formYes.querySelector('input[name="bringingGame"][value="' + (bring ? 'yes' : 'no') + '"]').checked = true;
    formYes.elements.game.value = g ? g.game || '' : '';
    formYes.elements.game.hidden = !bring;
    [formYes, formNo].forEach(function (f) {
      var msg = g ? g.message || '' : '';
      f.elements.message.value = msg;
      f.elements.message.hidden = !msg;
      $('[data-note-toggle]', f).hidden = !!msg;
    });
    var cur = $('[data-current]');
    if (g && g.status === 'attending') { cur.hidden = false; cur.textContent = 'You’re currently confirmed' + (g.partySize > 1 ? ' for ' + g.partySize : '') + '. Change anything below.'; }
    else if (g && g.status === 'declined') { cur.hidden = false; cur.textContent = 'You’d said you can’t make it. Change of plans?'; }
    else cur.hidden = true;
  }


  var party = 1;
  function renderParty() {
    var max = maxParty();
    $('[data-party]').hidden = max <= 1;
    $('[data-party-out]').textContent = party;
    $('[data-party-hint]').textContent = '(including you, up to ' + max + ')';
    $('[data-step="-1"]').disabled = party <= 1;
    $('[data-step="1"]').disabled = party >= max;
  }
  $$('[data-step]').forEach(function (b) {
    b.addEventListener('click', function () { party = Math.max(1, Math.min(maxParty(), party + Number(b.dataset.step))); renderParty(); });
  });
  $$('input[name="bringingGame"]').forEach(function (r) {
    r.addEventListener('change', function () {
      var yes = formYes.querySelector('input[name="bringingGame"]:checked').value === 'yes';
      formYes.elements.game.hidden = !yes;
      if (yes) formYes.elements.game.focus();
    });
  });
  $$('[data-note-toggle]').forEach(function (b) {
    b.addEventListener('click', function () { var ta = b.parentNode.querySelector('textarea'); ta.hidden = false; b.hidden = true; ta.focus(); });
  });
  $$('[data-choice]').forEach(function (b) {
    b.addEventListener('click', function () {
      if (b.dataset.choice === 'yes') { burst(b, ['♥', '♡', '✦'], { n: 12 }); setTimeout(function () { setView('yes', true); }, 260); }
      else { replay(b, 'shake'); setTimeout(function () { setView('no', true); }, 380); }
    });
  });
  $$('[data-back]').forEach(function (b) { b.addEventListener('click', function () { setView('choose'); }); });
  $$('[data-update]').forEach(function (b) {
    b.addEventListener('click', function () {
      if (!S.event.rsvpOpen) { toast('RSVPs are closed now. Message the hosts if your plans changed.'); return; }
      prefill();
      setView('choose');
    });
  });

  function clearErrors(form) {
    $$('[data-err]', form).forEach(function (e) { e.textContent = ''; });
    $$('.has-error', form).forEach(function (e) { e.classList.remove('has-error'); });
    var fe = $('[data-form-error]', form); fe.hidden = true; fe.textContent = '';
  }
  function showErrors(form, fields, message) {
    var first = null;
    Object.keys(fields || {}).forEach(function (k) {
      var slotEl = $('[data-err="' + k + '"]', form);
      if (!slotEl) return;
      slotEl.textContent = fields[k];
      var field = slotEl.closest('.field');
      if (field) field.classList.add('has-error');
      if (!first) first = form.elements[k] && form.elements[k].focus ? form.elements[k] : null;
    });
    if (message) { var fe = $('[data-form-error]', form); fe.textContent = message; fe.hidden = false; }
    if (first) first.focus(); else if (message) $('[data-form-error]', form).scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  function validate(form, attending) {
    var f = {};
    if (form.elements.name.value.trim().length < 2) f.name = 'Please add your name.';
    return f;
  }
  function rid() { return (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2); }

  function submitForm(form, attending) {
    clearErrors(form);
    var fields = validate(form, attending);
    if (Object.keys(fields).length) { showErrors(form, fields); return; }
    var btn = $('[data-submit]', form);
    var label = btn.innerHTML;
    btn.classList.add('is-busy');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner" aria-hidden="true"></span> Saving…';
    form._rid = form._rid || rid();
    var payload = { token: S.token || undefined, attending: attending, name: form.elements.name.value.trim(), message: form.elements.message.value.trim(), requestId: form._rid };
    if (attending) {
      payload.partySize = party;
      payload.bringingGame = form.querySelector('input[name="bringingGame"]:checked').value === 'yes';
      payload.game = payload.bringingGame ? form.elements.game.value.trim() : '';
    }
    API.rsvp(payload).then(function (res) {
      form._rid = null;
      S = res;
      if (startedOpen && S.token) {
        ls.set('inv_token', S.token);
        if (!MOCK && history.replaceState) history.replaceState(null, '', personalLink(S.token));
      }
      ls.set('inv_opened:' + S.token, '1');
      renderDetails();
      renderCollage();
      renderReplyCard();
      renderPass();
      setView(currentView(), false);
      if (attending) petals();
      updateFab();
      var pane = $('[data-pane="' + currentView() + '"]');
      setTimeout(function () { try { pane.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }, 400);
    }).catch(function (err) {
      var msg = err.message;
      if (!err.status) msg = navigator.onLine === false ? 'You seem to be offline. Check your connection and try again.' : 'We couldn’t reach the invitation just now. Please try again.';
      showErrors(form, err.fields, msg);
      if (err.code === 'deadline' || err.code === 'invalid_token') form._rid = null;
    }).then(function () {
      btn.classList.remove('is-busy');
      btn.disabled = false;
      btn.innerHTML = label;
    });
  }
  formYes.addEventListener('submit', function (ev) { ev.preventDefault(); submitForm(formYes, true); });
  formNo.addEventListener('submit', function (ev) { ev.preventDefault(); submitForm(formNo, false); });

  // ------------------------------------------------------------------ confirmation, pass, calendar, directions
  function locationText() { return (S.location && S.location.address) ? S.location.address : (S.event.area || PH.address); }
  function renderPass() {
    var e = S.event, g = S.guest;
    if (!g) return;
    setText('p-event', e.name, PH.name);
    setText('p-guest', g.name);
    setText('p-party-lbl', g.partySize > 1 ? 'Party of' : 'Plus-ones');
    setText('p-party', g.partySize > 1 ? String(g.partySize) : 'Just me');
    setText('p-date', e.shortDateLabel, PH.date);
    setText('p-time', e.timeLabel ? e.timeLabel + (e.endTimeLabel ? '' : ' till late') : '', PH.time);
    setText('p-location', locationText());
    if (startedOpen && S.token) {
      $('[data-mylink]').hidden = false;
      var myLink = MOCK ? location.href.split('#')[0] : personalLink(S.token);
      $('[data-mylink-input]').value = myLink;
      $('[data-mylink-wa]').href = 'https://wa.me/?text=' + encodeURIComponent('My invitation to ' + (e.name || 'the party') + ' 💌 (guest pass & RSVP): ' + myLink);
    }
  }
  $('[data-copy-link]').addEventListener('click', function () {
    var input = $('[data-mylink-input]');
    var done = function () { toast('Link copied ✨'); };
    var fallback = function () { input.select(); try { document.execCommand('copy'); } catch (e) { /* ignore */ } done(); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(input.value).then(done, fallback); else fallback();
  });

  function petals() {
    if (reduced) return;
    var box = $('[data-petals]');
    box.innerHTML = '';
    for (var i = 0; i < 22; i++) {
      var p = document.createElement('i');
      p.className = 'petal';
      p.style.left = Math.random() * 100 + '%';
      p.style.setProperty('--d', (3.6 + Math.random() * 2.8).toFixed(2) + 's');
      p.style.setProperty('--delay', (Math.random() * 1.4).toFixed(2) + 's');
      p.style.setProperty('--x', (Math.random() * 120 - 60).toFixed(0) + 'px');
      p.style.setProperty('--r', (Math.random() * 540 - 270).toFixed(0) + 'deg');
      box.appendChild(p);
    }
    setTimeout(function () { box.innerHTML = ''; }, 7500);
  }

  function gcalDate(ms) { return new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); }
  var calMenu = $('[data-cal-menu]');
  $('[data-cal-toggle]').addEventListener('click', function () {
    var e = S.event;
    if (!e.startUtc) { toast('The date hasn’t been set yet. Check back soon!'); return; }
    var where = S.location && S.location.address ? S.location.address : [e.venue, e.area].filter(Boolean).join(', ');
    var details = [e.host ? 'Hosted by ' + e.host + '.' : '', 'Your invitation: ' + location.href.split('#')[0]].filter(Boolean).join('\n');
    $('[data-cal="google"]').href = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent(e.name || 'Birthday') +
      '&dates=' + gcalDate(e.startUtc) + '/' + gcalDate(e.endUtc) + '&details=' + encodeURIComponent(details) + '&location=' + encodeURIComponent(where);
    var ics = API.icsUrl(S.token, S);
    var icsA = $('[data-cal="ics"]');
    if (ics) { icsA.href = ics; if (!/^\//.test(ics)) icsA.setAttribute('download', 'save-the-date.ics'); } else icsA.hidden = true;
    calMenu.hidden = !calMenu.hidden;
    this.setAttribute('aria-expanded', String(!calMenu.hidden));
  });
  $$('[data-directions]').forEach(function (b) {
    b.addEventListener('click', function () {
      if (S.location && S.location.mapsUrl) { openExternal(S.location.mapsUrl); return; }
      toast(S.guest && S.guest.status === 'attending' ? 'The hosts haven’t added the address yet. Check back soon!' : 'Directions unlock once you RSVP 💖');
    });
  });

  // Draw the pass onto a canvas so guests can keep it as an image.
  function spaced(ctx, text, x, y, spacing, align) {
    var chars = Array.from(text);
    var w = chars.reduce(function (a, c) { return a + ctx.measureText(c).width + spacing; }, -spacing);
    var cx = align === 'center' ? x - w / 2 : x;
    ctx.textAlign = 'left';
    chars.forEach(function (c) { ctx.fillText(c, cx, y); cx += ctx.measureText(c).width + spacing; });
  }
  function wrap(ctx, text, maxW) {
    var words = String(text).split(/\s+/), lines = [], line = '';
    words.forEach(function (w) {
      var test = line ? line + ' ' + w : w;
      if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test;
    });
    if (line) lines.push(line);
    return lines;
  }
  function loadSvg(svg) {
    return new Promise(function (resolve) {
      var img = new Image();
      var url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
      img.onload = function () { resolve(img); URL.revokeObjectURL(url); };
      img.onerror = function () { resolve(null); URL.revokeObjectURL(url); };
      img.src = url;
    });
  }
  function drawPass() {
    var W = 1080, H = 1560;
    var e = S.event, g = S.guest;
    var script = '"Pinyon Script", "Snell Roundhand", cursive', serif = '"Cormorant Garamond", Georgia, serif';
    var fonts = document.fonts ? Promise.all([
      document.fonts.load('400 96px "Pinyon Script"'), document.fonts.load('600 26px "Cormorant Garamond"'),
      document.fonts.load('500 40px "Cormorant Garamond"'), document.fonts.load('italic 500 40px "Cormorant Garamond"'),
    ]).catch(function () {}) : Promise.resolve();
    var timeout = new Promise(function (r) { setTimeout(r, 2500); });
    return Promise.race([fonts, timeout]).then(function () {
      return Promise.all([loadSvg(ART.stamp('cherries')), loadSvg(ART.stamp('rose')), loadSvg(ART.kiss('#8C2B35')), loadSvg(ART.kiss('#2A080D')), loadSvg(ART.cherries()), loadSvg(ART.sparkles('#3B0C13'))]);
    }).then(function (img) {
      var c = document.createElement('canvas');
      c.width = W; c.height = H;
      var ctx = c.getContext('2d');
      ctx.fillStyle = '#FAF6EF'; ctx.fillRect(0, 0, W, H);
      var glow = ctx.createRadialGradient(0, 0, 10, 0, 0, 700);
      glow.addColorStop(0, 'rgba(235,189,177,.35)'); glow.addColorStop(1, 'rgba(235,189,177,0)');
      ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = '#3B0C13'; ctx.font = '400 96px ' + script; ctx.textAlign = 'center';
      ctx.fillText('You’re on the list', W / 2, 190);

      var TX = 130, TW = 820, TY = 260, PX = 70;
      ctx.font = '400 86px ' + script;
      var nameLines = wrap(ctx, e.name || PH.name, TW - PX * 2 - 200).slice(0, 2);
      ctx.font = '500 38px ' + serif;
      var locLines = wrap(ctx, locationText(), TW - PX * 2).slice(0, 3);
      var perfY = TY + 150 + nameLines.length * 88;
      var rowsY = perfY + 80;
      var TH = (rowsY - TY) + 3 * 118 + 60 + locLines.length * 48 + (e.host ? 150 : 70);

      ctx.save();
      ctx.shadowColor = 'rgba(59,12,19,.4)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 26;
      var grad = ctx.createLinearGradient(TX, TY, TX + TW * 0.4, TY + TH);
      grad.addColorStop(0, '#82222F'); grad.addColorStop(0.5, '#6B1824'); grad.addColorStop(1, '#561320');
      ctx.fillStyle = grad; ctx.fillRect(TX, TY, TW, TH);
      ctx.restore();
      ctx.strokeStyle = 'rgba(245,227,181,.25)'; ctx.lineWidth = 2; ctx.strokeRect(TX + 18, TY + 18, TW - 36, TH - 36);

      ctx.fillStyle = '#EBBDB1'; ctx.font = '600 26px ' + serif;
      spaced(ctx, 'OFFICIAL GUEST PASS', TX + PX, TY + 100, 8, 'left');
      ctx.fillStyle = '#F5E3B5'; ctx.font = '400 86px ' + script; ctx.textAlign = 'left';
      nameLines.forEach(function (l, i) { ctx.fillText(l, TX + PX, TY + 205 + i * 88); });

      ctx.fillStyle = '#FAF6EF';
      ctx.beginPath(); ctx.arc(TX, perfY, 24, 0, Math.PI * 2); ctx.arc(TX + TW, perfY, 24, 0, Math.PI * 2); ctx.fill();
      ctx.setLineDash([12, 12]); ctx.strokeStyle = 'rgba(245,227,181,.4)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(TX + 44, perfY); ctx.lineTo(TX + TW - 44, perfY); ctx.stroke(); ctx.setLineDash([]);

      function field(label, value, x, y, color, font) {
        ctx.fillStyle = '#EBBDB1'; ctx.font = '600 22px ' + serif; spaced(ctx, label.toUpperCase(), x, y, 6, 'left');
        ctx.fillStyle = color || '#F5E3B5'; ctx.font = font || ('500 40px ' + serif); ctx.textAlign = 'left';
        ctx.fillText(wrap(ctx, value, TW - PX * 2)[0] || '', x, y + 54);
      }
      var L = TX + PX, R = TX + TW / 2 + 20, y = rowsY;
      field('Guest', g.name, L, y, '#F5E3B5', 'italic 500 50px ' + serif); y += 118;
      field('Status', 'Confirmed ✓', L, y, '#D6DC9E');
      field(g.partySize > 1 ? 'Party of' : 'Plus-ones', g.partySize > 1 ? String(g.partySize) : 'Just me', R, y); y += 118;
      field('Date', e.shortDateLabel || PH.date, L, y);
      field('Time', e.timeLabel ? e.timeLabel + (e.endTimeLabel ? '' : ' till late') : PH.time, R, y); y += 118;
      ctx.fillStyle = '#EBBDB1'; ctx.font = '600 22px ' + serif; spaced(ctx, 'LOCATION', L, y, 6, 'left');
      ctx.fillStyle = '#F5E3B5'; ctx.font = '500 38px ' + serif; ctx.textAlign = 'left';
      locLines.forEach(function (l, i) { ctx.fillText(l, L, y + 54 + i * 48); });
      if (e.host) { ctx.fillStyle = '#EBBDB1'; ctx.font = '400 56px ' + script; ctx.textAlign = 'right'; ctx.fillText('with love, ' + e.host, TX + TW - PX, TY + TH - 60); }

      if (img[0]) { ctx.save(); ctx.translate(TX + TW - 200, TY + 44); ctx.rotate(-0.06); ctx.drawImage(img[0], 0, 0, 96, 115); ctx.restore(); }
      if (img[1]) { ctx.save(); ctx.translate(TX + TW - 110, TY + 50); ctx.rotate(0.1); ctx.drawImage(img[1], 0, 0, 96, 115); ctx.restore(); }
      if (img[3]) { ctx.save(); ctx.translate(TX + 40, TY + TH + 20); ctx.rotate(-0.25); ctx.drawImage(img[3], -80, -50, 170, 108); ctx.restore(); }
      if (img[2]) { ctx.save(); ctx.translate(TX + 190, TY + TH + 40); ctx.rotate(0.3); ctx.drawImage(img[2], -70, -45, 150, 95); ctx.restore(); }
      if (img[4]) { ctx.save(); ctx.translate(TX + TW + 10, TY + TH - 30); ctx.rotate(0.2); ctx.drawImage(img[4], -70, -80, 150, 190); ctx.restore(); }
      if (img[5]) ctx.drawImage(img[5], 70, 70, 120, 96);

      ctx.fillStyle = '#6E3B41'; ctx.font = 'italic 500 40px ' + serif; ctx.textAlign = 'center';
      ctx.fillText('Can’t wait to see you there!', W / 2, Math.min(H - 70, TY + TH + 150));
      return new Promise(function (resolve, reject) { c.toBlob(function (b) { b ? resolve(b) : reject(new Error('toBlob failed')); }, 'image/png'); });
    });
  }

  var modal = $('[data-pass-modal]');
  var passUrl = null, passFile = null;
  $('[data-save-pass]').addEventListener('click', function () {
    modal.hidden = false;
    var img = $('[data-pass-img]');
    img.removeAttribute('src');
    $('[data-pass-loading]').hidden = false;
    drawPass().then(function (blob) {
      if (passUrl) URL.revokeObjectURL(passUrl);
      passUrl = URL.createObjectURL(blob);
      img.src = passUrl;
      $('[data-pass-loading]').hidden = true;
      var slug = (S.event.name || 'guest').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      var fname = slug + '-guest-pass.png';
      var dl = $('[data-download-pass]');
      if (dl) { dl.href = passUrl; dl.download = fname; }
      try { passFile = new File([blob], fname, { type: 'image/png' }); } catch (e) { passFile = null; }
      $('[data-share-pass]').hidden = !(passFile && navigator.canShare && navigator.canShare({ files: [passFile] }));
    }).catch(function () {
      $('[data-pass-loading]').textContent = 'Couldn’t make the image on this device. A screenshot works too!';
    });
  });
  $('[data-share-pass]').addEventListener('click', function () {
    if (passFile) navigator.share({ files: [passFile], title: (S.event.name || 'Guest pass') }).catch(function () { /* cancelled */ });
  });
  function closeModal() { modal.hidden = true; }
  $('[data-close-modal]').addEventListener('click', closeModal);
  modal.addEventListener('click', function (ev) { if (ev.target === modal) closeModal(); });
  document.addEventListener('keydown', function (ev) {
    if (ev.key !== 'Escape') return;
    if (!modal.hidden) closeModal(); else if (!sheet.hidden) closeSheet();
  });

  // ------------------------------------------------------------------ music
  var audio = $('[data-audio]');
  var musicBtn = $('[data-music]');
  function revealMusicButton() { if (S.event && S.event.music) musicBtn.hidden = false; }
  function playMusic(fromOpen) {
    if (!S.event || !S.event.music) return;
    if (!audio.src) audio.src = S.event.music;
    audio.volume = 0.55;
    var p = audio.play();
    if (p && p.then) p.then(function () { musicBtn.setAttribute('aria-pressed', 'true'); musicBtn.setAttribute('aria-label', 'Pause music'); })
      .catch(function () { if (!fromOpen) toast('Couldn’t play the music on this device.'); });
  }
  musicBtn.addEventListener('click', function () {
    if (audio.paused) playMusic(false);
    else { audio.pause(); musicBtn.setAttribute('aria-pressed', 'false'); musicBtn.setAttribute('aria-label', 'Play music'); }
  });

  // ------------------------------------------------------------------ opening the envelope (every visit starts sealed)
  var opened = false;
  function openEnvelope(instant) {
    if (opened || isNote()) return;
    opened = true;
    if (instant) { finishOpen(false); return; }
    body.classList.add('is-opening');
    playMusic(true);
    setTimeout(function () { finishOpen(true); }, reduced ? 350 : 2950);
  }
  function finishOpen(animate) {
    body.classList.remove('is-sealed', 'is-opening');
    body.classList.add('is-open');
    window.scrollTo(0, 0);
    if (animate && !reduced) {
      body.classList.add('is-entering');
      setTimeout(function () { body.classList.remove('is-entering'); }, 2400);
      if (!ls.get('inv_flip_hint')) setTimeout(function () { var p = $('.pol-b'); if (p) { p.classList.add('hint-wiggle'); setTimeout(function () { p.classList.remove('hint-wiggle'); }, 2400); } }, 2600);
    }
    renderAmp();
    setupObservers();
    revealMusicButton();
    if (canEdit) editToggle.hidden = false;
    updateFab();
    parallax();
  }
  $('[data-open]').addEventListener('click', function () { openEnvelope(false); });
  $('[data-env]').addEventListener('click', function () { if (!isNote()) openEnvelope(false); });

  // ------------------------------------------------------------------ tap reactions
  function burst(el, chars, opts) {
    opts = opts || {};
    var r = el.getBoundingClientRect();
    var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    var n = opts.n || 8;
    var colors = ['#8C2B35', '#C5626E', '#EBBDB1', '#6B1824'];
    for (var i = 0; i < n; i++) {
      var s = document.createElement('span');
      s.className = 'burst';
      s.textContent = chars[i % chars.length];
      var a = (Math.PI * 2 * i) / n + Math.random() * 0.5;
      var d = 46 + Math.random() * 44;
      s.style.left = cx - 8 + 'px'; s.style.top = cy - 9 + 'px';
      s.style.color = colors[i % colors.length];
      s.style.fontSize = (14 + Math.random() * 12).toFixed(0) + 'px';
      s.style.setProperty('--bx', (Math.cos(a) * d).toFixed(0) + 'px');
      s.style.setProperty('--by', (Math.sin(a) * d - 30).toFixed(0) + 'px');
      s.style.setProperty('--br', (Math.random() * 80 - 40).toFixed(0) + 'deg');
      body.appendChild(s);
      setTimeout(function (x) { x.remove(); }.bind(null, s), 1100);
    }
    if (opts.word) {
      var w = document.createElement('span');
      w.className = 'burst burst--word';
      w.textContent = opts.word;
      w.style.left = cx - 30 + 'px'; w.style.top = cy - 20 + 'px';
      w.style.setProperty('--bx', '0px'); w.style.setProperty('--by', '-70px'); w.style.setProperty('--br', '-6deg');
      body.appendChild(w);
      setTimeout(function () { w.remove(); }, 1100);
    }
  }
  function replay(el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }

  var canvas = $('[data-canvas]');
  canvas.addEventListener('click', function (ev) {
    if (ev.target.closest('[data-amp]')) {
      if (!editing) burst(ampEl, ['♥', '♡'], { n: 8 });
      return; // in edit mode the pointer handlers move it or open its editor
    }
    var pol = ev.target.closest('.polaroid');
    if (pol) {
      if (editing) { openEditor('photo', +pol.dataset.polaroid); return; }
      var on = pol.classList.toggle('flipped');
      $('.pol-flip', pol).setAttribute('aria-pressed', String(on));
      ls.set('inv_flip_hint', '1');
      return;
    }
    var mini = ev.target.closest('[data-flip]');
    if (mini) {
      if (editing) { openEditor(mini.dataset.edit); return; }
      mini.classList.toggle('flipped');
      if (mini.classList.contains('mini-games')) replay(mini, 'rolling');
      return;
    }
    var two = ev.target.closest('[data-two]');
    if (two) { two.classList.toggle('flipped'); burst(two, ['♥', '♥'], { n: 10 }); return; }
    var kiss = ev.target.closest('[data-kiss]');
    if (kiss) { ev.stopPropagation(); replay(kiss, 'smack'); burst(kiss, ['♥', '♡'], { n: 7, word: 'mwah' }); if (!editing) return; }
    if (editing) {
      var ed = ev.target.closest('.editable');
      if (ed) openEditor(ed.dataset.edit);
    }
  });

  // ------------------------------------------------------------------ parallax: photos drift inside their frames, decorations float
  var ticking = false;
  function parallax() {
    if (reduced || ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var vh = innerHeight;
      $$('[data-px], [data-px-img]').forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -120 || r.top > vh + 120) return;
        var c = (r.top + r.height / 2 - vh / 2) / vh;
        var f = el.hasAttribute('data-px-img') ? -14 : +el.dataset.px;
        el.style.setProperty('--py', (c * f).toFixed(1) + 'px');
      });
    });
  }
  window.addEventListener('scroll', parallax, { passive: true });
  window.addEventListener('resize', parallax);

  // ------------------------------------------------------------------ floating RSVP button + pieces landing on scroll
  var fab = $('[data-fab]');
  var pastHero = false, cardVisible = false;
  function updateFab() {
    var g = S.guest;
    var show = body.classList.contains('is-open') && pastHero && !cardVisible && sheet.hidden && !editing && !isNote() &&
      currentView() !== 'closed' && !(g && g.status === 'declined');
    fab.textContent = g && g.status === 'attending' ? 'My pass ✨' : 'Kindly RSVP';
    fab.classList.toggle('show', show);
  }
  fab.addEventListener('click', function () { openSheet(currentView()); });
  var observersReady = false;
  function setupObservers() {
    if (observersReady) return;
    observersReady = true;
    if (!('IntersectionObserver' in window)) { pastHero = true; updateFab(); return; }
    new IntersectionObserver(function (en) { pastHero = !en[0].isIntersecting; updateFab(); }, { rootMargin: '0px 0px -40% 0px' }).observe($('.invite-card'));
    new IntersectionObserver(function (en) { cardVisible = en[0].isIntersecting; updateFab(); }).observe(card);
    var lio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); lio.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -12% 0px' });
    $$('.land').forEach(function (el) { if (el.getBoundingClientRect().top > innerHeight * 0.9) el.classList.add('pre'); lio.observe(el); });
  }

  // ------------------------------------------------------------------ host edit mode
  var canEdit = !!(S.canEdit || (MOCK && MOCK.editable)) && !isNote();
  var editing = false;
  var editToggle = $('[data-edit-toggle]');
  var editBar = $('[data-edit-bar]');
  function setEditing(on) {
    editing = on;
    body.classList.toggle('is-editing', on);
    editBar.hidden = !on;
    editToggle.hidden = on || !canEdit;
    $$('.polaroid.flipped, .mini.flipped').forEach(function (el) { el.classList.remove('flipped'); });
    if (on) $$('.land').forEach(function (el) { el.classList.add('in'); });
    updateFab();
  }
  editToggle.addEventListener('click', function () { setEditing(true); });
  $('[data-edit-done]').addEventListener('click', function () { setEditing(false); });

  var editor = $('[data-editor]');
  var edForm = $('[data-editor-form]');
  var edState = null;
  var DASH = MOCK ? '' : ' <a href="/host" target="_blank" rel="noopener">Open the dashboard ↗</a>';
  function group(name, i) {
    var t = texts(), e = S.event;
    var g = {
      liner: { title: 'Script on the burgundy paper', fields: [['t.linerScript', 'Text', 40]] },
      tape: { title: 'The name tape', fields: [['t.tape', 'Text', 40]], note: 'Type {name} where the guest’s name should go. Each guest’s personal link shows their own first name; the general link shows “you”. Leave it empty to hide the tape.' },
      card: { title: 'The invitation card', fields: [['t.kicker', 'Small line at the top', 60], ['eventName', 'Title', 80], ['tagline', 'Line under the title', 120], ['celebrants', 'Birthday girls’ names', 100]], note: 'The date comes from your event settings.' },
      byob: { title: 'Contribution card', fields: [['t.byobTitle', 'Title', 24], ['t.byobText', 'Line', 60], ['t.byobBack', 'Back of the card', 90]] },
      games: { title: 'Games card', fields: [['t.gamesTitle', 'Title', 24], ['t.gamesText', 'Line', 60], ['t.gamesBack', 'Back of the card', 90]] },
      comfy: { title: 'Dress code card', fields: [['t.comfyTitle', 'Title', 30], ['t.comfyText', 'Line', 60], ['t.comfyBack', 'Back of the card', 90]] },
      signoff: { title: 'Sign-off', fields: [['hostName', 'Signed “with love,” by', 60]] },
      details: MOCK && MOCK.rawSettings ? {
        title: 'The details',
        fields: [['date', 'Date', 10, 'date'], ['time', 'Start time', 5, 'time'], ['endTime', 'End time (leave empty for “till late”)', 5, 'time'],
          ['venue', 'Venue', 60], ['area', 'General location (everyone sees this)', 120], ['rsvpDeadline', 'RSVP by', 10, 'date']],
        note: 'The exact Airbnb address goes in the real website’s dashboard, which only shows it to guests who say yes.',
      } : { title: 'The details', fields: [], note: 'Date, time, venue, location, the private address and the RSVP deadline live in your host dashboard, so the RSVP rules and calendar stay in sync.' + DASH },
    };
    if (name === 'amp') {
      var am = ampState();
      return { title: 'The “&” between the photos', amp: am, fields: [['amp.text', 'Character or word', 12]], values: { 'amp.text': am.text },
        note: 'Tip: in Edit mode you can also drag it to move it, and drag its corner handle (or pinch) to resize it.' };
    }
    if (name === 'photo') {
      var p = photos()[i];
      return { title: 'Polaroid ' + (i + 1), photo: true, index: i, src: p.src, fields: [['p.caption', 'Caption on the frame', 24], ['p.note', 'Note on the back', 80]], values: { 'p.caption': p.caption, 'p.note': p.note } };
    }
    var out = g[name];
    out.values = {};
    out.fields.forEach(function (f) {
      var k = f[0];
      out.values[k] = k.indexOf('t.') === 0 ? t[k.slice(2)] : k === 'eventName' ? e.name : k === 'hostName' ? e.host : name === 'details' ? (MOCK.rawSettings()[k] || '') : e[k];
    });
    return out;
  }
  function openEditor(name, i) {
    edState = group(name, i);
    edState.name = name;
    edState.pendingSrc = edState.src;
    $('[data-editor-title]').textContent = edState.title;
    $('[data-ed-error]').hidden = true;
    $('[data-ed-photo]').hidden = !edState.photo;
    if (edState.photo) showThumb(edState.src, i);
    $('[data-ed-fields]').innerHTML = edState.fields.map(function (f, n) {
      var v = esc(edState.values[f[0]] || '');
      var input = f[2] > 60 ? '<textarea id="ed-' + n + '" data-k="' + f[0] + '" maxlength="' + f[2] + '" rows="2">' + v + '</textarea>'
        : '<input id="ed-' + n + '" data-k="' + f[0] + '"' + (f[3] ? ' type="' + f[3] + '"' : ' maxlength="' + f[2] + '"') + ' value="' + v + '">';
      return '<label class="field" for="ed-' + n + '"><span class="lbl">' + esc(f[1]) + '</span>' + input + '</label>';
    }).join('');
    if (edState.amp) {
      var am = edState.amp;
      var sw = Object.keys(AMP_COLORS).map(function (k) {
        var label = { canvas: 'Background colour', ivory: 'Ivory', pink: 'Baby pink', burgundy: 'Burgundy' }[k];
        return '<label class="ed-swatch" title="' + label + '"><input type="radio" name="amp-color" value="' + k + '"' + (am.color === k ? ' checked' : '') + ' aria-label="' + label + '">' +
          '<span style="background:' + (k === 'burgundy' ? '#F5DCD3' : '#6B1824') + ';color:' + AMP_COLORS[k] + '">&amp;</span><small>' + { canvas: 'Background', ivory: 'Ivory', pink: 'Pink', burgundy: 'Burgundy' }[k] + '</small></label>';
      }).join('');
      $('[data-ed-fields]').insertAdjacentHTML('beforeend',
        '<label class="field" for="ed-amp-size"><span class="lbl">Size</span><input class="ed-range" id="ed-amp-size" type="range" min="6" max="60" step="1" value="' + Math.round(am.size) + '" data-amp-size></label>' +
        '<div class="field"><span class="lbl">Colour</span><div class="ed-swatches">' + sw + '</div></div>' +
        '<label class="ed-check"><input type="checkbox" data-amp-show' + (am.show ? ' checked' : '') + '> Show it on the invitation</label>' +
        '<button class="btn btn--line btn--sm" type="button" data-amp-reset style="margin:-4px 0 18px">Reset position &amp; size</button>');
      var preview = function () { renderAmp(readAmp()); };
      $('[data-amp-size]').addEventListener('input', preview);
      $$('input[name="amp-color"]').forEach(function (r) { r.addEventListener('change', preview); });
      $('[data-amp-show]').addEventListener('change', preview);
      $('[data-amp-reset]').addEventListener('click', function () {
        edState.amp.x = AMP_DEFAULT.x; edState.amp.y = AMP_DEFAULT.y;
        $('[data-amp-size]').value = AMP_DEFAULT.size; preview();
      });
    }
    var note = $('[data-ed-note]');
    note.innerHTML = edState.note || '';
    note.hidden = !edState.note;
    $('[data-ed-save]').hidden = !edState.fields.length && !edState.photo;
    editor.hidden = false;
    body.style.overflow = 'hidden';
  }
  function readAmp() {
    var a = Object.assign({}, edState.amp);
    var txt = $('[data-k="amp.text"]'); if (txt && txt.value.trim()) a.text = txt.value.trim();
    a.size = +$('[data-amp-size]').value;
    var c = $('input[name="amp-color"]:checked'); if (c) a.color = c.value;
    a.show = $('[data-amp-show]').checked;
    return a;
  }
  function closeEditor() { var wasAmp = edState && edState.amp; editor.hidden = true; body.style.overflow = ''; edState = null; if (wasAmp) renderAmp(); }
  $('[data-close-editor]').addEventListener('click', closeEditor);
  editor.addEventListener('click', function (ev) { if (ev.target === editor) closeEditor(); });
  function showThumb(src, i) {
    $('[data-ed-thumb]').innerHTML = src ? '<img src="' + esc(src) + '" alt="">' : ART.plate(i);
  }

  // Crop photos to the Polaroid shape and shrink them on the phone before uploading.
  function cropPhoto(file, w, h, q) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        var c = document.createElement('canvas'); c.width = w; c.height = h;
        var s = Math.max(w / img.naturalWidth, h / img.naturalHeight);
        var dw = img.naturalWidth * s, dh = img.naturalHeight * s;
        c.getContext('2d').drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
        URL.revokeObjectURL(url);
        c.toBlob(function (b) { b ? resolve(b) : reject(new Error('That photo couldn’t be read.')); }, 'image/jpeg', q);
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('That photo couldn’t be read. Try a JPG or PNG.')); };
      img.src = url;
    });
  }
  $('[data-ed-file]').addEventListener('change', function (ev) {
    var f = ev.target.files[0];
    ev.target.value = '';
    if (!f || !edState) return;
    var save = $('[data-ed-save]');
    save.disabled = true; save.textContent = 'Uploading photo…';
    var big = !MOCK;
    cropPhoto(f, big ? 1080 : 720, big ? 1124 : 749, big ? 0.84 : 0.78).then(function (blob) { return API.upload(blob); }).then(function (url) {
      if (!edState) return;
      edState.pendingSrc = url;
      showThumb(url, edState.index);
    }).catch(function (err) {
      var er = $('[data-ed-error]'); er.textContent = err.message; er.hidden = false;
    }).then(function () { save.disabled = false; save.textContent = 'Save'; });
  });
  $('[data-ed-reset]').addEventListener('click', function () { if (!edState) return; edState.pendingSrc = ''; showThumb('', edState.index); });

  edForm.addEventListener('submit', function (ev) {
    ev.preventDefault();
    if (!edState) return;
    var vals = {};
    $$('[data-k]', edForm).forEach(function (el) { vals[el.dataset.k] = el.value.trim(); });
    var patch = {};
    var t = null;
    Object.keys(vals).forEach(function (k) {
      if (k.indexOf('t.') === 0) { t = t || texts(); t[k.slice(2)] = vals[k] || (k === 't.tape' ? ' ' : DEFAULT_TEXTS[k.slice(2)]); }
      else if (k.indexOf('p.') !== 0 && k.indexOf('amp.') !== 0) patch[k] = vals[k];
    });
    if (t) patch.texts = t;
    if (edState.amp) patch.amp = readAmp();
    if (edState.photo) {
      var list = photos();
      list[edState.index] = { src: edState.pendingSrc || '', caption: vals['p.caption'] || '', note: vals['p.note'] || '' };
      patch.moodboard = list;
    }
    var save = $('[data-ed-save]');
    save.disabled = true; save.textContent = 'Saving…';
    API.saveSettings(patch).then(function () {
      if (patch.texts) S.event.texts = patch.texts;
      if (patch.moodboard) S.event.moodboard = patch.moodboard;
      if (patch.amp) S.event.amp = patch.amp;
      if ('eventName' in patch) S.event.name = patch.eventName;
      if ('tagline' in patch) S.event.tagline = patch.tagline;
      if ('celebrants' in patch) S.event.celebrants = patch.celebrants;
      if ('hostName' in patch) S.event.host = patch.hostName;
      renderCollage();
      renderEnvelope();
      renderPass();
      parallax();
      closeEditor();
      toast('Saved ✨ Guests see this straight away.');
    }).catch(function (err) {
      var er = $('[data-ed-error]'); er.textContent = err.message; er.hidden = false;
    }).then(function () { save.disabled = false; save.textContent = 'Save'; });
  });
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && !editor.hidden) closeEditor(); });

  // Drag to move, drag the corner (or pinch) to resize, tap to open the editor. Edit mode only.
  var pts = {}, drag = null, ampMovedAt = 0;
  function ptsList() { return Object.keys(pts).map(function (k) { return pts[k]; }); }
  function pinchDist() { var p = ptsList(); return Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) || 1; }
  ampEl.addEventListener('pointerdown', function (e) {
    if (!editing) return;
    e.preventDefault();
    try { ampEl.setPointerCapture(e.pointerId); } catch (x) { /* ignore */ }
    pts[e.pointerId] = { x: e.clientX, y: e.clientY };
    var n = ptsList().length;
    if (n === 1) drag = { mode: e.target.closest('.amp-handle') ? 'size' : 'move', sx: e.clientX, sy: e.clientY, a: ampState(), moved: false };
    else if (n === 2) drag = { mode: 'pinch', d0: pinchDist(), a: drag ? drag.cur || drag.a : ampState(), moved: true };
    ampEl.classList.add('dragging');
  });
  ampEl.addEventListener('pointermove', function (e) {
    if (!drag || !pts[e.pointerId]) return;
    pts[e.pointerId] = { x: e.clientX, y: e.clientY };
    var r = collageEl.getBoundingClientRect();
    var a = Object.assign({}, drag.a);
    var clamp = function (v, lo, hi) { return Math.min(hi, Math.max(lo, v)); };
    if (drag.mode === 'move') {
      var dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
      if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true;
      a.x = clamp(drag.a.x + dx / r.width * 100, 0, 100);
      a.y = clamp(drag.a.y + dy / r.height * 100, 0, 100);
    } else if (drag.mode === 'size') {
      drag.moved = true;
      a.size = clamp(drag.a.size + ((e.clientX - drag.sx) + (e.clientY - drag.sy)) / r.width * 70, 6, 60);
    } else if (drag.mode === 'pinch' && ptsList().length === 2) {
      a.size = clamp(drag.a.size * pinchDist() / drag.d0, 6, 60);
    }
    a.x = Math.round(a.x * 10) / 10; a.y = Math.round(a.y * 10) / 10; a.size = Math.round(a.size * 10) / 10;
    drag.cur = a;
    renderAmp(a);
  });
  function endAmpDrag(e) {
    delete pts[e.pointerId];
    if (ptsList().length || !drag) return;
    ampEl.classList.remove('dragging');
    var d = drag; drag = null;
    if (d.moved && d.cur) {
      ampMovedAt = Date.now();
      S.event.amp = d.cur;
      API.saveSettings({ amp: d.cur }).then(function () { toast('Position saved ✨'); }).catch(function (err) { toast(err.message); });
    } else if (!d.moved) {
      ampMovedAt = Date.now();
      openEditor('amp');
    }
  }
  ampEl.addEventListener('pointerup', endAmpDrag);
  ampEl.addEventListener('pointercancel', endAmpDrag);

  // ------------------------------------------------------------------ boot
  renderEnvelope();
  if (!isNote()) {
    renderCollage();
    renderDetails();
    renderReplyCard();
    renderPass();
  }
  updateFab();
  if (S.offline) setTimeout(function () { toast(S.offlineReason || 'Couldn’t load the latest details. Check your connection.', 6000); }, 600);
  if (MOCK && MOCK.ready) MOCK.ready({
    open: openEnvelope,
    toast: toast,
    setEditing: setEditing,
    enableEdit: function () { canEdit = !isNote(); if (opened && canEdit && !editing) editToggle.hidden = false; },
  });
})();
