# Live State Ledger

This file records only facts verified against live infrastructure.

Repository files do not prove deployment. Never store secret values.

## GitHub

- Repository: `Madziyi/virtualbuoys`
- URL: `https://github.com/Madziyi/virtualbuoys`
- Default branch: `main`
- Visibility: public
- Repository was empty before the shared-context bootstrap.
- Verified by Terra through the GitHub connector on 2026-11-04.

## Supabase

### Target project

- Project ID: `dbsuryesimzatxhznurh`
- Status: `ACTIVE_HEALTHY`
- Region: `us-west-2`
- Database: PostgreSQL 17.11 (`server_version` query returned `17.11`)
- API URL: `https://dbsuryesimzatxhznurh.supabase.co`
- Verified directly through the authorized Supabase connection on 2026-11-05; read-only SQL returned database `postgres` at `2026-11-05 05:20:18.925459+00 UTC`.
- `public` schema had zero tables when inspected on 2026-11-05.
- No migrations, tables, policies, functions, scheduled jobs or API objects were created by VBUOY-001.
- A publishable client key is used only in ignored local `.env.local`; no key value is recorded or committed.

Do not record schema, migrations, functions, URLs, keys or deployed resources here until directly verified.

## Frontend hosting

- Cloudflare Pages selected as the static Vite hosting direction in source documentation.
- No Pages project, domain, deployment or production environment has been configured or verified.

## Database schema

- No schema is verified live yet.

## Edge/serverless functions

- None verified live yet.

## Scheduled jobs

- None verified live yet.

## External providers

- None verified live yet.

## Secrets

Secret names may be added here later after configuration, but never values.

## Known drift

None yet. This is a new project.
