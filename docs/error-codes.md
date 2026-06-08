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
| `error.invalidTmpKey` | 422 | Temporary upload key is invalid/expired |
| `error.fileNotImage` | 422 | Uploaded file is not a valid image |
| `error.phoneNumber` | 422 | Phone number failed validation |
| `error.pageType` | 500 | Internal pagination misuse |
| `error.memoryPointNotFound` | 404 | No memory point matches the id (or not owned) |
| `error.memoryPointNotEditable` | 403 | Memory point is past the editable state |
| `error.memoryPointSourceNotUploaded` | 403 | Photo/audio not uploaded before saving details |
| `error.unique.email` | 409 | Email already in use (DB unique constraint) |

## Validation field codes (`error.fields.*`)

On `422`, `message` is an array of `ValidationError` objects; each `constraints`
value is a code of the form `error.fields.{snake_case_constraint}` derived from
the failing class-validator rule. The set is open-ended — treat an unknown
`error.fields.*` code as a generic "invalid field" fallback. Common ones:

`is_not_empty`, `is_string`, `is_email`, `is_enum`, `is_int`, `is_number`,
`is_boolean`, `is_uuid`, `is_date`, `is_url`, `min_length`, `max_length`,
`min`, `max`, `matches`.

## Known exception that is NOT yet a code

`UserExistsException` (409) currently returns the literal string
`"User already exists"`. Match on HTTP 409 for create/invite flows until it is
migrated to `error.userExists`.
