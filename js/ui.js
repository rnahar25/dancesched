// UI module - modals, notifications, DOM updates

import { formatTime, formatDisplayDate, PREDEFINED_STYLES } from './utils.js';

export class UI {
    showNotification(message, duration = 3000) {
        const el = document.createElement('div');
        el.style.cssText = `
            position: fixed; top: 20px; right: 20px;
            background: linear-gradient(135deg, #28a745, #20c997);
            color: white; padding: 15px 25px; border-radius: 25px;
            font-weight: 600; z-index: 2000; max-width: 300px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            animation: slideInRight 0.5s ease;
        `;
        el.textContent = message;
        document.body.appendChild(el);
        setTimeout(() => {
            el.style.animation = 'slideOutRight 0.5s ease';
            setTimeout(() => el.remove(), 500);
        }, duration);
    }

    showSyncIndicator(show) {
        let el = document.getElementById('syncIndicator');
        if (show && !el) {
            el = document.createElement('div');
            el.id = 'syncIndicator';
            el.innerHTML = '☁️ Syncing...';
            el.style.cssText = `
                position: fixed; top: 10px; left: 50%; transform: translateX(-50%);
                background: rgba(102,126,234,0.9); color: white;
                padding: 8px 16px; border-radius: 20px; font-size: 14px;
                font-weight: 600; z-index: 2000;
            `;
            document.body.appendChild(el);
        } else if (!show && el) {
            el.remove();
        }
    }

    closeAllModals() {
        ['classModal', 'detailsModal', 'colorLegendModal'].forEach(id => {
            document.getElementById(id).style.display = 'none';
        });
    }

    openModal(id) {
        document.getElementById(id).style.display = 'block';
    }

    populateForm(classObj) {
        document.getElementById('className').value = classObj.name;
        document.getElementById('teacher').value = classObj.teacher;
        document.getElementById('date').value = classObj.date;
        document.getElementById('time').value = classObj.time;
        document.getElementById('duration').value = classObj.duration;
        document.getElementById('level').value = classObj.level;
        document.getElementById('location').value = classObj.location || '';
        document.getElementById('ticketLink').value = classObj.ticketLink || '';
        document.getElementById('teacherBioUrl').value = classObj.teacherBioUrl || '';
        document.getElementById('teacherInstagram').value = classObj.teacherInstagram || '';

        const styleSelect = document.getElementById('style');
        const customGroup = document.getElementById('customStyleGroup');
        const customInput = document.getElementById('customStyle');
        const predefined = PREDEFINED_STYLES.slice(0, -1);

        if (classObj.style && predefined.includes(classObj.style)) {
            styleSelect.value = classObj.style;
            customGroup.style.display = 'none';
        } else if (classObj.style?.trim()) {
            styleSelect.value = 'Other';
            customGroup.style.display = 'block';
            customInput.value = classObj.style;
        } else {
            styleSelect.value = '';
            customGroup.style.display = 'none';
        }
    }

    renderClassDetails(c) {
        const formatTeacher = (name, bio, ig) => {
            let html = bio?.trim()
                ? `<a href="${bio}" target="_blank" style="color:#667eea;text-decoration:none;font-weight:600">${name}</a>`
                : `<span style="font-weight:600">${name}</span>`;
            if (ig?.trim()) {
                const handles = ig.split(/[\s,]+/).map(h => h.replace('@', '').trim()).filter(h => h);
                const links = handles.map(h => `<a href="https://instagram.com/${h}" target="_blank" style="color:#E4405F;text-decoration:none">@${h}</a>`).join(' ');
                html += ` <span style="color:#666;font-size:0.9em">(${links})</span>`;
            }
            return html;
        };

        const formatReg = info => info.toLowerCase().startsWith('http')
            ? `<a href="${info}" target="_blank" style="color:#667eea;text-decoration:none">🎫 Register/Buy Tickets</a>`
            : `<span style="color:#333;font-weight:500">💰 ${info}</span>`;

        const items = [
            ['Class Name', c.name],
            ['Teacher', formatTeacher(c.teacher, c.teacherBioUrl, c.teacherInstagram)],
            ['Date', formatDisplayDate(c.date)],
            ['Time', formatTime(c.time)],
            ['Duration', `${c.duration || 'Not specified'} minutes`],
            c.style && ['Dance Style', c.style],
            c.level && ['Level', c.level],
            c.location && ['Location', c.location],
            c.ticketLink && ['Registration/Payment', formatReg(c.ticketLink)],
            c.bundleAvailable && ['Bundle Options', '<span style="color:#10b981;font-weight:600">💰 Bundle pricing available</span>']
        ].filter(Boolean);

        return items.map(([label, value]) => `
            <div class="detail-item">
                <span class="detail-label">${label}:</span>
                <span class="detail-value">${value}</span>
            </div>
        `).join('');
    }

    updateTeacherFilter(classes, region) {
        const container = document.getElementById('teacherCheckboxes');
        const teachers = [...new Set(classes.filter(c => (c.region || 'nyc') === region).map(c => c.teacher).filter(t => t))].sort();
        container.innerHTML = teachers.map(t => 
            `<label class="filter-checkbox"><input type="checkbox" value="${t}" checked> ${t}</label>`
        ).join('');
    }

    updateStyleFilter(classes, region) {
        const container = document.getElementById('styleCheckboxes');
        const styles = [...new Set(classes.filter(c => (c.region || 'nyc') === region).map(c => c.style).filter(s => s))];
        const getColor = s => {
            const sl = s.toLowerCase();
            if (sl.includes('bollywood') || sl.includes('street jazz')) return '#F97316';
            if (sl.includes('bhangra') || sl.includes('garba') || sl.includes('raas')) return '#22C55E';
            if (sl.includes('bharatnatyam') || sl.includes('semiclassical') || sl.includes('kathak')) return '#7C3AED';
            if (sl.includes('contemporary')) return '#2DD4BF';
            if (sl.includes('hiphop') || sl.includes('hip hop')) return '#0891B2';
            if (sl.includes('heel') || sl.includes('femme')) return '#BE123C';
            if (sl.includes('imge')) return '#312E81';
            return '#64748B';
        };
        const colorOrder = ['#F97316', '#22C55E', '#7C3AED', '#2DD4BF', '#0891B2', '#312E81', '#BE123C', '#64748B'];
        styles.sort((a, b) => colorOrder.indexOf(getColor(a)) - colorOrder.indexOf(getColor(b)) || a.localeCompare(b));
        container.innerHTML = styles.map(s => 
            `<label class="filter-checkbox"><input type="checkbox" value="${s}" checked><span class="style-dot" style="background:${getColor(s)}"></span> ${s}</label>`
        ).join('');
    }

    getSelectedTeachers() {
        const allCheckbox = document.querySelector('#teacherFilterDropdown input[value="all"]');
        if (allCheckbox?.checked) return 'all';
        const checked = [...document.querySelectorAll('#teacherCheckboxes input:checked')].map(cb => cb.value);
        return checked.length ? checked : 'all';
    }

    getSelectedStyles() {
        const allCheckbox = document.querySelector('#styleFilterDropdown input[value="all"]');
        if (allCheckbox?.checked) return 'all';
        const checked = [...document.querySelectorAll('#styleCheckboxes input:checked')].map(cb => cb.value);
        return checked.length ? checked : 'all';
    }

    updateTeacherButtonText() {
        const btn = document.getElementById('teacherFilterBtn');
        const selected = this.getSelectedTeachers();
        if (selected === 'all') {
            btn.textContent = 'All Teachers ▼';
        } else if (selected.length === 1) {
            btn.textContent = selected[0] + ' ▼';
        } else {
            btn.textContent = selected.length + ' Teachers ▼';
        }
    }

    updateStyleButtonText() {
        const btn = document.getElementById('styleFilterBtn');
        const selected = this.getSelectedStyles();
        if (selected === 'all') {
            btn.textContent = 'All Styles ▼';
        } else if (selected.length === 1) {
            btn.textContent = selected[0] + ' ▼';
        } else {
            btn.textContent = selected.length + ' Styles ▼';
        }
    }

    updateRegionToggle(region) {
        document.querySelectorAll('.region-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.region === region);
        });
    }

    updatePageTitle(region) {
        const name = region === 'nyc' ? 'NYC' : 'Bay Area';
        document.querySelector('header h1').textContent = `${name} Desi Dance Workshop Schedule`;
    }

    injectAnimations() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
            @keyframes slideOutRight { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
        `;
        document.head.appendChild(style);
    }
}
