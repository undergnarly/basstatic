// ========== EVENT DATA LOADER ==========
async function loadEventData() {
  try {
    const resp = await fetch('/data/events.json');
    const data = await resp.json();
    const activeId = data.settings.activeEventId;
    const event = data.events.find(e => e.id === activeId);
    if (!event) return;

    // Hero badge
    const badge = document.querySelector('.hero__badge');
    if (badge) {
      const d = new Date(event.date + 'T00:00:00');
      const day = d.getDate();
      const month = d.toLocaleString('en', { month: 'long' });
      badge.textContent = `${day} ${month} in ${event.venue}`;
    }

    // Hero media
    const heroVideo = document.querySelector('.hero__poster video');
    if (heroVideo) {
      heroVideo.src = '/' + event.heroVideo;
      heroVideo.poster = '/' + event.posterImage;
    }
    const heroImg = document.querySelector('.hero__poster img');
    if (heroImg && !heroVideo) {
      heroImg.src = '/' + event.posterImage;
    }

    // Background music
    const bgMusic = document.getElementById('bg-music');
    if (bgMusic && event.bgMusic) {
      bgMusic.src = '/' + event.bgMusic;
    }

    // Artists
    const artistEls = document.querySelectorAll('.hero__artists');
    if (artistEls.length >= 1) {
      artistEls[0].innerHTML = event.artists.join(' &middot; ');
    }
    if (artistEls.length >= 2 && event.mc && event.mc.length) {
      artistEls[1].innerHTML = event.mc.join(' &middot; ');
    } else if (artistEls.length >= 2) {
      artistEls[1].style.display = 'none';
    }

    // Genres
    const genreEl = document.querySelector('.hero__genres');
    if (genreEl) {
      genreEl.innerHTML = event.genres.join(' &middot; ');
    }

    // Hero CTA button
    const heroCta = document.querySelector('.hero__content > .btn--primary');
    if (heroCta) {
      if (event.guestlistEnabled && heroCta.getAttribute('href') === '#guestlist') {
        // guestlist page — keep as is
      } else if (event.ticketLink) {
        heroCta.href = event.ticketLink;
        heroCta.target = '_blank';
        heroCta.rel = 'noopener';
      }
    }

    // Event card
    const cardDay = document.querySelector('.event-card__day');
    const cardMonth = document.querySelector('.event-card__month');
    const cardName = document.querySelector('.event-card__name');
    const cardDetail = document.querySelector('.event-card__detail');
    const cardBtn = document.querySelector('.event-card .btn--small');

    if (cardDay && cardMonth) {
      const d = new Date(event.date + 'T00:00:00');
      cardDay.textContent = d.getDate();
      cardMonth.textContent = d.toLocaleString('en', { month: 'short' }).toUpperCase();
    }
    if (cardName) cardName.textContent = event.title;
    if (cardDetail) {
      // Find the venue detail line (not the "Free Entry" line)
      const details = document.querySelectorAll('.event-card__detail');
      details.forEach(el => {
        if (el.textContent.includes('Bali') || el.textContent.includes('Nuanu')) {
          el.innerHTML = event.venue + ' &middot; ' + event.location;
        }
      });
    }
    if (cardBtn && event.ticketLink && !event.guestlistEnabled) {
      cardBtn.href = event.ticketLink;
      cardBtn.target = '_blank';
      cardBtn.textContent = 'Get Tickets';
    }

    // Past events grid
    const grid = document.getElementById('events-grid');
    if (grid) {
      const pastEvents = data.events.filter(e => e.id !== activeId && e.status === 'past');
      pastEvents.forEach(ev => {
        const d = new Date(ev.date + 'T00:00:00');
        const card = document.createElement('div');
        card.className = 'event-card';
        card.innerHTML = `
          <div class="event-card__date">
            <span class="event-card__day">${d.getDate()}</span>
            <span class="event-card__month">${d.toLocaleString('en', { month: 'short' }).toUpperCase()}</span>
          </div>
          <div class="event-card__info">
            <h3 class="event-card__name">${ev.title}</h3>
            <p class="event-card__detail">${ev.venue} &middot; ${ev.location}</p>
            <a href="/events/${ev.id}" class="btn btn--small">View</a>
          </div>`;
        grid.appendChild(card);
      });
    }
  } catch (err) {
    console.error('Failed to load event data:', err);
  }
}

// Load data as soon as possible
loadEventData();

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
      await fetch(form.closest('form').getAttribute('action') || window.location.pathname, {
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

// ========== BACKGROUND MUSIC ==========
const bgMusic = document.getElementById('bg-music');
const soundToggle = document.getElementById('sound-toggle');

if (bgMusic && soundToggle) {
  const iconOff = soundToggle.querySelector('.sound-icon--off');
  const iconOn = soundToggle.querySelector('.sound-icon--on');
  let musicStarted = false;

  const maxVolume = 0.4;
  const fadeDuration = 3000;
  const fadeSteps = 30;

  function fadeIn() {
    let step = 0;
    const interval = setInterval(() => {
      step++;
      bgMusic.volume = maxVolume * (step / fadeSteps);
      if (step >= fadeSteps) clearInterval(interval);
    }, fadeDuration / fadeSteps);
  }

  // Bass-reactive video zoom
  let audioCtx, analyser, dataArray, source;
  const heroVideo = document.querySelector('.hero__poster video');
  const heroPoster = document.querySelector('.hero__poster');

  function initBassReactor() {
    if (audioCtx) return;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.4;
      source = audioCtx.createMediaElementSource(bgMusic);
      source.connect(analyser);
      analyser.connect(audioCtx.destination);
      dataArray = new Uint8Array(analyser.frequencyBinCount);
      if (audioCtx.state === 'suspended') audioCtx.resume();
      console.log('Bass reactor started');
      bassLoop();
    } catch (e) {
      console.error('Bass reactor failed:', e);
    }
  }

  let slowZoom = 1;
  let zoomDir = 1;

  function bassLoop() {
    requestAnimationFrame(bassLoop);
    if (!heroPoster || !analyser) return;
    analyser.getByteFrequencyData(dataArray);

    // fftSize 1024 @ 44100Hz = ~43Hz per bin
    // bin 1 ≈ 43Hz, bin 2 ≈ 86Hz — target sub around 45Hz
    let sub = (dataArray[1] * 0.8 + dataArray[2] * 0.2);

    const intensity = Math.min(1, sub / 160);
    const hasBass = intensity > 0.45;

    if (hasBass) {
      // Sub active: micro-vibration + zoom
      const shakeIntensity = Math.max(0, (intensity - 0.45) / 0.55);
      const shakeAmount = shakeIntensity * 1.2;
      const shakeX = (Math.random() - 0.5) * shakeAmount;
      const shakeY = (Math.random() - 0.5) * shakeAmount;
      const scale = 1 + intensity * 0.1;
      const bright = 0.6 + intensity * 0.7;
      heroPoster.style.transform = `scale(${scale}) translate(${shakeX}px, ${shakeY}px)`;
      heroPoster.style.filter = `brightness(${bright})`;
    } else {
      // No sub: slow gentle zoom
      slowZoom += zoomDir * 0.0001;
      if (slowZoom > 1.04) zoomDir = -1;
      if (slowZoom < 1) zoomDir = 1;
      const zoomProgress = (slowZoom - 1) / 0.04;
      const bright = 0.7 + zoomProgress * 0.3;
      heroPoster.style.transform = `scale(${slowZoom})`;
      heroPoster.style.filter = `brightness(${bright})`;
    }
  }

  function startMusic() {
    if (musicStarted) return;
    bgMusic.volume = 0;
    bgMusic.play().then(() => {
      musicStarted = true;
      fadeIn();
      initBassReactor();
      iconOff.classList.add('hidden');
      iconOn.classList.remove('hidden');
    }).catch(() => {});
    document.removeEventListener('click', startMusic);
    document.removeEventListener('touchstart', startMusic);
  }

  // Try autoplay immediately
  startMusic();

  // Fallback: play on first interaction if browser blocked autoplay
  document.addEventListener('click', startMusic);
  document.addEventListener('touchstart', startMusic);

  soundToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!musicStarted) {
      startMusic();
      return;
    }
    if (bgMusic.paused) {
      bgMusic.play();
      iconOff.classList.add('hidden');
      iconOn.classList.remove('hidden');
    } else {
      bgMusic.pause();
      iconOn.classList.add('hidden');
      iconOff.classList.remove('hidden');
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
