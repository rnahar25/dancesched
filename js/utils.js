// Pure utility functions

export const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

export const PREDEFINED_STYLES = [
    'Bollywood', 'Bollywood Fusion', 'Bollywood Street Jazz',
    'Bhangra', 'Bhangra Fusion',
    'Bharatnatyam Fusion', 'Semiclassical',
    'Garba-Raas Fusion',
    'Contemporary', 'Hip Hop Fusion',
    'Heels', 'Bolly Femme',
    'IMGE',
    'Other'
];

export function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function generateApprovalToken() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 16);
}

export function formatDate(date) {
    return date.toISOString().split('T')[0];
}

export function formatDisplayDate(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
}

export function formatTime(timeStr) {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
}

export function getRegionFromUrl() {
    return window.location.pathname.toLowerCase().includes('/bayarea') ? 'bayarea' : 'nyc';
}

export function updateUrlForRegion(region) {
    window.history.pushState({ region }, '', '/' + region);
}
