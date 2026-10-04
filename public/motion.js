(() => {
  const main = document.querySelector('main');
  const selector = 'main > section:not(.hero), .team-member, .info-card, .planning-card, .photo-item';
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia?.('(pointer: fine)').matches;
  const scrollProgressRail = document.createElement('div');
  const scrollProgressFill = document.createElement('span');
  const scrollProgressMarker = document.createElement('span');

  scrollProgressRail.className = 'scroll-progress-rail';
  scrollProgressRail.setAttribute('aria-label', 'Progression du défilement');
  scrollProgressFill.className = 'scroll-progress-fill';
  scrollProgressMarker.className = 'scroll-progress-marker';
  scrollProgressMarker.setAttribute('role', 'scrollbar');
  scrollProgressMarker.setAttribute('aria-orientation', 'vertical');
  scrollProgressMarker.setAttribute('aria-valuemin', '0');
  scrollProgressMarker.setAttribute('tabindex', '0');
  if (!document.body.id) document.body.id = 'scrollablePage';
  scrollProgressMarker.setAttribute('aria-controls', document.body.id);
  scrollProgressRail.append(scrollProgressFill, scrollProgressMarker);
  document.body.append(scrollProgressRail);

  const updateScrollProgress = () => {
    const scrollableDistance = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const progress = scrollableDistance ? Math.min(1, Math.max(0, window.scrollY / scrollableDistance)) : 0;
    scrollProgressRail.hidden = scrollableDistance === 0;
    scrollProgressRail.style.setProperty('--scroll-progress', progress);
    scrollProgressRail.style.setProperty('--scroll-progress-position', `${progress * 100}%`);
    scrollProgressMarker.setAttribute('aria-valuemax', String(Math.round(scrollableDistance)));
    scrollProgressMarker.setAttribute('aria-valuenow', String(Math.round(window.scrollY)));
    scrollProgressMarker.setAttribute('aria-valuetext', `${Math.round(progress * 100)} % de la page`);
  };

  window.addEventListener('scroll', updateScrollProgress, { passive: true });
  window.addEventListener('resize', updateScrollProgress);
  new ResizeObserver(updateScrollProgress).observe(document.body);
  updateScrollProgress();

  let dragStart = null;
  scrollProgressMarker.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    event.preventDefault();
    const markerBounds = scrollProgressMarker.getBoundingClientRect();
    dragStart = {
      pointerId: event.pointerId,
      pointerOffsetY: event.clientY - (markerBounds.top + markerBounds.height / 2),
      scrollBehavior: document.documentElement.style.scrollBehavior
    };
    document.documentElement.style.scrollBehavior = 'auto';
    scrollProgressMarker.classList.add('is-dragging');
    scrollProgressMarker.setPointerCapture(event.pointerId);
  });
  scrollProgressMarker.addEventListener('pointermove', event => {
    if (!dragStart || event.pointerId !== dragStart.pointerId) return;
    const scrollableDistance = document.documentElement.scrollHeight - window.innerHeight;
    const railBounds = scrollProgressRail.getBoundingClientRect();
    if (scrollableDistance <= 0 || railBounds.height <= 0) return;
    const markerCenter = event.clientY - dragStart.pointerOffsetY;
    const progress = Math.min(1, Math.max(0, (markerCenter - railBounds.top) / railBounds.height));
    window.scrollTo(0, progress * scrollableDistance);
  });
  const finishScrollDrag = event => {
    if (!dragStart || event.pointerId !== dragStart.pointerId) return;
    const originalScrollBehavior = dragStart.scrollBehavior;
    dragStart = null;
    document.documentElement.style.scrollBehavior = originalScrollBehavior;
    scrollProgressMarker.classList.remove('is-dragging');
  };
  scrollProgressMarker.addEventListener('pointerup', finishScrollDrag);
  scrollProgressMarker.addEventListener('pointercancel', finishScrollDrag);
  scrollProgressRail.addEventListener('pointerdown', event => {
    if (event.target === scrollProgressMarker || event.button !== 0) return;
    const railBounds = scrollProgressRail.getBoundingClientRect();
    const scrollableDistance = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollableDistance <= 0 || railBounds.height <= 0) return;
    const progress = Math.min(1, Math.max(0, (event.clientY - railBounds.top) / railBounds.height));
    window.scrollTo({ top: progress * scrollableDistance, behavior: reduceMotion ? 'auto' : 'smooth' });
  });
  scrollProgressMarker.addEventListener('keydown', event => {
    const pageDistance = window.innerHeight * .9;
    let nextScroll = null;
    if (event.key === 'ArrowDown') nextScroll = window.scrollY + 40;
    else if (event.key === 'ArrowUp') nextScroll = window.scrollY - 40;
    else if (event.key === 'PageDown') nextScroll = window.scrollY + pageDistance;
    else if (event.key === 'PageUp') nextScroll = window.scrollY - pageDistance;
    else if (event.key === 'Home') nextScroll = 0;
    else if (event.key === 'End') nextScroll = document.documentElement.scrollHeight;
    if (nextScroll === null) return;
    event.preventDefault();
    window.scrollTo({ top: nextScroll, behavior: reduceMotion ? 'auto' : 'smooth' });
  });

  if (main && finePointer && !reduceMotion) {
    let activeTeamMember = null;

    main.addEventListener('pointermove', event => {
      const target = event.target instanceof Element ? event.target.closest('.team-member') : null;
      if (target !== activeTeamMember) {
        activeTeamMember?.classList.remove('is-following-pointer');
        activeTeamMember = target;
      }
      if (!target) return;

      const bounds = target.getBoundingClientRect();
      const horizontalPosition = (event.clientX - bounds.left) / bounds.width - .5;
      const verticalPosition = (event.clientY - bounds.top) / bounds.height - .5;
      target.style.setProperty('--card-tilt-x', `${verticalPosition * -9}deg`);
      target.style.setProperty('--card-tilt-y', `${horizontalPosition * 12}deg`);
      target.style.setProperty('--card-shift-x', `${horizontalPosition * 5}px`);
      target.classList.add('is-following-pointer');
    }, { passive: true });

    main.addEventListener('pointerout', event => {
      const leavingElement = event.target instanceof Element ? event.target.closest('.team-member') : null;
      const enteredElement = event.relatedTarget instanceof Element ? event.relatedTarget : null;
      if (!leavingElement || leavingElement.contains(enteredElement)) return;
      leavingElement.classList.remove('is-following-pointer');
      leavingElement.style.removeProperty('--card-tilt-x');
      leavingElement.style.removeProperty('--card-tilt-y');
      leavingElement.style.removeProperty('--card-shift-x');
      if (activeTeamMember === leavingElement) activeTeamMember = null;
    });
  }

  if (document.body.classList.contains('home-page')) {
    const balloonColors = ['#ff78a5', '#ffd45b', '#82dbff', '#a9ed91'];
    const balloonNames = ['rose', 'jaune', 'bleu', 'vert'];
    const balloonLayouts = [
      [{ side: 'left', height: 'high' }, { side: 'right', height: 'low' }],
      [{ side: 'right', height: 'high' }, { side: 'left', height: 'low' }],
      [{ side: 'left', height: 'low' }, { side: 'right', height: 'high' }],
      [{ side: 'right', height: 'low' }, { side: 'left', height: 'high' }]
    ];

    main?.querySelectorAll(':scope > section').forEach((section, index) => {
      const layer = document.createElement('div');
      const sectionLayouts = balloonLayouts[index % balloonLayouts.length];

      layer.className = 'section-balloons';
      layer.setAttribute('role', 'group');
      layer.setAttribute('aria-label', 'Ballons interactifs');
      sectionLayouts.forEach((layout, positionIndex) => {
        const balloonIndex = index * sectionLayouts.length + positionIndex;
        const balloon = document.createElement('button');
        const body = document.createElement('span');
        let riseTimeout;

        balloon.className = `section-balloon section-balloon-${layout.side} section-balloon-${layout.height}`;
        balloon.type = 'button';
        balloon.setAttribute('aria-label', `Faire monter le ballon ${balloonNames[balloonIndex % balloonNames.length]}`);
        balloon.style.setProperty('--balloon-color', balloonColors[balloonIndex % balloonColors.length]);
        balloon.style.setProperty('--float-delay', `${balloonIndex * 140}ms`);
        body.className = 'balloon-body';
        body.setAttribute('aria-hidden', 'true');
        balloon.append(body);
        balloon.addEventListener('click', event => {
          balloon.classList.remove('is-rising');
          void balloon.offsetWidth;
          balloon.classList.add('is-rising');
          window.clearTimeout(riseTimeout);
          riseTimeout = window.setTimeout(() => balloon.classList.remove('is-rising'), 900);

          if (reduceMotion) return;
          const bounds = balloon.getBoundingClientRect();
          const originX = event.detail === 0 ? bounds.left + bounds.width / 2 : event.clientX;
          const originY = event.detail === 0 ? bounds.top + bounds.height / 2 : event.clientY;
          const burstColors = [balloonColors[balloonIndex % balloonColors.length], '#fff', '#ffad76', '#d6a7ff'];
          const particleCount = 26;
          const burst = document.createElement('div');
          burst.className = 'balloon-burst-layer';
          burst.setAttribute('aria-hidden', 'true');

          for (let particleIndex = 0; particleIndex < particleCount; particleIndex += 1) {
            const particle = document.createElement('span');
            const angle = particleIndex / particleCount * Math.PI * 2 + (Math.random() - .5) * .2;
            const distance = 75 + Math.random() * 115;
            particle.className = 'balloon-burst-particle';
            if (particleIndex % 3 === 0) particle.classList.add('is-round');
            particle.style.left = `${originX}px`;
            particle.style.top = `${originY}px`;
            particle.style.setProperty('--burst-color', burstColors[particleIndex % burstColors.length]);
            particle.style.setProperty('--burst-size', `${6 + Math.random() * 9}px`);
            particle.style.setProperty('--burst-x', `${Math.cos(angle) * distance}px`);
            particle.style.setProperty('--burst-y', `${Math.sin(angle) * distance}px`);
            particle.style.setProperty('--burst-spin', `${(Math.random() - .5) * 720}deg`);
            burst.append(particle);
          }

          document.body.append(burst);
          window.setTimeout(() => burst.remove(), 850);
        });
        layer.append(balloon);
      });
      section.prepend(layer);
    });
  }

  if (!reduceMotion && finePointer) {
    const trail = document.createElement('div');
    const colors = ['#ffd45b', '#ff7ea8', '#82dbff', '#a9ed91', '#d6a7ff'];
    let lastSparkX = 0;
    let lastSparkY = 0;
    let lastSparkTime = 0;
    let hasLastSpark = false;

    trail.className = 'cursor-trail-layer';
    trail.setAttribute('aria-hidden', 'true');
    document.body.append(trail);

    document.addEventListener('pointermove', event => {
      if (event.pointerType === 'touch') return;

      const pointerX = event.clientX;
      const pointerY = event.clientY;
      const now = performance.now();
      if (hasLastSpark && (Math.hypot(pointerX - lastSparkX, pointerY - lastSparkY) < 18 || now - lastSparkTime < 48)) return;

      const particle = document.createElement('span');
      particle.className = 'cursor-trail-particle';
      if (Math.random() < .35) particle.classList.add('is-diamond');
      particle.style.left = `${pointerX}px`;
      particle.style.top = `${pointerY}px`;
      particle.style.setProperty('--spark-color', colors[Math.floor(Math.random() * colors.length)]);
      particle.style.setProperty('--spark-size', `${7 + Math.random() * 9}px`);
      particle.style.setProperty('--spark-x', `${(Math.random() - .5) * 48}px`);
      particle.style.setProperty('--spark-y', `${-12 - Math.random() * 38}px`);
      particle.style.setProperty('--spark-rotation', `${(Math.random() - .5) * 180}deg`);
      particle.addEventListener('animationend', () => particle.remove(), { once: true });
      trail.append(particle);

      lastSparkX = pointerX;
      lastSparkY = pointerY;
      lastSparkTime = now;
      hasLastSpark = true;
    }, { passive: true });
  }

  if (!main || reduceMotion || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver((entries, activeObserver) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-revealed');
      activeObserver.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -36px 0px' });

  const observeTarget = target => {
    if (target.classList.contains('scroll-reveal')) return;

    const siblings = [...target.parentElement.children].filter(element =>
      element.matches('.team-member, .info-card, .planning-card, .photo-item')
    );
    const index = siblings.indexOf(target);
    if (index >= 0) target.style.setProperty('--reveal-delay', `${Math.min(index, 4) * 70}ms`);

    target.classList.add('scroll-reveal');
    observer.observe(target);
  };

  const observeTree = node => {
    if (!(node instanceof Element)) return;
    if (node.matches(selector)) observeTarget(node);
    node.querySelectorAll(selector).forEach(observeTarget);
  };

  observeTree(main);
  new MutationObserver(records => {
    records.forEach(record => record.addedNodes.forEach(observeTree));
  }).observe(main, { childList: true, subtree: true });
})();
