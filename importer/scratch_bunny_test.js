const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const BUNNY_STREAM_LIBRARY_ID = process.env.BUNNY_STREAM_LIBRARY_ID;
const BUNNY_STREAM_API_KEY = process.env.BUNNY_STREAM_API_KEY;

(async () => {
    try {
        console.log("Downloading video...");
        const url = 'https://cdn.cartpe.in/images/video_upload/o_1jmdgo6gn1orcp1m1pc53ten008.mp4';
        const dlRes = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const arrayBuffer = await dlRes.arrayBuffer();
        console.log(`Downloaded ${arrayBuffer.byteLength} bytes.`);
        
        console.log("Creating Bunny video...");
        const createRes = await fetch(`https://video.bunnycdn.com/library/${BUNNY_STREAM_LIBRARY_ID}/videos`, {
            method: 'POST',
            headers: { 'AccessKey': BUNNY_STREAM_API_KEY, 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: 'test_belt_upload' })
        });
        const createJson = await createRes.json();
        const videoId = createJson.guid;
        console.log(`Created video ID: ${videoId}`);
        
        console.log("Uploading bytes to Bunny...");
        const uploadRes = await fetch(`https://video.bunnycdn.com/library/${BUNNY_STREAM_LIBRARY_ID}/videos/${videoId}`, {
            method: 'PUT',
            headers: { 'AccessKey': BUNNY_STREAM_API_KEY },
            body: arrayBuffer
        });
        const uploadJson = await uploadRes.json();
        console.log("Upload response:", uploadJson);
    } catch (e) {
        console.error(e);
    }
})();
