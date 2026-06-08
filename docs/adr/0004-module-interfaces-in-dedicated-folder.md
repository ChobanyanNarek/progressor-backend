# ADR-0004: Interfaces live in a dedicated folder, not in service files

- **Status**: Accepted
- **Date**: 2026-06-03
- **Deciders**: Backend team

## Context and Problem Statement

The D-ID client originally declared its TypeScript interfaces
(`ICreateTalkParams`, `IDidJob`, `DidStatus`, …) at the top of
`did.service.ts`. Mixing type declarations into the service file bloats it and
hides reusable contracts inside an implementation. Where should interfaces and
domain/provider type contracts live?

## Decision Drivers

- Services should stay thin (implementation, not type declarations)
- Contracts should be discoverable and reusable across the module
- Consistency with the existing `I`-prefixed convention (`IFile`, `IApiFile`)

## Considered Options

1. **Dedicated `interfaces/` folder** — `I`-prefixed, kebab-case files; services import their types
2. **Interfaces inline at the top of the service file**
3. **Co-locate the interface in the file that uses it** (no central convention)

## Decision Outcome

Chosen option: **Option 1** — interfaces and provider/domain type contracts live
in a dedicated `interfaces/` folder, not inside service files — because it keeps
services thin and makes contracts discoverable and reusable, matching the repo's
existing interface convention.

- Module-specific contracts: `src/modules/<module>/interfaces/<name>.interface.ts`.
- Cross-cutting contracts: the existing global `src/interfaces/` (`IFile`, …).
- Interface names are `I`-prefixed (matches the existing `IFile` / `IApiFile`
  convention); files are kebab-case.
- Service files import their types; they do not declare exported interfaces.

### Exception — external wire formats

Types that mirror a third-party JSON payload keep the provider's field names
(e.g. `result_url`), which violates `useNamingConvention`. Such files (and the
service object literals that build those payloads) get a **scoped**
`useNamingConvention: "off"` override in `biome.json` rather than being renamed,
since the names are the provider's wire contract.

### Positive Consequences

- Thinner services; reusable, discoverable contracts.
- Consistent with the repo's `I`-prefixed interface convention.

### Negative Consequences

- External-wire-format files need a small `biome.json` override entry.

## Pros and Cons of the Options

### Option 1: Dedicated `interfaces/` folder (chosen)

- Good: thin services; one obvious place to find a contract; reusable across the
  module.
- Bad: one more folder per module; external-wire files still need a biome
  override.

### Option 2: Inline in the service file

- Good: types sit next to their first use; zero extra files.
- Bad: bloats the service; hides reusable contracts inside an implementation —
  the problem that motivated this ADR.

### Option 3: Ad-hoc co-location

- Good: flexible.
- Bad: no convention means contracts scatter and become hard to find.

## Links

- Project guide: [`CLAUDE.md`](../../CLAUDE.md) (Critical Code Rules)
- Code: `src/modules/ai-asset/interfaces/did.interface.ts`; `biome.json` override
  for that file and `did.service.ts`.
- Evidence: PR #14.
- Related: [ADR-0013](./0013-enum-and-constant-value-casing.md) (external-system
  casing exception)
