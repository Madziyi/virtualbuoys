# VBUOY-004 production dependency review

Audit: `npm audit --omit=dev --json`, 2026-11-09. Result: 0 critical, 0 high, 3 moderate, 2 low affected packages (5 total). An affected-package count includes propagation through the dependency tree; it is not a count of distinct advisories.

| Package | Direct? | Severity | Path / runtime relevance |
| --- | --- | --- | --- |
| `swagger-ui-react` | Direct | Low | Lazy-loaded interactive playground; marked through `swagger-client`, not a separate direct advisory. |
| `swagger-client` | Transitive | Moderate | Playground HTTP/OpenAPI client; marked through `deepmerge` and `@swagger-api/apidom-reference`. |
| `@swagger-api/apidom-reference` | Transitive | Moderate | OpenAPI reference processing used by Swagger; marked through `minimatch`. |
| `minimatch` | Transitive | Moderate | [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249), glob-pattern denial of service. Dependency of reference processing. This app supplies a checked-in specification, not arbitrary user-supplied specs; reachability of the vulnerable pattern is not proven. |
| `deepmerge` | Transitive | Low | [GHSA-gcqx-w48m-w2h4](https://github.com/advisories/GHSA-gcqx-w48m-w2h4), prototype poisoning of returned objects. Used through Swagger; exploitability in this usage has not been demonstrated. |

The audit suggests changing `swagger-ui-react` to 4.1.3, a breaking downgrade; no force fix was applied. The playground is lazy-loaded, has a checked-in spec and is read-only. These factors narrow exposure but do not establish that the advisories are unreachable. Track upstream updates and reassess before broader launch. The separate full development dependency audit was outside this production-only count.

A non-force `npm audit fix --dry-run --omit=dev` still reported the same five production findings; it made no changes.
