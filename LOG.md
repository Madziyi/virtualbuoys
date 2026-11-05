# Project Log

Append concise entries. Do not rewrite history except to correct factual errors.

Suggested format:

```text
### YYYY-MM-DD — <task / decision>
- Changed:
- Decisions:
- Verification:
- Simulation/UAT:
- Live state:
- Known issues:
- Next action:
```

---

### 2026-11-04 — Virtual Buoys project bootstrap
- **Changed:** Established the shared Terra/Luna durable-context system for the new public Virtual Buoys project.
- **Decisions:** Separate GitHub/Supabase product from Hardwater; three synthetic western Lake Erie buoys; 10-minute permanent stream; public map/explorer; CSV; public REST/OpenAPI playground; isolated Event Mode rather than historical replay; initial Normal/Storm/Turnover/HAB scenarios; 1×/2×/5×/10× simulation speeds.
- **Data UX:** Public wind direction will be directly available as degrees + compass label using meteorological FROM convention. Users will not be required to reconstruct direction from vector components.
- **Scientific caution:** Exact sensor list, depth levels, units and current-direction convention are not frozen until checked against real buoy/reference data.
- **Verification:** GitHub repository `Madziyi/virtualbuoys` was verified as a new public repository with default branch `main`.
- **Live state:** Supabase project ID `dbsuryesimzatxhznurh` was supplied by the owner, but Terra's connector could not independently authenticate to it; Luna must verify it before live facts are recorded.
- **Next action:** Luna executes VBUOY-001 from `NOW.md`, including local foundation setup, Supabase verification, test/build/UAT baseline and durable handoff.
