// Mock Data
const departments = [
    { id: 'cs', name: 'Computer Science' },
    { id: 'ee', name: 'Electrical Eng.' },
    { id: 'me', name: 'Mechanical Eng.' },
    { id: 'admin', name: 'Administration' },
    { id: 'exam', name: 'Examination Cell' }
];

const mockNotices = [
    {
        id: 1,
        title: "Mid-Semester Examination Schedule - Spring 2026",
        description: "The mid-semester examinations for all B.Tech programs will commence from February 20th. Detailed date sheets are available at the department notice board.",
        date: "2026-02-05",
        department: "exam",
        category: "academic",
        urgent: true
    },
    {
        id: 2,
        title: "Guest Lecture on AI & Robotics",
        description: "A guest lecture by Dr. Alan Smith from MIT is scheduled for Feb 10th in the Main Auditorium. All students are encouraged to attend.",
        date: "2026-02-06",
        department: "cs",
        category: "event",
        urgent: false
    },
    {
        id: 3,
        title: "Holy Festival Holiday",
        description: "The institute will remain closed on 12th February usually. Happy holidays to all students and staff.",
        date: "2026-02-04",
        department: "admin",
        category: "holiday",
        urgent: false
    },
    {
        id: 4,
        title: "Campus Recruitment Drive - TechCorp",
        description: "TechCorp will be visiting our campus for recruitment on Feb 15th. Eligibility: 7.5 CGPA and above. Register by Feb 10th.",
        date: "2026-02-07",
        department: "placement",
        category: "placement",
        urgent: true
    }
];

const mockEvents = [
    {
        id: 1,
        title: "AI Workshop",
        date: "2026-02-10",
        time: "10:00 AM",
        venue: "Lab 3"
    },
    {
        id: 2,
        title: "Cultural Fest Auditions",
        date: "2026-02-14",
        time: "02:00 PM",
        venue: "Auditorium"
    }
];

// State Management
let notices = JSON.parse(localStorage.getItem('notices')) || mockNotices;
let events = JSON.parse(localStorage.getItem('events')) || mockEvents;
let currentUserRole = null;

// DOM Elements
const navBtns = document.querySelectorAll('.nav-btn');
const views = document.querySelectorAll('.view-section');
const noticesContainer = document.getElementById('notices-container');
const deptFilter = document.getElementById('filter-dept');
const catFilter = document.getElementById('filter-category');
const searchInput = document.getElementById('notice-search');
const modal = document.getElementById('notice-modal');
const modalBody = document.getElementById('modal-body');
const closeModal = document.querySelector('.close-modal');
const createNoticeForm = document.getElementById('create-notice-form');
const calendarGrid = document.getElementById('calendar-grid');
const currentMonthYear = document.getElementById('current-month-year');
const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');
const eventsList = document.getElementById('events-list');
const urgentTicker = document.getElementById('urgent-ticker');
const loginModal = document.getElementById('login-modal');
const navAdmin = document.getElementById('nav-admin');
const logoutBtn = document.getElementById('btn-logout');
// Slideshow Elements
const startSlideshowBtn = document.getElementById('start-slideshow');
const slideshowOverlay = document.getElementById('slideshow-overlay');
const slideshowContent = document.getElementById('slideshow-content');
const closeSlideshowBtn = document.getElementById('close-slideshow');
const progressBar = document.getElementById('slideshow-progress-bar');
// Slideshow State
let slideshowInterval;
let currentSlideIndex = 0;
const SLIDE_DURATION = 15000; // 15 seconds per slide for faster rotation
let idleTimer;
const IDLE_TIMEOUT = 60000; // 60 seconds
let slideQueue = []; // Unified queue

// Calendar State
let currentDate = new Date();

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    populateDeptOptions();
    renderNotices();
    renderCalendar();
    renderEventsList();
    renderTicker();

    // Check if role is selected (optional: could persist, but for demo show modal)
    // loginModal.style.display = 'flex'; 

    // Navigation Logic
    navBtns.forEach(btn => {
        if (btn.id === 'btn-logout') return;

        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const targetView = document.getElementById(targetId);
            const currentView = document.querySelector('.view-section.active');

            if (currentView === targetView) return;

            // Update Nav Classes
            navBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Smooth Transition
            if (currentView) {
                currentView.classList.add('exit');

                // Wait for exit animation to finish
                currentView.addEventListener('animationend', () => {
                    currentView.classList.remove('active', 'exit');
                    targetView.classList.add('active');
                }, { once: true });
            } else {
                targetView.classList.add('active');
            }
        });
    });

    // Role Selection
    document.getElementById('role-student').addEventListener('click', () => setRole('student'));
    document.getElementById('role-faculty').addEventListener('click', () => setRole('faculty'));
    document.getElementById('role-admin').addEventListener('click', () => setRole('admin'));

    // Logout
    logoutBtn.addEventListener('click', () => {
        loginModal.style.display = 'flex';
        // Trigger reflow
        setTimeout(() => loginModal.classList.add('show'), 10);

        currentUserRole = null;
        updateUIForRole();
    });

    // Slideshow Listeners
    if (startSlideshowBtn) {
        startSlideshowBtn.addEventListener('click', startSlideshow);
    }
    if (closeSlideshowBtn) {
        closeSlideshowBtn.addEventListener('click', stopSlideshow);
    }

    // Keyboard Escape to exit
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && slideshowOverlay.classList.contains('active')) {
            stopSlideshow();
        }
    });

    // Initialize Idle Timer
    resetIdleTimer();
    ['mousemove', 'keydown', 'click', 'touchstart'].forEach(evt => {
        document.addEventListener(evt, resetIdleTimer);
    });


    // Start Clock
    setInterval(updateClock, 1000);
    updateClock();
});

function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateString = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    const clockTime = document.getElementById('clock-time');
    const clockDate = document.getElementById('clock-date');

    if (clockTime) clockTime.textContent = timeString;
    if (clockDate) clockDate.textContent = dateString;
}

function setRole(role) {
    currentUserRole = role;
    loginModal.classList.remove('show');
    setTimeout(() => {
        loginModal.style.display = 'none';
        updateUIForRole();
    }, 300); // Wait for transition
}

function updateUIForRole() {
    // Reset Views
    navBtns.forEach(b => b.classList.remove('active'));
    document.getElementById('nav-notices').classList.add('active');

    views.forEach(v => v.classList.remove('active'));
    document.getElementById('notice-board').classList.add('active');

    // Show/Hide Admin Tab
    if (currentUserRole === 'admin') {
        navAdmin.style.display = 'flex';
    } else {
        navAdmin.style.display = 'none';
    }
}

// Populate Department Selects
function populateDeptOptions() {
    const selects = [deptFilter, document.getElementById('notice-dept')];

    selects.forEach(select => {
        if (!select) return;
        departments.forEach(dept => {
            const option = document.createElement('option');
            option.value = dept.id;
            option.textContent = dept.name;
            select.appendChild(option);
        });
    });
}

// Render Ticker
function renderTicker() {
    const urgentNotices = notices.filter(n => n.urgent);
    if (urgentNotices.length === 0) {
        urgentTicker.innerHTML = '<span class="ticker-item">No urgent notices at this time. check back later.</span>';
        return;
    }

    urgentTicker.innerHTML = urgentNotices.map(n =>
        `<span class="ticker-item">⚠️ ${n.title}</span>`
    ).join('');
}

// Render Notices
function renderNotices() {
    noticesContainer.innerHTML = '';

    const searchTerm = searchInput.value.toLowerCase();
    const selectedDept = deptFilter.value;
    const selectedCat = catFilter.value;

    // Filter notices
    let filteredNotices = notices.filter(notice => {
        const matchesSearch = notice.title.toLowerCase().includes(searchTerm) ||
            notice.description.toLowerCase().includes(searchTerm);
        const matchesDept = selectedDept === 'all' || notice.department === selectedDept;
        const matchesCat = selectedCat === 'all' || notice.category === selectedCat;
        return matchesSearch && matchesDept && matchesCat;
    });

    // Sort: Urgent first, then by date (newest first)
    filteredNotices.sort((a, b) => {
        if (a.urgent && !b.urgent) return -1;
        if (!a.urgent && b.urgent) return 1;
        return new Date(b.date) - new Date(a.date);
    });

    filteredNotices.forEach((notice, index) => {
        const deptName = departments.find(d => d.id === notice.department)?.name || 'General';

        const card = document.createElement('div');
        const delayClass = `delay-${Math.min(index + 1, 10)}`;
        card.className = `notice-card ${notice.urgent ? 'urgent' : ''} animate-up ${delayClass}`;
        // Glass class is handled by CSS on .notice-card directly now, or we can add it explicitly

        card.innerHTML = `
            ${notice.urgent ? '<span class="badge-urgent">Urgent</span>' : ''}
            <h3>${notice.title}</h3>
            <div class="notice-meta">
                <span class="dept-tag">${deptName}</span>
                <span>${formatDate(notice.date)}</span>
            </div>
            <p class="notice-preview">${notice.description}</p>
        `;

        // Add Delete Button if Admin
        if (currentUserRole === 'admin') {
            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
            deleteBtn.className = 'delete-btn';
            deleteBtn.title = 'Delete Notice';
            deleteBtn.onclick = (e) => {
                e.stopPropagation(); // Prevent modal open
                deleteNotice(notice.id);
            };
            deleteBtn.style.cssText = `
                position: absolute;
                top: 1rem;
                right: 1rem;
                background: rgba(239, 68, 68, 0.2);
                color: #fca5a5;
                border: 1px solid rgba(239, 68, 68, 0.4);
                border-radius: 50%;
                width: 30px;
                height: 30px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 0.8rem;
                transition: all 0.2s;
            `;
            deleteBtn.onmouseover = () => deleteBtn.style.background = 'var(--urgent-color)';
            deleteBtn.onmouseout = () => deleteBtn.style.background = 'rgba(239, 68, 68, 0.2)';

            card.style.position = 'relative'; // Ensure button positioning works
            card.appendChild(deleteBtn);
        }

        card.addEventListener('click', () => openNoticeModal(notice));
        noticesContainer.appendChild(card);
    });
}

// Notice Modal
function openNoticeModal(notice) {
    const deptName = departments.find(d => d.id === notice.department)?.name || 'General';

    modalBody.innerHTML = `
        <h2 style="margin-bottom: 0.5rem;">${notice.title}</h2>
        <div style="margin: 10px 0; color: var(--text-secondary);">
            <i class="fa-regular fa-calendar"></i> ${formatDate(notice.date)} | 
            <span style="color: var(--primary-color); font-weight: 600;">${deptName}</span>
        </div>
        ${notice.urgent ? '<span style="background: rgba(239, 68, 68, 0.2); color: #fca5a5; padding: 4px 10px; border-radius: 4px; font-size: 0.8rem; border: 1px solid rgba(239, 68, 68, 0.4);">URGENT NOTICE</span>' : ''}
        <hr style="border: 0; border-top: 1px solid var(--border-color); margin: 20px 0;">
        <p style="line-height: 1.8; font-size: 1.05rem; opacity: 0.9;">${notice.description}</p> 
        
        <div style="margin-top: 25px; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 12px; border: 1px solid var(--border-color);">
            <i class="fa-solid fa-paperclip"></i> Attachment: 
            <a href="#" style="color: var(--primary-color); text-decoration: none; margin-left: 5px;">Download Details (PDF)</a>
        </div>
    `;

    modal.style.display = 'flex';
    // Trigger reflow/wait a tick for transition to work
    setTimeout(() => modal.classList.add('show'), 10);
}

window.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModalFn();
    }
});

function closeModalFn() {
    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300); // Match CSS transition
}

closeModal.addEventListener('click', closeModalFn);

// Filter Event Listeners
searchInput.addEventListener('input', renderNotices);
deptFilter.addEventListener('change', renderNotices);
catFilter.addEventListener('change', renderNotices);

// Admin Form Submit
createNoticeForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const newNotice = {
        id: Date.now(),
        title: document.getElementById('notice-title').value,
        description: document.getElementById('notice-desc').value,
        department: document.getElementById('notice-dept').value,
        category: document.getElementById('notice-category').value,
        date: document.getElementById('notice-date').value,
        urgent: document.getElementById('notice-urgent').checked
    };


    notices.unshift(newNotice);
    localStorage.setItem('notices', JSON.stringify(notices));

    showToast('Notice published successfully!', 'success');
    createNoticeForm.reset();
    renderNotices();
    renderTicker(); // Update ticker if urgent

    // Switch back to notices view
    document.getElementById('nav-notices').click();
});

// Calendar Logic
function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const textMonth = currentDate.toLocaleString('default', { month: 'long' });
    currentMonthYear.textContent = `${textMonth} ${year}`;

    calendarGrid.innerHTML = '';

    // Days Header
    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    days.forEach(day => {
        const div = document.createElement('div');
        div.className = 'calendar-day-header';
        div.textContent = day;
        calendarGrid.appendChild(div);
    });

    // Days Grid
    const firstDayIndex = new Date(year, month, 1).getDay();
    const lastDay = new Date(year, month + 1, 0).getDate();

    // Empty cells for prev month
    for (let i = 0; i < firstDayIndex; i++) {
        const div = document.createElement('div');
        div.className = 'calendar-day empty';
        calendarGrid.appendChild(div);
    }

    // Days
    const today = new Date();

    for (let i = 1; i <= lastDay; i++) {
        const div = document.createElement('div');
        div.className = 'calendar-day';
        div.textContent = i;

        // Check for events
        const eventDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const hasEvent = events.some(e => e.date === eventDateStr);
        if (hasEvent) div.classList.add('has-event');

        // Highlight Today
        if (i === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
            div.classList.add('today');
        }

        calendarGrid.appendChild(div);
    }
}

prevMonthBtn.addEventListener('click', () => {
    calendarGrid.classList.add('fade-out');
    setTimeout(() => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
        calendarGrid.classList.remove('fade-out');
        calendarGrid.classList.add('fade-in');
        setTimeout(() => calendarGrid.classList.remove('fade-in'), 300);
    }, 200);
});

nextMonthBtn.addEventListener('click', () => {
    calendarGrid.classList.add('fade-out');
    setTimeout(() => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
        calendarGrid.classList.remove('fade-out');
        calendarGrid.classList.add('fade-in');
        setTimeout(() => calendarGrid.classList.remove('fade-in'), 300);
    }, 200);
});

function renderEventsList() {
    eventsList.innerHTML = '';

    // Filter upcoming events (mock logic: just show all for now)
    // Filter upcoming events (mock logic: just show all for now)
    events.forEach((event, index) => {
        const card = document.createElement('div');
        const delayClass = `delay-${Math.min(index + 1, 10)}`;
        card.className = `event-card animate-up ${delayClass}`;
        card.innerHTML = `
            <h4>${event.title}</h4>
            <div style="font-size: 0.9rem; margin-top: 5px; color: var(--text-secondary);">
                <i class="fa-regular fa-clock"></i> ${formatDate(event.date)} at ${event.time}
            </div>
            <div style="font-size: 0.9rem; color: var(--text-secondary);">
                <i class="fa-solid fa-location-dot"></i> ${event.venue}
            </div>
        `;
        eventsList.appendChild(card);
    });
}

// Toast Notification Logic
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = type === 'success' ? '<i class="fa-solid fa-check-circle" style="color: var(--accent-color)"></i>' : '<i class="fa-solid fa-circle-exclamation" style="color: var(--urgent-color)"></i>';

    toast.innerHTML = `${icon} <span>${message}</span>`;
    container.appendChild(toast);

    // Auto remove
    setTimeout(() => {
        toast.classList.add('hide');
        toast.addEventListener('transitionend', () => {
            toast.remove();
        });
    }, 3000);
}

// Delete Notice Logic
function deleteNotice(id) {
    if (!confirm("Are you sure you want to delete this notice?")) return;

    notices = notices.filter(n => n.id !== id);
    localStorage.setItem('notices', JSON.stringify(notices));

    renderNotices();
    renderTicker();
    showToast('Notice deleted successfully', 'error');
}

// Idle Timer Logic
function resetIdleTimer() {
    clearTimeout(idleTimer);

    // Don't start if already in slideshow or modal is open
    if (slideshowOverlay.classList.contains('active') || modal.classList.contains('show')) {
        return;
    }

    idleTimer = setTimeout(() => {
        // Auto-start slideshow
        startSlideshow(true); // Pass true to indicate auto-start
    }, IDLE_TIMEOUT);
}

// Slideshow Functions
function startSlideshow(isAuto = false) {
    buildSlideQueue();



    if (slideQueue.length === 0) {
        if (!isAuto) showToast("No content to display!", "error");
        return;
    }

    slideshowOverlay.classList.add('active');

    // Only attempt full screen if not auto-started
    if (!isAuto && document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(e => console.log("Fullscreen blocked:", e));
    } else if (isAuto && document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => { });
    }

    currentSlideIndex = 0;
    showSlide(currentSlideIndex);

    slideshowInterval = setInterval(nextSlide, SLIDE_DURATION);
}

function buildSlideQueue() {
    slideQueue = [];

    // 1. Priority: Urgent Notices
    const urgentNotices = notices.filter(n => n.urgent);
    urgentNotices.forEach(n => slideQueue.push({ type: 'notice', data: n, urgent: true }));

    // 2. Events (Next 5)
    const upcomingEvents = events.slice(0, 5);
    upcomingEvents.forEach(e => slideQueue.push({ type: 'event', data: e }));

    // 3. Recent Notices (Non-urgent, last 5)
    const recentNotices = notices.filter(n => !n.urgent).slice(0, 5);
    recentNotices.forEach(n => slideQueue.push({ type: 'notice', data: n, urgent: false }));
}

function stopSlideshow() {
    slideshowOverlay.classList.remove('active');
    clearInterval(slideshowInterval);

    // Exit Fullscreen
    if (document.exitFullscreen && document.fullscreenElement) {
        document.exitFullscreen().catch(e => console.log(e));
    }

    resetIdleTimer(); // Restart timer on exit
}

function nextSlide() {
    currentSlideIndex = (currentSlideIndex + 1) % slideQueue.length;
    showSlide(currentSlideIndex);
}

function showSlide(index) {
    const slide = slideQueue[index];
    const content = slide.data;

    // Reset Animation
    slideshowContent.style.animation = 'none';
    slideshowContent.offsetHeight; /* trigger reflow */
    slideshowContent.style.animation = 'zoomIn 0.8s ease-out';

    // Reset Progress Bar
    progressBar.style.animation = 'none';
    progressBar.offsetHeight;
    progressBar.style.animation = `progress ${SLIDE_DURATION / 1000}s linear`;

    let htmlContent = '';

    if (slide.type === 'event') {
        htmlContent = `
            <div class="slide-tag event">Upcoming Event</div>
            <div class="slide-event-location">
                <i class="fa-solid fa-location-dot"></i> ${content.venue}
            </div>
            <h1 class="slide-event-title">${content.title}</h1>
            <div class="slide-event-meta">
                <span><i class="fa-regular fa-calendar"></i> ${formatDate(content.date)}</span>
                <span><i class="fa-regular fa-clock"></i> ${content.time}</span>
            </div>
        `;
    } else if (slide.type === 'notice') {
        const deptName = departments.find(d => d.id === content.department)?.name || 'General';
        const urgentClass = slide.urgent ? 'urgent-slide' : '';
        const icon = slide.urgent ? '<i class="fa-solid fa-bullhorn"></i>' : '<i class="fa-solid fa-circle-info"></i>';

        htmlContent = `
            <div class="slide-tag notice ${urgentClass}">${slide.urgent ? 'URGENT NOTICE' : 'Notice Board'}</div>
            <h1 class="slide-event-title ${urgentClass}">${content.title}</h1>
            <div class="slide-event-meta">
                <span><i class="fa-solid fa-building"></i> ${deptName}</span>
                <span><i class="fa-regular fa-calendar"></i> ${formatDate(content.date)}</span>
            </div>
            <p class="slide-desc">${content.description}</p>
        `;
    }

    slideshowContent.innerHTML = htmlContent;
}

// Utility
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}
