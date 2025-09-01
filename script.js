// --- State ---
const state = {
  timer: { total: 25 * 60, remaining: 25 * 60, running: false, id: null },
  quiz: { correct: 0, total: 0 },
  achievements: [],
  settings: { examDate: null, theme: 'light' }
};

// Sample questions
const QUESTIONS = [
  { q: '¿Cuál es la capital de España?', a: ['Madrid', 'Barcelona', 'Sevilla', 'Valencia'], c: 0 },
  { q: '2 + 2 × 3 = ?', a: ['10', '8', '12', '6'], c: 1 },
  { q: '¿En qué año descubrió Colón América?', a: ['1492', '1512', '1453', '1561'], c: 0 },
  { q: 'Select the HTML tag for the largest heading:', a: ['<h6>', '<h1>', '<head>', '<title>'], c: 1 },
  { q: '¿Qué es CSS?', a: ['Base de datos', 'Hoja de estilos', 'Lenguaje servidor', 'Navegador'], c: 1 },
  { q: 'Derivada de x^2:', a: ['x', '2x', 'x^3', '2'], c: 1 }
];

// --- Elements ---
const timerEl = document.getElementById('timer');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const chips = document.querySelectorAll('.chip');
const pomoMsg = document.getElementById('pomoMsg');

const quizBtn = document.getElementById('newQuizBtn');
const quizProgress = document.getElementById('quizProgress');
const quizPercent = document.getElementById('quizPercent');
const achievementsEl = document.getElementById('achievements');

const fab = document.getElementById('fab');
const fabMenu = document.getElementById('fabMenu');

const quizModal = document.getElementById('quizModal');
const quizContainer = document.getElementById('quizContainer');
const submitQuizBtn = document.getElementById('submitQuizBtn');

const settingsModal = document.getElementById('settingsModal');
const examDateInput = document.getElementById('examDate');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const daysPill = document.getElementById('daysPill');

const themeToggle = document.getElementById('themeToggle');
const iconTheme = document.getElementById('iconTheme');

// --- Helpers ---
const two = n => String(n).padStart(2, '0');

function renderTimer() {
  const m = Math.floor(state.timer.remaining / 60);
  const s = state.timer.remaining % 60;
  timerEl.textContent = `${two(m)}:${two(s)}`;
}

function setTimerMinutes(min) {
  const sec = Math.max(1, Math.floor(min * 60));
  state.timer.total = sec;
  state.timer.remaining = sec;
  stopTimer();
  renderTimer();
  pomoMsg.textContent = '';
}

function startTimer() {
  if (state.timer.running) return;
  state.timer.running = true;
  startBtn.textContent = 'Pausar';
  state.timer.id = setInterval(() => {
    state.timer.remaining -= 1;
    renderTimer();
    if (state.timer.remaining <= 0) {
      addAchievement('✅ Pomodoro completado', true);
      stopTimer();
      setTimerMinutes(state.timer.total / 60);
      pomoMsg.textContent = '¡Bien! Pomodoro completado.';
    }
  }, 1000);
}

function stopTimer() {
  state.timer.running = false;
  startBtn.textContent = 'Comenzar';
  if (state.timer.id) clearInterval(state.timer.id);
  state.timer.id = null;
}

function resetTimer() {
  stopTimer();
  state.timer.remaining = state.timer.total;
  renderTimer();
  pomoMsg.textContent = '';
}

function addAchievement(text, good=false) {
  const li = document.createElement('li');
  li.textContent = text;
  if (good) li.classList.add('good');
  if (achievementsEl.querySelector('.empty')) achievementsEl.querySelector('.empty').remove();
  achievementsEl.prepend(li);
}

// Quiz
function openQuiz() {
  quizContainer.innerHTML = '';
  const picked = QUESTIONS.sort(() => Math.random()-0.5).slice(0, 5);
  picked.forEach((item, idx) => {
    const wrap = document.createElement('div');
    wrap.className = 'q';
    wrap.innerHTML = `<p><strong>${idx+1}.</strong> ${item.q}</p>` + 
      item.a.map((opt, i) => `
        <label class="opt">
          <input type="radio" name="q${idx}" value="${i}" required>
          <span>${opt}</span>
        </label>
      `).join('');
    quizContainer.appendChild(wrap);
  });
  quizModal.showModal();
  submitQuizBtn.onclick = () => {
    const answers = [...quizContainer.querySelectorAll('input[type="radio"]:checked')].map(input => Number(input.value));
    if (answers.length < picked.length) return; // required ensures
    let correct = 0;
    answers.forEach((ans, i) => { if (ans === picked[i].c) correct++; });
    state.quiz.correct += correct;
    state.quiz.total += picked.length;
    const pct = Math.round((state.quiz.correct / state.quiz.total) * 100);
    quizProgress.style.width = pct + '%';
    quizPercent.textContent = pct;
    if (correct >= 4) {
      addAchievement(`🏅 Quiz aprobado (${correct}/${picked.length})`, true);
      document.getElementById('passed').textContent = Number(document.getElementById('passed').textContent) + 1;
    } else {
      addAchievement(`🧠 Quiz completado (${correct}/${picked.length})`);
    }
    document.getElementById('completed').textContent = Number(document.getElementById('completed').textContent) + 1;
  };
}

// Days left
function updateDaysLeft() {
  const d = state.settings.examDate ? new Date(state.settings.examDate) : null;
  if (!d || isNaN(d)) { daysPill.textContent = '0 días'; return; }
  const today = new Date();
  today.setHours(0,0,0,0);
  d.setHours(0,0,0,0);
  const diff = Math.ceil((d - today) / (1000*60*60*24));
  daysPill.textContent = `${Math.max(0, diff)} días`;
}

// Theme
function applyTheme() {
  if (state.settings.theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

// Global progress (toy calc)
function updateGlobalProgress() {
  const completed = Number(document.getElementById('completed').textContent) || 0;
  const passed = Number(document.getElementById('passed').textContent) || 0;
  const base = Math.min(100, completed * 10 + passed * 15);
  document.getElementById('globalProgress').textContent = base;
}

// --- Event listeners ---
startBtn.addEventListener('click', () => {
  if (state.timer.running) { stopTimer(); }
  else { startTimer(); }
});
resetBtn.addEventListener('click', resetTimer);
chips.forEach(ch => ch.addEventListener('click', () => setTimerMinutes(Number(ch.dataset.min))));

quizBtn.addEventListener('click', () => { openQuiz(); });
quizModal.addEventListener('close', () => updateGlobalProgress());

fab.addEventListener('click', () => { fabMenu.classList.toggle('show'); });
fabMenu.addEventListener('click', (e) => {
  const action = e.target.dataset.action;
  if (!action) return;
  if (action === 'quiz') openQuiz();
  if (action === 'task') addAchievement('📝 Tarea creada (demo)');
  if (action === 'note') addAchievement('✍️ Nota guardada (demo)');
  fabMenu.classList.remove('show');
});

// Settings modal shortcut: click on days pill
daysPill.addEventListener('click', () => {
  if (typeof settingsModal.showModal === 'function') settingsModal.showModal();
});
saveSettingsBtn.addEventListener('click', () => {
  state.settings.examDate = examDateInput.value || null;
  localStorage.setItem('examDate', state.settings.examDate || '');
  updateDaysLeft();
});

// Theme toggle
themeToggle.addEventListener('click', () => {
  state.settings.theme = (state.settings.theme === 'light') ? 'dark' : 'light';
  localStorage.setItem('theme', state.settings.theme);
  applyTheme();
});

// Mobile menu (demo)
document.getElementById('menuBtn')?.addEventListener('click', () => {
  const nav = document.querySelector('.mainnav');
  if (getComputedStyle(nav).display === 'none') nav.style.display = 'flex';
  else nav.style.display = 'none';
});

// --- Init ---
(function init(){
  // Load settings
  state.settings.examDate = localStorage.getItem('examDate') || null;
  state.settings.theme = localStorage.getItem('theme') || 'light';
  applyTheme();
  updateDaysLeft();
  renderTimer();
})();

