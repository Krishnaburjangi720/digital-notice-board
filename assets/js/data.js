// LocalStorage-based DataManager
// Removes Firebase dependency completely

class DataManager {
    static notices = [];
    static events = [];
    static users = [];

    // --- Initialization ---
    static init() {


        // Load from LocalStorage
        if (localStorage.getItem('ag_notices')) {
            this.notices = JSON.parse(localStorage.getItem('ag_notices'));
        } else {
            // Seed Mock Data
            this.notices = [
                { id: 101, title: 'Library Renovation', desc: 'The main library will be closed for renovation from Feb 15 to Feb 20.', category: 'public', department: 'all', date: '2026-02-10', urgent: false },
                { id: 102, title: 'Mid-Sem Exam Schedule', desc: 'The tentative schedule for mid-semester exams is now available on the portal.', category: 'academic', department: 'all', date: '2026-02-12', urgent: true },
                { id: 103, title: 'TechSymposium Registration', desc: 'Last date to register for the annual TechSymposium is Feb 25th.', category: 'student', department: 'cs', date: '2026-02-14', urgent: false }
            ];
            this.save('notices');
        }

        if (localStorage.getItem('ag_events')) {
            this.events = JSON.parse(localStorage.getItem('ag_events'));
        } else {
            // Seed Mock Data
            this.events = [
                { id: 201, title: 'Guest Lecture: AI Ethics', desc: 'Dr. Sarah Connor regarding the future of AI.', category: 'academic', department: 'cs', date: '2026-02-18', time: '14:00', venue: 'Auditorium A' },
                { id: 202, title: 'Cultural Fest Auditions', desc: 'Open for all years. Bring your ID card.', category: 'student', department: 'all', date: '2026-02-20', time: '10:00', venue: 'Student Centerbox' },
                { id: 203, title: 'Faculty Meeting', desc: 'Mandatory meeting for all HODs.', category: 'faculty', department: 'admin', date: '2026-02-22', time: '09:00', venue: 'Conference Room' }
            ];
            this.save('events');
        }

        if (localStorage.getItem('ag_users')) {
            this.users = JSON.parse(localStorage.getItem('ag_users'));
        } else {
            // Seed Default Users
            this.users = [
                { id: 1, name: 'System Admin', username: 'admin', password: 'password', role: 'admin', dept: 'admin' },
                { id: 2, name: 'Dr. Smith', username: 'faculty', password: 'password', role: 'faculty', dept: 'cs' },
                { id: 3, name: 'John Doe', username: 'student', password: 'password', role: 'student', dept: 'cs' }
            ];
            this.save('users');
        }

        // Simulate "data-updated" event for UI responsiveness
        setTimeout(() => window.dispatchEvent(new Event('data-updated')), 100);
    }

    static save(key) {
        if (key === 'notices') localStorage.setItem('ag_notices', JSON.stringify(this.notices));
        if (key === 'events') localStorage.setItem('ag_events', JSON.stringify(this.events));
        if (key === 'users') localStorage.setItem('ag_users', JSON.stringify(this.users));

        // Trigger generic update event
        window.dispatchEvent(new Event('data-updated'));
    }

    // --- Notices ---
    static getNotices() {
        return this.notices;
    }

    static addNotice(notice) {
        notice.id = Date.now(); // Simple ID generation
        this.notices.unshift(notice); // Add to top
        this.save('notices');
        return true;
    }

    static updateNotice(updatedNotice) {
        const index = this.notices.findIndex(n => n.id === updatedNotice.id);
        if (index !== -1) {
            this.notices[index] = { ...this.notices[index], ...updatedNotice };
            this.save('notices');
            return true;
        }
        return false;
    }

    static deleteNotice(id) {
        this.notices = this.notices.filter(n => n.id !== id);
        this.save('notices');
        return true;
    }

    // --- Events ---
    static getEvents() {
        return this.events;
    }

    static addEvent(event) {
        event.id = Date.now();
        this.events.unshift(event);
        this.save('events');
        return true;
    }

    static updateEvent(updatedEvent) {
        const index = this.events.findIndex(e => e.id === updatedEvent.id);
        if (index !== -1) {
            this.events[index] = { ...this.events[index], ...updatedEvent };
            this.save('events');
            return true;
        }
        return false;
    }

    static deleteEvent(id) {
        this.events = this.events.filter(e => e.id !== id);
        this.save('events');
        return true;
    }

    // --- Auth ---
    static register(user) {
        if (this.users.some(u => u.username === user.username)) {
            return { success: false, message: "Username already taken." };
        }
        user.id = Date.now();
        this.users.push(user);
        this.save('users');
        return { success: true, message: "Registration successful!" };
    }

    static login(username, password, role) {
        const user = this.users.find(u => u.username === username && u.password === password && u.role === role);
        if (user) {
            localStorage.setItem('ag_current_user', JSON.stringify(user));
            return { success: true, user };
        }
        return { success: false, message: "Invalid credentials." };
    }

    // --- Utils ---
    static getAnalytics() {
        const deptCounts = {};
        [...this.notices, ...this.events].forEach(item => {
            const d = item.department || 'general';
            deptCounts[d] = (deptCounts[d] || 0) + 1;
        });

        return {
            totalItems: this.notices.length + this.events.length,
            noticesCount: this.notices.length,
            eventsCount: this.events.length,
            urgentCount: this.notices.filter(n => n.urgent).length,
            deptCounts
        };
    }

    static formatDate(dateStr) {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    static formatTime(timeStr) {
        if (!timeStr) return '';
        const [hours, minutes] = timeStr.split(':');
        const h = parseInt(hours, 10);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return `${h12}:${minutes} ${ampm}`;
    }

    static exportJSON() {
        const data = {
            notices: this.notices,
            events: this.events,
            users: this.users
        };
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
        return dataStr;
    }
}

// Attach to window for global access
window.DataManager = DataManager;

// Init
DataManager.init();

// export { DataManager }; // Removed for non-module compatibility
