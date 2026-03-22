// ===== WORD-BY-WORD SCROLL REVEAL =====
(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (prefersReducedMotion.matches) return;

  var containers = document.querySelectorAll('.word-reveal-container');
  if (!containers.length) return;

  // Set per-word stagger delays for smooth cascading feel
  containers.forEach(function (container) {
    var words = container.querySelectorAll('.word-reveal');
    for (var i = 0; i < words.length; i++) {
      words[i].style.transitionDelay = (i * 0.03) + 's';
    }
  });

  // Build threshold array: 0.0, 0.02, 0.04, ... 1.0
  var thresholds = [];
  for (var i = 0; i <= 50; i++) {
    thresholds.push(i / 50);
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      var container = entry.target;
      var words = container.querySelectorAll('.word-reveal');
      var wordCount = words.length;

      if (!entry.isIntersecting) return;

      // Map intersection ratio to number of words to reveal
      var ratio = entry.intersectionRatio;
      var revealCount = Math.ceil(ratio * wordCount);

      for (var j = 0; j < wordCount; j++) {
        if (j < revealCount) {
          words[j].classList.add('revealed');
        }
      }

      // Once all words revealed, disconnect this container
      if (revealCount >= wordCount) {
        observer.unobserve(container);
      }
    });
  }, {
    threshold: thresholds,
    rootMargin: '0px 0px -10% 0px'
  });

  containers.forEach(function (container) {
    observer.observe(container);
  });
})();

// ===== NAV ACTIVE STATE =====
(function () {
  'use strict';

  var sections = document.querySelectorAll('.section, .contact');
  var navLinks = document.querySelectorAll('.nav-links a');

  if (!sections.length || !navLinks.length) return;

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        var id = entry.target.id;
        navLinks.forEach(function (link) {
          if (link.getAttribute('href') === '#' + id) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    });
  }, {
    threshold: 0.3,
    rootMargin: '-80px 0px -40% 0px'
  });

  sections.forEach(function (section) {
    if (section.id) observer.observe(section);
  });
})();
