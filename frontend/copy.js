const fs = require('fs');
const path = require('path');

const srcDir = '/Users/yash/Desktop/kicksaura/adidas';
const destDir = '/Users/yash/Desktop/kicksaura/frontend/public/images/products/adidas';

fs.mkdirSync(destDir, { recursive: true });
const files = fs.readdirSync(srcDir);

files.forEach(file => {
  if (file.endsWith('.jpeg')) {
    fs.copyFileSync(path.join(srcDir, file), path.join(destDir, file));
    console.log(`Copied ${file}`);
  }
});
