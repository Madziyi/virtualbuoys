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

The deployed V1 schema and public API are described in [`docs/data-api-schema.md`](docs/data-api-schema.md) and [`docs/public-api-contract.md`](docs/public-api-contract.md). Verified infrastructure facts are in [`LIVE-STATE.md`](LIVE-STATE.md).

## Hosting direction

Cloudflare Pages hosts the static Vite frontend at https://virtual-buoys.pages.dev/. The `virtual-buoys` project uses Direct Upload, so Git pushes do not deploy automatically. Cloudflare does not support converting this project to Git integration; automatic Git builds would require a new Pages project.

To deploy a reviewed revision: configure only `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in ignored `.env.local`, run `npm ci` and `npm run build`, run `node scripts/check-build-secrets.mjs`, then deploy `dist/` with `wrangler pages deploy dist --project-name virtual-buoys --branch main`. Verify the returned production URL and update `LIVE-STATE.md`. Never use a service-role key or scheduler token in frontend environment values.
