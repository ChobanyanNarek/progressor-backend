# Error messages & i18n keys

API errors return a stable **i18n key** as the `message`, never human-readable
prose. The **frontend owns localization** — it maps each key to copy from its
own locale files. This keeps the API language-agnostic; the backend never ships
translated error text.

## Error response shape

Most errors return a single key:

```jsonc
// e.g. POST /auth/login with a wrong password
{
  "statusCode": 401,
  "message": "error.invalidCredentials"
}
```

Validation failures (HTTP `422`) return an **array** — one entry per failed
field, with a key per failed constraint. The constraint message is rewritten to
`error.fields.{constraint}` (snake_cased class-validator constraint name) by
[`HttpExceptionFilter`](../src/filters/bad-request.filter.ts):

```jsonc
{
  "statusCode": 422,
  "message": [
    {
      "property": "email",
      "constraints": { "isEmail": "error.fields.is_email" }
    },
    {
      "property": "role",
      "constraints": { "isEnum": "error.fields.is_enum" }
    }
  ]
}
```

The frontend renders `message` directly (single key) or walks each entry's
`constraints` values (422), looking each key up in its own localization files.

## Keys the API can throw

Domain keys (one per error):

| Key | Source |
|---|---|
| `error.userNotFound` | user lookup |
| `error.invalidCredentials` | auth login (added by the auth PR) |
| `error.invalidTmpKey` | file upload |
| `error.fileNotImage` | file upload |
| `error.memoryPointNotFound` | memory points |
| `error.memoryPointNotEditable` | memory points |
| `error.pageType` | memory points |
| `error.phoneNumber` | phone validation |
| `error.unique.email` | DB unique constraint ([`constraint-errors.ts`](../src/filters/constraint-errors.ts)) |

Validation keys are dynamic: `error.fields.{constraint}`, where `{constraint}`
is the snake_cased class-validator constraint name (`is_email`, `is_enum`,
`min_length`, `max_length`, `is_uuid`, `matches`, …). The frontend should have a
generic `error.fields.*` fallback for any unrecognized constraint.

## Notes

- Error responses return the **key** by design — there is no server-side error
  translation. Do not add translated `error.json` files; localization is the
  frontend's responsibility.
- The `nestjs-i18n` setup (`I18nModule`, `?lang=` / `Accept-Language` / `x-lang`
  resolvers, `FALLBACK_LANGUAGE`) translates **success-response DTO fields**
  (`@DynamicTranslate` / `@StaticTranslate`) — a separate concern from errors.
- When you add a new thrown error key, add a row to the table above so the
  frontend knows to localize it.
