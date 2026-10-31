/* Shared mobile-menu keyboard support for every page.
   Each page already toggles #navLinks.open from #hamburger; this adds focus handling and Escape. */
(function () {
  'use strict';
  var links = document.getElementById('navLinks');
  var hb = document.getElementById('hamburger');
  if (!links || !hb) return;

  hb.addEventListener('click', function () {
    // Runs after the page's own toggle handler, so read the state on the next tick.
    setTimeout(function () {
      if (links.classList.contains('open')) {
        var first = links.querySelector('a');
        if (first) first.focus();
      }
    }, 0);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && links.classList.contains('open')) {
      links.classList.remove('open');
      hb.setAttribute('aria-expanded', 'false');
      hb.focus();
    }
  });
})();
