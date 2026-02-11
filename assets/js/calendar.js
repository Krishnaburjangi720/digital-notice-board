/**
 * Shared Calendar Component
 * Renders a calendar into a target container and handles event display.
 */

class CalendarWidget {
    constructor(containerId, dataManager) {
        this.container = document.getElementById(containerId);
        this.dataManager = dataManager;
        this.date = new Date();
        this.selectedDate = null;
    }

    render() {
        if (!this.container) return;

        const year = this.date.getFullYear();
        const month = this.date.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();

        const events = this.dataManager.getEvents();

        // Header
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

        let html = `
            <div class="calendar-header">
                <h3>${monthNames[month]} ${year}</h3>
                <div style="display:flex; gap:10px;">
                    <button class="btn btn-outline btn-sm" id="cal-prev"><i class="fa-solid fa-chevron-left"></i></button>
                    <button class="btn btn-outline btn-sm" id="cal-next"><i class="fa-solid fa-chevron-right"></i></button>
                </div>
            </div>
            <div class="calendar-grid">
                ${['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => `<div class="cal-day-name">${d}</div>`).join('')}
        `;

        // Empty slots
        for (let i = 0; i < firstDay; i++) {
            html += `<div></div>`;
        }

        // Days
        for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            const dayEvents = events.filter(e => e.date === dateStr);
            const isToday = (i === today.getDate() && month === today.getMonth() && year === today.getFullYear());
            const hasEvent = dayEvents.length > 0;
            const isSelected = this.selectedDate === dateStr;

            html += `<div class="cal-date ${isToday ? 'today' : ''} ${hasEvent ? 'has-event' : ''} ${isSelected ? 'selected' : ''}" 
                        data-date="${dateStr}" onclick="window.calendarInstance.selectDate('${dateStr}')">${i}</div>`;
        }

        html += `</div>`;

        // Details Section
        html += `
            <div id="cal-details" style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid var(--glass-border);">
                <h4 style="color: var(--text-muted); margin-bottom: 1rem; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px;">
                    ${this.selectedDate ? `Events for ${this.formatDate(this.selectedDate)}` : 'Select a date'}
                </h4>
                <div id="cal-events-list">
                    ${this.renderEventsList()}
                </div>
            </div>
        `;

        this.container.innerHTML = html;

        // Bind events
        this.container.querySelector('#cal-prev').onclick = () => this.changeMonth(-1);
        this.container.querySelector('#cal-next').onclick = () => this.changeMonth(1);
    }

    renderEventsList() {
        if (!this.selectedDate) {
            return '<p style="color: var(--text-muted); font-size: 0.9rem; font-style: italic;">Click a date to see details.</p>';
        }

        const events = this.dataManager.getEvents().filter(e => e.date === this.selectedDate);
        if (events.length === 0) {
            return '<p style="color: var(--text-muted); font-size: 0.9rem;">No events scheduled.</p>';
        }

        return events.map(e => `
            <div style="background: rgba(255,255,255,0.05); padding: 0.8rem; border-radius: 8px; margin-bottom: 0.5rem; border-left: 3px solid var(--primary-color);">
                <div style="font-weight: 600; color: white; margin-bottom: 0.2rem;">${e.title}</div>
                <div style="font-size: 0.8rem; color: var(--text-muted);">
                    <i class="fa-regular fa-clock"></i> ${this.dataManager.formatTime(e.time)} &nbsp; 
                    <i class="fa-solid fa-location-dot"></i> ${e.venue}
                </div>
            </div>
        `).join('');
    }

    changeMonth(delta) {
        this.date.setMonth(this.date.getMonth() + delta);
        this.render();
    }

    selectDate(dateStr) {
        this.selectedDate = dateStr;
        this.render();
    }

    formatDate(dateStr) {
        const options = { weekday: 'short', month: 'short', day: 'numeric' };
        return new Date(dateStr).toLocaleDateString('en-US', options);
    }
}

// Global instance helper
window.initCalendar = (containerId) => {
    window.calendarInstance = new CalendarWidget(containerId, DataManager);
    window.calendarInstance.render();
};
