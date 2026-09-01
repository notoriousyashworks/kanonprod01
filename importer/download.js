const fs = require('fs');
const path = require('path');
const https = require('https');

const PRODUCT_ID = 'NPI670950120';
const PRODUCT_NAME = 'Mont_Blan Black Premium Quality Belt Fa 995';

const IMAGES = [
  "https://cdn.cartpe.in/images/gallery_lg/6a959de41ecc60.jpg",
  "https://cdn.cartpe.in/images/gallery_lg/6a959de41f6711.jpg",
  "https://cdn.cartpe.in/images/gallery_lg/6a959de41fd1b2.jpg",
  "https://cdn.cartpe.in/images/gallery_lg/6a959de4219633.jpg"
];

const VIDEO_URL = null; // No video for this product

const TMP_DIR = path.join(__dirname, 'tmp', PRODUCT_ID);

if (!fs.existsSync(TMP_DIR)) {
  fs.mkdirSync(TMP_DIR, { recursive: true });
}

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      // 5. Handle HTTP errors
      if (response.statusCode >= 400) {
        return reject(new Error(`Failed to download ${url}: HTTP ${response.statusCode}`));
      }

      // 3. Determine the correct file extension & 6. Verify it's an image
      const contentType = response.headers['content-type'];
      if (!contentType || !contentType.startsWith('image/')) {
        return reject(new Error(`URL ${url} did not return an image. Content-Type: ${contentType}`));
      }

      const fileStream = fs.createWriteStream(destPath);
      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        
        // 7. Print downloaded file size
        const stats = fs.statSync(destPath);
        const kbSize = (stats.size / 1024).toFixed(2);
        resolve(kbSize);
      });
      
    }).on('error', (err) => {
      fs.unlink(destPath, () => {}); // Delete partial file
      reject(err);
    });
  });
}

(async () => {
  console.log(`Product: ${PRODUCT_NAME}`);
  
  let successCount = 0;
  const results = [];
  
  for (let i = 0; i < IMAGES.length; i++) {
    const url = IMAGES[i];
    // 4. Preserve gallery order with sequential filenames
    const filename = `${String(i + 1).padStart(2, '0')}.jpg`;
    const destPath = path.join(TMP_DIR, filename);
    
    try {
      const kbSize = await downloadFile(url, destPath);
      results.push(`${filename} — ${kbSize} KB`);
      successCount++;
    } catch (err) {
      results.push(`${filename} — FAILED (${err.message})`);
    }
  }

  console.log(`Images downloaded: ${successCount}/${IMAGES.length}\n`);
  results.forEach(r => console.log(r));
  
  // 8 & 9. Video handling
  console.log("");
  if (VIDEO_URL) {
     console.log(`Video found: ${VIDEO_URL}`);
     // logic to download video would go here if it existed
  } else {
     console.log("Video: No video found");
  }
  
})();
