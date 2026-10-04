const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.site-nav');

document.documentElement.classList.add('has-js');

function closeMenu({ restoreFocus = false } = {}) {
  if (!menuButton || !navigation) return;
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Open menu');
  navigation.classList.remove('is-open');
  if (restoreFocus) menuButton.focus();
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
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') closeMenu({ restoreFocus: true });
  });
}

// Remember the visitor's light/dark appearance choice on this device.
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
  if (themeColorMeta) themeColorMeta.content = isDark ? '#10191b' : '#103a40';
  if (themeButton) {
    themeButton.setAttribute('aria-pressed', String(isDark));
    themeButton.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    themeButton.title = isDark ? 'Switch to light mode' : 'Switch to dark mode';
  }
  if (themeIcon) themeIcon.textContent = isDark ? '☀' : '☾';
  if (themeLabel) themeLabel.textContent = isDark ? 'Light mode' : 'Dark mode';
  if (save) {
    try { localStorage.setItem('suly-electric-theme', isDark ? 'dark' : 'light'); }
    catch { /* The control still works when browser storage is unavailable. */ }
  }
}

applyTheme(savedTheme === 'dark' ? 'dark' : 'light');
themeButton?.addEventListener('click', () => {
  applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark', true);
});

// Search and filter the project directory.
const searchInput = document.querySelector('#project-search');
const clearButton = document.querySelector('#clear-search');
const resetButton = document.querySelector('#reset-search');
const resultCount = document.querySelector('#result-count');
const emptyState = document.querySelector('#no-results');
const projectCards = [...document.querySelectorAll('.project-card')];
const filters = [...document.querySelectorAll('.filter-button')];
let activeFilter = 'all';

function updateProjects() {
  if (!searchInput) return;
  const query = searchInput.value.trim().toLocaleLowerCase();
  let visible = 0;
  projectCards.forEach((card) => {
    const matchesType = activeFilter === 'all' || card.dataset.category === activeFilter;
    const searchableText = `${card.dataset.search} ${card.innerText}`.toLocaleLowerCase();
    const matchesQuery = !query || searchableText.includes(query);
    const show = matchesType && matchesQuery;
    card.hidden = !show;
    if (show) visible += 1;
  });
  if (resultCount) resultCount.textContent = `Showing ${visible} of ${projectCards.length} portfolio items`;
  if (emptyState) emptyState.hidden = visible > 0;
  if (clearButton) clearButton.hidden = searchInput.value.length === 0;
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
searchInput?.addEventListener('input', updateProjects);
clearButton?.addEventListener('click', () => {
  searchInput.value = '';
  searchInput.focus();
  updateProjects();
});
resetButton?.addEventListener('click', () => {
  if (searchInput) searchInput.value = '';
  activeFilter = 'all';
  filters.forEach((filter) => {
    const selected = filter.dataset.filter === 'all';
    filter.classList.toggle('is-active', selected);
    filter.setAttribute('aria-pressed', String(selected));
  });
  updateProjects();
  searchInput?.focus();
});
updateProjects();

// Full-screen viewer for each project's complete set of portfolio photos.
const lightbox = document.querySelector('#image-lightbox');
const lightboxImage = document.querySelector('#lightbox-image');
const lightboxCaption = document.querySelector('#lightbox-caption');
const lightboxStage = document.querySelector('#lightbox-stage');
const closeLightboxButton = document.querySelector('#lightbox-close');
const previousImageButton = document.querySelector('#lightbox-previous');
const nextImageButton = document.querySelector('#lightbox-next');
const lightboxCounter = document.querySelector('#lightbox-counter');
const zoomOutButton = document.querySelector('#zoom-out');
const zoomInButton = document.querySelector('#zoom-in');
const zoomFitButton = document.querySelector('#zoom-fit');
const zoomLevel = document.querySelector('#zoom-level');
let currentZoom = 1;
let activeImages = [];
let activeImageIndex = 0;
let lastImageTrigger = null;

function updateZoom(nextZoom) {
  currentZoom = Math.min(3, Math.max(1, nextZoom));
  if (!lightboxImage) return;
  lightboxImage.style.maxWidth = `${92 * currentZoom}vw`;
  lightboxImage.style.maxHeight = `${72 * currentZoom}vh`;
  if (zoomLevel) zoomLevel.textContent = `${Math.round(currentZoom * 100)}%`;
  if (zoomOutButton) zoomOutButton.disabled = currentZoom <= 1;
  if (zoomInButton) zoomInButton.disabled = currentZoom >= 3;
  lightboxStage?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
}

function galleryFor(image) {
  const project = image.closest('.project-card');
  if (project) return [...project.querySelectorAll('.project-cover img, .photo-gallery img')];
  const drawings = image.closest('.engineering-grid');
  if (drawings) return [...drawings.querySelectorAll('img')];
  return [image];
}

function showGalleryImage(index) {
  if (!activeImages.length || !lightboxImage) return;
  activeImageIndex = (index + activeImages.length) % activeImages.length;
  const image = activeImages[activeImageIndex];
  lightboxImage.src = image.currentSrc || image.src;
  lightboxImage.alt = image.alt || 'Suly Electric portfolio image';
  if (lightboxCaption) lightboxCaption.textContent = image.alt || 'Suly Electric portfolio image';
  if (lightboxCounter) lightboxCounter.textContent = `${activeImageIndex + 1} / ${activeImages.length}`;
  if (previousImageButton) previousImageButton.hidden = activeImages.length < 2;
  if (nextImageButton) nextImageButton.hidden = activeImages.length < 2;
  updateZoom(1);
}

function openImage(image, trigger) {
  if (!lightbox || !image || lightbox.open) return;
  lastImageTrigger = trigger;
  activeImages = galleryFor(image);
  showGalleryImage(activeImages.indexOf(image));
  lightbox.showModal();
  closeLightboxButton?.focus();
}

projectCards.forEach((card) => {
  const details = card.querySelector('.project-details');
  const infoButton = card.querySelector('[data-toggle-info]');
  const photoButton = card.querySelector('[data-open-cover]');
  const coverImage = card.querySelector('.project-cover img');
  if (photoButton && coverImage) photoButton.addEventListener('click', () => openImage(coverImage, photoButton));
  if (details && infoButton) {
    const syncInfoButton = () => infoButton.setAttribute('aria-expanded', String(details.open));
    infoButton.addEventListener('click', () => {
      details.open = !details.open;
      syncInfoButton();
      if (details.open) details.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
    });
    details.addEventListener('toggle', syncInfoButton);
    syncInfoButton();
  }
});

const viewerImages = document.querySelectorAll('.hero-photo img, .project-cover img, .photo-gallery img, .engineering-grid img');
viewerImages.forEach((image) => {
  const trigger = image.closest('figure');
  if (!trigger) return;
  trigger.classList.add('image-viewer-trigger');
  trigger.setAttribute('role', 'button');
  trigger.setAttribute('tabindex', '0');
  trigger.setAttribute('aria-haspopup', 'dialog');
  trigger.setAttribute('aria-label', `View larger image: ${image.alt || 'portfolio image'}`);
  const viewHint = document.createElement('span');
  viewHint.className = 'viewer-hint';
  viewHint.setAttribute('aria-hidden', 'true');
  viewHint.textContent = 'View larger';
  trigger.append(viewHint);
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

closeLightboxButton?.addEventListener('click', () => lightbox?.close());
previousImageButton?.addEventListener('click', () => showGalleryImage(activeImageIndex - 1));
nextImageButton?.addEventListener('click', () => showGalleryImage(activeImageIndex + 1));
zoomInButton?.addEventListener('click', () => updateZoom(currentZoom + 0.5));
zoomOutButton?.addEventListener('click', () => updateZoom(currentZoom - 0.5));
zoomFitButton?.addEventListener('click', () => updateZoom(1));
lightboxImage?.addEventListener('dblclick', () => updateZoom(currentZoom < 3 ? currentZoom + 0.5 : 1));
lightbox?.addEventListener('click', (event) => { if (event.target === lightbox) lightbox.close(); });
lightbox?.addEventListener('close', () => {
  lightboxImage?.removeAttribute('src');
  lightboxImage?.removeAttribute('style');
  lightboxStage?.scrollTo({ top: 0, left: 0 });
  activeImages = [];
  if (lastImageTrigger?.isConnected) lastImageTrigger.focus({ preventScroll: true });
});
let touchStartX = 0;
lightboxStage?.addEventListener('touchstart', (event) => { touchStartX = event.changedTouches[0].clientX; }, { passive: true });
lightboxStage?.addEventListener('touchend', (event) => {
  const distance = event.changedTouches[0].clientX - touchStartX;
  if (Math.abs(distance) > 55 && activeImages.length > 1) showGalleryImage(activeImageIndex + (distance < 0 ? 1 : -1));
}, { passive: true });
document.addEventListener('keydown', (event) => {
  if (!lightbox?.open) return;
  if (event.key === 'ArrowRight' && activeImages.length > 1) showGalleryImage(activeImageIndex + 1);
  if (event.key === 'ArrowLeft' && activeImages.length > 1) showGalleryImage(activeImageIndex - 1);
  if (event.key === '+' || event.key === '=') updateZoom(currentZoom + 0.5);
  if (event.key === '-') updateZoom(currentZoom - 0.5);
  if (event.key === '0') updateZoom(1);
});

// Reading progress and active section cue make the longer portfolio easier to explore.
const progressBar = document.querySelector('#scroll-progress');
function updateScrollProgress() {
  if (!progressBar) return;
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
  progressBar.style.transform = `scaleX(${progress})`;
}
window.addEventListener('scroll', updateScrollProgress, { passive: true });
window.addEventListener('resize', updateScrollProgress);
updateScrollProgress();

const sectionLinks = [...document.querySelectorAll('.site-nav a[href^="#"]')];
const observedSections = sectionLinks.map((link) => document.querySelector(link.getAttribute('href'))).filter(Boolean);
if ('IntersectionObserver' in window) {
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      sectionLinks.forEach((link) => {
        if (link.getAttribute('href') === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-22% 0px -68% 0px' });
  observedSections.forEach((section) => sectionObserver.observe(section));
}

// Gentle staggered entrance as sections enter view; reduced-motion preferences are respected.
const revealTargets = document.querySelectorAll('.hero-copy, .hero-visual, .hero-photo-note, .hero-capabilities span, .project-heading, .project-intro, .directory-tools, .project-card, .services-heading, .service-card, .process-heading, .process-list li, .engineering-heading, .engineering-grid figure, .about-lead, .about-copy, .contact-copy, .contact-action, .contact-side');
revealTargets.forEach((element, index) => {
  element.dataset.reveal = '';
  element.style.setProperty('--reveal-delay', `${(index % 5) * 65}ms`);
});
document.documentElement.classList.add('has-motion');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!reduceMotion && 'IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -28px 0px' });
  revealTargets.forEach((element) => revealObserver.observe(element));
} else {
  revealTargets.forEach((element) => element.classList.add('is-visible'));
}
