// Dance Schedule Application
class DanceScheduler {
    constructor() {
        this.currentDate = new Date();
        this.currentYear = this.currentDate.getFullYear();
        this.currentMonth = this.currentDate.getMonth();
        this.classes = this.loadClassesFromStorage();
        this.filteredTeacher = 'all';
        this.editingClassId = null;
        
        this.monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.generateCalendar();
        this.updateTeacherFilter();
        this.setupCloudStorage();
        this.loadSampleData();
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
        
        // Teacher filter
        document.getElementById('teacherFilter').addEventListener('change', (e) => this.filterByTeacher(e.target.value));
        
        // Modal close buttons
        document.querySelectorAll('.close').forEach(close => {
            close.addEventListener('click', () => this.closeModal());
        });
        
        // Details modal buttons
        document.getElementById('editClassBtn').addEventListener('click', () => this.editSelectedClass());
        document.getElementById('deleteClassBtn').addEventListener('click', () => this.deleteSelectedClass());
        document.getElementById('closeDetailsBtn').addEventListener('click', () => this.closeModal());
        
        
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
                const styleClass = classObj.style.toLowerCase().replace(' ', '');
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
        this.editingClassId = null;
    }
    
    handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const classData = {
            id: this.editingClassId || this.generateId(),
            name: formData.get('className') || document.getElementById('className').value,
            teacher: formData.get('teacher') || document.getElementById('teacher').value,
            date: formData.get('date') || document.getElementById('date').value,
            time: formData.get('time') || document.getElementById('time').value,
            duration: parseInt(formData.get('duration') || document.getElementById('duration').value),
            style: formData.get('style') || document.getElementById('style').value,
            level: formData.get('level') || document.getElementById('level').value,
            location: formData.get('location') || document.getElementById('location').value || '',
            ticketLink: formData.get('ticketLink') || document.getElementById('ticketLink').value || ''
        };
        
        // Validate required fields
        if (!classData.name || !classData.teacher || !classData.date || !classData.time) {
            alert('Please fill in all required fields.');
            return;
        }
        
        if (this.editingClassId) {
            // Update existing class
            const index = this.classes.findIndex(c => c.id === this.editingClassId);
            if (index !== -1) {
                this.classes[index] = classData;
            }
        } else {
            // Add new class
            this.classes.push(classData);
        }
        
        this.saveClassesToStorage();
        this.generateCalendar();
        this.updateTeacherFilter();
        this.closeModal();
        
        // Auto-save to cloud
        this.autoSaveToCloud();
        
        // Show success message
        this.showNotification(this.editingClassId ? 'Class updated successfully!' : 'Class added successfully!');
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
                <span class="detail-value">${classObj.teacher}</span>
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
        document.getElementById('style').value = classObj.style;
        document.getElementById('level').value = classObj.level;
        document.getElementById('location').value = classObj.location || '';
        document.getElementById('ticketLink').value = classObj.ticketLink || '';
        
        editModal.style.display = 'block';
    }
    
    deleteSelectedClass() {
        const modal = document.getElementById('detailsModal');
        const classId = modal.dataset.classId;
        
        if (confirm('Are you sure you want to delete this class?')) {
            // Get class data before deleting for email notification
            const classToDelete = this.classes.find(c => c.id === classId);
            
            this.classes = this.classes.filter(c => c.id !== classId);
            this.saveClassesToStorage();
            this.generateCalendar();
            this.updateTeacherFilter();
            this.closeModal();
            
            
            // Auto-save to cloud after deletion
            this.autoSaveToCloud();
            
            this.showNotification('Class deleted successfully!');
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
            // Load from Firebase Firestore
            const doc = await this.db.collection('danceSchedules').doc(this.userId).get();
            
            if (doc.exists) {
                const cloudData = doc.data();
                const cloudClasses = cloudData.classes || [];
                
                // Only auto-load if cloud has more recent data or local is empty
                const localLastModified = localStorage.getItem('danceScheduler_lastModified') || '1970-01-01T00:00:00.000Z';
                const cloudLastModified = cloudData.lastUpdated || '1970-01-01T00:00:00.000Z';
                
                if (this.classes.length === 0 || cloudLastModified > localLastModified) {
                    this.classes = cloudClasses;
                    this.saveClassesToStorage();
                    localStorage.setItem('danceScheduler_lastModified', cloudLastModified);
                    
                    if (cloudClasses.length > 0) {
                        this.generateCalendar();
                        this.updateTeacherFilter();
                        console.log(`Auto-loaded ${cloudClasses.length} classes from cloud`);
                    }
                }
            }
            
        } catch (error) {
            console.error('Auto-load error:', error);
            // Continue with local data if cloud load fails
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
    
}

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

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DanceScheduler();
});
