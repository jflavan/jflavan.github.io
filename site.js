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

  var sections = document.querySelectorAll('.section');
  var navLinks = document.querySelectorAll('.nav-links a, .nav-contact a');
  if (!sections.length || !navLinks.length) return;

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var id = entry.target.id;
      navLinks.forEach(function (link) {
        link.classList.toggle('active', link.getAttribute('href') === '#' + id);
      });
    });
  }, {
    threshold: 0.3,
    rootMargin: '-80px 0px -40% 0px'
  });

  sections.forEach(function (section) {
    if (section.id) observer.observe(section);
  });
})();
