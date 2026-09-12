// Mobile nav toggle
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => links.classList.toggle('open'));
    links.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => links.classList.remove('open'))
    );
  }

  initComments();
});

// --- Vlog comments ---
// Front-end only: stored in localStorage so it survives a refresh on this
// device, but it is NOT shared between visitors. Wiring this to a real,
// shared comment thread needs a backend + database.
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function renderComments(episodeId) {
  const list = document.querySelector(`[data-comment-list="${episodeId}"]`);
  if (!list) return;
  const storageKey = `pksahu-comments-${episodeId}`;
  let comments = [];
  try {
    comments = JSON.parse(localStorage.getItem(storageKey)) || [];
  } catch {
    comments = [];
  }
  if (!comments.length) {
    list.innerHTML = '<p class="comment-empty">No comments yet — leave the first one.</p>';
    return;
  }
  list.innerHTML = comments
    .slice()
    .reverse()
    .map(c => `
      <div class="comment-item">
        <div class="row">
          <b>${escapeHtml(c.name)}</b>
          <time>${new Date(c.time).toLocaleDateString()}</time>
        </div>
        <p>${escapeHtml(c.message)}</p>
      </div>
    `)
    .join('');
}

function initComments() {
  const form = document.querySelector('[data-comment-form]');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    const episodeId = form.dataset.commentForm;
    const name = form.querySelector('[name="name"]').value.trim();
    const message = form.querySelector('[name="message"]').value.trim();
    if (!name || !message) return;
    const storageKey = `pksahu-comments-${episodeId}`;
    let comments = [];
    try {
      comments = JSON.parse(localStorage.getItem(storageKey)) || [];
    } catch {
      comments = [];
    }
    comments.push({ name, message, time: Date.now() });
    localStorage.setItem(storageKey, JSON.stringify(comments));
    form.reset();
    renderComments(episodeId);
  });

  renderComments(form.dataset.commentForm);
}

// Switch the comment form + list to a different episode (called from vlogs-data.js)
function switchComments(episodeId) {
  const form = document.querySelector('[data-comment-form]');
  const list = document.querySelector('[data-comment-list]');
  if (!form || !list) return;
  form.dataset.commentForm = episodeId;
  list.dataset.commentList = episodeId;
  form.reset();
  renderComments(episodeId);
}
