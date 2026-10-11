# NutriCare-360 — frontend

React 19 + Vite single-page app. See the [root README](../README.md) for the full project.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on http://localhost:5173, proxying `/api` to `http://localhost:5000` (override with `API_PROXY=...`) |
| `npm run build` | Production build into `dist/` (each page is its own chunk) |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint |
| `npm test` | Vitest |
| `python scripts/optimize_images.py` | Rebuild WebP images, favicons, app icons and the share image from `image-sources/` |

## Layout

```
src/
├── pages/          One component per route, lazy-loaded
├── components/
│   ├── ai/         Assistant drawer, daily brief, meal analyzer, routine builder
│   ├── charts/     Calorie ring, macro bars, 7-day bars (plain SVG)
│   ├── layout/     App shell, sidebar, top bar, auth layout
│   ├── ui/         Logo, modal, toast, empty state, responsive images
│   └── yoga/       Pose detail view
├── context/        Auth, theme, flash messages, assistant
├── hooks/          useApi, useAiStatus
├── lib/format.js   Dates, numbers, macro targets, pose image paths
└── styles/         index.css (design tokens + app), landing.css
```

## Conventions

- **Styling:** CSS custom properties in `src/styles/index.css` (`:root` for light, `.dark-theme` for dark). Sizes are in `rem`; the root is 110% on screens 1200px and wider.
- **Images:** never put full-size files in `public/`. Add originals to `image-sources/` and run the optimizer; render them with `ResponsiveImg` so phones download the small variant.
- **AI surfaces:** check `useAiStatus()` and show the "not configured" state when the backend has no `GROQ_API_KEY`.
