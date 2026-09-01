require('dotenv').config({ path: '/Users/yash/Desktop/kicksaura/.env' });
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const ImageKit = require('imagekit');

const DB_PATH = path.join(__dirname, 'db.json');
const PLAN_PATH = path.join(__dirname, 'tmp', 'batch_plan.json');

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

const withTimeout = (promise, ms, name) => {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout at ${name}`)), ms))
    ]);
};

async function runBulkRepair() {
    console.log(`Starting bulk video repair...`);
    
    const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    const plan = JSON.parse(fs.readFileSync(PLAN_PATH, 'utf-8'));
    
    const stats = {
        totalProcessed: 0,
        success: 0,
        skipped: 0,
        failed: 0,
        sourceFailures: 0,
        transcodeFailures: 0,
        uploadFailures: 0,
        purgeFailures: 0,
        verifyFailures: 0,
        manualAttention: []
    };
    
    const productsWithVideo = plan.filter(p => p.video);
    
    for (const p of productsWithVideo) {
        const productId = p.productId;
        stats.totalProcessed++;
        
        console.log(`\n[${stats.totalProcessed}/${productsWithVideo.length}] Processing product ${productId}...`);
        const state = db.imported[productId];
        if (!state || !state.media || !state.media.video) {
            console.log(`  - No imported video state found. Skipping.`);
            stats.skipped++;
            continue;
        }
        
        const ikUrl = state.media.video;
        const urlParts = ikUrl.split('/');
        const exactIkFileName = urlParts[urlParts.length - 1];
        
        // 1. Check if already valid
        try {
            const checkRes = await withTimeout(fetch(ikUrl + '?tr=orig', { method: 'HEAD' }), 10000, 'Check valid');
            const contentType = checkRes.headers.get('content-type');
            const contentLength = parseInt(checkRes.headers.get('content-length') || '0', 10);
            
            if (checkRes.status === 200 && contentType.includes('video/') && contentLength > 1000000) {
                console.log(`  - Video is already valid (Size: ${(contentLength/1024/1024).toFixed(2)}MB). Skipping.`);
                stats.skipped++;
                continue;
            }
        } catch (e) {
            console.log(`  - Failed to check existing URL: ${e.message}`);
        }
        
        const sourceUrl = `https://cdn.cartpe.in/images/video_upload/${p.video}`;
        console.log(`  - Fetching source: ${sourceUrl}`);
        
        let buffer;
        try {
            const response = await withTimeout(fetch(sourceUrl), 30000, 'Source download');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            buffer = Buffer.from(arrayBuffer);
        } catch (e) {
            console.log(`  - Source Download Failed: ${e.message}`);
            stats.sourceFailures++;
            stats.failed++;
            stats.manualAttention.push(productId);
            continue;
        }
        
        const movPath = path.join(__dirname, 'tmp', `tmp_${productId}.mov`);
        const mp4Path = path.join(__dirname, 'tmp', `tmp_${productId}.mp4`);
        
        try {
            fs.writeFileSync(movPath, buffer);
            if (fs.existsSync(mp4Path)) fs.unlinkSync(mp4Path);
            
            console.log(`  - Transcoding ${(buffer.length/1024/1024).toFixed(2)}MB to MP4...`);
            execSync(`ffmpeg -i "${movPath}" -c:v libx264 -preset ultrafast -crf 23 -c:a aac -b:a 128k -movflags +faststart -y "${mp4Path}"`, { stdio: 'ignore' });
        } catch (e) {
            console.log(`  - Transcode Failed: ${e.message}`);
            stats.transcodeFailures++;
            stats.failed++;
            stats.manualAttention.push(productId);
            if (fs.existsSync(movPath)) fs.unlinkSync(movPath);
            if (fs.existsSync(mp4Path)) fs.unlinkSync(mp4Path);
            continue;
        }
        
        let mp4Buffer;
        try {
            mp4Buffer = fs.readFileSync(mp4Path);
        } catch(e) {
            console.log(`  - Read MP4 Failed`);
            stats.failed++;
            continue;
        }
        
        try {
            console.log(`  - Uploading ${(mp4Buffer.length/1024/1024).toFixed(2)}MB to ImageKit...`);
            const uploadPromise = new Promise((resolve, reject) => {
                imagekit.upload({
                    file: mp4Buffer, 
                    fileName: exactIkFileName,
                    folder: `/kicks-aura/indiankicks/ladies-sunglasses/${productId}/`,
                    useUniqueFileName: false 
                }, function(error, result) {
                    if (error) reject(error);
                    else resolve(result);
                });
            });
            await withTimeout(uploadPromise, 60000, 'Upload');
        } catch (e) {
            console.log(`  - Upload Failed: ${e.message}`);
            stats.uploadFailures++;
            stats.failed++;
            stats.manualAttention.push(productId);
            fs.unlinkSync(movPath);
            fs.unlinkSync(mp4Path);
            continue;
        }
        
        try {
            console.log(`  - Purging cache...`);
            const purgePromise = new Promise((resolve, reject) => {
                imagekit.purgeCache(ikUrl, (err, res) => {
                    if(err) resolve(); // ignore error
                    else resolve();
                });
            });
            await withTimeout(purgePromise, 15000, 'Purge');
        } catch(e) {
            console.log(`  - Purge Timeout/Error (Ignored)`);
            stats.purgeFailures++;
        }
        
        // verify
        console.log(`  - Validating...`);
        // wait for purge a bit
        await new Promise(r => setTimeout(r, 8000));
        try {
            // Need a cache buster sometimes but we rely on purge. We can add a query param just to check
            const verifyRes = await withTimeout(fetch(ikUrl + '?tr=orig&t=' + Date.now(), { method: 'HEAD' }), 10000, 'Verify');
            const vType = verifyRes.headers.get('content-type') || '';
            const vLen = parseInt(verifyRes.headers.get('content-length') || '0', 10);
            
            if (verifyRes.status === 200 && vType.includes('video/') && vLen > 1000000) {
                console.log(`  - Successfully repaired!`);
                stats.success++;
            } else {
                console.log(`  - Verification failed (status: ${verifyRes.status}, type: ${vType}, len: ${vLen})`);
                stats.verifyFailures++;
                stats.failed++;
                stats.manualAttention.push(productId);
            }
        } catch(e) {
            console.log(`  - Verification Error: ${e.message}`);
            stats.verifyFailures++;
            stats.failed++;
            stats.manualAttention.push(productId);
        }
        
        fs.unlinkSync(movPath);
        fs.unlinkSync(mp4Path);
    }
    
    console.log(`\n=== BULK REPAIR COMPLETE ===`);
    console.log(JSON.stringify(stats, null, 2));
}

runBulkRepair().catch(console.error);
