# Virtual Buoys

A public educational Lake Erie data platform. Readings will be synthetic and clearly labelled.

## Local setup

```sh
npm ci
Copy-Item .env.example .env.local # PowerShell; then fill in Supabase URL and publishable key
npm run dev
```

The browser client reads only `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Never put a secret or service-role key in a `VITE_` variable. `.env.local` is ignored by Git.

## Checks

```sh
npm test
npm run lint
npm run typecheck
npm run build
npm run check:backend
```

`npm run check:backend` makes a read-only request to the Supabase REST root and prints only its HTTP status. It requires local environment values.

## Scope

VBUOY-001 is the shell and contract baseline. The source-grounded database/API proposal is in [`docs/data-api-schema.md`](docs/data-api-schema.md). No production schema, simulator, scheduler, public endpoint or deployment is included yet.

## Hosting direction

Cloudflare Pages is the selected static Vite hosting direction. Build with `npm ci && npm run build`, publish `dist/`. Hosting has not been configured or deployed.
