# ADR-0013: Enum & constant value casing

- **Status**: Accepted
- **Date**: 2026-06-06
- **Deciders**: Backend team

## Context and Problem Statement

TypeScript enums are used for fixed value sets across the service (`RoleType`,
`AccountStatus`, `MemoryPointStatus`, `LanguageCode`, …). Two casing questions
recur: how should the enum **member identifier** be cased, and what happens when
the **stored/wire value** is dictated by an external standard (locale codes,
GeoJSON) that has its own casing? Without a written rule this is decided
ad-hoc per enum.

## Decision Drivers

- A single, predictable casing convention for enum members
- Interoperability with external standards (i18n locale codes, RFC 7946 GeoJSON)
- Consistency with the project's `SCREAMING_SNAKE_CASE` constant convention
- Persisted/wire values must not be silently changed to fit a code convention

## Considered Options

1. **Member NAME `SCREAMING_SNAKE_CASE`; value follows the external standard when one applies** (otherwise the value matches the name)
2. **Uppercase both name and value, always** (rename external values to fit)
3. **Match the member name to whatever the value is** (e.g. lowercase members for lowercase values)

## Decision Outcome

Chosen option: **Option 1**. Enum member **identifiers** must be
`SCREAMING_SNAKE_CASE` / `UPPER_CASE`. The **value string** normally matches the
name, **but** when the stored or wire value is dictated by an external standard,
the value keeps that standard's casing while the member name is still uppercased.

Compliant today (members uppercased, values match):

- `RoleType.CREATOR` / `RoleType.ADMIN`
- `AccountStatus.ACTIVE` / `AccountStatus.DISABLED`
- `MemoryPointStatus.PENDING` / `ADMIN_REVIEWING` / `GENERATING` / `AI_REVIEWING`
  / `APPROVED` / `REJECTED`
- `AiGenerationStatus`, `MemoryPointType`, `TokenType`, `Order`

External-standard exception (member name uppercased, **value** preserved):

- `LanguageCode.EN_US = 'en_US'`, `LanguageCode.RU_RU = 'ru_RU'` — the values are
  locale codes that must match the i18n directory names (`src/i18n/en_US`,
  `src/i18n/ru_RU`), so the **value** keeps the locale casing while the **member
  name** is uppercased.
- GeoJSON `type` is the string literal `'Point'` (RFC 7946) — not even an enum,
  a string-literal type — and keeps the standard's exact casing
  (`GeoPointDto.type: 'Point'`).

Rule: never rename an externally-dictated value to satisfy the casing
convention; uppercase the member **name** and let the **value** mirror the
external system.

### Adoption note

This ADR is written now to make the convention explicit. The audit hint that
prompted it expected `LanguageCode` to currently use lowercase member names
needing a fix — on inspection the members are **already** `EN_US` / `RU_RU`
(values `'en_US'` / `'ru_RU'`), so no code change was required; this ADR
codifies the already-correct state and the external-value exception that
explains it.

### Positive Consequences

- One predictable rule for member casing across all enums.
- External integrations (i18n, GeoJSON) keep working because values are never
  mangled.
- Aligns with the project's `SCREAMING_SNAKE_CASE` constant convention.

### Negative Consequences

- Member name and value can differ (`EN_US = 'en_US'`), which can momentarily
  surprise a reader.
- Requires judgement to recognise when a value is "externally dictated"; relies
  on review to catch a value that's been uppercased by mistake.

## Pros and Cons of the Options

### Option 1: Uppercase name, value follows external standard (chosen)

- Good: consistent member casing; preserves interoperability; no value mangling.
- Bad: name≠value pairs exist; needs reviewer judgement on the exception.

### Option 2: Uppercase both, always

- Good: zero ambiguity in code.
- Bad: would break i18n lookups and GeoJSON parsing by changing values to
  `'EN_US'` / `'POINT'`. Rejected.

### Option 3: Match name to value casing

- Good: name and value always identical.
- Bad: produces lowercase members like `en_US`, violating the constant
  convention and the linter's naming rules. Rejected.

## Links

- Project guide: [`CLAUDE.md`](../../CLAUDE.md) (Naming)
- Code: `src/constants/role-type.ts`, `src/constants/account-status.ts`,
  `src/constants/language-code.ts`, `src/modules/memory-points/dtos/geo-point.dto.ts`,
  `src/i18n/` (locale directory names).
- Related: [ADR-0004](./0004-module-interfaces-in-dedicated-folder.md)
  (external-wire-format naming exception),
  [ADR-0012](./0012-custom-field-decorator-dto-validation.md)
