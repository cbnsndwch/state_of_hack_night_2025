# Zero Sync & Profile Refactor Summary

## Context

We have been working on the Zero (Rocicorp) sync layer and the Member Profile UI. The focus has been on ensuring reliable mutations, resolving container-to-host networking issues, and fixing UI reactivity/layout bugs.

## Completed Work

### 1. Zero Mutation Infrastructure

- **Refactored Mutators**: Implemented standard `zero.mutate` logic in `app/zero/mutators.ts` and updated `app/routes/api/zero.mutate.tsx` to handle pushes from `zero-cache`.
- **Networking Fix**: Resolved `fetch failed` (403/401) errors between `zero-cache` (Docker) and the Vite dev server.
    - Updated `vite.config.ts` to set `server.host: true` and `allowedHosts: ['host.docker.internal']`.
    - Confirmed authentication cookies and headers are correctly passed to the upstream API.

### 2. Profile UI Improvements

- **Reactivity Fixed**: Solved an issue where One tab updates didn't reflect in others.
    - Implemented the "Adjusting state during rendering" pattern (checking `prevProfile` during render) in `ProfileCommunityPrefsCard.tsx` to sync local state with Zero props immediately.
- **Scroll Bug Fixed**: Resolved an issue where clicking "Community Preferences" checkboxes caused the page to scroll wildly.
    - Replaced native `label` + `sr-only` inputs with a `div` wrapper and the Radix UI `Checkbox` component to prevent browser focus-jumping behaviors.

## Current State

- **Mutations**: Working correctly. `client -> zero.mutate -> zero-cache -> server -> postgres` pipeline is verified.
- **Profile Page**: Data saves successfully, and the UI updates reactively across tabs. The layout remains stable during interactions.
- **Environment**: Docker container can successfully talk to the host Vite server.

## Next Steps

- **Projects Feature**: Move on to implementing the "My Projects" / Showcase feature using this established Zero mutation pattern.
