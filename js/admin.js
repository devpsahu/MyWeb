const loginView = document.getElementById('login-view');
const dashView = document.getElementById('dashboard-view');
let vlogPosts = []; // { id (Firestore doc id, or null for new), title, date, content }

function showView(loggedIn) {
  loginView.style.display = loggedIn ? 'none' : 'flex';
  dashView.style.display = loggedIn ? 'block' : 'none';
}

// ---- Auth ----
auth.onAuthStateChanged(user => {
  showView(!!user);
  if (user) {
    loadVlogs();
    loadResumeMeta();
    loadPhotoMeta();
  }
});

document.getElementById('login-form').addEventListener('submit', async e => {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const remember = document.getElementById('remember-me').checked;
  const errorEl = document.getElementById('login-error');
  const submitBtn = document.getElementById('login-submit');
  errorEl.textContent = '';
  errorEl.style.color = '#ff8080';
  submitBtn.disabled = true;
  submitBtn.textContent = 'Signing in...';
  try {
    await auth.setPersistence(
      remember ? firebase.auth.Auth.Persistence.LOCAL : firebase.auth.Auth.Persistence.SESSION
    );
    await auth.signInWithEmailAndPassword(email, password);
  } catch (err) {
    // Incorrect email/password (and a few related codes) all get one friendly message.
    const wrongCreds = ['auth/wrong-password', 'auth/user-not-found', 'auth/invalid-credential', 'auth/invalid-email'];
    errorEl.textContent = wrongCreds.includes(err.code)
      ? 'Incorrect email or password.'
      : 'Could not log in: ' + err.message;
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Sign in';
  }
});

document.getElementById('forgot-password').addEventListener('click', async () => {
  const errorEl = document.getElementById('login-error');
  const email = document.getElementById('email').value.trim() || prompt('Enter your admin email to reset your password:');
  if (!email) return;
  try {
    await auth.sendPasswordResetEmail(email);
    errorEl.style.color = '#7fd6a8';
    errorEl.textContent = 'Password reset email sent — check your inbox.';
  } catch (err) {
    errorEl.style.color = '#ff8080';
    errorEl.textContent = 'Could not send reset email: ' + err.message;
  }
});

document.getElementById('logout-btn').addEventListener('click', () => auth.signOut());

// ---- Weekly text vlog editor ----
async function loadVlogs() {
  const snap = await db.collection('vlogs').orderBy('createdAt', 'desc').get();
  vlogPosts = snap.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
  renderVlogRows();
}

function renderVlogRows() {
  const list = document.getElementById('ep-list');
  list.innerHTML = vlogPosts.map((v, i) => `
    <div class="ep-row" data-index="${i}">
      <input data-field="title" placeholder="Title" value="${escAttr(v.title)}">
      <input data-field="date" placeholder="Date (e.g. 13 Sep 2026)" value="${escAttr(v.date)}">
      <textarea data-field="content" placeholder="Write this week's vlog...">${escHtml(v.content)}</textarea>
      <div class="ep-actions"><button type="button" data-remove="${i}">Delete this post</button></div>
    </div>
  `).join('') || '<p style="color:var(--text-faint);font-size:0.9rem;">No posts yet — add one below.</p>';

  list.querySelectorAll('.ep-row').forEach(row => {
    const index = Number(row.dataset.index);
    row.querySelectorAll('[data-field]').forEach(input => {
      input.addEventListener('input', () => {
        vlogPosts[index][input.dataset.field] = input.value;
      });
    });
  });
  list.querySelectorAll('[data-remove]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const index = Number(btn.dataset.remove);
      const post = vlogPosts[index];
      if (post.docId) await db.collection('vlogs').doc(post.docId).delete();
      vlogPosts.splice(index, 1);
      renderVlogRows();
    });
  });
}

function escAttr(str) { return (str || '').replace(/"/g, '&quot;'); }
function escHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

document.getElementById('add-ep-btn').addEventListener('click', () => {
  vlogPosts.unshift({ docId: null, title: '', date: '', content: '' });
  renderVlogRows();
});

document.getElementById('save-eps-btn').addEventListener('click', async () => {
  const msg = document.getElementById('eps-msg');
  msg.textContent = 'Saving...';
  try {
    for (const post of vlogPosts) {
      if (!post.title && !post.content) continue; // skip empty rows
      if (post.docId) {
        await db.collection('vlogs').doc(post.docId).update({
          title: post.title || '', date: post.date || '', content: post.content || ''
        });
      } else {
        const ref = await db.collection('vlogs').add({
          title: post.title || '', date: post.date || '', content: post.content || '',
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        post.docId = ref.id;
      }
    }
    msg.textContent = 'Saved.';
  } catch (err) {
    msg.textContent = 'Save failed: ' + err.message;
  }
  setTimeout(() => (msg.textContent = ''), 2500);
});

// ---- Resume uploader (Firebase Storage) ----
async function loadResumeMeta() {
  const doc = await db.collection('site').doc('resume').get();
  const el = document.getElementById('resume-current');
  const meta = doc.exists ? doc.data() : null;
  el.textContent = meta && meta.filename
    ? `Current: ${meta.filename} (uploaded ${meta.uploadedAt ? new Date(meta.uploadedAt).toLocaleDateString() : ''})`
    : 'Currently showing the default resume file bundled in /assets. Upload one below to replace it.';
}

document.getElementById('resume-upload-btn').addEventListener('click', async () => {
  const fileInput = document.getElementById('resume-file');
  const msg = document.getElementById('resume-msg');
  const file = fileInput.files[0];
  if (!file) { msg.textContent = 'Choose a file first.'; return; }
  msg.textContent = 'Uploading...';
  try {
    const ref = storage.ref('resume/' + file.name);
    await ref.put(file);
    const url = await ref.getDownloadURL();
    await db.collection('site').doc('resume').set({
      url, filename: file.name, uploadedAt: Date.now()
    });
    msg.textContent = 'Uploaded.';
    loadResumeMeta();
  } catch (err) {
    msg.textContent = 'Upload failed: ' + err.message;
  }
  setTimeout(() => (msg.textContent = ''), 2500);
});

// ---- Profile photo uploader (Firebase Storage) ----
async function loadPhotoMeta() {
  const doc = await db.collection('site').doc('profile').get();
  const img = document.getElementById('current-photo');
  const label = document.getElementById('photo-current');
  const url = doc.exists ? doc.data().photoURL : null;
  if (url) {
    img.src = url;
    img.style.display = 'block';
    label.textContent = 'Custom photo set.';
  } else {
    img.style.display = 'none';
    label.textContent = 'No custom photo set (using default).';
  }
}

document.getElementById('photo-upload-btn').addEventListener('click', async () => {
  const fileInput = document.getElementById('photo-file');
  const msg = document.getElementById('photo-msg');
  const file = fileInput.files[0];
  if (!file) { msg.textContent = 'Choose a photo first.'; return; }
  msg.textContent = 'Uploading...';
  try {
    const ref = storage.ref('profile/photo-' + Date.now() + '-' + file.name);
    await ref.put(file);
    const url = await ref.getDownloadURL();
    await db.collection('site').doc('profile').set({ photoURL: url });
    msg.textContent = 'Uploaded.';
    loadPhotoMeta();
  } catch (err) {
    msg.textContent = 'Upload failed: ' + err.message;
  }
  setTimeout(() => (msg.textContent = ''), 2500);
});
