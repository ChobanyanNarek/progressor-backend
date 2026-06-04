# ADR 0004: Interfaces live in a dedicated folder, not in service files

- **Status:** Accepted
- **Date:** 2026-06-03
- **Deciders:** Backend lead, backend team

## Context

The D-ID client originally declared its TypeScript interfaces
(`ICreateTalkParams`, `IDidJob`, `DidStatus`, …) at the top of
`did.service.ts`. Mixing type declarations into the service file bloats it and
hides reusable contracts inside an implementation.

## Decision

**Interfaces and provider/domain type contracts live in a dedicated `interfaces/`
folder, not inside service files.**

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

## Consequences

- **Positive:** thinner services; reusable, discoverable contracts; consistent
  with the repo's interface convention.
- **Negative:** external-wire-format files need a small biome override entry.

## References

- `src/modules/ai-asset/interfaces/did.interface.ts`; biome override for that
  file and `did.service.ts`. PR #14.
