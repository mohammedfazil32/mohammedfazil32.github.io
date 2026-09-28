/* ==========================================================================
   Mohammed Fazil T — portfolio behaviour (vanilla JS, no dependencies)

   1  Helpers & environment        7  Diagram renderer
   2  Recruiter View               8  Hero system + status terminal
   3  Reveal · count-up · viz      9  Architecture simulator
   4  Nav · scroll · scroll-spy    10 Projects: tabs, previews, full-screen modal
   5  Pointer effects              11 Technology dependency map
   6  Experience accordion         12 Command palette · 13 Contact
   ========================================================================== */
(function () {
  'use strict';

  /* ---------- 1. HELPERS & ENVIRONMENT ------------------------------------ */
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var root = document.documentElement;

  var reducedMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  var fineMQ    = window.matchMedia('(hover: hover) and (pointer: fine)');
  var reduced    = function () { return reducedMQ.matches; };
  var recruiter  = function () { return root.classList.contains('is-recruiter'); };
  var decorative = function () { return !reduced() && !recruiter(); };

  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage blocked — the preference just won't persist */ } }
  };

  var RESUME_URL  = 'Mohammed_Fazil_Java_SpringBoot_Developer_260926.pdf';
  var RESUME_NAME = 'Mohammed_Fazil_Java_SpringBoot_Developer.pdf';
  var EMAIL       = 'mohammedfazil6652@gmail.com';
  var LINKEDIN    = 'https://www.linkedin.com/in/mohammed-fazil-9b6571228';
  var GITHUB      = 'https://github.com/mohammedfazil32';

  var yearEl = $('#year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  var kbd = $('#cmdKbd');
  if (kbd && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)) kbd.textContent = '⌘ K';

  var toastEl = $('#toast'), toastTimer;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-on'); }, 2400);
  }

  function downloadResume() {
    var a = document.createElement('a');
    a.href = RESUME_URL; a.download = RESUME_NAME;
    document.body.appendChild(a); a.click(); a.remove();
    toast('Downloading résumé…');
  }

  function isHidden(el) { return !el || (el.offsetParent === null && getComputedStyle(el).position !== 'fixed'); }

  function goTo(id, after) {
    var el = document.getElementById(id);
    if (!el) return;
    if (isHidden(el) && recruiter()) setRecruiter(false, true);
    requestAnimationFrame(function () {
      el.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
      if (history.replaceState) history.replaceState(null, '', '#' + id);
      if (after) setTimeout(after, reduced() ? 0 : 450);
    });
  }

  /* ---------- 2. RECRUITER VIEW ------------------------------------------ */
  var rbar = $('#rbar');

  function setRecruiter(on, quiet) {
    root.classList.toggle('is-recruiter', on);
    if (rbar) rbar.hidden = !on;
    $$('.rec-btn').forEach(function (b) { b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
    store.set('mf-view', on ? 'recruiter' : 'full');
    setAllAchievements(on);
    syncCaseTabs();
    if (on) {
      $$('.rv').forEach(function (el) { el.classList.add('is-in'); });
      finishCounts();
    }
    updateCursorGlow();
    kick();
    requestAnimationFrame(function () { updateNavIndicator(); onScroll(); });
    if (!quiet) toast(on ? 'Recruiter View — summary first, decoration off' : 'Full portfolio view');
  }

  $$('[data-recruiter-toggle]').forEach(function (b) {
    b.addEventListener('click', function () { setRecruiter(!recruiter()); });
  });

  /* ---------- 3. REVEAL · COUNT-UP · METRIC VISUALS ----------------------- */
  // the 30-endpoint grid is generated so the markup stays readable
  $$('.viz-grid').forEach(function (g) {
    var n = parseInt(g.dataset.cells, 10) || 0, html = '';
    for (var i = 0; i < n; i++) html += '<i style="--i:' + i + '"></i>';
    g.innerHTML = html;
  });

  var counts = $$('.count');
  counts.forEach(function (el) { el.dataset.final = el.textContent; });
  // reserve each number's final width so counting never moves the unit beside it;
  // re-measured once web fonts land, since the fallback font has different digit widths
  function reserveCountWidths() {
    counts.forEach(function (el) {
      var cur = el.textContent;
      el.style.minWidth = '';
      el.textContent = el.dataset.final;
      el.style.minWidth = Math.ceil(el.getBoundingClientRect().width) + 'px';
      el.textContent = cur;
    });
  }
  reserveCountWidths();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(reserveCountWidths);

  function finishCounts() { counts.forEach(function (el) { el.textContent = el.dataset.final; el.dataset.done = '1'; }); }

  function runCount(el) {
    if (el.dataset.done) return;
    el.dataset.done = '1';
    var to = parseInt(el.dataset.to, 10) || 0;
    if (!decorative()) { el.textContent = String(to); return; }
    var dur = 1100, t0 = performance.now();
    (function step(now) {
      var p = Math.min(1, (now - t0) / dur);
      el.textContent = String(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }

  var revealables = $$('.rv');
  if (!('IntersectionObserver' in window) || !decorative()) {
    revealables.forEach(function (el) { el.classList.add('is-in'); });
    finishCounts();
  } else {
    counts.forEach(function (el) { el.textContent = '0'; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        $$('.count', e.target).forEach(runCount);
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealables.forEach(function (el) { io.observe(el); });
    requestAnimationFrame(function () { $$('.hero .rv').forEach(function (el) { el.classList.add('is-in'); }); });
  }

  /* ---------- 4. NAV · SCROLL · SCROLL-SPY ------------------------------- */
  var nav = $('#nav'), bar = $('#progressBar'), toTop = $('#toTop'), navInd = $('#navInd');
  var navLinks = $$('.nav-links > .nav-link');
  var spyIds = navLinks.map(function (l) { return l.dataset.target; }).concat(['credentials']);
  var activeId = null, ticking = false;

  function updateNavIndicator() {
    if (!navInd) return;
    var link = activeId && $('.nav-links > .nav-link[data-target="' + activeId + '"]');
    if (!link || isHidden(link)) { navInd.classList.remove('is-on'); return; }
    navInd.style.transform = 'translateX(' + (link.offsetLeft + link.offsetWidth / 2 - 7) + 'px)';
    navInd.classList.add('is-on');
  }

  function onScroll() {
    ticking = false;
    var y = window.scrollY, docH = document.documentElement.scrollHeight, vh = window.innerHeight;
    var max = docH - vh;
    if (nav) nav.classList.toggle('is-stuck', y > 8);
    if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')';
    if (toTop) toTop.classList.toggle('is-on', y > 800);

    // active section: the last visible target whose top has passed ~35% of the viewport
    var line = y + vh * 0.35, next = null;
    spyIds.forEach(function (id) {
      var s = document.getElementById(id);
      if (s && !isHidden(s) && s.offsetTop <= line) next = id;
    });
    if (next === 'credentials') next = 'stack';       // credentials sits between stack and contact, not in the bar
    if (y + vh >= docH - 4) next = 'contact';
    if (next !== activeId) {
      activeId = next;
      $$('.nav-link').forEach(function (l) {
        var on = l.dataset.target === activeId;
        l.classList.toggle('is-active', on);
        if (on) l.setAttribute('aria-current', 'true'); else l.removeAttribute('aria-current');
      });
      updateNavIndicator();
    }
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  window.addEventListener('resize', function () { updateNavIndicator(); if (window.innerWidth > 1120) setMenu(false); syncCaseTabs(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(updateNavIndicator);

  if (toTop) toTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduced() ? 'auto' : 'smooth' }); });

  var burger = $('#burger'), menu = $('#navLinks'), scrim = $('#navScrim');
  function setMenu(open) {
    if (!burger || !menu) return;
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.classList.toggle('is-open', open);
    if (scrim) scrim.classList.toggle('is-open', open);
    document.body.classList.toggle('is-locked', open);
    if (open) { var first = $('.nav-link', menu); if (first) first.focus(); }
  }
  if (burger) burger.addEventListener('click', function () { setMenu(burger.getAttribute('aria-expanded') !== 'true'); });
  if (scrim) scrim.addEventListener('click', function () { setMenu(false); });
  $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && burger && burger.getAttribute('aria-expanded') === 'true') { setMenu(false); burger.focus(); }
  });

  /* ---------- 5. POINTER EFFECTS ----------------------------------------- */
  // cursor glow, card illumination, restrained tilt, magnetic buttons — fine pointers only
  var glow = $('#cursorGlow'), gx = 0, gy = 0, glowRaf = 0;
  function updateCursorGlow() { if (glow) glow.classList.toggle('is-on', fineMQ.matches && decorative()); }
  updateCursorGlow();

  if (fineMQ.matches) {
    window.addEventListener('pointermove', function (e) {
      gx = e.clientX; gy = e.clientY;
      if (!glowRaf && decorative()) {
        glowRaf = requestAnimationFrame(function () {
          glowRaf = 0;
          if (glow) glow.style.transform = 'translate3d(' + gx + 'px,' + gy + 'px,0)';
        });
      }
    }, { passive: true });

    $$('.lit').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });

    $$('.tilt').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        if (!decorative()) return;
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = 'perspective(900px) rotateX(' + (-py * 3).toFixed(2) + 'deg) rotateY(' + (px * 3).toFixed(2) + 'deg) translateY(-2px)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });

    $$('.magnetic').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        if (!decorative()) return;
        var r = el.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = 'translate(' + (dx * 0.12).toFixed(1) + 'px,' + (dy * 0.2).toFixed(1) + 'px)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
  }

  /* ---------- 6. EXPERIENCE ACCORDION ------------------------------------ */
  var achBtns = $$('.ach-btn'), achAll = $('#achAll');
  function setAch(btn, open) {
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.closest('.ach').classList.toggle('is-open', open);
  }
  function setAllAchievements(open) {
    achBtns.forEach(function (b) { setAch(b, open); });
    if (achAll) { achAll.setAttribute('aria-pressed', open ? 'true' : 'false'); achAll.textContent = open ? 'Collapse all' : 'Expand all'; }
  }
  achBtns.forEach(function (b) { b.addEventListener('click', function () { setAch(b, b.getAttribute('aria-expanded') !== 'true'); }); });
  if (achAll) achAll.addEventListener('click', function () { setAllAchievements(achAll.getAttribute('aria-pressed') !== 'true'); });

  /* ---------- 7. DIAGRAM RENDERER ---------------------------------------- */
  /* A spec is plain data: nodes (centre, size, kind) and edges as orthogonal polylines.
     Packets move in JS along those polylines — no getPointAtLength, so geometry works even
     while an SVG is display:none. One shared rAF loop drives every visible diagram, and
     idles as soon as nothing is moving. */
  var SVGNS = 'http://www.w3.org/2000/svg';
  function svgEl(tag, attrs, parent) {
    var n = document.createElementNS(SVGNS, tag);
    for (var k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k)) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  function Poly(pts) {
    this.pts = pts; this.seg = []; this.len = 0;
    for (var i = 1; i < pts.length; i++) {
      var d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      this.seg.push(d); this.len += d;
    }
  }
  Poly.prototype.at = function (dist) {
    var p = this.pts, i = 0;
    dist = Math.max(0, Math.min(this.len, dist));
    while (i < this.seg.length - 1 && dist > this.seg[i]) { dist -= this.seg[i]; i++; }
    var t = this.seg[i] ? dist / this.seg[i] : 0;
    return [p[i][0] + (p[i + 1][0] - p[i][0]) * t, p[i][1] + (p[i + 1][1] - p[i][1]) * t];
  };

  var live = [], loopRaf = 0, lastT = 0;
  function loop(now) {
    loopRaf = 0;
    var dt = lastT ? Math.min(0.05, (now - lastT) / 1000) : 0;
    lastT = now;
    var any = false;
    // an in-flight simulation keeps running even if its diagram scrolls out of view
    live.forEach(function (d) { if ((d.visible || d.sim) && !document.hidden && d.tick(dt)) any = true; });
    if (any) loopRaf = requestAnimationFrame(loop); else lastT = 0;
  }
  function kick() { if (!loopRaf) { lastT = 0; loopRaf = requestAnimationFrame(loop); } }
  document.addEventListener('visibilitychange', function () { if (!document.hidden) kick(); });

  var visIO = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { live.forEach(function (d) { if (d.svg === e.target) d.visible = e.isIntersecting; }); });
    kick();
  }) : null;

  function Diagram(svg, spec, opt) {
    var self = this;
    opt = opt || {};
    this.svg = svg; this.spec = spec; this.opt = opt;
    this.nodes = {}; this.edges = {}; this.ambient = []; this.visible = true;
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    svg.setAttribute('viewBox', '0 0 ' + spec.w + ' ' + spec.h);
    svg.classList.toggle('is-interactive', !!opt.interactive);
    svg.classList.toggle('is-mini', !!opt.mini);

    var gE = svgEl('g', { 'class': 'd-edges' }, svg);
    var gP = svgEl('g', { 'class': 'd-packets', 'aria-hidden': 'true' }, svg);
    var gN = svgEl('g', { 'class': 'd-nodes' }, svg);
    this.gP = gP;

    spec.edges.forEach(function (e) {
      var d = 'M' + e.pts.map(function (p) { return p[0] + ' ' + p[1]; }).join(' L');
      var path = svgEl('path', { d: d, 'class': 'd-wire w-' + e.type }, gE);
      self.edges[e.id] = { el: path, poly: new Poly(e.pts), spec: e };
      if (e.label && !opt.mini) {
        var t = svgEl('text', { x: e.label[1], y: e.label[2], 'class': 'd-elabel', 'text-anchor': e.label[3] || 'middle' }, gE);
        t.textContent = e.label[0];
      }
      if (opt.ambient !== false && !e.quiet) {
        var c = svgEl('circle', { r: opt.mini ? 4 : 2.6, 'class': 'pk pk-' + e.type, cx: -10, cy: -10 }, gP);
        self.ambient.push({ el: c, edge: self.edges[e.id], off: (e.pts[0][0] * 7 + e.pts[0][1] * 3) % 400 });
      }
    });

    Object.keys(spec.nodes).forEach(function (id) {
      var n = spec.nodes[id], w = n.w || 120, h = n.h || 54;
      var g = svgEl('g', { 'class': 'd-node' + (n.kind ? ' is-' + n.kind : ''), 'data-id': id }, gN);
      svgEl('rect', { x: n.x - w / 2, y: n.y - h / 2, width: w, height: h, rx: 10 }, g);
      var label = opt.mini ? (n.short || n.label) : n.label;
      var hasSub = n.sub && !opt.mini;
      var lab = svgEl('text', { x: n.x, y: hasSub ? n.y - 3 : n.y + (opt.mini ? 6 : 4), 'class': 'd-label' }, g);
      lab.textContent = label;
      if (hasSub) { var s = svgEl('text', { x: n.x, y: n.y + 13, 'class': 'd-sub' }, g); s.textContent = n.sub; }
      if (opt.health && n.kind !== 'platform' && n.kind !== 'ghost') {
        svgEl('circle', { cx: n.x + w / 2 - 9, cy: n.y - h / 2 + 9, r: 2.6, 'class': 'd-health' }, g);
      }
      self.nodes[id] = { el: g, spec: n, w: w, h: h };

      if (opt.interactive) {
        g.setAttribute('tabindex', '0');
        g.setAttribute('role', 'button');
        g.setAttribute('aria-label', n.label + (n.sub ? ', ' + n.sub.toLowerCase() : '') + ' — inspect');
        g.addEventListener('click', function () { self.select(id); });
        g.addEventListener('keydown', function (ev) {
          if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); self.select(id); }
        });
      }
      g.addEventListener('pointerenter', function () { self.near(id, true); if (opt.onHover) opt.onHover(id); });
      g.addEventListener('pointerleave', function () { self.near(id, false); if (opt.onLeave) opt.onLeave(id); });
      g.addEventListener('focus', function () { self.near(id, true); if (opt.onHover) opt.onHover(id); });
      g.addEventListener('blur', function () { self.near(id, false); if (opt.onLeave) opt.onLeave(id); });
    });

    // one continuous route through several edges (the hero request path)
    if (opt.route) {
      var pts = [];
      opt.route.forEach(function (eid) { pts = pts.concat(self.edges[eid].spec.pts); });
      this.route = new Poly(pts);
      this.routeTypes = opt.route.map(function (eid) { return self.edges[eid]; });
      this.routePk = [];
      var count = opt.routePackets || 4;
      for (var i = 0; i < count; i++) this.routePk.push({ el: svgEl('circle', { r: 3, 'class': 'pk pk-sync', cx: -10, cy: -10 }, gP), off: i / count });
      this.ambient.forEach(function (a) { a.el.remove(); });
      this.ambient = [];
    }

    this.t = 0; this.sim = null;
    live.push(this);
    if (visIO) visIO.observe(svg);
    if (!decorative() || opt.still) this.drawStatic();
    kick();
  }

  Diagram.prototype.connected = function (id) {
    var out = [];
    for (var k in this.edges) { var s = this.edges[k].spec; if (s.from === id || s.to === id) out.push(this.edges[k]); }
    return out;
  };
  Diagram.prototype.near = function (id, on) { this.connected(id).forEach(function (e) { e.el.classList.toggle('is-near', on); }); };
  Diagram.prototype.select = function (id) {
    for (var k in this.nodes) this.nodes[k].el.classList.toggle('is-sel', k === id);
    if (this.opt.onSelect) this.opt.onSelect(id);
  };
  Diagram.prototype.drawStatic = function () {
    // motion off: packets rest at edge midpoints so direction of flow still reads
    this.ambient.forEach(function (a) {
      var p = a.edge.poly.at(a.edge.poly.len / 2);
      a.el.setAttribute('cx', p[0]); a.el.setAttribute('cy', p[1]); a.el.style.opacity = 1;
    });
    if (this.routePk) this.routePk.forEach(function (r) { r.el.style.opacity = 0; });
  };
  // returns true only while something is actually moving, so frozen views let the loop idle
  Diagram.prototype.tick = function (dt) {
    var self = this;
    if (this.sim) this.sim.tick(dt);
    if (!decorative() || this.opt.still) {
      if (!this.staticDrawn) { this.drawStatic(); this.staticDrawn = true; }
      return !!this.sim;
    }
    this.staticDrawn = false;
    this.t += dt;
    var SPEED = this.opt.mini ? 110 : 64;

    this.ambient.forEach(function (a) {
      var cyc = a.edge.poly.len + 90, d = (self.t * SPEED + a.off) % cyc;
      if (d > a.edge.poly.len) { a.el.style.opacity = 0; return; }
      var p = a.edge.poly.at(d);
      a.el.setAttribute('cx', p[0].toFixed(1)); a.el.setAttribute('cy', p[1].toFixed(1));
      a.el.style.opacity = 1;
    });

    if (this.route) {
      var L = this.route.len, hits = {};
      this.routePk.forEach(function (r) {
        var d = ((self.t * SPEED) / L + r.off) % 1 * L, p = self.route.at(d);
        r.el.setAttribute('cx', p[0].toFixed(1)); r.el.setAttribute('cy', p[1].toFixed(1));
        r.el.style.opacity = 1;
        // colour the packet by the kind of edge it is travelling (blue sync, mint async)
        var acc = 0, type = 'sync';
        for (var j = 0; j < self.routeTypes.length; j++) {
          acc += self.routeTypes[j].poly.len;
          if (d <= acc + 30) { type = self.routeTypes[j].spec.type; break; }
        }
        r.el.setAttribute('class', 'pk pk-' + type);
        for (var k in self.nodes) {
          var n = self.nodes[k], s = n.spec;
          if (Math.abs(p[0] - s.x) < n.w / 2 + 4 && Math.abs(p[1] - s.y) < n.h / 2 + 4) hits[k] = true;
        }
      });
      for (var k in this.nodes) this.nodes[k].el.classList.toggle('is-hit', !!hits[k]);
      if (this.opt.onHits) this.opt.onHits(hits);
    }
    return true;
  };
  /* trace one request across a list of edges; resolves when done */
  Diagram.prototype.simulate = function (edgeIds, onStep, onEdge) {
    var self = this;
    return new Promise(function (resolve) {
      var pk = svgEl('circle', { r: 5, 'class': 'pk pk-sim', cx: -20, cy: -20 }, self.gP);
      var i = 0, d = 0, pause = 0;
      var light = function (id) {
        var n = self.nodes[id]; if (!n) return;
        n.el.classList.add('is-lit');
        setTimeout(function () { n.el.classList.remove('is-lit'); }, 900);
      };
      var begin = function () {
        var e = self.edges[edgeIds[i]];
        e.el.classList.add('is-active');
        light(e.spec.from);
        if (onStep) onStep(i, e.spec);
        if (onEdge) onEdge(e.spec.id, true);
      };
      var end = function () {
        var e = self.edges[edgeIds[i]];
        e.el.classList.remove('is-active');
        light(e.spec.to);
        if (onEdge) onEdge(e.spec.id, false);
      };
      begin();

      // step without movement when motion is off, or when the SVG isn't rendered
      // (small screens show the vertical flow instead of the diagram)
      var rendered = self.svg.getBoundingClientRect().width > 0;
      if (!decorative() || !rendered) {
        (function next() {
          setTimeout(function () {
            end(); i++;
            if (i >= edgeIds.length) { pk.remove(); resolve(); return; }
            begin(); next();
          }, 550);
        })();
        return;
      }

      self.sim = {
        tick: function (dt) {
          if (pause > 0) { pause -= dt; return; }
          var e = self.edges[edgeIds[i]];
          d += dt * 230;
          var p = e.poly.at(d);
          pk.setAttribute('cx', p[0].toFixed(1)); pk.setAttribute('cy', p[1].toFixed(1));
          if (d >= e.poly.len) {
            end(); i++; d = 0; pause = 0.28;
            if (i >= edgeIds.length) { self.sim = null; pk.remove(); resolve(); return; }
            begin();
          }
        }
      };
      kick();
    });
  };
  Diagram.prototype.destroy = function () {
    var i = live.indexOf(this);
    if (i > -1) live.splice(i, 1);
    if (visIO) visIO.unobserve(this.svg);
  };

  /* ---------- 8. HERO SYSTEM + STATUS TERMINAL --------------------------- */
  // Client → API Gateway → Spring Boot → Kafka → Redis / Database → Cloud
  var HERO = {
    w: 520, h: 262,
    nodes: {
      client:  { x: 70,  y: 40,  w: 110, label: 'Client',      sub: 'WEB · MOBILE' },
      gateway: { x: 260, y: 40,  w: 128, label: 'API Gateway', sub: 'JWT · ROUTING' },
      svc:     { x: 445, y: 40,  w: 130, label: 'Spring Boot', sub: 'JAVA 21', kind: 'core' },
      kafka:   { x: 445, y: 138, w: 130, label: 'Kafka',       sub: 'EVENT STREAM', kind: 'event' },
      redis:   { x: 260, y: 138, w: 128, label: 'Redis',       sub: 'CACHE', kind: 'data' },
      db:      { x: 70,  y: 138, w: 110, label: 'Database',    sub: 'POSTGRES · MSSQL', kind: 'data' },
      cloud:   { x: 260, y: 226, w: 496, h: 48, label: 'AWS · Azure · Kubernetes · OpenShift', kind: 'platform' }
    },
    edges: [
      { id: 'h1', from: 'client',  to: 'gateway', type: 'sync',  pts: [[125, 40], [196, 40]] },
      { id: 'h2', from: 'gateway', to: 'svc',     type: 'sync',  pts: [[324, 40], [380, 40]] },
      { id: 'h3', from: 'svc',     to: 'kafka',   type: 'async', pts: [[445, 67], [445, 111]] },
      { id: 'h4', from: 'kafka',   to: 'redis',   type: 'async', pts: [[380, 138], [324, 138]] },
      { id: 'h5', from: 'redis',   to: 'db',      type: 'store', pts: [[196, 138], [125, 138]] },
      { id: 'h6', from: 'db',      to: 'cloud',   type: 'store', pts: [[70, 165], [70, 202]] }
    ]
  };
  var HERO_INFO = {
    client:  'Traders, investors and dealers on web and mobile.',
    gateway: 'Edge entry point — JWT validation and routing.',
    svc:     'Spring Boot services — 30+ REST & gRPC APIs.',
    kafka:   'Event backbone — 100K+ records/day through consumers.',
    redis:   'Read cache — part of a 30% cut in database load.',
    db:      'System of record — PostgreSQL and MSSQL.',
    cloud:   'Docker & Kubernetes/OpenShift on AWS and Azure, monitored with Prometheus, Grafana & ELK.'
  };
  var heroSvg = $('#heroViz'), heroInfo = $('#heroVizInfo');
  var termLines = {};
  $$('#termLines li').forEach(function (li) { termLines[li.dataset.node] = li; });
  if (heroSvg) {
    new Diagram(heroSvg, HERO, {
      route: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
      routePackets: 3,
      onHover: function (id) { if (heroInfo) heroInfo.textContent = HERO_INFO[id]; },
      onHits: function (hits) { for (var k in termLines) termLines[k].classList.toggle('is-hit', !!hits[k]); }
    });
  }

  /* ---------- 9. ARCHITECTURE SIMULATOR ---------------------------------- */
  var ARCH = {
    w: 780, h: 410,
    nodes: {
      clients:   { x: 80,  y: 60,  w: 120, label: 'Clients',            sub: 'WEB · MOBILE' },
      gateway:   { x: 260, y: 60,  w: 132, label: 'API Gateway',        sub: 'JWT · ROUTING' },
      svc:       { x: 450, y: 60,  w: 140, label: 'Spring Boot',        sub: '30+ REST / gRPC', kind: 'core' },
      redis:     { x: 670, y: 60,  w: 150, label: 'Redis · Caffeine',   sub: 'READ CACHE', kind: 'data' },
      consumers: { x: 260, y: 200, w: 132, label: 'Consumers',          sub: 'MULTITHREADED' },
      kafka:     { x: 450, y: 200, w: 120, label: 'Kafka',              sub: 'EVENT BACKBONE', kind: 'event' },
      ext:       { x: 670, y: 200, w: 150, label: 'External APIs',      sub: 'DIGIO · KARIX · AZURE AI', kind: 'ext' },
      db:        { x: 260, y: 345, w: 176, label: 'PostgreSQL · MSSQL', sub: 'SYSTEM OF RECORD', kind: 'data' },
      snowflake: { x: 670, y: 345, w: 150, label: 'Snowflake',          sub: 'ANALYTICS · 40M+ ROWS', kind: 'data' }
    },
    edges: [
      { id: 'e1', from: 'clients',   to: 'gateway',   type: 'sync',  pts: [[140, 60], [194, 60]] },
      { id: 'e2', from: 'gateway',   to: 'svc',       type: 'sync',  pts: [[326, 60], [380, 60]] },
      { id: 'e3', from: 'svc',       to: 'redis',     type: 'store', pts: [[520, 60], [595, 60]],   label: ['cache', 557, 52] },
      { id: 'e4', from: 'svc',       to: 'kafka',     type: 'async', pts: [[450, 87], [450, 173]],  label: ['publish', 458, 134, 'start'] },
      { id: 'e5', from: 'kafka',     to: 'consumers', type: 'async', pts: [[390, 200], [326, 200]], label: ['consume', 358, 192] },
      { id: 'e6', from: 'consumers', to: 'db',        type: 'store', pts: [[260, 227], [260, 318]], label: ['persist', 268, 276, 'start'] },
      { id: 'e7', from: 'svc',       to: 'ext',       type: 'sync',  pts: [[495, 87], [495, 135], [670, 135], [670, 173]], label: ['APIs · webhooks', 585, 127] },
      { id: 'e8', from: 'db',        to: 'snowflake', type: 'async', pts: [[348, 345], [595, 345]], label: ['AWS S3 → Glue', 470, 337] }
    ]
  };
  // purpose / technology / where used / relevant projects — only what the page already states
  var ARCH_INFO = {
    clients:   ['Clients', 'Entry point for the traders, investors and dealers using the platforms, on web and mobile.', 'Web · Mobile', 'Every request path', 'SPARC · GEMS · FundsGenie'],
    gateway:   ['API Gateway', 'JWT validation and routing at the edge, before traffic reaches a service.', 'JWT · Spring Security', 'Edge of the reference architecture', 'Reference architecture'],
    svc:       ['Spring Boot services', 'Stateless services exposing 30+ REST and gRPC APIs, documented with Swagger/OpenAPI.', 'Java 21 · Spring Boot · gRPC · OpenAPI', 'Trading, onboarding and messaging workflows', 'SPARC · GEMS · FundsGenie'],
    redis:     ['Redis · Caffeine', 'Caching that absorbs read pressure — Redis caching and query optimisation cut database load by 30%.', 'Redis · Caffeine', 'High-volume API services', 'SPARC'],
    kafka:     ['Kafka', 'Event backbone that decouples producers from consumers.', 'Apache Kafka', 'Trading, messaging, transaction and NAV-update workflows', 'SPARC · GEMS · FundsGenie'],
    consumers: ['Consumers', 'Multithreaded consumers processing 100K+ records/day.', 'Java · Multithreading · Kafka', 'Real-time trading and messaging workflows', 'Kafka microservices at Geojit'],
    ext:       ['External APIs', 'Third-party integrations reached from the services.', 'Digio APIs & webhooks · Karix · Azure Document Intelligence', 'IPV verification, WhatsApp chatbot, document processing', 'SPARC · GEMS'],
    db:        ['PostgreSQL · MSSQL', 'Relational system of record.', 'MSSQL · PostgreSQL', 'MSSQL behind SPARC; PostgreSQL behind GEMS', 'SPARC · GEMS'],
    snowflake: ['Snowflake', 'Analytics warehouse fed from the relational store.', 'AWS S3 · AWS Glue · Snowflake', '40M+ records migrated from MSSQL', 'Data migration at Geojit']
  };
  var SIM_PATH = ['e1', 'e2', 'e4', 'e5', 'e6'];
  var SIM_LOG = [
    ['Client → API Gateway',      'sync', 'request authenticated with JWT'],
    ['API Gateway → Spring Boot', 'sync', 'routed to the service'],
    ['Spring Boot → Kafka',       'async', 'event published'],
    ['Kafka → Consumer',          'async', 'multithreaded consumer picks it up'],
    ['Consumer → Database',       'store', 'persisted to the system of record']
  ];

  var archSvg = $('#archSvg'), simBtn = $('#simRun'), simLog = $('#simLog');
  var vfNodes = $$('#vflow .vf-node'), vfLinks = {};
  $$('#vflow .vf-link').forEach(function (l) { vfLinks[l.dataset.edge] = l; });
  var arch = null, pinned = 'svc';

  function showInspect(id, mode) {
    var d = ARCH_INFO[id]; if (!d) return;
    $('#insTitle').textContent = d[0];
    $('#insPurpose').textContent = d[1];
    $('#insTech').textContent = d[2];
    $('#insWhere').textContent = d[3];
    $('#insProjects').textContent = d[4];
    $('#insMode').textContent = mode === 'hover' ? 'previewing · click to pin' : 'selected';
  }
  function pin(id) {
    pinned = id;
    showInspect(id, 'pin');
    vfNodes.forEach(function (b) { b.classList.toggle('is-sel', b.dataset.node === id); });
  }

  if (archSvg) {
    arch = new Diagram(archSvg, ARCH, {
      interactive: true, health: true,
      onSelect: pin,
      onHover: function (id) { showInspect(id, 'hover'); },
      onLeave: function () { showInspect(pinned, 'pin'); }
    });
    arch.select('svc');
    vfNodes.forEach(function (b) { b.addEventListener('click', function () { arch.select(b.dataset.node); }); });
  }

  var simRunning = false;
  function runSimulation() {
    if (!arch || simRunning) return;
    simRunning = true;
    if (simBtn) { simBtn.disabled = true; simBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin" aria-hidden="true"></i> Tracing…'; }
    simLog.innerHTML = '';
    var order = ['clients', 'gateway', 'svc', 'kafka', 'consumers', 'db'];
    arch.simulate(SIM_PATH, function (i) {
      var li = document.createElement('li');
      var cls = SIM_LOG[i][1] === 'async' ? 'n async' : 'n';
      li.innerHTML = '<span class="' + cls + '">0' + (i + 1) + '</span><span>' + SIM_LOG[i][0] + '<small>' + SIM_LOG[i][1] + ' · ' + SIM_LOG[i][2] + '</small></span>';
      simLog.appendChild(li);
      vfNodes.forEach(function (b) { b.classList.toggle('is-lit', b.dataset.node === order[i] || b.dataset.node === order[i + 1]); });
    }, function (edgeId, on) {
      if (vfLinks[edgeId]) vfLinks[edgeId].classList.toggle('is-active', on);
    }).then(function () {
      var done = document.createElement('li');
      done.className = 'done';
      done.innerHTML = '<span class="n">✓</span><span>Trace complete · 5 hops</span>';
      simLog.appendChild(done);
      vfNodes.forEach(function (b) { b.classList.remove('is-lit'); });
      simRunning = false;
      if (simBtn) { simBtn.disabled = false; simBtn.innerHTML = '<i class="fa-solid fa-rotate-right" aria-hidden="true"></i> Run again'; }
    });
  }
  if (simBtn) simBtn.addEventListener('click', runSimulation);

  /* ---------- 10. PROJECTS: TABS · PREVIEWS · FULL-SCREEN MODAL ---------- */
  // each diagram shows only components the page already names for that project
  var PROJECTS = {
    sparc: {
      kind: 'SPARC · trading back-office', title: 'SPARC — architecture', accent: 'primary',
      spec: {
        w: 700, h: 330,
        nodes: {
          users: { x: 300, y: 44,  w: 130, label: 'Traders', short: 'Traders', sub: '200K+ ACTIVE' },
          svc:   { x: 300, y: 160, w: 158, label: 'Spring Boot services', short: 'Services', sub: 'MULTITHREADED', kind: 'core' },
          docai: { x: 100, y: 160, w: 176, label: 'Azure Doc Intelligence', short: 'Doc AI', sub: 'EXTRACT · PROOF · SIGNATURE', kind: 'ext' },
          digio: { x: 100, y: 280, w: 176, label: 'Digio APIs', short: 'Digio', sub: 'IPV · WEBHOOKS', kind: 'ext' },
          kafka: { x: 300, y: 280, w: 130, label: 'Kafka', short: 'Kafka', sub: 'EVENTS', kind: 'event' },
          redis: { x: 530, y: 160, w: 140, label: 'Redis', short: 'Redis', sub: 'CACHE', kind: 'data' },
          mssql: { x: 530, y: 280, w: 140, label: 'MSSQL', short: 'MSSQL', sub: 'SYSTEM OF RECORD', kind: 'data' }
        },
        edges: [
          { id: 's1', from: 'users', to: 'svc',   type: 'sync',  pts: [[300, 71], [300, 133]] },
          { id: 's2', from: 'svc',   to: 'docai', type: 'sync',  pts: [[221, 160], [188, 160]] },
          { id: 's3', from: 'digio', to: 'svc',   type: 'sync',  pts: [[188, 272], [205, 272], [205, 178], [221, 178]], label: ['webhooks', 211, 232, 'start'] },
          { id: 's4', from: 'svc',   to: 'kafka', type: 'async', pts: [[300, 187], [300, 253]], label: ['events', 308, 224, 'start'] },
          { id: 's5', from: 'svc',   to: 'redis', type: 'store', pts: [[379, 160], [460, 160]], label: ['cache', 420, 152] },
          { id: 's6', from: 'redis', to: 'mssql', type: 'store', pts: [[530, 187], [530, 253]] },
          { id: 's7', from: 'kafka', to: 'mssql', type: 'async', pts: [[365, 280], [460, 280]], label: ['persist', 412, 272] }
        ]
      },
      notes: ['Multithreaded Spring Boot services for 200K+ active traders', 'Kafka, Redis caching and MSSQL', 'Azure Document Intelligence: data extraction, proof comparison and signature comparison', 'Digio APIs and webhooks for In-Person Verification (IPV)', 'Deployed on Azure']
    },
    gems: {
      kind: 'GEMS · enterprise messaging', title: 'GEMS — architecture', accent: 'secondary',
      spec: {
        w: 700, h: 330,
        nodes: {
          dealer: { x: 100, y: 44,  w: 170, label: 'Dealer console',   short: 'Console',  sub: 'WEBSOCKETS' },
          wa:     { x: 520, y: 44,  w: 170, label: 'WhatsApp chatbot', short: 'WhatsApp', sub: 'VIA KARIX', kind: 'ext' },
          legacy: { x: 100, y: 160, w: 170, label: 'Mercury (legacy)', short: 'Mercury',  sub: 'MODERNIZED', kind: 'ghost' },
          svc:    { x: 310, y: 160, w: 150, label: 'Spring Boot',      short: 'Java 21',  sub: 'JAVA 21 SERVICES', kind: 'core' },
          grpc:   { x: 520, y: 160, w: 160, label: 'gRPC · Protobuf',  short: 'gRPC',     sub: 'INTEGRATION' },
          kafka:  { x: 310, y: 280, w: 130, label: 'Kafka',            short: 'Kafka',    sub: 'EVENTS', kind: 'event' },
          pg:     { x: 520, y: 280, w: 160, label: 'PostgreSQL',       short: 'Postgres', sub: 'PERSISTENCE', kind: 'data' }
        },
        edges: [
          { id: 'g1', from: 'dealer', to: 'svc',   type: 'sync',   pts: [[100, 71], [100, 106], [270, 106], [270, 133]] },
          { id: 'g2', from: 'wa',     to: 'svc',   type: 'sync',   pts: [[520, 71], [520, 106], [350, 106], [350, 133]] },
          { id: 'g3', from: 'legacy', to: 'svc',   type: 'legacy', pts: [[185, 160], [235, 160]], label: ['replaced', 210, 152], quiet: true },
          { id: 'g4', from: 'svc',    to: 'grpc',  type: 'sync',   pts: [[385, 160], [440, 160]] },
          { id: 'g5', from: 'svc',    to: 'kafka', type: 'async',  pts: [[310, 187], [310, 253]] },
          { id: 'g6', from: 'kafka',  to: 'pg',    type: 'async',  pts: [[375, 280], [440, 280]], label: ['persist', 407, 272] }
        ]
      },
      notes: ['Legacy Mercury messaging app modernized into Java 21 / Spring Boot services', 'WebSocket-based dealer console for real-time dealer–client chat', 'WhatsApp chatbot (Karix)', 'Console and chatbot integrated with Kafka and gRPC/Protobuf', 'PostgreSQL persistence with event-driven processing']
    },
    fundsgenie: {
      kind: 'FundsGenie · mutual fund platform', title: 'FundsGenie — architecture', accent: 'primary',
      spec: {
        w: 700, h: 260,
        nodes: {
          inv:   { x: 100, y: 60,  w: 150, label: 'Investors',       short: 'Investors', sub: '300K+' },
          api:   { x: 320, y: 60,  w: 150, label: 'Portfolio APIs',  short: 'APIs',      sub: 'SPRING BOOT', kind: 'core' },
          jpa:   { x: 540, y: 60,  w: 160, label: 'Spring Data JPA', short: 'JPA',       sub: 'HIBERNATE' },
          kafka: { x: 320, y: 190, w: 160, label: 'Kafka',           short: 'Kafka',     sub: 'TRANSACTIONS · NAV', kind: 'event' },
          db:    { x: 540, y: 190, w: 160, label: 'Database',        short: 'Database',  sub: 'JPA-MANAGED', kind: 'data' }
        },
        edges: [
          { id: 'f1', from: 'inv',   to: 'api',   type: 'sync',  pts: [[175, 60], [245, 60]] },
          { id: 'f2', from: 'api',   to: 'jpa',   type: 'store', pts: [[395, 60], [460, 60]] },
          { id: 'f3', from: 'jpa',   to: 'db',    type: 'store', pts: [[540, 87], [540, 163]] },
          { id: 'f4', from: 'api',   to: 'kafka', type: 'async', pts: [[320, 87], [320, 163]], label: ['events', 328, 128, 'start'] },
          { id: 'f5', from: 'kafka', to: 'db',    type: 'async', pts: [[400, 190], [460, 190]], label: ['updates', 430, 182] }
        ]
      },
      notes: ['Portfolio APIs for 300K+ investors', 'Spring Data JPA / Hibernate persistence', 'Kafka-driven transaction and NAV update workflows', 'Query and JPA access-pattern optimisation for concurrent load', 'Containerised with Docker']
    }
  };
  var ACCENT = { primary: ['var(--primary)', 'var(--primary-rgb)'], secondary: ['var(--secondary)', 'var(--secondary-rgb)'] };
  function applyAccent(el, key) {
    var a = ACCENT[PROJECTS[key].accent];
    el.setAttribute('data-accent', key);
    el.style.setProperty('--pc', a[0]);
    el.style.setProperty('--pc-rgb', a[1]);
  }

  // architecture thumbnails inside each case study
  $$('[data-mini]').forEach(function (svg) {
    var key = svg.dataset.mini;
    applyAccent(svg, key);
    new Diagram(svg, PROJECTS[key].spec, { mini: true });
  });

  // small screens: one case study at a time
  var casesEl = $('#cases'), tabs = $$('.case-tab'), caseEls = $$('.case');
  function selectCase(key, focus) {
    tabs.forEach(function (t) {
      var on = t.dataset.case === key;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.setAttribute('tabindex', on ? '0' : '-1');
      if (on && focus) t.focus();
    });
    caseEls.forEach(function (c) { c.classList.toggle('is-current', c.dataset.case === key); });
  }
  function syncCaseTabs() {
    if (!casesEl) return;
    var tabbed = window.innerWidth <= 768 && !recruiter();
    casesEl.classList.toggle('has-tabs', tabbed);
    caseEls.forEach(function (c) {
      if (tabbed) { c.setAttribute('role', 'tabpanel'); c.setAttribute('aria-labelledby', 'tab-' + c.dataset.case); }
      else { c.removeAttribute('role'); c.setAttribute('aria-labelledby', c.querySelector('h3').id); }
    });
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { selectCase(t.dataset.case); });
    t.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      selectCase(tabs[(i + d + tabs.length) % tabs.length].dataset.case, true);
    });
  });
  syncCaseTabs();

  var modal = $('#archModal'), modalSvg = $('#modalSvg'), modalDiagram = null, modalOpener = null;
  var TYPE_LABEL = { sync: 'sync', async: 'event-driven', store: 'storage', legacy: 'replaced' };

  function openArch(key) {
    var p = PROJECTS[key]; if (!p || !modal) return;
    $('#modalKind').textContent = p.kind;
    $('#modalTitle').textContent = p.title;
    applyAccent(modal, key);
    applyAccent(modalSvg, key);
    if (modalDiagram) modalDiagram.destroy();
    modalDiagram = new Diagram(modalSvg, p.spec, { health: true });
    // text version of every connection, used on narrow screens
    $('#modalFlows').innerHTML = p.spec.edges.map(function (e) {
      return '<li><b>' + p.spec.nodes[e.from].label + '</b><span class="arrow">→</span><b>' + p.spec.nodes[e.to].label + '</b><span class="kind ' + e.type + '">' + TYPE_LABEL[e.type] + '</span></li>';
    }).join('');
    $('#modalNotes').innerHTML = p.notes.map(function (n) { return '<li>' + n + '</li>'; }).join('');
    modalOpener = document.activeElement;
    modal.showModal();
    document.body.classList.add('is-locked');
    kick();
  }
  function closeArch() { if (modal && modal.open) modal.close(); }

  $$('[data-arch]').forEach(function (b) { b.addEventListener('click', function () { openArch(b.dataset.arch); }); });
  if (modal) {
    $('#modalClose').addEventListener('click', closeArch);
    modal.addEventListener('close', function () {
      if (modalDiagram) { modalDiagram.destroy(); modalDiagram = null; }
      document.body.classList.remove('is-locked');
      if (modalOpener && modalOpener.focus) modalOpener.focus();
    });
  }

  /* ---------- 11. TECHNOLOGY DEPENDENCY MAP ------------------------------ */
  var CATS = {
    lang: 'Languages & Frameworks', backend: 'Backend & Messaging', data: 'Databases & Caching',
    cloud: 'Cloud & DevOps', obs: 'Observability & Testing', sec: 'Security & Quality', practice: 'Engineering Practices'
  };
  // where a technology appears — nothing beyond what the résumé states. p = project key for colour
  var CTX = {
    apis:      ['Geojit Technologies', '30+ REST & gRPC APIs for trading, onboarding and messaging', 'geojit'],
    kafkasvc:  ['Geojit Technologies', 'Kafka microservices with multithreaded consumers · 100K+ records/day', 'geojit'],
    cache:     ['Geojit Technologies', 'Redis caching & query optimisation · 30% lower DB load', 'geojit'],
    secure:    ['Geojit Technologies', 'Services secured with Spring Security and JWT', 'geojit'],
    tests:     ['Geojit Technologies', 'Coverage 29% → 70%+; SonarQube & Trivy findings resolved', 'geojit'],
    migration: ['Geojit Technologies', '40M+ records: MSSQL → AWS S3 → AWS Glue → Snowflake', 'geojit'],
    platform:  ['Geojit Technologies', 'Docker & Kubernetes/OpenShift on AWS/Azure via ArgoCD GitOps', 'geojit'],
    modern:    ['Geojit Technologies', 'Java 8/17 → Java 21 modernization for OKD', 'geojit'],
    monitor:   ['Geojit Technologies', 'Services monitored with Prometheus, Grafana & ELK', 'geojit'],
    sparc:     ['SPARC', 'Trading back-office · 200K+ active traders', 'sparc'],
    gems:      ['GEMS', 'Enterprise messaging · Java 21 / Spring Boot', 'gems'],
    fg:        ['FundsGenie', 'Mutual fund platform · 300K+ investors', 'fg'],
    skills:    ['Technical skills', 'Listed on my résumé', 'skill']
  };
  var PROJECT_CTX = { sparc: 'SPARC', gems: 'GEMS', fg: 'FundsGenie' };
  // illustrative chains; a step is a tech id, '~Literal', or { label, ids }
  var FLOWS = {
    events:   ['java', 'springboot', 'kafka', { label: 'Multithreaded consumers', ids: ['multithreading', 'microservices'] }, 'redis', { label: 'PostgreSQL / MSSQL', ids: ['postgresql', 'mssql'] }],
    api:      ['~Client', '~API Gateway', { label: 'REST / gRPC APIs', ids: ['rest', 'grpc'] }, 'springboot', 'openapi'],
    rpc:      [{ label: 'WebSocket console', ids: ['websockets'] }, { label: 'Spring Boot · Java 21', ids: ['springboot', 'java'] }, { label: 'gRPC · Protobuf', ids: ['grpc', 'protobuf'] }, 'kafka', 'postgresql'],
    access:   ['springboot', 'jpa', 'hibernate', { label: 'SQL · transactions · procedures', ids: ['sql', 'transactions', 'storedproc'] }, { label: 'PostgreSQL / MSSQL', ids: ['postgresql', 'mssql'] }],
    cache:    ['~API request', 'caffeine', { label: 'Redis / Garnet', ids: ['redis', 'garnet'] }, { label: 'MSSQL / PostgreSQL', ids: ['mssql', 'postgresql'] }],
    migration:['mssql', '~AWS S3', '~AWS Glue', 'snowflake'],
    delivery: ['git', { label: 'Maven / Gradle', ids: ['maven', 'gradle'] }, 'azuredevops', 'docker', { label: 'Kubernetes / OpenShift', ids: ['kubernetes', 'openshift'] }, { label: 'ArgoCD · GitOps', ids: ['argocd', 'gitops'] }, { label: 'AWS / Azure', ids: ['aws', 'azure'] }],
    metrics:  ['springboot', 'actuator', 'prometheus', 'grafana'],
    logs:     ['springboot', '~Application logs', 'elk'],
    quality:  [{ label: 'JUnit · Mockito', ids: ['junit', 'mockito'] }, 'sonarqube', 'trivy', 'sbom'],
    load:     ['jmeter', 'rest', 'springboot'],
    security: ['~Client', 'jwt', 'springsecurity', 'springboot', 'aesgcm'],
    practice: ['agile', 'systemdesign', 'designpatterns', 'cleanarch']
  };
  // n name · c category · r role in the architecture · d description · f flow · u where used
  var TECH = {
    java:           { n: 'Java', c: 'lang', r: 'Service language', d: 'Primary language for every service I ship — from Java 8/17 codebases through to Java 21.', f: 'events', u: ['apis', 'kafkasvc', 'modern', 'sparc', 'gems', 'fg'] },
    sql:            { n: 'SQL', c: 'lang', r: 'Query layer', d: 'Query writing and optimisation behind the relational stores.', f: 'access', u: ['cache', 'fg'] },
    springboot:     { n: 'Spring Boot', c: 'lang', r: 'Service framework', d: 'The framework behind the REST and gRPC APIs, Kafka microservices and portfolio services.', f: 'api', u: ['apis', 'kafkasvc', 'sparc', 'gems', 'fg'] },
    jpa:            { n: 'Spring Data JPA', c: 'lang', r: 'Data-access layer', d: 'Repository-based data access for the FundsGenie portfolio APIs.', f: 'access', u: ['fg'] },
    hibernate:      { n: 'Hibernate', c: 'lang', r: 'ORM', d: 'ORM under Spring Data JPA; access patterns tuned for concurrent load.', f: 'access', u: ['fg'] },
    maven:          { n: 'Maven', c: 'lang', r: 'Build tool', d: 'Build and dependency management for Java services.', f: 'delivery', u: ['skills'] },
    gradle:         { n: 'Gradle', c: 'lang', r: 'Build tool', d: 'Build tool for Java projects.', f: 'delivery', u: ['skills'] },
    microservices:  { n: 'Microservices', c: 'backend', r: 'Service architecture', d: 'Event-driven services connected through Kafka.', f: 'events', u: ['kafkasvc'] },
    rest:           { n: 'REST APIs', c: 'backend', r: 'Synchronous API surface', d: 'HTTP APIs for trading, onboarding and messaging workflows.', f: 'api', u: ['apis'] },
    grpc:           { n: 'gRPC', c: 'backend', r: 'Service-to-service calls', d: 'Typed RPC — part of the 30+ APIs, and used in GEMS.', f: 'rpc', u: ['apis', 'gems'] },
    protobuf:       { n: 'Protobuf', c: 'backend', r: 'Message contracts', d: 'Schema-first message contracts for gRPC in GEMS.', f: 'rpc', u: ['gems'] },
    multithreading: { n: 'Multithreading', c: 'backend', r: 'Concurrent processing', d: 'Multithreaded Kafka consumers and multithreaded SPARC services.', f: 'events', u: ['kafkasvc', 'sparc'] },
    kafka:          { n: 'Apache Kafka', c: 'backend', r: 'Event backbone', d: 'Carries events for trading, messaging, transaction and NAV-update workflows.', f: 'events', u: ['kafkasvc', 'sparc', 'gems', 'fg'] },
    websockets:     { n: 'WebSockets', c: 'backend', r: 'Real-time channel', d: 'Persistent connections for the real-time GEMS dealer console.', f: 'rpc', u: ['gems'] },
    postgresql:     { n: 'PostgreSQL', c: 'data', r: 'System of record', d: 'Persistence for GEMS messaging workflows.', f: 'rpc', u: ['gems'] },
    mssql:          { n: 'MSSQL', c: 'data', r: 'System of record', d: 'The store behind SPARC, and the source of the Snowflake migration.', f: 'migration', u: ['sparc', 'migration'] },
    snowflake:      { n: 'Snowflake', c: 'data', r: 'Analytics warehouse', d: 'Target of the 40M+ record migration from MSSQL.', f: 'migration', u: ['migration'] },
    redis:          { n: 'Redis', c: 'data', r: 'Read cache', d: 'Cache in front of the database — part of the 30% DB-load reduction.', f: 'cache', u: ['cache', 'sparc'] },
    garnet:         { n: 'Garnet', c: 'data', r: 'Cache server', d: "Microsoft's Redis-compatible cache server.", f: 'cache', u: ['skills'] },
    caffeine:       { n: 'Caffeine', c: 'data', r: 'In-process cache', d: 'In-process Java cache for hot reads.', f: 'cache', u: ['skills'] },
    storedproc:     { n: 'Stored Procedures', c: 'data', r: 'Database-side logic', d: 'Logic that runs inside the relational store.', f: 'access', u: ['skills'] },
    transactions:   { n: 'Transactions', c: 'data', r: 'Write consistency', d: 'Consistency across multi-step writes.', f: 'access', u: ['skills'] },
    aws:            { n: 'AWS', c: 'cloud', r: 'Cloud platform', d: 'S3 and Glue for the Snowflake migration, and a deployment target for services.', f: 'delivery', u: ['migration', 'platform'] },
    azure:          { n: 'Azure', c: 'cloud', r: 'Cloud platform', d: 'Deployment target, plus Azure Document Intelligence in SPARC.', f: 'delivery', u: ['platform', 'sparc'] },
    docker:         { n: 'Docker', c: 'cloud', r: 'Container runtime', d: 'Container images for services, FundsGenie included.', f: 'delivery', u: ['platform', 'fg'] },
    kubernetes:     { n: 'Kubernetes', c: 'cloud', r: 'Orchestration', d: 'Runs containerised services on AWS and Azure.', f: 'delivery', u: ['platform'] },
    openshift:      { n: 'OpenShift / OKD', c: 'cloud', r: 'Orchestration', d: 'Kubernetes distribution — target of the Java 21 modernization.', f: 'delivery', u: ['platform', 'modern'] },
    azuredevops:    { n: 'Azure DevOps', c: 'cloud', r: 'CI/CD platform', d: "Microsoft's CI/CD and repository platform.", f: 'delivery', u: ['skills'] },
    argocd:         { n: 'ArgoCD', c: 'cloud', r: 'Continuous delivery', d: 'GitOps delivery to Kubernetes/OpenShift.', f: 'delivery', u: ['platform'] },
    gitops:         { n: 'GitOps', c: 'cloud', r: 'Deployment model', d: 'Git as the source of truth for deployments, reconciled by ArgoCD.', f: 'delivery', u: ['platform'] },
    git:            { n: 'Git', c: 'cloud', r: 'Version control', d: 'Version control for everything.', f: 'delivery', u: ['skills'] },
    actuator:       { n: 'Spring Boot Actuator', c: 'obs', r: 'Health & metrics endpoints', d: 'Health and metrics endpoints exposed by Spring Boot services.', f: 'metrics', u: ['skills'] },
    prometheus:     { n: 'Prometheus', c: 'obs', r: 'Metrics collection', d: 'Metrics collection for running services.', f: 'metrics', u: ['monitor'] },
    grafana:        { n: 'Grafana', c: 'obs', r: 'Dashboards', d: 'Dashboards over service metrics.', f: 'metrics', u: ['monitor'] },
    elk:            { n: 'ELK', c: 'obs', r: 'Centralised logging', d: 'Elasticsearch, Logstash and Kibana for centralised logs.', f: 'logs', u: ['monitor'] },
    openapi:        { n: 'Swagger / OpenAPI', c: 'obs', r: 'API documentation', d: 'Documentation for the REST APIs I maintain.', f: 'api', u: ['apis'] },
    junit:          { n: 'JUnit', c: 'obs', r: 'Unit testing', d: 'Unit tests — part of lifting coverage from 29% to 70%+.', f: 'quality', u: ['tests'] },
    mockito:        { n: 'Mockito', c: 'obs', r: 'Test isolation', d: 'Mocks for isolating service logic in unit tests.', f: 'quality', u: ['tests'] },
    jmeter:         { n: 'JMeter', c: 'obs', r: 'Load testing', d: 'Load and performance testing tool.', f: 'load', u: ['skills'] },
    springsecurity: { n: 'Spring Security', c: 'sec', r: 'AuthN / AuthZ', d: 'Authentication and authorisation for services.', f: 'security', u: ['secure'] },
    jwt:            { n: 'JWT', c: 'sec', r: 'Token auth', d: 'Token-based authentication with Spring Security.', f: 'security', u: ['secure'] },
    aesgcm:         { n: 'AES/GCM', c: 'sec', r: 'Encryption', d: 'Authenticated encryption for sensitive data.', f: 'security', u: ['skills'] },
    sonarqube:      { n: 'SonarQube', c: 'sec', r: 'Static analysis', d: 'Static analysis — code-quality findings resolved.', f: 'quality', u: ['tests'] },
    trivy:          { n: 'Trivy', c: 'sec', r: 'Vulnerability scanning', d: 'Vulnerability scanning — security findings resolved.', f: 'quality', u: ['tests'] },
    sbom:           { n: 'SBOM', c: 'sec', r: 'Dependency inventory', d: 'Software bill of materials for dependency visibility.', f: 'quality', u: ['skills'] },
    systemdesign:   { n: 'System Design', c: 'practice', r: 'Architecture practice', d: 'Designing services, data flow and failure boundaries.', f: 'practice', u: ['skills'] },
    designpatterns: { n: 'Design Patterns', c: 'practice', r: 'Code structure', d: 'Reusable structure in service code.', f: 'practice', u: ['skills'] },
    cleanarch:      { n: 'Clean Architecture', c: 'practice', r: 'Code structure', d: 'Keeping domain logic independent of frameworks and I/O.', f: 'practice', u: ['skills'] },
    agile:          { n: 'Agile / Scrum', c: 'practice', r: 'Delivery practice', d: 'Iterative delivery in sprints.', f: 'practice', u: ['skills'] }
  };

  var chips = $$('.tchip'), uniSel = 'kafka';
  chips.forEach(function (c) {
    var t = TECH[c.dataset.id];
    if (t && t.u.some(function (x) { return PROJECT_CTX[x]; })) c.classList.add('in-project');
  });

  function stepIds(step) { return typeof step === 'string' ? (step.charAt(0) === '~' ? [] : [step]) : step.ids; }
  function stepLabel(step) {
    if (typeof step === 'string') return step.charAt(0) === '~' ? step.slice(1) : (TECH[step] ? TECH[step].n : step);
    return step.label;
  }

  function showTech(id) {
    var t = TECH[id]; if (!t) return;
    $('#uniCat').textContent = CATS[t.c];
    $('#uniName').textContent = t.n;
    $('#uniRole').textContent = t.r;
    $('#uniDesc').textContent = t.d;

    $('#uniWhere').innerHTML = t.u.map(function (c, i) {
      return '<li class="p-' + CTX[c][2] + '" style="animation-delay:' + (i * 40) + 'ms"><b>' + CTX[c][0] + '</b>' + CTX[c][1] + '</li>';
    }).join('');
    var projects = t.u.filter(function (c) { return PROJECT_CTX[c]; });
    $('#uniProjects').innerHTML = projects.length
      ? projects.map(function (c) { return '<li class="p-' + c + '">' + PROJECT_CTX[c] + '</li>'; }).join('')
      : '<li>Not tied to a named project</li>';

    var related = {};
    $('#uniFlow').innerHTML = FLOWS[t.f].map(function (step, i) {
      var ids = stepIds(step), here = ids.indexOf(id) > -1;
      ids.forEach(function (x) { related[x] = true; });
      return '<li' + (here ? ' class="is-here"' : '') + ' style="animation-delay:' + (i * 35) + 'ms">' + stepLabel(step) + '</li>';
    }).join('');
    chips.forEach(function (c) { c.classList.toggle('is-rel', c.dataset.id !== id && !!related[c.dataset.id]); });
  }
  function selectTech(id, scroll) {
    uniSel = id;
    chips.forEach(function (c) {
      var on = c.dataset.id === id;
      c.classList.toggle('is-sel', on);
      c.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    showTech(id);
    if (scroll && window.innerWidth <= 1024) {
      var panel = $('#uniPanel'), r = panel.getBoundingClientRect();
      if (r.top < 0 || r.bottom > window.innerHeight) panel.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'nearest' });
    }
  }
  if (chips.length) {
    chips.forEach(function (c) {
      c.setAttribute('aria-pressed', 'false');
      c.addEventListener('click', function () { selectTech(c.dataset.id, true); });
      if (fineMQ.matches) {
        c.addEventListener('pointerenter', function () { showTech(c.dataset.id); });
        c.addEventListener('pointerleave', function () { showTech(uniSel); });
      }
    });
    selectTech('kafka', false);
  }

  var filters = $$('.filter'), groups = $$('.uni-group');
  filters.forEach(function (f) {
    f.addEventListener('click', function () {
      var cat = f.dataset.filter;
      filters.forEach(function (x) { var on = x === f; x.classList.toggle('is-on', on); x.setAttribute('aria-pressed', on ? 'true' : 'false'); });
      groups.forEach(function (g) { g.hidden = cat !== 'all' && g.dataset.cat !== cat; });
      if (cat !== 'all' && TECH[uniSel].c !== cat) {
        var first = $('.uni-group[data-cat="' + cat + '"] .tchip');
        if (first) selectTech(first.dataset.id, false);
      }
    });
  });

  /* ---------- 12. COMMAND PALETTE ---------------------------------------- */
  var cmdk = $('#cmdk'), cmdInput = $('#cmdkInput'), cmdList = $('#cmdkList');
  var cmdOpener = null, cmdItems = [], cmdIndex = 0;
  function openLink(url) { window.open(url, '_blank', 'noopener'); }
  function copyEmail() {
    if (navigator.clipboard) navigator.clipboard.writeText(EMAIL).then(function () { toast('Email address copied'); }, function () { toast(EMAIL); });
    else toast(EMAIL);
  }

  var COMMANDS = [
    { g: 'Navigate', i: 'fa-compass',         t: 'About',        k: 'how i engineer principles',  s: 'section', run: function () { goTo('about'); } },
    { g: 'Navigate', i: 'fa-briefcase',       t: 'Experience',   k: 'work geojit timeline',       s: 'section', run: function () { goTo('experience'); } },
    { g: 'Navigate', i: 'fa-diagram-project', t: 'Projects',     k: 'sparc gems fundsgenie case', s: 'section', run: function () { goTo('projects'); } },
    { g: 'Navigate', i: 'fa-sitemap',         t: 'Architecture', k: 'system design simulator',    s: 'section', run: function () { goTo('architecture'); } },
    { g: 'Navigate', i: 'fa-layer-group',     t: 'Technology',   k: 'stack skills dependency map', s: 'section', run: function () { goTo('stack'); } },
    { g: 'Navigate', i: 'fa-graduation-cap',  t: 'Credentials',  k: 'education certifications nism', s: 'section', run: function () { goTo('credentials'); } },
    { g: 'Navigate', i: 'fa-paper-plane',     t: 'Contact',      k: 'hire email message form',    s: 'section', run: function () { goTo('contact', function () { var n = $('#name'); if (n) n.focus({ preventScroll: true }); }); } },
    { g: 'Actions',  i: 'fa-file-arrow-down', t: 'Download résumé', k: 'resume cv pdf', s: 'PDF', run: downloadResume },
    { g: 'Actions',  i: 'fa-linkedin-in', b: 1, t: 'LinkedIn', k: 'profile social', s: 'new tab', run: function () { openLink(LINKEDIN); } },
    { g: 'Actions',  i: 'fa-github',      b: 1, t: 'GitHub',   k: 'code repositories', s: 'new tab', run: function () { openLink(GITHUB); } },
    { g: 'Actions',  i: 'fa-copy',            t: 'Copy email address', k: 'mail clipboard', s: EMAIL, run: copyEmail },
    { g: 'Actions',  i: 'fa-user-tie',        t: 'Toggle Recruiter View', k: 'focus summary mode', run: function () { setRecruiter(!recruiter()); } },
    { g: 'Actions',  i: 'fa-play',            t: 'Simulate a request', k: 'architecture demo trace', run: function () { goTo('architecture', runSimulation); } }
  ];

  function renderCmds(q) {
    q = (q || '').trim().toLowerCase();
    cmdItems = COMMANDS.filter(function (c) { return !q || (c.t + ' ' + c.k + ' ' + c.g).toLowerCase().indexOf(q) > -1; });
    cmdIndex = 0;
    if (!cmdItems.length) {
      cmdList.innerHTML = '<li class="cmdk-empty" role="presentation">No matching commands</li>';
      cmdInput.removeAttribute('aria-activedescendant');
      return;
    }
    var html = '', group = '';
    cmdItems.forEach(function (c, i) {
      if (c.g !== group) { group = c.g; html += '<li class="cmdk-group" role="presentation">' + group + '</li>'; }
      html += '<li class="cmdk-opt" role="option" id="cmd-' + i + '" data-i="' + i + '" aria-selected="false">' +
              '<i class="' + (c.b ? 'fa-brands ' : 'fa-solid ') + c.i + '" aria-hidden="true"></i>' + c.t +
              (c.s ? '<small>' + c.s + '</small>' : '') + '</li>';
    });
    cmdList.innerHTML = html;
    setCmd(0);
  }
  function setCmd(i) {
    if (!cmdItems.length) return;
    cmdIndex = (i + cmdItems.length) % cmdItems.length;
    $$('.cmdk-opt', cmdList).forEach(function (o) { o.setAttribute('aria-selected', o.dataset.i === String(cmdIndex) ? 'true' : 'false'); });
    var cur = $('#cmd-' + cmdIndex);
    if (cur) { cmdInput.setAttribute('aria-activedescendant', cur.id); cur.scrollIntoView({ block: 'nearest' }); }
  }
  function runCmd(i) { var c = cmdItems[i]; if (!c) return; closeCmd(); setTimeout(c.run, 30); }
  function openCmd() {
    if (!cmdk || cmdk.open) return;
    if (modal && modal.open) closeArch();
    setMenu(false);
    cmdOpener = document.activeElement;
    cmdInput.value = '';
    renderCmds('');
    cmdk.showModal();
    cmdInput.focus();
  }
  function closeCmd() { if (cmdk && cmdk.open) cmdk.close(); }

  if (cmdk) {
    $('#cmdOpen').addEventListener('click', openCmd);
    cmdInput.addEventListener('input', function () { renderCmds(cmdInput.value); });
    cmdInput.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setCmd(cmdIndex + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setCmd(cmdIndex - 1); }
      else if (e.key === 'Enter') { e.preventDefault(); runCmd(cmdIndex); }
      else if (e.key === 'Home') { e.preventDefault(); setCmd(0); }
      else if (e.key === 'End') { e.preventDefault(); setCmd(cmdItems.length - 1); }
    });
    cmdList.addEventListener('click', function (e) { var o = e.target.closest('.cmdk-opt'); if (o) runCmd(parseInt(o.dataset.i, 10)); });
    cmdList.addEventListener('pointermove', function (e) {
      var o = e.target.closest('.cmdk-opt'); if (o && o.dataset.i !== String(cmdIndex)) setCmd(parseInt(o.dataset.i, 10));
    });
    cmdk.addEventListener('click', function (e) { if (e.target === cmdk) closeCmd(); });
    cmdk.addEventListener('close', function () { if (cmdOpener && cmdOpener.focus) cmdOpener.focus({ preventScroll: true }); });
  }
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      if (cmdk && cmdk.open) closeCmd(); else openCmd();
    }
  });

  /* ---------- 13. CONTACT FORM · COPY ------------------------------------ */
  $$('[data-copy]').forEach(function (b) { b.addEventListener('click', copyEmail); });

  var form = $('#contactForm'), status = $('#formStatus'), submit = $('#formSubmit');
  function setStatus(msg, kind) { if (!status) return; status.textContent = msg; status.className = 'form-status' + (kind ? ' ' + kind : ''); }
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { setStatus('Please fill in every field with a valid value.', 'err'); form.reportValidity(); return; }
      var original = submit.innerHTML;
      submit.disabled = true;
      submit.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin" aria-hidden="true"></i> Sending…';
      setStatus('Sending your message…', '');
      fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
        .then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          form.reset();
          setStatus("Message sent — I'll get back to you shortly.", 'ok');
          toast('Message sent ✓');
        })
        .catch(function () { setStatus('Something went wrong. Email me directly at ' + EMAIL + '.', 'err'); })
        .then(function () { submit.disabled = false; submit.innerHTML = original; });
    });
  }

  /* ---------- initial state ---------------------------------------------- */
  onScroll();
  if (recruiter()) setRecruiter(true, true);
  syncCaseTabs();
  if (reducedMQ.addEventListener) reducedMQ.addEventListener('change', function () { updateCursorGlow(); kick(); });
})();
