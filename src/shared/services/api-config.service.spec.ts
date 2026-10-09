import { ApiConfigService } from './api-config.service.ts';

/*
 * The database connection moved and DB_HOST was left pointing at the address it used to
 * have. Every boot then died on ECONNREFUSED to a bare private IP, and the log named no
 * setting that could have produced it. These pin both halves of the answer: one URL can be
 * used instead of five variables that can drift apart, and the log says where it is going.
 *
 * Settings are passed as pairs rather than as an object literal — they are environment
 * variable names, which are upper case by convention and not camelCase properties.
 */

const SECRET = 'sup3rSecretPassw0rd';
const URL_HOST = 'dpg-abc123-a';

function config(...settings: Array<[string, string]>): ApiConfigService {
  const all = new Map<string, string>([
    ['NODE_ENV', 'production'],
    ['ENABLE_ORM_LOGS', 'false'],
    ...settings,
  ]);

  return new ApiConfigService({
    get: (key: string) => all.get(key),
  } as never);
}

const withUrl = (): ApiConfigService =>
  config([
    'DATABASE_URL',
    `postgresql://ghost_app:${SECRET}@${URL_HOST}/ghost_app`,
  ]);

const varSettings: Array<[string, string]> = [
  ['DB_HOST', URL_HOST],
  ['DB_PORT', '5432'],
  ['DB_USERNAME', 'ghost_app'],
  ['DB_PASSWORD', SECRET],
  ['DB_DATABASE', 'ghost_app'],
];

const withVars = (): ApiConfigService => config(...varSettings);

describe('database configuration', () => {
  it('uses a connection URL when one is given', () => {
    const cfg = withUrl().postgresConfig as { url?: string; host?: string };

    expect(cfg.url).toContain(URL_HOST);
    expect(cfg.host).toBeUndefined();
  });

  it('still accepts the five separate variables', () => {
    const cfg = withVars().postgresConfig as { host?: string; port?: number };

    expect(cfg.host).toBe(URL_HOST);
    expect(cfg.port).toBe(5432);
  });

  it('falls through to the variables when the URL is blank', () => {
    const cfg = config(['DATABASE_URL', '   '], ...varSettings)
      .postgresConfig as { host?: string };

    expect(cfg.host).toBe(URL_HOST);
  });

  it('names the host it is about to use, and which setting said so', () => {
    expect(withUrl().databaseTarget).toBe(
      `${URL_HOST}:5432/ghost_app (from DATABASE_URL)`,
    );
    expect(withVars().databaseTarget).toBe(
      `${URL_HOST}:5432/ghost_app (from DB_* variables)`,
    );
  });

  it('never puts the password in the string that gets logged', () => {
    expect(withUrl().databaseTarget).not.toContain(SECRET);
    expect(withVars().databaseTarget).not.toContain(SECRET);
  });

  it('says so plainly when the URL cannot be parsed', () => {
    expect(config(['DATABASE_URL', 'not a url']).databaseTarget).toBe(
      'an unparseable DATABASE_URL',
    );
  });
});
