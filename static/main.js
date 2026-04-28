/* ============================================= */
/*  جسيمات الخلفية - Background Particles        */
/* ============================================= */
const bgCanvas = document.getElementById('bg-canvas');
const bgCtx = bgCanvas ? bgCanvas.getContext('2d') : null;
let particles = [];
const PARTICLE_COUNT = 60;

function resizeCanvas() {
    if (!bgCanvas) return;
    bgCanvas.width = window.innerWidth;
    bgCanvas.height = window.innerHeight;
}

function createParticles() {
    if (!bgCanvas) return;
    particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
            x: Math.random() * bgCanvas.width,
            y: Math.random() * bgCanvas.height,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            radius: Math.random() * 2 + 0.5,
            opacity: Math.random() * 0.3 + 0.05,
            color: Math.random() > 0.7 ? '212,162,58' : '168,162,158'
        });
    }
}

function animateParticles() {
    if (!bgCtx || !bgCanvas) return;
    bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
    particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = bgCanvas.width;
        if (p.x > bgCanvas.width) p.x = 0;
        if (p.y < 0) p.y = bgCanvas.height;
        if (p.y > bgCanvas.height) p.y = 0;
        bgCtx.beginPath();
        bgCtx.arc(p.x, p.y, Math.max(0.1, p.radius), 0, Math.PI * 2);
        bgCtx.fillStyle = `rgba(${p.color}, ${p.opacity})`;
        bgCtx.fill();
    });
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 150) {
                bgCtx.beginPath();
                bgCtx.moveTo(particles[i].x, particles[i].y);
                bgCtx.lineTo(particles[j].x, particles[j].y);
                bgCtx.strokeStyle = `rgba(212,162,58, ${0.04 * (1 - dist / 150)})`;
                bgCtx.lineWidth = 0.5;
                bgCtx.stroke();
            }
        }
    }
    requestAnimationFrame(animateParticles);
}

resizeCanvas();
createParticles();
animateParticles();
window.addEventListener('resize', () => { resizeCanvas(); createParticles(); });

/* ============================================= */
/*  جسيمات شاشة الترحيب                          */
/* ============================================= */
(function createWelcomeParticles() {
    const container = document.getElementById('welcome-particles');
    if (!container) return;
    for (let i = 0; i < 20; i++) {
        const p = document.createElement('div');
        p.className = 'welcome-particle';
        p.style.left = Math.random() * 100 + '%';
        p.style.top = 50 + Math.random() * 50 + '%';
        p.style.animationDelay = Math.random() * 3 + 's';
        p.style.animationDuration = (2 + Math.random() * 2) + 's';
        container.appendChild(p);
    }
})();

/* ============================================= */
/*  إدارة الحالة العامة                           */
/* ============================================= */
// Initialize currentUser properly: only if authenticated
let currentUser = (window.DJANGO_USER && window.DJANGO_USER.isAuthenticated) ? window.DJANGO_USER : null;
let tasks = [];
let categories = [];
let activities = [];
let notifications = [];
let currentFilter = 'all';
let deleteTargetId = null;
let calendarDate = new Date();
let selectedCalendarDay = null;
let weeklyChart = null;
let categoryChart = null;

const priorityNames = {
    high: 'عالية',
    medium: 'متوسطة',
    low: 'منخفضة'
};

const priorityColors = {
    high: '#f87171',
    medium: '#d4a23a',
    low: '#34d399'
};

const arabicDays = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const arabicMonths = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

/* ============================================= */
/*  إدارة الوضع - Theme Management               */
/* ============================================= */
let currentTheme = localStorage.getItem('naseej_theme') || 'dark';
document.documentElement.setAttribute('data-theme', currentTheme);

function toggleTheme() {
    const html = document.documentElement;
    const authToggleBtn = document.getElementById('theme-toggle');
    const topbarIcon = document.getElementById('theme-icon');

    if (currentTheme === 'dark') {
        currentTheme = 'light';
        html.setAttribute('data-theme', 'light');
        if (authToggleBtn) {
            const icon = authToggleBtn.querySelector('i');
            const span = authToggleBtn.querySelector('span');
            if (icon) icon.className = 'fas fa-sun';
            if (span) span.textContent = 'الوضع الفاتح';
        }
        if (topbarIcon) topbarIcon.className = 'fas fa-sun';
    } else {
        currentTheme = 'dark';
        html.setAttribute('data-theme', 'dark');
        if (authToggleBtn) {
            const icon = authToggleBtn.querySelector('i');
            const span = authToggleBtn.querySelector('span');
            if (icon) icon.className = 'fas fa-moon';
            if (span) span.textContent = 'الوضع المظلم';
        }
        if (topbarIcon) topbarIcon.className = 'fas fa-moon';
    }
    localStorage.setItem('naseej_theme', currentTheme);
}

function initTheme() {
    const authToggleBtn = document.getElementById('theme-toggle');
    const topbarIcon = document.getElementById('theme-icon');
    if (authToggleBtn) {
        const icon = authToggleBtn.querySelector('i');
        const span = authToggleBtn.querySelector('span');
        if (currentTheme === 'light') {
            if (icon) icon.className = 'fas fa-sun';
            if (span) span.textContent = 'الوضع الفاتح';
        } else {
            if (icon) icon.className = 'fas fa-moon';
            if (span) span.textContent = 'الوضع المظلم';
        }
    }
    if (topbarIcon) {
        topbarIcon.className = currentTheme === 'light' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

/* ============================================= */
/*  CSRF Token                                    */
/* ============================================= */
function getCSRFToken() {
    const name = 'csrftoken';
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    if (!cookieValue) {
        const csrfInput = document.querySelector('[name=csrfmiddlewaretoken]');
        if (csrfInput) cookieValue = csrfInput.value;
    }
    return cookieValue;
}

function apiRequest(url, method, body) {
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken()
        }
    };
    if (body) options.body = JSON.stringify(body);
    return fetch(url, options).then(r => r.json());
}

/* ============================================= */
/*  شاشة الترحيب                                 */
/* ============================================= */
setTimeout(() => {
    const ws = document.getElementById('welcome-screen');
    if (ws) {
        ws.classList.add('hide');
        setTimeout(() => {
            ws.style.display = 'none';
            if (currentUser && currentUser.isAuthenticated) {
                initApp();
            } else {
                const authScreen = document.getElementById('auth-screen');
                if (authScreen) authScreen.style.display = 'flex';
                initTheme();
            }
        }, 800);
    } else {
        // Welcome screen missing - initialize directly
        if (currentUser && currentUser.isAuthenticated) {
            initApp();
        } else {
            const authScreen = document.getElementById('auth-screen');
            if (authScreen) authScreen.style.display = 'flex';
            initTheme();
        }
    }
}, 2500);

/* ============================================= */
/*  نظام المصادقة                                 */
/* ============================================= */
function switchAuthTab(tab) {
    const authTabs = document.querySelectorAll('.auth-tab');
    const loginTab = authTabs[0];
    const signupTab = authTabs[1];
    const indicator = document.getElementById('auth-indicator');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const errorEl = document.getElementById('auth-error');
    if (errorEl) errorEl.style.display = 'none';

    if (tab === 'login') {
        loginTab.classList.add('active');
        signupTab.classList.remove('active');
        indicator.classList.remove('signup');
        loginForm.classList.add('active');
        signupForm.classList.remove('active');
    } else {
        signupTab.classList.add('active');
        loginTab.classList.remove('active');
        indicator.classList.add('signup');
        signupForm.classList.add('active');
        loginForm.classList.remove('active');
    }
}

function togglePassword(inputId, btn) {
    const input = document.getElementById(inputId);
    const icon = btn.querySelector('i');
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

function checkPasswordStrength(password) {
    const strengthEl = document.getElementById('password-strength');
    const fillEl = document.getElementById('password-strength-fill');
    const textEl = document.getElementById('password-strength-text');
    if (!strengthEl) return;

    if (password.length === 0) { strengthEl.style.display = 'none'; return; }

    strengthEl.style.display = 'block';
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 1;
    if (/\d/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;

    fillEl.className = 'password-strength-fill';
    if (strength <= 2) {
        fillEl.classList.add('weak');
        textEl.textContent = 'قوة كلمة المرور: ضعيفة';
        textEl.style.color = 'var(--danger)';
    } else if (strength === 3) {
        fillEl.classList.add('medium');
        textEl.textContent = 'قوة كلمة المرور: متوسطة';
        textEl.style.color = 'var(--warning)';
    } else {
        fillEl.classList.add('strong');
        textEl.textContent = 'قوة كلمة المرور: قوية';
        textEl.style.color = 'var(--success)';
    }
}

function showAuthError(msg) {
    const el = document.getElementById('auth-error');
    if (!el) return;
    el.textContent = msg;
    el.style.display = 'block';
    el.style.animation = 'none';
    el.offsetHeight;
    el.style.animation = 'shakeError 0.4s ease';
}

function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    apiRequest('/api/login/', 'POST', { username: email, password })
        .then(data => {
            if (data.success) {
                currentUser = {
                    username: data.user.username,
                    email: data.user.email,
                    firstName: data.user.first_name,
                    lastName: data.user.last_name,
                    isAuthenticated: true
                };
                document.getElementById('auth-screen').style.display = 'none';
                initApp();
                showToast('success', 'تم تسجيل الدخول بنجاح');
            } else {
                showAuthError(data.error || 'حدث خطأ أثناء تسجيل الدخول');
            }
        })
        .catch(() => showAuthError('حدث خطأ في الاتصال بالخادم'));
}

function handleSignup(e) {
    e.preventDefault();
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const confirm = document.getElementById('signup-confirm').value;

    if (name.length < 3) { showAuthError('يجب أن يكون الاسم 3 أحرف على الأقل'); return; }
    if (email.length < 5) { showAuthError('البريد الإلكتروني غير صالح'); return; }
    if (password.length < 6) { showAuthError('يجب أن تكون كلمة المرور 6 أحرف على الأقل'); return; }
    if (password !== confirm) { showAuthError('كلمتا المرور غير متطابقتين'); return; }

    const nameParts = name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    apiRequest('/api/register/', 'POST', {
        username: email,  // Use email as username for simplicity
        email: email,
        password: password,
        first_name: firstName,
        last_name: lastName
    })
    .then(data => {
        if (data.success) {
             currentUser = {
                 username: data.user.username,
                 email: data.user.email,
                 firstName: data.user.first_name,
                 lastName: data.user.last_name,
                 isAuthenticated: true
             };
            document.getElementById('auth-screen').style.display = 'none';
            initApp();
            showToast('success', 'تم إنشاء الحساب بنجاح!');
        } else {
            showAuthError(data.error || 'حدث خطأ أثناء إنشاء الحساب');
        }
    })
    .catch(() => showAuthError('حدث خطأ في الاتصال بالخادم'));
}

function handleLogout() {
    apiRequest('/api/logout/', 'POST')
        .then(() => {
            currentUser = null;
            tasks = [];
            categories = [];
            activities = [];
            notifications = [];
            document.getElementById('app-screen').style.display = 'none';
            document.getElementById('auth-screen').style.display = 'flex';
            const loginForm = document.getElementById('login-form');
            const signupForm = document.getElementById('signup-form');
            if (loginForm) loginForm.reset();
            if (signupForm) signupForm.reset();
            const errEl = document.getElementById('auth-error');
            if (errEl) errEl.style.display = 'none';
            switchAuthTab('login');
            closeUserDropdown();
            showToast('info', 'تم تسجيل الخروج بنجاح');
        })
        .catch(() => {
            window.location.href = '/';
        });
}

/* ============================================= */
/*  تهيئة التطبيق                                */
/* ============================================= */
function initApp() {
    const appScreen = document.getElementById('app-screen');
    if (appScreen) appScreen.style.display = 'block';
    initTheme();
    updateUserUI();
    loadDataFromServer();

    const now = new Date();
    const dayName = arabicDays[now.getDay()];
    const dateStr = now.getDate() + ' ' + arabicMonths[now.getMonth()] + ' ' + now.getFullYear();
    const dateText = document.getElementById('dashboard-date-text');
    if (dateText) dateText.textContent = dayName + '، ' + dateStr;
}

function loadDataFromServer() {
    Promise.all([
        apiRequest('/api/tasks/', 'GET'),
        apiRequest('/api/categories/', 'GET'),
        apiRequest('/api/stats/', 'GET')
    ]).then(([tasksRes, catsRes, statsRes]) => {
        if (tasksRes.success) {
            tasks = tasksRes.tasks.map(t => ({
                id: t.id,
                title: t.title,
                desc: t.description || '',
                category: t.category ? t.category.id : null,
                categoryName: t.category ? t.category.name : null,
                priority: t.priority,
                date: t.due_date || null,
                completed: t.is_completed,
                createdAt: new Date(t.created_at).getTime()
            }));
        }
        if (catsRes.success) {
            categories = catsRes.categories;
            populateCategoryDropdowns();
        }
        updateAllStats();
        renderDashboard();
        renderTasksList();
        renderCalendar();
        renderStatsView();
        addNotification('مرحباً بعودتك!', 'info');
    }).catch(err => {
        console.error('Error loading data:', err);
        showToast('error', 'حدث خطأ في تحميل البيانات');
    });
}

function populateCategoryDropdowns() {
    const filterCat = document.getElementById('filter-category');
    const taskCat = document.getElementById('task-category-input');

    if (filterCat) {
        filterCat.innerHTML = '<option value="all">كل الفئات</option>';
        categories.forEach(c => {
            filterCat.innerHTML += `<option value="${c.id}">${c.name}</option>`;
        });
    }
    if (taskCat) {
        taskCat.innerHTML = '<option value="">بدون فئة</option>';
        categories.forEach(c => {
            taskCat.innerHTML += `<option value="${c.id}">${c.name}</option>`;
        });
    }
}

function updateUserUI() {
    if (!currentUser) return;
    const displayName = ((currentUser.firstName || '') + ' ' + (currentUser.lastName || '')).trim() || currentUser.username;
    const initial = displayName.charAt(0);
    const email = currentUser.email || '';

    const setTextIfExists = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    };
    const setValueIfExists = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val;
    };

    setTextIfExists('sidebar-avatar', initial);
    setTextIfExists('sidebar-username', displayName);
    setTextIfExists('sidebar-email', email);
    setTextIfExists('topbar-avatar', initial);
    setTextIfExists('topbar-username', displayName);
    setTextIfExists('dashboard-username', displayName);
    setTextIfExists('settings-avatar', initial);
    setTextIfExists('settings-display-name', displayName);
    setTextIfExists('settings-display-email', email);
    setValueIfExists('settings-first-name', currentUser.firstName || '');
    setValueIfExists('settings-last-name', currentUser.lastName || '');
    setValueIfExists('settings-email-input', email);
}

/* ============================================= */
/*  التنقل بين الصفحات                           */
/* ============================================= */
function switchView(viewName) {
    document.querySelectorAll('.nav-item[data-view]').forEach(item => {
        item.classList.toggle('active', item.dataset.view === viewName);
    });
    document.querySelectorAll('.page-view').forEach(view => view.classList.remove('active'));
    const targetView = document.getElementById('view-' + viewName);
    if (targetView) targetView.classList.add('active');
    if (window.innerWidth <= 768) closeSidebar();

    if (viewName === 'dashboard') renderDashboard();
    if (viewName === 'tasks') renderTasksList();
    if (viewName === 'calendar') renderCalendar();
    if (viewName === 'stats') renderStatsView();
}

/* ============================================= */
/*  الشريط الجانبي                               */
/* ============================================= */
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (window.innerWidth <= 768) {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('show');
    } else {
        sidebar.classList.toggle('collapsed');
        document.getElementById('main-area').classList.toggle('expanded');
    }
}

function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebar-overlay').classList.remove('show');
}

/* ============================================= */
/*  القوائم المنسدلة                              */
/* ============================================= */
function toggleNotifications() {
    document.getElementById('notifications-dropdown').classList.toggle('show');
    closeUserDropdown();
}

function toggleUserDropdown() {
    document.getElementById('user-dropdown').classList.toggle('show');
    document.getElementById('notifications-dropdown').classList.remove('show');
}

function closeUserDropdown() {
    const el = document.getElementById('user-dropdown');
    if (el) el.classList.remove('show');
}

document.addEventListener('click', (e) => {
    if (!e.target.closest('.topbar-action-btn') && !e.target.closest('.notifications-dropdown')) {
        const nd = document.getElementById('notifications-dropdown');
        if (nd) nd.classList.remove('show');
    }
    if (!e.target.closest('.topbar-user-btn') && !e.target.closest('.user-dropdown')) {
        const ud = document.getElementById('user-dropdown');
        if (ud) ud.classList.remove('show');
    }
});

/* ============================================= */
/*  الإشعارات                                    */
/* ============================================= */
function addNotification(text, type) {
    notifications.unshift({ text, type, time: Date.now(), read: false });
    if (notifications.length > 20) notifications.pop();
    updateNotificationUI();
}

function updateNotificationUI() {
    const list = document.getElementById('notifications-list');
    const unread = notifications.filter(n => !n.read).length;
    const dot = document.getElementById('notif-dot');
    if (dot) dot.style.display = unread > 0 ? 'block' : 'none';
    if (!list) return;

    if (notifications.length === 0) {
        list.innerHTML = '<div class="notifications-empty">لا توجد إشعارات جديدة</div>';
        return;
    }

    list.innerHTML = notifications.slice(0, 10).map(n => `
        <div class="notification-item ${n.read ? '' : 'unread'}">
            <div class="notification-dot ${n.read ? 'read' : ''}"></div>
            <div class="notification-content">
                <p>${escapeHtml(n.text)}</p>
                <small>${timeAgo(n.time)}</small>
            </div>
        </div>
    `).join('');
}

function clearNotifications() {
    notifications.forEach(n => n.read = true);
    updateNotificationUI();
}

/* ============================================= */
/*  إشعارات Toast                                */
/* ============================================= */
function showToast(type, message) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const icons = { success: 'fa-check', error: 'fa-times', warning: 'fa-exclamation', info: 'fa-info' };
    const toast = document.createElement('div');
    toast.className = `toast-item ${type}`;
    toast.innerHTML = `
        <div class="toast-icon"><i class="fas ${icons[type]}"></i></div>
        <div class="toast-text">${escapeHtml(message)}</div>
        <button class="toast-close" onclick="removeToast(this.parentElement)"><i class="fas fa-times"></i></button>
    `;
    container.appendChild(toast);
    setTimeout(() => removeToast(toast), 4000);
}

function removeToast(el) {
    if (!el || !el.parentElement) return;
    el.classList.add('removing');
    setTimeout(() => { if (el.parentElement) el.parentElement.removeChild(el); }, 300);
}

/* ============================================= */
/*  وظائف مساعدة                                 */
/* ============================================= */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatDateArabic(dateStr) {
    if (!dateStr) return 'بدون موعد';
    const parts = dateStr.split('-');
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    return d.getDate() + ' ' + arabicMonths[d.getMonth()] + ' ' + d.getFullYear();
}

function isOverdue(dateStr) {
    if (!dateStr) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDate = new Date(dateStr + 'T00:00:00');
    return taskDate < today;
}

function isToday(dateStr) {
    if (!dateStr) return false;
    return dateStr === formatDate(new Date());
}

function timeAgo(timestamp) {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return 'الآن';
    if (mins < 60) return `منذ ${mins} دقيقة`;
    if (hours < 24) return `منذ ${hours} ساعة`;
    if (days < 7) return `منذ ${days} يوم`;
    return formatDateArabic(formatDate(new Date(timestamp)));
}

function getCategoryName(catId) {
    if (!catId) return 'بدون فئة';
    const cat = categories.find(c => c.id === catId);
    return cat ? cat.name : 'بدون فئة';
}

/* ============================================= */
/*  الغبار الذهبي                                */
/* ============================================= */
function createGoldenSparkles(x, y) {
    const count = 18;
    for (let i = 0; i < count; i++) {
        const sparkle = document.createElement('div');
        sparkle.className = 'golden-sparkle';
        const angle = (Math.PI * 2 * i) / count;
        const distance = 40 + Math.random() * 60;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;
        sparkle.style.setProperty('--tx', `${tx}px`);
        sparkle.style.setProperty('--ty', `${ty}px`);
        sparkle.style.left = x + 'px';
        sparkle.style.top = y + 'px';
        sparkle.style.width = (3 + Math.random() * 5) + 'px';
        sparkle.style.height = sparkle.style.width;
        document.body.appendChild(sparkle);
        setTimeout(() => { if (sparkle.parentElement) sparkle.parentElement.removeChild(sparkle); }, 900);
    }
}

/* ============================================= */
/*  تحديث الإحصائيات                             */
/* ============================================= */
function updateAllStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = tasks.filter(t => !t.completed).length;
    const overdue = tasks.filter(t => !t.completed && isOverdue(t.date)).length;

    animateNumber('stat-total', total);
    animateNumber('stat-pending', pending);
    animateNumber('stat-completed', completed);
    animateNumber('stat-overdue', overdue);

    const pendingBadge = document.getElementById('pending-badge');
    if (pendingBadge) pendingBadge.textContent = pending;

    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    const trendEl = document.getElementById('stat-completed-trend');
    if (trendEl) trendEl.innerHTML = `<i class="fas fa-arrow-up"></i><span>${percent}% نسبة الإنجاز</span>`;

    const weekAgo = Date.now() - 7 * 86400000;
    const weekTasks = tasks.filter(t => t.createdAt > weekAgo).length;
    const totalTrend = document.getElementById('stat-total-trend');
    if (totalTrend) totalTrend.innerHTML = `<i class="fas fa-arrow-up"></i><span>${weekTasks} هذا الأسبوع</span>`;
}

function animateNumber(elementId, target) {
    const el = document.getElementById(elementId);
    if (!el) return;
    const current = parseInt(el.textContent) || 0;
    if (current === target) return;
    const duration = 500;
    const start = performance.now();
    function update(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(current + (target - current) * eased);
        if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

/* ============================================= */
/*  لوحة التحكم                                  */
/* ============================================= */
function renderDashboard() {
    updateAllStats();
    renderWeeklyChart();
    renderRecentActivity();
    renderUrgentTasks();
}

function renderWeeklyChart() {
    const ctx = document.getElementById('weekly-chart');
    if (!ctx) return;
    if (weeklyChart) weeklyChart.destroy();

    const labels = [];
    const completedData = [];
    const pendingData = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = formatDate(d);
        labels.push(arabicDays[d.getDay()]);
        completedData.push(tasks.filter(t => t.completed && t.date === dateStr).length);
        pendingData.push(tasks.filter(t => !t.completed && t.date === dateStr).length);
    }

    weeklyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'مكتملة',
                    data: completedData,
                    backgroundColor: 'rgba(212, 162, 58, 0.7)',
                    borderColor: 'rgba(212, 162, 58, 1)',
                    borderWidth: 1, borderRadius: 6, borderSkipped: false,
                },
                {
                    label: 'قيد الانتظار',
                    data: pendingData,
                    backgroundColor: 'rgba(103, 232, 249, 0.4)',
                    borderColor: 'rgba(103, 232, 249, 0.8)',
                    borderWidth: 1, borderRadius: 6, borderSkipped: false,
                }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top', align: 'start',
                    labels: { color: '#a8a29e', font: { family: 'Tajawal', size: 12 }, padding: 16, usePointStyle: true, pointStyleWidth: 10 }
                },
                tooltip: {
                    backgroundColor: '#1c1917', titleColor: '#fafaf9', bodyColor: '#a8a29e',
                    borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1, cornerRadius: 8,
                    titleFont: { family: 'Tajawal' }, bodyFont: { family: 'Tajawal' }, padding: 12
                }
            },
            scales: {
                x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#78716c', font: { family: 'Tajawal', size: 11 } }, border: { display: false } },
                y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#78716c', font: { family: 'Tajawal', size: 11 }, stepSize: 1, callback: function(v) { return Number.isInteger(v) ? v : ''; } }, border: { display: false } }
            }
        }
    });
}

function renderRecentActivity() {
    const container = document.getElementById('recent-activity');
    if (!container) return;
    if (activities.length === 0) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-inbox"></i><h3>لا توجد أنشطة بعد</h3><p>ابدأ بإضافة مهامك الأولى</p></div>`;
        return;
    }
    const typeIcons = { add: 'fa-plus', done: 'fa-check', delete: 'fa-trash', edit: 'fa-pen' };
    const typeClasses = { add: 'add', done: 'done', delete: 'delete', edit: 'edit' };
    container.innerHTML = activities.slice(0, 8).map(a => `
        <div class="activity-item">
            <div class="activity-icon ${typeClasses[a.type] || 'add'}"><i class="fas ${typeIcons[a.type] || 'fa-circle'}"></i></div>
            <div class="activity-text"><p>${escapeHtml(a.text)}</p></div>
            <span class="activity-time">${timeAgo(a.time)}</span>
        </div>
    `).join('');
}

function renderUrgentTasks() {
    const container = document.getElementById('urgent-tasks-list');
    if (!container) return;
    const urgentTasks = tasks.filter(t => !t.completed && (t.priority === 'high' || isOverdue(t.date)))
        .sort((a, b) => {
            if (isOverdue(a.date) && !isOverdue(b.date)) return -1;
            if (!isOverdue(a.date) && isOverdue(b.date)) return 1;
            if (a.priority === 'high' && b.priority !== 'high') return -1;
            if (a.priority !== 'high' && b.priority === 'high') return 1;
            return 0;
        }).slice(0, 5);

    if (urgentTasks.length === 0) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-check-circle"></i><h3>لا توجد مهام عاجلة</h3><p>أحسنت! لا توجد مهام متأخرة أو عالية الأولوية حالياً</p></div>`;
        return;
    }
    container.innerHTML = urgentTasks.map(t => renderTaskCard(t)).join('');
}

function renderTaskCard(t) {
    const overdueClass = !t.completed && isOverdue(t.date) ? 'overdue' : '';
    const dateLabel = isOverdue(t.date) ? 'متأخرة!' : formatDateArabic(t.date);
    const completedClass = t.completed ? 'completed-task' : '';
    const checkedClass = t.completed ? 'checked' : '';
    const catName = t.categoryName || getCategoryName(t.category);

    return `
        <div class="task-card ${completedClass}" data-task-id="${t.id}" style="margin-bottom: 10px;">
            <div class="task-priority-bar ${t.priority}"></div>
            <button class="task-check-btn ${checkedClass}" onclick="toggleTaskComplete(${t.id}, event)" aria-label="${t.completed ? 'إلغاء الإكمال' : 'إكمال المهمة'}">
                ${t.completed ? '<i class="fas fa-check"></i>' : ''}
            </button>
            <div class="task-body">
                <div class="task-title-text">${escapeHtml(t.title)}</div>
                ${t.desc ? `<div class="task-desc-text">${escapeHtml(t.desc)}</div>` : ''}
                <div class="task-meta">
                    ${catName !== 'بدون فئة' ? `<span class="task-meta-tag category"><i class="fas fa-tag"></i> ${escapeHtml(catName)}</span>` : ''}
                    <span class="task-meta-tag priority-${t.priority}">${priorityNames[t.priority]}</span>
                    ${t.date ? `<span class="task-meta-tag ${overdueClass}"><i class="fas fa-calendar"></i> ${dateLabel}</span>` : ''}
                </div>
            </div>
            <div class="task-actions">
                <button class="task-action-btn edit" onclick="openEditTaskModal(${t.id})" data-tooltip="تعديل" aria-label="تعديل"><i class="fas fa-pen"></i></button>
                <button class="task-action-btn delete" onclick="openDeleteModal(${t.id})" data-tooltip="حذف" aria-label="حذف"><i class="fas fa-trash"></i></button>
            </div>
        </div>`;
}

/* ============================================= */
/*  إدارة المهام                                 */
/* ============================================= */
function openTaskModal() {
    document.getElementById('task-modal-title').textContent = 'إضافة مهمة جديدة';
    document.getElementById('task-submit-text').textContent = 'إضافة المهمة';
    document.getElementById('task-edit-id').value = '';
    document.getElementById('task-form').reset();
    document.getElementById('task-date-input').value = formatDate(new Date());
    document.getElementById('task-modal').classList.add('show');
}

function openEditTaskModal(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    document.getElementById('task-modal-title').textContent = 'تعديل المهمة';
    document.getElementById('task-submit-text').textContent = 'حفظ التعديلات';
    document.getElementById('task-edit-id').value = task.id;
    document.getElementById('task-title-input').value = task.title;
    document.getElementById('task-desc-input').value = task.desc || '';
    document.getElementById('task-category-input').value = task.category || '';
    document.getElementById('task-priority-input').value = task.priority;
    document.getElementById('task-date-input').value = task.date || '';
    document.getElementById('task-modal').classList.add('show');
}

function closeTaskModal() {
    document.getElementById('task-modal').classList.remove('show');
    document.getElementById('task-form').reset();
    document.getElementById('task-edit-id').value = '';
    const errEl = document.getElementById('task-title-error');
    if (errEl) errEl.style.display = 'none';
}

function handleTaskSubmit(e) {
    e.preventDefault();
    const title = document.getElementById('task-title-input').value.trim();
    const desc = document.getElementById('task-desc-input').value.trim();
    const categoryId = document.getElementById('task-category-input').value || null;
    const priority = document.getElementById('task-priority-input').value;
    const date = document.getElementById('task-date-input').value || null;
    const editId = document.getElementById('task-edit-id').value;

    if (!title) {
        document.getElementById('task-title-error').style.display = 'block';
        return;
    }
    document.getElementById('task-title-error').style.display = 'none';

    if (editId) {
        apiRequest(`/api/tasks/${editId}/`, 'POST', {
            title, description: desc,
            category_id: categoryId ? parseInt(categoryId) : null,
            priority, due_date: date
        }).then(data => {
            if (data.success) {
                const idx = tasks.findIndex(t => t.id === parseInt(editId));
                if (idx > -1) {
                    tasks[idx].title = data.task.title;
                    tasks[idx].desc = data.task.description;
                    tasks[idx].priority = data.task.priority;
                    tasks[idx].date = data.task.due_date;
                    tasks[idx].category = data.task.category ? data.task.category.id : null;
                    tasks[idx].categoryName = data.task.category ? data.task.category.name : null;
                }
                activities.unshift({ type: 'edit', text: `تم تعديل "${title}"`, time: Date.now() });
                addNotification(`تم تعديل المهمة: ${title}`, 'warning');
                showToast('success', 'تم تعديل المهمة بنجاح');
                closeTaskModal();
                refreshCurrentView();
            } else {
                showToast('error', data.error || 'حدث خطأ');
            }
        }).catch(() => showToast('error', 'حدث خطأ في الاتصال'));
    } else {
        apiRequest('/api/tasks/create/', 'POST', {
            title, description: desc,
            category_id: categoryId ? parseInt(categoryId) : null,
            priority, due_date: date
        }).then(data => {
            if (data.success) {
                tasks.unshift({
                    id: data.task.id,
                    title: data.task.title,
                    desc: data.task.description,
                    category: data.task.category ? data.task.category.id : null,
                    categoryName: data.task.category ? data.task.category.name : null,
                    priority: data.task.priority,
                    date: data.task.due_date,
                    completed: data.task.is_completed,
                    createdAt: new Date(data.task.created_at).getTime()
                });
                activities.unshift({ type: 'add', text: `تمت إضافة "${title}"`, time: Date.now() });
                addNotification(`مهمة جديدة: ${title}`, 'info');
                showToast('success', 'تمت إضافة المهمة بنجاح');
                closeTaskModal();
                refreshCurrentView();
            } else {
                showToast('error', data.error || 'حدث خطأ');
            }
        }).catch(() => showToast('error', 'حدث خطأ في الاتصال'));
    }
}

function toggleTaskComplete(taskId, event) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newStatus = !task.completed;
    apiRequest(`/api/tasks/${taskId}/`, 'POST', { is_completed: newStatus })
        .then(data => {
            if (data.success) {
                task.completed = newStatus;
                if (newStatus) {
                    if (event) {
                        const rect = event.target.getBoundingClientRect();
                        createGoldenSparkles(rect.left + rect.width / 2, rect.top + rect.height / 2);
                    }
                    activities.unshift({ type: 'done', text: `تم إكمال "${task.title}"`, time: Date.now() });
                    addNotification(`تم إكمال: ${task.title}`, 'success');
                    showToast('success', 'أحسنت! تم إكمال المهمة');
                } else {
                    activities.unshift({ type: 'edit', text: `تم إلغاء إكمال "${task.title}"`, time: Date.now() });
                    showToast('info', 'تم إلغاء إكمال المهمة');
                }
                refreshCurrentView();
            }
        }).catch(() => showToast('error', 'حدث خطأ في الاتصال'));
}

function openDeleteModal(taskId) {
    deleteTargetId = taskId;
    document.getElementById('delete-modal').classList.add('show');
}

function closeDeleteModal() {
    document.getElementById('delete-modal').classList.remove('show');
    deleteTargetId = null;
}

function confirmDeleteTask() {
    if (deleteTargetId === null) return;
    const task = tasks.find(t => t.id === deleteTargetId);
    if (!task) return;
    const taskTitle = task.title;

    apiRequest(`/api/tasks/${deleteTargetId}/delete/`, 'POST')
        .then(data => {
            if (data.success) {
                const taskEl = document.querySelector(`[data-task-id="${deleteTargetId}"]`);
                if (taskEl) taskEl.classList.add('removing');
                setTimeout(() => {
                    tasks = tasks.filter(t => t.id !== deleteTargetId);
                    activities.unshift({ type: 'delete', text: `تم حذف "${taskTitle}"`, time: Date.now() });
                    addNotification(`تم حذف: ${taskTitle}`, 'error');
                    closeDeleteModal();
                    refreshCurrentView();
                    showToast('error', 'تم حذف المهمة');
                }, taskEl ? 500 : 0);
            } else {
                showToast('error', data.error || 'حدث خطأ');
                closeDeleteModal();
            }
        }).catch(() => {
            showToast('error', 'حدث خطأ في الاتصال');
            closeDeleteModal();
        });
}

function refreshCurrentView() {
    updateAllStats();
    const activeView = document.querySelector('.page-view.active');
    if (!activeView) return;
    const viewId = activeView.id;
    if (viewId === 'view-dashboard') renderDashboard();
    if (viewId === 'view-tasks') renderTasksList();
    if (viewId === 'view-calendar') renderCalendar();
    if (viewId === 'view-stats') renderStatsView();
    updateNotificationUI();
}

/* ============================================= */
/*  عرض قائمة المهام                             */
/* ============================================= */
function setTaskFilter(filter, btn) {
    currentFilter = filter;
    document.querySelectorAll('.tasks-toolbar .filter-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    applyFilters();
}

function applyFilters() { renderTasksList(); }

function renderTasksList(searchQuery) {
    const container = document.getElementById('tasks-list');
    if (!container) return;
    const filterCatEl = document.getElementById('filter-category');
    const filterPriEl = document.getElementById('filter-priority');
    const categoryFilter = filterCatEl ? filterCatEl.value : 'all';
    const priorityFilter = filterPriEl ? filterPriEl.value : 'all';
    const search = searchQuery || (document.getElementById('global-search') ? document.getElementById('global-search').value.trim().toLowerCase() : '');

    let filtered = [...tasks];

    if (currentFilter === 'pending') filtered = filtered.filter(t => !t.completed);
    else if (currentFilter === 'completed') filtered = filtered.filter(t => t.completed);
    else if (currentFilter === 'overdue') filtered = filtered.filter(t => !t.completed && isOverdue(t.date));

    if (categoryFilter !== 'all') filtered = filtered.filter(t => t.category == categoryFilter);
    if (priorityFilter !== 'all') filtered = filtered.filter(t => t.priority === priorityFilter);

    if (search) {
        filtered = filtered.filter(t =>
            t.title.toLowerCase().includes(search) ||
            (t.desc && t.desc.toLowerCase().includes(search))
        );
    }

    const priorityOrder = { high: 0, medium: 1, low: 2 };
    filtered.sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) return priorityOrder[a.priority] - priorityOrder[b.priority];
        if (a.date && b.date) return new Date(a.date) - new Date(b.date);
        return b.createdAt - a.createdAt;
    });

    const shownEl = document.getElementById('shown-count');
    const totalEl = document.getElementById('total-count');
    if (shownEl) shownEl.textContent = filtered.length;
    if (totalEl) totalEl.textContent = tasks.length;

    if (filtered.length === 0) {
        let emptyMsg = 'لا توجد مهام';
        let emptyDesc = 'ابدأ بإضافة مهمتك الأولى من الزر أعلاه';
        if (search) { emptyMsg = 'لا توجد نتائج'; emptyDesc = 'جرّب البحث بكلمات مختلفة'; }
        else if (currentFilter === 'completed') { emptyMsg = 'لا توجد مهام مكتملة'; emptyDesc = 'أكمل بعض المهام لتظهر هنا'; }
        else if (currentFilter === 'overdue') { emptyMsg = 'لا توجد مهام متأخرة'; emptyDesc = 'ممتاز! التزامك بالمواعيد رائع'; }

        container.innerHTML = `<div class="empty-state"><i class="fas ${search ? 'fa-search' : 'fa-tasks'}"></i><h3>${emptyMsg}</h3><p>${emptyDesc}</p></div>`;
        return;
    }

    container.innerHTML = filtered.map((t, idx) => {
        const card = renderTaskCard(t);
        return card.replace('style="margin-bottom: 10px;"', `style="animation-delay: ${idx * 0.04}s; margin-bottom: 10px;"`);
    }).join('');
}

function handleGlobalSearch(query) {
    const activeView = document.querySelector('.page-view.active');
    if (activeView && activeView.id === 'view-tasks') {
        renderTasksList(query);
    } else if (query.trim()) {
        switchView('tasks');
        renderTasksList(query);
    }
}

/* ============================================= */
/*  التقويم                                      */
/* ============================================= */
function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    const titleEl = document.getElementById('calendar-title');
    if (!grid || !titleEl) return;

    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    titleEl.textContent = arabicMonths[month] + ' ' + year;

    let html = arabicDays.map(d => `<div class="calendar-day-name">${d}</div>`).join('');
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    const today = formatDate(new Date());

    for (let i = firstDay - 1; i >= 0; i--) {
        html += `<div class="calendar-day other-month">${daysInPrevMonth - i}</div>`;
    }

    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const isTodayClass = dateStr === today ? 'today' : '';
        const dayTasks = tasks.filter(t => t.date === dateStr);
        const hasTaskClass = dayTasks.length > 0 ? 'has-task' : '';
        const hasHighClass = dayTasks.some(t => t.priority === 'high' && !t.completed) ? ' has-task-high' : '';
        const selectedClass = selectedCalendarDay === dateStr ? 'today' : '';
        html += `<div class="calendar-day ${isTodayClass} ${hasTaskClass}${hasHighClass} ${selectedClass}" onclick="selectCalendarDay('${dateStr}')">${d}</div>`;
    }

    const totalCells = firstDay + daysInMonth;
    const remaining = (7 - (totalCells % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
        html += `<div class="calendar-day other-month">${i}</div>`;
    }

    grid.innerHTML = html;
    renderCalendarDayTasks();
}

function changeMonth(delta) {
    calendarDate.setMonth(calendarDate.getMonth() + delta);
    selectedCalendarDay = null;
    renderCalendar();
}

function selectCalendarDay(dateStr) {
    selectedCalendarDay = dateStr;
    renderCalendar();
}

function renderCalendarDayTasks() {
    const container = document.getElementById('calendar-day-tasks');
    if (!container) return;
    if (!selectedCalendarDay) { container.innerHTML = ''; return; }

    const dayTasks = tasks.filter(t => t.date === selectedCalendarDay);
    const dateLabel = formatDateArabic(selectedCalendarDay);

    let html = `<div class="content-card"><div class="content-card-header"><h3 class="content-card-title"><i class="fas fa-calendar-day"></i> مهام ${dateLabel}</h3><span class="task-count-badge"><strong>${dayTasks.length}</strong> مهمة</span></div><div class="content-card-body">`;

    if (dayTasks.length === 0) {
        html += `<div class="empty-state" style="padding: 30px;"><i class="fas fa-calendar-check"></i><h3>لا توجد مهام في هذا اليوم</h3></div>`;
    } else {
        html += '<div class="tasks-list">' + dayTasks.map(t => renderTaskCard(t)).join('') + '</div>';
    }

    html += '</div></div>';
    container.innerHTML = html;
}

/* ============================================= */
/*  الإحصائيات                                   */
/* ============================================= */
function renderStatsView() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    const compPercent = document.getElementById('completion-percent');
    const compBar = document.getElementById('completion-bar');
    if (compPercent) compPercent.textContent = percent + '%';
    if (compBar) compBar.style.width = percent + '%';

    const highCount = tasks.filter(t => t.priority === 'high').length;
    const medCount = tasks.filter(t => t.priority === 'medium').length;
    const lowCount = tasks.filter(t => t.priority === 'low').length;
    const maxP = Math.max(highCount, medCount, lowCount, 1);

    const setBar = (countId, barId, count) => {
        const ce = document.getElementById(countId);
        const be = document.getElementById(barId);
        if (ce) ce.textContent = count;
        if (be) be.style.width = (count / maxP * 100) + '%';
    };
    setBar('priority-high-count', 'priority-high-bar', highCount);
    setBar('priority-medium-count', 'priority-medium-bar', medCount);
    setBar('priority-low-count', 'priority-low-bar', lowCount);

    const catContainer = document.getElementById('category-stats');
    if (catContainer) {
        let catHtml = '';
        categories.forEach(cat => {
            const count = tasks.filter(t => t.category === cat.id).length;
            const comp = tasks.filter(t => t.category === cat.id && t.completed).length;
            const pct = count > 0 ? Math.round(comp / count * 100) : 0;
            catHtml += `
                <div style="margin-bottom: 16px;">
                    <div class="progress-label">
                        <span><i class="fas fa-tag" style="margin-left: 6px;"></i>${escapeHtml(cat.name)}</span>
                        <span>${comp}/${count} (${pct}%)</span>
                    </div>
                    <div class="progress-bar-custom">
                        <div class="progress-fill" style="width: ${pct}%; background: var(--accent);"></div>
                    </div>
                </div>`;
        });
        if (catHtml === '') catHtml = '<p style="color: var(--text-secondary);">لا توجد فئات بعد</p>';
        catContainer.innerHTML = catHtml;
    }

    renderCategoryChart();
}

function renderCategoryChart() {
    const ctx = document.getElementById('category-chart');
    if (!ctx) return;
    if (categoryChart) categoryChart.destroy();

    const data = categories.map(c => tasks.filter(t => t.category === c.id).length);
    const labels = categories.map(c => c.name);
    const defaultColors = ['#d4a23a', '#67e8f9', '#a78bfa', '#34d399', '#f87171', '#fb923c', '#c084fc'];
    const colors = categories.map((_, i) => defaultColors[i % defaultColors.length]);
    const hasData = data.some(d => d > 0);

    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: hasData ? labels : ['لا توجد بيانات'],
            datasets: [{
                data: hasData ? data : [1],
                backgroundColor: hasData ? colors.map(c => c + 'cc') : ['rgba(255,255,255,0.05)'],
                borderColor: hasData ? colors : ['rgba(255,255,255,0.1)'],
                borderWidth: 2, hoverOffset: 8,
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, cutout: '65%',
            plugins: {
                legend: {
                    position: 'bottom', rtl: true,
                    labels: { color: '#a8a29e', font: { family: 'Tajawal', size: 12 }, padding: 20, usePointStyle: true, pointStyleWidth: 10 }
                },
                tooltip: {
                    backgroundColor: '#1c1917', titleColor: '#fafaf9', bodyColor: '#a8a29e',
                    borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1, cornerRadius: 8,
                    titleFont: { family: 'Tajawal' }, bodyFont: { family: 'Tajawal' }, padding: 12,
                    callbacks: {
                        label: function(context) {
                            if (!hasData) return 'لا توجد بيانات';
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const pct = Math.round(context.raw / total * 100);
                            return ` ${context.label}: ${context.raw} مهمة (${pct}%)`;
                        }
                    }
                }
            }
        }
    });
}

/* ============================================= */
/*  الإعدادات                                    */
/* ============================================= */
function saveProfile() {
    const firstName = document.getElementById('settings-first-name').value.trim();
    const lastName = document.getElementById('settings-last-name').value.trim();

    if (!firstName) {
        showToast('error', 'الاسم الأول مطلوب');
        return;
    }

    apiRequest('/api/user/update/', 'POST', { first_name: firstName, last_name: lastName })
        .then(data => {
            if (data.success) {
                currentUser.firstName = data.user.first_name;
                currentUser.lastName = data.user.last_name;
                updateUserUI();
                showToast('success', 'تم تحديث الملف الشخصي بنجاح');
            } else {
                showToast('error', data.error || 'حدث خطأ');
            }
        })
        .catch(() => showToast('error', 'حدث خطأ في الاتصال'));
}

function saveSetting(key, value) {
    // حفظ الإعداد محلياً
    localStorage.setItem('naseej_' + key, value);
    // يمكن إضافة API لحفظ الإعدادات لاحقاً
    showToast('success', 'تم حفظ الإعدادات');
}

function exportData() {
    const data = {
        user: currentUser,
        tasks: tasks,
        exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'naseej-tasks-backup-' + formatDate(new Date()) + '.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('success', 'تم تصدير البيانات بنجاح');
}

function clearAllData() {
    const modal = document.getElementById('delete-modal');
    const body = modal.querySelector('.modal-body-custom');
    body.innerHTML = `
        <div class="delete-modal-icon"><i class="fas fa-exclamation-triangle"></i></div>
        <div class="delete-modal-text">
            <h3>مسح جميع البيانات</h3>
            <p>سيتم حذف جميع المهام نهائياً. لا يمكن التراجع عن هذا الإجراء.</p>
        </div>
        <div class="delete-modal-footer">
            <button class="btn-danger-custom" onclick="confirmClearAllData()"><i class="fas fa-trash" style="margin-left: 6px;"></i> مسح الكل</button>
            <button class="btn-secondary-custom" onclick="restoreDeleteModal()">إلغاء</button>
        </div>`;
    modal.classList.add('show');
}

function confirmClearAllData() {
    apiRequest('/api/tasks/clear/', 'POST')
        .then(data => {
            if (data.success) {
                tasks = [];
                activities = [];
                notifications = [];
                restoreDeleteModal();
                refreshCurrentView();
                showToast('warning', 'تم مسح جميع البيانات');
            }
        })
        .catch(() => showToast('error', 'حدث خطأ في الاتصال'));
}

function restoreDeleteModal() {
    const modal = document.getElementById('delete-modal');
    const body = modal.querySelector('.modal-body-custom');
    body.innerHTML = `
        <div class="delete-modal-icon"><i class="fas fa-trash-alt"></i></div>
        <div class="delete-modal-text">
            <h3>حذف المهمة</h3>
            <p>هل أنت متأكد من حذف هذه المهمة؟ لا يمكن التراجع عن هذا الإجراء.</p>
        </div>
        <div class="delete-modal-footer">
            <button class="btn-danger-custom" id="confirm-delete-btn" onclick="confirmDeleteTask()"><i class="fas fa-trash" style="margin-left: 6px;"></i> حذف</button>
            <button class="btn-secondary-custom" onclick="closeDeleteModal()">إلغاء</button>
        </div>`;
    modal.classList.remove('show');
    deleteTargetId = null;
}

/* ============================================= */
/*  إغلاق المودالات والاختصارات                   */
/* ============================================= */
const taskModal = document.getElementById('task-modal');
if (taskModal) taskModal.addEventListener('click', function(e) { if (e.target === this) closeTaskModal(); });

const deleteModal = document.getElementById('delete-modal');
if (deleteModal) deleteModal.addEventListener('click', function(e) { if (e.target === this) closeDeleteModal(); });

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeTaskModal();
        closeDeleteModal();
        const nd = document.getElementById('notifications-dropdown');
        if (nd) nd.classList.remove('show');
        closeUserDropdown();
    }
});

document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        if (currentUser) openTaskModal();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (currentUser) {
            const searchInput = document.getElementById('global-search');
            if (searchInput) searchInput.focus();
        }
    }
});

/* ============================================= */
/*  مراقبة تغيير حجم النافذة                     */
/* ============================================= */
let resizeTimeout;
window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        if (window.innerWidth > 768) closeSidebar();
        if (currentUser) {
            if (weeklyChart) renderWeeklyChart();
            if (categoryChart) renderCategoryChart();
        }
    }, 250);
});
