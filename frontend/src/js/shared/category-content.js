/* ============================================
   Category page titles and meta descriptions.
   Written for shoppers: only facts the store itself publishes (delivery,
   COD, returns). No brand-authenticity, stock-count or ranking claims.
   Keyed by category slug; unknown categories fall back to generic text.
   ============================================ */

export const CATEGORY_CONTENT = {
  sneakers: {
    title: 'Buy Sneakers Online in India',
    description: 'Shop sneakers online at Kicks Aura: everyday low-tops, retro runners and statement pairs in UK sizes. COD available, delivery in 4–5 working days.',
  },
  'mens-watches': {
    title: "Men's Watches Online in India",
    description: "Browse men's watches at Kicks Aura: chronograph, minimal and metal-strap styles for work and weekends. COD available, delivery in 4–5 working days.",
  },
  'ladies-watches': {
    title: "Women's Watches Online in India",
    description: "Shop women's watches at Kicks Aura: slim dials, metal bracelets and everyday styles to match your outfit. COD available, delivery in 4–5 working days.",
  },
  'mens-sunglasses': {
    title: "Men's Sunglasses Online in India",
    description: "Find men's sunglasses at Kicks Aura: aviators, square frames and everyday shades for driving and travel. COD available, delivery in 4–5 working days.",
  },
  'ladies-sunglasses': {
    title: "Women's Sunglasses Online in India",
    description: "Shop women's sunglasses at Kicks Aura: oversized, cat-eye and classic frames for everyday wear and travel. COD available, delivery in 4–5 working days.",
  },
  belts: {
    title: 'Buy Belts Online in India',
    description: 'Shop belts at Kicks Aura: black and brown styles for formal and casual wear, with clean buckles that finish an outfit. COD available across India.',
  },
  wallets: {
    title: 'Buy Wallets Online in India',
    description: 'Browse wallets at Kicks Aura: slim bifolds and everyday styles with room for cards and cash. COD available, delivery in 4–5 working days.',
  },
  perfumes: {
    title: 'Buy Perfumes Online in India',
    description: 'Shop perfumes at Kicks Aura: fresh, woody and warm fragrances for daily wear and evenings out. COD available, delivery in 4–5 working days.',
  },
};

export function categoryContent(slug) {
  return CATEGORY_CONTENT[slug] || null;
}
