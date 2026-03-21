// ===== WORD-BY-WORD SCROLL REVEAL =====
(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (prefersReducedMotion.matches) return;

  var containers = document.querySelectorAll('.word-reveal-container');
  if (!containers.length) return;

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
