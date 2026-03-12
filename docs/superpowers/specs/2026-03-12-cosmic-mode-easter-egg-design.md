# Cosmic Mode Easter Egg — Design Spec

## Overview

A hidden easter egg that transforms the site's atmosphere from its default purple aurora aesthetic into a cosmic starfield experience. Triggered by a 3-second press-and-hold on the gradient line below the hero section. Shifts the entire page mood — shader background, color palette, and ambient effects — while preserving layout, content, and accessibility.

## Trigger

- **Element:** `.hero-line` (the 1px gradient line below the hero name)
- **Touch target:** The visual line is 1px, but the hit area is padded to 44px tall (22px padding top/bottom) via a `::before` pseudo-element or transparent padding. This ensures usable tap targets on touch devices without changing the visual design.
- **Interaction:** Press and hold for 3 seconds
- **Feedback during hold:** The line gradually brightens (opacity increases) and thickens (1px → 2px) over the 3-second hold, signaling something is building
- **Activation:** At 3 seconds, the line flashes briefly, then the cosmic transition begins
- **Deactivation:** Hold again for 3 seconds to toggle back to normal mode
- **Cancel:** Releasing, `mouseleave`, or scrolling (`touchmove`) before 3 seconds cancels the hold timer and resets the line to its default state (quick 0.3s transition back).
- **Cursor:** Remains `default` — the line should not appear clickable. Only the hold feedback reveals the interaction.
- **Touch support:** `touchstart`/`touchend` mirror `mousedown`/`mouseup` behavior. `touchmove` cancels the hold (prevents conflict with scroll).
- **Disabled during transition:** While the `uCosmic` uniform is animating (mid-transition), the hold interaction is disabled to prevent conflicting state changes.

## Visual Effects

### Shader Transformation (WebGL aurora → starfield)

**New uniform:** `uCosmic` (float, 0.0–1.0), animated over ~2 seconds via JS using `requestAnimationFrame` with easeInOutCubic easing. WebGL2 defaults float uniforms to 0.0; on page load with persisted cosmic state, set `uCosmic = 1.0` before the first `render()` call to avoid a single-frame flash of purple.

**Changes driven by `uCosmic`:**

| Property | Normal (0.0) | Cosmic (1.0) |
|----------|-------------|--------------|
| Aurora light shapes (5x) | Full intensity | Final mix alpha multiplied by `(1.0 - uCosmic)` — e.g., `glow1 * intensity * (1.0 - uCosmic)` |
| Gradient base | Purple palette (`#0a0014` base) | Deep blue-black palette (`#060810` base) — gradient stops lerp via `mix()` |
| Noise warp breathe | ~0.09 + oscillation | ~0.01 (nearly still) |
| Star layer | Not rendered (intensity 0) | Bright twinkling points (intensity `uCosmic`) |
| Film grain in shader | 0.04 blend | 0.01 blend |
| Dark void | Clamp addend 0.4, purple-black void color | Clamp addend 0.55 (softer), blue-black void color `vec3(0.01, 0.01, 0.03)` |

Note: Because gradient stops lerp between purple and blue using `uCosmic`, the aurora light shapes transition through blended colors before fading out, avoiding awkward purple ghosts against a blue background.

**Star layer implementation:**
- Hash function generates deterministic star positions from fragment coordinates (cheap `fract(sin(dot(...)))` pattern — evaluated per-fragment but very lightweight)
- Density: ~200–300 visible stars at any time (controlled by hash threshold)
- Brightness varies per star (secondary hash)
- Twinkle: per-star opacity oscillation using `sin(hash(position) * 1000.0 + uTime * speed)` with varied speeds
- Stars are small (1–2px) bright points, white to light blue
- Entire star layer multiplied by `uCosmic` so it fades in/out with the transition

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

The `purpleGradient()` function becomes `colorGradient()` that accepts `uCosmic` and uses `mix()` to interpolate between normal and cosmic color stops.

### Page Color Shift (CSS)

**Mechanism:** CSS custom properties on `:root`, swapped via a `.cosmic` class on `<body>`. Transitions are applied to specific element selectors (not a wildcard `*` rule) to avoid performance issues.

**CSS variables to introduce:**

```
--accent-deep:     #5a189a → #1a3a5c
--accent-mid:      #9d4edd → #6fa8dc
--accent-bright:   #c77dff → #a0c4ff
--accent-light:    #e0aaff → #d0e8ff
--bg-base:         #0a0014 → #060810
--glow-color:      rgba(157,78,221,*) → rgba(111,168,220,*)
```

**Elements affected (each gets explicit transition rules):**
- Nav contact button border and hover states
- Hero gradient text fill — note: `background-image` gradients cannot transition via CSS. Use a `.cosmic` class override with the new gradient colors; the shader transition provides visual continuity so the instant swap is not jarring.
- Hero line gradient — same approach as gradient text (class override, not transition)
- Section label colors
- Focus card borders and icon colors
- Experience timeline accent line and dots
- Skill tag borders and text
- Contact button gradients and hover states
- Footer link colors
- Box shadows / glow effects

**Transition approach:** Add `transition: color 2s ease, border-color 2s ease, box-shadow 2s ease` to the specific selectors listed above. For `background-color` properties (non-gradient), include `background-color 2s ease`. For gradient backgrounds (hero text fill, hero line, buttons), use instant class-swap since CSS gradient transitions are not supported.

### Ambient Changes

- **Film grain SVG overlay:** Opacity transitions from 3.5% → 1.5% via `body.cosmic::after { opacity: 0.015; }` with `transition: opacity 2s ease` on the `::after` pseudo-element. Note: this is the CSS SVG filter overlay, separate from the in-shader film grain (both are reduced in cosmic mode).
- **Scroll parallax:** In cosmic mode, elements with `.reveal`, `.reveal-left`, `.reveal-right`, `.reveal-scale` classes (after their reveal animation has completed — i.e., they have the `.visible` class) get a subtle `translateY` offset proportional to their distance from viewport center. Offset: ~10–15px max shift. Implemented via the existing scroll listener, only active when `cosmicMode === true`.
- **Console message:** Replaces the existing GitHub message with: `"You found the cosmos. ✦\nhttps://github.com/jflavan"` styled with `color: #a0c4ff` for text and `color: #6fa8dc` for URL. Logged once on activation; the original message is logged on deactivation.

## State Management

- **JS variable:** `let cosmicMode = false;` and `let cosmicTransitioning = false;` (prevents hold interaction during animation)
- **CSS class:** `document.body.classList.toggle('cosmic')` drives all CSS transitions
- **Shader uniform:** `uCosmic` animated from current value → target over ~2 seconds using `requestAnimationFrame` with easeInOutCubic. Always interpolates from current value (not 0 or 1) so interruption mid-transition (if ever enabled) would be smooth.
- **Persistence:** `localStorage` wrapped in try/catch for Safari private browsing and quota-exceeded scenarios. On page load, check `localStorage.getItem('cosmicMode')` — if `'true'`, set `cosmicMode = true`, add `.cosmic` class, and set `uCosmic = 1.0` before first render call. No transition on load.

## Hold Interaction Detail

```
mousedown/touchstart on .hero-line:
  → if cosmicTransitioning, ignore
  → start 3-second timer
  → begin CSS transition: line brightens + thickens over 3s

mouseleave/mouseup/touchend/touchmove before 3s:
  → cancel timer
  → reset line to default (quick 0.3s transition back)

timer completes at 3s:
  → set cosmicTransitioning = true
  → brief flash on line (opacity spike then settle)
  → toggle cosmicMode
  → add/remove .cosmic class on body
  → animate uCosmic uniform (current value → target over 2s, easeInOutCubic)
  → on animation complete: set cosmicTransitioning = false
  → save to localStorage (try/catch)
  → log appropriate console message
```

## Accessibility

- **`prefers-reduced-motion`:** The existing site hides the WebGL canvas entirely (`display: none !important`) under this media query. In cosmic mode with reduced motion: only CSS color changes apply (class swap, no transitions). The shader transformation is irrelevant since the canvas is hidden. Scroll parallax is also disabled under reduced motion. The hold feedback animation (line brightening/thickening) is kept since it is brief, user-initiated, and provides necessary interaction feedback. The color palette shift alone provides the "cosmic" feel.
- **Color contrast:** Blue-white cosmic palette maintains WCAG AA contrast ratios against dark background (same or better than purple palette since blue-white values are similar lightness)
- **Screen readers:** No content or layout changes — completely invisible to assistive technology
- **Keyboard:** Not triggered by keyboard (hold interaction is pointer-only). This is intentional — easter eggs don't need full keyboard accessibility, and the content is identical in both modes.

## Files Modified

- `index.html` — all changes are in this single file:
  - CSS: Add custom properties to `:root`, `.cosmic` variant values, hero-line hold states and touch target padding, transition rules on specific selectors
  - HTML: No structural changes needed
  - JS: Add hold interaction handler (with touchmove cancel), cosmic state management, localStorage persistence (try/catch), shader uniform animation with transitioning lock
  - GLSL: Add `uCosmic` uniform, cosmic gradient function with `mix()` interpolation, star layer, interpolated rendering for all light shapes and void

## Out of Scope

- No new files or dependencies
- No build step changes
- No SEO/meta changes
- No layout or typography changes
- WebGL context loss recovery (pre-existing gap, not introduced by this feature)
