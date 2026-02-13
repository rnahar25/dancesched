// Dance class scraper with Firebase deduplication
// Usage: node scraper.js [--save] [--upload]
// Install: npm install puppeteer firebase-admin

const https = require('https');
const fs = require('fs');

let puppeteer, admin;
try { puppeteer = require('puppeteer'); } catch (e) {}
try { admin = require('firebase-admin'); } catch (e) {}

const FIREBASE_CONFIG = {
    projectId: 'dancesched-b95fc',
    databaseURL: 'https://dancesched-b95fc.firebaseio.com'
};

const SOURCES = [
    {
        name: 'Vinita Hazari',
        url: 'https://vinihazari.com/shop/sort/new-york-classes/',
        teacher: 'Vinita Hazari',
        instagram: 'vinihazari',
        region: 'nyc',
        parse: parseViniHazari,
        needsBrowser: false
    },
    {
        name: 'IMGE Dance',
        url: 'https://www.imgedance.com/events',
        teacher: 'Ishita Mili',
        instagram: 'imaboringartist',
        region: 'nyc',
        parse: parseIMGE,
        needsBrowser: true
    },
    {
        name: 'Dance With Tushita',
        url: 'https://www.dancewithtushita.com/workshops',
        teacher: 'Tushita Shrivastav',
        instagram: 'tushita.shrivastav',
        region: 'nyc',
        parse: parseTushita,
        needsBrowser: true
    }
];

// --- Fetch functions ---
function fetchHTML(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

async function fetchWithBrowser(url) {
    if (!puppeteer) throw new Error('Puppeteer not installed');
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    const html = await page.content();
    await browser.close();
    return html;
}

// --- Firebase functions ---
async function getExistingClasses() {
    if (!admin) {
        console.log('Note: Install firebase-admin for deduplication: npm install firebase-admin\n');
        return [];
    }
    
    if (!admin.apps.length) {
        admin.initializeApp({ credential: admin.credential.applicationDefault(), ...FIREBASE_CONFIG });
    }
    
    const db = admin.firestore();
    const doc = await db.collection('danceSchedules').doc('shared_schedule').get();
    return doc.exists ? (doc.data().classes || []) : [];
}

async function uploadToFirebase(classes) {
    if (!admin) throw new Error('firebase-admin not installed');
    
    if (!admin.apps.length) {
        admin.initializeApp({ credential: admin.credential.applicationDefault(), ...FIREBASE_CONFIG });
    }
    
    const db = admin.firestore();
    await db.collection('danceSchedules').doc('shared_schedule').set({
        userId: 'shared_schedule',
        classes,
        lastUpdated: new Date().toISOString()
    });
}

// --- Parsers ---
function parseViniHazari(html, source) {
    const classes = [];
    const year = new Date().getFullYear();
    const regex = /(\d{2})\/(\d{2})\s+([^|]+)\|\s*([^|]+)\|\s*(\d{1,2})-(\d{1,2})(AM|PM)/gi;
    let match;
    
    while ((match = regex.exec(html)) !== null) {
        const [, month, day, songName, style, startHour, , ampm] = match;
        let hour = parseInt(startHour);
        if (ampm.toUpperCase() === 'PM' && hour !== 12) hour += 12;
        
        classes.push({
            name: songName.trim(),
            teacher: source.teacher,
            teacherInstagram: source.instagram,
            date: `${year}-${month}-${day.padStart(2, '0')}`,
            time: `${hour.toString().padStart(2, '0')}:00`,
            duration: 120,
            style: mapStyle(style.trim()),
            level: 'All Levels',
            location: 'NYC (TBA)',
            ticketLink: source.url,
            region: source.region
        });
    }
    return classes;
}

function parseIMGE(html, source) {
    const classes = [];
    const eventRegex = /<h1[^>]*class="eventlist-title"[^>]*>([^<]+)<\/h1>[\s\S]*?<time[^>]*datetime="(\d{4}-\d{2}-\d{2})"[^>]*>[\s\S]*?(\d{1,2}):(\d{2})\s*(AM|PM)/gi;
    let match;
    
    while ((match = eventRegex.exec(html)) !== null) {
        const [, title, date, hour, min, ampm] = match;
        if (/gala|festival|kinetic/i.test(title)) continue;
        
        let h = parseInt(hour);
        if (ampm.toUpperCase() === 'PM' && h !== 12) h += 12;
        
        let teacher = source.teacher;
        if (/maddie.*shiv/i.test(title)) teacher = 'Maddie & Shiv';
        if (/ramita.*ishita/i.test(title)) teacher = 'Ramita & Ishita';
        
        classes.push({
            name: title.replace(/NYC:|SF:/gi, '').trim(),
            teacher,
            teacherInstagram: source.instagram,
            date,
            time: `${h.toString().padStart(2, '0')}:${min}`,
            duration: /intensive/i.test(title) ? 180 : 120,
            style: 'IMGE',
            level: 'All Levels',
            location: /SF:/i.test(title) ? 'San Francisco' : 'NYC',
            ticketLink: source.url,
            region: /SF:/i.test(title) ? 'bayarea' : source.region
        });
    }
    return classes;
}

function parseTushita(html, source) {
    const classes = [];
    const year = new Date().getFullYear();
    const regex = /class="product-title"[^>]*>([^<]+)<[\s\S]*?(\d{1,2})\/(\d{1,2})\s*[@]?\s*(\d{1,2})\s*(AM|PM)/gi;
    let match;
    
    while ((match = regex.exec(html)) !== null) {
        const [, title, month, day, hour, ampm] = match;
        if (/gift card|performance lab|bundle/i.test(title)) continue;
        
        let h = parseInt(hour);
        if (ampm.toUpperCase() === 'PM' && h !== 12) h += 12;
        
        let style = 'Bollywood Fusion';
        if (/bhangra/i.test(title)) style = 'Bhangra';
        if (/baddies/i.test(title)) style = 'Bolly Femme';
        
        classes.push({
            name: title.replace(/ROUND\s*\d+/gi, '').replace(/BOLLY\s*(FUSION|BADDIES):/gi, '').trim(),
            teacher: source.teacher,
            teacherInstagram: source.instagram,
            date: `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`,
            time: `${h.toString().padStart(2, '0')}:00`,
            duration: 120,
            style,
            level: 'All Levels',
            location: 'NYC (TBA)',
            ticketLink: source.url,
            region: source.region
        });
    }
    return classes;
}

// --- Helpers ---
function mapStyle(style) {
    const s = style.toLowerCase();
    if (s.includes('semi-classical')) return 'Semiclassical';
    if (s.includes('bolly femme') || s.includes('femme')) return 'Bolly Femme';
    if (s.includes('bhangra')) return 'Bhangra';
    if (s.includes('fusion')) return 'Bollywood Fusion';
    return 'Bollywood';
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Check if class already exists (by date + time + teacher)
function classKey(c) {
    return `${c.date}|${c.time}|${c.teacher}`;
}

function findNewClasses(scraped, existing) {
    const existingKeys = new Set(existing.map(classKey));
    return scraped.filter(c => !existingKeys.has(classKey(c)));
}

function dedupe(classes) {
    const seen = new Set();
    return classes.filter(c => {
        const key = classKey(c);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

// --- Main ---
async function scrapeAll() {
    const allClasses = [];
    const today = new Date().toISOString().split('T')[0];
    
    for (const source of SOURCES) {
        try {
            console.log(`Scraping ${source.name}...`);
            
            let html;
            if (source.needsBrowser) {
                if (!puppeteer) {
                    console.log(`  Skipped (needs puppeteer)`);
                    continue;
                }
                html = await fetchWithBrowser(source.url);
            } else {
                html = await fetchHTML(source.url);
            }
            
            const classes = source.parse(html, source);
            const futureClasses = classes
                .filter(c => c.date >= today && c.name)
                .map(c => ({ ...c, id: generateId() }));
            
            console.log(`  Found ${futureClasses.length} upcoming classes`);
            allClasses.push(...futureClasses);
        } catch (err) {
            console.error(`  Error: ${err.message}`);
        }
    }
    
    return dedupe(allClasses);
}

async function main() {
    const args = process.argv.slice(2);
    const saveToFile = args.includes('--save');
    const uploadToFB = args.includes('--upload');
    
    // Get existing classes from Firebase
    console.log('Fetching existing classes from Firebase...');
    let existingClasses = [];
    try {
        existingClasses = await getExistingClasses();
        console.log(`  Found ${existingClasses.length} existing classes\n`);
    } catch (err) {
        console.log(`  Could not fetch: ${err.message}\n`);
    }
    
    // Scrape new classes
    const scrapedClasses = await scrapeAll();
    
    // Find classes not already in Firebase
    const newClasses = findNewClasses(scrapedClasses, existingClasses);
    
    console.log('\n=== RESULTS ===');
    console.log(`Scraped: ${scrapedClasses.length} classes`);
    console.log(`Already in calendar: ${scrapedClasses.length - newClasses.length}`);
    console.log(`New classes to add: ${newClasses.length}`);
    
    if (newClasses.length > 0) {
        console.log('\n=== NEW CLASSES ===\n');
        console.log(JSON.stringify(newClasses, null, 2));
        
        if (saveToFile) {
            fs.writeFileSync('new-classes.json', JSON.stringify(newClasses, null, 2));
            console.log('\nSaved to new-classes.json');
        }
        
        if (uploadToFB) {
            console.log('\nUploading to Firebase...');
            try {
                const merged = [...existingClasses, ...newClasses];
                await uploadToFirebase(merged);
                console.log(`✅ Added ${newClasses.length} new classes to calendar!`);
            } catch (err) {
                console.error(`❌ Upload failed: ${err.message}`);
            }
        }
    } else {
        console.log('\n✅ Calendar is up to date!');
    }
    
    if (!uploadToFB && newClasses.length > 0) {
        console.log('\nRun with --upload to add new classes to Firebase');
    }
}

main().catch(console.error);
