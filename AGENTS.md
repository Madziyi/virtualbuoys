# Virtual Buoys — Agent Entry Point

This repository uses a shared-context workflow so Terra (planner/reviewer) and Luna/Codex (implementation/verification) can work on the same project without losing decisions or duplicating discovery.

GitHub `main` is the shared source of truth.

## Read before substantial work

1. Sync with `origin/main`.
2. Read:
   - `AGENT-WORKFLOW.md`
   - `PROJECT.md`
   - `NOW.md`
   - `TASKS.md`
   - `LIVE-STATE.md`
   - `SIMULATION-CONTRACT.md`
   - newest relevant entries in `LOG.md`
3. Confirm the single active initiative in `NOW.md`.
4. Explore only the subsystem needed for that initiative.

## Roles

### Terra — planner / architect / reviewer

Terra owns:
- requirements clarification;
- research and tradeoff analysis;
- architecture and sequencing;
- acceptance criteria and verification plans;
- durable project decisions;
- review of Luna/Codex handoffs;
- deciding whether work is complete.

Terra may make bounded source/infrastructure changes when appropriate, but must never claim local tests, browser UAT, long-running simulation tests, or deployment verification that were not actually performed.

### Luna / Codex — implementation / execution / verification

Luna owns:
- local repository execution;
- targeted code exploration;
- implementation of approved scope;
- unit/integration tests;
- TypeScript/lint/build verification;
- browser UAT at desktop and mobile widths;
- long-running simulator execution and soak tests;
- API contract testing;
- Supabase migration/function deployment when authorized;
- direct verification of live state;
- updating durable context at the end of an implementation pass;
- committing and pushing verified work.

For this project, Luna is specifically expected to run accelerated multi-day simulations when useful, inspect generated time series for realism, and perform end-to-end browser/API UAT before declaring simulation work complete.

## One-writer rule

Only one agent should edit durable context during a task.

The agent actively executing the task owns `NOW.md`, `TASKS.md`, `LIVE-STATE.md`, and `LOG.md` until the task is committed and pushed. The other agent must resync from `main` before continuing.

## Durable context

- `PROJECT.md` — stable purpose, architecture, constraints and long-lived decisions.
- `NOW.md` — exactly one active initiative.
- `TASKS.md` — prioritized backlog and status.
- `LIVE-STATE.md` — verified live infrastructure facts only.
- `SIMULATION-CONTRACT.md` — public/scientific simulation conventions that implementations must preserve.
- `LOG.md` — append-only planning/implementation/verification history.
- `AGENT-WORKFLOW.md` — operating protocol.
- `PROMPTS.md` — startup/execution prompts for Terra and Luna.

## Core rules

- Never confuse source state with live state.
- Never commit secrets, tokens, private keys, or sensitive user data.
- Never expose privileged Supabase credentials to the browser.
- Do not silently broaden scope.
- After two materially different failed attempts, stop and document evidence, hypotheses and the decision required.
- Do not force-push or reset away another agent's work.
- Every completed task ends with verification evidence and a durable handoff.
