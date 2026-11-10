# Current Project State

**Initiative:** VBUOY-004 — Public REST API + OpenAPI playground
**Status:** COMPLETE — deployed and verified
**Closure date:** 2026-11-09 (America/New_York)

The public read-only V1 API and frontend playground are deployed. The production site is https://virtual-buoys.pages.dev/; verified infrastructure details are in `LIVE-STATE.md`. No Event Mode work was performed.

## Closure evidence

- `docs/openapi.yaml` validates as OpenAPI 3.1 with `openapi-spec-validator` 0.7.2. `scripts/check-openapi-live.py` validates 17 live responses against documented schemas and status codes, all documented query inputs, unsupported methods and CORS. The 500 path was reviewed in source rather than deliberately triggering a production outage. Static Vitest coverage checks route, status and query declarations.
- Public methods: GET and OPTIONS; POST/PUT/PATCH/DELETE/HEAD returned 405, OPTIONS 204. Anonymous observation insert was rejected with `42501`, generator state was inaccessible, and scheduler function without its token returned 401. Built assets passed `scripts/check-build-secrets.mjs`; the pattern/local-value scan cannot prove absence of unknown secrets.
- Production `npm audit --omit=dev`: 5 affected packages, 0 critical, 0 high, 3 moderate and 2 low, all through the Swagger dependency chain. No force fix was applied; V1 residual risk and package-level analysis are in `docs/dependency-audit-vbuoy-004.md`.
- Deployed browser UAT: desktop 1440 x 900 and actual mobile 390 x 840 CSS pixels. Explore and Access The Data navigation, map and buoy selection, history, API guidance/examples and live Swagger Try It Out verified. West 24-hour temperature CSV had 432 synthetic rows at 1/4/8 m; mobile East oxygen CSV had 288 synthetic rows at 1/8 m. Client/scroll widths matched (1425/1425 desktop, 375/375 mobile). No browser console warnings/errors were observed; individual key requests succeeded. Complete network-level capture was unavailable.
- `npm test`: 7 files, 17 tests passed; `npm run lint`, `npm run typecheck`, `npm run build`, `git diff --check` passed. Existing build large-chunk advisory remains.

## Next action

Owner/Terra reviews the VBUOY-004 closure and selects the next initiative. VBUOY-005 has not been started.

## Owner-requested AI integration handoff - 2026-11-09

The Access The Data section now includes an editable, student-oriented API prompt and a chooser for ChatGPT, Gemini and Claude. ChatGPT/Claude receive the prompt through URL query links; web prefill is not a guaranteed documented contract and may require sign-in. Gemini uses copy-and-paste, with a manual fallback. The feature was deployed to Pages; see `LIVE-STATE.md` and `LOG.md`. VBUOY-004 remains complete; no Event Mode work was started.
