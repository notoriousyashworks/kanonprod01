const config = require('./config');
const { generateProductContent } = require('./src/content/contentGenerator');

async function createProduct() {
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

  console.log('PAYLOAD:', JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(`${config.apiUrl}/api/v1/admin/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.adminToken}`
      },
      body: JSON.stringify(payload)
    });

    console.log(`STATUS: ${response.status}`);
    
    const data = await response.json();
    console.log('RESPONSE:', JSON.stringify(data, null, 2));
    
    if (response.ok && data && data.id) {
       console.log('--- VERIFICATION GET ---');
       const getResponse = await fetch(`${config.apiUrl}/api/v1/products/${data.id}`);
       console.log(`GET STATUS: ${getResponse.status}`);
       const getData = await getResponse.json();
       console.log('GET RESPONSE:', JSON.stringify(getData, null, 2));
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

createProduct();
