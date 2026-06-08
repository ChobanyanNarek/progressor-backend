# Architecture Decision Records

Decision records for this backend service. Each ADR captures one technical
decision: context, alternatives considered, the choice, and its consequences.

Each ADR is **immutable once Accepted** — supersede it with a new record rather
than editing the decision.

Format: [MADR 3.0](https://adr.github.io/madr/). New ADRs copy
[`0000-template.md`](./0000-template.md).

## Index

| ID | Title | Status |
|----|-------|--------|
| [0001](./0001-database-migrations-must-be-generated.md) | Database migrations must be generated, not hand-written | Accepted |
| [0002](./0002-explicit-environment-configuration.md) | Configuration is read explicitly from the environment, no code-side defaults | Accepted |
| [0003](./0003-rehost-expiring-provider-assets-to-gcs.md) | Re-host expiring external provider assets to GCS | Accepted |
| [0004](./0004-module-interfaces-in-dedicated-folder.md) | Interfaces live in a dedicated folder, not in service files | Accepted |
| [0005](./0005-external-provider-integration-pattern.md) | External AI/media provider integration pattern | Accepted |
| [0006](./0006-tests-required-for-every-feature.md) | Every feature ships with automated tests | Accepted |
| [0007](./0007-cqrs-mandatory-for-feature-modules.md) | CQRS is mandatory for feature modules | Accepted |
| [0008](./0008-abstract-entity-usedto-mapping.md) | Entity↔DTO mapping via `AbstractEntity` + `@UseDto` | Accepted |
| [0009](./0009-global-prototype-augmentation-polyfill.md) | Global prototype augmentation via `boilerplate.polyfill.ts` | Accepted |
| [0010](./0010-uuid-v4-primary-keys.md) | UUID v4 primary keys (v7 recorded as a future option) | Accepted |
| [0011](./0011-jwt-rs256-auth-and-auth-decorator.md) | JWT RS256 authentication + `@Auth` composite RBAC decorator | Accepted |
| [0012](./0012-custom-field-decorator-dto-validation.md) | Custom field-decorator DTO validation | Accepted |
| [0013](./0013-enum-and-constant-value-casing.md) | Enum & constant value casing | Accepted |
| [0014](./0014-awesome-nest-custom-lint-rules.md) | Architectural conventions enforced as `@m-one-dev/awesome-nest-eslint` rules | Accepted |
| [0015](./0015-api-errors-return-codes-not-translations.md) | API errors return stable codes, not server-side translations | Accepted |
| [0016](./0016-endpoints-return-dto-or-pagedto.md) | API endpoints return a `Dto` or `PageDto<Dto>` (no bare arrays/interfaces) | Accepted |

## How to add an ADR

1. Copy [`0000-template.md`](./0000-template.md) to `NNNN-kebab-title.md` using
   the next free number.
2. Fill in all sections (Context and Problem Statement, Decision Drivers,
   Considered Options, Decision Outcome with Positive/Negative Consequences, Pros
   and Cons of the Options, Links). Status stays `Proposed` until the PR merges,
   then `Accepted`. Ground every claim in real evidence (`src/...:line`, a PR, a
   review finding).
3. Add a row to the index table above.
4. If the new ADR supersedes an existing one, set the old ADR's status to
   `Superseded by ADR-NNNN` (do not edit its decision — it stays immutable) and
   update its index row.
