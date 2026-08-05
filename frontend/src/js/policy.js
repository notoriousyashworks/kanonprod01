import { getNavbarHTML, getFooterHTML, initSearch, initMobileMenu } from './ui.js';
import { updateCartBadge } from './cart.js';
import { initWishlistSidebar, updateWishlistBadge } from './wishlist.js';
import { initCartSidebar } from './cart-sidebar.js';
import { initProfileDropdown } from './profile.js';
import { initLoginModalTrigger } from './login-modal.js';

// Render navbar & footer
document.getElementById('navbar-container').innerHTML = getNavbarHTML('policy');
document.getElementById('footer-container').innerHTML = getFooterHTML();
initMobileMenu();
updateCartBadge();
initWishlistSidebar();
initCartSidebar();
updateWishlistBadge();
initProfileDropdown();
initSearch();
initLoginModalTrigger();
