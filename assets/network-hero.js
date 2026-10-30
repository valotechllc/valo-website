(() => {
  'use strict';
  const explorer = document.querySelector('.network-explorer');
  if (!explorer) return;
  const tabs = [...explorer.querySelectorAll('.network-tab')];
  const scenes = [...explorer.querySelectorAll('.network-scene')];
  const panel = explorer.querySelector('[role="tabpanel"]');
  const description = explorer.querySelector('#network-description');
  const link = explorer.querySelector('#network-service-link');
  const pause = explorer.querySelector('.network-pause');
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const content = [
    ['Firewall migrations, policy cleanup, and configuration reviews. VALO helps you permit required traffic and restrict unwanted connections.', 'Explore firewall engineering', '/services/network-security.html'],
    ['VLAN design, segmentation, and access controls. VALO separates users, guests, and critical systems to help limit lateral movement.', 'Explore network segmentation', '/services/network-security.html'],
    ['VPN deployment and remote-access policy reviews. VALO connects authorized users to the applications they need with scoped access.', 'Explore secure remote access', '/services/#msp'],
    ['Network and security assessments with prioritized findings and a practical remediation roadmap. See what a VALO deliverable includes.', 'View a sample assessment', '/resources/sample-network-security-assessment.html']
  ];
  let paused = false;
  let visible = true;
  function syncMotion() {
    const reduced = preference.matches;
    explorer.dataset.motion = String(!reduced);
    explorer.dataset.paused = String(paused || !visible || document.hidden);
    pause.hidden = reduced;
    pause.textContent = paused ? 'Play motion' : 'Pause motion';
    pause.setAttribute('aria-pressed', String(paused));
  }
  function select(index, focus = false) {
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
      scenes[i].toggleAttribute('hidden', i !== index);
    });
    explorer.dataset.active = scenes[index].dataset.scene;
    panel.setAttribute('aria-labelledby', tabs[index].id);
    description.textContent = content[index][0];
    link.textContent = content[index][1] + ' →';
    link.setAttribute('href', content[index][2]);
    if (focus) tabs[index].focus();
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => select(index));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next !== undefined) { event.preventDefault(); select(next, true); }
    });
  });
  pause.addEventListener('click', () => { paused = !paused; syncMotion(); });
  document.addEventListener('visibilitychange', syncMotion);
  if (preference.addEventListener) preference.addEventListener('change', syncMotion);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      syncMotion();
    }, { threshold: 0 }).observe(explorer);
  }
  explorer.querySelector('.network-tabs').hidden = false;
  select(0);
  syncMotion();
})();
