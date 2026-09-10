const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const API_URL = 'https://pure-grace-production-6c99.up.railway.app';

function generateToken() {
    const crypto = require('crypto');
    const secretBase64 = process.env.JWT_SECRET;
    if (!secretBase64) throw new Error('JWT_SECRET is missing from .env');
    const secretBytes = Buffer.from(secretBase64, 'base64');
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = { sub: 'admin-importer-script', role: 'ROLE_ADMIN', iat: Math.floor(Date.now()/1000), exp: Math.floor(Date.now()/1000)+3600*24 };
    const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64').replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
    const h = b64(header), p = b64(payload);
    return h+'.'+p+'.'+crypto.createHmac('sha256', secretBytes).update(h+'.'+p).digest('base64').replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
}

(async () => {
    let all = [], page = 0;
    const token = generateToken();
    while (true) {
        const res = await fetch(`${API_URL}/api/v1/admin/products?page=${page}&size=200`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        all.push(...data.content);
        if (data.last) break;
        page++;
    }
    const watches = all.filter(p => p.category === 'Watches');
    // Sort by created_at desc if available
    watches.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const newWatches = watches.slice(0, 200).map(w => ({ id: w.id, originalName: w.originalName, name: w.name, createdAt: w.createdAt }));
    console.log(JSON.stringify(newWatches, null, 2));
})();
