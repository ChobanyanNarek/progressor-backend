import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

/**
 * Loads a JSON blob of environment variables from Google Secret Manager and
 * merges it into `process.env`. This is the GCP analog of the AWS Secrets
 * Manager `loadSecrets()` helper: one secret holds a JSON object of every
 * runtime variable, e.g.
 *
 *   { "DB_USERNAME": "ghost_app_user", "DB_PASSWORD": "...", "JWT_PRIVATE_KEY": "..." }
 *
 * Point the loader at that secret via `SECRET_MANAGER_RESOURCE`, either as a
 * full version resource name
 *   projects/<project>/secrets/<name>/versions/latest
 * or without the version suffix (`/versions/latest` is assumed).
 *
 * Authentication uses Application Default Credentials. On Cloud Run that is the
 * service's runtime service account, which needs `roles/secretmanager.secretAccessor`.
 */
export async function loadSecrets(): Promise<void> {
  const resource = process.env.SECRET_MANAGER_RESOURCE;

  if (!resource) {
    /*
     * No JSON-blob secret configured. Env vars are provided directly by the
     * runtime (Cloud Run --set-secrets, or a local .env), so there's nothing
     * to load here — skip instead of failing the boot.
     */
    return;
  }

  // Accept either a full version resource name or just the secret path.
  const name = resource.includes('/versions/')
    ? resource
    : `${resource}/versions/latest`;

  // Create a Secret Manager client (uses Application Default Credentials).
  const client = new SecretManagerServiceClient();

  /*
   * Accesses the payload of the requested secret version. We rethrow any
   * error by default (missing secret, missing accessor permission, etc.) so
   * the app fails fast instead of booting with an incomplete config.
   * See https://cloud.google.com/secret-manager/docs/access-secret-version
   */
  const [version] = await client.accessSecretVersion({ name });

  const payload = version.payload?.data?.toString();

  if (!payload) {
    throw new Error(`Secret ${name} has an empty payload`);
  }

  const secrets = JSON.parse(payload) as Record<string, string>;

  Object.assign(process.env, secrets);
}
