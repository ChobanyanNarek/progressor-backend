# Error Code Reference

The API returns a stable, machine-readable **error code** in the `message`
field — never a server-localized sentence. The frontend maps codes to
user-facing copy and owns all localization. See
[ADR-0015](adr/0015-api-errors-return-codes-not-translations.md).

This page is the contract: the list of codes the frontend must handle. The
"Meaning" column is developer documentation, **not** display copy.

## Domain / auth / resource codes

| Code | HTTP | Meaning |
|---|---|---|
| `error.userNotFound` | 404 | No user matches the id/email |
| `error.invalidCredentials` | 401 | Wrong password on a known account |
| `error.accountDisabled` | 403 | Account is DISABLED; login refused (pre-existing tokens are rejected with a bare 401) |
| `error.invalidTmpKey` | 422 | Temporary upload key is invalid/expired |
| `error.fileNotImage` | 422 | Uploaded file is not a valid image |
| `error.phoneNumber` | 422 | Phone number failed validation |
| `error.pageType` | 500 | Internal pagination misuse |
| `error.memoryPointNotFound` | 404 | No memory point matches the id (or not owned) |
| `error.memoryPointNotEditable` | 403 | Memory point is past the editable state |
| `error.memoryPointSourceNotUploaded` | 403 | Photo/audio not uploaded before saving details |
| `error.userExists` | 409 | A user with that email already exists (create/edit) |
| `error.unique.email` | 409 | Email already in use (DB unique constraint) |
| `error.aiGenerationFailed` | 500 | Starting the AI video generation failed for a non-recoverable reason (provider 5xx, network error, internal error); the generation row is marked `FAILED` |
| `error.aiGenerationInvalidMedia` | 422 | The provider rejected the source media at create time (4xx — unfetchable/undecodable/invalid photo or audio); client can re-upload valid media. Row marked `FAILED` |
| `error.duplicateMemoryPoint` | 409 | A memory point already exists within `DUPLICATE_RADIUS_METERS` of the requested coordinates; retry with `force: true` to override. Response body includes `nearestId` (UUID of nearest point) and `distanceMeters` (distance in metres). |

## Validation field codes (`error.fields.*`)

On `422`, `message` is an array of `ValidationError` objects; each `constraints`
value is a code of the form `error.fields.{snake_case_constraint}` derived from
the failing class-validator rule. The set is open-ended — treat an unknown
`error.fields.*` code as a generic "invalid field" fallback. Common ones:

`is_not_empty`, `is_string`, `is_email`, `is_enum`, `is_int`, `is_number`,
`is_boolean`, `is_uuid`, `is_date`, `is_date_after_or_equal`, `is_url`,
`min_length`, `max_length`, `min`, `max`, `matches`.

Shape — the frontend walks each entry's `constraints` values and looks each code
up in its own locale files:

```jsonc
{
  "statusCode": 422,
  "message": [
    { "property": "email", "constraints": { "isEmail": "error.fields.is_email" } },
    { "property": "role",  "constraints": { "isEnum":  "error.fields.is_enum"  } }
  ]
}
```

A single-key error (non-422) is just `{ "statusCode": 401, "message": "error.invalidCredentials" }`.

## Auth 401s

Authentication failures (`jwt.strategy`, guards, Passport) surface as a bare
`401` with the framework reason phrase `"Unauthorized"` in `message` — there is
no `error.*` code. Key off the **`401` status**, not the message, for the
"session expired / not logged in" case.
