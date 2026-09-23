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
| `error.payloadTooLarge` | 413 | Request body exceeds the 20mb limit (measured after gzip decompression) |
| `error.invalidBody` | 400 | Request body is malformed JSON or uses an unsupported encoding |
| `error.credentialVaultUnavailable` | 503 | The integration token vault has no encryption key configured |
| `error.credentialNotFound` | 404 | No stored token for this connection (for the calling user) |
| `error.credentialRequired` | 400 | A proxy call carried neither a token nor a connection id |
| `error.invalidProvider` | 400 | Credential provider is not one of jira, github, gitlab |
| `error.proxyPathNotAllowed` | 400 | A GitHub/GitLab proxy path is outside the read-only allow-list |
| `error.syncTimezoneUnknown` | 400 | A server-side sync was requested without a timezone, and the user has not saved one yet (ADR-0019); send `timezone` with `POST /pm-tracker/sync` |
| `error.hookNotFound` | 404 | A webhook call with an unknown token |
| `error.pmTrackerStateMigrated` | 409 | `PUT /pm-tracker/state` after the user moved to per-record storage (ADR-0018); the client must reload and use `/pm-tracker/records` |
| `error.invalidRecord` | — | Not an HTTP error: the `reason` of an entry in a records commit's `rejected` list (a task without an id or `YYYY-MM-DD` date, or a section named `tasks`/`_v` or not a plain identifier) |
| `error.phoneNumber` | 422 | Phone number failed validation |
| `error.pageType` | 500 | Internal pagination misuse |
| `error.memoryPointNotFound` | 404 | No memory point matches the id (or not owned) |
| `error.memoryPointNotEditable` | 403 | Memory point is not in an admin-editable state (admin edits/media replacement are only allowed in `ADMIN_REVIEWING`/`REJECTED`) |
| `error.memoryPointSourceNotUploaded` | 403 | A provided photo/audio path is invalid or the file is not in storage (creator submit / admin media edit) |
| `error.memoryPointNotReadyForGeneration` | 422 | Admin triggered generation while required inputs are missing; response carries a `missingFields` array (subset of `title`, `sourcePhotoUrl`, `descriptionOrAudio` — the last meaning neither a description nor an uploaded voice is present) |
| `error.memoryPointNotOwned` | 403 | Caller does not own the memory point |
| `error.invalidStatusTransition` | 400 | Requested review-pipeline status transition is not allowed |
| `error.invalidPublicationStateTransition` | 400 | Requested publication-state transition is not allowed |
| `error.userExists` | 409 | A user with that email already exists (create/edit) |
| `error.unique.email` | 409 | Email already in use (DB unique constraint) |
| `error.aiGenerationFailed` | 500 | Starting the AI video generation failed for a non-recoverable reason (provider 5xx, network error, internal error); the generation row is marked `FAILED` |
| `error.aiGenerationInvalidMedia` | 422 | The provider rejected the source media at create time (4xx — unfetchable/undecodable/invalid photo or audio); client can re-upload valid media. Row marked `FAILED` |
| `error.duplicateMemoryPoint` | 409 | A memory point already exists within `DUPLICATE_RADIUS_METERS` of the requested coordinates; retry with `force: true` to override. Response body includes `nearestId` (UUID of nearest point) and `distanceMeters` (distance in metres). |
| `error.arcoreTokenSigningFailed` | 500 | Signing the ARCore Cloud Anchor auth token failed (missing/invalid signer key or crypto error); the real cause is logged server-side, never returned |

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
