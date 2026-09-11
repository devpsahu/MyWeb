// ===================================================
// Footer year
// ===================================================
document.getElementById('year').textContent = new Date().getFullYear();

// ===================================================
// Mobile nav toggle
// ===================================================
const navToggle = document.getElementById('navToggle');
const navLinks = document.querySelector('.nav__links');

navToggle.addEventListener('click', () => {
  navLinks.classList.toggle('nav__links--open');
  navLinks.style.display = navLinks.classList.contains('nav__links--open') ? 'flex' : 'none';
});

// ===================================================
// Hero terminal — one orchestrated typing sequence on load
// ===================================================
const terminalBody = document.getElementById('terminalBody');

const terminalLines = [
  { prompt: '~$ ', text: 'whoami', type: 'command' },
  { text: 'Pradyumna Kumar Sahu', type: 'output' },
  { text: 'Software Developer', type: 'output' },
  { prompt: '~$ ', text: 'cat interests.txt', type: 'command' },
  { text: 'Web development, clean UI, problem solving', type: 'output' },
  { prompt: '~$ ', text: '_', type: 'cursor' }
];

function typeTerminal(lines, el) {
  let lineIndex = 0;
  let charIndex = 0;

  function typeNextChar() {
    if (lineIndex >= lines.length) return;

    const line = lines[lineIndex];

    if (line.type === 'cursor') {
      el.innerHTML += `<span class="prompt">${line.prompt}</span><span class="cursor">&nbsp;</span>`;
      return;
    }

    if (charIndex === 0) {
      const prefix = line.type === 'command' ? `<span class="prompt">${line.prompt}</span>` : '';
      el.innerHTML += prefix;
    }

    const lineWrapper = document.createElement('span');
    if (charIndex < line.text.length) {
      el.innerHTML += line.text[charIndex];
      charIndex++;
      setTimeout(typeNextChar, line.type === 'command' ? 45 : 12);
    } else {
      el.innerHTML += '\n';
      lineIndex++;
      charIndex = 0;
      setTimeout(typeNextChar, 220);
    }
  }

  typeNextChar();
}

// Only run the animation once, on load
window.addEventListener('DOMContentLoaded', () => {
  typeTerminal(terminalLines, terminalBody);
});

// ===================================================
// Contact form (front-end only — wire up to a real
// backend or a service like Formspree / EmailJS)
// ===================================================
const contactForm = document.getElementById('contactForm');
const formStatus = document.getElementById('formStatus');

contactForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('name').value.trim();

  // Placeholder behaviour — replace this with a real submit
  // (fetch() call to your backend or a form service).
  formStatus.textContent = `Thanks, ${name}! This form isn't connected to an inbox yet — see the comment in script.js.`;
  contactForm.reset();
});

// ===================================================
// Daily vlog — add entries client-side, saved to
// localStorage so they persist between visits on this device
// ===================================================
const vlogForm = document.getElementById('vlogForm');
const vlogList = document.getElementById('vlogList');

function formatDate(date) {
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function addVlogEntry(title, text, date, save = true) {
  const entry = document.createElement('article');
  entry.className = 'vlog__entry';
  entry.innerHTML = `
    <span class="vlog__date">${date}</span>
    <h3></h3>
    <p></p>
  `;
  entry.querySelector('h3').textContent = title;
  entry.querySelector('p').textContent = text;
  vlogList.prepend(entry);

  if (save) {
    const stored = JSON.parse(localStorage.getItem('vlogEntries') || '[]');
    stored.unshift({ title, text, date });
    localStorage.setItem('vlogEntries', JSON.stringify(stored));
  }
}

// Load previously saved entries on page load
window.addEventListener('DOMContentLoaded', () => {
  const stored = JSON.parse(localStorage.getItem('vlogEntries') || '[]');
  stored.forEach(entry => addVlogEntry(entry.title, entry.text, entry.date, false));
});

vlogForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const title = document.getElementById('vlogTitle').value.trim();
  const text = document.getElementById('vlogText').value.trim();
  if (!title || !text) return;

  addVlogEntry(title, text, formatDate(new Date()));
  vlogForm.reset();
});
