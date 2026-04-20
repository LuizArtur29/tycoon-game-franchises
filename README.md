# Tycoon Franchises

Tycoon incremental game built with React + TypeScript + Vite, with a single map flow (`Megalopolis`), PT-BR/EN localization, offline earnings, upgrades, staff gacha, and market systems.

## Requirements

- Node.js 20+
- npm 10+

## Local development

```bash
npm install
npm run dev
```

## Production checks

```bash
npm run lint
npm run build
```

## Environment variables

Configure `.env`:

- `VITE_USE_MOCK_API=true|false`
- `VITE_API_BASE_URL=http://localhost:8080/api/v1`

## CrazyGames release checklist

1. `npm run lint` without errors.
2. `npm run build` without TypeScript errors.
3. Ensure rewarded ads call CrazyGames SDK in production (`src/services/crazyGamesService.ts`).
4. Verify navigation works with hash routes (`#/`, `#/staff`, etc.) in portal iframe.
5. Validate save/load and offline earnings after refresh.
6. Validate PT-BR/EN switch in all screens.
7. Upload `dist/` bundle to CrazyGames.

## Build output

After `npm run build`, deploy the generated `dist/` folder.
