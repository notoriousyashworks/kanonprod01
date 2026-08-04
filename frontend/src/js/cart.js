/* ============================================
   KicksAura Cart Module (localStorage)
   ============================================ */

const CART_KEY = 'kicksaura_cart';

function matchesId(id1, id2) {
  if (id1 == null && id2 == null) return true;
  if (id1 == null || id2 == null) {
    const s1 = String(id1 ?? '').trim();
    const s2 = String(id2 ?? '').trim();
    return (s1 === '' || s1 === 'null' || s1 === 'undefined') && (s2 === '' || s2 === 'null' || s2 === 'undefined');
  }
  return String(id1).trim() === String(id2).trim();
}

function isSameItem(item, productId, size) {
  if (!matchesId(item.productId, productId)) return false;
  if (String(item.size).trim() !== String(size).trim()) return false;
  return true;
}

function consolidateCart(cart) {
  if (!Array.isArray(cart) || cart.length <= 1) return cart || [];
  const consolidated = [];
  for (const item of cart) {
    const existing = consolidated.find(ci => isSameItem(ci, item.productId, item.size));
    if (existing) {
      existing.quantity = (Number(existing.quantity) || 1) + (Number(item.quantity) || 1);
      existing.liveVideoCall = Boolean(existing.liveVideoCall) || Boolean(item.liveVideoCall);
      // Also update variantId to the latest one just in case
      existing.variantId = item.variantId || existing.variantId;
    } else {
      consolidated.push({ ...item, quantity: Number(item.quantity) || 1 });
    }
  }
  return consolidated;
}

function getCart() {
  const raw = localStorage.getItem(CART_KEY);
  const parsed = raw ? JSON.parse(raw) : [];
  const consolidated = consolidateCart(parsed);
  // If consolidation merged existing duplicates, save back clean state
  if (parsed.length !== consolidated.length && raw) {
    localStorage.setItem(CART_KEY, JSON.stringify(consolidated));
  }
  return consolidated;
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
  window.dispatchEvent(new CustomEvent('cart-updated', { detail: cart }));
}

export function addToCart(product, variant, quantity = 1, options = {}) {
  const cart = getCart();
  const size = variant?.size || '';
  const liveVideoCall = Boolean(options.liveVideoCall);
  
  const existingIndex = cart.findIndex(
    (item) => isSameItem(item, product.id, size)
  );

  if (existingIndex > -1) {
    const newQty = (Number(cart[existingIndex].quantity) || 1) + (Number(quantity) || 1);
    if (newQty > 10) {
      alert("You can't add more than 10 items of the same product.");
      cart[existingIndex].quantity = 10;
    } else {
      cart[existingIndex].quantity = newQty;
    }
    cart[existingIndex].liveVideoCall = Boolean(cart[existingIndex].liveVideoCall) || liveVideoCall;
    cart[existingIndex].variantId = (variant && variant.id) ? variant.id : cart[existingIndex].variantId;
  } else {
    const initialQty = Number(quantity) || 1;
    if (initialQty > 10) {
      alert("You can't add more than 10 items of the same product.");
    }
    cart.push({
      productId: product.id,
      variantId: variant ? variant.id || null : null,
      productName: product.name,
      productBrand: product.brand,
      productImage: product.imageUrls?.[0] || '',
      size,
      price: product.discountedPrice || product.basePrice,
      basePrice: product.basePrice,
      quantity: Math.min(10, initialQty),
      liveVideoCall: Boolean(options.liveVideoCall)
    });
  }

  saveCart(cart);
  return cart;
}

export function removeFromCart(productId, size) {
  let cart = getCart();
  cart = cart.filter(
    (item) => !isSameItem(item, productId, size)
  );
  saveCart(cart);
  return cart;
}

export function updateQuantity(productId, size, quantity) {
  const cart = getCart();
  const item = cart.find(
    (i) => isSameItem(i, productId, size)
  );
  if (item) {
    const newQty = Number(quantity) || 1;
    if (newQty > 10) {
      alert("You can't add more than 10 items of the same product.");
      item.quantity = 10;
    } else {
      item.quantity = Math.max(1, newQty);
    }
  }
  saveCart(cart);
  return cart;
}

export function getCartItems() {
  return getCart();
}

export function getCartTotal() {
  return getCart().reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function getCartCount() {
  return getCart().reduce((sum, item) => sum + item.quantity, 0);
}

export function clearCart() {
  localStorage.removeItem(CART_KEY);
  updateCartBadge();
  window.dispatchEvent(new CustomEvent('cart-updated', { detail: [] }));
}

export function updateCartBadge() {
  const badges = document.querySelectorAll('.navbar__cart-count');
  const count = getCartCount();
  badges.forEach((badge) => {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  });
}
