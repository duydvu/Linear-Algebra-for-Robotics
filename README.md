# Interactive Linear Algebra for Robotics

## Why this exists

I started learning robotics as a side project and quickly hit a wall: I couldn't remember half the linear algebra I learned in undergrad. Vectors, matrix transformations, eigenvalues — it was all buried somewhere in the back of my brain, and textbooks weren't helping me reconnect it to the robotics problems I was actually trying to solve.

So I built this. It's an interactive learning platform that ties linear algebra concepts directly to robotics applications, with visualizations you can play with and examples grounded in real robot problems.

## Vibe-coded with Claude Code

We live in an age where knowledge is a common commodity. AI lets anyone learn anything, anywhere, anytime — ask unlimited questions, get instant explanations, explore at your own pace. I leaned into that fully here.

This entire project was "vibe coded" with Claude Code. I described what I wanted to learn, how I wanted to learn it, and Claude helped me build the interactive platform around it. The result is something that helped me relearn linear algebra in a way that actually stuck — and I hope it helps you too.

## What's inside

Each module builds on the previous one, going from basic vector operations to real robotics applications like forward kinematics and path planning. Every lesson has interactive components you can drag, tweak, and experiment with.

- **Module 1: Foundations** — Vectors, dot products, cross products
- **Module 2: Matrices** — Operations, multiplication, determinants
- **Module 3: Transformations** — 2D/3D transforms, homogeneous coordinates
- **Module 4: Advanced** — Eigenvalues, coordinate frames, rotation representations
- **Module 5: Applications** — Forward kinematics, velocity kinematics, path planning

## Getting started

```bash
npm install
npm run dev
# Open http://localhost:4321
```

Requires Node.js 18+.

## Tech stack

- **Framework**: Astro + React + TypeScript
- **Styling**: Tailwind CSS + DaisyUI
- **Math**: KaTeX
- **Visualizations**: p5.js (2D), Three.js (3D), Plotly.js (graphs)
- **Testing**: Vitest

## Commands

```bash
npm run dev            # Dev server
npm run build          # Production build
npm run preview        # Preview build
npm run test           # Run tests
```

## Project structure

```
src/
├── pages/             # Astro pages (auto-routed)
│   └── modules/       # Learning modules (MDX)
├── components/
│   ├── layout/        # Layout, nav, footer
│   ├── content/       # Callouts, examples
│   └── interactive/   # p5.js/Three.js visualizations
├── lib/               # Math utilities, data
└── styles/            # Global CSS
```

## License

MIT
