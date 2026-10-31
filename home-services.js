/* VALO homepage: hands-on service demos (migration, rulebase cleanup, segmentation, risk sorting) and the global motion pause.
   Plain DOM, no dependencies. Every demo is illustrative and readable without JavaScript. */
(() => {
  const lab = document.querySelector('.hs-lab');
  if (!lab) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // tabs
  const tabs = [...lab.querySelectorAll('[role="tab"]')], panels = [...lab.querySelectorAll('[role="tabpanel"]')];
  function select(tab, focus) {
    tabs.forEach(t => { const on = t === tab; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; });
    panels.forEach(p => { p.hidden = p.id !== tab.getAttribute('aria-controls'); });
    if (focus) tab.focus();
  }
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(t));
    t.addEventListener('keydown', e => {
      const d = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0;
      if (d) { e.preventDefault(); select(tabs[(i + d + tabs.length) % tabs.length], true); }
    });
  });
  select(tabs[0]);

  // firewall migration: drag traffic from the legacy firewall to the new one
  const range = document.getElementById('hs-cutover');
  if (range) {
    const oldPct = document.getElementById('hs-old'), newPct = document.getElementById('hs-new'), stage = document.getElementById('hs-mig-stage');
    const checks = [...document.querySelectorAll('#hs-mig-checks li')];
    const stages = [[0, 'Plan'], [20, 'Policy translated'], [45, 'Staged with rollback'], [75, 'Traffic shifting'], [100, 'Validated and handed over']];
    const update = () => {
      const v = +range.value;
      oldPct.textContent = (100 - v) + '%'; newPct.textContent = v + '%';
      checks.forEach(li => li.classList.toggle('ok', v >= +li.dataset.at));
      stage.textContent = stages.filter(s => v >= s[0]).pop()[1];
      range.setAttribute('aria-valuetext', `${v}% of traffic on the new firewall, ${stage.textContent}`);
    };
    range.addEventListener('input', update);
    document.getElementById('hs-rollback').addEventListener('click', () => { range.value = 0; update(); stage.textContent = 'Rolled back in the change window'; });
    update();
  }

  // firewall optimization: clean up a cluttered rulebase
  const rules = document.getElementById('hs-rules');
  if (rules) {
    const rows = [...rules.querySelectorAll('tbody tr')], btn = document.getElementById('hs-clean');
    const count = document.getElementById('hs-rule-count'), risky = document.getElementById('hs-risky'), unused = document.getElementById('hs-unused');
    let clean = false;
    const update = () => {
      rows.forEach((r, i) => { const go = r.classList.contains('flag');
        setTimeout(() => r.classList.toggle('gone', clean && go), clean && !reduced ? i * 120 : 0); });
      const left = rows.filter(r => !(clean && r.classList.contains('flag'))).length;
      count.textContent = left; risky.textContent = clean ? 0 : rows.filter(r => r.dataset.kind === 'risky').length; unused.textContent = clean ? 0 : rows.filter(r => r.dataset.kind === 'unused').length;
      btn.textContent = clean ? 'Show original rulebase' : 'Run the cleanup';
    };
    btn.addEventListener('click', () => { clean = !clean; update(); });
    update();
  }

  // risk assessment: sort findings into a prioritized register
  const pool = document.getElementById('hs-pool');
  if (pool) {
    const chips = [...pool.querySelectorAll('.hs-chip')], btn = document.getElementById('hs-sort');
    const buckets = { h: document.querySelector('.hs-bucket.h .hs-list'), m: document.querySelector('.hs-bucket.m .hs-list'), l: document.querySelector('.hs-bucket.l .hs-list') };
    let sorted = false;
    btn.addEventListener('click', () => {
      sorted = !sorted;
      chips.forEach((c, i) => {
        const move = () => { (sorted ? buckets[c.dataset.sev] : pool).appendChild(c); c.style.opacity = 1; };
        if (reduced) return move();
        c.style.opacity = 0; setTimeout(move, 180 + i * 70);
      });
      btn.textContent = sorted ? 'Reset findings' : 'Prioritize findings';
    });
  }
  // network segmentation: split a flat network into zones with a few allowed paths
  const segBtn = document.getElementById('hs-seg');
  if (segBtn) {
    let seg = false;
    const checks = [...document.querySelectorAll('#hs-seg-checks li')];
    segBtn.addEventListener('click', () => {
      seg = !seg;
      document.getElementById('hs-zones').textContent = seg ? '3' : '1';
      document.getElementById('hs-paths').textContent = seg ? '3 defined' : 'Any to any';
      document.getElementById('hs-seg-state').textContent = seg ? 'Segmented and validated' : 'Flat network';
      checks.forEach((c, i) => reduced ? c.classList.toggle('ok', seg) : setTimeout(() => c.classList.toggle('ok', seg), seg ? 300 + i * 220 : 0));
      segBtn.textContent = seg ? 'Show flat network' : 'Segment the network';
    });
  }

  // global motion pause, remembered for this visitor
  const pause = document.querySelector('.motion-pause');
  if (pause) {
    let stopped = false;
    try { stopped = localStorage.getItem('valo-motion') === 'off'; } catch (e) {}
    const apply = () => { document.documentElement.classList.toggle('motion-stopped', stopped); pause.setAttribute('aria-pressed', String(stopped)); pause.textContent = stopped ? 'Play motion' : 'Pause motion'; };
    pause.addEventListener('click', () => { stopped = !stopped; try { localStorage.setItem('valo-motion', stopped ? 'off' : 'on'); } catch (e) {} apply(); });
    apply();
  }
})();
