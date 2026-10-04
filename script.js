const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.site-nav');

if (menuButton && navigation) {
  const closeMenu = () => {
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open menu');
    navigation.classList.remove('is-open');
  };

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
