require('dotenv').config({ path: '/Users/yash/Desktop/kicksaura/.env' });
const ImageKit = require('imagekit');

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

imagekit.listFiles({
    path: "/kicks-aura/indiankicks/ladies-sunglasses/557358019/"
}, function(error, result) {
    if(error) console.log(error);
    else console.log(JSON.stringify(result, null, 2));
});
