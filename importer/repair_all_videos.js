require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const ImageKit = require('imagekit');

const DB_PATH = path.join(__dirname, 'db.json');
const PLAN_PATH = path.join(__dirname, 'tmp', 'batch_plan.json');
const TMP_DIR = path.join(__dirname, 'tmp');

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

async function run() {
    const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    const plan = JSON.parse(fs.readFileSync(PLAN_PATH, 'utf-8'));
    
    let totalChecked = 0;
    let skippedValid = 0;
    let success = 0;
    let failed = 0;
    let dlFailed = 0;
    let ulFailed = 0;
    let manualAttn = [];

    const productsToProcess = Object.entries(db.imported)
        .filter(([id, p]) => p.status === 'CREATED' && p.media && p.media.video);

    for (const [id, state] of productsToProcess) {
        totalChecked++;
        console.log(`\n--- Processing ${totalChecked}/${productsToProcess.length}: ${id} ---`);
        
        const ikExistingUrl = state.media.video;
        
        // 1. Check if already valid (if the raw URL plays and has good size)
        try {
            const checkRes = await fetch(ikExistingUrl + '?ts=' + Date.now());
            if (checkRes.status === 200) {
                const len = parseInt(checkRes.headers.get('content-length') || '0', 10);
                if (len > 10000) { // More than 10KB means it's transcoded or a real video, not the 150-byte XML
                    console.log(`Video already valid and of adequate size (${len} bytes). Skipping.`);
                    skippedValid++;
                    continue;
                }
            }
        } catch(e) {
            console.log(`Check failed, assuming corrupt:`, e.message);
        }

        const productPlan = plan.find(p => p.productId === id || p.productId == id);
        if (!productPlan || !productPlan.video) {
            console.log(`Failed: No source video name in batch plan for ${id}`);
            failed++; manualAttn.push(id);
            continue;
        }

        const sourceVideoName = productPlan.video;
        const sourceUrl = `https://cdn.cartpe.in/images/video_upload/${sourceVideoName}`;
        console.log(`Downloading source from: ${sourceUrl}`);
        
        try {
            const response = await fetch(sourceUrl);
            if (!response.ok) {
                console.log(`Download failed! Status: ${response.status}`);
                dlFailed++; failed++; manualAttn.push(id);
                continue;
            }
            
            const ct = response.headers.get('content-type') || '';
            if (!ct.includes('video/')) {
                console.log(`Download failed! Not a video. Content-Type: ${ct}`);
                dlFailed++; failed++; manualAttn.push(id);
                continue;
            }
            
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            
            const movPath = path.join(TMP_DIR, `tmp_${id}.mov`);
            const mp4Path = path.join(TMP_DIR, `tmp_${id}.mp4`);
            
            fs.writeFileSync(movPath, buffer);
            console.log(`Saved ${(buffer.length/1024/1024).toFixed(2)} MB to ${movPath}. Transcoding to H.264...`);
            
            if (fs.existsSync(mp4Path)) fs.unlinkSync(mp4Path);
            
            try {
                // H.264 encoding with generic presets for reliable web playback
                execSync(`ffmpeg -i "${movPath}" -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 128k -movflags +faststart -y "${mp4Path}"`, { stdio: 'ignore' });
            } catch (err) {
                console.log(`Transcoding failed!`);
                failed++; manualAttn.push(id);
                continue;
            }
            
            const mp4Buffer = fs.readFileSync(mp4Path);
            console.log(`Transcode complete. New size: ${(mp4Buffer.length/1024/1024).toFixed(2)} MB. Uploading...`);
            
            const folderPath = `/kicks-aura/indiankicks/ladies-sunglasses/${id}/`;
            
            const ikResult = await new Promise((resolve, reject) => {
                imagekit.upload({
                    file: mp4Buffer, 
                    fileName: 'video.mp4',
                    folder: folderPath,
                    useUniqueFileName: false 
                }, function(error, result) {
                    if (error) reject(error);
                    else resolve(result);
                });
            });
            
            // Verify
            const verifyRes = await fetch(ikResult.url + '?ts=' + Date.now());
            if (verifyRes.status === 200) {
                const len = parseInt(verifyRes.headers.get('content-length') || '0', 10);
                if (len > 10000) {
                    console.log(`✅ Repair success for ${id}!`);
                    success++;
                } else {
                    console.log(`❌ Upload verification failed for ${id}. File too small: ${len}`);
                    ulFailed++; failed++; manualAttn.push(id);
                }
            } else {
                console.log(`❌ Upload verification failed for ${id}. Status: ${verifyRes.status}`);
                ulFailed++; failed++; manualAttn.push(id);
            }
            
            // Cleanup
            if (fs.existsSync(movPath)) fs.unlinkSync(movPath);
            if (fs.existsSync(mp4Path)) fs.unlinkSync(mp4Path);
            
        } catch (e) {
            console.log(`Unexpected error during repair of ${id}:`, e.message);
            failed++; manualAttn.push(id);
        }
    }
    
    console.log(`\n=== BULK REPAIR COMPLETE ===`);
    console.log(`Total products checked: ${totalChecked}`);
    console.log(`Already-valid videos skipped: ${skippedValid}`);
    console.log(`Successfully repaired videos: ${success}`);
    console.log(`Failed repairs: ${failed}`);
    console.log(`Download failures: ${dlFailed}`);
    console.log(`ImageKit upload failures: ${ulFailed}`);
    if (manualAttn.length > 0) {
        console.log(`Products requiring manual attention: ${manualAttn.join(', ')}`);
    } else {
        console.log(`Products requiring manual attention: None`);
    }
}

run().catch(console.error);
