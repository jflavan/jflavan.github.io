# Reference-site teardown: Flot Noir (flotnoir.studio) and RXK Studio (rxkstudio.com)

Researched 2026-09-10 by fetching the live HTML, every linked stylesheet and JS bundle, and the award/press pages. All values below are read from served code unless marked "observed/inferred".

## 0. Scope corrections and what was blocked

- **flotnoir.studio is a holding page, not the award-winning site.** The URL serves a Nuxt 2 static build from 2023-01-04 (`/_nuxt/static/1672875720/`) whose entire DOM is three lines — "Flot Noir TM / Studio / Coming Soon" — over a full-screen WebGL canvas. It is still worth studying: the canvas is a complete OGL fluid-simulation that distorts a grayscale video with the cursor (section 1.4).
- Flot Noir's other properties, all fetched and read:
  - `flot-noir.studio` is a 335-byte `<meta http-equiv="refresh">` to **photo.flotnoir.studio** — a WordPress 7.1 + Semplice 6 photography portfolio.
  - `clmt.flotnoir.studio` — Clément Merouani's personal portfolio (Three.js + GSAP 2 + barba.js + locomotive-scroll, webpack build).
  - Flot Noir's awards are for **client sites** (RISK, Julien Calot, MERSI, Ousmane Dembélé Ballon d'Or, House of Corto, Jessica Mille Architecte — all Awwwards SOTD; MERSI also FWA FOTD, CSSDA WOTD, GSAP Site of the Week). The Codrops MERSI article is the only first-party process write-up and is summarised in 1.6.
- **rxkstudio.com is the real thing**: Awwwards SOTD 30 May 2024 (7.49), FWA, CSSDA SOTD 20 May 2024. Nuxt 3 SSR on Netlify; design Gilles Tossoukpé, code Michaël Garcia.
- **Blocked / empty fetches** (client-rendered, returned only a `<title>`): `thefwa.com/cases/rxk-studio`, `thefwa.com/profiles/flot-noir`, `dribbble.com/shots/24098216-RXK-Studio`. LinkedIn posts were not fetched. No technical breakdown of RXK exists anywhere I could find; everything in section 2 is read from the bundles.

---

## 1. Flot Noir

### 1.1 Typography

**flotnoir.studio (holding page)** — one family, one weight:
```css
@font-face{font-family:"Neue Haas Unica Pro";src:url(/fonts/NeueHaasUnicaPro-Bold.woff2) format("woff2"),url(/fonts/NeueHaasUnicaPro-Bold.woff) format("woff");font-weight:700}
span{font-size:14px;line-height:.95;font-weight:700;letter-spacing:-.04em;text-transform:uppercase}
sup{font-size:6px;top:1px;right:-10px}
```
Tiny, tight, uppercase, bold grotesk; the "TM" is a 6px superscript. No serif, italic or mono. Everything is 14px — the drama is the canvas, not type scale.

**photo.flotnoir.studio (Semplice)** — five self-hosted display faces plus Inter variable (theme default), all `font-weight:400` declarations:
- `cinderblock-125` (woff/ttf/eot, 2022) — used for `#content-holder h1`, the overlay menu and the marquee.
- `PPNeueMachina-Bold` (woff, 2022).
- `NeueMachina-Ultrabold` (otf, 2023) — nav items, `h2`, the custom-cursor label.
- `Cinderblock-150` (otf, 2024), `Respira-Black` (ttf, 2024).
- Sizes: `#content-holder h1 {font-size:25rem; line-height:18.33rem; letter-spacing:0}`; hero fluid text `font-size:clamp(2.78rem, 33.6vw, 47.78rem); line-height:54%; margin-bottom:calc(33.6vw*0.54)`; marquee `font-size:35vw; line-height:1.1`. Nav/labels are uppercase (MOTORS / COMMERCIAL / EVENTS / CONTACT). Body text (panel labels) 0.72–1.78rem, `#999`/`#aaa` secondary.
- Pattern: a single wordmark set at ~1/3 of viewport width with line-height around 0.54 (glyphs overlapping the line box), everything else small.

**clmt.flotnoir.studio** — three families: `Ekster` 400/700 (otf), `Roxborough` (CF) 300/300 italic/500/700 serif (otf), `Wrangler` 300 (woff2). Logo is serif `Roxborough 28px` with `mix-blend-mode:difference`. Project titles run to `35–44vw` with `letter-spacing:-10px` to `-30px`; labels are 8px with `letter-spacing:10px` (spaced-caps micro labels). Italic serif is used inside display headings (`.t-head h2 .italic`). This is the one Flot Noir property with a serif/italic/grotesk mix.

### 1.2 Colour

- Holding page: `body{background:#000;color:#fff}`; `.video-container:before{background:rgba(0,0,0,.2)}`; `canvas{filter:grayscale(1)}`. Pure black/white, video desaturated and dimmed 20%.
- photo.flotnoir.studio: black/white; panels `#f5f5f5`; secondary `#999`, `#aaa`. Nav and contact links use `mix-blend-mode:exclusion; filter:invert(1)` so they invert over any image. Custom cursor dot `#ffffff` with `mix-blend-mode:exclusion`.
- clmt: `body{background:#0f0f0f;color:#fff}`, header `mix-blend-mode:difference`, logos `mix-blend-mode:multiply; opacity:.5`.
- Client work (Awwwards palettes): MERSI `#EDE7DE` / `#1A1A1A`; Jessica Mille `#000` / `#fff`. Flot Noir's house palette is monochrome with one warm off-white when they need warmth.

### 1.3 Layout

- Holding page: `.container` is a 100vw×100vh flex column, centred, `pointer-events:none`, `z-index:99`; each line is wrapped in `.o-hidden{overflow:hidden;padding:0 24px}`; the canvas is `position:fixed; inset:0; z-index:1`. `body{overflow:hidden}` — there is no scroll at all. Name top-centre-of-viewport, positioning statement is literally "Studio / Coming Soon".
- photo.flotnoir.studio: three full-screen Semplice sections in order — (1) `data-height="fullscreen"` background video `Flot-Noir-Highlights_Light.mp4` with no controls; (2) fullscreen section with the `33.6vw` "FLOT NOIR STUDIO" wordmark bottom-aligned (`data-valign="bottom"`) in white; (3) fullscreen `<iframe>` embedding a Netlify app (`joyful-sunshine-c0812e.netlify.app`) — the interactive piece is a separate build dropped into the CMS. Nav is a split text nav (two links left, logo centre, two right) fixed, `cover-transparent`. Container max-width 1600px, 4.44rem side padding ≥1170px, 15px gutters. PhotoSwipe lightbox for galleries.
- clmt: horizontal locomotive-scroll project rail, `.next-project` panels that rise from `bottom:-50vh` to `-15vh` on hover.

### 1.4 Motion (holding page — read from `/_nuxt/ba4865c.js`)

**Intro (CSS only, no GSAP):**
```css
.o-hidden span{transform:translateY(100%);animation:slide .75s cubic-bezier(.165,.84,.44,1) .5s forwards}
.o-hidden:nth-child(2) span{animation-delay:.6s}
.o-hidden:nth-child(3) span{animation-delay:.7s}
@keyframes slide{0%{transform:translateY(100%)}to{transform:translateY(0)}}
```
Three masked line reveals, 0.75s easeOutQuart (`.165,.84,.44,1`), 100ms stagger starting at 0.5s. Total intro ≈1.45s.

**WebGL (OGL, not Three):** `new Renderer({dpr:2})`, `Camera({fov:45})` at z=1, a `Plane` 2×1.13 textured with a `<video>` (`/_nuxt/videos/flot-noir.eff441f.mp4`, `loop muted playsInline crossOrigin`, `texture.needsUpdate` each frame once `readyState>=HAVE_ENOUGH_DATA`). The plane's fragment shader adds a fake key light: `shading = dot(normal, normalize(vec3(0.5,1.0,-0.3))) * 0.15; gl_FragColor.rgb = tex + shading`.

A `Post` pass runs a full **Navier–Stokes fluid simulation** (the Pavel Dobryakov / OGL "post-fluid-distortion" recipe — splat, curl, vorticity, divergence, pressure Jacobi, gradient subtract, advection with manual bilerp). Constants as shipped:
```
simRes L=128, dyeRes A=512, pressure iterations B=6,
densityDissipation V=.95, velocityDissipation P=.95, pressureDissipation M=.1,
curlStrength=50, splat radius N=.5 (→ uniform radius = N/100 = 0.005), dt=.016
mousemove/touchmove → splats.push({x, y:1-y, dx:5*Δx, dy:-5*Δy})
```
Final composite: `vec2 uv = vUv - fluid.rg * 0.0002; gl_FragColor = texture2D(tMap, uv);` — a very small displacement (0.0002 per unit of velocity), so the video "swims" under the cursor rather than smearing. Half-float RG16F/R16F targets when available, `OES_texture_half_float_linear` fallback to NEAREST. The canvas is then `filter:grayscale(1)` in CSS and dimmed by the 20% black overlay.

No custom cursor, no scroll, no sound, no page transitions, no GSAP (the only tween library is the CSS keyframe). Google Tag Manager only.

**photo.flotnoir.studio:** Semplice's stock behaviours — `marquee 13s infinite linear` on a 35vw cinderblock line; custom cursor (10px white dot, exclusion blend, grows to show "View"/arrows/zoom/drag icons); `.thumb-inner{transition:box-shadow .3s ease}`; `.apg-thumb-animation{transition:opacity .25s ease-out}`; right-click and text-selection disabled by the WP "Content Copy Protection" plugin; `static_transitions:"disabled"`, `frontend_mode:"dynamic"` (AJAX page loads). No WebGL of its own — the interactive section is the embedded iframe.

**clmt.flotnoir.studio:** Three.js scene with GLSL (46 `gl_FragColor` hits), GSAP 2 (`TweenMax/TweenLite`, `Expo` ×22, `SplitText`, `Draggable`), barba.js page transitions, locomotive-scroll. Readable eases: text-mask `transform 1s cubic-bezier(.22,.61,.36,1)`; next-project reveal `all .5s cubic-bezier(.6,0,.4,1)` (hover `.75s`); link underline `scaleX(0→1)` from `transform-origin:right`, `.5s cubic-bezier(.22,.61,.36,1)`; gallery images start `clip-path:inset(100% 0 0 0)`; heading lines `.o-hidden div{transform:translateY(200px)}` into a 160px line box.

### 1.5 Why it feels stunning (first five seconds)

- Holding page: the eye lands on a black frame; at 0.5s three tiny white lines slide up in 100ms steps; the moment the cursor moves, the whole grayscale film underneath bends like water. The contrast is *scale*: a 14px label vs a full-viewport, live, physically-simulated image. Restraint (one weight, one size, one colour) makes the fluid effect read as expensive rather than gimmicky. There is nothing to scroll, so nothing competes.
- photo site: 33.6vw wordmark with 54% line-height sitting on the bottom edge of a full-bleed film; inverted nav floating over it; a cursor that turns into a word. The motif is *the wordmark as an object* — one giant setting of the name, repeated as a 35vw marquee.
- Across the estate: monochrome + one font weight + a single physical effect per page.

### 1.6 Flot Noir's process (Codrops, MERSI, July 2026 — client site, not the studio site)

- Stack: Webflow CMS + custom vanilla JS layer bundled with Vite, GSAP (ScrollTrigger, SplitText, Flip), Lenis, Taxi.js page transitions, Splide, Netlify.
- Concept: "somewhere between an architectural book and an interactive digital experience"; "restraint, contrast, materiality and editorial rhythm"; "premium, but not cold. Minimal, but not empty."
- Techniques with numbers: split-screen slider using `clip-path: inset(X% 0 0 0)` on the left column and `inset(0 0 X% 0)` on the right, both driven by the same progress; cover-flip page transition — a right-side curtain wipes up, the clicked image is cloned and `Flip.fit()`-ed into its target over **1.2s expo.inOut**; horizontal case-study track pinned with a `gsap.to()` on x; grid re-layout via `Flip.getState()` → move DOM → animate **2s expo.inOut, 0.05s stagger** (reverse **1.2s power4.inOut**); infinite home slider that silently repositions scroll near the edges.

---

## 2. RXK Studio (rxkstudio.com)

Stack read from HTML/bundles: Nuxt 3 (SSR, `_payload.json`, prerendered 2026-06), GSAP **3.12.2** + ScrollTrigger (Flip imported), **Lenis 1.0.34**, moment-timezone (for the clock), Netlify image CDN (`/.netlify/images?fm=webp`), project videos on Cloudflare R2. No WebGL, no canvas, no sound, no custom cursor, no third-party tracking in the bundles.

### 2.1 Typography

One family, two weights, self-hosted:
```css
@font-face{font-family:NeueMontreal;font-weight:500;src:url(/_nuxt/NeueMontreal-Medium.17887962.woff2)…}
@font-face{font-family:NeueMontreal;font-weight:700;src:url(/_nuxt/NeueMontreal-Bold.3d638920.woff2)…}
body{font:500 normal clamp(16px,1.11vw,21px)/normal NeueMontreal}
.t-h1{font:700 normal clamp(10px,8.33vw,160px)/.8 NeueMontreal;text-align:center;text-transform:uppercase}   /* 8vw under 500px */
.t-h2{font:700 normal clamp(25px,5.83vw,300px)/.8 NeueMontreal;text-align:center;text-transform:uppercase}
.t-big-text{font:500 normal clamp(16px,1.52vw,300px)/normal NeueMontreal}
.homepage-fiche h2{font:700 normal clamp(30px,2.8vw,300px)/normal;text-transform:uppercase;margin:-.24em 0 .4em}
.homepage-fiche .flex{font:700 normal clamp(10px,.7vw,300px)/normal;text-transform:uppercase}   /* project meta */
.homepage-grid .index{font:500 normal clamp(12px,.85vw,15px)/normal}                             /* "01" indices */
.homepage-sentence1 .sentence{font-size:24vh;line-height:.8}                                     /* full-screen kinetic words */
h1,h2,h3{font:inherit}
```
- Display: 8.33vw bold uppercase at **line-height 0.8**, lines clipped with `clip-path:polygon(0 3%,0 99%,100% 99%,100% 3%)` so the tight leading never shows descender overlap.
- Letter-spacing is never set (0 everywhere). No italics, no serif, no mono. Uppercase for display and for the small project-meta labels; sentence case for body.
- Scale ladder is vw-locked: 8.33vw / 5.83vw / 2.8vw / 1.52vw / 1.11vw / .85vw / .7vw — roughly a ×1.4–2 step each time.
- Buttons are two stacked copies of the label (`.translate > span + span`, second absolutely positioned at `bottom:100%`) for the rolling hover.

### 2.2 Colour

```css
:root{--color-noir:#171717;--color-blanc:#f4f3ed;--color-blanc-forced:#f4f3ed}
body{background:var(--color-blanc);color:var(--color-noir)}
body.neg{background:var(--color-noir);color:var(--color-blanc)}        /* inverted mode */
.colorBis:root{--color-blanc:#d4eae0}                                     /* mint variant */
.big-kinetic:root{--color-blanc:#2d2d2d}                                  /* full-screen kinetic mode */
.big-kinetic.colorBis:root{--color-blanc-forced:#d4eae0}
```
Light by default: warm off-white `#f4f3ed` on near-black `#171717` (Awwwards lists exactly these two). There is no accent; the "accent" is the **mode switch**: clicking the giant footer logo cycles `n=(n+1)%4` — toggles `html.colorBis` every click and `body.neg` on clicks 1 and 3 — so the site steps cream → mint-dark → mint → cream-dark. Kinetic shapes alternate `--color-blanc`/`--color-noir` with `transition:background 1s`, so they recolour smoothly when the mode flips. Project overlays (`.fiche`) are always dark (`.neg2` inverts when the page is already dark). Rules: `2px solid` borders in the current foreground colour.

### 2.3 Layout

- Grid: 12 columns, `--grid-gutter:20px; --grid-margin:20px`, both become `1.4vw` at ≥1440px; `--grid-column-width` computed in CSS. `.grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr))}`.
- Header: `position:absolute; top:calc(gutter - .2em)`, flex space-between: "RXK Studio" left, live **Paris clock** right (`<span class="heure"></span> GMT+1`, moment-tz `Europe/Paris` `HH:mm`, first update aligned to the next minute via `gsap.delayedCall(60-ss)`, then `setInterval 60s`).
- Hero (`.homepage-hero{min-height:100vh;display:flex;align-items:center}`): a 4-line centred statement at 8.33vw — "RXK© is / the digital studio / of french designer / Gilles Tossoukpe". Below it a 12-col row: `.col1{grid-column:2/span 2}` positioning paragraph ("Constantly striving to create exceptional experience…"); a "Scroll" rolling button absolutely positioned at column 1; `.col2{grid-column:7/span 4}` holds two lists side by side (services; clients: ESPN, North Kingdom, MediaMonks…); `.col3/.col4{grid-column:span 2}` awards tally (4 FWA, 7 Awwwards, 2 CSSDA, 8 Siteinspire). On ≤1024px the hero also shows a dark kinetic block (`aspect-ratio:1280/892; max-width:400px; margin:70px auto`).
- Work ("Selected Work"): `.grid-spe` with six `.ligne` rows, each `border-top:2px solid; padding-block:.7vw; display:flex`. Cells are `width:25%; aspect-ratio:1280/892` and are **offset per row** (`ligne1 .cell:last-child{margin-left:50%}`, `ligne2 .cell{margin-left:25%}`, `ligne3` 50%, `ligne4/5/6` 25%) — a scattered editorial rhythm rather than a uniform grid. Each cell: `.index` "01" and `.t-h3` title placed *outside* the image to its right (`padding-left:calc(100% + gutter)`, index top, title bottom). Two of the cells are kinetic-shape buttons interleaved between projects (Lowlyland, Bruce Mau Design, Benjamin Righetti, Vendredi Society, Field Day Sound).
- Project view is not a page: clicking a cell opens `.homepage-fiche` (fixed, `z-index:3`, dark) containing five pre-rendered `.fiche` panels. Left column `6 cols` is an infinite media stack (5 media, duplicated to 10, `row-gap:2×gutter`, `aspect-ratio:1280/892`); right column `5 cols` has `h2` title, then `Info / Role / Awards / Dev` in a `.flex` row of narrow columns, then a bottom bar with **Visit** and **Next**. `history.replaceState('/slug')` and `document.title` update; `/bruce-mau-design/` is SSR'd as the same homepage so it is crawlable. Escape closes, ArrowRight/ArrowDown advances.
- Footer: `.say{border-top:2px solid;padding-block:8vw}` with a `t-h2` statement ("Over 15 years of experience in the design industry crafting websites and design work for clients of all sizes."), then `.data` row: "Romainville (neuf-trois/Paris)", Twitter/Instagram/LinkedIn/Savee/Email rolling links, "Coded by Michaël Garcia", then a full-width 1400×512 SVG wordmark as a `<button>` (the colour-mode toggle).
- Mobile: `.grid` becomes a column with `row-gap:70px`; fiche media stack turns into a horizontal `scroll-snap-type:x mandatory` rail; kinetic sections hidden/replaced.

### 2.4 Motion (all values from `AppFooter.2e0ea797.js`, `HomepageKinetic2.1a6283e5.js`, and the CSS)

**Intro / preloader.** There is no preloader screen. Everything that should appear later carries `.laststag{opacity:0}`. On mount:
```js
gsap.set(".homepage-hero .word",{opacity:1,delay:1,stagger:.16,onComplete:()=>gsap.set(".laststag",{opacity:1,delay:.16})})
```
i.e. after a 1s hold the 11 hero words **hard-cut on one at a time every 160ms** (a `set`, not a tween — no fade, no ease), then header, kinetic block and grid pop in 160ms after the last word. Total ≈2.9s. The abruptness is the point: it reads like a typesetter placing words.

**Scroll (Lenis 1.0.34, defaults: `lerp:.1`, `smoothWheel:true`, `easing:1-2^(-10t)`, `duration:1`; disabled on touch and in-app browsers, `ScrollTrigger` fed by `lenis.on('scroll')`, velocity exported as `delta`).**
- Hero lines: each `.ligne-child` tweens `y:"100%"` with `scrub:true`, `start:"top top+=<its own offset>"`, `end:"top top"` — lines slide *down out of their clip-path* as you scroll away, so the headline dissolves line by line instead of just moving.
- Footer statement: each word is doubled (`.word-above`/`.word-under`, under starts `translateY(-100%)`); on scroll `.word-above → y:100%` and `.word-under → y:0%`, `ease:"power1.inOut"`, `scrub:1`, `start:"bottom bottom"`, `end:"top 55%"` — a scrubbed *rolling replacement* of each word inside a 3%–99% clip.
- Work images: two-layer curtain. `.media-child` starts `translateY(-100%)` and the grayscale `img.grey` inside it starts `translateY(100%)`; both tween to `y:0`, `ease:"power4.inOut"`, `duration:1`, `scrollTrigger:{start:"top 90%"}` — the container slides down while the image slides up, so the picture appears to unroll in place. Rows draw their `2px` top border on entry (`.drawLine`).
- Kinetic shapes are **velocity-driven**: a paused timeline moves two stacks of 5 SVG blobs by `yPercent:±4300`, `duration:4`, `ease:"power2.in"`, `stagger:{each:.8,repeat:-1}`; each tick `time += lenisVelocity/600 + deltaTime/2000 + wheelDelta/500` and the group rotates via `quickTo(rotation,{duration:1,ease:"power3"})` clamped to ±90°. A second variant scales concentric shapes `scale:1`, `duration:4`, `stagger:{each:.5,repeat:-1}` and flips `zIndex` with scroll direction. Ticker functions are added/removed with `onEnter/onLeave` so nothing runs off-screen.
- No pinning, no horizontal scroll, no image parallax, no sticky stacking — the whole scroll story is clipped-text choreography plus velocity-reactive shapes.

**Hover.**
- Rolling labels: on hover a class `on` runs `btnAnimation .55s infinite cubic-bezier(.16,.03,.08,1.55)` (`translateY(0→100%)`), pointer:fine only.
- Work cells (`pointer:fine`, ≥1025px): images are `filter:grayscale(1); transition:filter .4s` and go to colour on hover; simultaneously a `.hover` stack fades in and two extra copies of the image pre-scaled `.8` and `.6` (`.5` in JS) pop with `scale:"-=0.04"`, `stagger:.07`, `ease:"back.out(4)"`, `duration:.4`; leaving fades `.hover` out in `.2s`. A quick "stack of prints" feel.
- Fiche media column follows the wheel, not the cursor: `quickTo(".ficheN .yTo","y",{duration:1 (0.5 on touch),ease:"power4",modifiers:{y:gsap.utils.wrap(-half,0)}})` for an infinite loop, and `quickTo(".ficheN .left","scaleY",{duration:.6,ease:"power4"})` squashes the column with wheel velocity.

**Transitions / overlays.** Every reveal is a **CSS `mask-image` gradient wipe** tweened by GSAP:
```js
fromTo(el,{maskImage:"linear-gradient(180deg, transparent 100%, #000 125%, #000 225%, transparent 250%, transparent 250%)"},
          {maskImage:"linear-gradient(180deg, transparent -25%, #000 0%, #000 100%, transparent 125%, transparent 125%)",ease:"power4.inOut",duration:1})
```
Used for the project overlay (180deg), the next-project swap (90deg), and the kinetic full-screen "volet" (±90deg depending on which button). Opening a kinetic block also scales the button itself to fill the viewport (`scale = innerWidth/width` or `innerHeight/height`, `x` to centre, `duration:1`, `ease:"power4.inOut"`), the page scrolls to centre it (`power4.inOut`, 1s, `window.scrollTo` in `onUpdate`), `html.big-kinetic` recolours, and one of five word screens is chosen at random ("Have a break", "Hire us", "Name your layers", "^^ GM", "How-to make a mill"): 24vh words laid out with hand-tuned `padding` offsets (`.spe1…spe5`, e.g. `padding-left:2.3em`, `padding-left:50%`) whose spans **flicker** — `stagger:{each:1,repeat:-1,onRepeat(){autoAlpha:Math.round(Math.random())}}` — while the wheel keeps driving the shapes behind. Lenis is stopped (`lenis.stop()` / `body.hidden`) while any overlay is open; tabindex is swapped so focus stays inside.

**Easing vocabulary (counts in the footer bundle):** `power4` ×10, `power4.inOut` ×9, `power3` ×5, `power1.inOut` ×3, `power2.inOut` ×2, `back.out(4)` ×1, `expo` (Lenis). Durations: `1s` for structural moves, `.4–.6s` for hover, `4s` loops, `.16s` staggers, `.07s` micro-staggers.

### 2.5 Why it feels stunning (first five seconds)

0–1s: an empty cream page with only the 2px-thin clock in the corner. 1–2.8s: eleven bold words punch in one by one at 160ms — the eye reads the sentence *as it is typeset*, left to right, top to bottom, and the 0.8 line-height makes the block feel like a single carved object. 2.9s: the small paragraph, lists and the dark kinetic block appear together, giving the giant type a fine-print counterweight. First scroll: the headline drops out line by line while the blobs under it start churning in response to your wheel speed — the page is "alive to the hand" without a cursor effect. The site carries **one motif** — a bold word in a clipped box that rolls, drops, or flickers — applied to buttons, headline, footer, and the full-screen word screens. Density comes from the numbered work rows with their offset cells, each with its own colour-on-hover print stack. There is no texture, sound, or WebGL; the finish comes from a very small set of eases (`power4.inOut` for anything structural) and exact tuning of the 12-col grid and the vw type ladder.

---

## 3. Most transferable techniques for a single-page static personal site (vanilla + GSAP from cdnjs, WebGL allowed)

### From RXK
1. **Typeset-on-load intro** — `gsap.set(words,{opacity:1,delay:1,stagger:.16})` on `.word{opacity:0}` spans, then `set` the rest of the page in. Cheap, no preloader, no layout shift; pairs with an 8vw uppercase statement at `line-height:.8` inside `clip-path:polygon(0 3%,0 99%,100% 99%,100% 3%)`.
2. **Scrubbed word-roll** — double each word (`.word-above` / `.word-under` at `translateY(-100%)`) inside an `overflow:hidden` line and drive `y` with `ScrollTrigger{scrub:1,start:"bottom bottom",end:"top 55%"}`, `ease:"power1.inOut"`. Reuse the same markup for hover buttons via a CSS keyframe (`.55s cubic-bezier(.16,.03,.08,1.55)`).
3. **Two-layer image curtain + grayscale-to-colour hover** — wrapper `translateY(-100%)`, image `translateY(100%)`, both `→0` with `power4.inOut 1s` at `start:"top 90%"`; `filter:grayscale(1)` with `transition:filter .4s` on hover. Works with plain `<img>`.
4. **`mask-image` gradient wipes as the universal transition** — one GSAP `fromTo` on `maskImage` (`power4.inOut`, `1s`) for section reveals, an overlay contact card, or a colour-mode swap; plus a CSS-variable palette (`--noir/--blanc`) toggled by a class so the whole page can invert with `transition:background 1s`. Optional: a live local-time clock (`Intl.DateTimeFormat` instead of moment).

### From Flot Noir
1. **CSS-only masked line reveal** — `.o-hidden{overflow:hidden}` + `span{transform:translateY(100%);animation:slide .75s cubic-bezier(.165,.84,.44,1) .5s forwards}` with 100ms stagger. No JS, ~10 lines.
2. **OGL fluid displacement of a monochrome background** — the exact holding-page recipe: OGL `Renderer({dpr:2})`, a plane with a video (or a still/gradient) texture, the post-fluid pass with `simRes 128, dyeRes 512, iterations 6, dissipation .95, curl 50, radius .5`, composite `uv -= fluid.rg * 0.0002`, then `filter:grayscale(1)` and a 20% black overlay in CSS. OGL is ~30KB and on cdnjs/jsDelivr; the shaders are in `/_nuxt/ba4865c.js` verbatim.
3. **One giant wordmark, everything else tiny** — a name at 25–33vw with `line-height:.54–.8`, nav at ~14px uppercase `letter-spacing:-.04em`, and `mix-blend-mode:exclusion`/`difference` on fixed nav so it stays legible over any image. Contrast in *scale*, not in colour.
4. **Flip-based cover transition (from the MERSI write-up)** — clone the clicked thumbnail, `Flip.fit()` it into the destination over `1.2s expo.inOut` behind a curtain wipe; and `Flip.getState()` → re-order DOM → animate `2s expo.inOut, stagger .05` for a grid that re-flows between "compact" and "expanded" states. GSAP Flip is on cdnjs.

Shared lesson from both: one family (two weights max), a two-colour palette with a warm off-white, a 12-col grid with a vw-based gutter, and a single motion motif applied everywhere with `power4.inOut`/easeOutQuart at ~1s for structure and ~.4–.6s for hover.

---

## Sources

- https://www.flotnoir.studio/ (HTML, inline CSS; bundles `/_nuxt/cd8566f.js`, `ba4865c.js` (component + shaders), `e15bd3c.js`, `b75ee46.js` (OGL), `ed3f0d9.js` (Vue), `41adfd6.js` (Nuxt), `cd84906.js`, `/_nuxt/static/1672875720/payload.js`, `manifest.js`)
- https://www.flot-noir.studio/ (meta refresh → photo.flotnoir.studio)
- https://photo.flotnoir.studio/ (HTML, `semplice-webfonts-selfhosted`, `semplice-custom-css`, `1138-post-css`, `1138-motion-js`, `semplice` settings object)
- https://clmt.flotnoir.studio/ (HTML, `style.5b3bf391f5c515a23d0c.css`, `main.ac52f84939785b986299.js`, `vendor.753a83d879889b6317a4.js`)
- https://www.awwwards.com/flot-noir/ — profile, award list (RISK, Julien Calot, MERSI, Ousmane Dembélé, House of Corto, Jessica Mille SOTD; Rabanne, TIWIS, Aurora, Chris Macari HM)
- https://www.awwwards.com/sites/mersi — SOTD 10 Apr 2026, 7.52, GSAP/Webflow/Figma, palette #EDE7DE/#1A1A1A
- https://www.awwwards.com/sites/jessica-mille-architecte — SOTD 7 Feb 2024, 7.33, palette #000/#fff
- https://tympanus.net/codrops/2026/07/27/between-print-and-digital-the-making-of-mersis-website/ — Flot Noir process write-up
- https://thefwa.com/profiles/flot-noir — fetched, client-rendered, no content returned
- https://www.linkedin.com/in/clementmerouani/ , https://x.com/FlotNoir_Studio , https://www.behance.net/Flot-Noir-Photo (search results only)
- https://rxkstudio.com/ and https://rxkstudio.com/bruce-mau-design/ (HTML; `/_nuxt/AppFooter.e08d1413.css`, `HomepageKinetic2.7da365fb.css`, `entry.5472ee6a.js`, `default.55969d67.js`, `index.4db78ffb.js` (GSAP 3.12.2), `index.dabab55e.js`, `AppFooter.2e0ea797.js`, `HomepageKinetic2.1a6283e5.js` (Lenis 1.0.34), `/_payload.json`)
- https://www.awwwards.com/sites/rxk-studio — SOTD 30 May 2024, 7.49 (Design 7.52 / Usability 7.36 / Creativity 7.63 / Content 7.44; Dev 7.46), credits Gilles Tossoukpé + Michael Garcia, palette #F4F3ED/#171717, highlighted "Hover effect", "Project Page", "Kinetic scroll interaction"
- https://www.awwwards.com/GillesTossoukpe/ — 9 SOTD, 11 HM, Awwwards 2025 jury (search result)
- https://www.facebook.com/csswinners/posts/949168753883214 — CSSDA Site of the Day 20 May, RXK Studio (search result)
- https://thefwa.com/cases/rxk-studio — fetched, client-rendered, no content returned
- https://dribbble.com/shots/24098216-RXK-Studio — fetched, empty
- https://www.linkedin.com/posts/gylstroy_rxk-studio-the-fwa-activity-7197619679903776769-jb76 (search result: "developed by Michael Garcia with slick animations and patience")
