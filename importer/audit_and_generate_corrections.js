const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const fs = require('fs');

const API_URL = 'https://pure-grace-production-6c99.up.railway.app';

function generateToken() {
    const crypto = require('crypto');
    const secretBase64 = process.env.JWT_SECRET;
    if (!secretBase64) throw new Error('JWT_SECRET is missing from .env');
    const secretBytes = Buffer.from(secretBase64, 'base64');
    const b64Url = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64').replaceAll('=','').replaceAll('+','-').replaceAll('/','_');
    const h = b64Url({ alg:'HS256', typ:'JWT' });
    const p = b64Url({ sub:'admin-importer-script', role:'ROLE_ADMIN', iat: Math.floor(Date.now()/1000), exp: Math.floor(Date.now()/1000)+3600*24 });
    return h+'.'+p+'.'+ crypto.createHmac('sha256', secretBytes).update(h+'.'+p).digest('base64').replaceAll('=','').replaceAll('+','-').replaceAll('/','_');
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchPage(token, page, pageSize, retries = 5) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const resp = await fetch(`${API_URL}/api/v1/admin/products?page=${page}&size=${pageSize}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(30000)
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return await resp.json();
    } catch (err) {
      if (attempt < retries) await sleep(2000 * attempt);
      else throw err;
    }
  }
}

const CATEGORIES = [
  'Sunglasses',
  'Wallets',
  'Ladies Watches',
  'Ladies Sunglasses',
  'Handbags',
  'Sneakers'
];

(async () => {
  const token = generateToken();
  let totalPages = 1;
  const pageSize = 100;
  let allProducts = [];

  for (let page = 0; page < totalPages; page++) {
    const data = await fetchPage(token, page, pageSize);
    totalPages = data.totalPages;
    const products = data.content || [];
    const filtered = products.filter(p => CATEGORIES.includes((p.category || '').trim()));
    allProducts = allProducts.concat(filtered);
    process.stderr.write(`Page ${page+1}/${totalPages}: found ${filtered.length} matching products\n`);
    await sleep(200);
  }

  const corrections = {};
  const replacements = [
    [/\bDio\b/ig, 'Dior'], [/\bHuugo Boss\b/ig, 'Hugo Boss'], [/\bHugo Boos\b/ig, 'Hugo Boss'],
    [/\bHugo Bos\b/ig, 'Hugo Boss'], [/\bHugo Bos S\b/ig, 'Hugo Boss'], [/\bHug Boss\b/ig, 'Hugo Boss'],
    [/\bHugoBossMan\b/ig, 'Hugo Boss Man'], [/\bLouiis Vuitton\b/ig, 'Louis Vuitton'],
    [/\bLoui Vuitton\b/ig, 'Louis Vuitton'], [/\bLv Loui Vuittion\b/ig, 'Louis Vuitton'],
    [/\bLv Vuittion\b/ig, 'Louis Vuitton'], [/\bLv Louis Vuitton\b/ig, 'Louis Vuitton'],
    [/\bLv Loui\b/ig, 'Louis Vuitton'], [/\bLOUII S VUITTON\b/ig, 'Louis Vuitton'],
    [/\bLouis Vuitton BELT LV\b/ig, 'Louis Vuitton Belt'], [/\bAx Arma\b/ig, 'AX Armani Exchange'],
    [/\bAx Arma Exchange\b/ig, 'AX Armani Exchange'], [/\bAx Armani Exchange\b/ig, 'AX Armani Exchange'],
    [/\bArma\b/ig, 'Armani'], [/\bCoaach\b/ig, 'Coach'], [/\bCoac\b/ig, 'Coach'],
    [/\bBURBERRRY\b/ig, 'Burberry'], [/\bBurber r\b/ig, 'Burberry'], [/\bHerme Paris\b/ig, 'Hermes Paris'],
    [/\bDIOOR\b/ig, 'Dior'], [/\bDiio r\b/ig, 'Dior'], [/\bLEVIIS\b/ig, 'Levis'],
    [/\bTomm y Hilgi\b/ig, 'Tommy Hilfiger'], [/\bTomm y Hilgif\b/ig, 'Tommy Hilfiger'],
    [/\bTOMMMY HILFIGER\b/ig, 'Tommy Hilfiger'], [/\bJagua\b/ig, 'Jaguar'], [/\bBalenciag\b/ig, 'Balenciaga'],
    [/\bVelentin\b/ig, 'Valentino'], [/\bCalviin Klein\b/ig, 'Calvin Klein'], [/\bCk Calvi\b/ig, 'CK Calvin Klein'],
    [/\bSalvatore feraaga\b/ig, 'Salvatore Ferragamo'], [/\bSalvator faragamo\b/ig, 'Salvatore Ferragamo'],
    [/\bSalvator faragam o\b/ig, 'Salvatore Ferragamo'], [/\bfaragamo\b/ig, 'Ferragamo'],
    [/\bARMAANI\b/ig, 'Armani'], [/\bARMAI\b/ig, 'Armani'], [/\bARMA I\b/ig, 'Armani'],
    [/\bCalvin Klien\b/ig, 'Calvin Klein'], [/\bCalvi Klein\b/ig, 'Calvin Klein'], [/\bCALVIN KLEIIN\b/ig, 'Calvin Klein'],
    [/\bValentiino\b/ig, 'Valentino'], [/\bValentin Uomo\b/ig, 'Valentino Uomo'], [/\bGUCCCI\b/ig, 'Gucci'],
    [/\bGUCC I\b/ig, 'Gucci'], [/\bGucc\b/ig, 'Gucci'], [/\bCHANEEL\b/ig, 'Chanel'],
    [/\bCHANNEL\b/ig, 'Chanel'], [/\bchannel\b/ig, 'Chanel'], [/\bCHANE L\b/ig, 'Chanel'],
    [/\bPRADDA\b/ig, 'Prada'], [/\bPrad Paradigme\b/ig, 'Prada Paradigme'], [/\bELIE SAA B\b/ig, 'Elie Saab'],
    [/\bHERMEES\b/ig, 'Hermes'], [/\bNikee\b/ig, 'Nike'], [/\bJordann\b/ig, 'Jordan'], [/\bAdiadas\b/ig, 'Adidas'],
    [/\bAdidaas\b/ig, 'Adidas'], [/\bAdiidas\b/ig, 'Adidas'], [/\bYezzy\b/ig, 'Yeezy'], [/\bCasiio\b/ig, 'Casio'],
    [/\bSeikoo\b/ig, 'Seiko'], [/\bRolexx\b/ig, 'Rolex'], [/\bVersac\b/ig, 'Versace'], [/\bRay bann\b/ig, 'Ray-Ban'],
    [/\bRayban\b/ig, 'Ray-Ban'], [/\bOakleyy\b/ig, 'Oakley'], [/\bBvlgar\b/ig, 'Bvlgari'],
    [/\bLoui\s+Vuittion\b/ig, 'Louis Vuitton'], [/\bLouiis\s+Vuitton\b/ig, 'Louis Vuitton']
  ];

  for (const p of allProducts) {
    let name = p.name;
    let original = name;
    name = name.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
    for (const [regex, replacement] of replacements) {
      name = name.replace(regex, replacement);
    }
    name = name.replace(/Giorgio Armani/ig, 'Giorgio armani');

    if (name !== original) {
      corrections[p.id] = { name: name, category: p.category }; // Storing category for apply script mapping if needed
    }
  }

  fs.writeFileSync('/tmp/all_categories_corrections.json', JSON.stringify(corrections, null, 2));
  console.log(`Generated ${Object.keys(corrections).length} corrections`);
})();
