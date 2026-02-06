// ========== MEDIA TABS ==========
document.querySelectorAll('.media-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.media-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.media-content').forEach(c => c.classList.add('hidden'));
    tab.classList.add('active');
    document.getElementById('tab-' + tab.dataset.tab).classList.remove('hidden');
  });
});

// ========== CONTACT FIELD PLACEHOLDER ==========
const placeholders = {
  instagram: '@yourinsta',
  whatsapp: '+62 812 345 6789',
  email: 'you@email.com'
};

document.querySelectorAll('input[name="contact_type"]').forEach(radio => {
  radio.addEventListener('change', () => {
    const input = document.getElementById('contact');
    if (!input) return;
    input.placeholder = placeholders[radio.value] || '';
    if (radio.value === 'email') {
      input.type = 'email';
    } else if (radio.value === 'whatsapp') {
      input.type = 'tel';
    } else {
      input.type = 'text';
    }
  });
});

// ========== FORM SUBMISSION (Netlify Forms) ==========
const form = document.getElementById('guestlist-form');
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector('.btn--full');

    if (!form.name.value.trim() || !form.contact.value.trim()) return;

    submitBtn.textContent = 'Sending...';
    submitBtn.disabled = true;

    try {
      await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(new FormData(form)).toString()
      });

      form.querySelectorAll('.form__group, .btn--full, .hidden-field').forEach(el => el.classList.add('hidden'));
      document.getElementById('form-success').classList.remove('hidden');
    } catch (err) {
      submitBtn.textContent = 'Something went wrong. Try again.';
      submitBtn.disabled = false;
    }
  });
}

// ========== SMOOTH SCROLL FOR NAV ==========
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});
