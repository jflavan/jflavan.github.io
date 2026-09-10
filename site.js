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
  function scrollToEl(el) {
    if (lenis) lenis.scrollTo(el, { duration: 1.4, easing: function (t) { return 1 - Math.pow(1 - t, 4); } });
    else el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }
  $$('a[href^="#"]').forEach(function (a) {
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
  var canvas = $('#ink'), ink = null, heroFade = 1, storming = false;
  if (canvas && !reduce && typeof Ink !== 'undefined') {
    try { ink = Ink.create(canvas, { touch: touch, bg: hexToRgb01(THEMES.default.noir), ink: THEMES.default.ink }); } catch (e) { ink = null; }
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
      if (document.hidden) ink.pause(); else if (heroFade > 0 || storming) ink.resume();
    });
  }

  /* ===== INTRO: the statement is typeset one word at a time ===== */
  var words = $$('[data-statement] .w'), fine = $('[data-fine]');
  function showInk() { if (canvas && ink) canvas.classList.add('on'); }
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
        if (!ink) return;
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
    var items = ms.map(function (m, i) { return { el: m, x: 0, w: 0, dir: i % 2 ? 1 : -1, visible: false, span: $('span', m) }; });
    function measure() { items.forEach(function (it) { it.w = it.span.getBoundingClientRect().width; }); }
    measure(); window.addEventListener('resize', measure);
    var io = new IntersectionObserver(function (entries) { entries.forEach(function (en) { var it = items.filter(function (i) { return i.el === en.target; })[0]; if (it) it.visible = en.isIntersecting; }); });
    items.forEach(function (it) { io.observe(it.el); });
    var lastT = performance.now();
    gsap.ticker.add(function () {
      var now = performance.now(), dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
      var v = Math.min(3, Math.abs(scrollVelocity) / 40);
      items.forEach(function (it) {
        if (!it.visible || !it.w) return;
        it.x += it.dir * (40 + 220 * v) * dt;
        if (it.x <= -it.w) it.x += it.w; if (it.x > 0) it.x -= it.w;
        it.el.style.transform = 'translate3d(' + it.x + 'px,0,0)';
      });
    });
  })();

  /* ===== EXPERIENCE: vertical scroll drives a horizontal ribbon ===== */
  (function () {
    var pin = $('[data-exp-pin]'), track = $('[data-track]'), bar = $('[data-bar]'), count = $('[data-count]');
    if (!pin || !track || !animate || narrow) return;
    var cards = $$('.card', track);
    function dist() { return Math.max(0, track.scrollWidth - window.innerWidth); }
    gsap.to(track, {
      x: function () { return -dist(); }, ease: 'none',
      scrollTrigger: {
        trigger: pin, start: 'top top', end: function () { return '+=' + dist(); }, pin: true, scrub: 0.4, anticipatePin: 1, invalidateOnRefresh: true,
        onUpdate: function (st) {
          bar.style.width = (12 + st.progress * 88) + '%';
          var n = Math.min(cards.length, Math.round(st.progress * (cards.length - 1)) + 1);
          count.textContent = (n < 10 ? '0' + n : n) + ' / 0' + cards.length;
        }
      }
    });
    gsap.from(cards, { y: 40, opacity: 0, duration: 1, ease: 'power4.out', stagger: 0.07, scrollTrigger: { trigger: pin, start: 'top 70%', once: true } });
  })();

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
    var rect = $('[data-wm-clip]', wm), hint = $('[data-wm-hint]');
    var HOLD = 3000, H = 132, holding = false, start = 0, done = false, raf = null;
    function setCharge(p) { rect.setAttribute('y', String(H - H * p)); }
    function stormOn() {
      storming = true;
      if (ink) { ink.storm(true); ink.setFade(1); ink.resume(); canvas.classList.add('storm'); }
    }
    function stormOff() {
      storming = false;
      if (ink) { ink.storm(false); ink.setFade(heroFade); canvas.classList.remove('storm'); if (heroFade <= 0.001) setTimeout(function () { if (!storming) ink.pause(); }, 1200); }
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
      wm.classList.add('holding'); if (hint) hint.textContent = 'Keep holding';
      stormOn();
      raf = requestAnimationFrame(loop);
    }
    function cancel() {
      if (!holding || done) return;
      holding = false; cancelAnimationFrame(raf);
      wm.classList.remove('holding'); if (hint) hint.textContent = 'Hold';
      if (hasGsap) gsap.to(rect, { attr: { y: H }, duration: 0.5, ease: 'power4.out' }); else setCharge(0);
      stormOff();
    }
    function complete() {
      done = true; holding = false;
      wm.classList.remove('holding'); if (hint) hint.textContent = '✦';
      cycleTheme();
      setTimeout(function () {
        if (hasGsap) gsap.to(rect, { attr: { y: H }, duration: 0.8, ease: 'power4.inOut' }); else setCharge(0);
        if (hint) hint.textContent = 'Hold';
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
  console.log('%cCurious? Check out my GitHub.\n%chttps://github.com/jflavan', 'color:#F1EFE8;font-size:14px;font-weight:bold;', 'color:#8a8a84;font-size:12px;');
})();
