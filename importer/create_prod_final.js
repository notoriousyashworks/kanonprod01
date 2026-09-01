const config = require('./config');
const { generateProductContent } = require('./src/content/contentGenerator');

async function run() {
  const jwtToken = process.env.KICKSAURA_ADMIN_TOKEN;
  if (!jwtToken) {
    console.error('Missing KICKSAURA_ADMIN_TOKEN');
    return;
  }

  const generated = generateProductContent({
    productName: "Mont_Blan Black Premium Quality Belt Fa 995",
    category: "Belts",
    brand: "Mont Blanc"
  });

  const payload = {
    name: "Mont_Blan Black Premium Quality Belt Fa 995",
    brand: "Mont Blanc",
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
    
    console.log(`Product ID: ${prodData.id}`);
    console.log(`name: ${prodData.name}`);
    console.log(`category: ${prodData.category}`);
    console.log(`basePrice: ${prodData.basePrice}`);
    console.log(`discountedPrice: ${prodData.discountedPrice}`);
    console.log(`visible: ${prodData.visible}`);
    console.log(`image count: ${(prodData.imageUrls || []).length}`);
    console.log(`video count: ${(prodData.videoUrls || []).length}`);
    console.log(`variant count: ${(prodData.variants || []).length}`);
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
    console.log('\n--- VERIFICATION GET ---');
    try {
      // Use public GET endpoint if possible, but admin can see visible=false items.
      const getRes = await fetch(`${config.apiUrl}/api/v1/admin/products/${createdProductId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`
        }
      });
      
      console.log(`GET HTTP Status: ${getRes.status}`);
      if (getRes.ok) {
         const getData = await getRes.json();
         console.log(`visible = ${getData.visible}`);
         console.log(`variants = ${JSON.stringify(getData.variants)}`);
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
