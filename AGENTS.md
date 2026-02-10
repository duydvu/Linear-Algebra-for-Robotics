# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Interactive educational platform for learning linear algebra through robotics applications. Built as a static site with embedded interactive visualizations.

## Commands

```bash
npm run dev          # Start dev server at http://localhost:4321
npm run build        # Production build (static output)
npm run preview      # Preview production build
npm run test         # Run Vitest in watch mode
npm run test:ui      # Run tests with browser UI
npm run test:coverage # Run tests with v8 coverage report
```

Run a single test file: `npx vitest tests/math/vector.test.ts`

## Architecture

**Astro + React islands**: Astro handles static site generation and routing. React components are used only for interactive visualizations (p5.js, Three.js, Plotly) and are client-side hydrated within MDX lesson pages.

**Content pipeline**: MDX files in `src/pages/modules/` are the lesson pages. They combine Markdown prose with embedded React components. Math expressions use LaTeX syntax processed by remark-math/rehype-katex.

**Key layers:**
- `src/pages/modules/{01-05}/` — MDX lesson content, organized by module. Each module folder has an `index.astro` landing page and numbered `.mdx` lesson files.
- `src/components/interactive/` — React visualization components, organized by topic (`vectors/`, `matrices/`, `transformations/`, `robotics/`). These use wrapper components in `core/` (`Canvas2D.tsx` for p5.js, `Canvas3D.tsx` for Three.js, `Controls.tsx` for UI controls).
- `src/lib/math/` — Pure TypeScript math utilities (`vector.ts`, `matrix.ts`, `transforms.ts`). These are the core computation functions used by visualizations. Fully tested in `tests/math/`.
- `src/components/layout/` — Astro layout components (nav, footer, lesson navigation).
- `src/components/content/` — Astro content components (Callout, Example, MathBlock) used in MDX.

**Styling**: Tailwind CSS 4 + DaisyUI with two custom themes (`robotics-light`, `robotics-dark`) defined in `src/styles/global.css`. Theme toggling uses localStorage. Interactive containers use the `.interactive-container` class.

**Deployment**: Static output configured for GitHub Pages. The `site` URL in `astro.config.mjs` is conditionally set when `GITHUB_ACTIONS` env var is present.

## Testing

Tests live in `tests/math/` and cover the math utility library. Vitest is configured with jsdom environment and global test APIs (no imports needed for `describe`, `it`, `expect`). Use floating-point tolerance (`toBeCloseTo`) for math assertions.

## Conventions

- Interactive React components must use `client:load` or `client:visible` directive when embedded in MDX/Astro files.
- Math utilities in `src/lib/math/` are pure functions with no side effects — keep them framework-agnostic.
- Module numbering: folders use `01-`, `02-` prefixes; lesson files within use `01-`, `02-` prefixes.
