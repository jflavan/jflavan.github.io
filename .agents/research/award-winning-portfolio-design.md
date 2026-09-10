# What makes award-winning personal / small-studio sites win (2024–2026), and what makes a site look AI-generated

Research date: 2026-09-10. Sources are primary where possible: Awwwards site pages (scores, tags, palettes), Codrops case studies written by the site authors, the winning sites' own served CSS (typeface names were pulled from `@font-face` rules), gsap.com, caniuse, and the essays cited. Where a claim is my own inference rather than a sourced one it is marked **(inference)**.

## Summary

- Winners are overwhelmingly **near-black or off-white two-colour systems plus one loud accent** (`#0D0D0D`/`#FFFFFF`, `#121212`/`#fff`, `#101010`/`#F7F7F7`, `#0a0a0a`/`#fafafa`, `#111111`+`#EB4330`, `#000`+`#FFE32E`, `#FFFFFF`+`#FFFF02`, `#10120F`+`#C2CABB`). Nobody uses a purple-blue gradient; nobody uses pure `#000` on a body except Yakushev/Contassot.
- Typography is **a neutral grotesque for everything, paired with either a display serif or a mono for contrast**: PP Neue Montreal (×2), Helvetica Now Display, Suisse, Aeonik, Neue Haas Grotesk, Indivisible; serifs PP Editorial Old, Apparel; monos JetBrains Mono (×2), Roobert Mono, IBM Plex Mono. Inter does appear (Contassot, Louis Paquet), so Inter alone is not the tell — the composition is.
- Layout ideas that won: infinite-scroll home + horizontal-scroll archive (Gradogna), offset/asymmetric grids with "generous empty space" (Vitasović), 12-column editorial grid with full-screen "six-row" sections (Klaassens), independent-scrolling multi-column project grid (Bondar), a spiral gallery that morphs to a list (Pertant), and a text-only manifesto page (Rauno).
- Signature motion is **one memorable "motion motif" per site**, not many: character-to-word assembly (Vitasović), clip-mask reveals (Gradogna, Klaassens, Contassot), Bayer-matrix dithering on hover (Bondar), 3D card flips on scroll (Bodak), scroll-velocity distortion, ScrambleText nav, 78,400-particle face (Phantom).
- Motion numbers used by winners cluster tightly: micro-interactions 0.2–0.5 s `power2.out`; hero/page reveals 0.8–1.3 s `power3.inOut` / custom cubic-bezier(0.77,0,0.175,1); character stagger 0.02–0.03 s; item stagger 30–80 ms.
- The AI/template tells named by multiple independent authors: Inter/system font, indigo→purple gradient, centred hero + three rounded feature cards with thin line icons, `border-radius: .5rem` on everything, shadows at 0.1 opacity, "Build faster. Ship smarter." copy, glassmorphism with neon glow, bounce on every hover. Awwwards' own "Copy Dennis" collection shows the *Awwwards template look* (Snellenberg clone: preloader counter, Lenis, magnetic buttons, giant name) is also a recognised cliché.
- GSAP (core + every formerly-paid plugin: SplitText, ScrollTrigger, ScrollSmoother, MorphSVG, Flip…) has been 100% free including commercial use since 3.13 (April 2025). Lenis is MIT. CSS scroll-driven animations are in Chrome 115+/Safari 26+/Firefox 158+ (87% global); View Transitions same-document in Chrome 111+/Safari 18+/Firefox 144+, cross-document in Chrome 126+/Safari 18.2+ (no Firefox).

---

## 1. Specific award-winning sites, 2024–2026

Awwwards judges on **Design 40% / Usability 30% / Creativity 20% / Content 10%** ([awwwards.com/about-evaluation](https://www.awwwards.com/about-evaluation/)). "Palette" below is the two-colour palette Awwwards lists on the site page; typefaces were read from each site's served CSS unless noted.

| # | Site | Award | Type system | Colour | Layout idea | Signature interaction |
|---|------|-------|-------------|--------|-------------|-----------------------|
| 1 | **Gianluca Gradogna — Portfolio '25** · [gianlucagradogna.com](https://gianlucagradogna.com/) | Awwwards SOTD 23 Jan 2025 + Developer Award ([page](https://www.awwwards.com/sites/gianluca-gradogna-portfolio)) | PP Neue Montreal (grotesque) for design section; a self-hosted serif (`font-family: LZ`) for photography — the case study calls this "a clean, sans-serif font" vs "a refined, elegant typeface" ([Codrops](https://tympanus.net/codrops/2025/01/30/case-study-gianluca-gradogna-portfolio-25/)) | Dark: `#0D0D0D` / `#FFFFFF` | "Infinite scroll homepage" mixing design + photography; separate "dedicated horizontal scroll page" for travel photos | Everything reduced to three parameters: "Position, Opacity, and Clip Masks … when paired with the right easing and timing, can create transitions that feel incredibly smooth"; a custom smooth-scroll "that perfectly synchronizes all the looping animations". Nuxt + GSAP. |
| 2 | **Stefan Vitasović — Portfolio25** · [stefanvitasovic.dev](https://stefanvitasovic.dev/) | Awwwards Site of the Month + SOTD 20 Sep 2025 + Dev Award ([profile](https://www.awwwards.com/stefanvitasovic/)) | Helvetica Now Display Medium/Bold only (served `@font-face`) | Described as "raw and unpolished", Swiss-print inspired ([Codrops](https://tympanus.net/codrops/2025/03/05/case-study-stefan-vitasovic-portfolio-2025/)) | "Offset grid layouts with generous empty space", deliberately unbalanced compositions | "Words are divided into individual characters which then come together through motion" (`duration: 1.25 + index * 0.025`); page crossfades `0.5s easeQuadInOut`; WebGL video grid with shader displacement; infinite scroll on About. Next.js + Motion + R3F. Author's rule: build "motion motifs — repeating interactions or animations that catch the user's eye". |
| 3 | **Rauno Freiberg — Portfolio 2025** · [rauno.me](https://rauno.me) | Awwwards Honorable Mention 1 Sep 2025, 8.07/10 ([page](https://www.awwwards.com/sites/portfolio-2025)) | Self-hosted custom sans served under an obfuscated name (`font-family: X`, `dd.woff2`), JetBrains Mono for mono, Georgia for serif (site CSS variables `--fonts-body/--fonts-mono/--fonts-serif`) | Light: `#FFFFFF` / `#FFFF02` (one electric-yellow accent) | Text-first, almost no imagery; horizontal-scroll section; "minimap" navigation | Hero reveal, horizontal scroll, copy-email "Copied" state; manifesto copy: "Make it fast. Make it beautiful. Make it consistent. Make it carefully. Make it timeless. Make it soulful. Make it." |
| 4 | **Elliott Mangham** · [elliott.mangham.dev](https://elliott.mangham.dev) | Awwwards SOTD 2 Dec 2025 + Dev Award ([page](https://www.awwwards.com/sites/elliott-mangham)) | Neue Montreal Medium + Roobert Mono (served `@font-face`), Hanken Grotesk fallback | Dark: `#121212` / `#fff` | Single page; hero with headshot + credentials accordion; project grid; scroll progress markers 0–100% | Preloader; "Scroll-to-Reveal Content"; video walkthrough modal; keyboard navigation ("RETURN KEY [ENTER] ↵"). GSAP + Lenis + Vite. |
| 5 | **Maël Ruffini — Portfolio 2025** · [maelruffini.com](https://www.maelruffini.com) | Awwwards HM 20 Feb 2025 ([page](https://www.awwwards.com/sites/mael-ruffini-portfolio-2025)) | PP Editorial Old Ultralight (hairline display serif) | Light: `#FFFFFF` / `#000000` | Tagged "Magazine/Newspaper", infinite scroll | Three.js scene + image transitions on scroll; scroll-driven page transitions |
| 6 | **Olha Lazarieva** · [olhalazarieva.com](https://www.olhalazarieva.com/) | Awwwards SOTD 2 Oct 2025 + Dev Award ([page](https://www.awwwards.com/sites/olha-lazarieva)) | Not extractable (client-rendered); tagged Typography | Dark: `#101010` / `#F7F7F7` | Gallery portfolio with About, Services, 404, Thank-you pages | Tagged Animation, 3D; React + GSAP. Description: "An elegant, minimal system that translates ideas into visual solutions". |
| 7 | **Max Milkin** · [maxmilkin.com](https://www.maxmilkin.com/) | Awwwards SOTD 13 Dec 2025 + Dev Award 7.7 ([page](https://www.awwwards.com/sites/max-milkin-portfolio)) | Client-rendered; tagged Typography | `#C2CABB` (sage) / `#10120F` — the one non-monochrome palette in the set | "Performance-first developer portfolio" | Parallax + 3D (Three.js, Blender); "Minimal, fast, and fluid — where motion serves meaning". |
| 8 | **Artiom Yakushev** · [art-yakushev.com](https://www.art-yakushev.com/) | Awwwards SOTD 27 Dec 2025 ([page](https://www.awwwards.com/sites/artiom-yakushev)) | Suisse (grotesque) + Apparel (serif) — served CSS `font-family: Suisse` / `Apparel, Times New Roman` | `#000000` | Graphic-design portfolio, parallax, filters/effects | Built on Webflow with GSAP 3.15 core + ScrollTrigger + SplitText + ScrambleText loaded from cdnjs, Lenis 1.2.3 from a CDN — i.e. a "static site" stack. |
| 9 | **Pacôme Pertant** (built by Louis Bocquet & Colin Demouge) · [pacomepertant.com](https://pacomepertant.com/) | Awwwards SOTD 9 Jun 2026 + Dev Award ([page](https://www.awwwards.com/sites/pacome-pertant-portfolio)) | Indivisible (variable sans), self-hosted | Dark: `#0a0a0a` / `#fafafa` | "Spiral view gallery" with "spiral-to-list transitions" | Mouse-trail, loading animation, menu animation, video player, "footer scroll transitions". GSAP + Three.js + Nuxt. |
| 10 | **Stas Bondar '25** · [stabondar.com](https://www.stabondar.com/) | Awwwards SOTD 14 Feb 2025 ([page](https://www.awwwards.com/sites/stas-bondar-25)); GSAP Site of the Week/Month ([Codrops](https://tympanus.net/codrops/2025/03/25/stas-bondar-25-the-code-techniques-behind-a-next-level-portfolio/)) | Not named in article | `#EB4330` / `#111111` | 5-col desktop / 3-col tablet / 1-col mobile grid where "each column scrolls independently" | Ordered (Bayer-matrix) dithering on the reel and images; Matter.js physics text; 3D cube driven by scroll+mouse (`gsap.quickTo`, 0.4 s); project transitions with GSAP Flip 1.3 s `power3.inOut`; char stagger 0.02; scroll-velocity thumbnail distortion. Astro + GSAP (SplitText, ScrollTrigger, Draggable, Flip) + Three.js + Barba. |
| 11 | **Eduard Bodak** · [eduardbodak.com](https://www.eduardbodak.com/) | Awwwards SOTD 14 Jun 2025 + Dev Award ([page](https://www.awwwards.com/sites/eduard-bodak-portfolio)) | Not named | `#FFE32E` / `#000000` (yellow + black, tagged Retro) | Sticky-container sections; circular "card wheel" | Card flip on scroll, pixel transition, mouse follower, minimap progress, copy-mail-to-clipboard; `elastic.out(1,0.75)`, mouse-track 0.5 s `power2.out`, stagger `index*0.012` ([Codrops](https://tympanus.net/codrops/2025/07/29/built-to-move-a-closer-look-at-the-animations-behind-eduard-bodaks-portfolio/)). GSAP + Locomotive Scroll v5 + Swup. |
| 12 | **Gabriel Contassot — 2024** · [gabrielcontassot.com](https://gabrielcontassot.com) | Awwwards SOTD 14 Apr 2024 + Dev Award ([page](https://www.awwwards.com/sites/gabriel-contassot)) | Inter (served `font-family: Inter, Avenir, Helvetica…`) — proof Inter isn't disqualifying | `#000` home → "brighter case studies" | Two-page loop: gallery ↔ project | "Striking, colorful transitions when navigating from the dark-themed homepage to the brighter case studies" done with a full-screen WebGL quad tweening hex→vec3 colours; GSAP ScrambleText on nav; `clip-path: inset()` image reveals synced to scroll; preloader percentage counter over 2.8 s ([Codrops](https://tympanus.net/codrops/2024/04/24/case-study-gabriel-contassots-portfolio-2024/)). Astro + Taxi + GSAP + Lenis + twgl. |
| 13 | **Rogier de Boevé — 2024** · [rogierdeboeve.com](https://rogierdeboeve.com/) | Awwwards Annual 2024 nominee (Site of the Year, Developer Site of the Year, Independent) per [annuals.awwwards.com](https://annuals.awwwards.com/site-nominees/rogier-de-boeve-portfolio); 12× SOTD career | JetBrains Mono + Neue Haas Grotesk ([Codrops](https://tympanus.net/codrops/2024/07/26/case-study-rogier-de-boeve-portfolio-2024/)) | Dark "dystopian sci-fi" (Blade Runner 2049 / Dune references) | "The layout is deliberately sparse, allowing the main visual to shine" | Grid of transparent cubes with randomized alpha; rotating screens on a circular path; parallax via offset projection. Astro + Three.js + GSAP + Lenis + Tailwind. |
| 14 | **Ravi Klaassens — R—K '26** · [raviklaassens.com](https://www.raviklaassens.com/) | Awwwards, FWA and CSSDA Site of the Day per the author's [Codrops write-up](https://tympanus.net/codrops/2026/04/07/r-k-26-the-thinking-and-code-behind-a-portfolio-led-by-presence/) (Apr 2026) | Not named | Not named | 12-column grid with "six-row thinking for full-screen sections"; "homepage stays clear… project pages lean into presentation… insight pages feel more editorial" | SVG clip-path even-odd cutout preloader that "begins as a small square in the centre, expands into a wider rectangle, and then settles into a full-screen opening" (0.3 s / 1.1 s / 0.8 s); clip-path page transitions 0.22 s + 0.76 s; menu 0.7 s open / 0.55 s close; opt-in hover/click sounds via `data-sound-*`. Webflow + GSAP + Barba + Unicorn Studio + Howler. |
| 15 | **Bruno Simon — 2025 portfolio** · [bruno-simon.com](https://bruno-simon.com) | Awwwards SOTD 21 Jan 2026, 8.11/10, Site of the Month Jan 2026 ([page](https://www.awwwards.com/sites/brunos-portfolio)); FWA ([case](https://thefwa.com/cases/bruno-simon-portfolio)) | Amatic SC + Nunito from Google Fonts | Full 3D scene | Drivable 3D world instead of pages | Three.js WebGL world with spatialised audio; the outlier that proves "creativity 20%" can carry a site. |

Small studios (same jury, same patterns):

- **Lusion v3** · [lusion.co](https://lusion.co/) — Awwwards SOTD 2 Oct 2023 (8.25, animations 10/10) and Site of the Year 2024 ([page](https://www.awwwards.com/sites/lusion-v3), [SOTY 2024](https://www.awwwards.com/annual-awards-2024/site-of-the-year-users-choice)). Aeonik + IBM Plex Mono + a custom "LusionMono"; palette `#1a2ffb` / `#f0f1fa`; "reactive cursor interaction".
- **Phantom.land** · [phantom.land](https://www.phantom.land/) — Awwwards SOTD Jun 2025. Interactive draggable grid with "subtle ambient floating effect", drag-to-zoom-out, 3D face of 78,400 particles; grid transitions 1 s `power2.out`, face transitions 1.6 s ([Codrops](https://tympanus.net/codrops/2025/06/30/invisible-forces-the-making-of-phantom-lands-interactive-grid-and-3d-face-particle-system/)).
- **Independent of the Year**: 2024 Jesper Landberg — jury: "The first thing you notice is the consistency. The second is the wide spectrum of on-point websites and techniques" ([awwwards.com/annual-awards-2024/independent-of-the-year](https://www.awwwards.com/annual-awards-2024/independent-of-the-year)); 2025 Louis Paquet ([awwwards.com/annual-awards-2025/independent-of-the-year](https://www.awwwards.com/annual-awards-2025/independent-of-the-year)). Paquet's own site serves Inter + Unbounded from Google Fonts.

Other 2025–26 portfolio winners on the Awwwards portfolio-winners list, for further study: Lama Lama (SOTM Jun 2026), Podium (SOTD May 2026), Adcker (Apr 2026), MERSI (Mar 2026), Gavin Schneider Productions (Feb 2026) — [awwwards.com/websites/winner_category_portfolio](https://www.awwwards.com/websites/winner_category_portfolio/).

Note on Godly: godly.website now 301-redirects to recent.design (verified 2026-09-10); it is a JS-rendered gallery with no per-site notes, so it was not used as a source.

---

## 2. Recurring craft patterns across winners

**Colour.** 10 of the 14 personal sites are dark, but every dark one uses an *off*-black (`#0a0a0a`, `#0D0D0D`, `#101010`, `#111111`, `#121212`, `#10120F`) rather than `#000`, paired with an off-white (`#F7F7F7`, `#fafafa`) and at most one accent. Accents are saturated primaries used flat, never as gradients: yellow `#FFFF02` (Rauno), yellow `#FFE32E` (Bodak), red `#EB4330` (Bondar), blue `#1a2ffb` (Lusion), sage `#C2CABB` (Milkin). Source: palette chips on each Awwwards page linked above.

**Typefaces.** Body/UI is a neutral grotesque in nearly every case (PP Neue Montreal ×2, Helvetica Now Display, Suisse, Neue Haas Grotesk, Aeonik, Indivisible, Inter ×2). Contrast comes from a second voice, either a display serif (PP Editorial Old Ultralight, Apparel, Gradogna's `LZ` serif) or a mono (JetBrains Mono ×2, Roobert Mono, IBM Plex Mono, LusionMono). No winner uses more than two families plus a fallback. Rogier de Boevé pairs JetBrains Mono for labels with Neue Haas Grotesk for text ([Codrops](https://tympanus.net/codrops/2024/07/26/case-study-rogier-de-boeve-portfolio-2024/)). Awwwards' own trend piece frames the direction as "Serifs ARE BACK" and "texts adopt compositions more similar to an editorial design" ([awwwards.com](https://www.awwwards.com/typography-is-the-new-black-trends-in-web-design.html)).

**Type scale.** Winners set display type very large and body very small with little in between; the intermediate "h3/h4" sizes of a SaaS scale are mostly absent **(inference from the sites)**. For implementation, the fluid `clamp()` approach documented by Utopia (Gilyead & Mudford): "Instead of tightening our grip by loading up on breakpoints, we can let go, embracing the ebb and flow with a more fluid and systematic approach" ([utopia.fyi](https://utopia.fyi/)).

**Grid.** Editorial 12-column with intentional offsets: Klaassens uses "a 12-column grid system with six-row thinking for full-screen sections"; Vitasović uses "offset grid layouts with generous empty space" and asymmetric compositions "which adds dynamics to the visual presentation"; Bondar's home is a 5/3/1-column grid where each column scrolls at its own speed; Gradogna uses a horizontal-scroll page for one content type. Whitespace is treated as a feature (Vitasović, de Boevé "deliberately sparse", Rauno text-only).

**Motion principles (numbers from the authors).**

| Purpose | Duration | Easing | Source |
|---|---|---|---|
| Cursor / hover follower | 0.2 s | `power2.out` | Bondar |
| Mouse-tracked tilt | 0.5 s | `power2.out` | Bodak |
| Grid/tile transitions | 1 s | `power2.out` | Phantom |
| Page/project transition | 1.3 s | `power3.inOut` | Bondar |
| Page crossfade | 0.5 s | `easeQuadInOut` | Vitasović |
| Clip-path page transition | 0.22 s + 0.76 s | — | Klaassens |
| Preloader phases | 0.3 / 1.1 / 0.8 s | "parallax easing" | Klaassens |
| Preloader counter | 2.8 s total | interval shortening | Contassot |
| Character reveal | 1.25 s + `index*0.025` | — | Vitasović |
| Character stagger | 0.02 s | — | Bondar |
| Line stagger | 0.1 s | — | Bondar |
| Elastic return | 1.5 s | `elastic.out(1,0.75)` | Bodak |
| Clip-path reveal (generic) | 1 s | `cubic-bezier(0.77, 0, 0.175, 1)` | [Emil Kowalski](https://emilkowal.ski/ui/the-magic-of-clip-path) |

Kowalski's published standards (the bar his review tooling enforces): entry/exit → ease-out `cubic-bezier(0.23, 1, 0.32, 1)`; on-screen movement → `cubic-bezier(0.77, 0, 0.175, 1)`; "Never `ease-in` on UI"; "UI animations stay under 300ms"; stagger "30–80ms between items. Longer delays feel slow"; "Only animate `transform` and `opacity`"; use `@starting-style` for JS-free entry; "Reduced motion means fewer and gentler animations, not zero" ([STANDARDS.md](https://raw.githubusercontent.com/emilkowalski/skills/main/skills/review-animations/STANDARDS.md)). Rauno Freiberg's interaction essay adds: don't animate high-frequency actions ("When so commonly executed, the interaction novelty is also diminished"), and model gestures on "properties from the real world, like interruptibility" ([rauno.me/craft/interaction-design](https://rauno.me/craft/interaction-design)).

**Scroll-triggered vs scroll-scrubbed.** Text and card reveals are *triggered* once (SplitText + ScrollTrigger) while 3D, parallax and dithering are *scrubbed* continuously with scroll position/velocity (Bondar's cube and velocity distortion, Bodak's card wheel `-65deg` over scroll, Vitasović's WebGL video grid). Gradogna's team restricted themselves to position, opacity and clip masks and got the "smooth" feel from timing rather than effect count.

**Page-load / intro sequences.** Almost universal but short and purposeful: percentage preloader (Contassot), "Loading + Hero Animation" (Bondar), clip-path square-to-fullscreen cutout (Klaassens), "Loading transition" (Gradogna), preloader (Mangham), "loading animations" (Pertant). Vitasović ties the hero into "dynamic fade effects with content animation" instead of a separate loader.

**Cursor.** Custom cursor is common but small: "Reactive cursor" (Lusion), "Mouse Follower" (Bodak), "mouse trail interactions" (Pertant), an awards-badge cursor at 0.2 s (Bondar), eyes that follow the cursor (Fujita, [Codrops](https://tympanus.net/codrops/2025/09/30/abstract-feelings-concrete-forms-daiki-fujita-portfolio-2025/)). Rauno uses none.

**Footer.** Footers get a set piece: "footer scroll transitions" (Pertant), a "footer sword animation" 0.4 s / 0.34 s (Klaassens), a button that clones itself on mouse movement, capped at 200 copies (Benoffi, [Codrops](https://tympanus.net/codrops/2025/10/15/from-blank-canvas-to-mayhem-eloy-benoffis-brutalist-glitchy-portfolio-built-with-webflow-and-gsap/)), copy-email-to-clipboard with a "Copied" state (Rauno, Bodak).

**Content.** Winners state availability and price openly: Mangham lists "£25–60K development; £50–120K design+dev" and "Available September 2026"; Rauno lists a manifesto; Bodak shipped "without any Projects yet. The Site should speak for itself". Content is only 10% of the Awwwards score, but every winner has a strong one-line positioning statement.

---

## 3. The "looks like AI / template" tells to avoid

Independent authors converge on the same list. Cited verbatim where possible:

1. **Inter / Roboto / system-ui as the only typeface.** "The fastest way to spot an AI-designed website in 2026 is the font and the gradient… the Inter typeface" — Yusuf, 925 Studios ([ai-slop-design-tells](https://www.925studios.co/blog/ai-slop-design-tells)); "Inter or Roboto font (never anything with personality)" — prg.sh ([Why Your AI Keeps Building the Same Purple Gradient Website](https://prg.sh/ramblings/Why-Your-AI-Keeps-Building-the-Same-Purple-Gradient-Website), Oct 2025). Anthropic's own frontend-design plugin lists "generic system fonts" as what to avoid ([claude.com/plugins/frontend-design](https://claude.com/plugins/frontend-design)).
2. **Indigo→purple gradient.** "the single loudest AI tell in 2026" (925 Studios). Origin traced by Alan West to Tailwind UI's `bg-indigo-500` default and Adam Wathan's August 2025 tweet apologising for it ([dev.to](https://dev.to/alanwest/why-every-ai-built-website-looks-the-same-blame-tailwinds-indigo-500-3h2p)); "predictable purple gradients" (Anthropic plugin).
3. **Centred hero + CTA, then three rounded cards with a thin line icon each.** "Three rounded cards in a row … soft shadow, thin-line icon at the top of each" (925); "Hero section with centered text and a CTA button… Three features in boxes below, each with an icon" (prg.sh); "Three-column feature grid with icons" (West); "Six identical cards in a row, each with an icon, a heading, and two lines of text" — Eduardo Calvo, SmoothUI ([ai-design-slop](https://smoothui.dev/blog/ai-design-slop), Jun 2026).
4. **Rounded-everything and identical soft shadows.** "Rounded corners on everything (border-radius: 0.5rem)… Subtle box shadows at low opacity" (West); "Subtle shadows (exactly 0.1 opacity)" (prg.sh).
5. **Glassmorphism with neon glow, purple-to-cyan gradients.** "The purple-to-cyan gradient. Glassmorphism with a neon glow." (Calvo).
6. **Gradient text in the hero; purple CTA buttons** (West).
7. **Bounce on every hover; missing focus states; WCAG-failing contrast** (Calvo).
8. **Weightless headline copy**: "Build faster. Ship smarter." (925).
9. **Missing hierarchy and pairing**: no "visual hierarchy beyond 'bigger text = header'", no "Typography pairings (mixing serif and sans-serif with intention)" (prg.sh).
10. **The Awwwards-template look.** Awwwards itself gave an Honorable Mention (Dec 2022) to Dennis Snellenberg's "Copy Dennis — Collection", "a tribute to all the creators who have taken a little bit too much inspiration from the portfolio website of © Dennis Snellenberg" ([awwwards.com/sites/copy-dennis-collection](https://www.awwwards.com/sites/copy-dennis-collection)) — i.e. the preloader-counter + smooth-scroll + magnetic-button + giant-name formula is a recognised cliché by the jury's own community. Templates now advertise themselves as "looks like an Awwwards site" ([Medium](https://medium.com/@a18355692523/i-made-a-free-portfolio-template-that-looks-like-an-awwwards-site-heres-why-7b77520a24ef)).

Not found in a citable source, but consistent with the above **(inference)**: aurora/mesh-gradient backgrounds, film grain layered over gradients, tag pills for skills, icon-in-circle rows, and word-by-word fade-up reveals on every paragraph. Winners do use character/word splits (Vitasović, Bondar, Yakushev via SplitText) but once, as the site's motif, not on every heading.

What the same authors say to do instead: "Specify a color palette by hex codes… Pick a font explicitly… Describe the layout you want" (West); "thoughtful typography with unexpected font pairings", "spatial composition with asymmetry and grid-breaking elements", "orchestrated motion and scroll-triggered interactions" (Anthropic plugin). All of which is exactly what section 2 shows the winners doing.

---

## 4. Free / open-licence typefaces that winners use or that read as premium

Licences: Google Fonts = SIL OFL; Collletttivo and Velvetyne = SIL OFL (Collletttivo: "All typefaces are distributed under the SIL Open Font License, with credit required" — [collletttivo.it/typefaces](https://www.collletttivo.it/typefaces); Velvetyne: "SIL Open Font License, Version 1.1" on each font page); Fontshare = ITF Free Font License (free for personal and commercial use, no resale/redistribution — the API reports `license_type: itf_ffl` for General Sans; Fontshare is run by Indian Type Foundry, "all of the fonts on Fontshare are owned by ITF" per [Web Designer Depot](https://webdesignerdepot.com/itf-launches-free-font-service-fontshare/); licence text at [fontshare.com/licenses/itf-ffl](https://www.fontshare.com/licenses/itf-ffl)).

| Typeface | Class | Source | Why |
|---|---|---|---|
| **JetBrains Mono** | mono | [Google Fonts](https://fonts.google.com/specimen/JetBrains+Mono) (OFL) | Used on rauno.me (Awwwards HM 2025) and rogierdeboeve.com (Annual 2024 nominee) as the label/mono voice. |
| **IBM Plex Mono** | mono | [Google Fonts](https://fonts.google.com/specimen/IBM+Plex+Mono) (OFL) | Used on lusion.co (Site of the Year 2024). |
| **Geist / Geist Mono** | grotesque + mono | [Google Fonts](https://fonts.google.com/specimen/Geist), [Geist Mono](https://fonts.google.com/specimen/Geist+Mono) (OFL, by Vercel) | On Awwwards' 2025 free-font list ([awwwards.com/best-free-fonts](https://www.awwwards.com/best-free-fonts.html)). |
| **Instrument Serif** | display serif (condensed, high contrast) | [Google Fonts](https://fonts.google.com/specimen/Instrument+Serif) (OFL; Rodrigo Fuenzalida, dir. Jordan Egstad, 2023) | The free stand-in for PP Editorial Old / Apparel; 15 uses logged on Fonts In Use including portfolio sites ([fontsinuse](https://fontsinuse.com/typefaces/219915/instrument-serif)). |
| **Fraunces** | display serif (variable, "wonky" axis) | [Google Fonts](https://fonts.google.com/specimen/Fraunces) (OFL) | Optical-size + soft axes make it work at 8rem and 1rem. |
| **Newsreader** | text/display serif with optical sizes | [Google Fonts](https://fonts.google.com/specimen/Newsreader) (OFL) | Editorial serif for long-form case studies. |
| **Messapia** | display serif | [Collletttivo](https://www.collletttivo.it/typefaces) (OFL; Luca Marsano) | Sharp editorial display serif. |
| **Apfel Grotezk** | grotesque | [Collletttivo](https://www.collletttivo.it/typefaces/apfel-grotezk) (OFL; Luigi Gorlero, 2019, 5 styles) | Closest free analogue to Neue Montreal / Suisse. |
| **Absans** | grotesque | [Collletttivo](https://www.collletttivo.it/typefaces) (OFL; Valerio Monopoli) | On Awwwards' 2025 free-font list. |
| **Satoshi / General Sans / Cabinet Grotesk** | grotesques (variable) | [Fontshare](https://www.fontshare.com/fonts/satoshi), [General Sans](https://www.fontshare.com/fonts/general-sans), [Cabinet Grotesk](https://www.fontshare.com/fonts/cabinet-grotesk) (ITF FFL) | All three on Awwwards' 2025 free-font list; General Sans verified via Fontshare API (14 styles, Frode Helland). |
| **Clash Display** | display grotesque | [Fontshare](https://www.fontshare.com/fonts/clash-display) (ITF FFL) | Awwwards' list; wide display sans for oversized headlines. |
| **Bricolage Grotesque** | grotesque (variable, optical size) | [Google Fonts](https://fonts.google.com/specimen/Bricolage+Grotesque) (OFL) | Has real personality at display size, unlike Inter. |
| **Space Grotesk** | grotesque | [Google Fonts](https://fonts.google.com/specimen/Space+Grotesk) (OFL) | Mono-derived grotesque; pairs with Space Mono. |
| **Hanken Grotesk** | grotesque | [Google Fonts](https://fonts.google.com/specimen/Hanken+Grotesk) (OFL) | Present as the fallback on elliott.mangham.dev (SOTD Dec 2025). |
| **Le Murmure** | condensed display sans | [Velvetyne](https://velvetyne.fr/fonts/le-murmure/) (OFL; Jérémy Landes) | "combines effectiveness, legibility and singularity" — for one-word hero statements. |
| **Necto Mono** | mono | [Collletttivo](https://www.collletttivo.it/typefaces) (OFL; Marco Condello) | Unusual mono for labels. |

Pangram Pangram fonts (Neue Montreal, Editorial Old) seen on winners are trial/paid and are excluded here.

---

## 5. Technical approaches for a static site without a framework

**GSAP — free for everything since 3.13.** gsap.com/pricing: "GSAP is now 100% free for all users, thanks to Webflow's support" ([gsap.com/pricing](https://gsap.com/pricing/)). Release post: "GSAP is now 100% FREE including ALL of the bonus plugins like SplitText, MorphSVG, and all the others that were exclusively available to Club GSAP members… the entire GSAP toolset is FREE, even for commercial use!"; SplitText was rewritten "50% smaller, 14 new features" and can run "without loading GSAP's core" ([gsap.com/blog/3-13](https://gsap.com/blog/3-13/)). Installation docs: "GSAP and all the plugins are now freely available on npm" ([gsap.com/docs/v3/Installation](https://gsap.com/docs/v3/Installation/)). Webflow acquired GreenSock in Oct 2024 and made it free in April 2025 ([webflow.com/blog/gsap-becomes-free](https://webflow.com/blog/gsap-becomes-free)). CDN in the wild: art-yakushev.com (SOTD Dec 2025) loads `gsap/3.15.0/gsap.min.js`, `ScrollTrigger.min.js`, `SplitText.min.js`, `ScrambleTextPlugin.min.js` from cdnjs.cloudflare.com — a copy-able pattern for a GitHub Pages site.

**Lenis smooth scroll.** MIT, v1.3.26, `<script src="https://unpkg.com/lenis@1.3.26/dist/lenis.min.js">` + its CSS ([github.com/darkroomengineering/lenis](https://github.com/darkroomengineering/lenis)). Used by Contassot, de Boevé, Mangham, Yakushev, Armur, Giulio. Pair with `gsap.ticker` and ScrollTrigger as in the README; Bodak uses Locomotive Scroll v5 instead, Gradogna wrote a custom one to sync loops.

**CSS scroll-driven animations (`animation-timeline: scroll()` / `view()`).** No JS, runs off-main-thread. Support: Chrome 115+, Edge 115+, Safari 26+, Firefox 158+, 87.22% global ([caniuse](https://caniuse.com/mdn-css_properties_animation-timeline)); MDN shows the `@supports not (scroll-timeline: --x)` fallback pattern ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_scroll-driven_animations)). Good for progress bars, parallax and view-triggered reveals; keep GSAP for anything scrubbed by velocity or needing pin/snapping.

**View Transitions.** Same-document `document.startViewTransition()`: Chrome 111+, Edge 111+, Safari 18+, Firefox 144+, 91.75% global ([caniuse](https://caniuse.com/view-transitions)). Cross-document (multi-page static sites): opt in with `@view-transition { navigation: auto; }`; Chrome 126+, Safari 18.2+, Firefox not supported; both pages must be same-origin, main frame only ([developer.chrome.com](https://developer.chrome.com/docs/web-platform/view-transitions/cross-document), [MDN](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API)). This replaces Barba/Taxi/Swup for page-to-page morphs on a plain HTML site, with `view-transition-name` on the shared project image.

**Clip-path reveals without a library.** `clip-path: inset(0 0 100% 0)` → `inset(0 0 0 0)`, 1 s, `cubic-bezier(0.77, 0, 0.175, 1)`, triggered with IntersectionObserver `rootMargin: -100px`; "hardware-accelerated", no layout shift ([Emil Kowalski](https://emilkowal.ski/ui/the-magic-of-clip-path)). Also `@starting-style` for entry animations and WAAPI `element.animate()` for interruptible JS animation (Kowalski STANDARDS).

**Canvas / WebGL.** Every 3D winner uses Three.js (Ruffini, Milkin, Pertant, Bondar, de Boevé, Bruno Simon, Phantom, Giulio) or a thin WebGL helper (Contassot: twgl full-screen quad for colour tweens). For a static site the cheapest high-impact shader effects seen: Bondar's Bayer-matrix ordered dithering on images/video, Contassot's colour-lerp quad, Vitasović's displacement on a video grid. Three.js is MIT and on cdnjs/jsdelivr; keep it to one canvas and one effect.

**Fluid type.** `clamp()`-based scales per Utopia ([utopia.fyi](https://utopia.fyi/)).

**Reduced motion / hover gating.** `@media (prefers-reduced-motion: reduce)` keeping opacity/colour and dropping transforms; `@media (hover: hover) and (pointer: fine)` around hover effects (Kowalski STANDARDS). Awwwards' Developer Award scores Accessibility and WPO separately (e.g. Lazarieva WPO 7.80, Accessibility 7.00), so these count.

---

## Sources

Award pages
- https://www.awwwards.com/about-evaluation/
- https://www.awwwards.com/websites/winner_category_portfolio/
- https://www.awwwards.com/sites/gianluca-gradogna-portfolio
- https://www.awwwards.com/stefanvitasovic/
- https://www.awwwards.com/sites/portfolio-2025 (Rauno Freiberg)
- https://www.awwwards.com/sites/elliott-mangham
- https://www.awwwards.com/sites/mael-ruffini-portfolio-2025
- https://www.awwwards.com/sites/olha-lazarieva
- https://www.awwwards.com/sites/max-milkin-portfolio
- https://www.awwwards.com/sites/artiom-yakushev
- https://www.awwwards.com/sites/pacome-pertant-portfolio
- https://www.awwwards.com/sites/stas-bondar-25
- https://www.awwwards.com/sites/eduard-bodak-portfolio
- https://www.awwwards.com/sites/gabriel-contassot
- https://www.awwwards.com/sites/brunos-portfolio
- https://www.awwwards.com/sites/lusion-v3
- https://www.awwwards.com/sites/jesper-landberg-2
- https://www.awwwards.com/sites/copy-dennis-collection
- https://www.awwwards.com/annual-awards-2024/independent-of-the-year
- https://www.awwwards.com/annual-awards-2025/independent-of-the-year
- https://www.awwwards.com/annual-awards-2024/site-of-the-year-users-choice
- https://annuals.awwwards.com/site-nominees/rogier-de-boeve-portfolio
- https://thefwa.com/cases/bruno-simon-portfolio
- https://www.cssdesignawards.com/blog/2025-website-of-the-year-winners/430/

Author case studies (Codrops)
- https://tympanus.net/codrops/2025/01/30/case-study-gianluca-gradogna-portfolio-25/
- https://tympanus.net/codrops/2025/03/05/case-study-stefan-vitasovic-portfolio-2025/
- https://tympanus.net/codrops/2024/04/24/case-study-gabriel-contassots-portfolio-2024/
- https://tympanus.net/codrops/2024/07/26/case-study-rogier-de-boeve-portfolio-2024/
- https://tympanus.net/codrops/2025/03/25/stas-bondar-25-the-code-techniques-behind-a-next-level-portfolio/
- https://tympanus.net/codrops/2025/07/29/built-to-move-a-closer-look-at-the-animations-behind-eduard-bodaks-portfolio/
- https://tympanus.net/codrops/2026/04/07/r-k-26-the-thinking-and-code-behind-a-portfolio-led-by-presence/
- https://tympanus.net/codrops/2025/06/30/invisible-forces-the-making-of-phantom-lands-interactive-grid-and-3d-face-particle-system/
- https://tympanus.net/codrops/2025/09/30/abstract-feelings-concrete-forms-daiki-fujita-portfolio-2025/
- https://tympanus.net/codrops/2025/10/15/from-blank-canvas-to-mayhem-eloy-benoffis-brutalist-glitchy-portfolio-built-with-webflow-and-gsap/
- https://tympanus.net/codrops/2026/04/14/they-call-me-giulio-the-making-of-a-cinematic-cyberpunk-portfolio/
- https://tympanus.net/codrops/2025/12/29/2025-a-very-special-year-in-review/

Winning sites (CSS inspected 2026-09-10)
- https://gianlucagradogna.com/ · https://stefanvitasovic.dev/ · https://rauno.me · https://elliott.mangham.dev · https://www.maelruffini.com · https://www.art-yakushev.com/ · https://pacomepertant.com/ · https://gabrielcontassot.com · https://lusion.co/ · https://bruno-simon.com · https://louispaquet.com

Motion principles
- https://raw.githubusercontent.com/emilkowalski/skills/main/skills/review-animations/STANDARDS.md
- https://emilkowal.ski/ui/the-magic-of-clip-path
- https://rauno.me/craft/interaction-design
- https://utopia.fyi/

AI / template tells
- https://www.925studios.co/blog/ai-slop-design-tells
- https://dev.to/alanwest/why-every-ai-built-website-looks-the-same-blame-tailwinds-indigo-500-3h2p
- https://prg.sh/ramblings/Why-Your-AI-Keeps-Building-the-Same-Purple-Gradient-Website
- https://smoothui.dev/blog/ai-design-slop
- https://claude.com/plugins/frontend-design
- https://medium.com/@a18355692523/i-made-a-free-portfolio-template-that-looks-like-an-awwwards-site-heres-why-7b77520a24ef

Typefaces
- https://www.awwwards.com/best-free-fonts.html
- https://www.awwwards.com/typography-is-the-new-black-trends-in-web-design.html
- https://www.collletttivo.it/typefaces · https://www.collletttivo.it/typefaces/apfel-grotezk
- https://velvetyne.fr/about/ · https://velvetyne.fr/fonts/le-murmure/
- https://www.fontshare.com/licenses/itf-ffl · https://webdesignerdepot.com/itf-launches-free-font-service-fontshare/
- https://fonts.google.com/specimen/Instrument+Serif · https://fontsinuse.com/typefaces/219915/instrument-serif
- https://fonts.google.com/specimen/JetBrains+Mono · https://fonts.google.com/specimen/IBM+Plex+Mono · https://fonts.google.com/specimen/Geist · https://fonts.google.com/specimen/Fraunces · https://fonts.google.com/specimen/Newsreader · https://fonts.google.com/specimen/Bricolage+Grotesque · https://fonts.google.com/specimen/Space+Grotesk · https://fonts.google.com/specimen/Hanken+Grotesk

Tech
- https://gsap.com/pricing/ · https://gsap.com/blog/3-13/ · https://gsap.com/docs/v3/Installation/ · https://webflow.com/blog/gsap-becomes-free
- https://github.com/darkroomengineering/lenis
- https://caniuse.com/mdn-css_properties_animation-timeline · https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_scroll-driven_animations
- https://caniuse.com/view-transitions · https://developer.chrome.com/docs/web-platform/view-transitions/cross-document · https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API
