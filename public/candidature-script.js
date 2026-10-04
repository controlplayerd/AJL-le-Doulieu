// Gérer le formulaire de candidature
document.addEventListener('DOMContentLoaded', function() {
  const candidatureForm = document.getElementById('candidatureForm');

  if (candidatureForm) {
    candidatureForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('candidateName').value;
      const email = document.getElementById('candidateEmail').value;
      const phone = document.getElementById('candidatePhone').value;
      const experience = document.getElementById('candidateExperience').value;
      const motivation = document.getElementById('candidateMotivation').value;
      const availability = document.getElementById('candidateAvailability').value;

      try {
        const response = await fetch('/api/candidature', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, phone, experience, motivation, availability })
        });

        const data = await response.json();

        if (response.ok && data.success) {
          const messageDiv = document.getElementById('candidatureMessage');
          messageDiv.textContent = 'Votre candidature a été reçue avec succès ! Nous vous recontacterons bientôt.';
          messageDiv.className = 'alert alert-success';
          messageDiv.style.display = 'block';

          candidatureForm.reset();
          setTimeout(() => {
            messageDiv.style.display = 'none';
          }, 5000);
        } else {
          const messageDiv = document.getElementById('candidatureMessage');
          messageDiv.textContent = data.message || 'Erreur lors de l\'envoi de la candidature. Veuillez réessayer.';
          messageDiv.className = 'alert alert-error';
          messageDiv.style.display = 'block';
        }
      } catch (error) {
        console.error('Erreur lors de l\'envoi de la candidature:', error);
        const messageDiv = document.getElementById('candidatureMessage');
        messageDiv.textContent = 'Erreur lors de l\'envoi de la candidature. Veuillez réessayer.';
        messageDiv.className = 'alert alert-error';
        messageDiv.style.display = 'block';
      }
    });
  }

});
