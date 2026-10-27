const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
let reduceMotion = motionPreference.matches;
document.documentElement.classList.add('has-js');

const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.site-nav');
const siteHeader = document.querySelector('.site-header');

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
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
      closeMenu({ restoreFocus: true });
    }
  });
  document.addEventListener('click', (event) => {
    if (!navigation.contains(event.target) && !menuButton.contains(event.target)) closeMenu();
  });
  document.addEventListener('focusin', (event) => {
    if (!navigation.contains(event.target) && !menuButton.contains(event.target)) closeMenu();
  });
  window.addEventListener('resize', () => {
    if (getComputedStyle(menuButton).display === 'none') closeMenu();
  }, { passive: true });
}

// Remember the visitor's appearance choice on this device.
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
  if (themeColorMeta) themeColorMeta.content = isDark ? '#0b1817' : '#f4f3ed';
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

applyTheme(savedTheme === 'light' ? 'light' : 'dark');
themeButton?.addEventListener('click', () => {
  const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(nextTheme, true);
});

// A quiet location cue follows ordinary page scrolling; scrolling is never intercepted.
const sectionLinks = [...(navigation?.querySelectorAll('a[href^="#"]') || [])]
  .map((link) => ({ link, section: document.querySelector(link.getAttribute('href')) }))
  .filter(({ section }) => section);
let activeSectionLink = null;
let scrollFrame = null;

function updateScrollState() {
  scrollFrame = null;
  const pageTop = window.scrollY;
  const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollableHeight > 0 ? Math.min(1, Math.max(0, pageTop / scrollableHeight)) : 0;
  document.documentElement.style.setProperty('--scroll-progress', progress.toFixed(4));
  siteHeader?.classList.toggle('is-scrolled', pageTop > 24);
  const readingLine = Math.max((siteHeader?.offsetHeight || 0) + 32, window.innerHeight * 0.26);
  let nextActiveLink = null;
  sectionLinks.forEach(({ link, section }) => {
    if (section.getBoundingClientRect().top <= readingLine) nextActiveLink = link;
  });
  if (progress >= 0.995 && pageTop > 0) nextActiveLink = sectionLinks.at(-1)?.link || null;
  if (nextActiveLink !== activeSectionLink) {
    activeSectionLink?.classList.remove('is-active');
    activeSectionLink?.removeAttribute('aria-current');
    nextActiveLink?.classList.add('is-active');
    nextActiveLink?.setAttribute('aria-current', 'location');
    activeSectionLink = nextActiveLink;
  }
}

function requestScrollUpdate() {
  if (scrollFrame === null) scrollFrame = window.requestAnimationFrame(updateScrollState);
}

window.addEventListener('scroll', requestScrollUpdate, { passive: true });
window.addEventListener('resize', requestScrollUpdate, { passive: true });
window.addEventListener('load', requestScrollUpdate, { once: true });
if ('ResizeObserver' in window) {
  new ResizeObserver(requestScrollUpdate).observe(document.body);
}
requestScrollUpdate();

// A single search keeps the small project directory easy to browse.
const searchInput = document.querySelector('#project-search');
const clearButton = document.querySelector('#clear-search');
const resetButton = document.querySelector('#reset-search');
const resultCount = document.querySelector('#result-count');
const emptyState = document.querySelector('#no-results');
const projectCards = [...document.querySelectorAll('.project-card')];

function updateProjects() {
  const query = searchInput.value.trim().toLocaleLowerCase();
  let visible = 0;
  projectCards.forEach((card) => {
    const searchableText = `${card.dataset.search} ${card.textContent}`.toLocaleLowerCase();
    const show = !query || searchableText.includes(query);
    card.hidden = !show;
    if (show) visible += 1;
  });
  resultCount.textContent = `Showing ${visible} of ${projectCards.length} portfolio items`;
  emptyState.hidden = visible > 0;
  clearButton.hidden = searchInput.value.length === 0;
}

searchInput.addEventListener('input', updateProjects);
clearButton.addEventListener('click', () => {
  searchInput.value = '';
  searchInput.focus();
  updateProjects();
});
resetButton.addEventListener('click', () => {
  searchInput.value = '';
  updateProjects();
  searchInput.focus();
});
updateProjects();

// Full-screen viewer, including the other photographs for the same project.
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
let previousPageOverflow = null;

function lockPageScroll() {
  if (previousPageOverflow) return;
  previousPageOverflow = {
    root: document.documentElement.style.overflow,
    body: document.body.style.overflow,
  };
  document.documentElement.classList.add('is-viewing-image');
  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';
}

function unlockPageScroll() {
  if (!previousPageOverflow) return;
  document.documentElement.style.overflow = previousPageOverflow.root;
  document.body.style.overflow = previousPageOverflow.body;
  document.documentElement.classList.remove('is-viewing-image');
  previousPageOverflow = null;
}

function updateZoom(nextZoom, { resetScroll = true } = {}) {
  currentZoom = Math.min(3, Math.max(1, nextZoom));
  if (lightbox.open && lightboxImage.naturalWidth && lightboxImage.naturalHeight) {
    const stageStyle = getComputedStyle(lightboxStage);
    const availableWidth = Math.max(1, lightboxStage.clientWidth - parseFloat(stageStyle.paddingLeft) - parseFloat(stageStyle.paddingRight));
    const availableHeight = Math.max(1, lightboxStage.clientHeight - parseFloat(stageStyle.paddingTop) - parseFloat(stageStyle.paddingBottom));
    const fitScale = Math.min(1, availableWidth / lightboxImage.naturalWidth, availableHeight / lightboxImage.naturalHeight);
    lightboxImage.style.width = `${lightboxImage.naturalWidth * fitScale * currentZoom}px`;
    lightboxImage.style.height = `${lightboxImage.naturalHeight * fitScale * currentZoom}px`;
    lightboxImage.style.maxWidth = 'none';
    lightboxImage.style.maxHeight = 'none';
  }
  zoomLevel.textContent = `${Math.round(currentZoom * 100)}%`;
  zoomOutButton.disabled = currentZoom <= 1;
  zoomInButton.disabled = currentZoom >= 3;
  if (resetScroll) lightboxStage.scrollTo({ top: 0, left: 0, behavior: 'auto' });
}

function galleryFor(image) {
  const project = image.closest('.project-card');
  if (project) return [...project.querySelectorAll('.project-cover img, .photo-gallery img')];
  const drawings = image.closest('.engineering-grid');
  if (drawings) return [...drawings.querySelectorAll('img')];
  return [image];
}

function showGalleryImage(index) {
  if (!activeImages.length) return;
  activeImageIndex = (index + activeImages.length) % activeImages.length;
  const image = activeImages[activeImageIndex];
  lightboxImage.src = image.currentSrc || image.src;
  lightboxImage.alt = image.alt || 'Suly Electric portfolio image';
  lightboxCaption.textContent = image.alt || 'Suly Electric portfolio image';
  lightboxCounter.textContent = `${activeImageIndex + 1} / ${activeImages.length}`;
  previousImageButton.hidden = activeImages.length < 2;
  nextImageButton.hidden = activeImages.length < 2;
  updateZoom(1);
}

function openImage(image, trigger) {
  if (!lightbox || !image) return;
  lastImageTrigger = trigger;
  activeImages = galleryFor(image);
  showGalleryImage(activeImages.indexOf(image));
  lightbox.showModal();
  lockPageScroll();
  updateZoom(1);
  closeLightboxButton.focus();
}

// Each project-details button controls the matching disclosure panel.
projectCards.forEach((card) => {
  const details = card.querySelector('.project-details');
  const infoButton = card.querySelector('[data-toggle-info]');
  if (!details || !infoButton) return;
  infoButton.setAttribute('aria-controls', details.id);
  const syncInfoButton = () => {
    infoButton.setAttribute('aria-expanded', String(details.open));
    const icon = infoButton.querySelector('span');
    if (icon) icon.textContent = details.open ? '−' : '+';
  };
  infoButton.addEventListener('click', () => {
    details.open = !details.open;
    syncInfoButton();
    if (details.open) details.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });
  });
  details.addEventListener('toggle', syncInfoButton);
  syncInfoButton();
});

// Photos and drawings open from a click, tap, or keyboard activation.
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

closeLightboxButton.addEventListener('click', () => lightbox.close());
previousImageButton.addEventListener('click', () => showGalleryImage(activeImageIndex - 1));
nextImageButton.addEventListener('click', () => showGalleryImage(activeImageIndex + 1));
zoomInButton.addEventListener('click', () => updateZoom(currentZoom + 0.5));
zoomOutButton.addEventListener('click', () => updateZoom(currentZoom - 0.5));
zoomFitButton.addEventListener('click', () => updateZoom(1));
lightboxImage.addEventListener('dblclick', () => updateZoom(currentZoom < 3 ? currentZoom + 0.5 : 1));
lightboxImage.addEventListener('load', () => {
  if (lightbox.open) updateZoom(currentZoom);
});
window.addEventListener('resize', () => {
  if (lightbox.open) updateZoom(currentZoom, { resetScroll: false });
}, { passive: true });
lightbox.addEventListener('click', (event) => {
  if (event.target === lightbox) lightbox.close();
});
lightbox.addEventListener('close', () => {
  unlockPageScroll();
  lightboxImage.removeAttribute('src');
  lightboxImage.removeAttribute('style');
  lightboxStage.scrollTo({ top: 0, left: 0 });
  activeImages = [];
  if (lastImageTrigger?.isConnected) lastImageTrigger.focus({ preventScroll: true });
});
let touchStartX = 0;
let touchStartY = 0;
lightboxStage.addEventListener('touchstart', (event) => {
  touchStartX = event.changedTouches[0].clientX;
  touchStartY = event.changedTouches[0].clientY;
}, { passive: true });
lightboxStage.addEventListener('touchend', (event) => {
  const distance = event.changedTouches[0].clientX - touchStartX;
  const verticalDistance = event.changedTouches[0].clientY - touchStartY;
  if (currentZoom === 1 && Math.abs(distance) > 55 && Math.abs(distance) > Math.abs(verticalDistance) * 1.5 && activeImages.length > 1) {
    showGalleryImage(activeImageIndex + (distance < 0 ? 1 : -1));
  }
}, { passive: true });
document.addEventListener('keydown', (event) => {
  if (!lightbox.open || event.ctrlKey || event.metaKey || event.altKey || event.defaultPrevented) return;
  let handled = true;
  if (event.key === 'ArrowRight' && activeImages.length > 1) showGalleryImage(activeImageIndex + 1);
  else if (event.key === 'ArrowLeft' && activeImages.length > 1) showGalleryImage(activeImageIndex - 1);
  else if (event.key === '+' || event.key === '=') updateZoom(currentZoom + 0.5);
  else if (event.key === '-') updateZoom(currentZoom - 0.5);
  else if (event.key === '0') updateZoom(1);
  else handled = false;
  if (handled) event.preventDefault();
});

// Gentle entrance on scroll. Content stays visible with reduced motion or without JavaScript.
const revealTargets = document.querySelectorAll('.hero-copy, .hero-photo, .section-header, .service-card, .project-card, .process-list li, .engineering-grid figure, .about-layout > div, .contact-card');
revealTargets.forEach((element, index) => {
  element.dataset.reveal = '';
  element.style.setProperty('--reveal-delay', `${(index % 3) * 45}ms`);
});
let revealObserver = null;

function configureMotion() {
  reduceMotion = motionPreference.matches;
  const canAnimate = !reduceMotion && 'IntersectionObserver' in window;
  document.documentElement.classList.toggle('has-motion', canAnimate);
  revealObserver?.disconnect();
  if (!canAnimate) {
    revealTargets.forEach((element) => element.classList.add('is-visible'));
    return;
  }
  revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -24px 0px' });
  revealTargets.forEach((element) => {
    if (!element.classList.contains('is-visible')) revealObserver.observe(element);
  });
}

motionPreference.addEventListener('change', configureMotion);
configureMotion();
