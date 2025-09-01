/* ======= App State & Persistence (localStorage) ======= */
const APP_KEY_USERS = 'app_users';
const APP_KEY_SESSION = 'app_session';
const progressKey = u => `app_progress_${u}`;
const calKey = u => `app_calendar_${u}`;

const ROLES = { VIEW: 'viewer', STUDENT: 'student', ADMIN: 'admin' };

/* ---- Seed admin ---- */
function ensureAdminUser(){
  const users = JSON.parse(localStorage.getItem(APP_KEY_USERS) || '[]');
  if (!users.find(u => u.username === 'admin')) {
    users.push({ username: 'admin', password: 'admin1907', role: ROLES.ADMIN, createdAt: Date.now() });
    localStorage.setItem(APP_KEY_USERS, JSON.stringify(users));
  }
}
ensureAdminUser();

/* ---- Users & session ---- */
const getUsers = () => JSON.parse(localStorage.getItem(APP_KEY_USERS) || '[]');
const setUsers = (arr) => localStorage.setItem(APP_KEY_USERS, JSON.stringify(arr));
const getSession = () => { try { return JSON.parse(localStorage.getItem(APP_KEY_SESSION) || 'null'); } catch(e){ return null; } };
const setSession = (username) => localStorage.setItem(APP_KEY_SESSION, JSON.stringify({ username }));
const clearSession = () => localStorage.removeItem(APP_KEY_SESSION);

/* ---- Progress ---- */
function getProgress(username){
  const def = {
    studyTimeSec: 0,
    streak: { current: 0, lastStudyDate: null, daysVisited: [] },
    achievements: [],
    subjects: {
      njb: {
        name: 'Nociones Jurídicas Básicas',
        topics: {
          t1: { read: false, quizScore: 0, essayScore: 0, passed: false, highlights: [] },
          t2: { read: false, quizScore: 0, essayScore: 0, passed: false, highlights: [] },
          t3: { read: false, quizScore: 0, essayScore: 0, passed: false, highlights: [] },
        }
      }
    }
  };
  return JSON.parse(localStorage.getItem(progressKey(username)) || JSON.stringify(def));
}
function setProgress(username, data){ localStorage.setItem(progressKey(username), JSON.stringify(data)); }

/* ---- Auth Guards ---- */
function requireAuth(){
  const s = getSession();
  if (!s || !s.username) { window.location.href = 'login.html'; return null; }
  return s.username;
}
function currentUserRole(){
  const s = getSession(); if (!s) return null;
  const u = getUsers().find(x => x.username === s.username);
  return u?.role || null;
}
function logout(){ clearSession(); window.location.href = 'login.html'; }

/* ---- Data model ---- */
const DATA = {
  subjects: {
    njb: {
      name: 'Nociones Jurídicas Básicas',
      totalTopics: 3,
      topics: [
        {
          id: 't1',
          title: 'Tema 1: Introducción al Derecho',
          content: `El Derecho es el conjunto de normas que regulan la convivencia social...`,
          keyPoints: ['Normas y sanción', 'Derecho objetivo y subjetivo', 'Finalidad social'],
          concepts: ['Norma', 'Sanción', 'Derecho objetivo', 'Derecho subjetivo'],
          quiz: [
            { q: 'El Derecho se compone de...', a: ['Normas', 'Opiniones', 'Costumbres sin sanción', 'Dogmas'], c: 0 },
            { q: 'El derecho subjetivo es...', a: ['Poder de exigir', 'Conjunto de normas', 'Hecho social', 'Moral individual'], c: 0 },
          ],
          essayPrompt: 'Explica la diferencia entre Derecho objetivo y derecho subjetivo con ejemplos.'
        },
        {
          id: 't2',
          title: 'Tema 2: Fuentes del Derecho',
          content: `Las fuentes del Derecho son ley, costumbre y principios generales...`,
          keyPoints: ['Ley', 'Costumbre', 'Principios generales'],
          concepts: ['Jerarquía normativa', 'Costumbre', 'Jurisprudencia'],
          quiz: [
            { q: 'No es fuente del Derecho:', a: ['Contrato', 'Ley', 'Costumbre', 'Principios generales'], c: 0 },
            { q: 'La jurisprudencia...', a: ['Integra y unifica', 'Es ley', 'No tiene función', 'Es costumbre'], c: 0 },
          ],
          essayPrompt: 'Describe la jerarquía normativa y su importancia práctica.'
        },
        {
          id: 't3',
          title: 'Tema 3: Organización del Poder Judicial',
          content: `El Poder Judicial se organiza en juzgados y tribunales...`,
          keyPoints: ['Juzgados', 'Tribunales', 'Competencia'],
          concepts: ['Juez', 'Jurisdicción', 'Competencia'],
          quiz: [
            { q: 'La jurisdicción es...', a: ['Poder de juzgar', 'Otro poder del Estado', 'Tipo de contrato', 'Ley concreta'], c: 0 },
            { q: 'Los tribunales...', a: ['Resuelven conflictos', 'Promulgan leyes', 'Gobiernan', 'Legislan'], c: 0 },
          ],
          essayPrompt: 'Explica la diferencia entre jurisdicción y competencia con un ejemplo.'
        }
      ]
    }
  }
};

/* ---- Helpers ---- */
const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));
const fmtTime = (sec) => { const h=Math.floor(sec/3600), m=Math.floor((sec%3600)/60), s=sec%60; return `${h? h+'h ':''}${m}m ${s}s`; };

/* ---- Study tracking ---- */
let studyTimer = null, lastActivity = Date.now();
function startStudyTracking(username){
  const prog = getProgress(username);
  function tick(){
    const now = Date.now(), idle = now - lastActivity;
    if (idle < 60_000) {
      prog.studyTimeSec += 1;
      const day = new Date().toISOString().slice(0,10);
      const todaySpent = (prog._dayCounter?.day === day ? prog._dayCounter.sec : 0) + 1;
      prog._dayCounter = { day, sec: todaySpent };
      if (todaySpent === 60) {
        const prev = prog.streak.lastStudyDate;
        if (!prev) { prog.streak.current = 1; }
        else {
          const dprev = new Date(prev), dcur = new Date(day);
          const diff = (dcur - dprev) / (1000*60*60*24);
          if (diff === 1) prog.streak.current += 1;
          else if (diff > 1) prog.streak.current = 1;
        }
        prog.streak.lastStudyDate = day;
        if (!prog.streak.daysVisited.includes(day)) prog.streak.daysVisited.push(day);
        if (prog.streak.current === 1) prog.achievements.unshift({ t: '🔥 ¡Comienzas racha de estudio!', d: Date.now() });
        if (prog.streak.current === 3) prog.achievements.unshift({ t: '💪 Racha 3 días', d: Date.now() });
        if (prog.streak.current === 7) prog.achievements.unshift({ t: '🏆 Racha 7 días', d: Date.now() });
      }
    }
    setProgress(username, prog);
  }
  studyTimer = setInterval(tick, 1000);
  ['mousemove','keydown','click','scroll','touchstart'].forEach(e => document.addEventListener(e, () => { lastActivity = Date.now(); }, {passive:true}));
  window.addEventListener('beforeunload', () => clearInterval(studyTimer));
}

/* ---- Subject utilities ---- */
function subjectProgress(username, key){
  const prog = getProgress(username);
  const subj = prog.subjects[key];
  const total = Object.keys(subj.topics).length;
  let passed = 0;
  Object.values(subj.topics).forEach(t => { if (t.passed) passed++; });
  const percent = Math.round((passed / total) * 100);
  return { total, passed, percent };
}
function globalProgress(username){
  const subs = Object.keys(getProgress(username).subjects);
  const arr = subs.map(k => subjectProgress(username, k).percent);
  return Math.round(arr.reduce((a,b)=>a+b,0) / arr.length || 0);
}
function completedTopics(username){
  const p = getProgress(username);
  let c = 0;
  Object.values(p.subjects).forEach(s => Object.values(s.topics).forEach(t => { if (t.read) c++; }));
  return c;
}
function topicsPassed(username){
  const p = getProgress(username);
  let c = 0;
  Object.values(p.subjects).forEach(s => Object.values(s.topics).forEach(t => { if (t.passed) c++; }));
  return c;
}
function totalTopics(){
  let total = 0;
  Object.values(DATA.subjects).forEach(s => total += s.totalTopics);
  return total;
}
function isTopicUnlocked(username, key, topicId){
  if (topicId === 't1') return true;
  const p = getProgress(username);
  const topics = Object.keys(p.subjects[key].topics);
  const index = topics.indexOf(topicId);
  if (index <= 0) return true;
  const prevId = topics[index - 1];
  return p.subjects[key].topics[prevId].passed;
}

/* ---- Dashboard ---- */
function renderDashboard(){
  const user = requireAuth(); if (!user) return;
  const p = getProgress(user);

  $('#globalProgress').textContent = globalProgress(user);
  $('#completed').textContent = completedTopics(user);
  $('#passed').textContent = topicsPassed(user);
  const total = totalTopics();
  // unlocked count
  let unlocked = 0;
  Object.keys(p.subjects).forEach(k => {
    const ts = Object.keys(p.subjects[k].topics);
    ts.forEach((tid, idx) => { if (idx === 0 || p.subjects[k].topics[ts[idx-1]].passed) unlocked++; });
  });
  $('#unlocked').textContent = `${unlocked}/${total}`;

  $('#studyTime').textContent = fmtTime(p.studyTimeSec || 0);
  $('#streakDays').textContent = p.streak.current || 0;

  const subjWrap = $('#subjectProgress'); subjWrap.innerHTML = '';
  Object.entries(DATA.subjects).forEach(([key, subj]) => {
    const {percent, passed, total} = subjectProgress(user, key);
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `<h3>${subj.name}</h3>
      <div class="progress-bar"><div class="progress" style="width:${percent}%"></div></div>
      <div class="muted">${passed}/${total} temas superados</div>
      <div class="actions"><a class="btn" href="estudiar.html?sub=${key}">Ir a estudiar</a></div>`;
    subjWrap.appendChild(card);
  });

  const ach = $('#achievements'); ach.innerHTML = '';
  const list = p.achievements.slice(0,5);
  if (!list.length) { ach.innerHTML = '<li class="empty">Sin logros aún.</li>'; }
  else list.forEach(i => { const li = document.createElement('li'); li.textContent = i.t; if (/Racha|Comienzas/.test(i.t)) li.classList.add('good'); ach.appendChild(li); });

  // Quiz rápido
  $('#newQuizBtn').onclick = () => {
    const pool = [];
    Object.entries(DATA.subjects).forEach(([key, subj]) => {
      subj.topics.forEach(t => {
        const st = p.subjects[key].topics[t.id];
        if (st?.read || st?.passed) pool.push(...t.quiz.map(q => ({...q, topic: t.title})));
      });
    });
    if (!pool.length) {
      alert('¡Ánimo! Aún no has empezado a estudiar.\nCompleta los temas del apartado "Estudiar" para usar el Quiz Rápido.');
      return;
    }
    const questions = pool.sort(()=>Math.random()-0.5).slice(0,5);
    const dlg = document.createElement('dialog'); dlg.className='modal';
    const form = document.createElement('form'); form.method='dialog'; form.className='modal__content';
    form.innerHTML = '<h3>Quiz Rápido</h3><div id="qz"></div><div class="modal__actions"><button class="btn ghost" value="cancel">Cancelar</button><button class="btn" value="ok">Enviar</button></div>';
    dlg.appendChild(form); document.body.appendChild(dlg);
    const qz = form.querySelector('#qz');
    questions.forEach((item, idx) => {
      const wrap = document.createElement('div');
      wrap.innerHTML = `<p><strong>${idx+1}.</strong> ${item.q} <em class="muted">(${item.topic})</em></p>` + 
        item.a.map((opt,i)=>`<label class="opt"><input type="radio" name="q${idx}" value="${i}" required> <span>${opt}</span></label>`).join('');
      qz.appendChild(wrap);
    });
    dlg.showModal();
    form.addEventListener('close', ()=> dlg.remove());
    form.addEventListener('submit', ()=>{
      const answers = [...qz.querySelectorAll('input[type="radio"]:checked')].map(i=>Number(i.value));
      let correct=0; answers.forEach((ans,i)=>{ if (ans===questions[i].c) correct++; });
      const pct = Math.round( (correct/questions.length) * 100 );
      alert(`Has acertado ${correct}/${questions.length} (${pct}%). ¡Sigue así!`);
      const pr = getProgress(user);
      pr.achievements.unshift({ t: `🧠 Quiz rápido (${correct}/${questions.length})`, d: Date.now() });
      setProgress(user, pr);
      renderDashboard();
    });
  };
}

/* ---- Estudiar ---- */
function renderEstudiar(){
  const user = requireAuth(); if (!user) return;
  startStudyTracking(user);
  const url = new URL(location.href);
  const subKey = url.searchParams.get('sub') || 'njb';
  const subj = DATA.subjects[subKey];
  $('#subjectTitle').textContent = subj.name;

  const p = getProgress(user);
  const list = $('#topicList'); list.innerHTML = '';
  subj.topics.forEach((t, idx) => {
    const unlocked = isTopicUnlocked(user, subKey, t.id);
    const li = document.createElement('div');
    li.className = 'topic' + (unlocked ? '' : ' locked');
    li.innerHTML = `<div class="left">
        <span class="pill">${idx+1}</span>
        <strong>${t.title}</strong>
      </div>
      <div class="right">
        ${unlocked ? `<a class="btn" href="tema.html?sub=${subKey}&topic=${t.id}">Estudiar tema</a>` 
                   : `<span class="reason">🔒 Bloqueado: lee y aprueba el tema anterior (media ≥ 6). ¡Ánimo!</span>`}
      </div>`;
    list.appendChild(li);
  });
}

/* ---- Topic ---- */
function renderTopic(){
  const user = requireAuth(); if (!user) return;
  startStudyTracking(user);
  const params = new URL(location.href).searchParams;
  const subKey = params.get('sub') || 'njb';
  const topicId = params.get('topic') || 't1';
  const subj = DATA.subjects[subKey];
  const topic = subj.topics.find(t => t.id===topicId);
  if (!topic) { location.href = `estudiar.html?sub=${subKey}`; return; }
  if (!isTopicUnlocked(user, subKey, topicId)){
    alert('Tema bloqueado: necesitas aprobar el tema anterior con media ≥ 6.');
    location.href = `estudiar.html?sub=${subKey}`; return;
  }

  const p = getProgress(user);
  const tprog = p.subjects[subKey].topics[topicId];

  $('#topicTitle').textContent = topic.title;
  $('#content').innerHTML = `<p>${topic.content}</p>`;

  const kp = $('#keypoints'); kp.innerHTML = topic.keyPoints.map(x => `<li>${x}</li>`).join('');
  const cp = $('#concepts'); cp.innerHTML = topic.concepts.map(x => `<li>${x}</li>`).join('');

  if (tprog.highlights?.length){
    tprog.highlights.forEach(h => {
      const span = document.createElement('mark'); span.textContent = h.text;
      $('#content').appendChild(span); $('#content').appendChild(document.createTextNode(' '));
    });
  }

  $('#hlBtn').addEventListener('click', () => {
    const sel = window.getSelection();
    if (!sel || !sel.toString().trim()) return;
    const range = sel.getRangeAt(0);
    const mark = document.createElement('mark');
    mark.textContent = sel.toString();
    range.deleteContents();
    range.insertNode(mark);
    tprog.highlights = tprog.highlights || [];
    tprog.highlights.push({ text: mark.textContent });
    setProgress(user, p);
  });

  $('#readBtn').addEventListener('click', () => {
    tprog.read = true; setProgress(user, p);
    alert('Tema marcado como leído.');
  });

  const qWrap = $('#topicQuiz');
  qWrap.innerHTML = topic.quiz.map((q,idx)=>`
    <div class="q"><p><strong>${idx+1}.</strong> ${q.q}</p>
      ${q.a.map((opt,i)=>`<label><input type="radio" name="q${idx}" value="${i}" required> ${opt}</label>`).join('<br>')}
    </div>
  `).join('');
  $('#topicQuizSubmit').addEventListener('click', () => {
    const answers = topic.quiz.map((_,i)=>{
      const el = document.querySelector(`input[name="q${i}"]:checked`);
      return el ? Number(el.value) : null;
    });
    if (answers.some(a => a===null)) { alert('Responde todas las preguntas.'); return; }
    let correct = 0; answers.forEach((a,i)=>{ if (a===topic.quiz[i].c) correct++; });
    const score = Math.round((correct/topic.quiz.length)*10);
    tprog.quizScore = score; setProgress(user, p);
    $('#topicQuizScore').textContent = score;
    alert(`Test corregido: ${correct}/${topic.quiz.length} → ${score}/10`);
  });

  $('#essayPrompt').textContent = topic.essayPrompt;
  $('#essaySubmit').addEventListener('click', () => {
    const text = $('#essayText').value.trim();
    if (text.length < 40) { alert('Escribe al menos 40 caracteres.'); return; }
    const total = topic.concepts.length;
    let hits = 0;
    topic.concepts.forEach(k => { if (text.toLowerCase().includes(k.toLowerCase())) hits++; });
    const coverage = hits/Math.max(1,total);
    const score = Math.round( (0.5 + coverage*0.5) * 10 );
    tprog.essayScore = score; setProgress(user, p);
    $('#essayScore').textContent = score;
    alert(`Ensayo corregido automáticamente → ${score}/10 (cobertura de conceptos: ${hits}/${total})`);
  });

  $('#evaluateBtn').addEventListener('click', () => {
    const media = (Number(tprog.quizScore||0) + Number(tprog.essayScore||0)) / 2;
    if (tprog.read && media >= 6){
      tprog.passed = true;
      setProgress(user, p);
      alert('¡Tema superado! Se ha desbloqueado el siguiente tema.');
    } else {
      alert('Para aprobar: marcar leído + media ≥ 6 entre test y desarrollo.');
    }
  });
}

/* ---- Progreso ---- */
function renderProgreso(){
  const user = requireAuth(); if (!user) return;
  const p = getProgress(user);
  $('#gen_completed').textContent = completedTopics(user);
  $('#gen_passed').textContent = topicsPassed(user);
  $('#gen_total').textContent = totalTopics();
  $('#gen_progress').textContent = globalProgress(user) + '%';

  const tabs = $$('.tab'); const panels = $$('.tabpanels > div');
  function activate(i){ tabs.forEach((t,k)=>t.classList.toggle('active', k===i)); panels.forEach((p,k)=>p.classList.toggle('active', k===i)); }
  tabs.forEach((t,i)=>t.addEventListener('click', ()=>activate(i))); activate(0);

  const m = $('#panel_materias'); m.innerHTML = '';
  Object.entries(DATA.subjects).forEach(([key, subj]) => {
    const { percent, passed, total } = subjectProgress(user, key);
    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = `<h3>${subj.name}</h3>
      <div class="progress-bar"><div class="progress" style="width:${percent}%"></div></div>
      <div class="muted">${passed}/${total} superados</div>
      <div class="actions"><a class="btn" href="estudiar.html?sub=${key}">Estudiar</a></div>`;
    m.appendChild(div);
  });

  const l = $('#panel_logros'); l.innerHTML = '';
  if (!p.achievements.length) { l.innerHTML = '<p class="muted">Aún no hay logros. Empieza a estudiar hoy mismo 💪</p>'; }
  else {
    const ul = document.createElement('ul'); ul.className='achievements';
    p.achievements.forEach(a => { const li = document.createElement('li'); li.textContent = a.t; ul.appendChild(li); });
    l.appendChild(ul);
  }

  const s = $('#panel_stats'); s.innerHTML = `
    <div class="card">
      <h3>Tiempo total de estudio</h3>
      <p class="muted">Contamos el tiempo activo en Estudiar/Temas</p>
      <p class="score" id="stat_time">${fmtTime(p.studyTimeSec || 0)}</p>
    </div>
    <div class="card">
      <h3>Racha actual</h3>
      <p class="muted">Días seguidos con estudio activo</p>
      <p class="score">${p.streak.current || 0} días</p>
    </div>
  `;
}

/* ---- Calendario ---- */
function getCal(username){ return JSON.parse(localStorage.getItem(calKey(username)) || '[]'); }
function setCal(username, arr){ localStorage.setItem(calKey(username), JSON.stringify(arr)); }

function renderCalendario(){
  const user = requireAuth(); if (!user) return;
  const now = new Date(); now.setDate(1);
  const month = now.getMonth(), year = now.getFullYear();
  $('#monthTitle').textContent = now.toLocaleString('es-ES', { month: 'long', year:'numeric' });

  const firstDay = new Date(year, month, 1).getDay() || 7;
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const cal = $('#calendar'); cal.innerHTML = '';
  const events = getCal(user);

  // headers
  ['L','M','X','J','V','S','D'].forEach(d=>{
    const h = document.createElement('div'); h.className='cell'; h.style.background='transparent'; h.style.border='none'; h.innerHTML=`<strong>${d}</strong>`; cal.appendChild(h);
  });

  for (let i=1;i<firstDay;i++){ const empty = document.createElement('div'); empty.className='cell'; empty.style.visibility='hidden'; cal.appendChild(empty); }
  for (let d=1; d<=daysInMonth; d++){
    const cell = document.createElement('div'); cell.className='cell';
    cell.innerHTML = `<div class="d">${d}</div>`;
    const f = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    events.filter(e => e.date===f).forEach(e => {
      const ev = document.createElement('div'); ev.className='ev'; ev.textContent = e.title; cell.appendChild(ev);
    });
    cell.addEventListener('click', () => {
      const title = prompt('Añadir evento/estudio para ' + f);
      if (!title) return;
      events.push({ date:f, title });
      setCal(user, events);
      renderCalendario();
    });
    cal.appendChild(cell);
  }
}

/* ---- Topbar ---- */
function initTopbar(){
  const s = getSession();
  const user = s?.username;
  if (!user) return;
  const role = currentUserRole();
  const elUser = document.querySelector('.username'); if (elUser) elUser.textContent = user;
  const adminLink = document.getElementById('adminLink'); if (adminLink) adminLink.style.display = (role==='admin')?'inline-block':'none';
  document.getElementById('logoutBtn')?.addEventListener('click', logout);
}

/* ---- Auth pages ---- */
function renderLogin(){
  const s = getSession(); if (s) { location.href = 'index.html'; return; }

  $('#toRegister').addEventListener('click', ()=>{ $('#loginBox').style.display='none'; $('#registerBox').style.display='block'; });
  $('#toLogin').addEventListener('click', ()=>{ $('#registerBox').style.display='none'; $('#loginBox').style.display='block'; });

  $('#loginForm').addEventListener('submit', e => {
    e.preventDefault();
    const u = $('#loginUser').value.trim(); const p = $('#loginPass').value.trim();
    const users = getUsers();
    const found = users.find(x => x.username === u && x.password === p);
    if (!found) { alert('Usuario/contraseña incorrectos.'); return; }
    setSession(u);
    location.href = 'index.html';
  });

  $('#registerForm').addEventListener('submit', e => {
    e.preventDefault();
    const username = $('#regUser').value.trim();
    const pass = $('#regPass').value.trim();
    const code = $('#regCode').value.trim();
    let role = ROLES.STUDENT;
    if (code !== '190700' && !(username === 'ismaelvega' && code === '2000')) { alert('Código de invitación inválido.'); return; }
    if (username === 'ismaelvega' && code === '2000') role = ROLES.ADMIN;
    const users = getUsers();
    if (users.find(u => u.username === username)) { alert('Nombre de usuario ya existe.'); return; }
    users.push({ username, password: pass, role, createdAt: Date.now() });
    setUsers(users);
    setSession(username);
    location.href = 'index.html';
  });
}

/* ---- Admin ---- */
function renderAdmin(){
  const user = requireAuth(); if (!user) return;
  if (currentUserRole() !== ROLES.ADMIN){ alert('Necesitas permisos de administrador.'); window.location.href='index.html'; return; }
  const tbody = $('#userRows');
  function refresh(){
    tbody.innerHTML = '';
    getUsers().forEach((u,i)=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${u.username}</td>
        <td>${u.role}</td>
        <td>${new Date(u.createdAt).toLocaleString()}</td>
        <td>
          <button data-i="${i}" data-act="role" class="btn ghost">Cambiar rol</button>
          <button data-i="${i}" data-act="pass" class="btn ghost">Reset pass</button>
          <button data-i="${i}" data-act="del" class="btn ghost">Borrar</button>
        </td>`;
      tbody.appendChild(tr);
    });
  }
  refresh();

  $('#addUserForm').addEventListener('submit', e => {
    e.preventDefault();
    const username = $('#newUser').value.trim();
    const pass = $('#newPass').value.trim();
    const role = $('#newRole').value;
    if (!username || !pass) return;
    const users = getUsers();
    if (users.find(u => u.username===username)) { alert('Ya existe.'); return; }
    users.push({ username, password: pass, role, createdAt: Date.now() });
    setUsers(users); refresh();
  });

  tbody.addEventListener('click', e => {
    const btn = e.target.closest('button'); if (!btn) return;
    const i = Number(btn.dataset.i);
    const users = getUsers();
    if (btn.dataset.act === 'role'){
      const nr = prompt('Nuevo rol: viewer | student | admin', users[i].role);
      if (!nr || !['viewer','student','admin'].includes(nr)) return;
      users[i].role = nr; setUsers(users); refresh();
    }
    if (btn.dataset.act === 'pass'){
      const np = prompt('Nueva contraseña:');
      if (!np) return; users[i].password = np; setUsers(users);
    }
    if (btn.dataset.act === 'del'){
      if (!confirm('¿Borrar usuario?')) return;
      const name = users[i].username;
      users.splice(i,1); setUsers(users);
      localStorage.removeItem(progressKey(name));
      if (getSession()?.username === name) clearSession();
      refresh();
    }
  });
}

/* ---- Entry ---- */
document.addEventListener('DOMContentLoaded', () => {
  initTopbar();
  const page = document.body.dataset.page;
  if (page === 'dashboard') renderDashboard();
  if (page === 'estudiar') renderEstudiar();
  if (page === 'topic') renderTopic();
  if (page === 'progreso') renderProgreso();
  if (page === 'login') renderLogin();
  if (page === 'admin') renderAdmin();
  if (page === 'calendar') renderCalendario();
});
