const loginView = document.getElementById('login-view');
const dashView = document.getElementById('dashboard-view');
let episodes = [];

async function checkSession() {
  const res = await fetch('/api/session');
  const { loggedIn } = await res.json();
  showView(loggedIn);
  if (loggedIn) {
    loadEpisodes();
    loadResumeMeta();
  }
}

function showView(loggedIn) {
  loginView.style.display = loggedIn ? 'none' : 'block';
  dashView.style.display = loggedIn ? 'block' : 'none';
}

document.getElementById('login-form').addEventListener('submit', async e => {
  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const errorEl = document.getElementById('login-error');
  errorEl.textContent = '';

  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const data = await res.json();
  if (data.ok) {
    showView(true);
    loadEpisodes();
    loadResumeMeta();
  } else {
    errorEl.textContent = data.error || 'Login failed';
  }
});

document.getElementById('logout-btn').addEventListener('click', async () => {
  await fetch('/api/logout', { method: 'POST' });
  showView(false);
});

// ---- Vlog episode editor ----
async function loadEpisodes() {
  const res = await fetch('/api/vlogs');
  episodes = await res.json();
  renderEpisodes();
}

function renderEpisodes() {
  const list = document.getElementById('ep-list');
  list.innerHTML = episodes.map((ep, i) => `
    <div class="ep-row" data-index="${i}">
      <input data-field="id" placeholder="id (e.g. episode-4)" value="${escAttr(ep.id)}">
      <input data-field="tag" placeholder="Tag" value="${escAttr(ep.tag)}">
      <input class="full" data-field="title" placeholder="Title" value="${escAttr(ep.title)}">
      <input class="full" data-field="desc" placeholder="Description" value="${escAttr(ep.desc)}">
      <input data-field="date" placeholder="Date (e.g. Sep 2026)" value="${escAttr(ep.date)}">
      <input data-field="duration" placeholder="Duration (e.g. 08:12)" value="${escAttr(ep.duration)}">
      <input class="full" data-field="videoId" placeholder="YouTube video ID" value="${escAttr(ep.videoId)}">
      <div class="ep-actions"><button type="button" data-remove="${i}">Remove episode</button></div>
    </div>
  `).join('') || '<p style="color:var(--text-faint);font-size:0.9rem;">No episodes yet — add one below.</p>';

  list.querySelectorAll('.ep-row').forEach(row => {
    const index = Number(row.dataset.index);
    row.querySelectorAll('input').forEach(input => {
      input.addEventListener('input', () => {
        episodes[index][input.dataset.field] = input.value;
      });
    });
  });
  list.querySelectorAll('[data-remove]').forEach(btn => {
    btn.addEventListener('click', () => {
      episodes.splice(Number(btn.dataset.remove), 1);
      renderEpisodes();
    });
  });
}

function escAttr(str) {
  return (str || '').replace(/"/g, '&quot;');
}

document.getElementById('add-ep-btn').addEventListener('click', () => {
  episodes.push({ id: `episode-${episodes.length + 1}`, tag: '', title: '', desc: '', date: '', duration: '', videoId: '' });
  renderEpisodes();
});

document.getElementById('save-eps-btn').addEventListener('click', async () => {
  const msg = document.getElementById('eps-msg');
  msg.textContent = 'Saving...';
  const res = await fetch('/api/vlogs', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(episodes)
  });
  const data = await res.json();
  msg.textContent = data.ok ? 'Saved.' : (data.error || 'Save failed.');
  setTimeout(() => (msg.textContent = ''), 2500);
});

// ---- Resume uploader ----
async function loadResumeMeta() {
  const res = await fetch('/api/resume');
  const meta = await res.json();
  const el = document.getElementById('resume-current');
  el.textContent = meta.filename
    ? `Current: ${meta.filename} (uploaded ${new Date(meta.uploadedAt).toLocaleDateString()})`
    : 'No resume uploaded yet.';
}

document.getElementById('resume-upload-btn').addEventListener('click', async () => {
  const fileInput = document.getElementById('resume-file');
  const msg = document.getElementById('resume-msg');
  const file = fileInput.files[0];
  if (!file) {
    msg.textContent = 'Choose a file first.';
    return;
  }
  msg.textContent = 'Uploading...';
  const dataBase64 = await fileToBase64(file);
  const res = await fetch('/api/resume', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename: file.name, mime: file.type, dataBase64 })
  });
  const data = await res.json();
  msg.textContent = data.ok ? 'Uploaded.' : (data.error || 'Upload failed.');
  if (data.ok) loadResumeMeta();
  setTimeout(() => (msg.textContent = ''), 2500);
});

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

checkSession();
