// Loads admin-editable content (profile photo, resume link) onto public pages.
// Read-only — no login needed to view this data.

async function loadProfilePhoto() {
  const img = document.getElementById('profile-photo');
  if (!img) return;
  try {
    const doc = await db.collection('site').doc('profile').get();
    const url = doc.exists ? doc.data().photoURL : null;
    if (url) img.src = url;
  } catch (e) {
    console.error('Could not load profile photo:', e);
  }
}

async function loadResumeLink() {
  const link = document.getElementById('resume-link');
  if (!link) return;
  try {
    const doc = await db.collection('site').doc('resume').get();
    const url = doc.exists ? doc.data().url : null;
    if (url) {
      // Admin has uploaded a resume via the dashboard — use that instead of the bundled default.
      link.href = url;
      link.removeAttribute('download');
      link.target = '_blank';
    }
    // If no doc/url yet, the link keeps its default href (the bundled PDF in /assets).
  } catch (e) {
    console.error('Could not load resume link:', e);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadProfilePhoto();
  loadResumeLink();
});
