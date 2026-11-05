# Shared Agent Workflow

This is the operating contract for every AI runtime working on Virtual Buoys.

## 1. GitHub preflight

Before repo-specific work:

```bash
git fetch origin
git status --short
git rev-parse HEAD
git rev-parse origin/main
```

Rules:
- If clean and `origin/main` is ahead, fast-forward.
- If local and remote diverged, stop and inspect deliberately.
- If the tree is dirty, preserve unrelated work.
- Never force-push unless the human explicitly authorizes it for a specific reason.
- If remote state cannot be checked, state that the baseline is unconfirmed.

After syncing, reread the durable context files.

## 2. Read context in this order

1. `AGENTS.md`
2. `AGENT-WORKFLOW.md`
3. `PROJECT.md`
4. `NOW.md`
5. `TASKS.md`
6. `LIVE-STATE.md`
7. `SIMULATION-CONTRACT.md`
8. newest relevant `LOG.md` entries

Do not remap the entire repository by default.

## 3. Plan before implementation

A plan should define:
- objective;
- in-scope behavior;
- explicit non-goals;
- files/subsystems;
- API/data contracts;
- simulation contracts;
- security constraints;
- ordered steps;
- acceptance criteria;
- verification commands;
- browser/UAT requirements;
- soak-test requirements when applicable;
- risks/blockers;
- one next action.

If requirements materially change, update the plan before continuing.

## 4. One active initiative

`NOW.md` contains exactly one active initiative.

Do not start unrelated implementation unless the human explicitly reprioritizes.

## 5. Bounded implementation

Luna/Codex should:
- inspect only relevant files;
- make the smallest coherent change;
- avoid unrelated cleanup;
- preserve public API and simulation contracts unless the approved plan changes them;
- add tests proportional to risk.

## 6. Verification

Typical frontend/API change:

```bash
# focused tests
npm test -- <relevant tests>

# focused lint
npx eslint <changed files>

# type check
npx tsc --noEmit -p tsconfig.json

# production build
npm run build

# patch sanity
git diff --check
```

UI work also requires browser UAT at relevant desktop and narrow/mobile widths.

Simulation work must not be declared correct from unit tests alone. Depending on the change, Luna should run accelerated simulations and inspect:
- timestamp continuity;
- plausible bounds;
- no impossible jumps;
- inter-parameter relationships;
- spatial differences between buoys;
- scenario transitions;
- database ingestion stability;
- API/UI consistency.

For database/deployment work:
- apply deliberately;
- verify live objects directly;
- verify version/configuration;
- verify a safe invocation/query;
- update `LIVE-STATE.md`;
- never record secret values.

## 7. Failure budget

After two materially different focused attempts fail:
- stop;
- record exact evidence;
- list current hypotheses;
- state the decision/blocker required;
- do not circle indefinitely.

## 8. Handoff

Every implementation pass ends with:

```text
Task: <ID — goal>
Status: done | partial | blocked
Changed: <files/subsystems and behavior>
Decisions: <important contracts future agents must preserve>
Verification: <commands/checks + exact results>
Simulation/UAT: <long-run/browser evidence when applicable>
Live state: <if relevant>
Known issues: <risks/failures or none>
Next action: <one concrete next step>
Commit: <sha>
```

Update `NOW.md`, `TASKS.md`, `LOG.md`, and `LIVE-STATE.md` as appropriate before the final commit/push.

## 9. Context ownership loop

```text
Human + Terra discuss
        ↓
Terra plans / records contracts
        ↓
GitHub main
        ↓
Luna syncs
        ↓
Luna implements + tests + UAT + long runs
        ↓
Luna updates context + pushes
        ↓
Human sends handoff to Terra
        ↓
Terra resyncs/reviews
        ↓
close / targeted fix / next initiative
```

If Terra implements directly, Luna must sync before verification.

## 10. Live-state rule

Any action involving database schema, migrations, Edge/serverless functions, secrets, cron/schedulers, production config or external-provider deployment must update `LIVE-STATE.md` with verified facts.

Secret names may be recorded. Secret values may not.

## 11. Completion standard

A task is complete only when:
- acceptance criteria are satisfied;
- relevant tests/checks pass;
- browser UAT is complete for UI work;
- long-running simulation checks are complete when relevant;
- live state is verified if applicable;
- durable context is updated;
- implementation and handoff are pushed;
- another agent can continue without rediscovery.
