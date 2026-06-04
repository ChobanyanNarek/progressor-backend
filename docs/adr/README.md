# Architecture Decision Records

Records of significant architectural/technical decisions for this backend.
Each ADR is immutable once Accepted; supersede it with a new record rather than
editing the decision.

Format: `NNNN-short-title.md` with Status / Context / Decision / Consequences.

## Index

| ADR | Title | Status |
|-----|-------|--------|
| [0001](./0001-database-migrations-must-be-generated.md) | Database migrations must be generated, not hand-written | Accepted |
| [0002](./0002-explicit-environment-configuration.md) | Configuration is read explicitly from the environment, no code-side defaults | Accepted |
| [0003](./0003-rehost-expiring-provider-assets-to-gcs.md) | Re-host expiring external provider assets to GCS | Accepted |
| [0004](./0004-module-interfaces-in-dedicated-folder.md) | Interfaces live in a dedicated folder, not in service files | Accepted |
| [0005](./0005-external-provider-integration-pattern.md) | External AI/media provider integration pattern | Accepted |
| [0006](./0006-tests-required-for-every-feature.md) | Every feature ships with automated tests | Accepted |
