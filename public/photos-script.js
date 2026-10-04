// La galerie est accessible avec un seul mot de passe.
let galleryPhotos = [];
let currentPhotoIndex = 0;

async function loadPhotos() {
  const loginPrompt = document.getElementById('loginPrompt');
  const photoGallery = document.getElementById('photoGallery');

  try {
    const response = await fetch('/api/photos');
    if (!response.ok) throw new Error('Accès non autorisé');

    const photos = await response.json();

    loginPrompt.style.display = 'none';
    photoGallery.style.display = 'block';
    document.getElementById('childInfo').innerHTML = '<h2>📸 Galerie du centre</h2>';

    const photosContainer = document.getElementById('photosContainer');
    photosContainer.innerHTML = '';

    if (!Array.isArray(photos) || !photos.length) {
      const emptyState = document.createElement('div');
      emptyState.className = 'photo-empty-state';
      emptyState.setAttribute('role', 'status');

      const title = document.createElement('h3');
      title.textContent = 'Aucune photo pour le moment';
      const message = document.createElement('p');
      message.textContent = 'Les prochaines photos du centre apparaîtront ici.';

      emptyState.append(title, message);
      photosContainer.appendChild(emptyState);
      return;
    }

    galleryPhotos = photos;

    photos.forEach((photo, index) => {
      const photoItem = document.createElement('article');
      photoItem.className = 'photo-item';

      const image = document.createElement('img');
      image.src = `/photo/${encodeURIComponent(photo.fileName)}`;
      image.alt = `Photo du centre du ${photo.date}`;
      image.loading = 'lazy';
      image.decoding = 'async';

      const imageButton = document.createElement('button');
      imageButton.type = 'button';
      imageButton.className = 'photo-open-button';
      imageButton.setAttribute('aria-label', `Agrandir la photo du ${photo.date}`);
      imageButton.addEventListener('click', () => openPhotoLightbox(index));
      imageButton.appendChild(image);

      const caption = document.createElement('div');
      caption.className = 'photo-caption';
      caption.textContent = photo.date;

      photoItem.append(imageButton, caption);
      photosContainer.appendChild(photoItem);
    });
  } catch {
    loginPrompt.style.display = 'block';
    photoGallery.style.display = 'none';
  }
}

function showPhotoAt(index) {
  if (!galleryPhotos.length) return;

  const image = document.getElementById('photoLightboxImage');
  const reverse = index < currentPhotoIndex;
  currentPhotoIndex = (index + galleryPhotos.length) % galleryPhotos.length;
  const photo = galleryPhotos[currentPhotoIndex];
  image.classList.remove('is-changing');
  image.classList.toggle('is-reverse', reverse);
  void image.offsetWidth;
  image.src = `/photo/${encodeURIComponent(photo.fileName)}`;
  image.alt = `Photo du centre du ${photo.date}`;
  image.classList.add('is-changing');
  document.getElementById('photoLightboxCaption').textContent = photo.date;
}

function openPhotoLightbox(index) {
  showPhotoAt(index);
  const hasMultiplePhotos = galleryPhotos.length > 1;
  document.getElementById('photoLightboxPrevious').hidden = !hasMultiplePhotos;
  document.getElementById('photoLightboxNext').hidden = !hasMultiplePhotos;
  document.getElementById('photoLightbox').showModal();
}

function openLoginModal() {
  const modal = document.getElementById('loginModal');
  const loginForm = document.getElementById('loginForm');

  modal.classList.add('active');
  document.getElementById('parentPassword').focus();
  loginForm.onsubmit = handleLogin;
}

function closeLoginModal() {
  document.getElementById('loginModal').classList.remove('active');
}

async function handleLogin(event) {
  event.preventDefault();
  const password = document.getElementById('parentPassword').value;

  try {
    const response = await fetch('/api/photos/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    const data = await response.json();

    if (!data.success) {
      alert(`Connexion échouée : ${data.message}`);
      return;
    }

    document.getElementById('loginForm').reset();
    closeLoginModal();
    loadPhotos();
  } catch {
    alert('La connexion à la galerie est indisponible.');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadPhotos();
  document.querySelector('.close')?.addEventListener('click', closeLoginModal);

  const photoLightbox = document.getElementById('photoLightbox');
  document.getElementById('photoLightboxClose')?.addEventListener('click', () => photoLightbox.close());
  document.getElementById('photoLightboxPrevious')?.addEventListener('click', () => showPhotoAt(currentPhotoIndex - 1));
  document.getElementById('photoLightboxNext')?.addEventListener('click', () => showPhotoAt(currentPhotoIndex + 1));
  photoLightbox?.addEventListener('cancel', () => photoLightbox.close());
  photoLightbox?.addEventListener('click', event => {
    if (event.target === photoLightbox) photoLightbox.close();
  });

  document.addEventListener('keydown', event => {
    if (!photoLightbox?.open) return;
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      showPhotoAt(currentPhotoIndex - 1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      showPhotoAt(currentPhotoIndex + 1);
    } else if (event.key === 'Escape') {
      photoLightbox.close();
    }
  });

  window.addEventListener('click', event => {
    if (event.target === document.getElementById('loginModal')) closeLoginModal();
  });
});
