# Addis Tours

A responsive Addis Ababa tour-guide site for **Addis Tours with The Addis Guide**. Its copy is based on the public profile at [@the_addisguide](https://www.instagram.com/the_addisguide/) and focuses on city tours, Ethiopian food and coffee, history and culture, and private day trips. The supplied logo, local Addis photography, and locally bundled, attributed Instagram reel clips bring the page to life.

## Run locally

```bash
npm install
npm run dev
```

Open the Vite URL shown in the terminal.

## Build

```bash
npm run build
```

## Project structure

- `index.html` — document metadata and React mount point
- `src/main.jsx` — React entry point
- `src/App.jsx` — page interactions, scroll reveals, and viewport-aware video playback
- `src/page.html` — page content
- `src/styles.css` — responsive visual system
- `public/assets/` — Addis photos, reel clips, and the supplied Addis Guide logo

The experience filters, tour-detail dialog, mobile navigation, trip-interest checklist, and copyable planning note run locally in the browser. Full-screen story scenes reveal their copy as they enter view and use scroll-linked video parallax; background reels load near the viewport, pause offscreen, and stay disabled when reduced motion is requested. Tour planning and contact links open Instagram; no booking or payment service is connected.
