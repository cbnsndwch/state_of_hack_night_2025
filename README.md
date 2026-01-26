# hello_miami

## State of the Hack Night 2025

A data visualization dashboard exploring the growth, impact, geographical reach, and interests of the hack night community. This project serves as an interactive report for the "State of the Hack Night 2025".

## Features

- **Interactive Maps**: Community data visualization using MapLibre GL and D3.
- **Data Insights**: Analysis of community impact and interests.
- **Modern UI**: Built with Radix UI primitives and Tailwind CSS.
- **Smooth Animations**: Powered by Framer Motion.

## Tech Stack

- **Framework**: [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/)
- **Maps**: [MapLibre GL JS](https://maplibre.org/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Charts/Data**: D3.js

## Getting Started

### Prerequisites

- Node.js (Latest LTS recommended)
- pnpm (Project uses `pnpm-lock.yaml`)

### Installation

1. Clone the repository:

    ```bash
    git clone <repository-url>
    cd state-of-the-hack-night-2025
    ```

2. Install dependencies:

    ```bash
    pnpm install
    ```

### Development

Start the development server:

```bash
pnpm dev
```

The application will be available at `http://localhost:5173`.

### Building for Production

Build the application for production:

```bash
pnpm build
```

To preview the production build locally:

```bash
pnpm preview
```

## Project Structure

- `src/components`: Reusable UI components and layout elements.
- `src/sections`: Main sections of the landing page (Hero, Impact, Interests, Geography).
- `src/data`: JSON data files and precomputed statistics.
- `src/hooks`: Custom React hooks.

## Scripts

- `pnpm format`: Format code using Prettier.
- `pnpm lint`: Run ESLint.

## License

This project is dual-licensed:

- **Source Code**: [MIT](LICENSE.md#source-code-license-mit) - Copyright (c) 2025-2026 cbnsndwch LLC
- **Data**: [CC BY-NC 4.0](LICENSE.md#data-license-cc-by-nc-40) - Copyright (c) 2025-2026 cbnsndwch LLC

See [LICENSE.md](LICENSE.md) for full details.
