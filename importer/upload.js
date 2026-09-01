const fs = require('fs');
const path = require('path');
const ImageKit = require('imagekit');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const PRODUCT_ID = 'NPI670950120';
const TMP_DIR = path.join(__dirname, 'tmp', PRODUCT_ID);
const IMAGEKIT_FOLDER = `/kicks-aura/indiankicks/belts/${PRODUCT_ID}/`;

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

(async () => {
  const files = ['01.jpg', '02.jpg', '03.jpg', '04.jpg'];
  const results = [];
  
  for (const filename of files) {
    const filePath = path.join(TMP_DIR, filename);
    if (!fs.existsSync(filePath)) {
       console.log(`${filename} does not exist locally!`);
       continue;
    }
    
    const fileBuffer = fs.readFileSync(filePath);
    
    try {
      const response = await imagekit.upload({
        file: fileBuffer, // required
        fileName: filename, // required
        folder: IMAGEKIT_FOLDER,
        useUniqueFileName: false // Keep exact names 01.jpg etc
      });
      
      results.push({
         filename: filename,
         url: response.url
      });
    } catch (err) {
      console.error(`Failed to upload ${filename}:`, err.message);
    }
  }

  // Verification step
  console.log("ImageKit upload results:\n");
  for (const res of results) {
     console.log(`${res.filename} → ${res.url}`);
  }
  console.log(`\nUploaded: ${results.length}/${files.length}\n`);
  
  console.log("Verifying URLs are accessible...");
  for (const res of results) {
     try {
       const fetchResponse = await fetch(res.url, { method: 'HEAD' });
       if (fetchResponse.ok) {
          console.log(`Verified OK: ${res.url}`);
       } else {
          console.log(`Verification FAILED (${fetchResponse.status}): ${res.url}`);
       }
     } catch (e) {
       console.log(`Verification ERROR: ${res.url}`, e.message);
     }
  }
})();
