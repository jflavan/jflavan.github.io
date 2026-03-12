# Cosmic Mode Easter Egg — Design Spec

## Overview

A hidden easter egg that transforms the site's atmosphere from its default purple aurora aesthetic into a cosmic starfield experience. Triggered by a 3-second press-and-hold on the gradient line below the hero section. Shifts the entire page mood — shader background, color palette, and ambient effects — while preserving layout, content, and accessibility.

## Trigger

- **Element:** `.hero-line` (the 1px gradient line below the hero name)
- **Interaction:** Press and hold for 3 seconds
- **Feedback during hold:** The line gradually brightens (opacity increases) and thickens (1px → 2px) over the 3-second hold, signaling something is building
- **Activation:** At 3 seconds, the line flashes briefly, then the cosmic transition begins
- **Deactivation:** Hold again for 3 seconds to toggle back to normal mode
- **Cancel:** Releasing before 3 seconds resets the line to its default state
- **Cursor:** Remains `default` — the line should not appear clickable. Only the hold feedback reveals the interaction.
- **Touch support:** `touchstart`/`touchend` mirror `mousedown`/`mouseup` behavior

## Visual Effects

### Shader Transformation (WebGL aurora → starfield)

**New uniform:** `uCosmic` (float, 0.0–1.0), animated over ~2 seconds via JS using `requestAnimationFrame` with eased interpolation.

**Changes driven by `uCosmic`:**

| Property | Normal (0.0) | Cosmic (1.0) |
|----------|-------------|--------------|
| Aurora light shapes (5x) | Full intensity | Faded to near-zero (`* (1.0 - uCosmic)`) |
| Gradient base | Purple palette (`#0a0014` base) | Deep blue-black palette (`#060810` base) |
| Noise warp breathe | ~0.09 + oscillation | ~0.01 (nearly still) |
| Star layer | Not rendered (intensity 0) | Bright twinkling points (intensity `uCosmic`) |
| Film grain in shader | 0.04 blend | 0.01 blend |
| Dark void | Normal strength | Softened (contributes to depth illusion) |

**Star layer implementation:**
- Hash function generates deterministic star positions from fragment coordinates
- Density: ~200–300 visible stars at any time (controlled by hash threshold)
- Brightness varies per star (secondary hash)
- Twinkle: per-star opacity oscillation using `sin(hash(position) * 1000.0 + uTime * speed)` with varied speeds
- Stars are small (1–2px) bright points, white to light blue

**Cosmic gradient (replaces purple gradient):**

| Stop | Normal | Cosmic |
|------|--------|--------|
| c0 | `(0.012, 0.0, 0.028)` near-black purple | `(0.024, 0.03, 0.06)` near-black blue |
| c1 | `(0.06, 0.0, 0.14)` very dark purple | `(0.04, 0.06, 0.14)` very dark blue |
| c2 | `(0.22, 0.06, 0.42)` dark purple | `(0.06, 0.15, 0.35)` dark blue |
| c3 | `(0.353, 0.094, 0.604)` #5a189a | `(0.10, 0.23, 0.36)` #1a3a5c |
| c4 | `(0.616, 0.306, 0.867)` #9d4edd | `(0.44, 0.66, 0.86)` #6fa8dc |
| c5 | `(0.780, 0.490, 1.0)` #c77dff | `(0.63, 0.77, 1.0)` #a0c4ff |
| c6 | `(0.878, 0.667, 1.0)` #e0aaff | `(0.82, 0.91, 1.0)` #d0e8ff |

The `purpleGradient()` function becomes `colorGradient()` that mixes between normal and cosmic stops using `uCosmic`.

### Page Color Shift (CSS)

**Mechanism:** CSS custom properties on `:root`, transitioned via a `.cosmic` class on `<body>`.

**CSS variables to introduce:**

```
--accent-deep:     #5a189a → #1a3a5c
--accent-mid:      #9d4edd → #6fa8dc
--accent-bright:   #c77dff → #a0c4ff
--accent-light:    #e0aaff → #d0e8ff
--bg-base:         #0a0014 → #060810
--glow-color:      rgba(157,78,221,*) → rgba(111,168,220,*)
```

**Elements affected:**
- Nav contact button border and hover states
- Hero gradient text fill
- Hero line gradient
- Section label colors
- Focus card borders and icon colors
- Experience timeline accent line and dots
- Skill tag borders and text
- Contact button gradients and hover states
- Footer link colors
- Console easter egg colors
- Box shadows / glow effects

**Transition:** All CSS custom properties transition over 2 seconds using `transition: color 2s, border-color 2s, background 2s, box-shadow 2s` on relevant elements, or a global transition on `body.cosmic *`.

### Ambient Changes

- **Film grain SVG overlay:** Opacity transitions from 3.5% → 1.5% (cleaner, crisper feel)
- **Scroll parallax:** In cosmic mode, reveal elements get a subtle `translateY` offset proportional to scroll position, creating a gentle depth/parallax effect. Offset: ~10–15px max shift.
- **Console message:** Updates to a space-themed variant (e.g., "You found the cosmos." with star emoji in cosmic colors)

## State Management

- **JS variable:** `let cosmicMode = false;`
- **CSS class:** `document.body.classList.toggle('cosmic')` drives all CSS transitions
- **Shader uniform:** `uCosmic` animated from 0→1 or 1→0 over ~2 seconds using `requestAnimationFrame` with easeInOutCubic
- **Persistence:** `localStorage.setItem('cosmicMode', 'true')` — on page load, check and restore state (apply immediately, no transition on load)

## Hold Interaction Detail

```
mousedown/touchstart on .hero-line:
  → start 3-second timer
  → begin CSS transition: line brightens + thickens over 3s

mouseleave/mouseup/touchend before 3s:
  → cancel timer
  → reset line to default (quick 0.3s transition back)

timer completes at 3s:
  → brief flash on line (opacity spike then settle)
  → toggle cosmicMode
  → add/remove .cosmic class on body
  → animate uCosmic uniform (0→1 or 1→0 over 2s)
  → save to localStorage
```

## Accessibility

- **`prefers-reduced-motion`:** Skip the 2-second transition — apply color and shader changes instantly (set `uCosmic` to target value without animation, swap CSS class without transitions)
- **Color contrast:** Blue-white cosmic palette maintains WCAG AA contrast ratios against dark background (same or better than purple palette since blue-white values are similar lightness)
- **Screen readers:** No content or layout changes — completely invisible to assistive technology
- **Keyboard:** Not triggered by keyboard (hold interaction is pointer-only). This is intentional — easter eggs don't need full keyboard accessibility, and the content is identical in both modes.

## Files Modified

- `index.html` — all changes are in this single file:
  - CSS: Add custom properties to `:root`, `.cosmic` variant values, hero-line hold states, transition rules
  - HTML: No structural changes needed
  - JS: Add hold interaction handler, cosmic state management, localStorage persistence, shader uniform animation
  - GLSL: Add `uCosmic` uniform, cosmic gradient function, star layer, interpolated rendering

## Out of Scope

- No new files or dependencies
- No build step changes
- No SEO/meta changes
- No layout or typography changes
- No mobile-specific adjustments beyond touch event support (visual effect works identically)
