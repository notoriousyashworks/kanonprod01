/* ============================================
   KicksAura UI Utilities
   ============================================ */
import { isWishlisted, toggleWishlistItem } from './wishlist.js';
import { initLoginModalTrigger } from './login-modal.js';
import { getAllProducts, getCategories } from './api.js';
import { productCardHTML, navbarHTML, footerHTML, categoryLinksHTML } from './shared/templates.js';

// Toast notifications
export function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  // Prevent duplicate toasts for the same message
  const existingToasts = container.querySelectorAll('.toast');
  for (let t of existingToasts) {
    if (t.textContent === message) {
      return; // Already showing this message
    }
  }

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

export function initSearch() {
  const searchInput = document.getElementById('nav-search-input');
  const searchBtn = document.getElementById('nav-search-btn');

  const executeSearch = () => {
    if (searchInput && searchInput.value.trim()) {
      window.location.href = `/products?search=${encodeURIComponent(searchInput.value.trim())}`;
    }
  };

  if (searchInput) {
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') executeSearch();
    });
  }

  if (searchBtn) {
    searchBtn.addEventListener('click', executeSearch);
  }

  // --- Animated Placeholder Logic ---
  const placeholderWrapper = document.getElementById('nav-animated-placeholder');
  const text1 = document.getElementById('placeholder-text-1');
  const text2 = document.getElementById('placeholder-text-2');

  if (searchInput && placeholderWrapper && text1 && text2) {
    const phrases = [
      "Search for Sneakers...",
      "Search for Apparel...",
      "Search for Perfumes...",
      "Search for Watches...",
      "Search for Nike Pandas...",
      "Search for Adidas Sambas...",
      "Search for New Balance 9060...",
      "Search for Air Force 1...",
      "Search for Onitsuka Tiger...",
      "Search for Air Jordan 1...",
      "Search for Sunglasses...",
      "Search for Nike Dunks...",
      "Search for Adidas Campus...",
      "Search for Belts...",
      "Search for New Balance 530...",
      "Search for Air Jordan 4...",
      "Search for Adidas Spezial...",
      "Search for Nike Vomero...",
      "Search for Wallets...",
      "Search for ASICS Gel-NYC...",
      "Search for Nike P-6000...",
      "Search for New Balance 550...",
      "Search for Travis Scott...",
      "Search for Accessories...",
      "Search for Yeezy 350..."
    ];

    let currentIndex = 0;
    let currentCharIndex = 0;
    let isDeleting = false;
    let timeoutId = null;

    const typeWriter = () => {
      const currentPhrase = phrases[currentIndex];

      if (isDeleting) {
        text1.textContent = currentPhrase.substring(0, currentCharIndex - 1);
        currentCharIndex--;
      } else {
        text1.textContent = currentPhrase.substring(0, currentCharIndex + 1);
        currentCharIndex++;
      }

      let typingSpeed = isDeleting ? 30 : 60; // Deleting is faster than typing

      if (!isDeleting && currentCharIndex === currentPhrase.length) {
        // Pause at the end of typing before deleting
        typingSpeed = 2000;
        isDeleting = true;
      } else if (isDeleting && currentCharIndex === 0) {
        // Switch to next phrase and pause before starting to type
        isDeleting = false;
        currentIndex = (currentIndex + 1) % phrases.length;
        typingSpeed = 500;
      }

      timeoutId = setTimeout(typeWriter, typingSpeed);
    };

    const startAnimation = () => {
      if (timeoutId) return;

      // Make sure the second text is hidden as we don't need it for typewriter
      if (text2) text2.style.display = 'none';
      text1.className = 'animated-placeholder-text visible';

      timeoutId = setTimeout(typeWriter, 500);
    };

    const stopAnimation = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    const updateVisibility = () => {
      if (document.activeElement === searchInput || searchInput.value.trim() !== '') {
        placeholderWrapper.style.display = 'none';
        stopAnimation();
      } else {
        placeholderWrapper.style.display = 'flex';
        startAnimation();
      }
    };

    searchInput.addEventListener('focus', updateVisibility);
    searchInput.addEventListener('blur', updateVisibility);
    searchInput.addEventListener('input', updateVisibility);

    // Initial check
    updateVisibility();
  }
}

// Format price as INR
export function formatPrice(price) {
  if (price == null) return '';
  return '₹ ' + price.toLocaleString('en-IN');
}

// Media URL helpers live in ./shared/media.js (shared with the SSR renderer).
export * from './shared/media.js';

export function openProductWhatsApp(name, id) {
  const number = import.meta.env.VITE_WHATSAPP_NUMBER || '916239379751';
  const text = `I am interested in ${name} - ${window.location.origin}/product-details?id=${id}`;
  const url = `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

if (typeof window !== 'undefined') {
  window.openProductWhatsApp = openProductWhatsApp;
}

// Create a product card HTML (markup shared with the SSR renderer)
export function createProductCard(product) {
  return productCardHTML(product, { liked: isWishlisted(product.id) });
}

// Generate navbar HTML (markup shared with the SSR renderer)
export function getNavbarHTML(activePage = 'home') {
  setTimeout(() => initCategoriesDropdown(), 0);
  return navbarHTML(activePage);
}

// Generate footer HTML (markup shared with the SSR renderer)
export function getFooterHTML() {
  return footerHTML({ whatsappNumber: import.meta.env.VITE_WHATSAPP_NUMBER });
}

// Inject footer into the page
export function injectFooter() {
  const container = document.getElementById('footer-container');
  if (container) {
    container.innerHTML = getFooterHTML();
  }
}

// ============================================
// Purchase Notifications
// ============================================
const MALE_FIRST_NAMES = [
  "Aarav", "Vihaan", "Vivaan", "Aditya", "Arjun", "Siddharth", "Reyansh", "Ayaan", "Krishna",
  "Ishaan", "Shaurya", "Atharva", "Ayan", "Yash", "Rohan", "Rahul", "Amit", "Manish", "Kunal",
  "Rohit", "Neeraj", "Vikas", "Saurabh", "Murtuza", "Raj", "Vikram", "Kabir", "Rishi", "Aryan", "Pranav",
  "Dev", "Ravi", "Anand", "Akash", "Anil", "Sunil", "Sanjay", "Vinay", "Vijay", "Prakash"
];

const FEMALE_FIRST_NAMES = [
  "Priya", "Sneha", "Neha", "Riya", "Anjali", "Pooja", "Shruti", "Swati", "Kavya", "Ishita",
  "Pallavi", "Aanya", "Diya", "Nidhi", "Aditi", "Meera", "Tara", "Roshni", "Ritu", "Nandini",
  "Kiran", "Simran", "Preeti", "Sonia", "Kareena", "Katrina", "Priyanka", "Deepika", "Anushka", "Alia"
];

const LAST_NAMES = [
  "Sharma", "Patel", "Singh", "Kumar", "Reddy", "Verma", "Gupta", "Rao", "Desai", "Jain",
  "Joshi", "Mishra", "Bansal", "Mehta", "Nair", "Choudhury", "Tiwari", "Agarwal", "Bhatia", "Pandey",
  "Yadav", "Chauhan", "Hussain", "Kapoor", "Malhotra", "Das", "Sen", "Bose", "Chatterjee", "Roy",
  "Iyer", "Pillai", "Bhattacharya", "Sinha", "Ahuja"
];

function getRandomName() {
  const isBoy = Math.random() < 0.90;
  const firstNames = isBoy ? MALE_FIRST_NAMES : FEMALE_FIRST_NAMES;
  const fName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  return `${fName} ${lName}`;
}

export async function initPurchaseNotifications() {
  return; // Disabled
  try {
    const products = await getAllProducts();
    if (!products || products.length === 0) return;

    let notificationEl = document.createElement('div');
    notificationEl.className = 'live-toast-banner';
    document.body.appendChild(notificationEl);

    const showNotification = () => {
      const name = getRandomName();
      const product = products[Math.floor(Math.random() * products.length)];

      const imgList = product.imageUrls || [];
      const img = imgList[0] && imgList[0].startsWith('http')
        ? imgList[0]
        : imgList[0] ? `https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME_FRONTEND}/image/upload/w_200,h_200,c_fill,q_auto,f_auto/${imgList[0]}`
          : '';

      const productPrice = product.discountedPrice || product.basePrice || 0;
      const price = 'Rs. ' + productPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 });

      notificationEl.innerHTML = `
        <button class="live-toast-banner__close" aria-label="Close">✕</button>
        <div class="live-toast-banner__img-wrap">
          <img src="${img}" alt="${product.name}" class="live-toast-banner__img" />
        </div>
        <div class="live-toast-banner__content">
          <div class="live-toast-banner__text">
            <strong>${name}</strong> from 🇮🇳 <strong>India</strong> purchased
            <a href="/product-details?id=${product.id}" class="live-toast-banner__product-link" target="_blank" rel="noopener noreferrer">${product.name}</a>
          </div>
          <div class="live-toast-banner__price">${price}</div>
        </div>
      `;

      notificationEl.querySelector('.live-toast-banner__close').addEventListener('click', (e) => {
        e.stopPropagation();
        notificationEl.classList.remove('show');
      });

      notificationEl.onclick = () => {
        window.open(`/product-details?id=${product.id}`, '_blank', 'noopener');
      };

      // ── Swipe-to-dismiss (mobile touch) ────────────────
      let touchStartY = 0;
      let currentDeltaY = 0;
      const SWIPE_THRESHOLD = 60; // px needed to trigger dismiss

      const isMobile = () => window.innerWidth <= 768;

      const onTouchStart = (e) => {
        if (!isMobile()) return;
        touchStartY = e.touches[0].clientY;
        currentDeltaY = 0;
        // Disable CSS transition while dragging for instant feel
        notificationEl.style.transition = 'opacity 0.15s ease';
      };

      const onTouchMove = (e) => {
        if (!isMobile()) return;
        currentDeltaY = e.touches[0].clientY - touchStartY;
        // Follow the finger — offset relative to centred "show" position
        notificationEl.style.transform = `translate(-50%, ${currentDeltaY}px)`;
        // Fade out as it moves away
        const opacity = Math.max(0, 1 - Math.abs(currentDeltaY) / 160);
        notificationEl.style.opacity = String(opacity);
        e.preventDefault(); // prevent page scroll while swiping the toast
      };

      const onTouchEnd = () => {
        if (!isMobile()) return;
        // Restore smooth transition
        notificationEl.style.transition = 'transform 0.35s ease, opacity 0.35s ease';

        if (Math.abs(currentDeltaY) >= SWIPE_THRESHOLD) {
          // Flick off in the direction of the swipe
          const flyOut = currentDeltaY < 0 ? '-160%' : '160%';
          notificationEl.style.transform = `translate(-50%, ${flyOut})`;
          notificationEl.style.opacity = '0';
          setTimeout(() => {
            notificationEl.classList.remove('show');
            notificationEl.style.transform = '';
            notificationEl.style.opacity = '';
          }, 350);
        } else {
          // Short swipe — snap back to centre
          notificationEl.style.transform = 'translate(-50%, 0)';
          notificationEl.style.opacity = '1';
        }
        currentDeltaY = 0;
      };

      notificationEl.addEventListener('touchstart', onTouchStart, { passive: true });
      notificationEl.addEventListener('touchmove', onTouchMove, { passive: false });
      notificationEl.addEventListener('touchend', onTouchEnd, { passive: true });
      // ────────────────────────────────────────────────────

      // Show it
      notificationEl.classList.add('show');

      // Auto-hide after 5 seconds
      setTimeout(() => {
        notificationEl.classList.remove('show');
      }, 5000);

      // Schedule next notification between 80s and 90s
      const nextDelay = 80000 + Math.random() * 10000;
      setTimeout(showNotification, nextDelay);
    };

    let initialDelay = 4000;
    if (sessionStorage.getItem('hasSeenPurchaseNotification')) {
      initialDelay = 80000 + Math.random() * 10000;
    } else {
      sessionStorage.setItem('hasSeenPurchaseNotification', 'true');
    }

    // Initial delay then trigger first one
    setTimeout(() => {
      showNotification();
    }, initialDelay);

  } catch (e) {
    console.error('Error initPurchaseNotifications:', e);
  }
}

// Mobile hamburger menu
export function initMobileMenu() {
  const btn = document.getElementById('mobile-menu-btn');
  const drawer = document.getElementById('mobile-nav-drawer');
  const overlay = document.getElementById('mobile-nav-overlay');
  const closeBtn = document.getElementById('mobile-nav-close');
  if (!btn || !drawer || !overlay) return;

  const open = () => {
    drawer.classList.add('is-open');
    overlay.classList.add('is-open');
    btn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  };
  const close = () => {
    drawer.classList.remove('is-open');
    overlay.classList.remove('is-open');
    btn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  btn.addEventListener('click', open);
  if (closeBtn) closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', close);
  drawer.querySelectorAll('.mobile-nav-link').forEach(link => {
    link.addEventListener('click', close);
  });
}

// Initialize Categories Dropdown
export async function initCategoriesDropdown() {
  const container = document.getElementById('desktop-nav-categories');
  if (!container) return;
  
  try {
    const categories = await getCategories();
    if (!categories || categories.length === 0) return;
    
    container.innerHTML = categoryLinksHTML(categories);
  } catch (error) {
    console.error('Failed to load categories for dropdown:', error);
  }
}

// Automatically initialize when DOM is ready
function initializeUI() {
  injectFooter();
  initCategoriesDropdown();
  // initPurchaseNotifications(); // Disabled
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeUI);
} else {
  initializeUI();
}
