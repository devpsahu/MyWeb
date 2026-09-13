// Reads text vlog posts from Firestore ("vlogs" collection) and renders them.
// Public / read-only — anyone can view, only the logged-in admin can write.

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

async function renderVlogFeed() {
  const feed = document.getElementById('vlog-feed');
  try {
    const snap = await db.collection('vlogs').orderBy('createdAt', 'desc').get();
    if (snap.empty) {
      feed.innerHTML = '<p class="vlog-empty">No vlog posts yet — check back soon.</p>';
      return;
    }
    feed.innerHTML = snap.docs.map(doc => {
      const v = doc.data();
      const date = v.date || (v.createdAt && v.createdAt.toDate ? v.createdAt.toDate().toLocaleDateString() : '');
      return `
        <article class="vlog-post">
          <div class="meta">${escapeHtml(date)}</div>
          <h2>${escapeHtml(v.title)}</h2>
          <div class="body">${escapeHtml(v.content)}</div>
        </article>
      `;
    }).join('');
  } catch (e) {
    console.error('Could not load vlogs:', e);
    feed.innerHTML = '<p class="vlog-empty">Could not load vlogs right now.</p>';
  }
}

document.addEventListener('DOMContentLoaded', renderVlogFeed);
