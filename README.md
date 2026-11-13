# Honestly Texas — Shopify theme

Custom Shopify theme for **Honestly Texas Rice** (`honestlytexasrice.myshopify.com`), built from the Figma file *Honestly Texas*, section **ETHAN REVIEW → Option 01 "Rooted in Nature"** (home, shop all, product, our story).

## How the layout works

- Every page is built on the 1440px Figma artboard. `src/theme.src.css` uses a `u` unit (e.g. `58u`) that compiles to `calc(58 * var(--u))`. `--u` is `1px` at 1440px+ and scales down proportionally to 750px, so desktop matches Figma pixel for pixel.
- Below 750px a stacked mobile layout takes over (same art direction).
- Edit `src/theme.src.css`, then run `python3 src/build.py` to regenerate `assets/theme.css`.

## Brand fonts

The design uses **Hamburg Hand** (display) and **BERMONT** (email field). They are licensed, so they are not in the repo yet.
Add them to `assets/` as `HamburgHand-Bold.woff2` and `Bermont-Black.woff2`, then tick **Theme settings → Brand → Brand fonts uploaded**. Until then, Unbounded is used as a scaled fallback.

## Sections

`o1-hero`, `o1-products` (single bags / multipacks), `o1-values`, `o1-recipes`, `o1-farmers`, `o1-feature`, `o1-socials`, `o1-story-hero`, `o1-people`, `o1-land`, plus `main-*` templates, header (overlay + badge), footer (band + yellow footer) and an AJAX cart drawer.

## Page templates

Assign in Shopify → Pages once the theme is published: About us → `story`, FAQ → `faq`, Contact → `contact`.
