const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { normalizeProductName } = require('./src/content/productNameNormalizer');
const { generateProductContent } = require('./src/content/contentGenerator');

const API_URL = 'https://pure-grace-production-6c99.up.railway.app';
let ADMIN_TOKEN = '';

const explicitMapping = {
    'Fossi_il Skeleton': 'Fossil Skeleton',
    'Emporii_o Amrnai Ceramic': 'Emporio Armani Ceramic',
    'Fossii_l commuter twist automatic': 'Fossil Commuter Twist Automatic',
    'Diesee_l 10 Bar': 'Diesel 10 Bar',
    'Casio Edific Efv-160d': 'Casio Edifice EFV-160D',
    'Fossii_l Townsmen': 'Fossil Townsman',
    'Tommy Hilfigee_r skeleton automatic': 'Tommy Hilfiger Skeleton Automatic',
    'Patek philipe skeleton Celebrity': 'Patek Philippe Skeleton Celebrity',
    'Seiko 5 Sports Automatic Full Black ': 'Seiko 5 Sports Automatic Full Black',
    'Roleex GMT Master 2 (Premium Quality) - 171816': 'Rolex GMT-Master II',
    'tissoot 1853 prx silver sky blue dail 171816': 'Tissot 1853 PRX Silver Sky Blue Dial',
    'Casio g shock gm110 silver ': 'Casio G-Shock GM-110 Silver',
    'TAG Heuuer Formula 1 x Mario Kart Limited Edition Chronograph Tourbillon': 'TAG Heuer Formula 1 x Mario Kart Limited Edition Chronograph Tourbillon',
    'omegga Grey Sun Moon And Earth with black strip 171816': 'Omega Sun Moon and Earth Grey',
    'Tisssot gothic demon Limited Edition 171816': 'Tissot Gothic Demon Limited Edition',
    'Roleee_x Oyster Perpetual Land Dweller': 'Rolex Oyster Perpetual Land Dweller',
    'Tommm_y TH85 chronograph': 'Tommy Hilfiger TH85 Chronograph',
    'ROLEE_X PREMIUM AUTOMATIC WATCH': 'Rolex Premium Automatic',
    'Roleex Black Day-Date': 'Rolex Day-Date Black',
    'Seiko nautiko Mod Automatic open heart white w307': 'Seiko Nautiko Mod Automatic Open Heart White',
    'Exchange Armaann_i Ax2418 Hampton Automatic full black and gold ': 'Armani Exchange Hampton Automatic AX2418 Full Black Gold',
    'Michael Kor Lexington MK8281': 'Michael Kors Lexington MK8281',
    '_Tissoot_1853_Day_Date_Tiffany': 'Tissot 1853 Day-Date Tiffany',
    'Role_ex Moon': 'Rolex Moonphase',
    'Rolee_x Oyster Perpetual Daytona Chronograph Silver': 'Rolex Oyster Perpetual Cosmograph Daytona Silver',
    'Roger Dubuis Skeleton Automatic ( Back open )': 'Roger Dubuis Skeleton Automatic Open Heart',
    'Cartiee_r Drive De Moon Phases': 'Cartier Drive de Cartier Moon Phases',
    'Guess phonix Gold Green': 'Guess Phoenix Gold Green',
    'Rolee_x Daytona Oysterflex Eye Of Tiger Copper': 'Rolex Daytona Oysterflex Eye of the Tiger Copper',
    'Maserati Potenza - J841 Silver Black': 'Maserati Potenza Silver Black',
    'MAURICE LACROIX MEN WATCH': 'Maurice Lacroix',
    'Radd_o jubli black gold mens ': 'Rado Jubile Black Gold',
    'Boss fiber 124 ': 'Hugo Boss Fiber',
    'Omegg_a speedmaster Snoopy 50Th Anniversary': 'Omega Speedmaster Silver Snoopy Award 50th Anniversary',
    'PATEE_K PHILIPPE COMPLICATIONS': 'Patek Philippe Complications',
    'Cartiie_r Santos Automatic brown Roman ank ': 'Cartier Santos Automatic Brown',
    '_Seikko_King_Vanac_Urban_Brown': 'Seiko King Seiko Vanac Urban Brown',
    'Edifice casi_0 EF558D WC 171816 black gold': 'Casio Edifice EF-558D Black Gold',
    'Marvel x fossi_il imited Edition Automatic Spider Man': 'Marvel x Fossil Limited Edition Automatic Spider-Man',
    'Invicta marvel black panther': 'Invicta Marvel Black Panther',
    'Rolee_x Oyster Perpetual Gmt Master': 'Rolex GMT-Master',
    'Maserati Automatic AAA (Open Back)': 'Maserati Automatic Open Heart',
    'Role_ex Skeleton': 'Rolex Skeleton'
};

function generateAdminJwt() {
    const secretBase64 = process.env.JWT_SECRET;
    const secretBytes = Buffer.from(secretBase64, 'base64');
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = { sub: 'admin-importer-script', role: 'ROLE_ADMIN', iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600 * 24 * 7 };
    const b64Url = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const headerEnc = b64Url(header), payloadEnc = b64Url(payload);
    const signature = crypto.createHmac('sha256', secretBytes).update(headerEnc + '.' + payloadEnc).digest('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    ADMIN_TOKEN = headerEnc + '.' + payloadEnc + '.' + signature;
}

async function runAudit() {
    generateAdminJwt();
    console.log('Fetching all products...');
    let allProducts = [], page = 0;
    
    while (true) {
        const res = await fetch(`${API_URL}/api/v1/admin/products?page=${page}&size=200`, {
            headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
        });
        const json = await res.json();
        allProducts.push(...json.content);
        if (json.last) break;
        page++;
    }

    const watches = allProducts.filter(p => p.category === 'Watches');
    // We only care about the latest 200 watches (the freshly imported ones)
    watches.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const newWatches = watches.slice(0, 200);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const p of newWatches) {
        const rawName = p.originalName || p.name;
        
        let cleanName = explicitMapping[rawName] || explicitMapping[rawName.trim()];
        if (!cleanName) {
            cleanName = normalizeProductName(rawName);
        }

        const generatedContent = generateProductContent({
            productName: cleanName,
            brand: p.brand,
            category: p.category
        });

        // Always put
        const putPayload = {
            name: cleanName,
            originalName: p.originalName || p.name,
            brand: p.brand,
            category: p.category,
            basePrice: p.basePrice,
            discountedPrice: p.discountedPrice,
            imageUrls: p.imageUrls,
            videoUrls: p.videoUrls,
            visible: p.isVisible !== undefined ? p.isVisible : p.visible,
            variants: p.variants || [],
            searchName: generatedContent.searchName,
            searchBrand: generatedContent.searchBrand,
            searchText: generatedContent.searchText,
            description: generatedContent.description,
            sourceSite: p.sourceSite,
            sourceProductId: p.sourceProductId
        };

        const putRes = await fetch(`${API_URL}/api/v1/admin/products/${p.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ADMIN_TOKEN}`
            },
            body: JSON.stringify(putPayload)
        });

        if (putRes.ok) {
            updatedCount++;
            console.log(`[UPDATED] ${rawName} -> ${cleanName}`);
        } else {
            console.error(`[ERROR] Failed to update ${rawName}: HTTP ${putRes.status}`);
        }
    }
    
    console.log('--- DONE ---');
    console.log(`Successfully mapped and updated: ${updatedCount}`);
}

runAudit().catch(console.error);
