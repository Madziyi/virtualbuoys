# Active Initiative

**Initiative:** VBUOY-006 — Hardening and production resilience  
**Status:** PLANNED — LONG-RUN SIMULATION + LIVE SOAK + API/ACCESSIBILITY HARDENING NEXT  
**Planner:** Terra  
**Implementation / verification:** Luna / Codex

## Objective

Harden the completed Virtual Buoys product without adding major new user-facing features.

VBUOY-006 should answer four questions:

1. Does the normal generator remain stable over long synthetic periods and across seasons/seeds?
2. Has the permanent 10-minute production stream actually remained complete and scheduler-driven over a meaningful real-world soak period?
3. Can the public API safely reject malformed/oversized/abusive requests without becoming an unrestricted database proxy?
4. Is the deployed explorer/API/Event Mode robust across keyboard, reduced-motion, accessibility and a wider responsive range than the earlier milestone-specific UAT?

This is a **hardening** milestone. Prefer tests, limits, observability and targeted fixes over redesign.

## Non-goals

- new simulation scenarios;
- predictive/forecast claims;
- new database-backed Event Mode sessions;
- user accounts/API keys;
- paid API tiers;
- replacing Supabase;
- a separate FastAPI service;
- redesigning the public site;
- adding an external rate-limit vendor unless evidence clearly justifies it.

## Workstream A — Long-run normal generator acceptance

The current 30-day generator check is useful but too short to reveal slow drift, seasonal transitions or hard-bound clipping.

Create a repeatable accelerated long-run harness that uses the production normal generator.

### Required runs

At minimum:

- one **365-day continuous run** at fixed seed;
- three additional **30-day runs** at different fixed seeds;
- include winter/spring/summer/fall conditions in the annual run.

The harness should run locally without writing to Supabase.

### Required checks

Across every run:

- exact 10-minute cadence;
- deterministic rerun equality for fixed seed/start;
- exactly 69 finite values per step;
- no duplicate channel/timestamp combinations;
- existing hard safety bounds;
- gust >= sustained wind;
- direction values in [0, 360);
- no impossible negative waves/currents;
- no sustained accidental HAB-like state in Normal;
- no monotonic drift toward a bound.

Annual-run diagnostics should include:

- min/median/p95/max per parameter;
- fraction of samples touching/clipping a hard bound;
- 10-minute absolute-change median/p90/p99 for representative parameters;
- lag-1 persistence for representative parameters;
- wind-speed vs significant-wave-height correlation;
- cross-buoy correlations for representative shared/regional variables;
- monthly/seasonal 1 m–8 m water-temperature gradient;
- runtime and peak/approximate memory if practical.

### Acceptance philosophy

Do not force the synthetic generator to reproduce the historical datasets exactly.

The goal is to detect pathologies:
- bound-sticking;
- exploding variance;
- implausible one-step jumps;
- loss of seasonal stratification;
- three buoys becoming identical;
- accidental event-like Normal behaviour.

If a metric is outside the earlier reference envelope but remains physically/educationally defensible, document it rather than tuning blindly.

## Workstream B — Permanent-stream soak verification

The production scheduler has now been running for multiple days. Use that real history as the normal-cadence soak rather than waiting through a new multi-day test.

Directly verify the most recent **72 continuous hours** of the permanent stream, and also summarize the longest contiguous run available since VBUOY-002.

Check:

- every timestamp aligned to a 10-minute boundary;
- exactly 69 observations per complete timestamp;
- no duplicate channel/timestamp rows;
- no missing channel slots;
- latest timestamp advances normally;
- generator checkpoint agrees with the latest committed slot;
- scheduler job history has expected 10-minute cadence for the sampled period;
- no failed scheduler runs or unexplained gaps in the chosen soak window;
- event-mode use/deployment has not contaminated permanent observations.

If there is a real production gap, do not backfill over it merely to make the test pass. Document cause and decide whether repair is warranted.

## Workstream C — Public API abuse resistance

The V1 API is intentionally public and read-only. VBUOY-006 should strengthen **request budgeting and failure behaviour** without turning the project into an authentication/rate-limit platform.

### Required request controls

Review and, where missing, enforce/test:

- GET/OPTIONS only;
- maximum 7-day history window;
- strict numeric parsing for `hours` and `depth_m`;
- reject conflicting `hours` plus `start/end`;
- reject incomplete explicit ranges;
- UTC/ISO validation;
- start <= end;
- bounded URL/query size;
- reject duplicate query keys where ambiguity would change semantics;
- bounded number of internal observation pages/rows;
- per-request upstream timeout via `AbortController` or equivalent;
- structured 4xx/5xx errors with no raw SQL/stack details;
- no request body processing for GET;
- no internal UUID/service credential/generator state leakage.

### Burst/abuse test

Add a local or controlled live probe that sends a modest concurrent burst of valid and invalid requests and records:

- response status distribution;
- latency summary;
- no 5xx caused by malformed client input;
- valid requests continue succeeding;
- oversized/range-invalid requests fail cheaply before expensive history reads where possible.

Do **not** run a destructive or high-volume load test against production.

### Rate limiting decision

Do not add a fake per-instance in-memory rate limiter and call it distributed protection.

If Supabase/project-native infrastructure offers a reliable low-complexity distributed limit that can be verified, it may be used. Otherwise:

- keep strong bounded-request controls;
- document that distributed per-client quotas remain a future operational control;
- record the residual risk explicitly.

## Workstream D — Accessibility and responsive hardening

Perform both automated and browser-based checks.

### Automated

Add focused accessibility regression coverage for major public surfaces if practical, using a lightweight test approach.

At minimum test semantic/interactive behaviour around:

- main navigation;
- buoy selection;
- parameter controls;
- Event Mode controls;
- AI integration dialog;
- API playground entry;
- modal focus/dismissal.

Avoid adding a large runtime dependency solely for test-time accessibility checks.

### Browser UAT matrix

Production or preview as appropriate:

- 320 px wide;
- actual 390×840;
- tablet around 768 px;
- desktop 1440×900.

Verify:

- no horizontal page overflow;
- map remains usable or has equivalent external controls;
- charts/tables/code examples remain readable;
- touch targets remain usable;
- keyboard-only navigation works;
- visible focus is present;
- modal focus is trapped/restored where appropriate;
- Escape dismissal works where expected;
- Event Mode can be operated without a pointer;
- synthetic/current-condition distinctions remain obvious.

### Reduced motion

Respect `prefers-reduced-motion` for non-essential animation.

Event Mode is data playback, so reduced-motion mode does not need to disable the simulation, but it should avoid decorative/transition motion and should remain understandable while paused/stepped through controls.

## Workstream E — Regression, dependency and deployment hygiene

Before closure:

- full `npm test`;
- long-run simulation harness;
- event acceptance harness;
- lint;
- typecheck;
- production build;
- `git diff --check`;
- built-asset secret scan;
- public-access/security probe;
- live API contract smoke test;
- production dependency audit.

Do not use `npm audit fix --force`.

Recheck the existing large-chunk advisory. Fix only if there is a low-risk, clearly beneficial split (for example lazy-loading an already isolated heavy surface). Otherwise record it as accepted V1 debt.

## Deployment

Cloudflare Pages remains Direct Upload.

If VBUOY-006 changes frontend source:

1. deploy a non-production preview;
2. run the responsive/accessibility matrix there;
3. deploy the verified build to production;
4. record deployment ID/source commit in `LIVE-STATE.md`;
5. repeat a concise production smoke/UAT pass.

If only tests/docs/backend hardening change and the production frontend bytes are unchanged, do not create a pointless frontend deployment; document why no Pages upload was required.

Any Edge Function change must be deployed and directly verified before closure.

## Acceptance criteria

VBUOY-006 can close when:

### Simulator
- 365-day run completes with no cadence/catalogue/finite/bound failures;
- fixed-seed rerun is deterministic;
- diagnostics show no material drift/bound-sticking pathology;
- multiple additional seeds pass;
- results are summarized in durable evidence.

### Live soak
- recent 72-hour permanent stream is complete at 10-minute cadence, or any real gap is explicitly investigated/documented;
- scheduler/checkpoint/latest state agree;
- no event contamination.

### API
- malformed/conflicting/oversized requests are rejected predictably;
- bounded valid requests still work;
- modest burst probe does not produce uncontrolled 5xx failures;
- no secret/internal-state leakage;
- rate-limit decision is explicit and technically honest.

### Accessibility/responsive
- 320/390/768/1440 checks pass or remaining limitations are documented;
- keyboard operation and visible focus work for core flows;
- dialogs restore focus correctly;
- reduced-motion behaviour is checked;
- no horizontal overflow.

### Security/regression
- anonymous observation write still rejected;
- generator state inaccessible;
- scheduler endpoint without token 401;
- public API write methods rejected;
- event mode remains client-local;
- secret scan passes;
- test/lint/type/build/diff gates pass.

## Ordered implementation

1. Sync `main`; read all durable context.
2. Build long-run normal-generator harness and run acceptance.
3. Directly inspect live 72-hour stream/scheduler/checkpoint soak evidence.
4. Harden API request parsing/budgeting and add abuse-oriented tests/probe.
5. Add targeted accessibility regression checks.
6. Run responsive/keyboard/reduced-motion UAT matrix.
7. Run full security/regression/dependency gates.
8. Deploy changed Edge Functions and/or frontend only as required.
9. Repeat production smoke checks.
10. Update `NOW.md`, `TASKS.md`, `LIVE-STATE.md`, `LOG.md` and hardening evidence docs.
11. Commit/push final verified handoff.

## Next action

Luna syncs current `main` and executes VBUOY-006 exactly as defined here.
