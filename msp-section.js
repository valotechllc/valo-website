/* VALO homepage, section 5: MSP white-label. Maps scroll through the pinned stage to four chapters.
   Without this script (or without sticky support) the section stays a normal, static block. */
(function () {
  var root = document.getElementById('msp');
  if (!root || !root.classList.contains('mx')) return;
  if (!(window.CSS && CSS.supports && CSS.supports('position', 'sticky'))) return;

  var scroller = root.querySelector('.mx-scroll');
  var rows = Array.prototype.slice.call(root.querySelectorAll('.mx-ch'));
  var n = rows.length;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var step = -1, queued = false;

  root.classList.add('is-live');

  function progress() {
    var r = scroller.getBoundingClientRect();
    var span = Math.max(1, r.height - window.innerHeight);
    return Math.min(1, Math.max(0, -r.top / span));
  }

  function render() {
    queued = false;
    var x = progress() * n;
    var s = Math.min(n - 1, Math.floor(x));
    var local = Math.min(1, x - s);
    if (s !== step) {
      step = s;
      root.setAttribute('data-step', String(s));
      rows.forEach(function (row, i) {
        row.classList.toggle('is-on', i === s);
        row.classList.toggle('is-done', i < s);
        row.querySelector('button').setAttribute('aria-current', i === s ? 'step' : 'false');
      });
    }
    root.style.setProperty('--local', local.toFixed(3));
    root.style.setProperty('--tilt', reduced.matches ? '0deg' : ((0.5 - local) * 6).toFixed(2) + 'deg');
  }

  function queue() {
    if (!queued) { queued = true; window.requestAnimationFrame(render); }
  }

  rows.forEach(function (row, i) {
    row.querySelector('button').addEventListener('click', function () {
      var r = scroller.getBoundingClientRect();
      var span = r.height - window.innerHeight;
      window.scrollTo({ top: window.scrollY + r.top + span * (i + 0.12) / n, behavior: reduced.matches ? 'auto' : 'smooth' });
    });
  });

  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', queue);
  render();
})();
