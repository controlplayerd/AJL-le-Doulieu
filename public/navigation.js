document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.nav-toggle');
  const navigation = document.getElementById('siteNavigation');

  if (!toggle || !navigation) return;

  const closeNavigation = () => {
    toggle.setAttribute('aria-expanded', 'false');
    navigation.classList.remove('is-open');
  };

  toggle.addEventListener('click', () => {
    const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!isExpanded));
    navigation.classList.toggle('is-open', !isExpanded);
  });

  navigation.addEventListener('click', event => {
    if (event.target instanceof Element && event.target.closest('a')) closeNavigation();
  });

  document.addEventListener('click', event => {
    if (event.target instanceof Node && !navigation.contains(event.target) && !toggle.contains(event.target)) {
      closeNavigation();
    }
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      closeNavigation();
      toggle.focus();
    }
  });

  window.matchMedia('(min-width: 641px)').addEventListener('change', closeNavigation);
});
