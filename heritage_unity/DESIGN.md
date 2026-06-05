---
name: Heritage & Unity
colors:
  surface: '#0b1326'
  surface-dim: '#0b1326'
  surface-bright: '#31394d'
  surface-container-lowest: '#060e20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3d'
  surface-container-highest: '#2d3449'
  on-surface: '#dae2fd'
  on-surface-variant: '#e3bebb'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#aa8987'
  outline-variant: '#5b403f'
  surface-tint: '#ffb3b0'
  primary: '#ffb3b0'
  on-primary: '#68000f'
  primary-container: '#be1e2d'
  on-primary-container: '#ffd3d1'
  inverse-primary: '#b91a2a'
  secondary: '#bdc2ff'
  on-secondary: '#1b247f'
  secondary-container: '#343d96'
  on-secondary-container: '#a8afff'
  tertiary: '#e9c349'
  on-tertiary: '#3c2f00'
  tertiary-container: '#cba72f'
  on-tertiary-container: '#4e3d00'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdad8'
  primary-fixed-dim: '#ffb3b0'
  on-primary-fixed: '#410006'
  on-primary-fixed-variant: '#930019'
  secondary-fixed: '#e0e0ff'
  secondary-fixed-dim: '#bdc2ff'
  on-secondary-fixed: '#000767'
  on-secondary-fixed-variant: '#343d96'
  tertiary-fixed: '#ffe088'
  tertiary-fixed-dim: '#e9c349'
  on-tertiary-fixed: '#241a00'
  on-tertiary-fixed-variant: '#574500'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 16px
  md: 24px
  lg: 40px
  xl: 64px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
---

## Brand & Style

The design system is anchored in the principles of community, legacy, and modern professionalism. It serves a demographic that values institutional stability paired with contemporary connectivity. The aesthetic is **Corporate / Modern** with a lean toward high-end membership platforms. 

The visual narrative uses deep, prestigious tones to evoke a sense of "The Club," while sharp execution and clear information hierarchy ensure the digital experience is efficient. The UI should feel like a private lounge—exclusive, well-ordered, and premium. We achieve this through the use of dark mode by default, high-contrast typography, and a "subtle-border" strategy that replaces heavy shadows with structural definition.

## Colors

The palette is derived directly from the club's heritage. 
- **Heritage Red (#BE1E2D):** Used exclusively for primary calls to action, urgent notifications, and status indicators. 
- **Deep Navy (#1A237E):** Used for subtle accents, specialized badges, and as a secondary brand touchpoint.
- **Surface & Backgrounds:** We use a "Night Navy" scale. The base background is `#0F172A`, with surface containers stepping up to `#1E293B`.
- **Text:** High-contrast accessibility is maintained with `Slate-50` (#F8FAFC) for primary text and `Slate-400` (#94A3B8) for secondary metadata.

## Typography

We utilize **Inter** across all levels to maintain a systematic, utilitarian, and professional feel. 
- **Hierarchy:** Use `display-lg` sparingly for welcome screens or major landing sections. 
- **Readability:** For long-form feed items or financial notes, stick to `body-lg`. 
- **Labels:** Use `label-caps` for table headers and small metadata tags to differentiate them from interactive body text.
- **Mobile Scaling:** Headlines must scale down on mobile to prevent awkward wrapping in card components.

## Layout & Spacing

This design system employs a **Fixed Grid** model for desktop (centered max-width of 1200px) and a **Fluid** model for mobile devices.
- **Rhythm:** An 8px linear scale governs all padding and margins.
- **Grid:** On desktop, a 12-column grid with 24px gutters is standard. On mobile, a 4-column grid with 16px gutters ensures content remains legible.
- **Financial Tables:** Tables should use a condensed "sm" spacing (8px) for vertical cell padding to maximize information density.

## Elevation & Depth

To maintain a premium, understated look, we avoid heavy drop shadows. 
- **Tonal Layering:** Depth is communicated through color. The further "forward" an object is, the lighter its background color (e.g., Background: #0F172A -> Card: #1E293B -> Modal: #334155).
- **Low-Contrast Outlines:** Every card and input field must have a 1px border using `Slate-800` (#1E293B). This defines the boundaries of elements without relying on heavy shadows.
- **Active State:** Only the primary Heritage Red buttons may use a subtle glow (50% opacity red shadow) to indicate focus or priority.

## Shapes

We use **Soft (1)** roundedness to balance modern friendliness with professional rigor.
- **Standard Radius:** 4px (0.25rem) for buttons, inputs, and small chips.
- **Large Radius:** 8px (0.5rem) for cards, modals, and container segments.
- **Avatars:** Strictly circular to provide a soft counterpoint to the otherwise rectilinear layout.

## Components

- **Buttons:** Primary buttons use the Heritage Red background with White text. Secondary buttons use a Navy outline with Navy text.
- **Cards:** Feed items use the `rounded-lg` radius with a 1px `Slate-800` border. Titles within cards use `title-md`.
- **Financial Tables:** Headers use `label-caps` with a subtle background tint. Rows should feature "zebra-striping" using slightly different shades of navy/charcoal for readability.
- **Chat Interface:** Member messages appear in Navy bubbles; user messages appear in Heritage Red or a dark-grey neutral bubble to distinguish between "Me" and "Them."
- **Navigation:** A persistent bottom navigation bar on mobile with clear icons and `label-caps` text. On desktop, a slim sidebar with high-contrast active states.
- **Inputs:** Dark backgrounds with a 1px border. On focus, the border transitions to Heritage Red.