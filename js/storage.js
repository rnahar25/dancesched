// Storage module - localStorage and Firebase operations

const FIREBASE_CONFIG = {
    apiKey: "AIzaSyD3_Oxk4hBOmE_g3g5KMtnSfhFkcQ46vbc",
    authDomain: "dancesched-b95fc.firebaseapp.com",
    projectId: "dancesched-b95fc",
    storageBucket: "dancesched-b95fc.firebasestorage.app",
    messagingSenderId: "534215773388",
    appId: "1:534215773388:web:0c66fa6ccee313a7110669"
};

export class Storage {
    constructor() {
        this.db = null;
        this.userId = 'shared_schedule';
        this.disableRealtimeListener = false;
    }

    // Local Storage
    load(key, fallback = []) {
        try {
            const stored = localStorage.getItem(key);
            return stored ? JSON.parse(stored) : fallback;
        } catch (e) {
            console.error(`Error loading ${key}:`, e);
            return fallback;
        }
    }

    save(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            if (key === 'danceClasses') {
                localStorage.setItem('danceScheduler_lastModified', new Date().toISOString());
            }
        } catch (e) {
            console.error(`Error saving ${key}:`, e);
        }
    }

    // Firebase
    async initFirebase() {
        try {
            if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
            this.db = firebase.firestore();
            console.log('Firebase initialized');
            return true;
        } catch (e) {
            console.error('Firebase init error:', e);
            return false;
        }
    }

    async cloudSave(collection, docId, data, showSync) {
        if (!this.db) return;
        showSync?.(true);
        try {
            await this.db.collection(collection).doc(docId).set({
                ...data,
                lastUpdated: new Date().toISOString()
            });
        } catch (e) {
            console.error(`Cloud save error (${collection}):`, e);
        } finally {
            showSync?.(false);
        }
    }

    async cloudLoad(collection, docId) {
        if (!this.db) return null;
        try {
            const doc = await this.db.collection(collection).doc(docId).get();
            return doc.exists ? doc.data() : null;
        } catch (e) {
            console.error(`Cloud load error (${collection}):`, e);
            return null;
        }
    }

    setupRealtimeListener(onUpdate) {
        if (!this.db) return;
        this.db.collection('danceSchedules').doc(this.userId).onSnapshot(
            (doc) => {
                if (doc.exists && !this.disableRealtimeListener) {
                    const data = doc.data();
                    onUpdate(data.classes || [], data.lastUpdated);
                }
            },
            (e) => console.error('Realtime listener error:', e)
        );
    }

    mergeClasses(local, cloud) {
        const merged = new Map();
        local.forEach(c => merged.set(c.id, c));
        cloud.forEach(c => merged.set(c.id, c));
        return Array.from(merged.values()).sort((a, b) =>
            a.date !== b.date ? a.date.localeCompare(b.date) : a.time.localeCompare(b.time)
        );
    }

    hasChanges(oldArr, newArr) {
        if (oldArr.length !== newArr.length) return true;
        const sort = arr => [...arr].sort((a, b) => a.id.localeCompare(b.id));
        return JSON.stringify(sort(oldArr)) !== JSON.stringify(sort(newArr));
    }
}
