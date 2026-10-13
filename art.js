/* Original botanical artwork, generated as SVG so it is crisp, tiny and on-palette. */
(function () {
  'use strict';

  // Small deterministic RNG so compositions look identical on every load.
  function rng(seed) {
    let s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return function () {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }

  // Palettes: [base, deep, highlight]
  var P = {
    wine: ['#6A1724', '#33080F', '#A23A48'],
    red: ['#9E2333', '#560F1C', '#D0596A'],
    dusty: ['#B2505E', '#76242F', '#DE8E98'],
    blush: ['#E8ABA6', '#B66A6E', '#F8D8CF'],
    ivory: ['#F2E3C4', '#C7AE85', '#FFF8E8'],
    pinkOrchid: ['#E58AAE', '#B8577F', '#F7C4D6'],
    leaf: ['#636B2F', '#3E4419', '#8E9650'],
    sage: ['#7E8752', '#525A2A', '#A9B07A'],
    pine: ['#2F4A2A', '#1B2D19', '#4E6D44'],
  };

  function v(p, prefix) {
    return '--' + prefix + '1:' + p[0] + ';--' + prefix + '2:' + p[1] + ';--' + prefix + '3:' + p[2];
  }
  var ROSE_PETAL = 'M0 0C-26-4-32-36-8-46C-3-48 3-48 8-46C32-36 26-4 0 0Z';

  function ring(n, rot, scale, attrs) {
    var out = '';
    for (var i = 0; i < n; i++) {
      out += '<path d="' + ROSE_PETAL + '" transform="rotate(' + (rot + (360 / n) * i).toFixed(1) + ') scale(' + scale + ')" ' + attrs + '/>';
    }
    return out;
  }

  function fernSymbol() {
    var leaflets = '';
    var n = 15;
    for (var i = 0; i < n; i++) {
      var t = i / (n - 1);
      var y = -6 - t * 92;
      var x = Math.sin(t * 1.4) * 10;
      var len = 15 * (1 - t * 0.75) + 2;
      var w = len * 0.32;
      [-1, 1].forEach(function (side) {
        var ang = side * (58 - t * 18);
        leaflets += '<ellipse cx="0" cy="' + (-len / 2).toFixed(1) + '" rx="' + w.toFixed(1) + '" ry="' + (len / 2).toFixed(1) +
          '" transform="translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') rotate(' + ang.toFixed(1) + ')"/>';
      });
    }
    return '<symbol id="a-fern" viewBox="-30 -105 60 110" overflow="visible">' +
      '<path d="M0 0Q4-50 10-100" fill="none" stroke="var(--l2)" stroke-width="1.4"/>' +
      '<g fill="var(--l1)">' + leaflets + '</g></symbol>';
  }

  function hydrangeaSymbol() {
    var fl = '';
    for (var i = 0; i < 34; i++) {
      var r = 6.4 * Math.sqrt(i);
      var a = i * 137.508 * Math.PI / 180;
      var x = Math.cos(a) * r, y = Math.sin(a) * r;
      var s = 0.95 + ((i * 7) % 5) * 0.07;
      var rot = (i * 53) % 90;
      fl += '<g transform="translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') rotate(' + rot + ') scale(' + s.toFixed(2) + ')">' +
        '<use href="#a-floret"/></g>';
    }
    return '<symbol id="a-floret" overflow="visible"><g fill="var(--h1)" stroke="var(--h2)" stroke-width=".5">' +
      '<path d="M0 0C-4.5-3-4.5-9.5 0-11.5C4.5-9.5 4.5-3 0 0Z"/><path d="M0 0C-4.5-3-4.5-9.5 0-11.5C4.5-9.5 4.5-3 0 0Z" transform="rotate(90)"/>' +
      '<path d="M0 0C-4.5-3-4.5-9.5 0-11.5C4.5-9.5 4.5-3 0 0Z" transform="rotate(180)"/><path d="M0 0C-4.5-3-4.5-9.5 0-11.5C4.5-9.5 4.5-3 0 0Z" transform="rotate(270)"/>' +
      '</g><circle r="1.3" fill="var(--h2)"/></symbol>' +
      '<symbol id="a-hydrangea" viewBox="-50 -50 100 100" overflow="visible">' +
      '<circle r="38" fill="var(--h2)" opacity=".55"/>' + fl +
      '<circle r="44" fill="url(#a-shade-soft)"/></symbol>';
  }

  function defs() {
    return '' +
      '<defs>' +
      '<radialGradient id="a-shade"><stop offset="0" stop-color="#000" stop-opacity=".55"/><stop offset=".55" stop-color="#000" stop-opacity=".18"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="a-shade-soft" cx=".35" cy=".3"><stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".28"/></radialGradient>' +
      '<radialGradient id="a-glow"><stop offset="0" stop-color="#FFE9B0" stop-opacity=".95"/><stop offset=".35" stop-color="#FFC977" stop-opacity=".45"/><stop offset="1" stop-color="#FFB45C" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="a-satin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3B0C13"/><stop offset=".28" stop-color="#7B2230"/><stop offset=".47" stop-color="#B9525F"/><stop offset=".62" stop-color="#7E2532"/><stop offset="1" stop-color="#2E070D"/></linearGradient>' +
      '<linearGradient id="a-satin-h" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3B0C13"/><stop offset=".3" stop-color="#82283A"/><stop offset=".5" stop-color="#B9525F"/><stop offset=".7" stop-color="#7E2532"/><stop offset="1" stop-color="#2E070D"/></linearGradient>' +
      '</defs>' +
      // Rose (top view)
      '<symbol id="a-rose" viewBox="-50 -50 100 100" overflow="visible">' +
      ring(5, 0, 1, 'fill="var(--p1)" stroke="var(--p3)" stroke-width="1.3" stroke-opacity=".75"') +
      '<circle r="46" fill="url(#a-shade)"/>' +
      ring(5, 36, 0.7, 'fill="var(--p1)" stroke="var(--p3)" stroke-width="1.6" stroke-opacity=".8"') +
      '<circle r="31" fill="url(#a-shade)"/>' +
      ring(4, 12, 0.44, 'fill="var(--p2)" stroke="var(--p3)" stroke-width="2" stroke-opacity=".85"') +
      '<path d="M-3 1C-3-5 5-6 6 0C7 6-2 9-7 4C-11-1-8-11 2-11C11-11 15-2 12 6" fill="none" stroke="var(--p3)" stroke-width="1.5" stroke-linecap="round" opacity=".9"/>' +
      '<circle r="2.4" fill="var(--p2)"/>' +
      '</symbol>' +
      // Rosebud (side view)
      '<symbol id="a-bud" viewBox="-20 -40 40 70" overflow="visible">' +
      '<path d="M0 0Q-2 14 1 30" fill="none" stroke="var(--l2,#3E4419)" stroke-width="1.6"/>' +
      '<path d="M0 0C-10-6-12-24 0-34C12-24 10-6 0 0Z" fill="var(--p1)"/>' +
      '<path d="M0 0C-6-4-7-20 2-31C-1-20 1-8 0 0Z" fill="var(--p2)" opacity=".7"/>' +
      '<path d="M0 -2C-8-2-12-10-11-16C-6-10-3-7 0-2ZM0-2C8-2 12-10 11-16C6-10 3-7 0-2Z" fill="var(--l1,#636B2F)"/>' +
      '</symbol>' +
      // Phalaenopsis orchid
      '<symbol id="a-orchid" viewBox="-50 -50 100 100" overflow="visible">' +
      '<g fill="var(--o1)" stroke="var(--o2)" stroke-width=".8">' +
      '<path d="M0 0C-15-12-15-36 0-45C15-36 15-12 0 0Z"/>' +
      '<path d="M0 0C-14-12-14-34 0-42C14-34 14-12 0 0Z" transform="rotate(142)"/>' +
      '<path d="M0 0C-14-12-14-34 0-42C14-34 14-12 0 0Z" transform="rotate(-142)"/>' +
      '<path d="M0 0C-4-26-30-42-46-26C-56-12-38 10 0 0Z"/>' +
      '<path d="M0 0C4-26 30-42 46-26C56-12 38 10 0 0Z"/>' +
      '</g>' +
      '<path d="M0 2C-9 6-11 17-4 23C-2 25 2 25 4 23C11 17 9 6 0 2Z" fill="var(--o2)"/>' +
      '<circle cy="-1" r="4" fill="var(--o3)"/>' +
      '</symbol>' +
      // Leaf
      '<symbol id="a-leaf" viewBox="-20 -70 40 75" overflow="visible">' +
      '<path d="M0 0C14-12 16-44 0-66C-16-44-14-12 0 0Z" fill="var(--l1)"/>' +
      '<path d="M0 0C6-12 8-40 0-66C-4-44-4-14 0 0Z" fill="var(--l3)" opacity=".35"/>' +
      '<path d="M0-1L0-60" stroke="var(--l2)" stroke-width="1.1" opacity=".7"/>' +
      '</symbol>' +
      // Berry spray
      '<symbol id="a-berries" viewBox="-25 -50 50 55" overflow="visible">' +
      '<g fill="none" stroke="var(--l2,#3E4419)" stroke-width="1"><path d="M0 0Q-2-20-12-34M0 0Q2-22 4-42M0 0Q6-16 16-30"/></g>' +
      '<g fill="var(--b1)"><circle cx="-12" cy="-35" r="4"/><circle cx="-6" cy="-40" r="3.4"/><circle cx="4" cy="-43" r="4"/><circle cx="10" cy="-38" r="3.2"/><circle cx="16" cy="-31" r="4"/><circle cx="-15" cy="-28" r="3"/></g>' +
      '<g fill="#fff" opacity=".45"><circle cx="-13" cy="-36.5" r="1"/><circle cx="3" cy="-44.5" r="1"/><circle cx="15" cy="-32.5" r="1"/></g>' +
      '</symbol>' +
      fernSymbol() + hydrangeaSymbol();
  }

  function use(id, x, y, size, rot, style, extra) {
    return '<use href="#a-' + id + '" x="' + (-size / 2) + '" y="' + (-size / 2) + '" width="' + size + '" height="' + size +
      '" transform="translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') rotate(' + (rot || 0).toFixed(1) + ')" style="' + style + '"' + (extra || '') + '/>';
  }
  var rose = function (x, y, s, r, p) { return use('rose', x, y, s, r, v(p || P.wine, 'p')); };
  var leaf = function (x, y, s, r, p) { return use('leaf', x, y, s, r, v(p || P.leaf, 'l')); };
  var fern = function (x, y, s, r, p) { return use('fern', x, y, s, r, v(p || P.leaf, 'l')); };
  var orchid = function (x, y, s, r, p) { return use('orchid', x, y, s, r, v(p || P.pinkOrchid, 'o')); };
  var hyd = function (x, y, s, r, p) { return use('hydrangea', x, y, s, r, '--h1:' + (p || P.ivory)[0] + ';--h2:' + (p || P.ivory)[1]); };
  var bud = function (x, y, s, r, p) { return use('bud', x, y, s, r, v(p || P.red, 'p') + ';' + v(P.leaf, 'l')); };
  var berries = function (x, y, s, r, c) { return use('berries', x, y, s, r, '--b1:' + (c || '#9E2333') + ';' + v(P.leaf, 'l')); };

  function orchidStem(x, y, len, angle, count, p) {
    // A cascading orchid spray: a curved stem with blooms getting smaller towards the tip.
    var out = '<g transform="translate(' + x + ' ' + y + ') rotate(' + angle + ')">';
    out += '<path d="M0 0C10 ' + len * 0.3 + ' 4 ' + len * 0.7 + ' 18 ' + len + '" fill="none" stroke="#4A3A1C" stroke-width="1.4"/>';
    for (var i = 0; i < count; i++) {
      var t = (i + 1) / (count + 0.6);
      var py = len * t;
      var px = 10 * Math.sin(t * 2.2) + 18 * t * t;
      var size = 58 - t * 24;
      out += orchid(px, py, size, (i % 2 ? 18 : -14) - angle * 0.4, p);
    }
    return out + '</g>';
  }

  // --------------------------------------------------- compositions
  function cornerCluster(variant) {
    // viewBox 0 0 300 260, anchored at the top-left corner.
    var g = '';
    if (variant === 'tl') {
      g += fern(40, 20, 130, 128, P.leaf) + fern(10, 70, 110, 160, P.sage) + fern(120, 10, 120, 105, P.leaf);
      g += leaf(150, 40, 70, 110, P.sage) + leaf(30, 130, 70, 200, P.leaf) + leaf(95, 95, 60, 150, P.leaf);
      g += orchidStem(150, 30, 150, -38, 5, P.pinkOrchid);
      g += orchidStem(40, 90, 120, 6, 4, P.blush.concat ? P.pinkOrchid : P.pinkOrchid);
      g += hyd(25, 30, 78, 0, P.blush) + berries(120, 76, 40, 150, '#B2283B');
      g += rose(70, 40, 74, 10, P.red) + rose(18, 92, 56, 40, P.wine) + rose(118, 18, 52, -20, P.dusty);
      g += bud(150, 70, 44, 140, P.red) + bud(70, 112, 36, 200, P.dusty);
    } else {
      // bottom-right mirror composition (drawn in same 300x260 box, anchored bottom-right)
      g += fern(260, 240, 130, -52, P.leaf) + fern(290, 190, 110, -20, P.sage) + fern(180, 250, 120, -75, P.leaf);
      g += leaf(150, 225, 70, -70, P.sage) + leaf(270, 130, 70, 20, P.leaf) + leaf(205, 165, 60, -30, P.leaf);
      g += hyd(270, 225, 84, 0, P.ivory) + berries(178, 190, 40, -30, '#B2283B');
      g += rose(228, 222, 76, 20, P.wine) + rose(282, 168, 58, -15, P.red) + rose(178, 244, 54, 45, P.dusty);
      g += orchidStem(250, 175, 90, 200, 3, P.pinkOrchid);
      g += bud(150, 196, 42, -40, P.red) + bud(235, 150, 36, 15, P.dusty);
    }
    return g;
  }

  function sprig(color) {
    // A tiny horizontal ornament: two leaves and a bud.
    return '<svg viewBox="-60 -18 120 36" aria-hidden="true" class="sprig">' +
      '<path d="M-52 4Q0-6 52 4" fill="none" stroke="' + (color || '#636B2F') + '" stroke-width="1"/>' +
      leaf(-26, 1, 26, -70, P.leaf) + leaf(26, 1, 26, 70, P.leaf) + leaf(-40, 3, 20, -110, P.sage) + leaf(40, 3, 20, 110, P.sage) +
      rose(0, 0, 22, 0, P.dusty) + '</svg>';
  }

  // --------------------------------------------------- mood board plates (viewBox 0 0 400 500)
  function plateRoses() {
    var r = rng(7);
    var g = '<rect width="400" height="500" fill="#1E0609"/>';
    // greenery underlayer
    for (var i = 0; i < 26; i++) g += (i % 3 ? leaf : fern)(r() * 400, r() * 500, 60 + r() * 60, r() * 360, i % 2 ? P.pine : P.leaf);
    var pals = [P.red, P.wine, P.red, P.dusty, P.wine, P.red, P.blush];
    for (var row = 0; row < 7; row++) {
      for (var col = 0; col < 5; col++) {
        var x = col * 92 + (row % 2) * 46 - 20 + (r() - 0.5) * 24;
        var y = row * 80 - 10 + (r() - 0.5) * 24;
        var k = r();
        if (k < 0.12) g += hyd(x, y, 92, 0, P.wine);
        else if (k < 0.2) g += berries(x, y, 56, r() * 360, '#C23348');
        else g += rose(x, y, 64 + r() * 36, r() * 360, pals[Math.floor(r() * pals.length)]);
      }
    }
    g += '<rect width="400" height="500" fill="url(#pl-vig)"/>';
    return '<defs><radialGradient id="pl-vig" cx=".5" cy=".45" r=".7"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></radialGradient></defs>' + g;
  }

  function plateCandles() {
    var folds = '';
    for (var i = 0; i < 12; i++) {
      var x = i * 36 - 10;
      folds += '<rect x="' + x + '" y="0" width="38" height="330" fill="url(#pc-fold)" opacity="' + (0.65 + (i % 3) * 0.12) + '"/>';
    }
    function taper(x, h, lit, delay) {
      var top = 330 - h;
      return '<g>' +
        '<ellipse cx="' + x + '" cy="' + (top - 30) + '" rx="46" ry="60" fill="url(#a-glow)" class="glow" style="animation-delay:' + delay + 's"/>' +
        '<rect x="' + (x - 7) + '" y="' + top + '" width="14" height="' + h + '" rx="3" fill="url(#pc-wax)"/>' +
        '<path d="M' + x + ' ' + top + 'v-6" stroke="#2A1A10" stroke-width="1.4"/>' +
        (lit ? '<path class="flame" style="animation-delay:' + delay + 's;transform-origin:' + x + 'px ' + (top - 6) + 'px" d="M' + x + ' ' + (top - 30) + 'C' + (x - 7) + ' ' + (top - 18) + ' ' + (x - 6) + ' ' + (top - 6) + ' ' + x + ' ' + (top - 5) + 'C' + (x + 6) + ' ' + (top - 6) + ' ' + (x + 7) + ' ' + (top - 18) + ' ' + x + ' ' + (top - 30) + 'Z" fill="#FFD27A"/>' +
          '<path d="M' + x + ' ' + (top - 20) + 'C' + (x - 3) + ' ' + (top - 13) + ' ' + (x - 2) + ' ' + (top - 8) + ' ' + x + ' ' + (top - 7) + 'C' + (x + 2) + ' ' + (top - 8) + ' ' + (x + 3) + ' ' + (top - 13) + ' ' + x + ' ' + (top - 20) + 'Z" fill="#FFF6DA"/>' : '') +
        '</g>';
    }
    function pillar(x, w, h, delay) {
      var top = 390 - h;
      return '<ellipse cx="' + x + '" cy="' + (top - 26) + '" rx="40" ry="44" fill="url(#a-glow)" class="glow" style="animation-delay:' + delay + 's"/>' +
        '<rect x="' + (x - w / 2) + '" y="' + top + '" width="' + w + '" height="' + h + '" rx="4" fill="url(#pc-pillar)"/>' +
        '<ellipse cx="' + x + '" cy="' + top + '" rx="' + w / 2 + '" ry="4" fill="#FFF6E2"/>' +
        '<path class="flame" style="animation-delay:' + delay + 's;transform-origin:' + x + 'px ' + (top - 3) + 'px" d="M' + x + ' ' + (top - 24) + 'C' + (x - 6) + ' ' + (top - 14) + ' ' + (x - 5) + ' ' + (top - 4) + ' ' + x + ' ' + (top - 3) + 'C' + (x + 5) + ' ' + (top - 4) + ' ' + (x + 6) + ' ' + (top - 14) + ' ' + x + ' ' + (top - 24) + 'Z" fill="#FFD27A"/>';
    }
    return '<defs>' +
      '<linearGradient id="pc-fold" x1="0" x2="1"><stop offset="0" stop-color="#C9AE84"/><stop offset=".45" stop-color="#F1DFBD"/><stop offset=".7" stop-color="#E4CDA4"/><stop offset="1" stop-color="#BDA078"/></linearGradient>' +
      '<linearGradient id="pc-wax" x1="0" x2="1"><stop offset="0" stop-color="#3B0C13"/><stop offset=".4" stop-color="#8C2B35"/><stop offset=".6" stop-color="#6E1C28"/><stop offset="1" stop-color="#3B0C13"/></linearGradient>' +
      '<linearGradient id="pc-pillar" x1="0" x2="1"><stop offset="0" stop-color="#D9C39C"/><stop offset=".45" stop-color="#FFF4DC"/><stop offset="1" stop-color="#CDB48A"/></linearGradient>' +
      '<linearGradient id="pc-cloth" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E9D4AE"/><stop offset="1" stop-color="#B99B70"/></linearGradient>' +
      '</defs>' +
      '<rect width="400" height="500" fill="#2A1612"/>' + folds +
      '<rect width="400" height="330" fill="#2A0A0E" opacity=".35"/>' +
      '<path d="M-10 330Q200 316 410 330V500H-10Z" fill="url(#pc-cloth)"/>' +
      '<path d="M40 340Q60 420 30 500M120 336Q140 430 110 500M220 334Q236 420 214 500M310 338Q330 420 300 500" stroke="#A88A60" stroke-width="10" opacity=".35" fill="none"/>' +
      taper(120, 170, true, 0) + taper(162, 205, true, 0.6) + taper(204, 150, true, 1.2) +
      pillar(270, 46, 92, 0.3) + pillar(326, 40, 64, 0.9) +
      rose(80, 380, 78, 20, P.wine) + rose(40, 420, 64, -40, P.red) + rose(118, 418, 58, 80, P.dusty) +
      leaf(20, 380, 60, -60) + leaf(150, 400, 54, 70) + bud(160, 380, 40, 30, P.red) +
      '<rect width="400" height="500" fill="#3B0C13" opacity=".08"/>';
  }

  function plateGlasses() {
    function glass(x, y, tilt, fill) {
      return '<g transform="translate(' + x + ' ' + y + ') rotate(' + tilt + ')">' +
        '<clipPath id="pg-c' + x + '"><path d="M-42 -120C-46 -70 -32 -36 0 -34C32 -36 46 -70 42 -120Z"/></clipPath>' +
        '<g clip-path="url(#pg-c' + x + ')"><rect x="-60" y="-92" width="120" height="70" fill="' + fill + '"/>' +
        '<path d="M-60 -92Q-30 -98 0 -92T60 -92" fill="#B9525F" opacity=".5"/></g>' +
        '<path d="M-42 -120C-46 -70 -32 -36 0 -34C32 -36 46 -70 42 -120" fill="#fff" fill-opacity=".14" stroke="#FFF7EA" stroke-width="2.2"/>' +
        '<path d="M-30 -110C-32 -80 -26 -60 -14 -50" stroke="#fff" stroke-opacity=".7" stroke-width="3" fill="none" stroke-linecap="round"/>' +
        '<path d="M0 -34V40" stroke="#FFF7EA" stroke-width="3"/>' +
        '<ellipse cx="0" cy="42" rx="30" ry="6" fill="#fff" fill-opacity=".25" stroke="#FFF7EA" stroke-width="2"/>' +
        '</g>';
    }
    return '<defs><linearGradient id="pg-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F3D3C8"/><stop offset="1" stop-color="#E2A99F"/></linearGradient>' +
      '<linearGradient id="pg-bottle" x1="0" x2="1"><stop offset="0" stop-color="#22060A"/><stop offset=".35" stop-color="#5A1420"/><stop offset=".5" stop-color="#7C2734"/><stop offset="1" stop-color="#22060A"/></linearGradient></defs>' +
      '<rect width="400" height="500" fill="url(#pg-bg)"/>' +
      '<circle cx="320" cy="90" r="120" fill="#fff" opacity=".25"/>' +
      // bottle
      '<g transform="translate(300 140)"><path d="M-14 0H14V60C14 80 44 92 44 130V330H-44V130C-44 92 -14 80 -14 60Z" fill="url(#pg-bottle)"/>' +
      '<rect x="-15" y="-8" width="30" height="22" rx="3" fill="#3B0C13"/><rect x="-36" y="190" width="72" height="84" fill="#F5E3B5"/>' +
      '<rect x="-28" y="200" width="56" height="64" fill="none" stroke="#8C2B35" stroke-width="1.2"/>' +
      '<path d="M-14 232h28" stroke="#8C2B35" stroke-width="1.2"/><circle cx="0" cy="218" r="6" fill="none" stroke="#8C2B35"/></g>' +
      '<path d="M-10 410Q200 396 410 410V500H-10Z" fill="#C98378" opacity=".55"/>' +
      glass(150, 360, -14, '#5E1220') + glass(232, 372, 12, '#8C2B35') +
      '<g stroke="#FFF7EA" stroke-width="2" stroke-linecap="round"><path d="M196 214l-6-14M206 210l2-16M216 214l9-12"/></g>' +
      rose(60, 450, 70, 10, P.wine) + rose(110, 470, 56, 60, P.dusty) + leaf(30, 430, 56, -50) + leaf(140, 440, 46, 60) +
      berries(350, 470, 46, -20, '#8C2B35');
  }

  function plateGames() {
    function card(x, y, rot, suit, label) {
      return '<g transform="translate(' + x + ' ' + y + ') rotate(' + rot + ')">' +
        '<rect x="-46" y="-66" width="92" height="132" rx="8" fill="#FBF1DC" stroke="#D9C39C"/>' +
        '<rect x="-38" y="-58" width="76" height="116" rx="4" fill="none" stroke="#E7D3AE"/>' +
        '<text x="-36" y="-40" font-family="Georgia,serif" font-size="18" fill="#8C2B35">' + label + '</text>' +
        '<text x="0" y="12" text-anchor="middle" font-family="Georgia,serif" font-size="40" fill="' + (suit === '♣' || suit === '♠' ? '#3B0C13' : '#8C2B35') + '">' + suit + '</text>' +
        '<text x="36" y="56" text-anchor="end" font-family="Georgia,serif" font-size="18" fill="#8C2B35" transform="rotate(180 30 50)">' + label + '</text>' +
        '</g>';
    }
    function die(x, y, rot, pips) {
      var pos = { 1: [[0, 0]], 2: [[-9, -9], [9, 9]], 3: [[-9, -9], [0, 0], [9, 9]], 4: [[-9, -9], [9, -9], [-9, 9], [9, 9]], 5: [[-9, -9], [9, -9], [0, 0], [-9, 9], [9, 9]], 6: [[-9, -10], [9, -10], [-9, 0], [9, 0], [-9, 10], [9, 10]] }[pips];
      return '<g transform="translate(' + x + ' ' + y + ') rotate(' + rot + ')">' +
        '<rect x="-21" y="-17" width="42" height="42" rx="9" fill="#C8B08A"/>' +
        '<rect x="-21" y="-21" width="42" height="42" rx="9" fill="#FFF6E4"/>' +
        pos.map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="4" fill="#3B0C13"/>'; }).join('') + '</g>';
    }
    return '<defs><radialGradient id="pgm-felt" cx=".5" cy=".45" r=".75"><stop offset="0" stop-color="#7A8340"/><stop offset=".7" stop-color="#5A6228"/><stop offset="1" stop-color="#3E4419"/></radialGradient></defs>' +
      '<rect width="400" height="500" fill="url(#pgm-felt)"/>' +
      '<g opacity=".08" stroke="#000">' + Array.from({ length: 40 }, function (_, i) { return '<path d="M0 ' + i * 13 + 'H400"/>'; }).join('') + '</g>' +
      card(150, 200, -24, '♥', 'A') + card(200, 186, -6, '♠', 'K') + card(250, 196, 12, '♦', 'Q') + card(300, 220, 28, '♣', 'J') +
      die(120, 360, -16, 5) + die(178, 384, 12, 3) +
      '<g transform="translate(300 380)"><circle r="34" fill="#3B0C13"/><circle r="27" fill="none" stroke="#F5E3B5" stroke-dasharray="5 6" stroke-width="3"/><circle r="17" fill="#8C2B35"/></g>' +
      '<g transform="translate(330 340)"><circle r="34" fill="#F5E3B5"/><circle r="27" fill="none" stroke="#8C2B35" stroke-dasharray="5 6" stroke-width="3"/><circle r="17" fill="#EBBDB1"/></g>' +
      rose(60, 90, 74, 30, P.red) + leaf(30, 130, 60, -120) + leaf(100, 70, 50, 60) + rose(360, 460, 70, -10, P.wine) + leaf(330, 470, 50, -80);
  }

  function plateVinyl() {
    var grooves = '';
    for (var i = 0; i < 14; i++) grooves += '<circle r="' + (58 + i * 5.6) + '" fill="none" stroke="#2C2C2C" stroke-width="1"/>';
    return '<defs><linearGradient id="pv-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F2CFC5"/><stop offset="1" stop-color="#E0A397"/></linearGradient>' +
      '<linearGradient id="pv-shine" x1="0" y1="0" x2="1" y2="1"><stop offset=".3" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".16"/><stop offset=".7" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>' +
      '<rect width="400" height="500" fill="url(#pv-bg)"/>' +
      '<rect x="40" y="70" width="250" height="250" fill="#3B0C13"/>' +
      '<rect x="56" y="86" width="218" height="218" fill="none" stroke="#F5E3B5" stroke-opacity=".5"/>' +
      '<g transform="translate(165 195)">' + rose(0, 0, 120, 0, P.dusty) + '</g>' +
      '<g class="spin" style="transform-origin:250px 300px"><g transform="translate(250 300)">' +
      '<circle r="140" fill="#141012"/>' + grooves +
      '<circle r="48" fill="#8C2B35"/><circle r="40" fill="none" stroke="#F5E3B5" stroke-opacity=".6"/>' +
      '<path d="M-20 -6h40M-14 6h28" stroke="#F5E3B5" stroke-width="2" opacity=".75"/><circle r="5" fill="#E0A397"/>' +
      '</g></g>' +
      '<circle cx="250" cy="300" r="140" fill="url(#pv-shine)"/>' +
      '<g fill="#3B0C13" opacity=".85" font-family="Georgia,serif" font-size="34"><text x="60" y="420">♪</text><text x="96" y="454" font-size="24">♫</text></g>' +
      leaf(370, 70, 70, 210) + leaf(340, 40, 60, 160, P.sage) + rose(380, 110, 54, 20, P.red) + bud(330, 100, 40, 200, P.dusty);
  }

  var PLATES = [plateRoses, plateCandles, plateGlasses, plateGames, plateVinyl];

  function plate(i) {
    return '<svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" role="img" aria-hidden="true">' + PLATES[i % PLATES.length]() + '</svg>';
  }

  // Self-contained SVG (own defs) for drawing onto a canvas when saving the guest pass.
  function passFlorals(w, h) {
    var s = 1.5;
    return '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '">' +
      defs().replace(/href="#/g, 'xlink:href="#') +
      '<g transform="scale(' + s + ')">' + cornerCluster('tl').replace(/href="#/g, 'xlink:href="#') + '</g>' +
      '<g transform="translate(' + (w - 300 * s) + ' ' + (h - 260 * s) + ') scale(' + s + ')">' + cornerCluster('br').replace(/href="#/g, 'xlink:href="#') + '</g>' +
      '</svg>';
  }

  // --------------------------------------------------- stationery pieces (standalone SVGs, also drawable on canvas)
  var XMLNS = ' xmlns="http://www.w3.org/2000/svg"';
  var uid = 0;
  function svg(vb, inner, cls) {
    return '<svg' + XMLNS + ' viewBox="' + vb + '" aria-hidden="true" focusable="false"' + (cls ? ' class="' + cls + '"' : '') + '>' + inner + '</svg>';
  }
  function miniRose(x, y, s, c1, c2, c3) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')">' +
      ring(5, 0, 1, 'fill="' + c1 + '" stroke="' + c3 + '" stroke-width="1.6" stroke-opacity=".8"') +
      ring(5, 36, 0.68, 'fill="' + c2 + '" stroke="' + c3 + '" stroke-width="2" stroke-opacity=".85"') +
      ring(4, 12, 0.42, 'fill="' + c2 + '" stroke="' + c3 + '" stroke-width="2.4"') +
      '<path d="M-3 1C-3-5 5-6 6 0C7 6-2 9-7 4" fill="none" stroke="' + c3 + '" stroke-width="2"/></g>';
  }
  function miniLeaf(x, y, s, r, c) {
    return '<path d="M0 0C14-12 16-44 0-66C-16-44-14-12 0 0Z" fill="' + (c || '#636B2F') + '" transform="translate(' + x + ' ' + y + ') rotate(' + r + ') scale(' + s + ')"/>';
  }
  var HEART = 'M0 10C-14-2-14-14-6-15C-2-15.5 0-12 0-10C0-12 2-15.5 6-15C14-14 14-2 0 10Z';

  function cherryPair(x, y, s) {
    var id = 'ch' + (++uid);
    return '<defs><radialGradient id="' + id + '" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#D9475A"/><stop offset=".55" stop-color="#9E1F30"/><stop offset="1" stop-color="#5A0E1A"/></radialGradient></defs>' +
      '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')">' +
      '<path d="M50 10C44 30 34 50 30 74M50 10C56 32 64 54 70 80" fill="none" stroke="#4A3A1C" stroke-width="2.6" stroke-linecap="round"/>' +
      miniLeaf(52, 12, 0.42, 62, '#636B2F') + miniLeaf(50, 12, 0.3, 20, '#8E9650') +
      '<circle cx="30" cy="86" r="17" fill="url(#' + id + ')"/><circle cx="70" cy="92" r="17" fill="url(#' + id + ')"/>' +
      '<ellipse cx="24" cy="79" rx="5" ry="3.4" fill="#fff" opacity=".55" transform="rotate(-30 24 79)"/>' +
      '<ellipse cx="64" cy="85" rx="5" ry="3.4" fill="#fff" opacity=".55" transform="rotate(-30 64 85)"/>' +
      '<path d="M27 71q3 3 6 0M67 77q3 3 6 0" stroke="#3B0C13" stroke-width="1.4" fill="none" opacity=".6"/></g>';
  }

  function cherries() { return svg('0 -14 100 126', cherryPair(0, 0, 1)); }

  function kiss(color) {
    var c = color || '#8C2B35';
    var lines = '';
    for (var i = 0; i < 9; i++) {
      var x = 22 + i * 9.5;
      lines += '<path d="M' + x + ' ' + (36 - Math.abs(i - 4) * 1.2) + 'q' + (i - 4) * 0.6 + ' 8 ' + (i - 4) * 1.4 + ' ' + (14 - Math.abs(i - 4)) + '" />';
      lines += '<path d="M' + (x + 2) + ' ' + (32 - Math.abs(i - 4) * 1.5) + 'q' + (i - 4) * 0.4 + ' -6 ' + (i - 4) * 0.9 + ' -' + (10 - Math.abs(i - 4)) + '" />';
    }
    return svg('0 0 120 76',
      '<g fill="' + c + '">' +
      '<path d="M4 38C16 18 34 10 50 22C54 25 58 26 60 24C62 26 66 25 70 22C86 10 104 18 116 38C100 40 84 40 70 37C66 36 62 37 60 38C58 37 54 36 50 37C36 40 20 40 4 38Z"/>' +
      '<path d="M4 38.5C20 42 36 42 50 39.5C54 38.8 58 39.6 60 39.6C62 39.6 66 38.8 70 39.5C84 42 100 42 116 38.5C104 60 84 70 60 70C36 70 16 60 4 38.5Z"/>' +
      '</g><g stroke="#fff" stroke-opacity=".28" stroke-width="1.6" fill="none" stroke-linecap="round">' + lines + '</g>' +
      '<path d="M20 52C36 62 84 62 100 52" stroke="#fff" stroke-opacity=".22" stroke-width="3" fill="none"/>', 'kiss-art');
  }

  function sparkles(color) {
    var c = color || '#3B0C13';
    var star = 'M0-24C1.6-6 6-1.6 24 0C6 1.6 1.6 6 0 24C-1.6 6-6 1.6-24 0C-6-1.6-1.6-6 0-24Z';
    return svg('0 0 100 80', '<path d="' + star + '" fill="' + c + '" transform="translate(36 36) scale(1.2)"/><path d="' + star + '" fill="' + c + '" transform="translate(78 58) scale(.62)"/>');
  }

  function twoOfHearts() {
    return svg('0 0 100 140',
      '<rect x="2" y="2" width="96" height="136" rx="9" fill="#FFF9EE" stroke="#D9C39C" stroke-width="2"/>' +
      '<rect x="9" y="9" width="82" height="122" rx="5" fill="none" stroke="#EBD8B6"/>' +
      '<text x="12" y="30" font-family="Cormorant Garamond,Georgia,serif" font-size="24" font-weight="600" fill="#8C2B35">2</text>' +
      '<path d="' + HEART + '" fill="#8C2B35" transform="translate(18 42) scale(.55)"/>' +
      '<g transform="rotate(180 50 70)"><text x="12" y="30" font-family="Cormorant Garamond,Georgia,serif" font-size="24" font-weight="600" fill="#8C2B35">2</text>' +
      '<path d="' + HEART + '" fill="#8C2B35" transform="translate(18 42) scale(.55)"/></g>' +
      '<path d="' + HEART + '" fill="#8C2B35" transform="translate(50 44) scale(1.25)"/>' +
      '<path d="' + HEART + '" fill="#8C2B35" transform="translate(50 98) rotate(180) scale(1.25)"/>');
  }

  function cardBack() {
    var lattice = '';
    for (var i = -140; i < 240; i += 12) lattice += '<path d="M' + i + ' 0l140 140M' + (i + 140) + ' 0l-140 140"/>';
    return svg('0 0 100 140',
      '<defs><clipPath id="cbk"><rect x="9" y="9" width="82" height="122" rx="5"/></clipPath></defs>' +
      '<rect x="2" y="2" width="96" height="136" rx="9" fill="#FFF9EE" stroke="#D9C39C" stroke-width="2"/>' +
      '<rect x="9" y="9" width="82" height="122" rx="5" fill="#6B1824"/>' +
      '<g clip-path="url(#cbk)" stroke="#EBBDB1" stroke-opacity=".28" stroke-width="1">' + lattice + '</g>' +
      '<circle cx="50" cy="70" r="20" fill="#6B1824" stroke="#F5E3B5" stroke-width="1.4"/>' +
      '<text x="50" y="78" text-anchor="middle" font-family="Cormorant Garamond,Georgia,serif" font-size="22" font-weight="600" fill="#F5E3B5">II</text>');
  }

  function stamp(kind) {
    var id = 'st' + (++uid);
    var holes = '';
    for (var x = 0; x <= 100; x += 10) holes += '<circle cx="' + x + '" cy="0" r="4"/><circle cx="' + x + '" cy="120" r="4"/>';
    for (var y = 10; y < 120; y += 10) holes += '<circle cx="0" cy="' + y + '" r="4"/><circle cx="100" cy="' + y + '" r="4"/>';
    var art;
    if (kind === 'cherries') {
      art = '<rect x="10" y="10" width="80" height="100" fill="#6B1824"/>' + cherryPair(18, 18, 0.64) +
        '<text x="82" y="102" text-anchor="end" font-family="Cormorant Garamond,Georgia,serif" font-size="14" font-weight="600" fill="#F5E3B5">21</text>';
    } else if (kind === 'heart') {
      art = '<rect x="10" y="10" width="80" height="100" fill="#636B2F"/><g transform="translate(28 26) scale(.44)">' + twoOfHearts().replace(/^<svg[^>]*>|<\/svg>$/g, '') + '</g>' +
        '<text x="82" y="102" text-anchor="end" font-family="Cormorant Garamond,Georgia,serif" font-size="14" font-weight="600" fill="#F5E3B5">II</text>';
    } else {
      art = '<rect x="10" y="10" width="80" height="100" fill="#EBBDB1"/><circle cx="50" cy="58" r="34" fill="#F5D3C8"/>' +
        miniLeaf(36, 78, 0.5, -50) + miniLeaf(64, 80, 0.46, 46, '#8E9650') + miniRose(50, 56, 0.5, '#8C2B35', '#6B1824', '#C9606C') +
        '<text x="18" y="26" font-family="Cormorant Garamond,Georgia,serif" font-size="14" font-weight="600" fill="#3B0C13">21</text>';
    }
    return svg('0 0 100 120',
      '<defs><mask id="' + id + '"><rect width="100" height="120" fill="#fff"/><g fill="#000">' + holes + '</g></mask></defs>' +
      '<g mask="url(#' + id + ')"><rect width="100" height="120" fill="#FFFDF8"/>' + art +
      '<rect x="10" y="10" width="80" height="100" fill="none" stroke="#000" stroke-opacity=".12"/></g>', 'stamp');
  }

  function candles() {
    function one(x, h, delay) {
      var top = 118 - h;
      return '<g>' +
        '<ellipse cx="' + x + '" cy="' + (top - 10) + '" rx="10" ry="14" fill="#FFD27A" opacity=".16" class="glow" style="animation-delay:' + delay + 's"/>' +
        '<path class="flame" style="animation-delay:' + delay + 's;transform-origin:' + x + 'px ' + (top - 2) + 'px" d="M' + x + ' ' + (top - 16) + 'C' + (x - 4) + ' ' + (top - 9) + ' ' + (x - 3.5) + ' ' + (top - 3) + ' ' + x + ' ' + (top - 2) + 'C' + (x + 3.5) + ' ' + (top - 3) + ' ' + (x + 4) + ' ' + (top - 9) + ' ' + x + ' ' + (top - 16) + 'Z" fill="#FFD989"/>' +
        '<rect x="' + (x - 3.5) + '" y="' + top + '" width="7" height="' + h + '" rx="1.5" fill="url(#cdw)"/>' +
        '<path d="M' + (x - 9) + ' 118h18l-3 5h-12z" fill="url(#cdg)"/><rect x="' + (x - 1.6) + '" y="123" width="3.2" height="16" fill="url(#cdg)"/>' +
        '<ellipse cx="' + x + '" cy="140" rx="11" ry="3" fill="url(#cdg)"/>' +
        '</g>';
    }
    return svg('0 0 90 146',
      '<defs><linearGradient id="cdw" x1="0" x2="1"><stop offset="0" stop-color="#E9D7B0"/><stop offset=".5" stop-color="#FFF7E6"/><stop offset="1" stop-color="#D8C39A"/></linearGradient>' +
      '<linearGradient id="cdg" x1="0" x2="1"><stop offset="0" stop-color="#8C6A2E"/><stop offset=".45" stop-color="#E8C77E"/><stop offset="1" stop-color="#9A7533"/></linearGradient></defs>' +
      one(22, 74, 0) + one(45, 96, 0.5) + one(68, 62, 1), 'candles');
  }

  function seal() {
    var pts = [];
    for (var i = 0; i < 28; i++) {
      var a = (i / 28) * Math.PI * 2;
      var r = 44 + Math.sin(i * 2.7) * 2.6 + (i % 3 === 0 ? 2.2 : 0);
      pts.push((Math.cos(a) * r).toFixed(1) + ' ' + (Math.sin(a) * r).toFixed(1));
    }
    return svg('-50 -50 100 100',
      '<defs><radialGradient id="sealg" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#C25664"/><stop offset=".6" stop-color="#8C2B35"/><stop offset="1" stop-color="#5A1320"/></radialGradient></defs>' +
      '<path d="M' + pts.join('L') + 'Z" fill="url(#sealg)"/>' +
      '<circle r="31" fill="none" stroke="#5A1320" stroke-width="2.4" opacity=".55"/><circle r="31" fill="none" stroke="#E7A2AB" stroke-width="1" opacity=".5" transform="translate(-.8 -.8)"/>' +
      '<path d="' + HEART + '" fill="#6E1C28" transform="translate(-7 2) scale(1.05)"/><path d="' + HEART + '" fill="#A9404D" transform="translate(7 2) scale(1.05)"/>' +
      '<path d="' + HEART + '" fill="none" stroke="#E9A3AC" stroke-width="1" opacity=".55" transform="translate(6.2 1.2) scale(1.05)"/>', 'seal');
  }

  window.ART = {
    defs: defs,
    stamp: stamp, kiss: kiss, cherries: cherries, sparkles: sparkles, twoOfHearts: twoOfHearts, cardBack: cardBack, candles: candles, seal: seal,
    sprite: function () { return '<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">' + defs() + '</svg>'; },
    corner: function (variant) {
      return '<svg viewBox="0 0 300 260" aria-hidden="true" focusable="false" preserveAspectRatio="' + (variant === 'tl' ? 'xMinYMin' : 'xMaxYMax') + ' meet"><g class="sway">' + cornerCluster(variant) + '</g></svg>';
    },
    sprig: sprig,
    plate: plate,
    plateCount: PLATES.length,
    passFlorals: passFlorals,
    rose: rose, leaf: leaf, bud: bud, P: P,
  };
})();
