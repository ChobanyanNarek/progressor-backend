import bcrypt from 'bcrypt';

/**
 * generate hash from password or string
 * @param {string} password
 * @returns {string}
 */
export function generateHash(password: string): string {
  return bcrypt.hashSync(password, 10);
}

/**
 * validate text with hash
 * @param {string} password
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
export function validateHash(
  password: string | undefined,
  hash: string | undefined | null,
): Promise<boolean> {
  if (!password || !hash) {
    return Promise.resolve(false);
  }

  return bcrypt.compare(password, hash);
}

/**
 * Parse a comma-separated CORS allowlist env value into a clean origin array.
 *
 * Trims whitespace around each entry and drops empties, so values like
 * `"http://localhost:3000, http://127.0.0.1:3000"` resolve correctly. Returns an
 * empty array when unset — origins are configured explicitly via `CORS_ORIGINS`
 * (ADR-0002), with no code-side default.
 */
export function parseCorsOrigins(raw: string | undefined): string[] {
  if (!raw) {
    return [];
  }

  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

/**
 * Escape `LIKE` / `ILIKE` wildcards (`%`, `_`) and the escape char (`\`) in
 * user-supplied search text so they match literally instead of acting as
 * patterns. Postgres uses backslash as the default `LIKE` escape character, so
 * `\` must be escaped first (the regex handles all three at once). Wrap the
 * result in `%…%` for a contains-search.
 *
 * @example `'100%_off'` -> `'100\\%\\_off'`
 */
export function escapeLikePattern(value: string): string {
  return value.replaceAll(/[%\\_]/g, String.raw`\$&`);
}

export function getVariableName(getVar: () => unknown): string {
  const m = /\(\)=>(.*)/.exec(
    getVar.toString().replaceAll(/(\r\n|\n|\r|\s)/gm, ''),
  );

  if (!m) {
    throw new Error(
      "The function does not contain a statement matching 'return variableName;'",
    );
  }

  const fullMemberName = m[1]!;

  const memberParts = fullMemberName.split('.');

  return memberParts.at(-1)!;
}
