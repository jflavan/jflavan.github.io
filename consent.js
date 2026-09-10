/* =============================================================================
   johnflavan.com — cookie consent
   Google Analytics stays off until the visitor opts in. The answer lives in
   localStorage for a year; the footer's "Cookies" button reopens the banner.
   No GSAP dependency: CSS transitions only, and none under reduced motion.
   ============================================================================= */
(function () {
  'use strict';

  var GA_ID = 'G-2RSYR38N8N';
  var KEY = 'jf-consent';
  var TTL = 365 * 24 * 60 * 60 * 1000;
  var SHOW_DELAY = 2200;   // after the hero statement has typeset

  var banner = document.querySelector('[data-consent]');
  if (!banner) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var loaded = false, hideTimer = null;

  function read() {
    try {
      var v = JSON.parse(localStorage.getItem(KEY));
      if (!v || typeof v.analytics !== 'boolean' || !(Date.now() - v.at < TTL)) return null;
      return v;
    } catch (e) { return null; }
  }
  function write(analytics) {
    try { localStorage.setItem(KEY, JSON.stringify({ analytics: analytics, at: Date.now() })); } catch (e) {}
  }

  function loadAnalytics() {
    if (loaded) return;
    loaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag('consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
    window.gtag('js', new Date());
    window.gtag('config', GA_ID);
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
  }

  // GA sets _ga and _ga_<id> on the registrable domain; try each candidate domain so the delete matches
  function clearCookies() {
    var parts = location.hostname.split('.'), domains = [''];
    for (var i = 0; i < parts.length - 1; i++) domains.push(parts.slice(i).join('.'));
    document.cookie.split(';').forEach(function (c) {
      var name = c.split('=')[0].trim();
      if (name.indexOf('_ga') !== 0) return;
      domains.forEach(function (d) {
        document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + (d ? '; domain=' + d : '');
      });
    });
  }

  function show() {
    clearTimeout(hideTimer);
    banner.hidden = false;
    void banner.offsetWidth; // commit the un-hidden state so the transition has a starting point
    banner.classList.add('on');
  }
  function hide() {
    banner.classList.remove('on');
    if (reduce) { banner.hidden = true; return; }
    hideTimer = setTimeout(function () { banner.hidden = true; }, 500);
  }

  function accept() { write(true); loadAnalytics(); hide(); }
  function decline() {
    write(false);
    if (loaded) window.gtag('consent', 'update', { analytics_storage: 'denied' });
    clearCookies();
    hide();
  }

  banner.querySelector('[data-consent-accept]').addEventListener('click', accept);
  banner.querySelector('[data-consent-decline]').addEventListener('click', decline);
  banner.addEventListener('keydown', function (e) { if (e.key === 'Escape') hide(); });
  var open = document.querySelector('[data-consent-open]');
  if (open) open.addEventListener('click', function () { show(); banner.focus({ preventScroll: true }); });

  var choice = read();
  if (choice && choice.analytics) loadAnalytics();
  else if (!choice) setTimeout(show, SHOW_DELAY);
})();
