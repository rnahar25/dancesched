// Dance Schedule Application
class DanceScheduler {
    constructor() {
        this.currentDate = new Date();
        this.currentYear = this.currentDate.getFullYear();
        this.currentMonth = this.currentDate.getMonth();
        this.classes = this.loadClassesFromStorage();
        this.pendingClasses = this.loadPendingClassesFromStorage();
        this.pendingDeletions = this.loadPendingDeletionsFromStorage();
        this.pendingEdits = this.loadPendingEditsFromStorage();
        this.filteredTeacher = 'all';
        this.editingClassId = null;
        
        this.monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        
        this.init();
    }
    
    async init() {
        this.setupEventListeners();
        this.loadStoredCustomStyles(); // Load custom styles before generating calendar
        this.generateCalendar();
        this.updateTeacherFilter();
        await this.setupCloudStorage(); // Wait for cloud data to load first
        this.setupGmailServiceAccount();
        this.loadSampleData();
        this.handleApprovalRedirect(); // Handle email approval redirects AFTER cloud data loads
    }
    
    setupEventListeners() {
        // Navigation buttons
        document.getElementById('prevMonth').addEventListener('click', () => this.previousMonth());
        document.getElementById('nextMonth').addEventListener('click', () => this.nextMonth());
        
        // Modal controls
        document.getElementById('addClassBtn').addEventListener('click', () => this.openAddClassModal());
        document.getElementById('cancelBtn').addEventListener('click', () => this.closeModal());
        
        // Form submission
        document.getElementById('classForm').addEventListener('submit', (e) => this.handleFormSubmit(e));
        
        // Style selection change handler
        document.getElementById('style').addEventListener('change', (e) => this.handleStyleChange(e));
        
        // Teacher filter
        document.getElementById('teacherFilter').addEventListener('change', (e) => this.filterByTeacher(e.target.value));
        
        // Color legend button
        document.getElementById('colorLegendBtn').addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('colorLegendModal').style.display = 'block';
        });
        
        // Modal close buttons
        document.querySelectorAll('.close').forEach(close => {
            close.addEventListener('click', () => this.closeModal());
        });
        
        // Details modal buttons
        document.getElementById('editClassBtn').addEventListener('click', () => this.editSelectedClass());
        document.getElementById('deleteClassBtn').addEventListener('click', () => this.deleteSelectedClass());
        document.getElementById('closeDetailsBtn').addEventListener('click', () => this.closeModal());
        
        // Suggestion form
        document.getElementById('suggestionForm').addEventListener('submit', (e) => this.handleSuggestionSubmit(e));
        
        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal();
            }
        });
        
        // Calendar day clicks
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('calendar-day') && !e.target.classList.contains('other-month')) {
                this.openAddClassForDate(e.target);
            }
            if (e.target.classList.contains('class-item')) {
                e.stopPropagation();
                this.showClassDetails(e.target.dataset.classId);
            }
        });
    }
    
    loadSampleData() {
        // Only load sample data if no classes exist
        if (this.classes.length === 0) {
            const sampleClasses = [
                {
                    id: this.generateId(),
                    name: 'Bollywood Fusion',
                    teacher: 'Rupal Nahar',
                    date: this.formatDate(new Date(Date.now() + 86400000)), // Tomorrow
                    time: '14:00',
                    duration: 75,
                    style: 'Bollywood Fusion',
                    level: 'Intermediate',
                    location: 'Ripley Grier, Studio B',
                    ticketLink: 'Venmo @rupalnahar $25'
                }
            ];
            
            this.classes = sampleClasses;
            this.saveClassesToStorage();
            this.generateCalendar();
            this.updateTeacherFilter();
        }
        
    }
    
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    formatDate(date) {
        return date.toISOString().split('T')[0];
    }
    
    previousMonth() {
        this.currentMonth--;
        if (this.currentMonth < 0) {
            this.currentMonth = 11;
            this.currentYear--;
        }
        this.generateCalendar();
    }
    
    nextMonth() {
        this.currentMonth++;
        if (this.currentMonth > 11) {
            this.currentMonth = 0;
            this.currentYear++;
        }
        this.generateCalendar();
    }
    
    generateCalendar() {
        const calendarGrid = document.getElementById('calendarGrid');
        const currentMonth = document.getElementById('currentMonth');
        
        // Update month display
        currentMonth.textContent = `${this.monthNames[this.currentMonth]} ${this.currentYear}`;
        
        // Clear previous calendar
        calendarGrid.innerHTML = '';
        
        // Get first day of month and number of days
        const firstDay = new Date(this.currentYear, this.currentMonth, 1);
        const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();
        
        // Get previous month's last few days
        const prevMonth = new Date(this.currentYear, this.currentMonth, 0);
        const daysInPrevMonth = prevMonth.getDate();
        
        // Add previous month's trailing days
        for (let i = startingDayOfWeek - 1; i >= 0; i--) {
            const dayElement = this.createDayElement(
                daysInPrevMonth - i,
                true, // other month
                new Date(this.currentYear, this.currentMonth - 1, daysInPrevMonth - i)
            );
            calendarGrid.appendChild(dayElement);
        }
        
        // Add current month's days
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(this.currentYear, this.currentMonth, day);
            const isToday = this.isToday(date);
            const dayElement = this.createDayElement(day, false, date, isToday);
            calendarGrid.appendChild(dayElement);
        }
        
        // Add next month's leading days to fill the grid
        const totalCells = calendarGrid.children.length;
        const cellsToFill = 42 - totalCells; // 6 rows × 7 days
        
        for (let day = 1; day <= cellsToFill; day++) {
            const dayElement = this.createDayElement(
                day,
                true, // other month
                new Date(this.currentYear, this.currentMonth + 1, day)
            );
            calendarGrid.appendChild(dayElement);
        }
    }
    
    createDayElement(day, isOtherMonth, date, isToday = false) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        
        if (isOtherMonth) {
            dayElement.classList.add('other-month');
        }
        
        if (isToday) {
            dayElement.classList.add('today');
        }
        
        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = day;
        
        const dayClasses = document.createElement('div');
        dayClasses.className = 'day-classes';
        
        // Add classes for this date
        const dateStr = this.formatDate(date);
        const dayClassList = this.getClassesForDate(dateStr);
        
        dayClassList.forEach(classObj => {
            const classElement = document.createElement('div');
            classElement.className = 'class-item';
            classElement.dataset.classId = classObj.id;
            
            // Add style-specific class if style exists
            if (classObj.style && classObj.style.trim()) {
                const styleClass = this.isPredefinedStyle(classObj.style) 
                    ? this.getStyleClassName(classObj.style) 
                    : 'other';
                classElement.classList.add(styleClass);
            }
            
            classElement.textContent = `${this.formatTime(classObj.time)} ${classObj.name}`;
            classElement.title = `${classObj.name} with ${classObj.teacher}`;
            
            dayClasses.appendChild(classElement);
        });
        
        dayElement.appendChild(dayNumber);
        dayElement.appendChild(dayClasses);
        dayElement.dataset.date = dateStr;
        
        return dayElement;
    }
    
    isToday(date) {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }
    
    getClassesForDate(dateStr) {
        return this.classes
            .filter(classObj => classObj.date === dateStr)
            .filter(classObj => this.filteredTeacher === 'all' || classObj.teacher === this.filteredTeacher)
            .sort((a, b) => a.time.localeCompare(b.time));
    }
    
    updateTeacherFilter() {
        const teacherFilter = document.getElementById('teacherFilter');
        const teachers = [...new Set(this.classes.map(c => c.teacher))].sort();
        
        // Clear current options except "All Teachers"
        teacherFilter.innerHTML = '<option value="all">All Teachers</option>';
        
        // Add teacher options
        teachers.forEach(teacher => {
            const option = document.createElement('option');
            option.value = teacher;
            option.textContent = teacher;
            teacherFilter.appendChild(option);
        });
    }
    
    filterByTeacher(teacher) {
        this.filteredTeacher = teacher;
        this.generateCalendar();
    }
    
    openAddClassModal(selectedDate = null) {
        const modal = document.getElementById('classModal');
        const modalTitle = document.getElementById('modalTitle');
        const form = document.getElementById('classForm');
        
        modalTitle.textContent = 'Add New Class';
        form.reset();
        this.editingClassId = null;
        
        if (selectedDate) {
            document.getElementById('date').value = selectedDate;
        }
        
        // Set default time to 12:00 PM
        document.getElementById('time').value = '12:00';
        
        modal.style.display = 'block';
        document.getElementById('className').focus();
    }
    
    openAddClassForDate(dayElement) {
        const date = dayElement.dataset.date;
        this.openAddClassModal(date);
    }
    
    closeModal() {
        document.getElementById('classModal').style.display = 'none';
        document.getElementById('detailsModal').style.display = 'none';
        document.getElementById('colorLegendModal').style.display = 'none';
        this.editingClassId = null;
    }
    
    handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        
        // Handle custom style input
        let styleValue = formData.get('style') || document.getElementById('style').value;
        if (styleValue === 'Other') {
            const customStyle = formData.get('customStyle') || document.getElementById('customStyle').value;
            styleValue = customStyle ? customStyle.trim() : '';
        }
        
        const classData = {
            id: this.editingClassId || this.generateId(),
            name: formData.get('className') || document.getElementById('className').value,
            teacher: formData.get('teacher') || document.getElementById('teacher').value,
            date: formData.get('date') || document.getElementById('date').value,
            time: formData.get('time') || document.getElementById('time').value,
            duration: parseInt(formData.get('duration') || document.getElementById('duration').value),
            style: styleValue,
            level: formData.get('level') || document.getElementById('level').value,
            location: formData.get('location') || document.getElementById('location').value || '',
            ticketLink: formData.get('ticketLink') || document.getElementById('ticketLink').value || '',
            teacherBioUrl: formData.get('teacherBioUrl') || document.getElementById('teacherBioUrl').value || '',
            teacherInstagram: formData.get('teacherInstagram') || document.getElementById('teacherInstagram').value || '',
            submitterEmail: formData.get('submitterEmail') || document.getElementById('submitterEmail').value || ''
        };
        
        // Validate required fields
        if (!classData.name || !classData.teacher || !classData.date || !classData.time || !classData.ticketLink) {
            alert('Please fill in all required fields.');
            return;
        }
        
        if (this.editingClassId) {
            // Get original class data for comparison
            const originalClass = this.classes.find(c => c.id === this.editingClassId);
            
            // Create pending edit request instead of direct update
            const pendingEdit = {
                ...classData,
                originalId: this.editingClassId,
                originalData: originalClass,
                status: 'pending_edit',
                editRequestedAt: new Date().toISOString(),
                approvalToken: this.generateApprovalToken()
            };
            
            // Add to pending edits (shared across all users)
            this.pendingEdits.push(pendingEdit);
            this.savePendingEditsToStorage();
            this.autoSavePendingEditsToCloud();
            
            // Send edit approval email
            this.sendEditApprovalEmail(pendingEdit);
            
            this.showNotification('Class edit submitted for approval!', 5000);
        } else {
            // New submissions go to pending for approval
            const pendingClass = {
                ...classData,
                status: 'pending',
                submittedAt: new Date().toISOString(),
                approvalToken: this.generateApprovalToken()
            };
            
            // Save to pending classes (both local and Firebase)
            this.pendingClasses.push(pendingClass);
            this.savePendingClassesToStorage();
            this.autoSavePendingToCloud(); // Save to shared Firebase
            
            // Send approval email
            this.sendApprovalEmail(pendingClass);
            
            // Show pending message
            this.showNotification('Class submitted for approval! You\'ll be notified when it\'s approved.', 5000);
        }
        
        this.closeModal();
    }
    
    handleStyleChange(e) {
        const customStyleGroup = document.getElementById('customStyleGroup');
        const customStyleInput = document.getElementById('customStyle');
        
        if (e.target.value === 'Other') {
            customStyleGroup.style.display = 'block';
            customStyleInput.focus();
        } else {
            customStyleGroup.style.display = 'none';
            customStyleInput.value = '';
        }
    }
    
    showClassDetails(classId) {
        const classObj = this.classes.find(c => c.id === classId);
        if (!classObj) return;
        
        const modal = document.getElementById('detailsModal');
        const detailsDiv = document.getElementById('classDetails');
        
        detailsDiv.innerHTML = `
            <div class="detail-item">
                <span class="detail-label">Class Name:</span>
                <span class="detail-value">${classObj.name}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Teacher:</span>
                <span class="detail-value">${this.formatTeacherName(classObj.teacher, classObj.teacherBioUrl, classObj.teacherInstagram)}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Date:</span>
                <span class="detail-value">${this.formatDisplayDate(classObj.date)}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Time:</span>
                <span class="detail-value">${this.formatTime(classObj.time)}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Duration:</span>
                <span class="detail-value">${classObj.duration || 'Not specified'} minutes</span>
            </div>
            ${classObj.style ? `
            <div class="detail-item">
                <span class="detail-label">Dance Style:</span>
                <span class="detail-value">${classObj.style}</span>
            </div>
            ` : ''}
            ${classObj.level ? `
            <div class="detail-item">
                <span class="detail-label">Level:</span>
                <span class="detail-value">${classObj.level}</span>
            </div>
            ` : ''}
            ${classObj.location ? `
            <div class="detail-item">
                <span class="detail-label">Location:</span>
                <span class="detail-value">${classObj.location}</span>
            </div>
            ` : ''}
            ${classObj.ticketLink ? `
            <div class="detail-item">
                <span class="detail-label">Registration/Payment:</span>
                <span class="detail-value">${this.formatRegistrationInfo(classObj.ticketLink)}</span>
            </div>
            ` : ''}
        `;
        
        // Show edit/delete buttons for admins (you can add admin detection later)
        const editBtn = document.getElementById('editClassBtn');
        const deleteBtn = document.getElementById('deleteClassBtn');
        
        editBtn.style.display = 'inline-block';
        deleteBtn.style.display = 'inline-block';
        
        // Store the selected class ID for editing/deleting
        modal.dataset.classId = classId;
        modal.style.display = 'block';
    }
    
    editSelectedClass() {
        const modal = document.getElementById('detailsModal');
        const classId = modal.dataset.classId;
        const classObj = this.classes.find(c => c.id === classId);
        
        if (!classObj) return;
        
        this.closeModal();
        
        // Open edit modal with pre-filled data
        const editModal = document.getElementById('classModal');
        const modalTitle = document.getElementById('modalTitle');
        
        modalTitle.textContent = 'Edit Class';
        this.editingClassId = classId;
        
        // Fill form with existing data
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
        
        // Handle style selection for editing
        const styleSelect = document.getElementById('style');
        const customStyleGroup = document.getElementById('customStyleGroup');
        const customStyleInput = document.getElementById('customStyle');
        
        // Check if the existing style is in our predefined options
        const predefinedStyles = ['Bhangra', 'Bhangra Fusion', 'Bollywood', 'Bollywood Fusion', 'Bollywood Street Jazz', 'Contemporary', 'Heels', 'Hip Hop', 'IMGE', 'Semiclassical', 'Tamil Street Jazz'];
        
        if (classObj.style && predefinedStyles.includes(classObj.style)) {
            // It's a predefined style
            styleSelect.value = classObj.style;
            customStyleGroup.style.display = 'none';
            customStyleInput.value = '';
        } else if (classObj.style && classObj.style.trim()) {
            // It's a custom style
            styleSelect.value = 'Other';
            customStyleGroup.style.display = 'block';
            customStyleInput.value = classObj.style;
        } else {
            // No style selected
            styleSelect.value = '';
            customStyleGroup.style.display = 'none';
            customStyleInput.value = '';
        }
        
        editModal.style.display = 'block';
    }
    
    deleteSelectedClass() {
        const modal = document.getElementById('detailsModal');
        const classId = modal.dataset.classId;
        
        if (confirm('Are you sure you want to request deletion of this class?')) {
            // Get class data for deletion request
            const classToDelete = this.classes.find(c => c.id === classId);
            
            if (classToDelete) {
                // Create pending deletion request
                const pendingDeletion = {
                    ...classToDelete,
                    status: 'pending_delete',
                    originalId: classToDelete.id, // Keep reference to original class
                    deleteRequestedAt: new Date().toISOString(),
                    approvalToken: this.generateApprovalToken()
                };
                
                // Add to pending deletions (shared across all users)
                if (!this.pendingDeletions) {
                    this.pendingDeletions = [];
                }
                this.pendingDeletions.push(pendingDeletion);
                this.savePendingDeletionsToStorage();
                this.autoSavePendingDeletionsToCloud();
                
                // Send deletion approval email
                this.sendDeletionApprovalEmail(pendingDeletion);
                
                this.closeModal();
                this.showNotification('Class deletion request submitted for approval!', 5000);
            }
        }
    }
    
    formatDisplayDate(dateStr) {
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
    
    formatTime(timeStr) {
        const [hours, minutes] = timeStr.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        return `${displayHour}:${minutes} ${ampm}`;
    }
    
    formatRegistrationInfo(info) {
        // Check if it's a URL (starts with http:// or https://)
        if (info.toLowerCase().startsWith('http://') || info.toLowerCase().startsWith('https://')) {
            return `<a href="${info}" target="_blank" rel="noopener noreferrer" style="color: #667eea; text-decoration: none;">🎫 Register/Buy Tickets</a>`;
        } else {
            // It's text instructions (like Venmo info)
            return `<span style="color: #333; font-weight: 500;">💰 ${info}</span>`;
        }
    }
    
    formatTeacherName(teacherName, bioUrl, instagram) {
        let result = '';
        
        // Teacher name - clickable if bio URL provided
        if (bioUrl && bioUrl.trim()) {
            result += `<a href="${bioUrl}" target="_blank" rel="noopener noreferrer" style="color: #667eea; text-decoration: none; font-weight: 600;">${teacherName}</a>`;
        } else {
            result += `<span style="font-weight: 600;">${teacherName}</span>`;
        }
        
        // Instagram handle in parentheses if provided
        if (instagram && instagram.trim()) {
            // Clean up Instagram handle (remove @ if present, add it back)
            const cleanHandle = instagram.replace('@', '');
            const instagramUrl = `https://instagram.com/${cleanHandle}`;
            result += ` <span style="color: #666; font-size: 0.9em;">(<a href="${instagramUrl}" target="_blank" rel="noopener noreferrer" style="color: #E4405F; text-decoration: none;">@${cleanHandle}</a>)</span>`;
        }
        
        return result;
    }
    
    showNotification(message, duration = 3000) {
        // Create a simple notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #28a745, #20c997);
            color: white;
            padding: 15px 25px;
            border-radius: 25px;
            font-weight: 600;
            z-index: 2000;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
            animation: slideInRight 0.5s ease;
            max-width: 300px;
            word-wrap: break-word;
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Remove after specified duration
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.5s ease';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 500);
        }, duration);
    }
    
    loadClassesFromStorage() {
        try {
            const stored = localStorage.getItem('danceClasses');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading classes from storage:', error);
            return [];
        }
    }
    
    saveClassesToStorage() {
        try {
            localStorage.setItem('danceClasses', JSON.stringify(this.classes));
            localStorage.setItem('danceScheduler_lastModified', new Date().toISOString());
        } catch (error) {
            console.error('Error saving classes to storage:', error);
        }
    }
    
    loadPendingClassesFromStorage() {
        try {
            const stored = localStorage.getItem('pendingDanceClasses');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading pending classes from storage:', error);
            return [];
        }
    }
    
    savePendingClassesToStorage() {
        try {
            localStorage.setItem('pendingDanceClasses', JSON.stringify(this.pendingClasses));
        } catch (error) {
            console.error('Error saving pending classes to storage:', error);
        }
    }
    
    loadPendingDeletionsFromStorage() {
        try {
            const stored = localStorage.getItem('pendingDanceDeletions');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading pending deletions from storage:', error);
            return [];
        }
    }
    
    savePendingDeletionsToStorage() {
        try {
            localStorage.setItem('pendingDanceDeletions', JSON.stringify(this.pendingDeletions));
        } catch (error) {
            console.error('Error saving pending deletions to storage:', error);
        }
    }
    
    loadPendingEditsFromStorage() {
        try {
            const stored = localStorage.getItem('pendingDanceEdits');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading pending edits from storage:', error);
            return [];
        }
    }
    
    savePendingEditsToStorage() {
        try {
            localStorage.setItem('pendingDanceEdits', JSON.stringify(this.pendingEdits));
        } catch (error) {
            console.error('Error saving pending edits to storage:', error);
        }
    }
    
    generateApprovalToken() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 16);
    }
    
    loadTeacherProfilesFromStorage() {
        try {
            const stored = localStorage.getItem('teacherProfiles');
            return stored ? JSON.parse(stored) : {};
        } catch (error) {
            console.error('Error loading teacher profiles from storage:', error);
            return {};
        }
    }
    
    saveTeacherProfilesToStorage() {
        try {
            localStorage.setItem('teacherProfiles', JSON.stringify(this.teacherProfiles));
        } catch (error) {
            console.error('Error saving teacher profiles to storage:', error);
        }
    }
    
    // Firebase Cloud Storage
    async setupCloudStorage() {
        const firebaseConfig = {
            apiKey: "AIzaSyD3_Oxk4hBOmE_g3g5KMtnSfhFkcQ46vbc",
            authDomain: "dancesched-b95fc.firebaseapp.com",
            projectId: "dancesched-b95fc",
            storageBucket: "dancesched-b95fc.firebasestorage.app",
            messagingSenderId: "534215773388",
            appId: "1:534215773388:web:0c66fa6ccee313a7110669",
            measurementId: "G-YZKPGGXK57"
        };

        try {
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }
            this.db = firebase.firestore();
            this.userId = this.getUserId();
            console.log('Firebase initialized successfully');
            
            // Auto-load from cloud on startup
            await this.autoLoadFromCloud();
            
            // Load pending classes from cloud
            await this.autoLoadPendingFromCloud();
            
            // Load pending deletions from cloud
            await this.autoLoadPendingDeletionsFromCloud();
            
            // Load pending edits from cloud
            await this.autoLoadPendingEditsFromCloud();
            
            // Set up real-time listener for changes from other users
            this.setupRealtimeListener();
        } catch (error) {
            console.error('Firebase initialization error:', error);
            console.log('Using local storage only. Follow FIREBASE_SETUP.md to enable cloud sync.');
            this.db = null;
        }
    }
    
    getUserId() {
        // Use a shared userId so all browsers sync to the same document
        return 'shared_schedule';
    }
    
    // Auto-save to cloud (silent background operation)
    async autoSaveToCloud() {
        if (!this.db) {
            return; // Fail silently if Firebase not available
        }

        this.showSyncIndicator(true);

        try {
            const docData = {
                userId: this.userId,
                classes: this.classes,
                lastUpdated: new Date().toISOString()
            };

            // Save to Firebase Firestore
            await this.db.collection('danceSchedules').doc(this.userId).set(docData);
            
        } catch (error) {
            console.error('Auto-save error:', error);
            // Fail silently for auto-save
        } finally {
            this.showSyncIndicator(false);
        }
    }
    
    // Auto-load from cloud on startup (silent background operation)
    async autoLoadFromCloud() {
        if (!this.db) {
            return; // Use local data if Firebase not available
        }

        try {
            console.log('Loading classes from Firebase...');
            // Load from Firebase Firestore
            const doc = await this.db.collection('danceSchedules').doc(this.userId).get();
            
            if (doc.exists) {
                const cloudData = doc.data();
                const cloudClasses = cloudData.classes || [];
                const cloudLastModified = cloudData.lastUpdated || '1970-01-01T00:00:00.000Z';
                
                console.log(`Found ${cloudClasses.length} classes in Firebase`);
                console.log('Classes from Firebase:', cloudClasses.map(c => c.name));
                
                // ALWAYS use cloud data as the source of truth
                this.classes = cloudClasses;
                this.saveClassesToStorage();
                localStorage.setItem('danceScheduler_lastModified', cloudLastModified);
                
                // Force UI update with cloud data
                this.generateCalendar();
                this.updateTeacherFilter();
                console.log(`✅ Loaded ${cloudClasses.length} classes from Firebase and refreshed UI`);
                
            } else {
                console.log('No document found in Firebase - using empty classes array');
                this.classes = [];
                this.saveClassesToStorage();
                this.generateCalendar();
                this.updateTeacherFilter();
            }
            
        } catch (error) {
            console.error('Auto-load error:', error);
            // Continue with local data if cloud load fails
        }
    }

    // Auto-load pending classes from cloud (shared across all users)
    async autoLoadPendingFromCloud() {
        if (!this.db) {
            return; // Use local data if Firebase not available
        }

        try {
            // Load pending classes from shared Firebase collection
            const doc = await this.db.collection('pendingClasses').doc('shared_pending').get();
            
            if (doc.exists) {
                const cloudData = doc.data();
                const cloudPendingClasses = cloudData.pendingClasses || [];
                
                console.log(`Loaded ${cloudPendingClasses.length} pending classes from cloud`);
                this.pendingClasses = cloudPendingClasses;
                this.savePendingClassesToStorage(); // Also save to local storage as backup
            }
            
        } catch (error) {
            console.error('Error loading pending classes from cloud:', error);
            // Continue with local data if cloud load fails
        }
    }

    // Auto-save pending classes to cloud (shared across all users)
    async autoSavePendingToCloud() {
        if (!this.db) {
            return; // Fail silently if Firebase not available
        }

        try {
            const docData = {
                pendingClasses: this.pendingClasses,
                lastUpdated: new Date().toISOString()
            };

            // Save to shared Firebase Firestore collection
            await this.db.collection('pendingClasses').doc('shared_pending').set(docData);
            console.log('Pending classes saved to cloud');
            
        } catch (error) {
            console.error('Error saving pending classes to cloud:', error);
            // Fail silently for auto-save
        }
    }

    // Auto-load pending deletions from cloud (shared across all users)
    async autoLoadPendingDeletionsFromCloud() {
        if (!this.db) {
            console.log('Firebase not available - skipping pending deletions load from cloud');
            return; // Use local data if Firebase not available
        }

        try {
            console.log('Loading pending deletions from Firebase...');
            // Load pending deletions from shared Firebase collection
            const doc = await this.db.collection('pendingDeletions').doc('shared_pending_deletions').get();
            
            if (doc.exists) {
                const cloudData = doc.data();
                const cloudPendingDeletions = cloudData.pendingDeletions || [];
                
                console.log(`Successfully loaded ${cloudPendingDeletions.length} pending deletions from cloud:`);
                console.log('Pending deletions data:', cloudPendingDeletions);
                this.pendingDeletions = cloudPendingDeletions;
                this.savePendingDeletionsToStorage(); // Also save to local storage as backup
            } else {
                console.log('No pending deletions document found in Firebase');
            }
            
        } catch (error) {
            console.error('Error loading pending deletions from cloud:', error);
            // Continue with local data if cloud load fails
        }
    }

    // Auto-save pending deletions to cloud (shared across all users)
    async autoSavePendingDeletionsToCloud() {
        if (!this.db) {
            return; // Fail silently if Firebase not available
        }

        try {
            const docData = {
                pendingDeletions: this.pendingDeletions,
                lastUpdated: new Date().toISOString()
            };

            // Save to shared Firebase Firestore collection
            await this.db.collection('pendingDeletions').doc('shared_pending_deletions').set(docData);
            console.log('Pending deletions saved to cloud');
            
        } catch (error) {
            console.error('Error saving pending deletions to cloud:', error);
            // Fail silently for auto-save
        }
    }

    // Auto-load pending edits from cloud (shared across all users)
    async autoLoadPendingEditsFromCloud() {
        if (!this.db) {
            return; // Use local data if Firebase not available
        }

        try {
            // Load pending edits from shared Firebase collection
            const doc = await this.db.collection('pendingEdits').doc('shared_pending_edits').get();
            
            if (doc.exists) {
                const cloudData = doc.data();
                const cloudPendingEdits = cloudData.pendingEdits || [];
                
                console.log(`Loaded ${cloudPendingEdits.length} pending edits from cloud`);
                this.pendingEdits = cloudPendingEdits;
                this.savePendingEditsToStorage(); // Also save to local storage as backup
            }
            
        } catch (error) {
            console.error('Error loading pending edits from cloud:', error);
            // Continue with local data if cloud load fails
        }
    }

    // Auto-save pending edits to cloud (shared across all users)
    async autoSavePendingEditsToCloud() {
        if (!this.db) {
            return; // Fail silently if Firebase not available
        }

        try {
            const docData = {
                pendingEdits: this.pendingEdits,
                lastUpdated: new Date().toISOString()
            };

            // Save to shared Firebase Firestore collection
            await this.db.collection('pendingEdits').doc('shared_pending_edits').set(docData);
            console.log('Pending edits saved to cloud');
            
        } catch (error) {
            console.error('Error saving pending edits to cloud:', error);
            // Fail silently for auto-save
        }
    }
    
    loadFromShareCode(shareCode) {
        try {
            const data = JSON.parse(atob(shareCode));
            
            if (data.classes && Array.isArray(data.classes)) {
                if (confirm(`Load ${data.classes.length} classes? This will replace your current classes.`)) {
                    this.classes = data.classes;
                    this.saveClassesToStorage();
                    this.generateCalendar();
                    this.updateTeacherFilter();
                    this.showNotification('Classes loaded successfully!');
                }
            } else {
                throw new Error('Invalid share code');
            }
        } catch (error) {
            alert('Invalid share code. Please check and try again.');
        }
    }
    
    // Set up real-time listener for Firebase changes
    setupRealtimeListener() {
        if (!this.db) {
            return; // Skip if Firebase not available
        }

        this.realtimeListener = this.db
            .collection('danceSchedules')
            .doc(this.userId)
            .onSnapshot(
                (doc) => {
                    if (doc.exists) {
                        // Skip real-time updates if disabled (during deletions/edits)
                        if (this.disableRealtimeListener) {
                            console.log('Real-time listener disabled, skipping update');
                            return;
                        }
                        
                        const cloudData = doc.data();
                        const cloudClasses = cloudData.classes || [];
                        const cloudLastUpdated = cloudData.lastUpdated;
                        
                        // Get local timestamp
                        const localLastModified = localStorage.getItem('danceScheduler_lastModified') || '1970-01-01T00:00:00.000Z';
                        
                        // Only update if cloud data is newer than local data
                        if (cloudLastUpdated && cloudLastUpdated !== localLastModified) {
                            console.log('Received real-time update from Firebase');
                            
                            // Merge data instead of replacing
                            const mergedClasses = this.mergeClasses(this.classes, cloudClasses);
                            
                            // Only update UI if there are actual changes
                            if (this.hasClassChanges(this.classes, mergedClasses)) {
                                this.classes = mergedClasses;
                                this.saveClassesToStorage();
                                localStorage.setItem('danceScheduler_lastModified', cloudLastUpdated);
                                
                                // Update UI
                                this.generateCalendar();
                                this.updateTeacherFilter();
                                
                                // Sync happens silently in the background
                            }
                        }
                    }
                },
                (error) => {
                    console.error('Real-time listener error:', error);
                }
            );
    }
    
    // Smart merge classes from different sources
    mergeClasses(localClasses, cloudClasses) {
        const merged = new Map();
        
        // Add local classes first
        localClasses.forEach(cls => {
            merged.set(cls.id, cls);
        });
        
        // Add/update with cloud classes
        cloudClasses.forEach(cls => {
            merged.set(cls.id, cls);
        });
        
        return Array.from(merged.values()).sort((a, b) => {
            // Sort by date first, then by time
            if (a.date !== b.date) {
                return a.date.localeCompare(b.date);
            }
            return a.time.localeCompare(b.time);
        });
    }
    
    // Check if there are actual changes between class arrays
    hasClassChanges(oldClasses, newClasses) {
        if (oldClasses.length !== newClasses.length) {
            return true;
        }
        
        // Sort both arrays by ID for comparison
        const sortedOld = [...oldClasses].sort((a, b) => a.id.localeCompare(b.id));
        const sortedNew = [...newClasses].sort((a, b) => a.id.localeCompare(b.id));
        
        return JSON.stringify(sortedOld) !== JSON.stringify(sortedNew);
    }
    
    // Gmail Service Account Setup - Secure backend endpoint
    setupGmailServiceAccount() {
        // Backend endpoint URL - your serverless function or server
        // This keeps service account credentials secure on the server-side
        this.emailEndpoint = 'https://gmail-function.vercel.app/api/send-email';
        
        if (this.emailEndpoint === 'YOUR_BACKEND_ENDPOINT_URL_HERE') {
            console.log('Gmail Service Account not configured yet. Follow GMAIL_API_SETUP.md to set up your backend endpoint.');
            console.log('This approach keeps your service account credentials secure!');
        } else {
            console.log('Gmail Service Account configured - using secure backend endpoint');
        }
    }
    
    async sendApprovalEmail(pendingClass) {
        try {
            if (this.emailEndpoint === 'YOUR_BACKEND_ENDPOINT_URL_HERE') {
                console.log('Gmail Service Account backend not configured - skipping approval email');
                return;
            }

            console.log('Sending approval email for class submission...');
            
            // Send approval email to admin
            const response = await fetch(this.emailEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'class_approval',
                    action: 'add',
                    classData: pendingClass,
                    approvalToken: pendingClass.approvalToken,
                    timestamp: new Date().toISOString(),
                    source: 'Dance Schedule Website'
                })
            });
            
            if (response.ok) {
                console.log('Approval email sent successfully');
            } else {
                console.error('Failed to send approval email:', response.status, response.statusText);
            }
            
        } catch (error) {
            console.error('Error sending approval email:', error);
        }
    }

    async sendAdminNotification(notificationType, classData) {
        try {
            if (this.emailEndpoint === 'YOUR_BACKEND_ENDPOINT_URL_HERE') {
                console.log('Gmail Service Account backend not configured - skipping admin notification');
                return;
            }

            console.log(`Sending admin notification for ${notificationType}...`);
            
            // Send notification to admin
            const response = await fetch(this.emailEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: notificationType,
                    classData: classData,
                    timestamp: new Date().toISOString(),
                    source: 'Dance Schedule Website'
                })
            });
            
            if (response.ok) {
                console.log(`${notificationType} notification sent successfully`);
            } else {
                console.error(`Failed to send ${notificationType} notification:`, response.status, response.statusText);
            }
            
        } catch (error) {
            console.error(`Error sending ${notificationType} notification:`, error);
        }
    }

    async sendDeletionApprovalEmail(pendingDeletion) {
        try {
            if (this.emailEndpoint === 'YOUR_BACKEND_ENDPOINT_URL_HERE') {
                console.log('Gmail Service Account backend not configured - skipping deletion approval email');
                return;
            }

            console.log('Sending deletion approval email with action: delete...');
            
            // Send deletion approval email to admin
            const requestPayload = {
                type: 'class_approval',
                action: 'delete',
                classData: pendingDeletion,
                approvalToken: pendingDeletion.approvalToken,
                timestamp: new Date().toISOString(),
                source: 'Dance Schedule Website'
            };
            
            console.log('Deletion email payload:', requestPayload);
            
            const response = await fetch(this.emailEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestPayload)
            });
            
            if (response.ok) {
                console.log('Deletion approval email sent successfully');
                const responseData = await response.json();
                console.log('Backend response:', responseData);
            } else {
                console.error('Failed to send deletion approval email:', response.status, response.statusText);
                const errorText = await response.text();
                console.error('Backend error response:', errorText);
            }
            
        } catch (error) {
            console.error('Error sending deletion approval email:', error);
        }
    }

    async sendEditApprovalEmail(pendingEdit) {
        try {
            if (this.emailEndpoint === 'YOUR_BACKEND_ENDPOINT_URL_HERE') {
                console.log('Gmail Service Account backend not configured - skipping edit approval email');
                return;
            }

            console.log('Sending edit approval email with action: edit...');
            
            // Send edit approval email to admin
            const requestPayload = {
                type: 'class_approval',
                action: 'edit',
                classData: pendingEdit,
                originalData: pendingEdit.originalData,
                approvalToken: pendingEdit.approvalToken,
                timestamp: new Date().toISOString(),
                source: 'Dance Schedule Website'
            };
            
            console.log('Edit email payload:', requestPayload);
            
            const response = await fetch(this.emailEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestPayload)
            });
            
            if (response.ok) {
                console.log('Edit approval email sent successfully');
                const responseData = await response.json();
                console.log('Backend response:', responseData);
            } else {
                console.error('Failed to send edit approval email:', response.status, response.statusText);
                const errorText = await response.text();
                console.error('Backend error response:', errorText);
            }
            
        } catch (error) {
            console.error('Error sending edit approval email:', error);
        }
    }

    async handleSuggestionSubmit(e) {
        e.preventDefault();
        
        const suggestionText = document.getElementById('suggestionText').value.trim();
        const submitButton = e.target.querySelector('button[type="submit"]');
        
        if (!suggestionText) {
            alert('Please enter your suggestion before submitting.');
            return;
        }
        
        // Disable button and show loading state
        const originalText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Sending...';
        
        try {
            if (this.emailEndpoint === 'YOUR_BACKEND_ENDPOINT_URL_HERE') {
                // Backend endpoint not configured yet
                console.log('Gmail Service Account backend not configured - showing fallback message');
                this.showNotification('Thank you for your suggestion! Configure Gmail API backend to enable email notifications.', 4000);
            } else {
                console.log('Sending suggestion via Gmail API backend...');
                
                // Send to secure backend endpoint
                const response = await fetch(this.emailEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        type: 'suggestion',
                        message: suggestionText,
                        timestamp: new Date().toISOString(),
                        source: 'Dance Schedule Website'
                    })
                });
                
                if (response.ok) {
                    console.log('Suggestion sent successfully via Gmail API');
                    this.showNotification('Thank you! Your suggestion has been sent.', 4000);
                } else {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
            }
            
            // Clear form on success (or if not configured)
            document.getElementById('suggestionText').value = '';
            
        } catch (error) {
            console.error('Gmail API backend error:', error);
            this.showNotification('Thank you for your suggestion! There was an issue sending the email, but your feedback is appreciated.', 4000);
            
            // Still clear the form so user doesn't lose their input
            document.getElementById('suggestionText').value = '';
        } finally {
            // Re-enable button
            submitButton.disabled = false;
            submitButton.textContent = originalText;
        }
    }
    
    // Visual sync indicator
    showSyncIndicator(show) {
        let indicator = document.getElementById('syncIndicator');
        
        if (show && !indicator) {
            indicator = document.createElement('div');
            indicator.id = 'syncIndicator';
            indicator.innerHTML = '☁️ Syncing...';
            indicator.style.cssText = `
                position: fixed;
                top: 10px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(102, 126, 234, 0.9);
                color: white;
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 14px;
                font-weight: 600;
                z-index: 2000;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
                animation: fadeIn 0.3s ease;
            `;
            document.body.appendChild(indicator);
        } else if (!show && indicator) {
            indicator.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                if (document.body.contains(indicator)) {
                    document.body.removeChild(indicator);
                }
            }, 300);
        }
    }
    
    // Custom Style Color Management
    getStyleClassName(style) {
        // Convert style name to a valid CSS class name
        return style.toLowerCase()
            .replace(/[^a-z0-9]/g, '') // Remove non-alphanumeric characters
            .replace(/\s+/g, ''); // Remove any remaining spaces
    }
    
    isPredefinedStyle(style) {
        const predefinedStyles = [
            'Bhangra', 'Bhangra Fusion', 'Bollywood', 'Bollywood Fusion', 
            'Bollywood Street Jazz', 'Contemporary', 'Heels', 'Hip Hop', 
            'IMGE', 'Semiclassical', 'Tamil Street Jazz', 'Other'
        ];
        return predefinedStyles.includes(style);
    }
    
    addCustomStyleColor(styleClass, styleName) {
        // Check if we already have a style rule for this class
        const existingStyle = document.querySelector(`style[data-custom-style="${styleClass}"]`);
        if (existingStyle) {
            return; // Already exists
        }
        
        // Generate a consistent color based on the style name
        const color = this.generateConsistentColor(styleName);
        
        // Create and inject the CSS rule
        const styleElement = document.createElement('style');
        styleElement.setAttribute('data-custom-style', styleClass);
        styleElement.textContent = `.class-item.${styleClass} { background: ${color} !important; }`;
        document.head.appendChild(styleElement);
        
        // Store the custom style for persistence
        this.storeCustomStyle(styleName, color);
    }
    
    generateConsistentColor(styleName) {
        // Predefined palette of distinctly different solid colors
        // Selected for maximum visual distinction and readability
        const distinctPalette = [
            '#FF6B6B', // Bright Red
            '#4ECDC4', // Turquoise
            '#45B7D1', // Sky Blue
            '#96CEB4', // Mint Green
            '#FFEAA7', // Soft Yellow
            '#DDA0DD', // Plum
            '#F7DC6F', // Light Gold
            '#85C1E9', // Light Blue
            '#F8C471', // Peach
            '#BB8FCE', // Light Purple
            '#82E0AA', // Light Green
            '#F1948A', // Salmon
            '#85C1E9', // Powder Blue
            '#F9E79F', // Cream
            '#D7BDE2', // Lavender
            '#A9DFBF', // Pale Green
            '#F5B7B1', // Rose
            '#AED6F1', // Baby Blue
            '#FCF3CF', // Vanilla
            '#E8DAEF', // Thistle
            '#ABEBC6', // Seafoam
            '#FADBD8', // Blush
            '#D6EAF8', // Ice Blue
            '#FEF9E7', // Ivory
            '#EBDEF0', // Mauve
            '#D5F4E6', // Mint
            '#FDF2E9', // Bisque
            '#EAF2F8', // Alice Blue
            '#FEF5E7', // Seashell
            '#F4ECF7'  // Ghost White
        ];
        
        // Get existing assignments to maintain consistency
        const customStyles = this.getStoredCustomStyles();
        
        // If this style already has a color, return it
        if (customStyles[styleName]) {
            return customStyles[styleName];
        }
        
        // Get used colors to avoid duplicates
        const usedColors = new Set(Object.values(customStyles));
        
        // Find the first unused color
        let chosenColor = distinctPalette[0]; // fallback
        for (const color of distinctPalette) {
            if (!usedColors.has(color)) {
                chosenColor = color;
                break;
            }
        }
        
        // If all colors are used, create a hash-based variation
        if (usedColors.has(chosenColor)) {
            let hash = 0;
            for (let i = 0; i < styleName.length; i++) {
                const char = styleName.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash;
            }
            hash = Math.abs(hash);
            
            // Use the hash to select from palette with slight variations
            const baseIndex = hash % distinctPalette.length;
            const baseColor = distinctPalette[baseIndex];
            
            // Create a slightly different shade
            const variation = (hash % 3) - 1; // -1, 0, or 1
            chosenColor = this.adjustColorBrightness(baseColor, variation * 0.1);
        }
        
        return chosenColor;
    }
    
    adjustColorBrightness(hex, factor) {
        // Convert hex to RGB
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        
        // Adjust brightness
        const newR = Math.max(0, Math.min(255, r + (r * factor)));
        const newG = Math.max(0, Math.min(255, g + (g * factor)));
        const newB = Math.max(0, Math.min(255, b + (b * factor)));
        
        // Convert back to hex
        const toHex = (n) => Math.round(n).toString(16).padStart(2, '0');
        return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
    }
    
    storeCustomStyle(styleName, color) {
        try {
            const customStyles = this.getStoredCustomStyles();
            customStyles[styleName] = color;
            localStorage.setItem('customDanceStyles', JSON.stringify(customStyles));
        } catch (error) {
            console.error('Error storing custom style:', error);
        }
    }
    
    getStoredCustomStyles() {
        try {
            const stored = localStorage.getItem('customDanceStyles');
            return stored ? JSON.parse(stored) : {};
        } catch (error) {
            console.error('Error loading custom styles:', error);
            return {};
        }
    }
    
    loadStoredCustomStyles() {
        const customStyles = this.getStoredCustomStyles();
        
        Object.keys(customStyles).forEach(styleName => {
            const styleClass = this.getStyleClassName(styleName);
            const color = customStyles[styleName];
            
            // Check if style rule already exists
            const existingStyle = document.querySelector(`style[data-custom-style="${styleClass}"]`);
            if (!existingStyle) {
                const styleElement = document.createElement('style');
                styleElement.setAttribute('data-custom-style', styleClass);
                styleElement.textContent = `.class-item.${styleClass} { background: ${color} !important; }`;
                document.head.appendChild(styleElement);
            }
        });
    }

    // Handle approval redirects from email buttons
    handleApprovalRedirect() {
        const urlParams = new URLSearchParams(window.location.search);
        const approvalAction = urlParams.get('approvalAction');
        const approvalToken = urlParams.get('approvalToken');
        
        if (approvalAction && approvalToken) {
            // Check pending classes first (for adding new classes)
            const pendingIndex = this.pendingClasses.findIndex(c => c.approvalToken === approvalToken);
            
            if (pendingIndex !== -1) {
                const pendingClass = this.pendingClasses[pendingIndex];
                
                if (approvalAction === 'approve') {
                    // Move from pending to approved classes
                    const approvedClass = { ...pendingClass };
                    delete approvedClass.status;          // ← Removes pending status
                    delete approvedClass.submittedAt;     // ← Removes submission timestamp
                    delete approvedClass.approvalToken;   // ← Removes approval token
                    
                    this.classes.push(approvedClass);           // Add to main calendar
                    this.pendingClasses.splice(pendingIndex, 1); // Remove from pending
                    
                    this.saveClassesToStorage();
                    this.savePendingClassesToStorage();
                    this.autoSavePendingToCloud(); // Update shared Firebase
                    this.generateCalendar();
                    this.updateTeacherFilter();
                    this.autoSaveToCloud();
                    
                    this.showNotification(`✅ Class "${pendingClass.name}" has been approved and added to the calendar!`, 6000);
                    
                } else if (approvalAction === 'reject') {
                    // Remove from pending classes completely
                    this.pendingClasses.splice(pendingIndex, 1);
                    this.savePendingClassesToStorage();
                    this.autoSavePendingToCloud(); // Update shared Firebase
                    
                    this.showNotification(`❌ Class "${pendingClass.name}" has been rejected and removed from pending.`, 6000);
                }
            } else {
                // Check pending edits (for editing existing classes)
                const pendingEditIndex = this.pendingEdits.findIndex(c => c.approvalToken === approvalToken);
                
                if (pendingEditIndex !== -1) {
                    const pendingEdit = this.pendingEdits[pendingEditIndex];
                    
                    if (approvalAction === 'approve') {
                        // Approve edit: update the original class with new data and remove from pending edits
                        const classIndex = this.classes.findIndex(c => c.id === pendingEdit.originalId);
                        console.log(`Found class to edit at index: ${classIndex}, originalId: ${pendingEdit.originalId}`);
                        
                        if (classIndex !== -1) {
                            // Update the class with new data (remove edit-specific fields)
                            const updatedClass = { ...pendingEdit };
                            delete updatedClass.originalId;
                            delete updatedClass.originalData;
                            delete updatedClass.status;
                            delete updatedClass.editRequestedAt;
                            delete updatedClass.approvalToken;
                            
                            this.classes[classIndex] = updatedClass;
                            console.log(`Class updated successfully`);
                        }
                        this.pendingEdits.splice(pendingEditIndex, 1); // Remove from pending edits
                        
                        // Save changes
                        this.saveClassesToStorage();
                        this.savePendingEditsToStorage();
                        this.generateCalendar();
                        this.updateTeacherFilter();
                        
                        // Sync to cloud
                        this.autoSavePendingEditsToCloud();
                        this.autoSaveToCloud();
                        
                        this.showNotification(`✅ Class "${pendingEdit.name}" edit has been approved and updated!`, 6000);
                        
                    } else if (approvalAction === 'reject') {
                        // Reject edit: just remove from pending edits, keep original class unchanged
                        this.pendingEdits.splice(pendingEditIndex, 1);
                        this.savePendingEditsToStorage();
                        this.autoSavePendingEditsToCloud();
                        
                        this.showNotification(`❌ Edit request for "${pendingEdit.name}" has been rejected. Original class remains unchanged.`, 6000);
                    }
                } else {
                    // Check pending deletions (for deleting existing classes)
                    const pendingDeletionIndex = this.pendingDeletions.findIndex(c => c.approvalToken === approvalToken);
                    
                    if (pendingDeletionIndex !== -1) {
                        const pendingDeletion = this.pendingDeletions[pendingDeletionIndex];
                        
                        if (approvalAction === 'approve') {
                            // Approve deletion: remove class from main calendar and remove from pending deletions
                            const classIndex = this.classes.findIndex(c => c.id === pendingDeletion.originalId);
                            console.log(`Found class to delete at index: ${classIndex}, originalId: ${pendingDeletion.originalId}`);
                            console.log(`Classes before deletion: ${this.classes.length}`);
                            
                            if (classIndex !== -1) {
                                this.classes.splice(classIndex, 1); // Remove class from calendar
                                console.log(`Classes after deletion: ${this.classes.length}`);
                            }
                            this.pendingDeletions.splice(pendingDeletionIndex, 1); // Remove from pending deletions
                            
                            // Force UI refresh immediately
                            this.saveClassesToStorage();
                            this.savePendingDeletionsToStorage();
                            this.generateCalendar(); // Force UI refresh first
                            this.updateTeacherFilter();
                            
                            // Then sync to cloud
                            this.autoSavePendingDeletionsToCloud(); // Update shared Firebase
                            this.autoSaveToCloud(); // Save main classes collection
                            
                            console.log('Deletion approved - UI refreshed and cloud sync initiated');
                            this.showNotification(`✅ Class "${pendingDeletion.name}" has been deleted from the calendar!`, 6000);
                        } else if (approvalAction === 'reject') {
                            // Reject deletion: just remove from pending deletions, keep class on calendar
                            this.pendingDeletions.splice(pendingDeletionIndex, 1);
                            this.savePendingDeletionsToStorage();
                            this.autoSavePendingDeletionsToCloud(); // Update shared Firebase
                            
                            this.showNotification(`❌ Deletion request for "${pendingDeletion.name}" has been rejected. Class remains on calendar.`, 6000);
                        }
                    } else {
                        this.showNotification('Approval token not found. The class may have already been processed.', 4000);
                    }
                }
            }
            
            // Clean up URL parameters
            const newUrl = window.location.origin + window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Add notification animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
        
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    // Initialize the app
    new DanceScheduler();
});
