const state = {
  theme: 'dark',
  weeklyCalories: [1620, 1890, 2050, 1770, 2180, 1980, 1840],
};

const pages = {
  dashboard: document.getElementById('page-dashboard'),
  'add-meal': document.getElementById('page-add-meal'),
  analytics: document.getElementById('page-analytics'),
  history: document.getElementById('page-history'),
  settings: document.getElementById('page-settings'),
  login: document.getElementById('page-login'),
};

function setPage(name) {
  Object.values(pages).forEach((page) => page.classList.remove('active'));
  const target = pages[name];
  if (target) target.classList.add('active');

  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.page === name);
  });
}

function buildWeeklyChart() {
  const svg = document.getElementById('weekly-chart');
  const width = 300;
  const height = 120;
  const xStep = width / (state.weeklyCalories.length - 1);
  const max = Math.max(...state.weeklyCalories);
  const min = Math.min(...state.weeklyCalories) - 100;

  const points = state.weeklyCalories.map((value, i) => {
    const x = i * xStep;
    const y = height - ((value - min) / (max - min)) * (height - 20) - 10;
    return [x, y];
  });

  const d = points
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(' ');

  svg.innerHTML = `<path d="${d}"/>${points
    .map(([x, y]) => `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="3"/>`)
    .join('')}`;
}

function animateStatCards() {
  document.querySelectorAll('.stat-card').forEach((card) => {
    const delay = Number(card.dataset.delay || 0);
    card.style.animationDelay = `${delay}ms`;
  });
}

function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', state.theme);
  const themeBtn = document.getElementById('theme-toggle');
  themeBtn.textContent = state.theme === 'dark' ? '🌙 Dark' : '☀️ Light';
}

function initMagneticButtons() {
  document.querySelectorAll('.magnetic-btn').forEach((btn) => {
    btn.addEventListener('mousemove', (event) => {
      const rect = btn.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.06}px, ${y * 0.06}px) scale(1.03)`;
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });
}

function bind() {
  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => setPage(btn.dataset.page));
  });

  document.getElementById('login-btn').addEventListener('click', () => {
    setPage('dashboard');
  });

  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
}

bind();
buildWeeklyChart();
animateStatCards();
initMagneticButtons();
