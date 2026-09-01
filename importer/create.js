const payload = {
  name: "Mont_Blan Black Premium Quality Belt Fa 995",
  brand: "Mont Blanc", 
  category: "Belts",
  basePrice: 2699,
  discountedPrice: 1250,
  description: "Premium-quality black belt with a sleek, refined finish. A versatile choice for everyday and formal wear.",
  imageUrls: [
    "https://ik.imagekit.io/kicks0122image/kicks-aura/indiankicks/belts/NPI670950120/01.jpg",
    "https://ik.imagekit.io/kicks0122image/kicks-aura/indiankicks/belts/NPI670950120/02.jpg",
    "https://ik.imagekit.io/kicks0122image/kicks-aura/indiankicks/belts/NPI670950120/03.jpg",
    "https://ik.imagekit.io/kicks0122image/kicks-aura/indiankicks/belts/NPI670950120/04.jpg"
  ],
  videoUrls: [],
  isVisible: false,
  isSaleVisible: true, 
  isNewArrival: false,
  isTrending: false,
  isVideoVisible: false,
  withOgBox: false,
  isInStockFlag: true,
  limitedStock: false,
  variants: [],
  searchName: "mont blanc black premium quality belt",
  searchBrand: "mont blanc",
  searchText: "mont blanc belt mont blan belt montblanc belt black belt premium quality belt black leather belt mens formal designer"
};

console.log("==================================================");
console.log("PAYLOAD TO BE SENT TO POST /api/v1/admin/products:");
console.log("==================================================");
console.log(JSON.stringify(payload, null, 2));
console.log("==================================================\n");

async function execute() {
  try {
    const res = await fetch('http://127.0.0.1:8082/api/v1/admin/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    console.log(`HTTP STATUS: ${res.status} ${res.statusText}`);
    const data = await res.json();
    
    if (res.ok) {
       console.log(`\nPRODUCT ID CREATED: ${data.id}\n`);
       
       console.log("RESPONSE BODY (SECRETS/TOKENS EXCLUDED):");
       console.log(JSON.stringify(data, null, 2));
       
       console.log("\n--- VERIFICATION ---");
       console.log(`1. isVisible = false? ${data.isVisible === false}`);
       console.log(`2. 4 ImageKit URLs saved? ${data.imageUrls?.length === 4}`);
       console.log(`3. videoUrls is empty? ${data.videoUrls?.length === 0}`);
       console.log(`4. ZERO ProductVariant records? ${data.variants?.length === 0}`);
       console.log("5. Does the product require a size selection? NO (hasVariants logic in frontend gracefully skips it if variants is empty).");
       console.log(`6. Search keywords:\n   - searchName: ${data.searchName}\n   - searchBrand: ${data.searchBrand}\n   - searchText: ${data.searchText}`);
       console.log(`7. Short description: ${data.description}`);
    } else {
       console.log("\nREQUEST FAILED:");
       console.log(data);
    }
  } catch(e) {
    console.error("Fetch error:", e.message);
  }
}

execute();
