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
});

// Welcome loader (gradient mesh intro)
document.addEventListener('DOMContentLoaded', () => {
  const loader = document.getElementById('welcome-loader');
  if (!loader) return; // page has no loader, do nothing
 
  // Show only once per browser session
  try {
    if (sessionStorage.getItem('seenWelcome')) {
      loader.remove();
      return;
    }
    sessionStorage.setItem('seenWelcome', '1');
  } catch (e) {}
 
  const MIN_TIME = 2500; // minimum display time (ms)
  const start = Date.now();
 
  function hideLoader() {
    const wait = Math.max(0, MIN_TIME - (Date.now() - start));
    setTimeout(() => {
      loader.classList.add('hide');
      setTimeout(() => loader.remove(), 900);
    }, wait);
  }
 
  if (document.readyState === 'complete') hideLoader();
  else window.addEventListener('load', hideLoader);
});
