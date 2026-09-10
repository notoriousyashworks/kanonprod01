const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const crypto = require('crypto');
const API_URL = 'https://pure-grace-production-6c99.up.railway.app';
const secretBytes = Buffer.from(process.env.JWT_SECRET, 'base64');
const h = { alg: 'HS256', typ: 'JWT' }, p = { sub: 'admin', role: 'ROLE_ADMIN', iat: Math.floor(Date.now()/1000), exp: Math.floor(Date.now()/1000) + 3600 };
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64').replaceAll('=','').replaceAll('+','-').replaceAll('/','_');
const he = b64(h), pe = b64(p);
const sig = crypto.createHmac('sha256', secretBytes).update(he+'.'+pe).digest('base64').replaceAll('=','').replaceAll('+','-').replaceAll('/','_');
const token = he+'.'+pe+'.'+sig;
(async () => {
    const res = await fetch(`${API_URL}/api/v1/admin/products/7fc34720-9d39-4da9-9e9e-da0dce64a62e`, { headers: { 'Authorization': `Bearer ${token}` } });
    const j = await res.json();
    console.log(`Name: ${j.name}`);
    console.log(`Source ID: ${j.sourceProductId}`);
    console.log(`Images: ${j.imageUrls?.length}`);
    console.log(`First image: ${j.imageUrls?.[0]}`);
})();
