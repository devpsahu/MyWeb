// Episodes are fetched from the backend (/api/vlogs) so they stay in sync
// with whatever the admin panel saves. If the backend isn't running (e.g.
// you're opening these files directly without `node server.js`), this
// falls back to the static list below so the page still works.
const FALLBACK_VLOGS = [
  {
    id: 'episode-1',
    tag: 'Building in public',
    title: 'A week of shipping a freelance project',
    desc: 'Following one client build from kickoff call to launch.',
    date: 'Sep 2026',
    duration: '12:04',
    videoId: ''
  },
  {
    id: 'episode-2',
    tag: 'Freelance life',
    title: 'What I charge and why',
    desc: 'Breaking down how I price freelance web projects in India.',
    date: 'Aug 2026',
    duration: '08:41',
    videoId: ''
  },
  {
    id: 'episode-3',
    tag: 'Bangalore',
    title: 'A day working from Bangalore',
    desc: 'Coffee, coworking, and the commute in between.',
    date: 'Aug 2026',
    duration: '06:15',
    videoId: ''
  }
];

let VLOGS = FALLBACK_VLOGS;

async function loadVlogs() {
  try {
    const res = await fetch('/api/vlogs');
    if (!res.ok) throw new Error('bad response');
    const data = await res.json();
    if (Array.isArray(data) && data.length) VLOGS = data;
  } catch {
    VLOGS = FALLBACK_VLOGS;
  }
  renderVlogGrid();
}

function renderVlogGrid() {
  const grid = document.getElementById('vlog-grid');
  if (!grid) return;
  grid.innerHTML = VLOGS.map(v => `
    <article class="vlog-card">
      <div class="vlog-thumb" data-play="${v.id}">
        <span class="play">▶</span>
      </div>
      <div class="vlog-body">
        <span class="tag">${v.tag}</span>
        <h3>${v.title}</h3>
        <p>${v.desc}</p>
        <div class="vlog-meta">
          <span>${v.date}</span>
          <span>${v.duration}</span>
        </div>
      </div>
    </article>
  `).join('');

  grid.querySelectorAll('[data-play]').forEach(el => {
    el.addEventListener('click', () => playEpisode(el.dataset.play));
  });
}

function playEpisode(id) {
  const ep = VLOGS.find(v => v.id === id);
  if (!ep) return;

  const player = document.getElementById('vlog-player');
  if (ep.videoId) {
    player.innerHTML = `<iframe src="https://www.youtube.com/embed/${ep.videoId}" title="${ep.title}" allowfullscreen loading="lazy"></iframe>`;
  } else {
    player.innerHTML = `<div style="width:100%;height:100%;display:grid;place-items:center;color:var(--text-faint);font-size:0.9rem;text-align:center;padding:0 20px;">
      "${ep.title}" — no video linked yet. Add a YouTube video ID for this episode from the admin panel.
    </div>`;
  }

  document.querySelector('#player-title h2').textContent = ep.title;
  document.querySelector('#player-title p').textContent = ep.desc;

  if (typeof switchComments === 'function') switchComments(ep.id);

  document.getElementById('player-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

document.addEventListener('DOMContentLoaded', loadVlogs);
