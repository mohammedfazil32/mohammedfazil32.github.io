/* ============================================================
   SIGNAL — portfolio runtime
   Mohammed Fazil T · vanilla JS, no dependencies
   ============================================================ */
(function () {
  'use strict';

  const $  = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rand = (a, b) => a + Math.random() * (b - a);

  /* ---------------------------------------------------------
     1. Boot sequence
  --------------------------------------------------------- */
  function boot() {
    const el = $('#boot'), log = $('#bootLog'), bar = $('#bootBar');
    if (!el) return;

    const finish = () => {
      el.classList.add('done');
      document.body.classList.remove('is-locked');
      setTimeout(() => el.remove(), 700);
    };

    if (reduceMotion || sessionStorage.getItem('mf-booted')) { finish(); return; }

    sessionStorage.setItem('mf-booted', '1');
    document.body.classList.add('is-locked');

    const lines = [
      '> initializing runtime ............ <b>ok</b>',
      '> spring context .................. <b>ok</b>',
      '> kafka listeners ................. <b>ok</b>',
      '> redis connection pool ........... <b>ok</b>',
      '> portfolio ready.'
    ];

    let i = 0;
    const step = () => {
      if (i >= lines.length) { setTimeout(finish, 240); return; }
      log.innerHTML += lines[i] + '\n';
      bar.style.width = Math.round(((i + 1) / lines.length) * 100) + '%';
      i++;
      setTimeout(step, i === lines.length ? 180 : 165);
    };
    setTimeout(step, 220);
  }

  /* ---------------------------------------------------------
     2. Cursor spotlight
  --------------------------------------------------------- */
  function spotlight() {
    const el = $('#spotlight');
    if (!el || reduceMotion || !window.matchMedia('(pointer:fine)').matches) return;

    let tx = innerWidth / 2, ty = innerHeight / 2, x = tx, y = ty, raf = null;

    addEventListener('mousemove', e => {
      tx = e.clientX; ty = e.clientY;
      document.body.classList.add('has-pointer');
      if (!raf) raf = requestAnimationFrame(tick);
    }, { passive: true });

    function tick() {
      x += (tx - x) * 0.12;
      y += (ty - y) * 0.12;
      el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
      raf = (Math.abs(tx - x) > .4 || Math.abs(ty - y) > .4) ? requestAnimationFrame(tick) : null;
    }
  }

  /* ---------------------------------------------------------
     3. Card hover spotlight (CSS custom props)
  --------------------------------------------------------- */
  function cardSpots() {
    if (reduceMotion || !window.matchMedia('(pointer:fine)').matches) return;
    $$('.edge').forEach(card => {
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      }, { passive: true });
    });
  }

  /* ---------------------------------------------------------
     3b. Terminal text-scramble on section tags
  --------------------------------------------------------- */
  const GLYPHS = '!<>-_\\/[]{}—=+*^?#01';

  function scramble(el, done) {
    const text = el.dataset.text || el.textContent;
    el.dataset.text = text;
    let frame = 0;

    const queue = [...text].map((ch, i) => ({
      ch,
      start: Math.floor(i * 1.4),
      end: Math.floor(i * 1.4) + 6 + Math.floor(Math.random() * 6)
    }));

    const tick = () => {
      let out = '', settled = 0;
      for (const q of queue) {
        if (frame >= q.end) { out += q.ch; settled++; }
        else if (frame >= q.start) out += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        else out += ' ';
      }
      el.textContent = out;
      if (settled === queue.length) { el.textContent = text; done && done(); return; }
      frame++;
      requestAnimationFrame(tick);
    };
    tick();
  }

  function scrambleTags() {
    const tags = $$('[data-scramble]');
    if (!tags.length) return;
    if (reduceMotion) return;

    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        scramble(en.target);
      });
    }, { threshold: .9 });
    tags.forEach(t => io.observe(t));
  }

  /* ---------------------------------------------------------
     4. Magnetic buttons
  --------------------------------------------------------- */
  function magnetic() {
    if (reduceMotion || !window.matchMedia('(pointer:fine)').matches) return;
    $$('.magnetic').forEach(btn => {
      btn.addEventListener('mousemove', e => {
        const r = btn.getBoundingClientRect();
        const dx = (e.clientX - r.left - r.width / 2) * .18;
        const dy = (e.clientY - r.top - r.height / 2) * .3;
        btn.style.transform = `translate(${dx}px, ${dy}px)`;
      }, { passive: true });
      btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
    });
  }

  /* ---------------------------------------------------------
     5. Navigation: sticky, mobile drawer, active link
  --------------------------------------------------------- */
  function navigation() {
    const nav = $('#nav'), burger = $('#burger'), links = $('#navLinks'), scrim = $('#navScrim');
    const navLinks = $$('.nav-link');

    const onScroll = () => nav.classList.toggle('stuck', scrollY > 24);
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    const setMenu = open => {
      burger.classList.toggle('open', open);
      links.classList.toggle('open', open);
      scrim.classList.toggle('on', open);
      burger.setAttribute('aria-expanded', String(open));
      document.body.classList.toggle('is-locked', open);
    };
    burger.addEventListener('click', () => setMenu(!links.classList.contains('open')));
    scrim.addEventListener('click', () => setMenu(false));
    navLinks.forEach(l => l.addEventListener('click', () => setMenu(false)));
    addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

    // active section
    const sections = $$('main section[id]');
    if (!sections.length) return;
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        const id = en.target.id;
        navLinks.forEach(l => l.classList.toggle('active', l.dataset.target === id));
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    sections.forEach(s => io.observe(s));
  }

  /* ---------------------------------------------------------
     6. Scroll progress + back to top
  --------------------------------------------------------- */
  function scrollUi() {
    const bar = $('#progressBar'), top = $('#toTop');
    let ticking = false;

    const update = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      const pct = max > 0 ? (scrollY / max) * 100 : 0;
      if (bar) bar.style.width = pct + '%';
      if (top) top.classList.toggle('on', scrollY > 620);
      ticking = false;
    };
    addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();

    top && top.addEventListener('click', () =>
      scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));
  }

  /* ---------------------------------------------------------
     7. Reveal on scroll
  --------------------------------------------------------- */
  function reveal() {
    const items = $$('.rv, .rvl');
    if (reduceMotion) { items.forEach(i => i.classList.add('in')); return; }
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -80px 0px', threshold: .08 });
    items.forEach(i => io.observe(i));
  }

  /* ---------------------------------------------------------
     8. Counters
  --------------------------------------------------------- */
  function counters() {
    const nodes = $$('[data-count]');
    if (!nodes.length) return;
    if (reduceMotion) { nodes.forEach(n => n.textContent = n.dataset.count); return; }

    const run = node => {
      const target = parseInt(node.dataset.count, 10);
      const dur = 1500, t0 = performance.now();
      const frame = now => {
        const p = Math.min((now - t0) / dur, 1);
        node.textContent = Math.floor((1 - Math.pow(1 - p, 3)) * target);
        if (p < 1) requestAnimationFrame(frame); else node.textContent = target;
      };
      requestAnimationFrame(frame);
    };

    const io = new IntersectionObserver(entries => {
      entries.forEach(en => { if (en.isIntersecting) { run(en.target); io.unobserve(en.target); } });
    }, { threshold: .6 });
    nodes.forEach(n => io.observe(n));
  }

  /* ---------------------------------------------------------
     9. Stack filter
  --------------------------------------------------------- */
  function stackFilter() {
    const chips = $$('.filters .chip'), cards = $$('#stackGrid .stack-card');
    if (!chips.length) return;

    chips.forEach(chip => chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('is-on'));
      chip.classList.add('is-on');
      const f = chip.dataset.filter;
      cards.forEach(card => {
        const show = f === 'all' || card.dataset.cat === f;
        card.classList.toggle('hide', !show);
        if (show && !reduceMotion) {
          card.style.animation = 'none';
          void card.offsetWidth;
          card.style.animation = 'popIn .38s cubic-bezier(.22,1,.36,1)';
        }
      });
    }));
  }

  /* ---------------------------------------------------------
     10. Service console (sparkline + metrics + log stream)
  --------------------------------------------------------- */
  function console_() {
    const line = $('#sparkLine'), area = $('#sparkArea'), dot = $('#sparkDot');
    const mLat = $('#mLat'), mRps = $('#mRps'), mHit = $('#mHit'), logEl = $('#liveLog');
    if (!line) return;

    const W = 320, H = 90, N = 40, PAD = 8;
    const data = Array.from({ length: N }, (_, i) =>
      42 + Math.sin(i / 3.4) * 9 + rand(-6, 6));

    const toXY = () => {
      const min = Math.min(...data), max = Math.max(...data);
      const span = Math.max(max - min, 12);
      return data.map((v, i) => [
        (i / (N - 1)) * W,
        H - PAD - ((v - min) / span) * (H - PAD * 2)
      ]);
    };

    const draw = () => {
      const pts = toXY();
      let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
      for (let i = 1; i < pts.length; i++) {
        const [px, py] = pts[i - 1], [cx, cy] = pts[i];
        const mx = (px + cx) / 2;
        d += ` Q${px.toFixed(1)},${py.toFixed(1)} ${mx.toFixed(1)},${((py + cy) / 2).toFixed(1)}`;
      }
      d += ` L${W},${pts[N - 1][1].toFixed(1)}`;
      line.setAttribute('d', d);
      area.setAttribute('d', `${d} L${W},${H} L0,${H} Z`);
      dot.setAttribute('cx', W);
      dot.setAttribute('cy', pts[N - 1][1].toFixed(1));
    };

    const setMetrics = () => {
      const p99 = Math.round(Math.max(...data.slice(-14)) * 1.35);
      mLat.innerHTML = `${p99} <small>ms</small>`;
      mRps.innerHTML = `${Math.round(rand(760, 980))} <small>rps</small>`;
      mHit.innerHTML = `${rand(94.2, 98.6).toFixed(1)} <small>%</small>`;
    };

    draw(); setMetrics();

    const LOGS = [
      '<span class="dim">12:04:31</span> <span class="ok">INFO </span> GET /api/v1/portfolio/holdings <span class="ok">200</span> <span class="dim">38ms</span>',
      '<span class="dim">12:04:31</span> <span class="c2">KAFKA</span> trade.executed p=3 offset=91245 <span class="dim">4ms</span>',
      '<span class="dim">12:04:32</span> <span class="ok">REDIS</span> HIT nav:INF090I01FS9 <span class="dim">ttl=57s</span>',
      '<span class="dim">12:04:32</span> <span class="ok">INFO </span> POST /api/v1/orders <span class="ok">201</span> <span class="dim">51ms</span>',
      '<span class="dim">12:04:33</span> <span class="c2">KAFKA</span> nav.updated batch=248 <span class="dim">committed</span>',
      '<span class="dim">12:04:33</span> <span class="ok">JWT  </span> token verified sub=usr_8842 <span class="dim">2ms</span>',
      '<span class="dim">12:04:34</span> <span class="wn">WARN </span> hikari pool 18/20 <span class="dim">scaling read replica</span>',
      '<span class="dim">12:04:34</span> <span class="ok">INFO </span> GET /api/v1/funds/search <span class="ok">200</span> <span class="dim">22ms</span>',
      '<span class="dim">12:04:35</span> <span class="ok">CB   </span> resilience4j CLOSED <span class="dim">failureRate=0.0%</span>',
      '<span class="dim">12:04:35</span> <span class="ok">INFO </span> actuator/health <span class="ok">UP</span> <span class="dim">db,redis,kafka</span>'
    ];

    let li = 0;
    const buffer = [];
    const pushLog = () => {
      buffer.push(LOGS[li % LOGS.length]);
      li++;
      if (buffer.length > 6) buffer.shift();
      logEl.innerHTML = buffer.join('\n');
    };
    for (let i = 0; i < 6; i++) pushLog();

    if (reduceMotion) return;

    let timer = null;
    const start = () => {
      if (timer) return;
      timer = setInterval(() => {
        const last = data[data.length - 1];
        const spike = Math.random() < .08 ? rand(14, 26) : 0;
        data.push(Math.min(92, Math.max(20, last + rand(-7, 7) + spike)));
        data.shift();
        draw(); setMetrics(); pushLog();
      }, 1150);
    };
    const stop = () => { clearInterval(timer); timer = null; };

    // Only animate while visible + tab focused
    const io = new IntersectionObserver(([en]) => en.isIntersecting ? start() : stop(), { threshold: .1 });
    io.observe($('.console'));
    document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
  }

  /* ---------------------------------------------------------
     11. Toast + clipboard
  --------------------------------------------------------- */
  let toastTimer;
  function toast(msg) {
    const el = $('#toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('on'), 2200);
  }

  function copyText(text) {
    const done = () => toast('Copied · ' + text);
    if (navigator.clipboard && isSecureContext) {
      navigator.clipboard.writeText(text).then(done).catch(fallback);
    } else fallback();

    function fallback() {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); done(); }
      catch (e) { toast('Copy failed — ' + text); }
      document.body.removeChild(ta);
    }
  }

  function clipboard() {
    document.addEventListener('click', e => {
      const t = e.target.closest('[data-copy]');
      if (!t) return;
      e.preventDefault();
      copyText(t.dataset.copy);
    });
  }

  /* ---------------------------------------------------------
     12. Command palette
  --------------------------------------------------------- */
  function palette() {
    const root = $('#cmdk'), input = $('#cmdkInput'), list = $('#cmdkList'), trigger = $('#cmdTrigger');
    if (!root) return;

    const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
    const hint = $('#kbdHint');
    if (hint && isMac) hint.textContent = '⌘ K';

    const go = id => () => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    };

    const ITEMS = [
      { g: 'go', i: 'fa-solid fa-house',            t: 'Home',        s: 'Back to the top',                 k: 'home top hero start',  a: go('home') },
      { g: 'go', i: 'fa-solid fa-user',             t: 'About',       s: 'Profile & background',            k: 'about profile bio summary who geojit', a: go('about') },
      { g: 'go', i: 'fa-solid fa-layer-group',      t: 'Stack',       s: 'Technologies & tooling',
        k: 'stack skills tech java spring boot cloud eureka microservices rest api hibernate jpa solid design patterns mssql sql server snowflake kafka confluent redis garnet resilience4j slf4j micrometer prometheus actuator aws azure docker kubernetes k8s github actions maven git swagger openapi postman sonarqube junit mockito tdd jwt copilot claude', a: go('stack') },
      { g: 'go', i: 'fa-solid fa-timeline',         t: 'Experience',  s: 'Geojit, QSpiders, B.Tech',        k: 'experience work history timeline job career geojit qspiders btech education mes college', a: go('experience') },
      { g: 'go', i: 'fa-solid fa-folder-open',      t: 'Work',        s: 'SPARC & FundsGenie',              k: 'work projects sparc fundsgenie trading mutual fund architecture diagram system design nav', a: go('work') },
      { g: 'go', i: 'fa-solid fa-award',            t: 'Credentials', s: 'Certifications',                  k: 'certs credentials certifications nism microsoft linkedin learning github snowflake', a: go('certs') },
      { g: 'go', i: 'fa-solid fa-paper-plane',      t: 'Contact',     s: 'Send a message',                  k: 'contact email hire reach message form phone', a: go('contact') },

      { g: 'do', i: 'fa-solid fa-download',         t: 'Download résumé', s: 'PDF · Java / Spring Boot',    k: 'resume cv pdf download',
        a: () => { const l = document.createElement('a'); l.href = 'Mohammed_Fazil_Java_SpringBoot_Developer.pdf'; l.download = ''; l.click(); toast('Downloading résumé…'); } },
      { g: 'do', i: 'fa-regular fa-copy',           t: 'Copy email',  s: 'mohammedfazil6652@gmail.com',     k: 'copy email mail',      a: () => copyText('mohammedfazil6652@gmail.com') },
      { g: 'do', i: 'fa-solid fa-phone',            t: 'Copy phone',  s: '+91 75580 16652',                 k: 'copy phone number call', a: () => copyText('+917558016652') },
      { g: 'do', i: 'fa-brands fa-linkedin-in',     t: 'Open LinkedIn', s: 'mohammed-fazil-9b6571228',      k: 'linkedin social profile', a: () => open('https://www.linkedin.com/in/mohammed-fazil-9b6571228', '_blank', 'noopener') },
      { g: 'do', i: 'fa-brands fa-github',          t: 'Open GitHub', s: 'mohammedfazil32',                 k: 'github code repos',    a: () => open('https://github.com/mohammedfazil32', '_blank', 'noopener') },

      { g: 'view', i: 'fa-solid fa-wind',           t: 'Toggle animations', s: 'Reduce background motion', k: 'motion animation reduce accessibility calm',
        a: () => { const off = document.documentElement.classList.toggle('no-motion'); toast(off ? 'Animations reduced' : 'Animations on'); } }
    ];

    let filtered = ITEMS.slice(), sel = 0;

    const render = () => {
      if (!filtered.length) {
        list.innerHTML = '<li class="cmdk-empty">No matches</li>';
        input.removeAttribute('aria-activedescendant');
        return;
      }
      list.innerHTML = filtered.map((it, n) => `
        <li class="cmdk-item${n === sel ? ' sel' : ''}" id="cmdk-opt-${n}" role="option" aria-selected="${n === sel}" data-n="${n}">
          <i class="${it.i}" aria-hidden="true"></i>
          <span class="ct"><b>${it.t}</b><small>${it.s}</small></span>
          <span class="cg">${it.g}</span>
        </li>`).join('');
      input.setAttribute('aria-activedescendant', 'cmdk-opt-' + sel);
    };

    const filter = q => {
      const s = q.trim().toLowerCase();
      filtered = s ? ITEMS.filter(it => (it.t + ' ' + it.s + ' ' + it.k).toLowerCase().includes(s)) : ITEMS.slice();
      sel = 0;
      render();
    };

    let lastFocus = null;
    const openP = () => {
      lastFocus = document.activeElement;
      root.hidden = false;
      document.body.classList.add('is-locked');
      input.value = ''; filter('');
      setTimeout(() => input.focus(), 30);
    };
    const closeP = () => {
      root.hidden = true;
      document.body.classList.remove('is-locked');
      lastFocus && lastFocus.focus && lastFocus.focus();
    };

    const runSel = () => {
      const it = filtered[sel];
      if (!it) return;
      closeP();
      setTimeout(it.a, 60);
    };

    trigger && trigger.addEventListener('click', openP);
    $('.cmdk-scrim', root).addEventListener('click', closeP);
    input.addEventListener('input', () => filter(input.value));

    list.addEventListener('mousemove', e => {
      const li = e.target.closest('.cmdk-item');
      if (!li) return;
      const n = +li.dataset.n;
      if (n !== sel) { sel = n; render(); }
    });
    list.addEventListener('click', e => { if (e.target.closest('.cmdk-item')) runSel(); });

    addEventListener('keydown', e => {
      const k = e.key.toLowerCase();
      if ((e.metaKey || e.ctrlKey) && k === 'k') {
        e.preventDefault();
        root.hidden ? openP() : closeP();
        return;
      }
      if (root.hidden) return;
      if (e.key === 'Escape') { e.preventDefault(); closeP(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); sel = (sel + 1) % Math.max(filtered.length, 1); render(); scrollSel(); }
      else if (e.key === 'ArrowUp')   { e.preventDefault(); sel = (sel - 1 + filtered.length) % Math.max(filtered.length, 1); render(); scrollSel(); }
      else if (e.key === 'Enter')     { e.preventDefault(); runSel(); }
    });

    const scrollSel = () => {
      const el = $('.cmdk-item.sel', list);
      el && el.scrollIntoView({ block: 'nearest' });
    };

    render();
  }

  /* ---------------------------------------------------------
     13. Contact form
  --------------------------------------------------------- */
  function contactForm() {
    const form = $('#contactForm');
    if (!form) return;
    const btn = $('.submit', form), status = $('#formStatus');

    const say = (msg, ok) => {
      status.textContent = msg;
      status.className = 'form-status show ' + (ok ? 'ok' : 'err');
    };

    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }

      btn.classList.add('busy');
      btn.disabled = true;
      status.className = 'form-status';
      status.textContent = '';

      try {
        const res = await fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
          headers: { Accept: 'application/json' }
        });
        if (!res.ok) throw new Error('bad response');
        say('Message sent — I\'ll get back to you shortly.', true);
        form.reset();
        toast('Message sent ✓');
      } catch (err) {
        say('Something went wrong. Email me directly at mohammedfazil6652@gmail.com', false);
      } finally {
        btn.classList.remove('busy');
        btn.disabled = false;
      }
    });
  }

  /* ---------------------------------------------------------
     14. Misc
  --------------------------------------------------------- */
  function misc() {
    const y = $('#year');
    if (y) y.textContent = new Date().getFullYear();

    // anchor scrolling that respects the sticky nav
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const href = a.getAttribute('href');
      if (href === '#' || href.length < 2) return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      history.replaceState(null, '', href);
    });
  }

  /* ---------------------------------------------------------
     Init
  --------------------------------------------------------- */
  const init = () => {
    boot();
    navigation();
    scrollUi();
    reveal();
    counters();
    stackFilter();
    cardSpots();
    scrambleTags();
    magnetic();
    spotlight();
    console_();
    clipboard();
    contactForm();
    misc();
    palette();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else init();
})();
