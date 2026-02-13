// Calendar module - calendar rendering

import { formatDate, formatTime, MONTH_NAMES } from './utils.js';

export class Calendar {
    constructor(styleManager) {
        this.styleManager = styleManager;
        this.currentDate = new Date();
        this.year = this.currentDate.getFullYear();
        this.month = this.currentDate.getMonth();
    }

    prevMonth() {
        if (--this.month < 0) { this.month = 11; this.year--; }
    }

    nextMonth() {
        if (++this.month > 11) { this.month = 0; this.year++; }
    }

    render(classes, region, teacherFilter, styleFilter) {
        const grid = document.getElementById('calendarGrid');
        document.getElementById('currentMonth').textContent = `${MONTH_NAMES[this.month]} ${this.year}`;
        grid.innerHTML = '';

        const firstDay = new Date(this.year, this.month, 1);
        const lastDay = new Date(this.year, this.month + 1, 0);
        const prevLast = new Date(this.year, this.month, 0).getDate();
        const startDay = firstDay.getDay();

        // Previous month days
        for (let i = startDay - 1; i >= 0; i--) {
            grid.appendChild(this._createDay(prevLast - i, true, new Date(this.year, this.month - 1, prevLast - i), classes, region, teacherFilter, styleFilter));
        }

        // Current month days
        for (let d = 1; d <= lastDay.getDate(); d++) {
            const date = new Date(this.year, this.month, d);
            grid.appendChild(this._createDay(d, false, date, classes, region, teacherFilter, styleFilter, date.toDateString() === new Date().toDateString()));
        }

        // Next month days
        const remaining = 42 - grid.children.length;
        for (let d = 1; d <= remaining; d++) {
            grid.appendChild(this._createDay(d, true, new Date(this.year, this.month + 1, d), classes, region, teacherFilter, styleFilter));
        }
    }

    _createDay(day, isOther, date, classes, region, teacherFilter, styleFilter, isToday = false) {
        const el = document.createElement('div');
        el.className = 'calendar-day';
        if (isOther) el.classList.add('other-month');
        if (isToday) el.classList.add('today');

        el.innerHTML = `<div class="day-number">${day}</div><div class="day-classes"></div>`;
        el.dataset.date = formatDate(date);

        const dayClasses = el.querySelector('.day-classes');
        this._getClassesForDate(formatDate(date), classes, region, teacherFilter, styleFilter).forEach(c => {
            const item = document.createElement('div');
            item.className = 'class-item';
            item.dataset.classId = c.id;

            if (c.style?.trim()) {
                const styleClass = this.styleManager.isPredefined(c.style)
                    ? this.styleManager.getClassName(c.style)
                    : 'other';
                item.classList.add(styleClass);
            }

            item.textContent = `${formatTime(c.time)} ${c.name}`;
            if (c.soldOut) {
                const badge = document.createElement('span');
                badge.className = 'soldout-badge';
                badge.textContent = 'SOLD OUT';
                item.appendChild(badge);
            } else if (c.onSale) {
                const badge = document.createElement('span');
                badge.className = 'sale-badge';
                badge.textContent = 'SALE';
                item.appendChild(badge);
            }
            item.title = `${c.name} with ${c.teacher}`;
            dayClasses.appendChild(item);
        });

        return el;
    }

    _getClassesForDate(dateStr, classes, region, teacherFilter, styleFilter) {
        return classes
            .filter(c => c.date === dateStr && (c.region || 'nyc') === region)
            .filter(c => teacherFilter === 'all' || (Array.isArray(teacherFilter) ? teacherFilter.includes(c.teacher) : c.teacher === teacherFilter))
            .filter(c => styleFilter === 'all' || (Array.isArray(styleFilter) ? styleFilter.includes(c.style) : c.style === styleFilter))
            .sort((a, b) => a.time.localeCompare(b.time));
    }
}
