# Webflow Conf 2026 loader logotype — typographic treatment analysis

Researched 2026-09-10 against the live page `https://webflow.com/webflowconf` (Webflow-hosted site id `691cae015684992d4cd5edac`, domain `webflowconf-2026.webflow.io`). Everything below is read directly from the static HTML, its stylesheet and its inline scripts — the loader is fully declared in static markup, so nothing needed a browser to establish. Rendered contact sheet of the four glyph styles: `./webflowconf-loader-styles.png` (rendered from the page's own SVG path data with cairosvg).

---

## 1. What the logotype is

**Inline SVG paths — not live text, not Lottie, not video, not canvas.**

- Markup: `<div id="loader-overlay" class="loader-overlay"><div class="loader-logo"><div class="w-embed"><svg id="wconf-logo" viewBox="0 0 1984 410" fill="none" overflow="visible">…`
- Content: the Webflow "W" mark (`#w-mark`, one path, ≈620 units wide) followed by four letters **C O N F** (`#letter-c`, `#letter-o`, `#letter-n`, `#letter-f`) — i.e. the mark reads "**W CONF**" (Webflow Conf).
- Every letter has **four alternative outlines** stored in `<defs>`: `c-s1…c-s4`, `o-s1…o-s4`, `n-s1…n-s4`, `f-s1…f-s4`. The visible `#letter-*` paths start as the `-s1` shapes. The nav and footer logos (`[data-morph-logo] .wconf-logo`) carry byte-identical copies prefixed `nav-`/`footer-` and morph on hover.
- All glyphs are outlines (no `<text>`, no `font-family` on the SVG), so no font name is embedded in the logo. The typefaces the page *loads* are the evidence for what the outlines were drawn from (see §3).
- Cap-height fills the whole 410-unit viewBox; letters are roughly 330–400 units wide each, so the ratio is ~1 : 1 per glyph. Tracking is tight to overlapping: bounding boxes C 584–948, O 969–1353, N 1332–1717 (the italic N overhangs the O), F 1733–1946. Uppercase throughout. No `letter-spacing`/`font-stretch`/`font-variation-settings` are involved — it is pure path geometry.
- Sizing: `.loader-logo { width: 48vw; max-width: 720px }`, SVG `width:100%; height:auto`, centered in a fixed full-viewport flex overlay (`inset:0; z-index:9999`).

## 2. Exactly how it animates (from inline script #19, verbatim constants)

Libraries: GSAP **3.15.0** + `MorphSVGPlugin` (also SplitText, ScrollTrigger, ScrambleTextPlugin are registered, but the loader uses only MorphSVG). All loaded from `cdn.prod.website-files.com/gsap/3.15.0/`.

```js
const revealDuration = 0.5,  revealEase = 'power3.out', revealDelay = 0.4;
const slideOffset = 180,     slideDuration = 0.7,       slideEase = 'power2.out';
const confSlideOffset = -180;
const morphDuration = 0.35,  holdDuration = 0.25,       ease = 'expo.inOut', stagger = 0.06;
const dismissDelay = 0.6,    dismissDuration = 0.8;     // dismissDelay unused; hard-coded delayedCall(3.5)
```

Session gate: `if (sessionStorage.getItem('wconf-loader-shown'))` → overlay `display:none` immediately; otherwise `gsap.set('#loader-overlay',{display:'flex'})` and the timeline runs once per browser session.

**Phase A — masked diagonal reveal + slide (t = 0.4 s → 1.1 s)**

Two `<clipPath>`s hold rectangles that are *rotated* so the wipe edge is tilted:

```svg
<clipPath id="w-reveal-clip">   <rect id="w-clip-rect"    x="-300" y="1200"  width="1230" height="1010" transform="rotate(-5 312 205)"/></clipPath>
<clipPath id="conf-reveal-clip"><rect id="conf-clip-rect" x="250"  y="-1500" width="2100" height="1010" transform="rotate(5 1284 205)"/></clipPath>
```

At master position 0 (after the 0.4 s delay) four tweens fire simultaneously:

| target | from → to | duration | ease |
|---|---|---|---|
| `#w-clip-rect` attr y | 1200 → −300 | 0.5 s | power3.out |
| `#w-slide-group` y | +180 → 0 | 0.7 s | power2.out |
| `#conf-clip-rect` attr y | −1500 → −300 | 0.5 s | power3.out |
| `#conf-slide-group` y | −180 → 0 | 0.7 s | power2.out |

Effect: the **W rises from below** while a −5° tilted mask wipes *upward* over it; **CONF drops from above** while a +5° tilted mask wipes *downward*. Opposite directions, opposite tilts — the two halves "shear" into place and settle.

**Phase B — ransom-note letter morph loop (starts t ≈ 0.7 s, repeats)**

```js
function morphAll(tl, style, position) {
  letters.forEach((sel, i) => tl.to(sel, { morphSVG: `#${id}-s${style}`, duration: 0.35, ease: 'expo.inOut' },
                                     i === 0 ? position : '<+=0.06'));   // 60 ms letter stagger
}
const morphLoop = gsap.timeline({ repeat: -1 });
morphAll(morphLoop, 2, 0.3);  morphAll(morphLoop, 3, '+=0.25');
morphAll(morphLoop, 4, '+=0.25');  morphAll(morphLoop, 1, '+=0.25');
master.add(morphLoop, 0);
```

- Each step: all four letters morph to the next style set, C first, then O/N/F each 60 ms later, 0.35 s per letter with `expo.inOut` (snappy: slow-fast-slow, most of the change in the middle ~120 ms). A whole step takes 0.35 + 3×0.06 = **0.53 s**.
- Hold **0.25 s** between steps; sequence **s1 → s2 → s3 → s4 → s1**, then the loop restarts with a 0.3 s lead-in. One full cycle ≈ 0.3 + 4×0.53 + 3×0.25 ≈ **3.2 s**.
- The morph runs concurrently with Phase A (it starts 0.3 s into the reveal), so letters are already shifting style as they land.
- MorphSVG interpolates the actual outline, so intermediate frames are genuine in-between shapes (a serif C smearing into a geometric C), not a crossfade.

**Phase C — dismissal (t = 3.5 s → ~4.45 s, measured from script execution)**

```js
gsap.delayedCall(3.5, () => {
  gsap.to('.loader-logo', { scale: 0.96, opacity: 0, duration: 0.4, ease: 'power2.in' });
  gsap.to('#loader-overlay', { opacity: 0, duration: 0.8, delay: 0.15, ease: 'power2.inOut',
    onComplete() { morphLoop.kill(); master.kill(); overlay.style.display='none';
                   document.body.style.overflow=''; sessionStorage.setItem('wconf-loader-shown','1'); } });
});
```

The logo shrinks slightly (100 → 96 %) and fades over 0.4 s; 150 ms later the whole overlay crossfades out over 0.8 s. No wipe/curtain — it is a plain opacity fade that lands on the hero. The countdown strip on the page (`script #22`) watches `#loader-overlay` with a `MutationObserver` and only starts its own 1.6 s slide-in after the overlay is hidden, so the page's first motion is chained to the loader's end. The hero's Three.js pixelation image-crossfade shader starts independently.

Dead code worth knowing: `totalCycles = 2`, `landingDuration`, `landingEase`, `dismissDelay` are declared but unused; `morphLoop.addDelay = morphStart` is a no-op property assignment. The nav/footer hover version (script #16) uses `morphDur 0.3 / hold 0.25 / stagger 0.05`, and on `mouseleave` eases every letter back to `-s1` with `expo.out`.

## 3. Visual character of the type

The resting logotype is a **"ransom note" / mixed-typeface wordmark**: each letter is drawn in a *different* typeface, and each morph step rotates which style each letter wears. Nothing is condensed/extended/stencil as a whole — the treatment is *deliberate typographic mismatch*, all uppercase, all at a common cap-height, sitting on one baseline, tightly tracked so serifs and italics overlap.

Rendered from the path data (see PNG), the four sets read as:

| set | C | O | N | F |
|---|---|---|---|---|
| **s1** (rest) | high-contrast calligraphic serif with a swash top terminal | geometric monoline sans O (two concentric ellipses) | **pixel/bitmap serif italic** | light italic sans, slightly flared |
| **s2** | condensed high-contrast serif (Didone-like) | italic high-contrast serif oval | hairline Didone italic with serifs | Didone italic serif |
| **s3** | geometric monoline sans | italic high-contrast serif | **pixel serif, upright** | monoline sans/slab F |
| **s4** | italic high-contrast serif | **pixel/bitmap O** | swashy calligraphic italic (cursive-n-like N) | italic serif |

Path-level evidence for the pixel glyphs: `n-s1` (7 subpaths, 54 H/V line commands, zero curves), `n-s3` (42 H/V, zero curves) and `o-s4` (4 subpaths, 48 H/V, zero curves) are pure orthogonal staircases — bitmap outlines. The O in s1/s2/s3 is two rings (`subpaths=2`), the C variants are single high-contrast strokes with 8–24 curve commands.

The typefaces the page loads (from `@font-face` in the site CSS and Typekit kit `neh4xwu`) are almost certainly the drawing sources — six families, each matching one of the styles above:

| family (as loaded) | style loaded | designer / foundry | matches |
|---|---|---|---|
| `Kreolstandard` (Kreol Standard) | 500 italic (`KreolStandard-MediumItalic.otf`) | René Bieder | high-contrast serif italics (s2/s4 C, O, F) |
| `Neuemagnatstandard` (Neue Magnat Standard) | 500 italic (`NeueMagnatStandard-MediumItalic.otf`) | René Bieder | Didone/hairline italics (s2 N, F) |
| `Zangezisans 09 Text` (Zangezi Sans) | 400 normal | Daria Petrova (Future Fonts) | quirky monoline sans (s1 O, s3 C) |
| `Paragraf` | 300 italic + 500 | Typeji (2026) | narrow, sharp-cut serif/italic (s1 F, s4 N candidates) |
| `argent-pixel-cf` (Argent Pixel CF) | 400 **italic**, via Adobe Fonts | Connary Fagen | bitmap serif (s1 N, s3 N, s4 O) — "recreates Argent's look in a style evocative of early Macintosh typography… angled serifs and swashy italics" |
| `WF Visual Sans Variable` (+ `WFVisualSans-*Mono`) | wght 100–900 | Webflow's brand sans | geometric sans/mono F (s3) and the page's body/heading type (h1: weight 500, tracking −0.01em, line-height 1.04) |

The same idea runs through the live page: the hero H1 swaps single letters into Kreol italic — `You c<span class="u-font-kreol">a</span>n watch the web evolve — or you can sha<span class="u-font-kreol">p</span>e it` (`.u-font-kreol { font-family: Kreolstandard; font-style: italic; font-weight: 500 }`), and secondary labels are set in `u-font-mono` (WF Visual Sans Mono). So the wordmark treatment = **one word, every glyph a different voice: Didone italic + calligraphic swash + geometric monoline sans + bitmap serif**, cycling.

## 4. Colour and background; transition to the page

- Overlay: `background: var(--colors--background)`; glyph fill: `#w-mark, #letter-c…f { fill: var(--colors--text) }`. Strictly two-tone, no accent colour, no gradient.
- Token values: `--_color---neutral--black: #080808`, `--_color---neutral--white: white`, `--_color---neutral--gray-100: #f0f0f0`. Root default is *light* (white / #080808); `brand-color-modes.js` toggles `html.u-mode-dark` from `localStorage.darkMode` or `prefers-color-scheme: dark`, which flips to **#080808 background / white type**. The hero shader hard-codes `#080808` as its fallback background, so the dark presentation is the designed one: **near-black #080808 field, white "W CONF"**.
- Transition: logo scale 1 → 0.96 + fade (0.4 s, power2.in), then overlay opacity 1 → 0 (0.8 s, power2.inOut, 0.15 s later) revealing the hero already in place underneath; overlay then `display:none`. No curtain, no clip, no colour shift — the dark field simply dissolves into the dark hero.

## 5. Static-fetch limitations

None that matter. The overlay, SVG, all 16 alternate outlines, the GSAP timeline and its constants, the overlay CSS and the colour tokens are all in the static HTML/CSS (inline `<style>` block #6 and inline `<script>` #19). Only things not verifiable without a browser: the resolved colour mode for a given visitor, and the precise intermediate shapes MorphSVG produces (they depend on the plugin's point-matching). No third-party write-ups of this loader were found (searches for Codrops/Awwwards/Dribbble/X posts returned nothing specific); Mike Birkey's portfolio documents the 2023–2025 sites only. Findings are therefore first-hand from source.

## 6. Reproducing it for "John Flavan"

### Free typeface stand-ins (one per "voice")

| voice in the original | free options |
|---|---|
| High-contrast serif italic / Didone (Kreol, Neue Magnat) | **Instrument Serif** *Italic* (Google) — condensed, high contrast, closest single pick; **Bodoni Moda** Italic (Google, variable `opsz`) for the hairline Didone N/F; **Gambarino** or **Erode** Italic (Fontshare) |
| Calligraphic swash italic (s4 N, s1 C) | **Playfair Display** Italic (Google, has swash alternates via `font-feature-settings:"swsh"`) or **Cormorant** Italic (Google) |
| Geometric monoline sans (Zangezi Sans / WF Visual Sans) | **Instrument Sans** (Google, pairs with Instrument Serif); **Satoshi** or **General Sans** (Fontshare); **Sligoil** (Velvetyne) for a quirkier Zangezi-like tone |
| Bitmap / pixel (Argent Pixel CF) | **Handjet** (Google — variable pixel with `wght`, `ELSH`/`ELGR` axes, the most "designed" free pixel face); **Pixelify Sans** or **Jersey 25** (Google); **Silkscreen** for a coarser grid. No free pixel *serif* exists — pair a pixel sans O/N with serif neighbours and the contrast still lands. |

A three-font kit that covers it: **Instrument Serif Italic + Instrument Sans + Handjet** (all Google Fonts). Add Playfair Display Italic if you want a fourth, swashier set.

### Technique A — faithful: SVG outlines + GSAP MorphSVG (plugins are free since GSAP 3.13)

1. Build one SVG, `viewBox="0 0 W 410"`, with "JOHN FLAVAN" set once per font, converted to outlines (Figma/Illustrator "outline stroke/convert to paths", or `opentype.js` `font.getPath(char, x, baseline, 410)` in a build script). Normalise every variant to the same cap-height (410 units) and the same per-letter advance so a letter's four variants share a footprint; allow italics to overhang.
2. Markup: `<defs>` holding `<path id="j-s1">…<path id="j-s4">` etc.; visible `<path id="letter-j" d="{s1}">` per letter; two `<g>`s (one per word) each wrapped in a `clipPath` whose `<rect>` is `transform="rotate(∓5 cx cy)"`.
3. Timeline (copy the site's constants):

```js
gsap.registerPlugin(MorphSVGPlugin);
const letters = [...document.querySelectorAll('[id^="letter-"]')];
const step = (tl, s, pos) => letters.forEach((el, i) =>
  tl.to(el, { morphSVG: `#${el.id.slice(7)}-s${s}`, duration: .35, ease: 'expo.inOut' },
        i ? '<+=0.06' : pos));                       // for 10 letters consider stagger .03–.04

const master = gsap.timeline({ delay: .4 });
gsap.set('#word1', { y: 180 });  gsap.set('#word2', { y: -180 });
gsap.set('#clip1', { attr: { y: 1200 } });  gsap.set('#clip2', { attr: { y: -1500 } });
master.to('#clip1', { attr: { y: -300 }, duration: .5, ease: 'power3.out' }, 0)
      .to('#word1', { y: 0, duration: .7, ease: 'power2.out' }, 0)
      .to('#clip2', { attr: { y: -300 }, duration: .5, ease: 'power3.out' }, 0)
      .to('#word2', { y: 0, duration: .7, ease: 'power2.out' }, 0);

const loop = gsap.timeline({ repeat: -1 });
step(loop, 2, .3); step(loop, 3, '+=.25'); step(loop, 4, '+=.25'); step(loop, 1, '+=.25');
master.add(loop, 0);

gsap.delayedCall(3.5, () => {
  gsap.to('.loader-logo', { scale: .96, opacity: 0, duration: .4, ease: 'power2.in' });
  gsap.to('#loader-overlay', { opacity: 0, duration: .8, delay: .15, ease: 'power2.inOut',
    onComplete: () => { loop.kill(); master.kill(); overlay.style.display = 'none';
                        document.body.style.overflow = ''; sessionStorage.setItem('loader-shown', '1'); } });
});
```

Gate it with `sessionStorage` exactly as the site does, honour `prefers-reduced-motion` (skip the loop, keep the reveal or none), and keep the overlay `position:fixed; inset:0; background: var(--bg); z-index:9999` with glyph `fill: var(--fg)`. For the two-word mark, treat "JOHN" as the rising word and "FLAVAN" as the falling one — the same up/down + ∓5° shear the site uses for W vs CONF. For a persistent header wordmark, reuse the nav variant: rest at s1, run the loop on `mouseenter`, `expo.out` back to s1 on `mouseleave`.

### Technique B — live text, no plugin (cheaper, ~80 % of the effect)

Set each letter in its own `<span>` with a CSS custom property for font, and cycle fonts with a staggered CSS animation — font-family cannot interpolate, so this gives the *ransom flicker* without the tween:

```css
.wm span { animation: swap 3.2s steps(1) infinite; animation-delay: calc(var(--i) * 60ms); }
@keyframes swap { 0%,24%{font-family:"Instrument Serif";font-style:italic}
                  25%,49%{font-family:"Instrument Sans"} 50%,74%{font-family:Handjet}
                  75%,100%{font-family:"Playfair Display";font-style:italic} }
```

Give each letter a fixed-width `inline-grid` cell (`min-width` measured from the widest variant) so the word doesn't reflow, and use GSAP only for the masked reveal (`clip-path: polygon(...)` on each word, `y` ±180px) and the dismiss. Middle ground: pre-render each letter's four fonts as stacked spans and crossfade/`clip-path` between them with a 0.35 s `expo.inOut` tween — smoother than `steps()`, still no outline data needed.

---

## Sources

- Page HTML: https://webflow.com/webflowconf (fetched 2026-09-10; inline `<style>` block #6 = overlay CSS, inline `<script>` #19 = loader timeline, #16 = nav/footer hover morph, #22 = countdown strip that waits for the loader)
- Site stylesheet: https://cdn.prod.website-files.com/691cae015684992d4cd5edac/css/webflowconf-2026.webflow.shared.e24a8f25a.css (`@font-face` blocks, `.u-font-kreol`, colour tokens)
- Typekit kit: https://use.typekit.net/neh4xwu.css (`argent-pixel-cf`, italic 400)
- Colour-mode script: https://cdn.jsdelivr.net/gh/webflow/brand_studio@599350b/global-brand-code/brand-color-modes.js
- GSAP 3.15.0 + MorphSVGPlugin: https://cdn.prod.website-files.com/gsap/3.15.0/MorphSVGPlugin.min.js
- Font files referenced by the CSS: `KreolStandard-MediumItalic.otf`, `NeueMagnatStandard-MediumItalic.otf`, `ZangeziSans09-Text.woff2`, `Paragraf-LightItalic.woff2`, `Paragraf-Medium.woff2`, `WFVisualSans[wght,opsz].woff2`, `WFVisualSans-*Mono.woff2`
- Argent Pixel CF — https://connary.com/fonts/argent-pixel/ and https://fonts.adobe.com/fonts/argent-pixel-cf
- Neue Magnat (René Bieder) — https://fontsinuse.com/typefaces/232481/neue-magnat-display ; Kreol (René Bieder) — https://befonts.com/kreol-font-family.html
- Zangezi Sans (Daria Petrova) — https://typographica.org/typeface-reviews/zangezi-sans/
- Paragraf (Typeji) — https://contemporarytype.com/fonts/paragraf
- Mike Birkey, Webflow Conf sites 2023–2025 (no 2026/loader detail) — https://www.mikebirkey.com/project/webflow-conf
- Rendered glyph-style sheet (from the page's own path data): `./webflowconf-loader-styles.png`
