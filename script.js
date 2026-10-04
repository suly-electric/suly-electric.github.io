const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.site-nav');

function closeMenu() {
  if (!menuButton || !navigation) return;
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Open menu');
  navigation.classList.remove('is-open');
}

if (menuButton && navigation) {
  menuButton.addEventListener('click', () => {
    const willOpen = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(willOpen));
    menuButton.setAttribute('aria-label', willOpen ? 'Close menu' : 'Open menu');
    navigation.classList.toggle('is-open', willOpen);
  });

  navigation.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });
}

// Theme choice is remembered on this device. The site starts in light mode unless changed.
const themeButton = document.querySelector('#theme-toggle');
const themeIcon = document.querySelector('.theme-toggle-icon');
const themeLabel = document.querySelector('.theme-toggle-label');
const savedTheme = (() => {
  try { return localStorage.getItem('suly-electric-theme'); }
  catch { return null; }
})();

function applyTheme(theme, save = false) {
  const isDark = theme === 'dark';
  document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  if (themeColorMeta) themeColorMeta.content = isDark ? '#111a1c' : '#21505a';
  if (themeButton) {
    themeButton.setAttribute('aria-pressed', String(isDark));
    themeButton.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    themeButton.title = isDark ? 'Switch to light mode' : 'Switch to dark mode';
  }
  if (themeIcon) themeIcon.textContent = isDark ? '☀' : '☾';
  if (themeLabel) themeLabel.textContent = isDark ? 'Light mode' : 'Dark mode';
  if (save) {
    try { localStorage.setItem('suly-electric-theme', isDark ? 'dark' : 'light'); }
    catch { /* The theme still works if browser storage is unavailable. */ }
  }
}

applyTheme(savedTheme === 'dark' ? 'dark' : 'light');
themeButton?.addEventListener('click', () => {
  const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(nextTheme, true);
  if (window.matchMedia('(max-width: 680px)').matches) closeMenu();
});

// Searchable project directory.
const searchInput = document.querySelector('#project-search');
const clearButton = document.querySelector('#clear-search');
const resetButton = document.querySelector('#reset-search');
const count = document.querySelector('#result-count');
const emptyState = document.querySelector('#no-results');
const cards = [...document.querySelectorAll('.project-card')];
const filters = [...document.querySelectorAll('.filter-button')];
let activeFilter = 'all';

function updateProjects() {
  const query = (searchInput.value || '').trim().toLocaleLowerCase();
  let visible = 0;

  cards.forEach((card) => {
    const typeMatches = activeFilter === 'all' || card.dataset.category === activeFilter;
    const textMatches = !query || `${card.dataset.search} ${card.innerText}`.toLocaleLowerCase().includes(query);
    const show = typeMatches && textMatches;
    card.hidden = !show;
    if (show) visible += 1;
  });

  count.textContent = `Showing ${visible} of ${cards.length} portfolio items`;
  emptyState.hidden = visible !== 0;
  clearButton.hidden = searchInput.value.length === 0;
}

filters.forEach((button) => {
  button.addEventListener('click', () => {
    activeFilter = button.dataset.filter;
    filters.forEach((filter) => {
      const selected = filter === button;
      filter.classList.toggle('is-active', selected);
      filter.setAttribute('aria-pressed', String(selected));
    });
    updateProjects();
  });
});

searchInput.addEventListener('input', updateProjects);
clearButton.addEventListener('click', () => {
  searchInput.value = '';
  searchInput.focus();
  updateProjects();
});
resetButton.addEventListener('click', () => {
  searchInput.value = '';
  activeFilter = 'all';
  filters.forEach((filter) => {
    const selected = filter.dataset.filter === 'all';
    filter.classList.toggle('is-active', selected);
    filter.setAttribute('aria-pressed', String(selected));
  });
  updateProjects();
  searchInput.focus();
});

updateProjects();

// Full-screen portfolio image viewer with keyboard access and adjustable zoom.
const lightbox = document.querySelector('#image-lightbox');
const lightboxImage = document.querySelector('#lightbox-image');
const lightboxCaption = document.querySelector('#lightbox-caption');
const lightboxStage = document.querySelector('#lightbox-stage');
const closeLightboxButton = document.querySelector('#lightbox-close');
const zoomOutButton = document.querySelector('#zoom-out');
const zoomInButton = document.querySelector('#zoom-in');
const zoomFitButton = document.querySelector('#zoom-fit');
const zoomLevel = document.querySelector('#zoom-level');
let currentZoom = 1;
let lastImageTrigger = null;

function updateZoom(nextZoom) {
  currentZoom = Math.min(3, Math.max(1, nextZoom));
  lightboxImage.style.maxWidth = `${92 * currentZoom}vw`;
  lightboxImage.style.maxHeight = `${72 * currentZoom}vh`;
  zoomLevel.textContent = `${Math.round(currentZoom * 100)}%`;
  zoomOutButton.disabled = currentZoom <= 1;
  zoomInButton.disabled = currentZoom >= 3;
  if (lightboxStage) lightboxStage.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
}

function openImage(image, trigger) {
  if (!lightbox || !lightboxImage) return;
  lastImageTrigger = trigger;
  lightboxImage.src = image.currentSrc || image.src;
  lightboxImage.alt = image.alt || 'Enlarged Suly Electric portfolio image';
  lightboxCaption.textContent = image.alt || 'Suly Electric portfolio image';
  updateZoom(1);
  lightbox.showModal();
  closeLightboxButton.focus();
}

const viewerImages = document.querySelectorAll('.hero-photo img, .project-cover img, .photo-gallery img, .engineering-grid img');
viewerImages.forEach((image) => {
  const trigger = image.closest('figure');
  if (!trigger) return;
  trigger.classList.add('image-viewer-trigger');
  trigger.setAttribute('role', 'button');
  trigger.setAttribute('tabindex', '0');
  trigger.setAttribute('aria-haspopup', 'dialog');
  trigger.setAttribute('aria-label', `View larger image: ${image.alt || 'portfolio image'}`);
  trigger.addEventListener('click', (event) => {
    if (event.target.closest('a, button, summary, input')) return;
    openImage(image, trigger);
  });
  trigger.addEventListener('keydown', (event) => {
    if (event.target !== trigger || !['Enter', ' '].includes(event.key)) return;
    event.preventDefault();
    openImage(image, trigger);
  });
});

closeLightboxButton?.addEventListener('click', () => lightbox.close());
zoomInButton?.addEventListener('click', () => updateZoom(currentZoom + 0.5));
zoomOutButton?.addEventListener('click', () => updateZoom(currentZoom - 0.5));
zoomFitButton?.addEventListener('click', () => updateZoom(1));
lightboxImage?.addEventListener('dblclick', () => updateZoom(currentZoom < 3 ? currentZoom + 0.5 : 1));
lightbox?.addEventListener('click', (event) => {
  if (event.target === lightbox) lightbox.close();
});
lightbox?.addEventListener('close', () => {
  lightboxImage.removeAttribute('src');
  lightboxImage.removeAttribute('style');
  lightboxStage.scrollTo({ top: 0, left: 0 });
  if (lastImageTrigger?.isConnected) lastImageTrigger.focus({ preventScroll: true });
});
document.addEventListener('keydown', (event) => {
  if (!lightbox?.open) return;
  if (event.key === '+' || event.key === '=') updateZoom(currentZoom + 0.5);
  if (event.key === '-') updateZoom(currentZoom - 0.5);
  if (event.key === '0') updateZoom(1);
});
