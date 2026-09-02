// ===== WORD-BY-WORD SCROLL REVEAL =====
(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var containers = Array.prototype.slice.call(document.querySelectorAll('.word-reveal-container'));
  if (!containers.length) return;

  function revealAll(container) {
    var words = container.querySelectorAll('.word-reveal');
    for (var i = 0; i < words.length; i++) words[i].classList.add('revealed');
    container.setAttribute('data-revealed', '');
  }

  if (prefersReducedMotion.matches) {
    containers.forEach(revealAll);
    return;
  }

  // Per-word stagger for the cascading feel
  containers.forEach(function (container) {
    var words = container.querySelectorAll('.word-reveal');
    for (var i = 0; i < words.length; i++) {
      words[i].style.transitionDelay = (i * 0.03) + 's';
    }
  });

  var pending = containers.slice();

  function finish(container) {
    revealAll(container);
    observer.unobserve(container);
    pending = pending.filter(function (c) { return c !== container; });
    if (!pending.length) window.removeEventListener('scroll', onScroll);
  }

  // Progressive reveal while the paragraph enters the viewport
  var thresholds = [];
  for (var t = 0; t <= 50; t++) thresholds.push(t / 50);

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      var container = entry.target;
      if (!entry.isIntersecting) return;

      // Fully reveal once most of it is visible, or once its top has scrolled past
      if (entry.intersectionRatio >= 0.6 || entry.boundingClientRect.top < 0) {
        finish(container);
        return;
      }

      var words = container.querySelectorAll('.word-reveal');
      var revealCount = Math.ceil(entry.intersectionRatio * words.length);
      for (var j = 0; j < revealCount; j++) words[j].classList.add('revealed');
    });
  }, {
    threshold: thresholds,
    rootMargin: '0px 0px -10% 0px'
  });

  pending.forEach(function (container) { observer.observe(container); });

  // Safety net for jumps (nav clicks, hash landings, fast flings): anything whose
  // top has passed the middle of the viewport is fully revealed.
  var ticking = false;
  function checkPassed() {
    ticking = false;
    var limit = window.innerHeight * 0.5;
    pending.slice().forEach(function (container) {
      if (container.getBoundingClientRect().top < limit) finish(container);
    });
  }
  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(checkPassed);
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  checkPassed();
})();

// ===== NAV ACTIVE STATE =====
(function () {
  'use strict';

  var sections = Array.prototype.filter.call(
    document.querySelectorAll('.section'),
    function (section) { return !!section.id; }
  );
  var navLinks = Array.prototype.slice.call(
    document.querySelectorAll('.nav-links a, .nav-contact a')
  );
  if (!sections.length || !navLinks.length) return;

  var current;

  function setActive(id) {
    if (id === current) return;
    current = id;
    navLinks.forEach(function (link) {
      link.classList.toggle('active', !!id && link.getAttribute('href') === '#' + id);
    });
  }

  function navHeight() {
    var raw = getComputedStyle(document.documentElement).getPropertyValue('--nav-h');
    var value = parseFloat(raw);
    return isNaN(value) ? 72 : value;
  }

  // The active section is the last one whose top has crossed a reference line
  // just below the nav. Position-based rather than ratio-based so that tall
  // sections (which can never have a large share of themselves in view) still
  // register as the viewer scrolls through them.
  var ticking = false;
  function update() {
    ticking = false;

    var doc = document.documentElement;
    var atBottom = window.innerHeight + window.scrollY >= doc.scrollHeight - 2;
    if (atBottom) {
      setActive(sections[sections.length - 1].id);
      return;
    }

    var line = navHeight() + window.innerHeight * 0.3;
    var active = null;
    for (var i = 0; i < sections.length; i++) {
      var rect = sections[i].getBoundingClientRect();
      if (rect.top > line) break;
      active = rect.bottom > navHeight() ? sections[i].id : null;
    }
    setActive(active);
  }

  function schedule() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  window.addEventListener('load', schedule);
  update();
})();
