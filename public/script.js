// Charger les animateurs
async function loadAnimators() {
  try {
    const response = await fetch('/api/animators');
    const animators = await response.json();

    const teamContainers = {
      director: document.getElementById('teamDirectorContainer'),
      '3-5': document.getElementById('team35Container'),
      '6-11': document.getElementById('team611Container')
    };

    Object.values(teamContainers).forEach(container => container.replaceChildren());

    animators.forEach(animator => {
      const teamContainer = teamContainers[animator.teamGroup];
      if (!teamContainer) return;

      const memberDiv = document.createElement('div');
      memberDiv.className = 'team-member';
      if (animator.teamGroup === 'director') {
        memberDiv.classList.add('team-director');
      }

      if (animator.placeholder) {
        memberDiv.classList.add('team-member-placeholder');
        const placeholderVisual = document.createElement('div');
        placeholderVisual.className = 'team-placeholder-visual';
        placeholderVisual.setAttribute('aria-hidden', 'true');
        placeholderVisual.textContent = 'À compléter';
        memberDiv.appendChild(placeholderVisual);
      } else if (animator.photo) {
        const image = document.createElement('img');
        image.src = animator.photo;
        image.alt = animator.name;
        image.loading = 'lazy';
        memberDiv.appendChild(image);
      }

      const memberInfo = document.createElement('div');
      memberInfo.className = 'team-member-info';
      const name = document.createElement('h3');
      name.textContent = animator.name;
      const role = document.createElement('p');
      role.textContent = animator.role;
      memberInfo.append(name, role);
      memberDiv.appendChild(memberInfo);
      teamContainer.appendChild(memberDiv);
    });
  } catch (error) {
    console.error('Erreur lors du chargement des animateurs:', error);
  }
}

function startVacationCountdown() {
  const countdown = document.getElementById('vacationCountdown');
  if (!countdown) return;

  const targetTime = new Date(2026, 9, 19, 0, 0, 0).getTime();
  const daysElement = countdown.querySelector('[data-countdown-days]');
  const hoursElement = countdown.querySelector('[data-countdown-hours]');
  const minutesElement = countdown.querySelector('[data-countdown-minutes]');
  const secondsElement = countdown.querySelector('[data-countdown-seconds]');
  let countdownInterval;

  const updateCountdown = () => {
    const remainingSeconds = Math.floor((targetTime - Date.now()) / 1000);
    if (remainingSeconds <= 0) {
      countdown.remove();
      if (countdownInterval) clearInterval(countdownInterval);
      return false;
    }

    const updateValue = (element, value) => {
      if (element.textContent === value) return;
      element.textContent = value;
      element.classList.remove('is-flipping');
      void element.offsetWidth;
      element.classList.add('is-flipping');
    };

    updateValue(daysElement, String(Math.floor(remainingSeconds / 86400)).padStart(2, '0'));
    updateValue(hoursElement, String(Math.floor((remainingSeconds % 86400) / 3600)).padStart(2, '0'));
    updateValue(minutesElement, String(Math.floor((remainingSeconds % 3600) / 60)).padStart(2, '0'));
    updateValue(secondsElement, String(remainingSeconds % 60).padStart(2, '0'));
    return true;
  };

  if (updateCountdown()) countdownInterval = window.setInterval(updateCountdown, 1000);
}

// Gérer le formulaire de contact
document.addEventListener('DOMContentLoaded', function() {
  loadAnimators();
  startVacationCountdown();

  const giftTrigger = document.getElementById('giftTrigger');
  const giftDialog = document.getElementById('animationTeamGift');
  let giftOpenTimer;
  giftTrigger?.addEventListener('click', () => {
    if (!giftDialog || giftDialog.open || giftOpenTimer) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      giftDialog.showModal();
      return;
    }

    const colors = ['#ff5c8a', '#ffd447', '#48d9cc', '#9c7bff', '#ff9f43', '#fff'];
    const triggerBounds = giftTrigger.getBoundingClientRect();
    const originX = triggerBounds.left + triggerBounds.width / 2;
    const originY = triggerBounds.top + triggerBounds.height / 2;
    const burstLayer = document.createElement('div');
    burstLayer.className = 'gift-confetti-burst';
    burstLayer.setAttribute('aria-hidden', 'true');

    for (let particleIndex = 0; particleIndex < 64; particleIndex += 1) {
      const particle = document.createElement('span');
      const angle = particleIndex / 64 * Math.PI * 2 + (Math.random() - .5) * .16;
      const distance = Math.hypot(window.innerWidth, window.innerHeight) * (.36 + Math.random() * .48);
      particle.className = 'gift-confetti-piece';
      if (particleIndex % 4 === 0) particle.classList.add('is-round');
      if (particleIndex % 5 === 0) particle.classList.add('is-ribbon');
      particle.style.left = `${originX}px`;
      particle.style.top = `${originY}px`;
      particle.style.setProperty('--confetti-color', colors[particleIndex % colors.length]);
      particle.style.setProperty('--confetti-size', `${8 + Math.random() * 12}px`);
      particle.style.setProperty('--confetti-x', `${Math.cos(angle) * distance}px`);
      particle.style.setProperty('--confetti-y', `${Math.sin(angle) * distance + window.innerHeight * .15}px`);
      particle.style.setProperty('--confetti-spin', `${(Math.random() - .5) * 1200}deg`);
      particle.style.setProperty('--confetti-delay', `${Math.random() * 100}ms`);
      burstLayer.append(particle);
    }

    document.body.append(burstLayer);
    window.setTimeout(() => burstLayer.remove(), 1600);
    giftTrigger.disabled = true;
    giftOpenTimer = window.setTimeout(() => {
      giftTrigger.disabled = false;
      giftOpenTimer = null;
      giftDialog.showModal();
    }, 360);
  });
  giftDialog?.querySelector('.gift-dialog-close')?.addEventListener('click', () => giftDialog.close());
  giftDialog?.addEventListener('click', event => {
    if (event.target === giftDialog) giftDialog.close();
  });

  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('contactName').value;
      const email = document.getElementById('contactEmail').value;
      const message = document.getElementById('contactMessage').value;

      try {
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, message })
        });

        const data = await response.json();

        if (data.success) {
          const messageDiv = document.getElementById('contactFeedback');
          messageDiv.textContent = 'Votre message a été envoyé avec succès !';
          messageDiv.className = 'alert alert-success';
          messageDiv.style.display = 'block';

          contactForm.reset();
          setTimeout(() => {
            messageDiv.style.display = 'none';
          }, 3000);
        } else {
          const messageDiv = document.getElementById('contactFeedback');
          messageDiv.textContent = data.message || 'Erreur lors de l\'envoi du message. Veuillez réessayer.';
          messageDiv.className = 'alert alert-error';
          messageDiv.style.display = 'block';
        }
      } catch (error) {
        console.error('Erreur lors de l\'envoi du message:', error);
        const messageDiv = document.getElementById('contactFeedback');
        messageDiv.textContent = 'Erreur lors de l\'envoi du message. Veuillez réessayer.';
        messageDiv.className = 'alert alert-error';
        messageDiv.style.display = 'block';
      }
    });
  }

});
