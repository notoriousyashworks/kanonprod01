---
name: Kicks Aura Design System
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f3'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#5b403f'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f1f1f1'
  outline: '#8f6f6e'
  outline-variant: '#e4bebc'
  surface-tint: '#bb152c'
  primary: '#b7102a'
  on-primary: '#ffffff'
  primary-container: '#db313f'
  on-primary-container: '#fffbff'
  inverse-primary: '#ffb3b1'
  secondary: '#485f84'
  on-secondary: '#ffffff'
  secondary-container: '#bbd3fd'
  on-secondary-container: '#445a7f'
  tertiary: '#336366'
  on-tertiary: '#ffffff'
  tertiary-container: '#4c7c7f'
  on-tertiary-container: '#f2ffff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad8'
  primary-fixed-dim: '#ffb3b1'
  on-primary-fixed: '#410007'
  on-primary-fixed-variant: '#92001c'
  secondary-fixed: '#d5e3ff'
  secondary-fixed-dim: '#b0c7f1'
  on-secondary-fixed: '#001b3c'
  on-secondary-fixed-variant: '#30476a'
  tertiary-fixed: '#b9ecee'
  tertiary-fixed-dim: '#9ecfd1'
  on-tertiary-fixed: '#002021'
  on-tertiary-fixed-variant: '#1a4e50'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
typography:
  display-lg:
    fontFamily: Montserrat
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Montserrat
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-md:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-sm:
    fontFamily: Montserrat
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-bold:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
  headline-lg-mobile:
    fontFamily: Montserrat
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  container-max: 1280px
  gutter: 24px
---

## Brand & Style

The design system for Kicks Aura is built to channel the high-octane energy of sneaker culture and lifestyle commerce. The brand personality is **Active, Trustworthy, and Authoritative**, positioning itself as a premium destination for "quality, trust, and style."

The visual style is a blend of **Corporate Modern** and **High-Contrast Bold**. It utilizes a "clean-canvas" approach—heavy use of white space to let high-resolution product photography drive the visual narrative, while using a sharp, energetic red to signify action and urgency. This system focuses on high-legibility and a structured layout to instill confidence in the consumer during the purchasing journey.

The emotional goal is to evoke excitement through color and reassurance through a precise, professional layout.

## Colors

The color strategy uses a triad of High-Energy Red, Deep Professional Navy, and Neutral Whites.

- **Primary (Vibrant Red):** Used exclusively for call-to-action elements, price points, and key brand highlights. It is the "Aura" of the brand—designed to stand out against the white background to encourage conversions.
- **Secondary (Navy/Off-Black):** Used for primary text and secondary buttons to provide a grounded, trustworthy contrast to the red.
- **Surface/Background:** A pure white (#FFFFFF) is used for the main canvas to ensure product images appear crisp and true-to-color.
- **System States:**
    - **Success:** #2A9D8F (Soft Teal)
    - **Warning:** #F4A261 (Muted Orange)
    - **Error:** #D62828 (Deep Red)

## Typography

This design system utilizes a dual-sans-serif pairing to balance impact with utility. 

**Montserrat** is the display typeface, used for headlines and product names. Its geometric construction and bold weights mirror the "KICKS AURA" logo, providing a strong, athletic aesthetic. 

**Inter** is used for all body copy, product descriptions, and UI labels. It was chosen for its exceptional legibility at small sizes and its neutral, modern character which doesn't compete with the bold headlines.

- **Scale:** Use `display-lg` only for hero sections.
- **Hierarchy:** Maintain a clear vertical rhythm by using `label-bold` for section eyebrows (e.g., "SHOP BY CATEGORY").
- **Contrast:** Headlines should always be in the secondary navy/black color or white on red backgrounds; never use the primary red for long-form text.

## Layout & Spacing

The layout utilizes a **12-column fluid grid** for desktop and a **4-column grid** for mobile. 

- **The "Breathable" Grid:** High-end e-commerce requires space. Use `lg` (48px) spacing between major sections (e.g., between the Category section and New Arrivals).
- **Product Grids:** Use a 24px gutter between product cards to ensure price and title information remain distinct.
- **Safe Zones:** A standard 24px margin is required on mobile devices to prevent content from touching the screen edges.
- **Alignment:** All text elements should align to the left within their containers, except for Hero sections and Section Headers, which may be centered to create a formal "entryway" to the content.

## Elevation & Depth

To maintain a "professional and trustworthy" feel, this design system avoids heavy, dark shadows in favor of **Tonal Layers** and **Ambient Depth**.

- **Level 0 (Flat):** Used for the main page background.
- **Level 1 (Subtle Surface):** Used for secondary cards or content areas. Background: #F1F1F1 with no shadow.
- **Level 2 (Floating):** Used for product cards and navigation bars. Use an extra-diffused shadow: `box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.05)`.
- **Level 3 (Interactive):** Used for hover states on buttons and cards. Increase shadow density slightly: `box-shadow: 0px 8px 30px rgba(0, 0, 0, 0.08)`.

Avoid colored shadows to keep the design feeling crisp and high-end.

## Shapes

The shape language is defined as **"Curvy Rectangular."** This approach softens the industrial nature of the footwear brand without making it appear "childish" or overly "bubbly."

- **Standard Radius:** 0.5rem (8px) for buttons, input fields, and small chips.
- **Large Radius:** 1rem (16px) for product cards, category tiles, and testimonial blocks.
- **Extra Large Radius:** 1.5rem (24px) for prominent hero banners or modal containers.

Consistency in these rounded corners is vital to maintaining the "Aura" of a unified, professional design system.

## Components

### Buttons
- **Primary:** Background: Primary Red; Text: White; Font: Montserrat Bold. These should have a subtle scale-up animation on hover.
- **Secondary:** Border: 2px Solid Navy; Text: Navy; Background: Transparent. 
- **Ghost:** No border or background; Text: Navy; Used for "View All" or "Terms."

### Cards (Product & Category)
- Cards must use the `rounded-lg` (16px) radius. 
- Image containers within cards should have a slight off-white background (#F9F9F9) to define the product silhouette if the product itself is white.
- Hover state: A subtle lift (Level 3 shadow).

### Input Fields
- Use a 1px border (#D1D1D1) with `rounded-md` (8px). 
- Active state: Border changes to Primary Red or Deep Navy.
- Placeholder text: Inter, Medium Gray.

### Chips & Badges
- Used for "New Arrival," "Sale," or "Size."
- High-contrast: Use Primary Red background with white text for "Sale" badges to create urgency.
- Functional: Use Light Gray background for size selectors with a 2px Red border for the selected state.

### Testimonials
- Use the provided user-style cards with the slightly rounded corners.
- Include 5-star rating icons in Primary Red to emphasize trust.