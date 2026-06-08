# Error messages & i18n catalog

API errors return a stable **i18n key** as the `message`, not human-readable
prose. Clients localize the key against the catalog below. This keeps the API
language-agnostic and lets the frontend control copy.

## Error response shape

```jsonc
// e.g. POST /auth/login with a wrong password
{
  "statusCode": 401,
  "message": "error.invalidCredentials"
}
```

Validation failures (HTTP `422`) carry one key per failed constraint, rewritten
to `error.fields.{constraint}` (snake_cased class-validator constraint name) by
[`HttpExceptionFilter`](../src/filters/bad-request.filter.ts):

```jsonc
{
  "statusCode": 422,
  "message": [
    {
      "property": "role",
      "constraints": { "isEnum": "error.fields.is_enum" }
    }
  ]
}
```

## The catalog

The canonical key → message mapping lives in the i18n resource files, one per
locale:

- English — [`src/i18n/en_US/error.json`](../src/i18n/en_US/error.json)
- Russian — [`src/i18n/ru_RU/error.json`](../src/i18n/ru_RU/error.json)

A key like `error.userNotFound` maps to `error.json` → `userNotFound`, and
`error.fields.is_enum` maps to `error.json` → `fields.is_enum`. The frontend can
consume these files directly (or mirror them) to render localized messages.

`error-catalog.spec.ts` guards the catalog: it asserts both locales share the
same key structure and that every key the application throws is present. **When
you add a new error key, add it to every locale's `error.json`** or the test
fails.

## Notes

- Locale is selected per request via `?lang=`, the `Accept-Language` header, or
  the `x-lang` header (see the `I18nModule` resolvers in
  [`app.module.ts`](../src/app.module.ts)); fallback is configured by
  `FALLBACK_LANGUAGE`.
- Error responses currently return the **key** (by design). The catalog files
  also enable server-side translation if a filter is later wired to resolve them
  via `TranslationService`.
