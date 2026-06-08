// ============================================================
// TRUNK — APP.JS  (aluno + professor, totalmente funcional)
// ============================================================

// ---------- estado global ----------
let currentUser      = null;
let currentFilter    = 'all';
let currentSort      = 'date';
let profFilter       = 'all';
let profSort         = 'date';
let profSearchName   = '';
let profSearchTurma  = '';
let profSearchAno    = '';
let selectedFile     = null;
let selectedFileData = null;
let currentProjectId = null;

// ============================================================
// 1. UTILITÁRIOS
// ============================================================

function getUsers()    { return JSON.parse(localStorage.getItem('usuarios'))  || []; }
function getProjects() { return JSON.parse(localStorage.getItem('projetos'))  || []; }
function getFeedbacks(){ return JSON.parse(localStorage.getItem('feedbacks')) || []; }

function saveUsers(u)    { localStorage.setItem('usuarios',  JSON.stringify(u)); }
function saveProjects(p) { localStorage.setItem('projetos',  JSON.stringify(p)); }
function saveFeedbacks(f){ localStorage.setItem('feedbacks', JSON.stringify(f)); }

function showToast(msg, type = 'info') {
  const c = document.getElementById('toast-container');
  if (!c) return;
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<div class="toast-dot"></div><span>${msg}</span>`;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const page = document.getElementById(pageId);
  if (page) page.classList.add('active');
}

function togglePassword(inputId) {
  const inp = document.getElementById(inputId);
  if (!inp) return;
  inp.type = inp.type === 'password' ? 'text' : 'password';
}

function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('hidden');
}
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('hidden');
}
function closeModalOutside(e, id) {
  if (e.target.id === id) closeModal(id);
}

// ============================================================
// 2. FORÇA DE SENHA
// ============================================================
function checkPasswordStrength(val) {
  const fill  = document.getElementById('pw-fill');
  const label = document.getElementById('pw-label');
  if (!fill || !label) return;
  let score = 0;
  if (val.length >= 8)           score++;
  if (/[A-Z]/.test(val))         score++;
  if (/[0-9]/.test(val))         score++;
  if (/[^A-Za-z0-9]/.test(val))  score++;
  const levels = [
    { w: '0%',   c: 'transparent', l: '' },
    { w: '25%',  c: '#e74c3c',     l: 'Fraca' },
    { w: '50%',  c: '#e67e22',     l: 'Razoável' },
    { w: '75%',  c: '#f39c12',     l: 'Boa' },
    { w: '100%', c: '#27ae60',     l: 'Forte' },
  ];
  const lv = levels[score] || levels[0];
  fill.style.width      = lv.w;
  fill.style.background = lv.c;
  label.textContent     = lv.l;
}

// ============================================================
// 3. REGISTRO
// ============================================================
function handleRegister() {
  const nome    = document.getElementById('reg-name').value.trim();
  const turma   = document.getElementById('reg-class').value.trim();
  const email   = document.getElementById('reg-email').value.trim();
  const curso   = document.getElementById('reg-course').value;
  const senha   = document.getElementById('reg-password').value;
  const perfilEl = document.querySelector('input[name="role"]:checked');

  ['err-reg-name','err-reg-email','err-reg-course','err-reg-password'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '';
  });

  let ok = true;
  if (!nome)            { document.getElementById('err-reg-name').textContent     = 'Nome obrigatório.';    ok = false; }
  if (!email)           { document.getElementById('err-reg-email').textContent    = 'E-mail obrigatório.';  ok = false; }
  if (!curso)           { document.getElementById('err-reg-course').textContent   = 'Selecione um curso.';  ok = false; }
  if (senha.length < 8) { document.getElementById('err-reg-password').textContent = 'Mínimo 8 caracteres.'; ok = false; }
  if (!ok) return;

  const perfil = perfilEl ? perfilEl.value : 'aluno';
  const users  = getUsers();

  if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    document.getElementById('err-reg-email').textContent = 'E-mail já cadastrado.';
    return;
  }

  const novoUsuario = { nome, turma, email, curso, perfil, senha };
  users.push(novoUsuario);
  saveUsers(users);

  showToast('Conta criada com sucesso! Faça login.', 'success');
  ['reg-name','reg-class','reg-email','reg-course','reg-password'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  showPage('page-login');
}

// ============================================================
// 4. LOGIN
// ============================================================
function handleLogin() {
  const emailLogin = document.getElementById('login-email').value.trim();
  const senhaLogin = document.getElementById('login-password').value;

  document.getElementById('err-login-email').textContent    = '';
  document.getElementById('err-login-password').textContent = '';

  if (!emailLogin) { document.getElementById('err-login-email').textContent    = 'E-mail obrigatório.';  return; }
  if (!senhaLogin) { document.getElementById('err-login-password').textContent = 'Senha obrigatória.';   return; }

  const btnText   = document.querySelector('#page-login .btn-primary .btn-text');
  const btnLoader = document.querySelector('#page-login .btn-primary .btn-loader');
  if (btnText)   btnText.textContent = 'Entrando...';
  if (btnLoader) btnLoader.classList.remove('hidden');

  setTimeout(() => {
    if (btnText)   btnText.textContent = 'Entrar';
    if (btnLoader) btnLoader.classList.add('hidden');

    const users = getUsers();
    const user  = users.find(u =>
      u.email.toLowerCase() === emailLogin.toLowerCase() && u.senha === senhaLogin
    );

    if (!user) {
      document.getElementById('err-login-password').textContent = 'E-mail ou senha incorretos.';
      return;
    }

    currentUser = user;
    sessionStorage.setItem('loggedUser', JSON.stringify(user));

    if (user.perfil === 'professor') {
      initProfessorDashboard();
      showPage('page-professor');
    } else {
      initAlunoDashboard();
      showPage('page-dashboard');
    }
  }, 700);
}

// ============================================================
// 5. LOGOUT
// ============================================================
function handleLogout() {
  currentUser = null;
  sessionStorage.removeItem('loggedUser');
  document.getElementById('login-email').value    = '';
  document.getElementById('login-password').value = '';
  showPage('page-login');
  showToast('Sessão encerrada.', 'info');
}

// ============================================================
// 6. NAVEGAÇÃO (ALUNO)
// ============================================================
function switchSection(el, sectionId) {
  document.querySelectorAll('#page-dashboard .nav-item').forEach(n => n.classList.remove('active'));
  if (el) el.classList.add('active');
  document.querySelectorAll('#page-dashboard .section').forEach(s => s.classList.remove('active'));
  const sec = document.getElementById(sectionId);
  if (sec) sec.classList.add('active');

  if (sectionId === 'sec-home')     renderHomeAluno();
  if (sectionId === 'sec-projects') renderProjectsGrid();
  if (sectionId === 'sec-profile')  renderAlunoProfile();
  if (sectionId === 'sec-search') {
    document.getElementById('big-search').value = '';
    document.getElementById('search-results').innerHTML = '';
    document.getElementById('search-empty').classList.add('hidden');
  }
}

// ============================================================
// 7. NAVEGAÇÃO (PROFESSOR)
// ============================================================
function switchSectionProf(el, sectionId) {
  document.querySelectorAll('#sidebar-prof .nav-item').forEach(n => n.classList.remove('active'));
  if (el) el.classList.add('active');
  document.querySelectorAll('#page-professor .section').forEach(s => s.classList.remove('active'));
  const sec = document.getElementById(sectionId);
  if (sec) sec.classList.add('active');

  if (sectionId === 'sec-phome')     renderProfHome();
  if (sectionId === 'sec-pprojects') renderProfProjectsGrid();
  if (sectionId === 'sec-pstudents') renderStudentsTable();
  if (sectionId === 'sec-pfeedback') renderFeedbackList();
  if (sectionId === 'sec-pprofile')  renderProfProfile();
}

function toggleSidebar()     { document.getElementById('sidebar').classList.toggle('open'); }
function toggleSidebarProf() { document.getElementById('sidebar-prof').classList.toggle('open'); }

// ============================================================
// 8. INIT ALUNO DASHBOARD
// ============================================================
function initAlunoDashboard() {
  const u = currentUser;
  const initial = u.nome.charAt(0).toUpperCase();

  ['user-avatar-sidebar','user-avatar-top'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = initial;
  });
  const nameSidebar = document.getElementById('user-name-sidebar');
  if (nameSidebar) nameSidebar.textContent = u.nome;
  const roleSidebar = document.getElementById('user-role-sidebar');
  if (roleSidebar) roleSidebar.textContent = 'Aluno';
  const welcomeName = document.getElementById('welcome-name');
  if (welcomeName) welcomeName.textContent = u.nome.split(' ')[0];

  renderHomeAluno();
}

function renderHomeAluno() {
  const projects = getProjects();

  const courses = [...new Set(projects.map(p => p.curso).filter(Boolean))];
  document.getElementById('stat-total').textContent   = projects.length;
  document.getElementById('stat-teams').textContent   = projects.filter(p => p.membros && p.membros.includes(',')).length;
  document.getElementById('stat-courses').textContent = courses.length;
  document.getElementById('stat-files').textContent   = projects.filter(p => p.fileName).length;

  const recList = document.getElementById('recent-projects-list');
  if (recList) {
    const recent = [...projects].reverse().slice(0, 5);
    recList.innerHTML = recent.length === 0
      ? `<div class="empty-state-small">Nenhum projeto ainda. <a href="#" onclick="switchSection(document.querySelector('[data-section=upload]'),'sec-upload')">Envie o primeiro!</a></div>`
      : recent.map(p => projectRowHTML(p)).join('');
  }

  renderCourseBreakdown(projects, 'course-breakdown');
}

function projectRowHTML(p) {
  const emoji = courseEmoji(p.curso);
  const date  = p.data ? new Date(p.data).toLocaleDateString('pt-BR') : '—';
  return `<div class="project-row" onclick="openProjectDetail('${p.id}')">
    <div class="project-row-icon">${emoji}</div>
    <div class="project-row-body">
      <div class="project-row-title">${p.titulo}</div>
      <div class="project-row-sub">${p.curso} · ${p.turma || 'Sem turma'}</div>
    </div>
    <div class="project-row-date">${date}</div>
  </div>`;
}

function renderCourseBreakdown(projects, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  if (projects.length === 0) {
    container.innerHTML = '<p style="font-size:13px;color:var(--text-hint)">Nenhum projeto cadastrado.</p>';
    return;
  }
  const counts = {};
  projects.forEach(p => { counts[p.curso] = (counts[p.curso] || 0) + 1; });
  const max    = Math.max(...Object.values(counts));
  const colors = ['#003087','#F7941D','#27ae60','#e74c3c','#9b59b6','#1abc9c','#e67e22'];
  container.innerHTML = Object.entries(counts).map(([curso, cnt], i) => `
    <div class="course-item">
      <div class="course-label">
        <span class="course-name">${curso}</span>
        <span class="course-count">${cnt}</span>
      </div>
      <div class="course-bar"><div class="course-fill" style="width:${(cnt/max)*100}%;background:${colors[i%colors.length]}"></div></div>
    </div>`).join('');
}

// ============================================================
// 9. PROJETOS (ALUNO)
// ============================================================
function renderProjectsGrid() {
  const projects = getProjects();
  const grid = document.getElementById('projects-grid');
  if (!grid) return;

  let filtered = currentFilter === 'all' ? [...projects] : projects.filter(p => p.curso === currentFilter);

  if (currentSort === 'name')   filtered.sort((a,b) => a.titulo.localeCompare(b.titulo));
  if (currentSort === 'course') filtered.sort((a,b) => (a.curso||'').localeCompare(b.curso||''));
  if (currentSort === 'date')   filtered.sort((a,b) => new Date(b.data) - new Date(a.data));

  if (filtered.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--text-hint)">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="margin:0 auto 12px;display:block"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
      <p>Nenhum projeto encontrado.</p></div>`;
    return;
  }
  grid.innerHTML = filtered.map(p => projectCardHTML(p, false)).join('');
}

function projectCardHTML(p, isProfMode) {
  const fb = getFeedbacks().find(f => f.projectId === p.id);
  const statusBadge = fb
    ? `<span class="status-badge status-${fb.status}">${statusLabel(fb.status)}</span>`
    : `<span class="status-badge status-pendente">Pendente</span>`;
  const emoji = courseEmoji(p.curso);
  const date  = p.data ? new Date(p.data).toLocaleDateString('pt-BR') : '—';
  const tags  = (p.tags || []).slice(0,2).map(t => `<span class="detail-tag">${t}</span>`).join('');

  return `<div class="project-card" onclick="openProjectDetail('${p.id}')">
    <div class="project-card-top">
      <div class="project-emoji">${emoji}</div>
      ${statusBadge}
    </div>
    <h4>${p.titulo}</h4>
    <p>${p.descricao}</p>
    <div style="display:flex;flex-wrap:wrap;gap:6px">${tags}</div>
    <div class="project-card-footer">
      <span class="project-badge">${p.curso}</span>
      <span class="project-date">${date}</span>
    </div>
  </div>`;
}

function filterProjects(el, filter) {
  currentFilter = filter;
  document.querySelectorAll('#page-dashboard .chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  renderProjectsGrid();
}

function sortProjects(val) {
  currentSort = val;
  renderProjectsGrid();
}

function quickSearch(val) {
  if (!val.trim()) { renderProjectsGrid(); return; }
  const q = val.toLowerCase();
  const projects = getProjects().filter(p =>
    p.titulo.toLowerCase().includes(q) ||
    (p.curso||'').toLowerCase().includes(q) ||
    (p.turma||'').toLowerCase().includes(q) ||
    (p.descricao||'').toLowerCase().includes(q)
  );
  const grid = document.getElementById('projects-grid');
  if (grid) grid.innerHTML = projects.map(p => projectCardHTML(p, false)).join('')
    || '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-hint)">Nenhum resultado.</div>';
}

function bigSearch(val) {
  const resultsEl = document.getElementById('search-results');
  const emptyEl   = document.getElementById('search-empty');
  if (!val.trim()) { resultsEl.innerHTML = ''; emptyEl.classList.add('hidden'); return; }

  const q = val.toLowerCase();
  const projects = getProjects().filter(p =>
    p.titulo.toLowerCase().includes(q) ||
    (p.curso||'').toLowerCase().includes(q) ||
    (p.turma||'').toLowerCase().includes(q) ||
    (p.descricao||'').toLowerCase().includes(q) ||
    (p.membros||'').toLowerCase().includes(q)
  );

  if (projects.length === 0) {
    resultsEl.innerHTML = '';
    emptyEl.classList.remove('hidden');
  } else {
    emptyEl.classList.add('hidden');
    resultsEl.innerHTML = projects.map(p => projectCardHTML(p, false)).join('');
  }
}

// ============================================================
// 10. ENVIO DE PROJETO
// ============================================================
function toggleTag(btn) { btn.classList.toggle('active'); }

function onDragOver(e)  { e.preventDefault(); document.getElementById('drop-zone').classList.add('drag-over'); }
function onDragLeave()  { document.getElementById('drop-zone').classList.remove('drag-over'); }
function onDrop(e)      { e.preventDefault(); onDragLeave(); if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]); }
function onFileSelect(e){ if (e.target.files[0]) setFile(e.target.files[0]); }

function setFile(file) {
  selectedFile = file;
  const reader = new FileReader();
  reader.onload = (e) => { selectedFileData = e.target.result; };
  reader.readAsDataURL(file);

  const dc = document.getElementById('drop-content');
  if (dc) dc.innerHTML = `
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#27ae60" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
    <p><strong style="color:#27ae60">${file.name}</strong></p>
    <span>${(file.size/1024/1024).toFixed(2)} MB</span>`;
}

function resetUploadForm() {
  ['up-title','up-class','up-members'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  const course = document.getElementById('up-course'); if (course) course.value = '';
  const desc   = document.getElementById('up-desc');   if (desc)   desc.value   = '';
  document.querySelectorAll('.tag-btn').forEach(b => b.classList.remove('active'));
  selectedFile     = null;
  selectedFileData = null;
  const dc = document.getElementById('drop-content');
  if (dc) dc.innerHTML = `
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
    <p>Arraste um arquivo ou <strong>clique para selecionar</strong></p>
    <span>PDF, ZIP, DOCX, PPTX — máx. 50 MB</span>`;
  document.getElementById('file-input').value = '';
}

function handleUpload() {
  const titulo = document.getElementById('up-title').value.trim();
  const curso  = document.getElementById('up-course').value;
  const desc   = document.getElementById('up-desc').value.trim();

  document.getElementById('err-up-title').textContent  = '';
  document.getElementById('err-up-course').textContent = '';
  document.getElementById('err-up-desc').textContent   = '';

  let ok = true;
  if (!titulo) { document.getElementById('err-up-title').textContent  = 'Título obrigatório.';    ok = false; }
  if (!curso)  { document.getElementById('err-up-course').textContent = 'Selecione o curso.';     ok = false; }
  if (!desc)   { document.getElementById('err-up-desc').textContent   = 'Descrição obrigatória.'; ok = false; }
  if (!ok) return;

  const tags    = [...document.querySelectorAll('.tag-btn.active')].map(b => b.textContent);
  const membros = document.getElementById('up-members').value.trim();
  const turma   = document.getElementById('up-class').value.trim();
  const ano     = turma ? turma.match(/\d{4}/) ? turma.match(/\d{4}/)[0] : new Date().getFullYear().toString() : new Date().getFullYear().toString();

  const projeto = {
    id:           Date.now().toString(),
    titulo,
    curso,
    turma,
    ano,
    descricao:    desc,
    membros,
    tags,
    fileName:     selectedFile     ? selectedFile.name : null,
    fileData:     selectedFileData ? selectedFileData  : null,
    fileSize:     selectedFile     ? (selectedFile.size/1024/1024).toFixed(2) : null,
    autor:        currentUser ? currentUser.email : 'anonimo',
    data:         new Date().toISOString(),
  };

  const projects = getProjects();
  projects.push(projeto);
  saveProjects(projects);

  showToast('Projeto enviado com sucesso!', 'success');
  resetUploadForm();
  switchSection(document.querySelector('[data-section=projects]'), 'sec-projects');
}

// ============================================================
// 11. PERFIL ALUNO
// ============================================================
function renderAlunoProfile() {
  const u = currentUser;
  if (!u) return;
  const initial = u.nome.charAt(0).toUpperCase();
  document.getElementById('profile-avatar-big').textContent = initial;
  document.getElementById('profile-fullname').textContent   = u.nome;
  document.getElementById('profile-email').textContent      = u.email;
  document.getElementById('profile-course').textContent     = u.curso || '—';
  document.getElementById('profile-class').textContent      = u.turma || '—';
  document.getElementById('profile-perfil').textContent     = 'Aluno';

  const badge = document.getElementById('profile-role-badge');
  if (badge) badge.textContent = 'Aluno';

  const mine   = getProjects().filter(p => p.autor === u.email);
  const myList = document.getElementById('my-projects-list');
  if (myList) {
    myList.innerHTML = mine.length === 0
      ? '<div class="empty-state-small">Você ainda não enviou nenhum projeto.</div>'
      : [...mine].reverse().map(p => projectRowHTML(p)).join('');
  }
}

function openEditProfile() {
  const u = currentUser;
  document.getElementById('edit-name').value   = u.nome  || '';
  document.getElementById('edit-class').value  = u.turma || '';
  document.getElementById('edit-course').value = u.curso || '';
  openModal('modal-edit-profile');
}

function saveProfile() {
  const nome  = document.getElementById('edit-name').value.trim();
  const turma = document.getElementById('edit-class').value.trim();
  const curso = document.getElementById('edit-course').value;
  if (!nome) { showToast('Nome não pode ser vazio.', 'error'); return; }

  const users = getUsers();
  const idx   = users.findIndex(u => u.email === currentUser.email);
  if (idx === -1) return;

  users[idx].nome  = nome;
  users[idx].turma = turma;
  users[idx].curso = curso;
  saveUsers(users);

  currentUser = users[idx];
  sessionStorage.setItem('loggedUser', JSON.stringify(currentUser));

  const initial = nome.charAt(0).toUpperCase();
  ['user-avatar-sidebar','user-avatar-top'].forEach(id => {
    const el = document.getElementById(id); if (el) el.textContent = initial;
  });
  const ns = document.getElementById('user-name-sidebar'); if (ns) ns.textContent = nome;
  const wn = document.getElementById('welcome-name');      if (wn) wn.textContent = nome.split(' ')[0];

  closeModal('modal-edit-profile');
  renderAlunoProfile();
  showToast('Perfil atualizado!', 'success');
}

// ============================================================
// 12. MODAL DETALHE DE PROJETO
// ============================================================
function openProjectDetail(id) {
  const p = getProjects().find(px => px.id === id);
  if (!p) return;
  currentProjectId = id;

  document.getElementById('detail-course-badge').textContent = p.curso || '—';
  document.getElementById('detail-title').textContent        = p.titulo;
  document.getElementById('detail-desc').textContent         = p.descricao;

  const fb       = getFeedbacks().find(f => f.projectId === id);
  const statusEl = document.getElementById('detail-status-badge');
  statusEl.innerHTML = fb
    ? `<span class="status-badge status-${fb.status}">${statusLabel(fb.status)}</span>`
    : `<span class="status-badge status-pendente">Pendente</span>`;

  document.getElementById('detail-team').innerHTML =
    `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg> ${p.membros || 'Não informado'}`;

  const dateStr = p.data ? new Date(p.data).toLocaleDateString('pt-BR') : '—';
  document.getElementById('detail-date').innerHTML =
    `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> ${dateStr}`;

  document.getElementById('detail-tags').innerHTML =
    (p.tags || []).map(t => `<span class="detail-tag">${t}</span>`).join('');

  // ── BLOCO DO ARQUIVO ──────────────────────────────────────
  const oldFileBlock = document.getElementById('detail-file-block');
  if (oldFileBlock) oldFileBlock.remove();

  if (p.fileName) {
    const fileBlock = document.createElement('div');
    fileBlock.id        = 'detail-file-block';
    fileBlock.className = 'detail-file-block';

    const ext = p.fileName.split('.').pop().toUpperCase();
    const extColors = { PDF: '#e74c3c', ZIP: '#8e44ad', DOCX: '#2980b9', PPTX: '#e67e22' };
    const color = extColors[ext] || '#555';

    if (p.fileData) {
      fileBlock.innerHTML = `
        <div class="file-info">
          <span class="file-ext-badge" style="background:${color}">${ext}</span>
          <div class="file-details">
            <span class="file-name">${p.fileName}</span>
            ${p.fileSize ? `<span class="file-size">${p.fileSize} MB</span>` : ''}
          </div>
        </div>
        <a class="btn-download" href="${p.fileData}" download="${p.fileName}" title="Baixar arquivo">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Baixar
        </a>`;
    } else {
      fileBlock.innerHTML = `
        <div class="file-info">
          <span class="file-ext-badge" style="background:${color}">${ext}</span>
          <div class="file-details">
            <span class="file-name">${p.fileName}</span>
            <span class="file-size">Arquivo não disponível para download</span>
          </div>
        </div>`;
    }

    const tagsEl = document.getElementById('detail-tags');
    tagsEl.parentNode.insertBefore(fileBlock, tagsEl.nextSibling);
  }

  const profArea   = document.getElementById('prof-feedback-area');
  const studFbArea = document.getElementById('student-feedback-display');
  const footer     = document.getElementById('modal-detail-footer');

  const isProfessor = currentUser && currentUser.perfil === 'professor';

  if (isProfessor) {
    profArea.classList.remove('hidden');
    studFbArea.classList.add('hidden');
    footer.innerHTML = '';

    const existingDiv = document.getElementById('existing-feedback-display');
    const fbFormArea  = document.getElementById('feedback-form-area');

    if (fb) {
      existingDiv.classList.remove('hidden');
      existingDiv.innerHTML = `<div class="feedback-display" style="margin-bottom:12px">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
          <span class="feedback-grade">Nota: ${fb.grade}</span>
          <span class="status-badge status-${fb.status}">${statusLabel(fb.status)}</span>
        </div>
        <p class="comment-text">${fb.comment}</p>
        <p class="feedback-meta">Avaliado em ${new Date(fb.data).toLocaleDateString('pt-BR')}</p>
      </div>`;
      document.getElementById('feedback-grade').value   = fb.grade;
      document.getElementById('feedback-status').value  = fb.status;
      document.getElementById('feedback-comment').value = fb.comment;
    } else {
      existingDiv.classList.add('hidden');
      existingDiv.innerHTML = '';
      document.getElementById('feedback-grade').value   = '';
      document.getElementById('feedback-status').value  = 'pendente';
      document.getElementById('feedback-comment').value = '';
    }
    fbFormArea.classList.remove('hidden');
  } else {
    profArea.classList.add('hidden');
    footer.innerHTML = `<button class="btn-secondary" onclick="closeModal('modal-detail')">Fechar</button>`;

    if (fb) {
      studFbArea.classList.remove('hidden');
      studFbArea.innerHTML = `
        <h4 style="font-size:14px;font-weight:600;margin-bottom:10px;color:var(--text-primary)">Avaliação do Professor</h4>
        <div class="feedback-display">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
            <span class="feedback-grade" style="font-size:22px;font-weight:700;color:var(--blue)">Nota: ${fb.grade}</span>
            <span class="status-badge status-${fb.status}">${statusLabel(fb.status)}</span>
          </div>
          <p class="comment-text">${fb.comment}</p>
          <p class="feedback-meta">Avaliado em ${new Date(fb.data).toLocaleDateString('pt-BR')}</p>
        </div>`;
    } else {
      studFbArea.classList.add('hidden');
    }
  }

  openModal('modal-detail');
}

function submitFeedback() {
  const grade   = parseFloat(document.getElementById('feedback-grade').value);
  const status  = document.getElementById('feedback-status').value;
  const comment = document.getElementById('feedback-comment').value.trim();

  if (isNaN(grade) || grade < 0 || grade > 10) { showToast('Nota deve ser entre 0 e 10.', 'error'); return; }
  if (!comment) { showToast('Escreva um comentário.', 'error'); return; }

  const feedbacks = getFeedbacks();
  const existing  = feedbacks.findIndex(f => f.projectId === currentProjectId);

  const fbObj = {
    projectId: currentProjectId,
    grade,
    status,
    comment,
    professor: currentUser.email,
    data:      new Date().toISOString(),
  };

  if (existing >= 0) feedbacks[existing] = fbObj;
  else               feedbacks.push(fbObj);

  saveFeedbacks(feedbacks);
  closeModal('modal-detail');
  showToast('Avaliação salva com sucesso!', 'success');
  renderProfHome();
  renderProfProjectsGrid();
  renderFeedbackList();
}

// ============================================================
// 13. PROFESSOR — INIT
// ============================================================
function initProfessorDashboard() {
  const u = currentUser;
  const initial = u.nome.charAt(0).toUpperCase();

  ['prof-avatar-sidebar','prof-avatar-top'].forEach(id => {
    const el = document.getElementById(id); if (el) el.textContent = initial;
  });
  const ns = document.getElementById('prof-name-sidebar'); if (ns) ns.textContent = u.nome;
  const wn = document.getElementById('prof-welcome-name'); if (wn) wn.textContent = u.nome.split(' ')[0];

  renderProfCourseLabel();
  populateProfFilterOptions();
  renderProfHome();
}

// Mostra o curso do professor na sidebar
function renderProfCourseLabel() {
  const u = currentUser;
  if (!u || !u.curso) return;
  const brand = document.querySelector('#sidebar-prof .sidebar-brand');
  if (!brand) return;
  let label = document.getElementById('prof-course-label');
  if (!label) {
    label = document.createElement('div');
    label.id        = 'prof-course-label';
    label.className = 'prof-course-label';
    brand.parentNode.insertBefore(label, brand.nextSibling);
  }
  label.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/></svg> ${u.curso}`;
}

// ── PROFESSORES VEEM TODOS OS PROJETOS ────────────────────────
// Professores agora têm acesso a TODOS os PIs de todos os cursos.
function getProfProjects() {
  return getProjects(); // sem filtro por curso
}

// Retorna apenas alunos do mesmo curso do professor
function getProfStudents() {
  const users = getUsers().filter(u => u.perfil === 'aluno');
  if (!currentUser || !currentUser.curso) return users;
  return users.filter(u => u.curso === currentUser.curso);
}

// Popula os dropdowns de filtro (turma e ano) com valores reais dos projetos
function populateProfFilterOptions() {
  const projects = getProjects();

  // Turmas únicas
  const turmas = [...new Set(projects.map(p => p.turma).filter(Boolean))].sort();
  const turmaEl = document.getElementById('prof-filter-turma');
  if (turmaEl) {
    turmaEl.innerHTML = '<option value="">Todas as turmas</option>' +
      turmas.map(t => `<option value="${t}">${t}</option>`).join('');
  }

  // Anos únicos — tenta extrair do campo ano, senão da data
  const anos = [...new Set(projects.map(p => {
    if (p.ano) return p.ano;
    if (p.data) return new Date(p.data).getFullYear().toString();
    return null;
  }).filter(Boolean))].sort((a,b) => b - a);

  const anoEl = document.getElementById('prof-filter-ano');
  if (anoEl) {
    anoEl.innerHTML = '<option value="">Todos os anos</option>' +
      anos.map(a => `<option value="${a}">${a}</option>`).join('');
  }
}

function applyProfFilters() {
  profSearchName  = (document.getElementById('prof-search-nome')?.value  || '').toLowerCase().trim();
  profSearchTurma = (document.getElementById('prof-filter-turma')?.value || '');
  profSearchAno   = (document.getElementById('prof-filter-ano')?.value   || '');
  renderProfProjectsGrid();
}

function clearProfFilters() {
  profSearchName  = '';
  profSearchTurma = '';
  profSearchAno   = '';
  profFilter      = 'all';

  const nameEl  = document.getElementById('prof-search-nome');  if (nameEl)  nameEl.value  = '';
  const turmaEl = document.getElementById('prof-filter-turma'); if (turmaEl) turmaEl.value = '';
  const anoEl   = document.getElementById('prof-filter-ano');   if (anoEl)   anoEl.value   = '';

  document.querySelectorAll('#sec-pprojects .chip').forEach(c => c.classList.remove('active'));
  const allChip = document.querySelector('#sec-pprojects .chip[data-filter="all"]');
  if (allChip) allChip.classList.add('active');

  renderProfProjectsGrid();
  showToast('Filtros limpos.', 'info');
}

function renderProfHome() {
  const projects  = getProfProjects();
  const feedbacks = getFeedbacks();
  const students  = getProfStudents();

  const pending  = projects.filter(p => !feedbacks.find(f => f.projectId === p.id));
  const approved = feedbacks.filter(f => f.status === 'aprovado' && projects.find(p => p.id === f.projectId));

  document.getElementById('pstat-total').textContent    = projects.length;
  document.getElementById('pstat-pending').textContent  = pending.length;
  document.getElementById('pstat-approved').textContent = approved.length;
  document.getElementById('pstat-students').textContent = students.length;

  const recList = document.getElementById('prof-recent-list');
  if (recList) {
    const recent = [...projects].reverse().slice(0, 5);
    recList.innerHTML = recent.length === 0
      ? '<div class="empty-state-small">Nenhum projeto enviado ainda.</div>'
      : recent.map(p => {
          const fb = feedbacks.find(f => f.projectId === p.id);
          const statusBadge = fb
            ? `<span class="status-badge status-${fb.status}" style="font-size:11px;padding:2px 7px">${statusLabel(fb.status)}</span>`
            : `<span class="status-badge status-pendente" style="font-size:11px;padding:2px 7px">Pendente</span>`;
          return `<div class="project-row" onclick="openProjectDetail('${p.id}')">
            <div class="project-row-icon">${courseEmoji(p.curso)}</div>
            <div class="project-row-body">
              <div class="project-row-title">${p.titulo}</div>
              <div class="project-row-sub">${p.curso} · ${p.turma || '—'}</div>
            </div>
            ${statusBadge}
          </div>`;
        }).join('');
  }

  const stEl = document.getElementById('prof-status-breakdown');
  if (stEl) {
    if (projects.length === 0) {
      stEl.innerHTML = '<p style="font-size:13px;color:var(--text-hint)">Nenhum projeto cadastrado.</p>';
      return;
    }
    const pendingCount  = pending.length;
    const approvedCount = approved.length;
    const revisionCount = feedbacks.filter(f => f.status === 'revisao'   && projects.find(p => p.id === f.projectId)).length;
    const rejectedCount = feedbacks.filter(f => f.status === 'reprovado' && projects.find(p => p.id === f.projectId)).length;
    const total = projects.length;

    stEl.innerHTML = [
      { label: 'Pendentes',   count: pendingCount,  color: '#f39c12' },
      { label: 'Aprovados',   count: approvedCount, color: '#27ae60' },
      { label: 'Em Revisão',  count: revisionCount, color: '#e67e22' },
      { label: 'Reprovados',  count: rejectedCount, color: '#e74c3c' },
    ].map(item => `<div class="course-item">
      <div class="course-label">
        <span class="course-name">${item.label}</span>
        <span class="course-count">${item.count}</span>
      </div>
      <div class="course-bar"><div class="course-fill" style="width:${total ? (item.count/total)*100 : 0}%;background:${item.color}"></div></div>
    </div>`).join('');
  }
}

function renderProfProjectsGrid() {
  const projects  = getProfProjects();
  const feedbacks = getFeedbacks();
  const grid = document.getElementById('prof-projects-grid');
  if (!grid) return;

  let filtered = [...projects];

  // Filtro de status (chips)
  if (profFilter === 'pendente')  filtered = filtered.filter(p => !feedbacks.find(f => f.projectId === p.id));
  if (profFilter === 'aprovado')  filtered = filtered.filter(p => { const fb = feedbacks.find(f => f.projectId === p.id); return fb && fb.status === 'aprovado'; });
  if (profFilter === 'revisao')   filtered = filtered.filter(p => { const fb = feedbacks.find(f => f.projectId === p.id); return fb && fb.status === 'revisao'; });
  if (profFilter === 'reprovado') filtered = filtered.filter(p => { const fb = feedbacks.find(f => f.projectId === p.id); return fb && fb.status === 'reprovado'; });

  // Filtro por nome do projeto
  if (profSearchName) {
    filtered = filtered.filter(p =>
      p.titulo.toLowerCase().includes(profSearchName) ||
      (p.membros||'').toLowerCase().includes(profSearchName)
    );
  }

  // Filtro por turma
  if (profSearchTurma) {
    filtered = filtered.filter(p => p.turma === profSearchTurma);
  }

  // Filtro por ano
  if (profSearchAno) {
    filtered = filtered.filter(p => {
      const pAno = p.ano || (p.data ? new Date(p.data).getFullYear().toString() : '');
      return pAno === profSearchAno;
    });
  }

  // Ordenação
  if (profSort === 'name')   filtered.sort((a,b) => a.titulo.localeCompare(b.titulo));
  if (profSort === 'date')   filtered.sort((a,b) => new Date(b.data) - new Date(a.data));
  if (profSort === 'status') filtered.sort((a,b) => {
    const sa = feedbacks.find(f => f.projectId === a.id)?.status || 'pendente';
    const sb = feedbacks.find(f => f.projectId === b.id)?.status || 'pendente';
    return sa.localeCompare(sb);
  });
  if (profSort === 'course') filtered.sort((a,b) => (a.curso||'').localeCompare(b.curso||''));

  // Contador de resultados
  const countEl = document.getElementById('prof-results-count');
  if (countEl) countEl.textContent = `${filtered.length} projeto${filtered.length !== 1 ? 's' : ''} encontrado${filtered.length !== 1 ? 's' : ''}`;

  if (filtered.length === 0) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--text-hint)"><p>Nenhum projeto encontrado com os filtros aplicados.</p></div>';
    return;
  }

  grid.innerHTML = filtered.map(p => {
    const fb = feedbacks.find(f => f.projectId === p.id);
    const statusBadge = fb
      ? `<span class="status-badge status-${fb.status}">${statusLabel(fb.status)}</span>`
      : `<span class="status-badge status-pendente">Pendente</span>`;
    const date = p.data ? new Date(p.data).toLocaleDateString('pt-BR') : '—';
    const fileIcon = p.fileName
      ? `<span class="file-indicator" title="${p.fileName}">
           <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
           ${p.fileName.split('.').pop().toUpperCase()}
         </span>`
      : '';
    const turmaTag = p.turma ? `<span class="detail-tag" style="background:#e8f4fd;color:#2980b9">${p.turma}</span>` : '';
    const anoTag   = p.ano   ? `<span class="detail-tag" style="background:#f0fdf4;color:#27ae60">${p.ano}</span>` : '';

    return `<div class="project-card" onclick="openProjectDetail('${p.id}')">
      <div class="project-card-top">
        <div class="project-emoji">${courseEmoji(p.curso)}</div>
        <div style="display:flex;align-items:center;gap:6px">${fileIcon}${statusBadge}</div>
      </div>
      <h4>${p.titulo}</h4>
      <p>${p.descricao}</p>
      <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:6px">${turmaTag}${anoTag}</div>
      <div class="project-card-footer">
        <span class="project-badge">${p.curso}</span>
        <span class="project-date">${date}</span>
      </div>
      <div style="margin-top:8px">
        <button class="btn-primary small" onclick="event.stopPropagation();openProjectDetail('${p.id}')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
          Avaliar
        </button>
      </div>
    </div>`;
  }).join('');
}

function filterProfProjects(el, filter) {
  profFilter = filter;
  document.querySelectorAll('#sec-pprojects .chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  renderProfProjectsGrid();
}

function sortProfProjects(val) {
  profSort = val;
  renderProfProjectsGrid();
}

function quickSearchProf(val) {
  profSearchName = val.toLowerCase().trim();
  renderProfProjectsGrid();
}

function renderStudentsTable() {
  const users    = getProfStudents();
  const projects = getProjects();
  const tbody    = document.getElementById('students-tbody');
  if (!tbody) return;

  if (users.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-hint);padding:40px">Nenhum aluno cadastrado nesta matéria.</td></tr>';
    return;
  }
  tbody.innerHTML = users.map(u => {
    const count = projects.filter(p => p.autor === u.email).length;
    return `<tr>
      <td><strong>${u.nome}</strong></td>
      <td>${u.email}</td>
      <td>${u.curso || '—'}</td>
      <td>${u.turma || '—'}</td>
      <td><span class="student-count-badge">${count}</span></td>
    </tr>`;
  }).join('');
}

function renderFeedbackList() {
  const myFbs    = getFeedbacks().filter(f => f.professor === currentUser.email);
  const projects = getProjects();
  const container = document.getElementById('feedback-list');
  if (!container) return;

  if (myFbs.length === 0) {
    container.innerHTML = `<div class="empty-state">
      <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      <p>Nenhum feedback enviado ainda.</p></div>`;
    return;
  }

  container.innerHTML = [...myFbs].reverse().map(fb => {
    const p    = projects.find(px => px.id === fb.projectId);
    const date = fb.data ? new Date(fb.data).toLocaleDateString('pt-BR') : '—';
    return `<div class="feedback-card">
      <div class="feedback-card-header">
        <span class="feedback-project-title">${p ? p.titulo : 'Projeto removido'}</span>
        <span class="feedback-grade">Nota: ${fb.grade}</span>
      </div>
      <div style="margin-bottom:6px"><span class="status-badge status-${fb.status}">${statusLabel(fb.status)}</span></div>
      <p class="feedback-comment">${fb.comment}</p>
      <p class="feedback-meta">${p ? p.curso : '—'} · Avaliado em ${date}</p>
    </div>`;
  }).join('');
}

function renderProfProfile() {
  const u = currentUser;
  if (!u) return;
  const initial = u.nome.charAt(0).toUpperCase();
  document.getElementById('pprofile-avatar-big').textContent = initial;
  document.getElementById('pprofile-fullname').textContent   = u.nome;
  document.getElementById('pprofile-email').textContent      = u.email;
  document.getElementById('pprofile-course').textContent     = u.curso || '—';
  document.getElementById('pprofile-class').textContent      = u.turma || '—';

  const myFbs = getFeedbacks().filter(f => f.professor === u.email);
  document.getElementById('pprofile-evaluated').textContent = myFbs.length;

  const profFbList = document.getElementById('prof-feedbacks-profile');
  if (profFbList) {
    const projects = getProjects();
    profFbList.innerHTML = myFbs.length === 0
      ? '<div class="empty-state-small">Nenhum feedback enviado ainda.</div>'
      : [...myFbs].slice(-5).reverse().map(fb => {
          const p = projects.find(px => px.id === fb.projectId);
          return `<div class="project-row">
            <div class="project-row-body">
              <div class="project-row-title">${p ? p.titulo : 'Projeto removido'}</div>
              <div class="project-row-sub">Nota: ${fb.grade} · <span class="status-badge status-${fb.status}" style="font-size:10px;padding:1px 6px">${statusLabel(fb.status)}</span></div>
            </div>
          </div>`;
        }).join('');
  }
}

// ============================================================
// 14. HELPERS
// ============================================================
function courseEmoji(curso) {
  const map = {
    'Desenvolvimento de Sistemas': '💻',
    'Design Gráfico':              '🎨',
    'Administração':               '📊',
    'Contabilidade':               '🧾',
    'Logística':                   '📦',
    'Marketing':                   '📢',
    'Gastronomia':                 '🍽️',
  };
  return map[curso] || '📁';
}

function statusLabel(s) {
  const map = {
    pendente:   'Pendente',
    aprovado:   'Aprovado',
    revisao:    'Em Revisão',
    reprovado:  'Reprovado',
  };
  return map[s] || s;
}

// ============================================================
// 15. BOOT — verifica sessão salva
// ============================================================
(function init() {
  const saved = sessionStorage.getItem('loggedUser');
  if (saved) {
    try {
      currentUser = JSON.parse(saved);
      if (currentUser.perfil === 'professor') {
        initProfessorDashboard();
        showPage('page-professor');
      } else {
        initAlunoDashboard();
        showPage('page-dashboard');
      }
    } catch(e) {
      sessionStorage.removeItem('loggedUser');
      showPage('page-login');
    }
  } else {
    showPage('page-login');
  }
})();