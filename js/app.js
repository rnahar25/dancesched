// Main application orchestrator

import { Storage } from './storage.js';
import { EmailService } from './email.js';
import { Calendar } from './calendar.js';
import { StyleManager } from './styles.js';
import { UI } from './ui.js';
import { generateId, generateApprovalToken, formatDate, getRegionFromUrl, updateUrlForRegion, PREDEFINED_STYLES } from './utils.js';

class DanceScheduler {
    constructor() {
        this.storage = new Storage();
        this.email = new EmailService();
        this.styleManager = new StyleManager(this.storage);
        this.calendar = new Calendar(this.styleManager);
        this.ui = new UI();

        this.classes = this.storage.load('danceClasses');
        this.pendingClasses = this.storage.load('pendingDanceClasses');
        this.pendingDeletions = this.storage.load('pendingDanceDeletions');
        this.pendingEdits = this.storage.load('pendingDanceEdits');
        this.filteredTeachers = 'all';
        this.filteredStyles = 'all';
        this.selectedRegion = getRegionFromUrl();
        this.editingClassId = null;

        this.init();
    }

    async init() {
        this.ui.injectAnimations();
        this.setupEventListeners();
        this.ui.updateRegionToggle(this.selectedRegion);
        this.ui.updatePageTitle(this.selectedRegion);
        this.styleManager.loadStored();
        this.renderCalendar();
        this.ui.updateTeacherFilter(this.classes, this.selectedRegion);
        this.ui.updateStyleFilter(this.classes, this.selectedRegion);
        await this.setupCloud();
        this.loadSampleData();
        this.handleApprovalRedirect();
    }

    setupEventListeners() {
        document.getElementById('prevMonth').addEventListener('click', () => { this.calendar.prevMonth(); this.renderCalendar(); });
        document.getElementById('nextMonth').addEventListener('click', () => { this.calendar.nextMonth(); this.renderCalendar(); });
        document.getElementById('addClassBtn').addEventListener('click', () => this.openAddModal());
        document.getElementById('cancelBtn').addEventListener('click', () => this.closeModal());
        document.getElementById('classForm').addEventListener('submit', e => this.handleFormSubmit(e));
        document.getElementById('style').addEventListener('change', e => this.handleStyleChange(e));
        
        // Teacher filter dropdown
        const teacherBtn = document.getElementById('teacherFilterBtn');
        const teacherDropdown = document.getElementById('teacherFilterDropdown');
        teacherBtn.addEventListener('click', () => {
            teacherDropdown.style.display = teacherDropdown.style.display === 'none' ? 'block' : 'none';
            styleDropdown.style.display = 'none';
        });
        teacherDropdown.addEventListener('change', e => {
            const allCheckbox = teacherDropdown.querySelector('input[value="all"]');
            if (e.target.value === 'all') {
                document.querySelectorAll('#teacherCheckboxes input').forEach(cb => cb.checked = e.target.checked);
            } else {
                allCheckbox.checked = [...document.querySelectorAll('#teacherCheckboxes input')].every(cb => cb.checked);
            }
            this.filteredTeachers = this.ui.getSelectedTeachers();
            this.ui.updateTeacherButtonText();
            this.renderCalendar();
        });

        // Style filter dropdown
        const styleBtn = document.getElementById('styleFilterBtn');
        const styleDropdown = document.getElementById('styleFilterDropdown');
        styleBtn.addEventListener('click', () => {
            styleDropdown.style.display = styleDropdown.style.display === 'none' ? 'block' : 'none';
            teacherDropdown.style.display = 'none';
        });
        styleDropdown.addEventListener('change', e => {
            const allCheckbox = styleDropdown.querySelector('input[value="all"]');
            if (e.target.value === 'all') {
                document.querySelectorAll('#styleCheckboxes input').forEach(cb => cb.checked = e.target.checked);
            } else {
                allCheckbox.checked = [...document.querySelectorAll('#styleCheckboxes input')].every(cb => cb.checked);
            }
            this.filteredStyles = this.ui.getSelectedStyles();
            this.ui.updateStyleButtonText();
            this.renderCalendar();
        });

        document.addEventListener('click', e => {
            if (!e.target.closest('.teacher-filter-container')) teacherDropdown.style.display = 'none';
            if (!e.target.closest('.style-filter-container')) styleDropdown.style.display = 'none';
        });

        document.querySelectorAll('.region-btn').forEach(btn => {
            btn.addEventListener('click', e => this.filterByRegion(e.target.dataset.region));
        });

        window.addEventListener('popstate', () => {
            this.selectedRegion = getRegionFromUrl();
            this.ui.updateRegionToggle(this.selectedRegion);
            this.ui.updatePageTitle(this.selectedRegion);
            this.filteredTeachers = 'all';
            this.filteredStyles = 'all';
            this.ui.updateTeacherFilter(this.classes, this.selectedRegion);
            this.ui.updateStyleFilter(this.classes, this.selectedRegion);
            this.ui.updateTeacherButtonText();
            this.ui.updateStyleButtonText();
            this.renderCalendar();
        });

        document.getElementById('colorLegendBtn').addEventListener('click', e => {
            e.preventDefault();
            this.ui.openModal('colorLegendModal');
        });

        document.querySelectorAll('.close').forEach(el => el.addEventListener('click', () => this.closeModal()));
        document.getElementById('editClassBtn').addEventListener('click', () => this.editSelectedClass());
        document.getElementById('deleteClassBtn').addEventListener('click', () => this.deleteSelectedClass());
        document.getElementById('closeDetailsBtn').addEventListener('click', () => this.closeModal());
        document.getElementById('suggestionForm').addEventListener('submit', e => this.handleSuggestionSubmit(e));

        window.addEventListener('click', e => {
            if (e.target.classList.contains('modal')) this.closeModal();
        });

        document.addEventListener('click', e => {
            if (e.target.classList.contains('calendar-day') && !e.target.classList.contains('other-month')) {
                this.openAddModal(e.target.dataset.date);
            }
            if (e.target.classList.contains('class-item')) {
                e.stopPropagation();
                this.showClassDetails(e.target.dataset.classId);
            }
        });
    }

    renderCalendar() {
        this.calendar.render(this.classes, this.selectedRegion, this.filteredTeachers, this.filteredStyles);
    }

    // Cloud setup
    async setupCloud() {
        if (await this.storage.initFirebase()) {
            await this.loadFromCloud();
            this.storage.setupRealtimeListener((classes, lastUpdated) => {
                const localMod = localStorage.getItem('danceScheduler_lastModified') || '';
                if (lastUpdated && lastUpdated !== localMod) {
                    const merged = this.storage.mergeClasses(this.classes, classes);
                    if (this.storage.hasChanges(this.classes, merged)) {
                        this.classes = merged;
                        this.storage.save('danceClasses', this.classes);
                        localStorage.setItem('danceScheduler_lastModified', lastUpdated);
                        this.renderCalendar();
                        this.ui.updateTeacherFilter(this.classes, this.selectedRegion);
                    }
                }
            });
        }
    }

    async loadFromCloud() {
        const data = await this.storage.cloudLoad('danceSchedules', this.storage.userId);
        if (data?.classes) {
            this.classes = data.classes;
            this.storage.save('danceClasses', this.classes);
            this.renderCalendar();
            this.ui.updateTeacherFilter(this.classes, this.selectedRegion);
        }

        const pending = await this.storage.cloudLoad('pendingClasses', 'shared_pending');
        if (pending?.pendingClasses) {
            this.pendingClasses = pending.pendingClasses;
            this.storage.save('pendingDanceClasses', this.pendingClasses);
        }

        const deletions = await this.storage.cloudLoad('pendingDeletions', 'shared_pending_deletions');
        if (deletions?.pendingDeletions) {
            this.pendingDeletions = deletions.pendingDeletions;
            this.storage.save('pendingDanceDeletions', this.pendingDeletions);
        }

        const edits = await this.storage.cloudLoad('pendingEdits', 'shared_pending_edits');
        if (edits?.pendingEdits) {
            this.pendingEdits = edits.pendingEdits;
            this.storage.save('pendingDanceEdits', this.pendingEdits);
        }
    }

    saveToCloud() {
        this.storage.cloudSave('danceSchedules', this.storage.userId,
            { userId: this.storage.userId, classes: this.classes },
            show => this.ui.showSyncIndicator(show)
        );
    }

    // Filters
    filterByRegion(region) {
        this.selectedRegion = region;
        this.filteredTeachers = 'all';
        this.filteredStyles = 'all';
        updateUrlForRegion(region);
        this.ui.updateRegionToggle(region);
        this.ui.updatePageTitle(region);
        this.ui.updateTeacherFilter(this.classes, region);
        this.ui.updateStyleFilter(this.classes, region);
        this.ui.updateTeacherButtonText();
        this.ui.updateStyleButtonText();
        this.renderCalendar();
    }

    // Modals
    openAddModal(date = null) {
        document.getElementById('modalTitle').textContent = 'Add New Class';
        document.getElementById('classForm').reset();
        this.editingClassId = null;
        if (date) document.getElementById('date').value = date;
        document.getElementById('time').value = '12:00';
        this.ui.openModal('classModal');
        document.getElementById('className').focus();
    }

    closeModal() {
        this.ui.closeAllModals();
        this.editingClassId = null;
    }

    showClassDetails(classId) {
        const c = this.classes.find(x => x.id === classId);
        if (!c) return;

        document.getElementById('classDetails').innerHTML = this.ui.renderClassDetails(c);
        document.getElementById('editClassBtn').style.display = 'inline-block';
        document.getElementById('deleteClassBtn').style.display = 'inline-block';

        const modal = document.getElementById('detailsModal');
        modal.dataset.classId = classId;
        this.ui.openModal('detailsModal');
    }

    editSelectedClass() {
        const classId = document.getElementById('detailsModal').dataset.classId;
        const c = this.classes.find(x => x.id === classId);
        if (!c) return;

        this.closeModal();
        document.getElementById('modalTitle').textContent = 'Edit Class';
        this.editingClassId = classId;
        this.ui.populateForm(c);
        this.ui.openModal('classModal');
    }

    deleteSelectedClass() {
        const classId = document.getElementById('detailsModal').dataset.classId;
        if (!confirm('Are you sure you want to request deletion of this class?')) return;

        const c = this.classes.find(x => x.id === classId);
        if (!c) return;

        const pending = {
            ...c,
            status: 'pending_delete',
            originalId: c.id,
            deleteRequestedAt: new Date().toISOString(),
            approvalToken: generateApprovalToken()
        };

        this.pendingDeletions.push(pending);
        this.storage.save('pendingDanceDeletions', this.pendingDeletions);
        this.storage.cloudSave('pendingDeletions', 'shared_pending_deletions', { pendingDeletions: this.pendingDeletions });
        this.email.sendApproval(pending, 'delete');

        this.closeModal();
        this.ui.showNotification('Class deletion request submitted for approval!', 5000);
    }

    // Form handling
    handleFormSubmit(e) {
        e.preventDefault();

        let style = document.getElementById('style').value;
        if (style === 'Other') {
            style = document.getElementById('customStyle').value.trim() || 'Other';
        }

        const data = {
            id: this.editingClassId || generateId(),
            name: document.getElementById('className').value,
            teacher: document.getElementById('teacher').value,
            date: document.getElementById('date').value,
            time: document.getElementById('time').value,
            duration: parseInt(document.getElementById('duration').value),
            style,
            level: document.getElementById('level').value,
            location: document.getElementById('location').value || '',
            ticketLink: document.getElementById('ticketLink').value || '',
            teacherBioUrl: document.getElementById('teacherBioUrl').value || '',
            teacherInstagram: document.getElementById('teacherInstagram').value || '',
            region: this.selectedRegion
        };

        if (!data.name || !data.teacher || !data.date || !data.time || !data.ticketLink) {
            alert('Please fill in all required fields.');
            return;
        }

        if (this.editingClassId) {
            const original = this.classes.find(c => c.id === this.editingClassId);
            const pending = {
                ...data,
                region: original.region || 'nyc',
                originalId: this.editingClassId,
                originalData: original,
                status: 'pending_edit',
                editRequestedAt: new Date().toISOString(),
                approvalToken: generateApprovalToken()
            };

            this.pendingEdits.push(pending);
            this.storage.save('pendingDanceEdits', this.pendingEdits);
            this.storage.cloudSave('pendingEdits', 'shared_pending_edits', { pendingEdits: this.pendingEdits });
            this.email.sendApproval(pending, 'edit');
            this.ui.showNotification('Class edit submitted for approval!', 5000);
        } else {
            const pending = {
                ...data,
                status: 'pending',
                submittedAt: new Date().toISOString(),
                approvalToken: generateApprovalToken()
            };

            this.pendingClasses.push(pending);
            this.storage.save('pendingDanceClasses', this.pendingClasses);
            this.storage.cloudSave('pendingClasses', 'shared_pending', { pendingClasses: this.pendingClasses });
            this.email.sendApproval(pending, 'add');
            this.ui.showNotification('Class submitted for approval!', 5000);
        }

        this.closeModal();
    }

    handleStyleChange(e) {
        const customGroup = document.getElementById('customStyleGroup');
        const customInput = document.getElementById('customStyle');
        if (e.target.value === 'Other') {
            customGroup.style.display = 'block';
            customInput.focus();
        } else {
            customGroup.style.display = 'none';
            customInput.value = '';
        }
    }

    async handleSuggestionSubmit(e) {
        e.preventDefault();
        const text = document.getElementById('suggestionText').value.trim();
        const btn = e.target.querySelector('button[type="submit"]');

        if (!text) { alert('Please enter your suggestion.'); return; }

        btn.disabled = true;
        btn.textContent = 'Sending...';

        const success = await this.email.sendSuggestion(text);
        this.ui.showNotification(success ? 'Thank you! Your suggestion has been sent.' : 'Thank you for your suggestion!', 4000);
        document.getElementById('suggestionText').value = '';

        btn.disabled = false;
        btn.textContent = 'Send Suggestion';
    }

    // Approval handling
    async handleApprovalRedirect() {
        const params = new URLSearchParams(window.location.search);
        const action = params.get('approvalAction');
        const token = params.get('approvalToken');
        if (!action || !token) return;

        // Check pending classes
        let idx = this.pendingClasses.findIndex(c => c.approvalToken === token);
        if (idx !== -1) {
            const pending = this.pendingClasses[idx];
            if (action === 'approve') {
                const approved = { ...pending };
                delete approved.status; delete approved.submittedAt; delete approved.approvalToken;
                this.classes.push(approved);
                this.pendingClasses.splice(idx, 1);
                this.storage.save('danceClasses', this.classes);
                this.storage.save('pendingDanceClasses', this.pendingClasses);
                this.storage.cloudSave('pendingClasses', 'shared_pending', { pendingClasses: this.pendingClasses });
                this.renderCalendar();
                this.ui.updateTeacherFilter(this.classes, this.selectedRegion);
                this.saveToCloud();
                this.ui.showNotification(`✅ Class "${pending.name}" approved!`, 6000);
            } else {
                this.pendingClasses.splice(idx, 1);
                this.storage.save('pendingDanceClasses', this.pendingClasses);
                this.storage.cloudSave('pendingClasses', 'shared_pending', { pendingClasses: this.pendingClasses });
                this.ui.showNotification(`❌ Class "${pending.name}" rejected.`, 6000);
            }
            this.cleanUrl();
            return;
        }

        // Check pending edits
        idx = this.pendingEdits.findIndex(c => c.approvalToken === token);
        if (idx !== -1) {
            const pending = this.pendingEdits[idx];
            if (action === 'approve') {
                this.storage.disableRealtimeListener = true;
                const classIdx = this.classes.findIndex(c => c.id === pending.originalId);
                if (classIdx !== -1) {
                    const updated = { ...pending, id: pending.originalId };
                    delete updated.originalId; delete updated.originalData; delete updated.status;
                    delete updated.editRequestedAt; delete updated.approvalToken;
                    this.classes[classIdx] = updated;
                }
                this.pendingEdits.splice(idx, 1);
                this.storage.save('danceClasses', this.classes);
                this.storage.save('pendingDanceEdits', this.pendingEdits);
                await this.saveToCloud();
                await this.storage.cloudSave('pendingEdits', 'shared_pending_edits', { pendingEdits: this.pendingEdits });
                this.renderCalendar();
                this.ui.updateTeacherFilter(this.classes, this.selectedRegion);
                setTimeout(() => { this.storage.disableRealtimeListener = false; }, 2000);
                this.ui.showNotification(`✅ Edit for "${pending.name}" approved!`, 6000);
            } else {
                this.pendingEdits.splice(idx, 1);
                this.storage.save('pendingDanceEdits', this.pendingEdits);
                this.storage.cloudSave('pendingEdits', 'shared_pending_edits', { pendingEdits: this.pendingEdits });
                this.ui.showNotification(`❌ Edit for "${pending.name}" rejected.`, 6000);
            }
            this.cleanUrl();
            return;
        }

        // Check pending deletions
        idx = this.pendingDeletions.findIndex(c => c.approvalToken === token);
        if (idx !== -1) {
            const pending = this.pendingDeletions[idx];
            if (action === 'approve') {
                const classIdx = this.classes.findIndex(c => c.id === pending.originalId);
                if (classIdx !== -1) this.classes.splice(classIdx, 1);
                this.pendingDeletions.splice(idx, 1);
                this.storage.save('danceClasses', this.classes);
                this.storage.save('pendingDanceDeletions', this.pendingDeletions);
                this.renderCalendar();
                this.ui.updateTeacherFilter(this.classes, this.selectedRegion);
                this.storage.cloudSave('pendingDeletions', 'shared_pending_deletions', { pendingDeletions: this.pendingDeletions });
                this.saveToCloud();
                this.ui.showNotification(`✅ Class "${pending.name}" deleted!`, 6000);
            } else {
                this.pendingDeletions.splice(idx, 1);
                this.storage.save('pendingDanceDeletions', this.pendingDeletions);
                this.storage.cloudSave('pendingDeletions', 'shared_pending_deletions', { pendingDeletions: this.pendingDeletions });
                this.ui.showNotification(`❌ Deletion for "${pending.name}" rejected.`, 6000);
            }
            this.cleanUrl();
            return;
        }

        this.ui.showNotification('Approval token not found.', 4000);
        this.cleanUrl();
    }

    cleanUrl() {
        window.history.replaceState({}, document.title, window.location.origin + window.location.pathname);
    }

    loadSampleData() {
        if (this.classes.length > 0) return;
        this.classes = [{
            id: generateId(),
            name: 'Bollywood Fusion',
            teacher: 'Rupal Nahar',
            date: formatDate(new Date(Date.now() + 86400000)),
            time: '14:00',
            duration: 75,
            style: 'Bollywood Fusion',
            level: 'Intermediate',
            location: 'Ripley Grier, Studio B',
            ticketLink: 'Venmo @rupalnahar $25'
        }];
        this.storage.save('danceClasses', this.classes);
        this.renderCalendar();
        this.ui.updateTeacherFilter(this.classes, this.selectedRegion);
    }
}

document.addEventListener('DOMContentLoaded', () => new DanceScheduler());
