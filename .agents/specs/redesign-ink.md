# Spec: johnflavan.com redesign — "Ink"

Status: approved direction (2026-09-10). Supersedes the aurora/glass design. Synthesised from the concept round (variant B chosen), the user's answers, and the two research files in `.agents/research/`.

## Problem Statement

The current site reads as an AI-generated template: aurora gradient, glass cards with glowing borders, icon-in-circle rows, tag pills, Inter, word-by-word reveals on every paragraph, film grain over gradients. It does not look like the work of someone who leads design-minded engineering teams, and it would not be considered for a design award.

## Solution

A dark, monumental, single-page site in the manner of the 2024–2026 Awwwards portfolio winners and the two references (RXK Studio, Flot Noir): one grotesque family in three weights, a two-colour palette with no default accent, a 12-column grid with a vw ladder of type sizes, one motion motif (a bold word in a clipped box that types in, rolls, or drops) applied everywhere, and one physical effect (a WebGL fluid "ink in water" simulation that reacts to the cursor and scroll). The existing theme-flip Easter egg is kept and rehomed on a giant footer wordmark.

## User Stories

1. As a visitor, I want to understand within three seconds what John does, so that I decide whether to keep reading.
2. As a visitor on a laptop, I want the page to feel alive to my hand (cursor and wheel), so that it feels crafted rather than templated.
3. As a visitor on a phone, I want the same content with the heavy effects toned down, so that it loads fast and scrolls smoothly.
4. As a visitor who prefers reduced motion, I want every reveal to resolve instantly and the fluid to stay still, so that the site remains usable.
5. As a recruiter, I want the experience list, focus areas, and skills to be readable and copyable as plain text, so that I can skim.
6. As a returning visitor, I want the hidden theme flip to still exist somewhere discoverable, so that the site keeps its personality.
7. As John, I want the copy to be my own words, so that the site sounds like me.
8. As a search engine or link unfurler, I want the metadata, structured data, and Open Graph tags preserved, so that rankings and previews are unaffected.
9. As a keyboard user, I want every link and the wordmark button to be reachable and visibly focused.
10. As a screen-reader user, I want the statement and all sections announced as real text, not canvas.

## Implementation Decisions

- **Type**: Satoshi (Fontshare, ITF Free Font License, self-hosted woff2) in 900 for display, 700 for labels, 500 for text. Display is uppercase, letter-spacing 0, line-height 0.82, inside a `clip-path: polygon(0 3%, 0 99%, 100% 99%, 100% 3%)` line box. Ladder (vw, clamped): 7.6 / 5.2 / 2.6 / 1.15 / 0.8.
- **Colour**: `--noir #111110`, `--blanc #F1EFE8`, `--line` at 18% blanc, `--mute` at 55% blanc. No accent in the default theme. The Easter-egg themes (forest, cosmic, ember, solar, rose) set the ink dye colour, a tinted ground, and a light accent used only on labels and the nav.
- **Grid**: 12 columns, gutter and margin 20px, 1.4vw at ≥1440px. Sections are full-bleed with 2px rules in the foreground colour.
- **Copy**: the live site's copy verbatim. Only the hero statement is re-split into lines; no new sentences.
- **Order**: Hero → About → Focus → Experience → Skills → Contact → Footer/wordmark.
- **Intro**: no preloader. 0.8s hold showing nav and clock; statement words `gsap.set` in one at a time every 110ms; then the fine-print row and the fluid canvas fade in. Reduced motion: everything visible immediately.
- **Hero**: positioning statement at 7.6vw, four lines; fine-print row on the 12-col grid (positioning paragraph, current role, base, since). On scroll the statement lines drop out of their clip line by line (scrubbed).
- **About**: the "I build products…" statement as a scrubbed word-roll (each word doubled, rolls over as the section passes the viewport middle); portrait revealed with a two-layer curtain (wrapper slides down, image slides up) at power4.inOut 1s; grayscale to colour on hover.
- **Focus**: three sticky full-height panels that stack; the previous panel scales to 0.92 and dims as the next covers it. Each panel: index, title at 5vw, paragraph, tool list in small caps. Behind each panel an outlined-text marquee of that panel's tags driven by scroll velocity.
- **Experience**: pinned section; vertical scroll drives a horizontal ribbon of seven cards (index, year, role, company, description); a progress bar; the "15+ years…" statement leads the section.
- **Skills**: a word wall (500 weight at 3.4vw) grouped under small-caps labels; hovering a term rolls it (two stacked copies).
- **Contact**: "An idea, a project, or just want to connect?" at 6vw; a rolling "Let's talk" mailto; clicking the email address copies it and shows "Copied".
- **Footer**: rolling GitHub/LinkedIn links, meta line, then a full-width "JOHN FLAVAN" SVG wordmark as a `<button>`. Outlined by default, fills on hover. Press-and-hold for 3s fills it progressively while the fluid churns; on release at 100% the theme flips with a mask-image wipe and the console message, as today. Early release cancels.
- **Fluid**: a compact WebGL Navier–Stokes solver (Dobryakov style; sim 128, dye 1024 desktop / 512 touch, 12 pressure iterations, curl 25, dissipation ~0.985). Dye is off-white smoke by default and the theme colour when themed. Idle auto-splats keep it alive; pointer and scroll velocity add splats. Fixed behind the page, faded out past the hero, brought back during the wordmark hold. Falls back to a still gradient without WebGL. Pauses when the tab is hidden and under reduced motion.
- **Scroll**: Lenis (MIT) driving GSAP ScrollTrigger; disabled on touch. Anchor links scroll via Lenis.
- **Nav**: fixed, mix-blend-mode difference; name left, section links centre, live St. Louis clock right.
- **Libraries**: GSAP 3.13 core + ScrollTrigger, Lenis 1.3 — vendored under `lib/`, no CDN dependency at runtime.
- **Easing vocabulary**: power4.inOut 1s for structural moves, power4.out 0.4–0.6s for hover, power1.inOut for scrubs, 0.11–0.16s staggers. No ease-in on UI.
- **SEO/metadata**: head, JSON-LD, Open Graph, sitemap, robots, canonical preserved; OG image regenerated to match.

## Testing Decisions

- No unit-test seam exists in this static site; the verification seam is the rendered page. Each build is screenshotted at 1440×900 and 390×844 with fonts and scripts loaded, at rest and at eight scroll positions, and checked for console errors.
- Reduced-motion and no-WebGL paths are exercised by emulating `prefers-reduced-motion` and by disabling WebGL in the test browser.
- Lighthouse-style checks: no horizontal overflow, all images sized, no layout shift from fonts (metric-matched fallback).

## Out of Scope

- Case-study pages or a work grid (no projects to show yet).
- Sound.
- A light theme (the user chose dark; the Easter-egg themes cover variety).
- Copy rewrites beyond re-splitting the hero statement.

## Further Notes

- The three-variant prototype stays at `_prototype/index.html` on this branch as the primary source for the decision; the underscore keeps it out of the published site.
- Research: `.agents/research/award-winning-portfolio-design.md`, `.agents/research/reference-sites-flotnoir-rxk.md`.
