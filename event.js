/* Shared date + invitation logic (generated from the server version by tools/build.mjs). */
(function () {
'use strict';
// Turns stored settings + a guest row into what the invitation page is allowed to see.

function validTimeZone(tz) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

function tzOffsetMs(utcMs, tz) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const p = Object.fromEntries(dtf.formatToParts(new Date(utcMs)).map((x) => [x.type, x.value]));
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second);
  return asUtc - utcMs;
}

/** "2026-11-14" + "19:30" in Africa/Kampala -> epoch ms (UTC). */
function zonedToUtc(date, time, tz) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) return null;
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = /^\d{2}:\d{2}$/.test(time || '') ? time.split(':').map(Number) : [0, 0];
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  const off1 = tzOffsetMs(guess, tz);
  let utc = guess - off1;
  const off2 = tzOffsetMs(utc, tz);
  if (off2 !== off1) utc = guess - off2;
  return utc;
}

const fmt = (opts, tz, ms, locale = 'en-GB') => new Intl.DateTimeFormat(locale, { timeZone: tz, ...opts }).format(new Date(ms));

function eventTimes(s) {
  const tz = validTimeZone(s.timezone) ? s.timezone : 'UTC';
  const hasDate = /^\d{4}-\d{2}-\d{2}$/.test(s.date || '');
  const hasTime = /^\d{2}:\d{2}$/.test(s.time || '');
  const startUtc = hasDate ? zonedToUtc(s.date, hasTime ? s.time : '19:00', tz) : null;
  let endUtc = null;
  if (startUtc) {
    if (/^\d{2}:\d{2}$/.test(s.endTime || '')) {
      endUtc = zonedToUtc(s.date, s.endTime, tz);
      if (endUtc <= startUtc) endUtc += 24 * 3600e3; // runs past midnight
    } else {
      endUtc = startUtc + 10 * 3600e3; // "till late"
    }
  }
  const deadlineUtc = /^\d{4}-\d{2}-\d{2}$/.test(s.rsvpDeadline || '') ? zonedToUtc(s.rsvpDeadline, '23:59', tz) + 59e3 : null;
  const deadlinePassed = deadlineUtc ? Date.now() > deadlineUtc : false;
  return {
    tz,
    startUtc,
    endUtc,
    hasDate,
    hasTime,
    dateLabel: hasDate ? fmt({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }, tz, startUtc) : '',
    shortDateLabel: hasDate ? fmt({ weekday: 'short', day: 'numeric', month: 'short' }, tz, startUtc) : '',
    longDateLabel: hasDate ? fmt({ day: 'numeric', month: 'long', year: 'numeric' }, tz, startUtc) : '',
    numericDate: hasDate ? s.date.split('-').reverse().join('.') : '',
    timeLabel: hasDate && hasTime ? fmt({ hour: 'numeric', minute: '2-digit', hour12: true }, tz, startUtc, 'en-US') : '',
    endTimeLabel: hasDate && /^\d{2}:\d{2}$/.test(s.endTime || '') ? fmt({ hour: 'numeric', minute: '2-digit', hour12: true }, tz, endUtc, 'en-US') : '',
    deadlineUtc,
    deadlineLabel: deadlineUtc ? fmt({ weekday: 'long', day: 'numeric', month: 'long' }, 'UTC', Date.UTC(...s.rsvpDeadline.split('-').map((n, i) => (i === 1 ? n - 1 : +n)))) : '',
    deadlinePassed,
    rsvpOpen: !deadlinePassed || !!s.allowLate,
  };
}

function mapsLink(s) {
  if (s.mapsUrl) return s.mapsUrl;
  if (s.address) return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(s.address);
  return '';
}

function guestPublic(g) {
  if (!g) return null;
  return {
    name: g.name,
    firstName: String(g.name || '').trim().split(/\s+/)[0] || '',
    contact: g.contact,
    status: g.status,
    partySize: g.party_size,
    maxParty: g.max_party,
    bringingGame: !!g.bringing_game,
    game: g.game,
    drinks: g.drinks || '',
    allergies: g.allergies || '',
    message: g.message,
    respondedAt: g.responded_at,
  };
}

/** Everything the guest page may render. The full address only leaves the server for confirmed guests. */
function inviteState(s, guest, { mode, token }) {
  const t = eventTimes(s);
  const confirmed = guest?.status === 'attending';
  const unlocked = !s.hideAddress || confirmed;
  return {
    mode, // 'personal' | 'open' | 'invalid'
    token: token || null,
    event: {
      name: s.eventName,
      host: s.hostName,
      tagline: s.tagline,
      celebrants: s.celebrants || '',
      longDateLabel: t.longDateLabel,
      numericDate: t.numericDate,
      dateLabel: t.dateLabel,
      shortDateLabel: t.shortDateLabel,
      timeLabel: t.timeLabel,
      endTimeLabel: t.endTimeLabel,
      startUtc: t.startUtc,
      endUtc: t.endUtc,
      venue: s.venue,
      area: s.area,
      deadlineLabel: t.deadlineLabel,
      deadlinePassed: t.deadlinePassed,
      rsvpOpen: t.rsvpOpen,
      hideAddress: !!s.hideAddress,
      openInvite: !!s.openInvite,
      openMaxParty: s.openMaxParty,
      music: s.musicUrl || '',
      moodboard: s.moodboard,
      texts: s.texts,
      amp: s.amp,
    },
    guest: guestPublic(guest),
    location: unlocked && (s.address || s.mapsUrl) ? { address: s.address, mapsUrl: mapsLink(s) } : null,
    locationLocked: !unlocked,
  };
}

window.InviteEvent = { validTimeZone, zonedToUtc, eventTimes, mapsLink, guestPublic, inviteState, DEFAULTS: {
 "eventName": "Two of a Kind",
 "hostName": "",
 "tagline": "A Birthday Celebration",
 "celebrants": "",
 "date": "2026-11-21",
 "time": "13:00",
 "endTime": "",
 "timezone": "Africa/Kampala",
 "venue": "Private Airbnb",
 "area": "",
 "rsvpDeadline": "",
 "allowLate": false,
 "hideAddress": true,
 "openInvite": true,
 "openMaxParty": 1,
 "defaultMaxParty": 1,
 "capacity": 0,
 "musicUrl": "",
 "moodboard": [
  {
   "src": "",
   "caption": "the flowers",
   "note": "blooms for the birthday girls"
  },
  {
   "src": "",
   "caption": "candlelight",
   "note": "candles lit, music on"
  },
  {
   "src": "",
   "caption": "cheers to us",
   "note": "food & drinks sorted"
  },
  {
   "src": "",
   "caption": "game night",
   "note": "winner picks the next song"
  }
 ],
 "amp": {
  "text": "&",
  "x": 50,
  "y": 47,
  "size": 26,
  "color": "canvas",
  "show": true
 },
 "texts": {
  "linerScript": "cheers to the twins",
  "tape": "for {name} ♡",
  "kicker": "Please join us to celebrate",
  "byobTitle": "UGX 150,000",
  "byobText": "Per person. Covers food, drinks & all the fun.",
  "byobBack": "Send it by Mobile Money to any of Asherbell’s numbers ♡",
  "gamesTitle": "Got games?",
  "gamesText": "Bring your favourites along!",
  "gamesBack": "Cards, board games, anything that gets everyone laughing.",
  "comfyTitle": "Come comfortable",
  "comfyText": "No dress code. Just good vibes.",
  "comfyBack": "Sneakers, sundress or sweats. You do you."
 }
} };
})();

/* Your saved look from the preview (used if the Google script can't be reached). */
(function (look) { var d = window.InviteEvent.DEFAULTS; Object.keys(look).forEach(function (k) { d[k] = look[k]; }); })({
 "eventName": "Two of a Kind",
 "tagline": "Asher & Asherbell's",
 "celebrants": "27th Birthday",
 "texts": {
  "linerScript": "Cheers to the twins",
  "tape": "for {name} ♡",
  "kicker": "Please join us to celebrate",
  "byobTitle": "UGX 150,000",
  "byobText": "Per person. Covers food, drinks & all the fun.",
  "byobBack": "Send it by Mobile Money to any of Asherbell’s numbers ♡",
  "gamesTitle": "Got games?",
  "gamesText": "Bring your favourites along!",
  "gamesBack": "Cards, board games, anything that gets everyone laughing.",
  "comfyTitle": "No dress code. Just good vibes",
  "comfyText": "Nothing too formal, just leave the everyday casual fits home",
  "comfyBack": "Think cute, colourful, and effortlessly chic"
 },
 "amp": {
  "text": "&",
  "x": 49.8,
  "y": 58.8,
  "size": 16.7,
  "color": "burgundy",
  "show": true
 },
 "moodboard": [
  {
   "src": "photos/photo-1.jpg",
   "caption": "Asher",
   "note": "blooms for the birthday girls"
  },
  {
   "src": "photos/photo-2.jpg",
   "caption": "Asherbell",
   "note": "candles lit, music on"
  },
  {
   "src": "",
   "caption": "cheers to us",
   "note": "food & drinks sorted"
  },
  {
   "src": "",
   "caption": "game night",
   "note": "winner picks the next song"
  }
 ],
 "date": "2026-11-21",
 "time": "13:00",
 "endTime": "",
 "venue": "Private Airbnb",
 "area": "Kyanja",
 "rsvpDeadline": "2026-11-14"
});
