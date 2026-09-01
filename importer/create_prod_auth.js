const config = require('./config');
const { generateProductContent } = require('./src/content/contentGenerator');

async function run() {
  const msg91Token = process.env.KICKSAURA_MSG91_ACCESS_TOKEN;
  if (!msg91Token) {
    console.error('Missing KICKSAURA_MSG91_ACCESS_TOKEN');
    return;
  }

  // STEP 1: Login
  console.log('--- LOGGING IN ---');
  let jwtToken = '';
  try {
    const loginRes = await fetch(`${config.apiUrl}/api/v1/users/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken: msg91Token })
    });
    
    if (!loginRes.ok) {
      console.error(`Login failed: ${loginRes.status}`);
      const text = await loginRes.text();
      console.error('Response:', text);
      return;
    }
    
    const loginData = await loginRes.json();
    jwtToken = loginData.token;
    if (!jwtToken) {
      console.error('No token in login response!');
      return;
    }
    console.log('Login successful! JWT acquired.');
  } catch (err) {
    console.error('Login error:', err);
    return;
  }

  // STEP 2: Generate Payload
  const generated = generateProductContent({
    productName: "Mont_Blan Black Premium Quality Belt Fa 995",
    category: "Belts",
    brand: "Mont Blanc"
  });

  const payload = {
    name: "Mont_Blan Black Premium Quality Belt Fa 995",
    category: "Belts",
    basePrice: 2699,
    discountedPrice: 1250,
    variants: [],
    imageUrls: [
      "https://ik.imagekit.io/kicks0122image/kicks-aura/indiankicks/belts/NPI670950120/01.jpg",
      "https://ik.imagekit.io/kicks0122image/kicks-aura/indiankicks/belts/NPI670950120/02.jpg",
      "https://ik.imagekit.io/kicks0122image/kicks-aura/indiankicks/belts/NPI670950120/03.jpg",
      "https://ik.imagekit.io/kicks0122image/kicks-aura/indiankicks/belts/NPI670950120/04.jpg"
    ],
    videoUrls: [],
    visible: false,
    searchName: generated.searchName,
    searchBrand: generated.searchBrand,
    searchText: generated.searchText,
    description: generated.description
  };

  console.log('--- PAYLOAD TO SEND ---');
  console.log(JSON.stringify(payload, null, 2));
  console.log('-----------------------');

  // STEP 3: Create Product
  console.log('--- CREATING PRODUCT ---');
  let createdProductId = null;
  try {
    const prodRes = await fetch(`${config.apiUrl}/api/v1/admin/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`
      },
      body: JSON.stringify(payload)
    });
    
    console.log(`HTTP Status: ${prodRes.status}`);
    if (!prodRes.ok) {
      console.error('Product creation failed.');
      const text = await prodRes.text();
      console.error('Response:', text);
      return;
    }
    
    const prodData = await prodRes.json();
    createdProductId = prodData.id;
    
    console.log('\n--- CREATED PRODUCT RESULTS ---');
    console.log(`Product ID: ${prodData.id}`);
    console.log(`Name: ${prodData.name}`);
    console.log(`Category: ${prodData.category}`);
    console.log(`Base Price: ${prodData.basePrice}`);
    console.log(`Discounted Price: ${prodData.discountedPrice}`);
    console.log(`Visible: ${prodData.visible}`);
    console.log(`Image count: ${(prodData.imageUrls || []).length}`);
    console.log(`Video count: ${(prodData.videoUrls || []).length}`);
    console.log(`Variant count: ${(prodData.variants || []).length}`);
    console.log(`searchName: ${prodData.searchName}`);
    console.log(`searchBrand: ${prodData.searchBrand}`);
    console.log(`searchText: ${prodData.searchText}`);
    console.log(`description: ${prodData.description}`);
  } catch (err) {
    console.error('Product creation error:', err);
    return;
  }

  // STEP 4: Verification GET
  if (createdProductId) {
    console.log('\n--- VERIFYING GET REQUEST ---');
    try {
      // Use public GET endpoint if possible
      const getRes = await fetch(`${config.apiUrl}/api/v1/products/${createdProductId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`
        }
      });
      
      console.log(`GET HTTP Status: ${getRes.status}`);
      if (getRes.ok) {
         const getData = await getRes.json();
         console.log('GET VERIFICATION RESULTS:');
         console.log(`visible = ${getData.visible}`);
         console.log(`variants count = ${(getData.variants || []).length}`);
         console.log(`image count = ${(getData.imageUrls || []).length}`);
      } else {
         console.error('GET failed.');
         console.error(await getRes.text());
      }
    } catch(err) {
      console.error('GET error:', err);
    }
  }
}

run();
