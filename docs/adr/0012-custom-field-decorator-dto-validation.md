# ADR-0012: Custom field-decorator DTO validation

- **Status**: Accepted
- **Date**: 2026-06-06
- **Deciders**: Backend team

## Context and Problem Statement

Every DTO property needs three things kept in lockstep: validation
(`class-validator`), transformation (`class-transformer`), and Swagger
documentation (`@nestjs/swagger`). Declaring those as three-plus stacked
decorators on every field is verbose and drifts easily (a validated field that
isn't documented, or transformed but not validated). How do we keep
validation + transform + docs consistent and terse on DTOs?

## Decision Drivers

- Validation, transformation, and Swagger metadata must stay in sync per field
- Terse, single-decorator declaration per property
- A required/`Optional` variant for each field type
- Reuse across all DTOs

## Considered Options

1. **Custom composite field decorators** (`@StringField`, `@EmailField`, …) bundling validator + transform + Swagger
2. **Raw stacked decorators** from `class-validator` / `class-transformer` / `@nestjs/swagger` on each property
3. **Schema-first validation** (e.g. Zod) outside the class/decorator model

## Decision Outcome

Chosen option: **Option 1** — a library of custom field decorators in
`src/decorators/field.decorators.ts` — because each one bundles the validation,
transform, and Swagger metadata for a field type into a single decorator, so the
three can't drift apart and DTOs stay terse. Each comes in a required and an
`...Optional` variant.

Available decorators (each with an `...Optional` counterpart):

- `@StringField`, `@EmailField`, `@NumberField`, `@UUIDField`, `@EnumField`,
  `@ClassField`, `@DateField`, `@URLField`, `@PhoneField`, `@PasswordField`,
  `@BooleanField`, `@TranslationsField`, `@TmpKeyField`.

Each composes (via `applyDecorators`) the relevant `class-validator` rule(s)
(e.g. `IsString`, `IsEmail`, `IsEnum`, `IsUUID`), a `class-transformer`
`Type`/transform, an `ApiProperty(...)` for Swagger (suppressible with
`{ swagger: false }`), and nullability/array handling
(`nullable`, `each`/`isArray`).

Rules:

- DTO properties use a field decorator, not raw stacked decorators.
- Use the `...Optional` variant for optional properties.
- New field types are added to `field.decorators.ts` as composites, not
  open-coded on individual DTOs.

### Positive Consequences

- Validation + transform + Swagger can't drift apart for a field.
- DTOs are terse and read declaratively.
- Field behaviour is defined once and reused everywhere.

### Negative Consequences

- A layer of indirection: behaviour of `@StringField` is in
  `field.decorators.ts`, not on the DTO.
- The decorator module is large (~730 lines) and must be extended for any new
  field shape.
- Edge cases occasionally still need a raw decorator alongside the field one.

## Pros and Cons of the Options

### Option 1: Custom field decorators (chosen)

- Good: one decorator per field; no drift; reusable; Swagger-aware.
- Bad: indirection; a large central module to maintain.

### Option 2: Raw stacked decorators

- Good: explicit and local; nothing hidden.
- Bad: verbose; easy to forget one of validate/transform/document; drift-prone.

### Option 3: Schema-first (Zod)

- Good: single schema for validation + inferred types.
- Bad: doesn't integrate with the NestJS class/decorator + Swagger pipeline used
  throughout; large change. Rejected.

## Links

- Project guide: [`docs/architecture.md`](../architecture.md) (Validation), [`CLAUDE.md`](../../CLAUDE.md)
- Code: `src/decorators/field.decorators.ts` (e.g. `NumberField` `:76`),
  `src/decorators/transform.decorators.ts`, `src/decorators/validator.decorators.ts`.
- Related: [ADR-0011](./0011-jwt-rs256-auth-and-auth-decorator.md),
  [ADR-0013](./0013-enum-and-constant-value-casing.md)
