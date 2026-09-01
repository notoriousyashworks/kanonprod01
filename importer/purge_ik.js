require('dotenv').config({ path: '/Users/yash/Desktop/kicksaura/.env' });
const ImageKit = require('imagekit');

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

const urlToPurge = 'https://ik.imagekit.io/kicks0122image/kicks-aura/indiankicks/ladies-sunglasses/670774896/video_ArYcCEGzF.mp4';

imagekit.purgeCache(urlToPurge, function(error, result) {
    if(error) console.log(error);
    else console.log('Purge Request Result:', result);
});
