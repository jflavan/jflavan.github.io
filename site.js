/* =============================================================================
   johnflavan.com — "Ink" behaviour
   Order: environment · smooth scroll · clock · ink (WebGL) · intro · hero exit ·
   word rolls · portrait curtain · focus panels · marquees · experience ribbon ·
   copy button · wordmark hold (theme Easter egg) · console
   Every effect degrades: no GSAP → static page; reduced motion → resolved states.
   ============================================================================= */
(function () {
  'use strict';

  var html = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var touch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  var narrow = window.matchMedia('(max-width: 720px)').matches;
  var hasGsap = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
  var animate = hasGsap && !reduce;
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ===== SMOOTH SCROLL (Lenis drives ScrollTrigger) ===== */
  var lenis = null, scrollVelocity = 0;
  if (typeof Lenis !== 'undefined' && animate && !touch) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on('scroll', function (e) { scrollVelocity = e.velocity; ScrollTrigger.update(); });
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }
  function navHeight() { return parseFloat(getComputedStyle(html).getPropertyValue('--nav-h')) || 64; }
  function scrollToEl(el) {
    if (lenis) lenis.scrollTo(el, { offset: -navHeight(), duration: 1.4, easing: function (t) { return 1 - Math.pow(1 - t, 4); } });
    else el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }
  var skip = $('.skip-link'), mainEl = $('#main');
  if (skip && mainEl) skip.addEventListener('click', function (e) { e.preventDefault(); mainEl.focus({ preventScroll: true }); window.scrollTo(0, 0); if (lenis) lenis.scrollTo(0, { immediate: true }); });
  $$('a[href^="#"]:not(.skip-link)').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var t = $(a.getAttribute('href')); if (!t) return;
      e.preventDefault(); scrollToEl(t);
    });
  });

  /* ===== CLOCK (St. Louis) ===== */
  (function () {
    var el = $('[data-clock]'); if (!el) return;
    var fmt;
    try { fmt = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Chicago' }); } catch (e) { return; }
    function tick() { el.textContent = fmt.format(new Date()).replace(/^24/, '00'); }
    tick();
    setTimeout(function () { tick(); setInterval(tick, 60000); }, (60 - new Date().getSeconds()) * 1000);
  })();

  /* ===== LOGOTYPE: a ransom-note wordmark that settles into a fixed mix of voices ===== */
  var logotype = (function () {
    var el = $('[data-logotype]'); if (!el) return null;
    var VOICES = ['sans', 'serif', 'mono', 'light'];
    // Resting voice per letter: J O H N / F L A V A N
    var REST = [1, 0, 2, 3, 0, 1, 3, 2, 0, 1];
    var words = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    var cells = [], idx = 0;
    words.forEach(function (word) {
      var mask = document.createElement('span'); mask.className = 'lt-mask';
      var w = document.createElement('span'); w.className = 'lt-word';
      word.split('').forEach(function (ch) {
        var cell = document.createElement('span'); cell.className = 'lt';
        VOICES.forEach(function (v) { var i = document.createElement('i'); i.className = 'v-' + v; i.textContent = ch; i.setAttribute('aria-hidden', 'true'); cell.appendChild(i); });
        cells.push({ el: cell, faces: $$('i', cell), at: REST[idx % REST.length], rest: REST[idx % REST.length] });
        idx++; w.appendChild(cell);
      });
      mask.appendChild(w); el.appendChild(mask);
    });
    cells.forEach(function (c) { c.faces[c.at].classList.add('on'); });
    var busy = false, active = null, inView = true, looping = false;
    function cycle(delay, onDone) {
      if (!animate || busy) return;
      busy = true;
      var cur = cells.map(function (c) { return c.at; }), t = 0;
      var tl = gsap.timeline({ delay: delay || 0, onComplete: function () {
        busy = false; active = null;
        cells.forEach(function (c) { c.faces.forEach(function (f, k) { gsap.set(f, { clearProps: 'clipPath,zIndex' }); f.classList.toggle('on', k === c.at); }); });
        if (onDone) onDone();
      } });
      for (var s = 0; s < VOICES.length; s++) {
        cells.forEach(function (c, i) {
          var from = c.faces[cur[i]], next = (cur[i] + 1) % VOICES.length, to = c.faces[next], at = t + i * 0.06;
          tl.set(to, { clipPath: 'inset(100% 0% 0% 0%)', zIndex: 2 }, at);
          tl.set(from, { clipPath: 'inset(0% 0% 0% 0%)', zIndex: 1 }, at);
          tl.to(to, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.35, ease: 'expo.inOut' }, at);
          tl.to(from, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.35, ease: 'expo.inOut' }, at);
          cur[i] = next;
        });
        t += 0.35 + (cells.length - 1) * 0.06 + 0.25;
      }
      active = tl;
      return tl;
    }
    // Runs for as long as the mark is on screen and the tab is visible
    function loop() {
      if (!animate || !looping || busy || !inView || document.hidden) return;
      cycle(0.3, function () { setTimeout(loop, 0); });
    }
    function reveal() {
      if (!animate) return;
      var ws = $$('.lt-word', el);
      gsap.set(ws[0], { yPercent: 130 }); if (ws[1]) gsap.set(ws[1], { yPercent: -130 });
      gsap.to(ws[0], { yPercent: 0, duration: 0.7, ease: 'power2.out', delay: 0.4 });
      if (ws[1]) gsap.to(ws[1], { yPercent: 0, duration: 0.7, ease: 'power2.out', delay: 0.4 });
      looping = true;
      cycle(0.7, function () { setTimeout(loop, 0); });
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        inView = entries[0].isIntersecting;
        if (active) { if (inView && !document.hidden) active.resume(); else active.pause(); }
        else loop();
      }).observe(el);
    }
    document.addEventListener('visibilitychange', function () {
      if (active) { if (document.hidden) active.pause(); else if (inView) active.resume(); }
      else if (!document.hidden) loop();
    });
    return { reveal: reveal, cycle: cycle };
  })();

  /* ===== THEMES ===== */
  var THEMES = {
    default: { cls: '', noir: '#111110', ink: [0.95, 0.93, 0.88], console: ['Curious? Check out my GitHub.', '#F1EFE8', '#8a8a84'] },
    forest:  { cls: 'theme-forest', noir: '#07130D', ink: [0.42, 0.85, 0.62], console: ['Into the forest. ☘', '#a9e5c8', '#3fb287'] },
    cosmic:  { cls: 'theme-cosmic', noir: '#05070E', ink: [0.55, 0.72, 1.0],  console: ['You found the cosmos. ✦', '#a0c4ff', '#6fa8dc'] },
    ember:   { cls: 'theme-ember',  noir: '#120503', ink: [1.0, 0.52, 0.22],  console: ['The embers glow. ✷', '#ff8c42', '#d95b20'] },
    solar:   { cls: 'theme-solar',  noir: '#0F0B02', ink: [1.0, 0.86, 0.38],  console: ['Solar winds blow. ☀', '#e8c050', '#c49930'] },
    rose:    { cls: 'theme-rose',   noir: '#10040B', ink: [1.0, 0.45, 0.68],  console: ['A rose in the void. ✿', '#ff6aaa', '#d94088'] }
  };
  var THEME_KEYS = Object.keys(THEMES);
  var currentTheme = 'default';
  function hexToRgb01(hex) { var n = parseInt(hex.slice(1), 16); return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; }

  /* ===== INK (WebGL fluid behind the hero) ===== */
  var canvas = $('#ink'), ink = null, heroFade = 1, storming = false, settling = null;
  if (canvas && !reduce && typeof Ink !== 'undefined') {
    try { ink = Ink.create(canvas, { touch: touch, bg: hexToRgb01(THEMES.default.noir), ink: THEMES.default.ink, onLost: function () { html.classList.add('no-ink'); ink = null; } }); } catch (e) { ink = null; }
  }
  if (!ink) html.classList.add('no-ink');

  if (ink) {
    var last = null;
    document.addEventListener('mousemove', function (e) {
      if (last) ink.pointer(e.clientX, e.clientY, e.clientX - last.x, e.clientY - last.y);
      last = { x: e.clientX, y: e.clientY };
    }, { passive: true });
    document.addEventListener('touchmove', function (e) {
      var t = e.touches[0]; if (!t) return;
      if (last) ink.pointer(t.clientX, t.clientY, t.clientX - last.x, t.clientY - last.y);
      last = { x: t.clientX, y: t.clientY };
    }, { passive: true });
    document.addEventListener('touchend', function () { last = null; }, { passive: true });

    // Scroll velocity stirs the ink
    if (lenis) lenis.on('scroll', function (e) { if (ink.isRunning()) ink.scroll(e.velocity); });
    else {
      var lastY = window.scrollY;
      window.addEventListener('scroll', function () { var y = window.scrollY; if (ink.isRunning()) ink.scroll((y - lastY) * 0.5); lastY = y; }, { passive: true });
    }

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) ink.pause(); else if (heroFade > 0 || storming || settling) ink.resume();
    });
  }

  /* ===== INTRO: the statement is typeset one word at a time ===== */
  var words = $$('[data-statement] .w'), fine = $('[data-fine]');
  function showInk() { if (canvas && ink) canvas.classList.add('on'); }
  if (logotype) logotype.reveal();
  if (animate && words.length) {
    var intro = gsap.timeline({ delay: 0.7 });
    intro.set(words, { opacity: 1, stagger: 0.11 });
    intro.add(function () { showInk(); }, '-=0.25');
    intro.set(fine, { opacity: 1 }, '+=0.16');
  } else {
    words.forEach(function (w) { w.style.opacity = 1; });
    if (fine) fine.style.opacity = 1;
    showInk();
  }

  /* ===== HERO EXIT: lines drop out of their clip as you scroll away ===== */
  var hero = $('.hero');
  if (animate && hero) {
    var lines = $$('[data-statement] .line-in');
    var exit = gsap.timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: function () { return '+=' + window.innerHeight * 0.7; }, scrub: true } });
    lines.forEach(function (l, i) { exit.to(l, { yPercent: 110, ease: 'power1.in' }, i * 0.1); });
    exit.to(fine, { opacity: 0, ease: 'none' }, 0);
    // Fade and pause the ink once the hero has gone
    ScrollTrigger.create({
      trigger: hero, start: 'bottom 90%', end: 'bottom 10%', scrub: true,
      onUpdate: function (st) {
        heroFade = 1 - st.progress;
        if (!ink || storming || settling) return; // the storm (and its settle) own the fade until they end
        ink.setFade(heroFade);
        if (heroFade <= 0.001 && !storming) ink.pause(); else if (!ink.isRunning()) ink.resume();
      }
    });
  }

  /* ===== WORD ROLLS: muted words roll into bright ones as the statement passes ===== */
  $$('[data-wordroll]').forEach(function (p) {
    if (!animate) return;
    var text = p.textContent.trim().split(/\s+/);
    p.innerHTML = text.map(function (w) { return '<span class="wr"><i class="wa">' + w + '</i><i class="wb" aria-hidden="true">' + w + '</i></span>'; }).join(' ');
    var wa = $$('.wa', p), wb = $$('.wb', p);
    gsap.set(wa, { yPercent: 0, y: 0 }); gsap.set(wb, { yPercent: -100, y: 0 });
    var tl = gsap.timeline({ scrollTrigger: { trigger: p, start: 'top 88%', end: 'bottom 45%', scrub: 0.6 } });
    wa.forEach(function (el, i) {
      tl.to(el, { yPercent: 100, ease: 'power1.inOut', duration: 0.6 }, i * 0.05);
      tl.to(wb[i], { yPercent: 0, ease: 'power1.inOut', duration: 0.6 }, i * 0.05);
    });
  });

  /* ===== PORTRAIT CURTAIN: wrapper slides down while the image slides up ===== */
  (function () {
    var fig = $('[data-curtain]'); if (!fig) return;
    var wrap = $('.curtain', fig), img = $('img', fig);
    if (!animate) { wrap.style.transform = 'none'; img.style.transform = 'none'; return; }
    gsap.set(wrap, { yPercent: -100, y: 0 }); gsap.set(img, { yPercent: 100, y: 0 });
    gsap.to([wrap, img], { yPercent: 0, duration: 1.1, ease: 'power4.inOut', scrollTrigger: { trigger: fig, start: 'top 85%', once: true } });
  })();

  /* ===== FOCUS PANELS: each panel sinks as the next covers it ===== */
  var panels = $$('[data-panel]');
  if (animate) {
    panels.forEach(function (p, i) {
      var inner = $('.panel-in', p);
      gsap.from(inner, { y: 48, opacity: 0, duration: 1, ease: 'power4.out', scrollTrigger: { trigger: p, start: 'top 70%', once: true } });
      var next = panels[i + 1]; if (!next) return;
      var shade = $('.shade', p);
      var cover = gsap.timeline({ scrollTrigger: { trigger: next, start: 'top bottom', end: 'top top', scrub: true } });
      cover.to(p, { scale: 0.94, ease: 'none' }, 0);
      if (shade) cover.to(shade, { opacity: 0.6, ease: 'none' }, 0);
    });
  }

  /* ===== MARQUEES: outlined tags drift, and rush with scroll velocity ===== */
  (function () {
    var ms = $$('[data-marquee]'); if (!ms.length || !animate) return;
    var items = ms.map(function (m, i) { return { el: m, x: 0, w: 0, dir: parseFloat(m.getAttribute('data-dir')) || (i % 2 ? 1 : -1), speed: parseFloat(m.getAttribute('data-speed')) || 1, visible: false, span: $('span', m) }; });
    function measure() {
      items.forEach(function (it) {
        it.w = it.span.getBoundingClientRect().width;
        if (!it.w) return;
        var need = Math.ceil((it.el.parentNode.clientWidth * 2) / it.w) + 1;
        while (it.el.children.length < need) it.el.appendChild(it.span.cloneNode(true));
      });
    }
    measure(); window.addEventListener('resize', measure);
    var io = new IntersectionObserver(function (entries) { entries.forEach(function (en) { items.forEach(function (it) { if (it.el.parentNode === en.target) it.visible = en.isIntersecting; }); }); });
    $$('.marquees').forEach(function (g) { io.observe(g); });
    var lastT = performance.now();
    gsap.ticker.add(function () {
      var now = performance.now(), dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
      var v = Math.min(3, Math.abs(scrollVelocity) / 40);
      items.forEach(function (it) {
        if (!it.visible || !it.w) return;
        it.x += it.dir * (34 * it.speed + 240 * v) * dt;
        if (it.x <= -it.w) it.x += it.w; if (it.x > 0) it.x -= it.w;
        it.el.style.transform = 'translate3d(' + it.x + 'px,0,0)';
      });
    });
  })();

  /* ===== EXPERIENCE: vertical scroll drives a horizontal ribbon ===== */
  (function () {
    var pin = $('[data-exp-pin]'), track = $('[data-track]'), bar = $('[data-bar]'), count = $('[data-count]');
    if (!pin || !track) return;
    var cards = $$('.card', track);
    function setProgress(p) {
      bar.style.width = (12 + p * 88) + '%';
      var n = Math.min(cards.length, Math.round(p * (cards.length - 1)) + 1);
      count.textContent = pad(n) + ' / ' + pad(cards.length);
    }
    function pad(n) { return n < 10 ? '0' + n : String(n); }
    if (narrow || !animate) {
      track.addEventListener('scroll', function () { var max = track.scrollWidth - track.clientWidth; setProgress(max > 0 ? track.scrollLeft / max : 0); }, { passive: true });
      return;
    }
    function dist() { return Math.max(0, track.scrollWidth - window.innerWidth); }
    gsap.to(track, {
      x: function () { return -dist(); }, ease: 'none',
      scrollTrigger: {
        trigger: pin, start: 'top top', end: function () { return '+=' + dist(); }, pin: true, scrub: 0.4, anticipatePin: 1, invalidateOnRefresh: true,
        onUpdate: function (st) { setProgress(st.progress); }
      }
    });
    gsap.from(cards, { y: 40, opacity: 0, duration: 1, ease: 'power4.out', stagger: 0.07, scrollTrigger: { trigger: pin, start: 'top 70%', once: true } });
  })();

  /* ===== SKILLS: each term carries a second copy so it can roll on hover ===== */
  if (!reduce) $$('.wall .term').forEach(function (t) {
    var w = t.textContent;
    t.innerHTML = '<i>' + w + '</i><i aria-hidden="true">' + w + '</i>';
  });

  /* ===== CONTACT: copy the address ===== */
  (function () {
    var btn = $('[data-copy]'); if (!btn) return;
    btn.addEventListener('click', function () {
      var addr = btn.getAttribute('data-copy');
      var done = function () { btn.classList.add('done'); setTimeout(function () { btn.classList.remove('done'); }, 1800); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(addr).then(done, done);
      else { window.location.href = 'mailto:' + addr; }
    });
  })();

  /* ===== THEME FLIP (the Easter egg) ===== */
  var wipe = $('.wipe'), themeMeta = $('meta[name="theme-color"]');
  function applyTheme(key) {
    var t = THEMES[key];
    THEME_KEYS.forEach(function (k) { if (THEMES[k].cls) document.body.classList.remove(THEMES[k].cls); });
    if (t.cls) document.body.classList.add(t.cls);
    document.body.classList.toggle('themed', key !== 'default');
    if (themeMeta) themeMeta.setAttribute('content', t.noir);
    if (ink) { ink.setBg(hexToRgb01(t.noir)); ink.setInk(t.ink); }
    currentTheme = key;
    logTheme(t);
  }
  function logTheme(t) {
    console.log('%c' + t.console[0] + '\n%chttps://github.com/jflavan', 'color:' + t.console[1] + ';font-size:14px;font-weight:bold;', 'color:' + t.console[2] + ';font-size:12px;');
  }
  var flipping = false;
  function cycleTheme() {
    if (flipping) return;
    var available = THEME_KEYS.filter(function (k) { return k !== currentTheme; });
    var next = available[Math.floor(Math.random() * available.length)];
    if (!animate || !wipe) { applyTheme(next); return; }
    flipping = true;
    wipe.style.background = THEMES[next].noir;
    gsap.timeline({ onComplete: function () { flipping = false; gsap.set(wipe, { clipPath: 'inset(100% 0 0 0)' }); } })
      .fromTo(wipe, { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: 0.8, ease: 'power4.inOut' })
      .add(function () { applyTheme(next); })
      .to(wipe, { clipPath: 'inset(0 0 100% 0)', duration: 0.8, ease: 'power4.inOut' }, '+=0.05');
  }

  /* ===== WORDMARK: press and hold to charge, release at full to flip ===== */
  (function () {
    var wm = $('[data-wordmark]'); if (!wm) return;
    var rect = $('[data-wm-clip]', wm);
    var HOLD = 3000, H = 132, holding = false, start = 0, done = false, raf = null;
    function setCharge(p) { rect.setAttribute('y', String(H - H * p)); }
    function stormOn() {
      storming = true;
      if (!ink) return;
      if (settling) { settling.kill(); settling = null; }
      canvas.style.opacity = '';
      ink.storm(true); ink.setFade(1); ink.resume(); canvas.classList.add('storm');
    }
    function stormOff() {
      storming = false;
      if (!ink) return;
      ink.storm(false);
      if (!hasGsap) { ink.setFade(heroFade); canvas.classList.remove('storm'); if (heroFade <= 0.001) ink.pause(); return; }
      // Let the storm subside rather than cut: the dye drains back to the scroll fade over ~1.8s (eased out, since the display roll-off makes a linear fade look back-loaded),
      // the canvas then dims through its CSS transition, and only then drops back behind the page.
      var p = { t: 0 };
      settling = gsap.timeline({ onComplete: function () {
        settling = null;
        canvas.classList.remove('storm');
        canvas.style.opacity = '';
        if (heroFade <= 0.001) ink.pause();
      } })
        .to(p, { t: 1, duration: 1.8, ease: 'power2.out', onUpdate: function () { ink.setFade(1 - (1 - heroFade) * p.t); } })
        .add(function () { canvas.style.opacity = '0'; }, '-=0.4')
        .to({}, { duration: 0.6 });
    }
    function loop(now) {
      if (!holding) return;
      var p = Math.min(1, (now - start) / HOLD);
      setCharge(reduce ? 1 : p * p);
      if (p >= 1) complete(); else raf = requestAnimationFrame(loop);
    }
    function begin(e) {
      if (holding || flipping) return;
      if (e && e.preventDefault) e.preventDefault();
      holding = true; done = false; start = performance.now();
      wm.classList.add('holding');
      stormOn();
      raf = requestAnimationFrame(loop);
    }
    function cancel() {
      if (!holding || done) return;
      holding = false; cancelAnimationFrame(raf);
      wm.classList.remove('holding');
      if (hasGsap) gsap.to(rect, { attr: { y: H }, duration: 0.5, ease: 'power4.out' }); else setCharge(0);
      stormOff();
    }
    function complete() {
      done = true; holding = false;
      wm.classList.remove('holding');
      cycleTheme();
      setTimeout(function () {
        if (hasGsap) gsap.to(rect, { attr: { y: H }, duration: 0.8, ease: 'power4.inOut' }); else setCharge(0);
        stormOff();
      }, 1400);
    }
    wm.addEventListener('pointerdown', function (e) { if (e.button && e.button !== 0) return; try { wm.setPointerCapture(e.pointerId); } catch (err) {} begin(e); });
    wm.addEventListener('pointerup', cancel);
    wm.addEventListener('pointercancel', cancel);
    wm.addEventListener('lostpointercapture', cancel);
    wm.addEventListener('keydown', function (e) { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) begin(e); });
    wm.addEventListener('keyup', function (e) { if (e.key === ' ' || e.key === 'Enter') cancel(); });
    wm.addEventListener('blur', cancel);
    wm.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  })();

  /* ===== HOUSEKEEPING ===== */
  if (hasGsap) {
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  }
  logTheme(THEMES.default);
})();
