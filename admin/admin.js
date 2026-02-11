// ========== STATE ==========
let password = sessionStorage.getItem('admin_pw') || '';
let data = null;
let editingId = null;

// ========== DOM ==========
const loginScreen = document.getElementById('login-screen');
const adminPanel = document.getElementById('admin-panel');
const loginBtn = document.getElementById('login-btn');
const loginPw = document.getElementById('login-password');
const logoutBtn = document.getElementById('logout-btn');
const activeSelect = document.getElementById('active-event-select');
const eventList = document.getElementById('event-list');
const addEventBtn = document.getElementById('add-event-btn');
const editorWrap = document.getElementById('editor-wrap');
const saveBtn = document.getElementById('save-btn');
const deleteBtn = document.getElementById('delete-btn');
const toast = document.getElementById('toast');

// ========== LOGIN ==========
loginBtn.addEventListener('click', tryLogin);
loginPw.addEventListener('keydown', e => { if (e.key === 'Enter') tryLogin(); });
logoutBtn.addEventListener('click', () => {
  password = '';
  sessionStorage.removeItem('admin_pw');
  loginScreen.classList.remove('hidden');
  adminPanel.classList.add('hidden');
  editorWrap.classList.add('hidden');
});

async function tryLogin() {
  const pw = loginPw.value.trim();
  if (!pw) return;
  password = pw;
  sessionStorage.setItem('admin_pw', pw);
  await loadData();
}

// Auto-login if password in session
if (password) {
  loadData();
}

// ========== LOAD DATA ==========
async function loadData() {
  try {
    const resp = await fetch('/data/events.json');
    data = await resp.json();
    loginScreen.classList.add('hidden');
    adminPanel.classList.remove('hidden');
    renderEventList();
    renderActiveSelect();
  } catch (err) {
    showToast('Failed to load data', 'error');
  }
}

// ========== RENDER ==========
function renderEventList() {
  eventList.innerHTML = '';
  data.events.forEach(ev => {
    const d = new Date(ev.date + 'T00:00:00');
    const dateStr = d.toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' });
    const item = document.createElement('div');
    item.className = 'event-item' + (editingId === ev.id ? ' active' : '');
    item.innerHTML = `
      <span class="event-item__date">${dateStr}</span>
      <span class="event-item__title">${ev.title}</span>
      <span class="event-item__status event-item__status--${ev.status}">${ev.status}</span>`;
    item.addEventListener('click', () => openEditor(ev.id));
    eventList.appendChild(item);
  });
}

function renderActiveSelect() {
  activeSelect.innerHTML = '';
  data.events.forEach(ev => {
    const opt = document.createElement('option');
    opt.value = ev.id;
    opt.textContent = ev.title;
    if (ev.id === data.settings.activeEventId) opt.selected = true;
    activeSelect.appendChild(opt);
  });
}

// ========== ACTIVE EVENT CHANGE ==========
activeSelect.addEventListener('change', () => {
  data.settings.activeEventId = parseInt(activeSelect.value);
});

// ========== NEW EVENT ==========
addEventBtn.addEventListener('click', () => {
  const maxId = data.events.reduce((max, e) => Math.max(max, e.id), 0);
  const newId = maxId + 1;
  data.events.push({
    id: newId,
    type: 'full',
    status: 'draft',
    title: 'New Event',
    date: new Date().toISOString().split('T')[0],
    venue: '',
    location: '',
    artists: [],
    mc: [],
    genres: [],
    ticketLink: '',
    guestlistEnabled: false,
    heroVideo: `media/events/${newId}/hero.mp4`,
    posterImage: `media/events/${newId}/poster.jpeg`,
    bgMusic: `media/events/${newId}/bg-music.mp3`,
    streamRecording: null
  });
  renderEventList();
  renderActiveSelect();
  openEditor(newId);
});

// ========== EDITOR ==========
function openEditor(id) {
  editingId = id;
  const ev = data.events.find(e => e.id === id);
  if (!ev) return;

  document.getElementById('editor-title').textContent = 'Edit: ' + ev.title;
  document.getElementById('ev-type').value = ev.type;
  document.getElementById('ev-status').value = ev.status;
  document.getElementById('ev-title').value = ev.title;
  document.getElementById('ev-date').value = ev.date;
  document.getElementById('ev-venue').value = ev.venue;
  document.getElementById('ev-location').value = ev.location;
  document.getElementById('ev-artists').value = ev.artists.join(', ');
  document.getElementById('ev-mc').value = (ev.mc || []).join(', ');
  document.getElementById('ev-genres').value = ev.genres.join(', ');
  document.getElementById('ev-ticket').value = ev.ticketLink || '';
  document.getElementById('ev-guestlist').value = ev.guestlistEnabled ? 'true' : 'false';
  document.getElementById('ev-video').value = ev.heroVideo ? ev.heroVideo.split('/').pop() : '';
  document.getElementById('ev-bgmusic').value = ev.bgMusic ? ev.bgMusic.split('/').pop() : '';
  document.getElementById('ev-stream').value = ev.streamRecording || '';

  // Poster preview
  const preview = document.getElementById('poster-preview');
  const currentLabel = document.getElementById('poster-current');
  if (ev.posterImage) {
    preview.src = '/' + ev.posterImage;
    preview.classList.remove('hidden');
    currentLabel.textContent = 'Current: ' + ev.posterImage;
  } else {
    preview.classList.add('hidden');
    currentLabel.textContent = '';
  }

  editorWrap.classList.remove('hidden');
  renderEventList();
}

// ========== GATHER FORM DATA ==========
function gatherFormData() {
  const ev = data.events.find(e => e.id === editingId);
  if (!ev) return;

  const csvToArr = s => s.split(',').map(x => x.trim()).filter(Boolean);

  ev.type = document.getElementById('ev-type').value;
  ev.status = document.getElementById('ev-status').value;
  ev.title = document.getElementById('ev-title').value.trim();
  ev.date = document.getElementById('ev-date').value;
  ev.venue = document.getElementById('ev-venue').value.trim();
  ev.location = document.getElementById('ev-location').value.trim();
  ev.artists = csvToArr(document.getElementById('ev-artists').value);
  ev.mc = csvToArr(document.getElementById('ev-mc').value);
  ev.genres = csvToArr(document.getElementById('ev-genres').value);
  ev.ticketLink = document.getElementById('ev-ticket').value.trim();
  ev.guestlistEnabled = document.getElementById('ev-guestlist').value === 'true';

  const videoFile = document.getElementById('ev-video').value.trim();
  ev.heroVideo = videoFile ? `media/events/${ev.id}/${videoFile}` : null;

  const musicFile = document.getElementById('ev-bgmusic').value.trim();
  ev.bgMusic = musicFile ? `media/events/${ev.id}/${musicFile}` : null;

  const stream = document.getElementById('ev-stream').value.trim();
  ev.streamRecording = stream || null;
}

// ========== POSTER UPLOAD ==========
document.getElementById('poster-file').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const ev = data.events.find(e => e.id === editingId);
  if (!ev) return;

  const ext = file.name.split('.').pop().toLowerCase();
  const uploadPath = `media/events/${ev.id}/poster.${ext}`;

  // Show preview
  const reader = new FileReader();
  reader.onload = (e) => {
    const preview = document.getElementById('poster-preview');
    preview.src = e.target.result;
    preview.classList.remove('hidden');
  };
  reader.readAsDataURL(file);

  showToast('Uploading poster...', 'success');

  const formData = new FormData();
  formData.append('password', password);
  formData.append('file', file);
  formData.append('path', uploadPath);

  try {
    const resp = await fetch('/.netlify/functions/admin-upload', {
      method: 'POST',
      body: formData
    });

    const result = await resp.json();
    if (!resp.ok) {
      showToast(result.error || 'Upload failed', 'error');
      return;
    }

    ev.posterImage = uploadPath;
    document.getElementById('poster-current').textContent = 'Current: ' + uploadPath;
    showToast('Poster uploaded', 'success');
  } catch (err) {
    showToast('Upload failed: ' + err.message, 'error');
  }
});

// ========== SAVE ==========
saveBtn.addEventListener('click', async () => {
  gatherFormData();

  saveBtn.textContent = 'Saving...';
  saveBtn.disabled = true;

  try {
    const resp = await fetch('/.netlify/functions/admin-save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, data })
    });

    const result = await resp.json();
    if (!resp.ok) {
      showToast(result.error || 'Save failed', 'error');
      if (result.error === 'Unauthorized') {
        password = '';
        sessionStorage.removeItem('admin_pw');
        loginScreen.classList.remove('hidden');
        adminPanel.classList.add('hidden');
      }
      return;
    }

    showToast('Saved. Deploy will start shortly.', 'success');
    renderEventList();
    renderActiveSelect();
  } catch (err) {
    showToast('Save failed: ' + err.message, 'error');
  } finally {
    saveBtn.textContent = 'Save & Deploy';
    saveBtn.disabled = false;
  }
});

// ========== DELETE ==========
deleteBtn.addEventListener('click', async () => {
  if (!editingId) return;
  if (!confirm('Delete this event? This will save immediately.')) return;

  data.events = data.events.filter(e => e.id !== editingId);

  if (data.settings.activeEventId === editingId && data.events.length) {
    data.settings.activeEventId = data.events[0].id;
  }

  editingId = null;
  editorWrap.classList.add('hidden');

  deleteBtn.textContent = 'Deleting...';
  deleteBtn.disabled = true;

  try {
    const resp = await fetch('/.netlify/functions/admin-save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, data })
    });

    const result = await resp.json();
    if (!resp.ok) {
      showToast(result.error || 'Delete failed', 'error');
      return;
    }

    showToast('Event deleted. Deploy will start shortly.', 'success');
    renderEventList();
    renderActiveSelect();
  } catch (err) {
    showToast('Delete failed: ' + err.message, 'error');
  } finally {
    deleteBtn.textContent = 'Delete';
    deleteBtn.disabled = false;
  }
});

// ========== TOAST ==========
function showToast(msg, type) {
  toast.textContent = msg;
  toast.className = 'toast toast--' + type + ' show';
  setTimeout(() => toast.classList.remove('show'), 3000);
}
