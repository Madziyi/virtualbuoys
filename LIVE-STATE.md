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
- Initially verified before VBUOY-002 on 2026-11-05; at that time `public` had zero tables.
- Reverified after VBUOY-002 deployment through the authorized Supabase connection on 2026-11-05 11:47 UTC. Project remains active/healthy; the public schema now contains five RLS-enabled tables.
- A publishable client key is used only in ignored local `.env.local`; no key value is recorded or committed.

Do not record schema, migrations, functions, URLs, keys or deployed resources here until directly verified.

## Frontend hosting

- Cloudflare Pages selected as the static Vite hosting direction in source documentation.
- No Pages project, domain, deployment or production environment has been configured or verified.

## Database schema

- Applied migration `20261105112335_vbuoy_002_network` and `20261105112730_vbuoy_002_scheduler_auth`; local migration filenames match the versions recorded in Supabase migration history.
- Live public tables: `buoys` (3), `parameters` (16), `channels` (69), `observations` (69,759 at 2026-11-05 11:50:11 UTC) and `generator_state` (one singleton). RLS is enabled on all five.
- `latest_observations` is a security-invoker view. Direct query returned 69 rows, one for each channel.
- All 69 channels have continuous observations from `2026-10-29 11:30:00 UTC` through `2026-11-05 11:50:00 UTC`; 1,011 timestamps per channel, with no channel gaps. The original 7-day backfill contained 1,009 timestamps, followed by two scheduled timestamps.
- There are three seeded virtual stations (`west`, `central`, `east`), 16 V1 parameters and 23 channels per buoy. Exact coordinates and schema are in the migration.
- The initial synthetic backfill contained 1,009 timestamps × 69 channels = 69,621 observations. At verification, 1,011 timestamps × 69 channels = 69,759 observations. No real historical rows were inserted; all live observation rows carry synthetic provenance.
- `commit_simulation_step` is granted only to `service_role`, locks and compares the singleton generator checkpoint, requires the next 10-minute slot, and checks that exactly 69 new rows insert. `generator_state` has no anon/authenticated access.
- Direct publishable-key access check succeeded at 2026-11-05: 69 latest-view rows and the three expected buoy slugs were readable; a browser-like observation insert failed with PostgreSQL `42501`; a function POST without the scheduler token returned HTTP 401. The same local probe needed approved network access because shell DNS is restricted by default.

## Edge/serverless functions

- `advance-virtual-buoys` is deployed and active (version 2 at the time of this ledger entry), with JWT verification disabled only because its handler validates the dedicated scheduler token before accepting actions. Direct POST without that header returned 401.
- The handler gets its Supabase service credential only from the Edge Function environment, validates `x-vbuoy-scheduler-token` via `validate_vbuoy_scheduler_token`, and supports bounded initialization/backfill plus advancement. No service credential is in the client bundle.

## Scheduled jobs

- Supabase `pg_cron` job ID 1, `advance-virtual-buoys-every-10-minutes`, is active with `*/10 * * * *` in GMT. It invokes the Edge Function through `pg_net` with a 10,000 ms timeout and resolves the scheduler token from Vault at dispatch time.
- First observed job run started `2026-11-05 11:40:00.093234 UTC`, status `succeeded`; `net._http_response` ID 1 returned HTTP 200 without timeout/error. It advanced the stream from 11:30 to 11:40 UTC by exactly 69 rows.
- Second observed job run started `2026-11-05 11:50:00.159271 UTC`, status `succeeded`; `net._http_response` ID 2 returned HTTP 200 without timeout/error. The two run start times are exactly ten minutes apart; it advanced the stream from 11:40 to 11:50 UTC by exactly 69 rows. Direct query at 11:50:11 UTC returned 69,759 total rows, 1,011 complete timestamps, and zero timestamps with a row count other than 69.

## External providers

- None verified live yet.

## Secrets

- Vault contains secret name `vbuoy_scheduler_token`; the value is never recorded. A local working copy is in ignored `.env.scheduler.local` only while final verification is in progress; it must be removed before commit/handoff.

## Known drift

Cloudflare Pages remains unconfigured; API explorer/Event Mode remain future scope. No raw reference observations were loaded into production.
