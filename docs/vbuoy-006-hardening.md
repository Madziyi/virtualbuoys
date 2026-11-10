# VBUOY-006 Hardening Evidence

This file is the durable evidence target for VBUOY-006.

Populate it during implementation with exact commands, run dates, summary metrics and live verification results. Do not pre-fill unverified claims.

## 1. Long-run normal generator

Record:
- seed/start;
- simulated duration/steps;
- runtime;
- deterministic rerun result;
- parameter min/median/p95/max;
- bound-hit fractions;
- representative step-change stats;
- representative lag-1 persistence;
- wind/wave correlation;
- cross-buoy correlations;
- monthly 1 m–8 m temperature gradients;
- any anomalies and disposition.

## 2. Production 10-minute soak

Record:
- queried UTC window;
- timestamp count;
- expected vs actual complete slots;
- duplicate/gap checks;
- 69-row completeness check;
- latest/checkpoint agreement;
- scheduler run summary;
- any failed jobs/gaps and investigation.

## 3. API abuse resistance

Record:
- parser/budget controls added or confirmed;
- malformed/oversized/conflicting request cases;
- burst-probe request count/concurrency;
- latency/status summary;
- upstream timeout behaviour;
- distributed rate-limit decision and rationale.

## 4. Accessibility/responsive

Record:
- automated checks;
- 320 px UAT;
- 390×840 UAT;
- ~768 px UAT;
- 1440×900 UAT;
- keyboard/focus;
- modal focus restore;
- reduced-motion result;
- overflow measurements.

## 5. Security/regression

Record:
- test counts;
- event acceptance;
- lint/type/build/diff;
- anonymous-write result;
- generator-state result;
- scheduler unauthorized result;
- API write-method result;
- secret scan;
- dependency audit;
- deployment IDs if any.
