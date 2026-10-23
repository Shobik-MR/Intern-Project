// ═══════════════════════════════════════════════════════════════
// EventHub – Frontend Application Logic
// ═══════════════════════════════════════════════════════════════

const API = '/api';

// ── State ────────────────────────────────────────────────────
let currentUser = null;
let authToken   = localStorage.getItem('eventhub_token') || null;
let allEvents   = [];

// ── Bootstrap ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  if (authToken) {
    try {
      const res  = await apiFetch('/auth/me');
      currentUser = res.user;
      updateAuthUI();
    } catch {
      logout();
    }
  }
  await loadAllEvents();
  renderFeaturedEvents();
  updateStats();
});

// ═══════ API Helpers ═══════════════════════════════════════════

async function apiFetch(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

  const res = await fetch(`${API}${path}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

// ═══════ Auth ══════════════════════════════════════════════════

async function login(e) {
  e.preventDefault();
  const btn = document.getElementById('loginBtn');
  btn.disabled = true; btn.textContent = 'Logging in…';

  try {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email:    document.getElementById('loginEmail').value,
        password: document.getElementById('loginPassword').value,
      }),
    });

    authToken   = data.token;
    currentUser = data.user;
    localStorage.setItem('eventhub_token', authToken);

    closeModal('login');
    updateAuthUI();
    showToast(`Welcome back, ${currentUser.name}!`, 'success');
    loadAllEvents();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false; btn.textContent = 'Log In';
  }
}

async function register(e) {
  e.preventDefault();
  const btn = document.getElementById('registerBtn');
  btn.disabled = true; btn.textContent = 'Creating account…';

  try {
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name:       document.getElementById('regName').value,
        email:      document.getElementById('regEmail').value,
        password:   document.getElementById('regPassword').value,
        department: document.getElementById('regDepartment').value,
        phone:      document.getElementById('regPhone').value,
        role:       document.getElementById('regRole').value,
      }),
    });

    authToken   = data.token;
    currentUser = data.user;
    localStorage.setItem('eventhub_token', authToken);

    closeModal('register');
    updateAuthUI();
    showToast(`Account created! Welcome, ${currentUser.name}`, 'success');
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false; btn.textContent = 'Create Account';
  }
}

function logout() {
  authToken   = null;
  currentUser = null;
  localStorage.removeItem('eventhub_token');
  updateAuthUI();
  showPage('home');
  showToast('Logged out successfully', 'info');
}

function updateAuthUI() {
  const isLoggedIn = !!currentUser;
  const isAdmin    = currentUser?.role === 'admin';
  const isStudent  = currentUser?.role === 'student';

  document.getElementById('guestActions').style.display = isLoggedIn ? 'none' : 'flex';
  document.getElementById('userActions').style.display   = isLoggedIn ? 'flex' : 'none';

  if (isLoggedIn) {
    document.getElementById('userGreeting').textContent = `👋 ${currentUser.name}`;
  }

  document.querySelectorAll('.student-only').forEach(el => {
    el.style.display = isStudent ? '' : 'none';
  });
  document.querySelectorAll('.admin-only').forEach(el => {
    el.style.display = isAdmin ? '' : 'none';
  });
}

// ═══════ Pages ═════════════════════════════════════════════════

function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(`page-${pageId}`).classList.add('active');

  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  document.querySelector(`.nav-link[data-page="${pageId}"]`)?.classList.add('active');

  // Load data for specific pages
  if (pageId === 'events')           { loadAllEvents(); }
  if (pageId === 'my-registrations') { loadMyRegistrations(); }
  if (pageId === 'admin')            { loadAdminEvents(); loadParticipantEventSelect(); }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ═══════ Events ════════════════════════════════════════════════

async function loadAllEvents() {
  try {
    allEvents = await apiFetch('/events');
    renderAllEvents(allEvents);
  } catch (err) {
    console.error('Failed to load events', err);
  }
}

function renderAllEvents(events) {
  const grid = document.getElementById('allEventsGrid');
  const noEvt = document.getElementById('noEvents');

  if (!events.length) {
    grid.innerHTML = '';
    noEvt.style.display = 'block';
    return;
  }

  noEvt.style.display = 'none';
  grid.innerHTML = events.map(ev => eventCardHTML(ev)).join('');
}

function renderFeaturedEvents() {
  const featured = allEvents.slice(0, 3);
  document.getElementById('featuredEvents').innerHTML =
    featured.map(ev => eventCardHTML(ev)).join('');
}

function eventCardHTML(ev) {
  const date = new Date(ev.date).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
  const isFull = ev.currentParticipants >= ev.maxParticipants;
  const remaining = ev.maxParticipants - ev.currentParticipants;

  return `
    <div class="event-card" onclick="showEventDetail('${ev._id}')">
      <div class="event-card-banner ${ev.category}"></div>
      <div class="event-card-body">
        <span class="event-card-category ${ev.category}">${ev.category}</span>
        <h3 class="event-card-title">${ev.title}</h3>
        <div class="event-card-meta">
          <span>📅 ${date} · ${ev.time}</span>
          <span>📍 ${ev.venue}</span>
        </div>
        <div class="event-card-footer">
          <span class="event-card-seats">
            ${isFull
              ? '<span class="seats-full">🔴 Event Full</span>'
              : `<span class="seats-highlight">${remaining}</span> seats left`}
          </span>
          <span class="btn btn-sm btn-primary">View Details</span>
        </div>
      </div>
    </div>
  `;
}

function applyFilters() {
  const search   = document.getElementById('searchInput').value.toLowerCase();
  const category = document.getElementById('categoryFilter').value;

  const filtered = allEvents.filter(ev => {
    const matchSearch = !search ||
      ev.title.toLowerCase().includes(search) ||
      ev.description.toLowerCase().includes(search) ||
      ev.venue.toLowerCase().includes(search);
    const matchCategory = !category || ev.category === category;
    return matchSearch && matchCategory;
  });

  renderAllEvents(filtered);
}

function filterByCategory(cat) {
  showPage('events');
  document.getElementById('categoryFilter').value = cat;
  applyFilters();
}

// ═══════ Event Detail ══════════════════════════════════════════

async function showEventDetail(eventId) {
  try {
    const ev = await apiFetch(`/events/${eventId}`);
    const date = new Date(ev.date).toLocaleDateString('en-IN', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
    const isFull = ev.currentParticipants >= ev.maxParticipants;
    const pct = Math.min(100, Math.round((ev.currentParticipants / ev.maxParticipants) * 100));

    let actionBtn = '';
    if (currentUser?.role === 'student') {
      if (isFull) {
        actionBtn = '<button class="btn btn-primary btn-lg btn-full" disabled>Event Full</button>';
      } else {
        actionBtn = `<button class="btn btn-accent btn-lg btn-full" onclick="registerForEvent('${ev._id}')">Register Now</button>`;
      }
    } else if (!currentUser) {
      actionBtn = '<button class="btn btn-primary btn-lg btn-full" onclick="closeModal(\'event-detail\');showModal(\'login\');">Log in to Register</button>';
    }

    document.getElementById('eventDetailContent').innerHTML = `
      <div class="event-detail-header">
        <span class="event-card-category ${ev.category}">${ev.category}</span>
        <h2>${ev.title}</h2>
      </div>
      <div class="event-detail-grid">
        <div class="event-detail-item">
          <span class="label">Date</span>
          <span class="value">📅 ${date}</span>
        </div>
        <div class="event-detail-item">
          <span class="label">Time</span>
          <span class="value">🕐 ${ev.time}</span>
        </div>
        <div class="event-detail-item">
          <span class="label">Venue</span>
          <span class="value">📍 ${ev.venue}</span>
        </div>
        <div class="event-detail-item">
          <span class="label">Organized by</span>
          <span class="value">👤 ${ev.createdBy?.name || 'Admin'}</span>
        </div>
      </div>
      <div class="event-detail-description">${ev.description}</div>
      <div class="event-detail-progress">
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" style="width:${pct}%"></div>
        </div>
        <div class="progress-text">
          <span>${ev.currentParticipants} registered</span>
          <span>${ev.maxParticipants} max</span>
        </div>
      </div>
      ${actionBtn}
    `;

    showModal('event-detail');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ═══════ Registration ══════════════════════════════════════════

async function registerForEvent(eventId) {
  try {
    await apiFetch('/registrations', {
      method: 'POST',
      body: JSON.stringify({ eventId }),
    });
    showToast('🎉 Successfully registered!', 'success');
    closeModal('event-detail');
    loadAllEvents();
    renderFeaturedEvents();
    updateStats();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function loadMyRegistrations() {
  try {
    const regs = await apiFetch('/registrations/my');
    const list = document.getElementById('myRegistrationsList');
    const empty = document.getElementById('noRegistrations');

    if (!regs.length) {
      list.innerHTML = '';
      empty.style.display = 'block';
      return;
    }

    empty.style.display = 'none';
    list.innerHTML = regs.map(reg => {
      const ev = reg.event;
      const date = new Date(ev.date).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
      });
      const regDate = new Date(reg.registrationDate).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
      });
      return `
        <div class="registration-card">
          <div class="reg-info">
            <div class="reg-event-title">${ev.title}</div>
            <div class="reg-meta">
              <span>📅 ${date} · ${ev.time}</span>
              <span>📍 ${ev.venue}</span>
              <span>🎟️ Registered on ${regDate}</span>
            </div>
          </div>
          <button class="btn btn-danger btn-sm" onclick="cancelRegistration('${reg._id}')">
            Cancel
          </button>
        </div>
      `;
    }).join('');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function cancelRegistration(regId) {
  if (!confirm('Are you sure you want to cancel this registration?')) return;
  try {
    await apiFetch(`/registrations/${regId}/cancel`, { method: 'PUT' });
    showToast('Registration cancelled', 'info');
    loadMyRegistrations();
    loadAllEvents();
    updateStats();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ═══════ Admin ═════════════════════════════════════════════════

function switchAdminTab(tab) {
  document.querySelectorAll('.admin-tab-content').forEach(el => el.classList.remove('active'));
  document.getElementById(`tab-${tab}`).classList.add('active');

  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`.tab-btn[data-tab="${tab}"]`).classList.add('active');

  if (tab === 'manage')       loadAdminEvents();
  if (tab === 'participants') loadParticipantEventSelect();
}

async function loadAdminEvents() {
  try {
    const events = await apiFetch('/events');
    const list = document.getElementById('adminEventsList');

    list.innerHTML = events.map(ev => {
      const date = new Date(ev.date).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
      });
      return `
        <div class="admin-event-row">
          <div class="admin-event-info">
            <h3>${ev.title}</h3>
            <div class="admin-event-meta">
              <span>📅 ${date}</span>
              <span>📍 ${ev.venue}</span>
              <span>👥 ${ev.currentParticipants}/${ev.maxParticipants}</span>
              <span class="event-card-category ${ev.category}" style="display:inline-block;">${ev.category}</span>
            </div>
          </div>
          <div class="admin-event-actions">
            <button class="btn btn-danger btn-sm" onclick="deleteEvent('${ev._id}')">Delete</button>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function createEvent(e) {
  e.preventDefault();
  try {
    await apiFetch('/events', {
      method: 'POST',
      body: JSON.stringify({
        title:           document.getElementById('eventTitle').value,
        description:     document.getElementById('eventDescription').value,
        date:            document.getElementById('eventDate').value,
        time:            document.getElementById('eventTime').value,
        venue:           document.getElementById('eventVenue').value,
        category:        document.getElementById('eventCategory').value,
        maxParticipants: parseInt(document.getElementById('eventMaxParticipants').value, 10),
      }),
    });
    showToast('Event created successfully!', 'success');
    document.getElementById('createEventForm').reset();
    switchAdminTab('manage');
    loadAllEvents();
    updateStats();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteEvent(eventId) {
  if (!confirm('Are you sure you want to delete this event?')) return;
  try {
    await apiFetch(`/events/${eventId}`, { method: 'DELETE' });
    showToast('Event deleted', 'info');
    loadAdminEvents();
    loadAllEvents();
    updateStats();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function loadParticipantEventSelect() {
  try {
    const events = await apiFetch('/events');
    const select = document.getElementById('participantEventSelect');
    select.innerHTML = '<option value="">Choose an event...</option>' +
      events.map(ev => `<option value="${ev._id}">${ev.title} (${ev.currentParticipants}/${ev.maxParticipants})</option>`).join('');
  } catch (err) {
    console.error(err);
  }
}

async function loadParticipants() {
  const eventId = document.getElementById('participantEventSelect').value;
  const container = document.getElementById('participantsList');

  if (!eventId) { container.innerHTML = ''; return; }

  try {
    const regs = await apiFetch(`/registrations/event/${eventId}`);
    if (!regs.length) {
      container.innerHTML = '<p class="empty-state">No participants registered yet.</p>';
      return;
    }

    container.innerHTML = `
      <table class="participants-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Email</th>
            <th>Department</th>
            <th>Phone</th>
            <th>Registered On</th>
          </tr>
        </thead>
        <tbody>
          ${regs.map((reg, i) => {
            const regDate = new Date(reg.registrationDate).toLocaleDateString('en-IN');
            return `
              <tr>
                <td>${i + 1}</td>
                <td>${reg.student?.name || '–'}</td>
                <td>${reg.student?.email || '–'}</td>
                <td>${reg.student?.department || '–'}</td>
                <td>${reg.student?.phone || '–'}</td>
                <td>${regDate}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ═══════ Stats ═════════════════════════════════════════════════

function updateStats() {
  animateCounter('statEvents', allEvents.length);
  const totalRegs = allEvents.reduce((s, ev) => s + ev.currentParticipants, 0);
  animateCounter('statRegistrations', totalRegs);
  // Approximate unique students (just use registration count for display)
  animateCounter('statStudents', Math.min(totalRegs, totalRegs));
}

function animateCounter(elementId, target) {
  const el = document.getElementById(elementId);
  const duration = 800;
  const start = parseInt(el.textContent) || 0;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(start + (target - start) * eased);
    if (progress < 1) requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}

// ═══════ Modals ════════════════════════════════════════════════

function showModal(id) {
  document.getElementById(`modal-${id}`).classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  document.getElementById(`modal-${id}`).classList.remove('active');
  document.body.style.overflow = '';
}

function closeModalOnOverlay(e, id) {
  if (e.target === e.currentTarget) closeModal(id);
}

function switchModal(from, to) {
  closeModal(from);
  setTimeout(() => showModal(to), 200);
}

// ═══════ Toast ═════════════════════════════════════════════════

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(60px)';
    toast.style.transition = '0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
