const brandNormalizationMap = {
    'coacch': 'Coach',
    'coach': 'Coach',
    'armaani': 'Armani',
    'armani': 'Armani',
    'ax arma': 'Armani Exchange',
    'ax exchange': 'Armani Exchange',
    'mont_blan': 'Mont Blanc',
    'mont blan': 'Mont Blanc',
    'mont blanc': 'Mont Blanc',
    'montblanc': 'Mont Blanc',
    'us_polo': 'U.S. Polo',
    'us polo': 'U.S. Polo',
    'u.s. polo': 'U.S. Polo',
    'gucc': 'Gucci',
    'gucci': 'Gucci',
    'hermees': 'Hermes',
    'hermes': 'Hermes',
    'herrms': 'Hermes',
    'ferragam o': 'Ferragamo',
    'ferragamo': 'Ferragamo',
    'burberr': 'Burberry',
    'burberrry': 'Burberry',
    'burberry': 'Burberry',
    'tommmy': 'Tommy Hilfiger',
    'tommy': 'Tommy Hilfiger',
    'pol o': 'Polo',
    'polo': 'Polo',
    'coa c': 'Coach',
    'lv': 'Louis Vuitton',
    'loui': 'Louis Vuitton',
    'louis vuitton': 'Louis Vuitton',
    'cd dioo r': 'Dior',
    'cd dior': 'Dior',
    'dior': 'Dior',
    'balanciaga': 'Balenciaga',
    'balenciaga': 'Balenciaga',
    'dioo r': 'Dior',
    'dio': 'Dior',
    'dolc & gabbana': 'Dolce & Gabbana',
    'fend': 'Fendi',
    'fen': 'Fendi',
    'prad': 'Prada',
    'pr': 'Prada',
    'cd': 'Christian Dior',
    'bb': 'Burberry',
    'jimmy chhoo': 'Jimmy Choo',
    'tomford': 'Tom Ford',
    'tory burc': 'Tory Burch',
    'jimmy chhoowmns': "Jimmy Choo Women's"
};

function normalizeProductName(rawName) {
    if (!rawName) return '';

    // 1. Replace underscores with spaces
    let clean = rawName.replace(/_/g, ' ');

    // 2. Remove obvious html entity leftovers
    clean = clean.replace(/\bamp\b/gi, '&'); // Fix "7 amp 8" -> "7 & 8"
    
    // 3. Clean extra spaces
    clean = clean.replace(/\s+/g, ' ').trim();

    // 4. Brand Normalization
    let matchedBrand = null;
    
    // Check longest keys first
    const sortedBrandKeys = Object.keys(brandNormalizationMap).sort((a, b) => b.length - a.length);
    
    // Convert to lowercase for matching
    let tempLower = clean.toLowerCase();
    
    for (const key of sortedBrandKeys) {
        // Only replace if it's a distinct word boundary
        const regex = new RegExp(`\\b${key}\\b`, 'gi');
        if (regex.test(clean)) {
            matchedBrand = brandNormalizationMap[key];
            // Replace first occurrence with placeholder
            clean = clean.replace(regex, matchedBrand);
            break; // Stop after finding primary brand
        }
    }
    
    // Special handling for LV to prevent over-matching "lv"
    if (!matchedBrand && /\blv\b/i.test(clean)) {
        if (clean.toLowerCase().includes('belt') || clean.toLowerCase().includes('box')) {
            clean = clean.replace(/\blv\b/gi, 'Louis Vuitton');
        }
    }

    // 5. Title Casing function that preserves numbers/codes
    clean = clean.split(' ').map((word, index) => {
        // Known small words that should stay lowercase
        const smallWords = ['with', 'and', 'or', 'in', 'of', 'for'];
        
        // Exclude the brand name which might already be correctly cased
        if (matchedBrand && matchedBrand.includes(word)) {
            return word;
        }

        // If it contains a number and a letter (like A227, FA995), uppercase it entirely
        if (/[0-9]/.test(word) && /[a-z]/i.test(word)) {
            return word.toUpperCase();
        }
        
        // If it's a known small word, keep lower unless it's the very first word
        if (index > 0 && smallWords.includes(word.toLowerCase())) {
            return word.toLowerCase();
        }
        
        // Otherwise, capitalize first letter
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }).join(' ');
    
    // 6. Remove internal supplier reference numbers, model codes, and standalone numeric strings
    clean = clean.replace(/\b(?:fa|h|a|c|b|t)\s*(\d+)\b/gi, ''); // Removes FA 667, H 98, A227, C219, B195, T104
    clean = clean.replace(/\b\d{2,6}\b/g, ''); // Removes 2-6 digit standalone reference numbers like 06, 5524, 32827, 559
    
    // 7. Fix Women's abbreviation
    clean = clean.replace(/\b(?:wmns|wmn)\b/gi, "Women's");
    
    // Re-capitalize first word just in case
    clean = clean.charAt(0).toUpperCase() + clean.slice(1);
    
    // Clean up random characters and excess whitespace
    clean = clean.replace(/\s&\s&\s/g, ' & ');
    clean = clean.replace(/\b2pcs\b/gi, '2-Piece');
    clean = clean.replace(/\b2pc\b/gi, '2-Piece');
    clean = clean.replace(/\bdc\b/gi, 'DC');
    clean = clean.replace(/\s+/g, ' ').trim();

    return clean;
}

module.exports = {
    normalizeProductName,
    brandNormalizationMap
};
