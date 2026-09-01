const brandMapping = require('./brandMapping');

function generateProductContent(product) {
  const originalName = (product.productName || '').toLowerCase();
  
  // 1. searchName
  // Lowercase, replace underscores, remove punctuation, strip noise like "fa 995"
  let searchName = originalName.replace(/_/g, ' ');
  searchName = searchName.replace(/[^\w\s-]/g, '');
  // strip isolated product codes (2 letters followed by numbers, etc.)
  searchName = searchName.replace(/\b(?:fa|npi|sku)\s*\d+\b/g, '');
  // normalize spaces
  searchName = searchName.replace(/\s+/g, ' ').trim();

  // 2. searchBrand
  let searchBrand = '';
  let brandData = null;
  const rawBrand = (product.brand || '').toLowerCase().trim();
  
  if (rawBrand && rawBrand !== 'unknown') {
    // Try to map it exactly
    if (brandMapping[rawBrand]) {
      brandData = brandMapping[rawBrand];
      searchBrand = brandData.normalized;
    } else {
      // Find loose match
      for (const [key, data] of Object.entries(brandMapping)) {
        if (key === rawBrand || data.variations.includes(rawBrand)) {
          brandData = data;
          searchBrand = data.normalized;
          break;
        }
      }
    }
  }

  // 3. searchText
  const searchTokens = new Set();
  
  // normalized name
  searchName.split(' ').forEach(token => {
    if (token.length > 1) searchTokens.add(token);
  });
  
  searchTokens.add(searchName);
  
  // brand variations
  if (brandData) {
    searchTokens.add(brandData.normalized);
    brandData.variations.forEach(v => searchTokens.add(v));
  } else {
    // maybe brand is hidden in the product name? 
    // Example "mont blan" -> add montblanc variation.
    if (searchName.includes('mont blan')) {
       searchTokens.add('montblanc');
       searchTokens.add('mont blanc');
    }
  }
  
  // category
  if (product.category) {
    searchTokens.add(product.category.toLowerCase());
  }
  
  // colors
  const colors = ['black', 'brown', 'tan', 'navy', 'blue', 'white'];
  colors.forEach(c => {
    if (searchName.includes(c)) searchTokens.add(c);
  });
  
  // product type variations for belts
  if ((product.category || '').toLowerCase() === 'belts' || searchName.includes('belt')) {
    searchTokens.add('belt');
    searchTokens.add('belts');
    searchTokens.add('men belt');
    searchTokens.add('mens belt');
    if (searchName.includes('formal') || !searchName.includes('casual')) {
      searchTokens.add('formal belt');
    }
    if (searchName.includes('casual')) {
      searchTokens.add('casual belt');
    }
  }
  
  // explicit characteristics ONLY if present
  if (searchName.includes('leather')) {
    searchTokens.add('leather belt');
    searchTokens.add('leather');
  }
  if (searchName.includes('premium')) {
    searchTokens.add('premium belt');
  }
  if (searchName.includes('designer')) {
    searchTokens.add('designer belt');
  }

  const rawText = Array.from(searchTokens).join(' ');
  const finalWords = Array.from(new Set(rawText.split(/\s+/).filter(w => w.length > 1)));
  const searchText = finalWords.join(' ');

  // 4. description
  let description = '';
  
  const isPremium = searchName.includes('premium');
  const isLeather = searchName.includes('leather');
  
  // Find color
  const foundColor = colors.find(c => searchName.includes(c)) || '';
  
  if (isPremium) {
    description = `Premium-quality ${foundColor} ${isLeather ? 'leather ' : ''}belt with a sleek, refined finish. A versatile choice for everyday and formal wear.`;
  } else {
    description = `Classic ${foundColor} ${isLeather ? 'leather ' : ''}belt with a clean, versatile design for everyday and formal wear.`;
  }
  
  // clean up extra spaces if color or material was empty
  description = description.replace(/\s+/g, ' ').replace(' belt', ' belt').trim();
  // Capitalize first letter
  description = description.charAt(0).toUpperCase() + description.slice(1);

  return {
    searchName,
    searchBrand,
    searchText,
    description
  };
}

module.exports = { generateProductContent };
