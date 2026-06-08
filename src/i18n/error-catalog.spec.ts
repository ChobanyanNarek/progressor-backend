import { readFileSync } from 'node:fs';
import { join } from 'node:path';

function flatten(obj: Record<string, unknown>, prefix = ''): string[] {
  const keys: string[] = [];

  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;

    if (value !== null && typeof value === 'object') {
      keys.push(...flatten(value as Record<string, unknown>, path));
    } else {
      keys.push(path);
    }
  }

  return keys.sort();
}

function readCatalog(locale: string): Record<string, unknown> {
  const raw = readFileSync(
    join(process.cwd(), 'src', 'i18n', locale, 'error.json'),
    'utf8',
  );

  return JSON.parse(raw) as Record<string, unknown>;
}

describe('i18n error catalog', () => {
  const en = flatten(readCatalog('en_US'));
  const ru = flatten(readCatalog('ru_RU'));

  it('keeps the same key structure across locales', () => {
    expect(ru).toEqual(en);
  });

  it('covers every error key the application can throw', () => {
    const requiredKeys = [
      'userNotFound',
      'invalidCredentials',
      'unique.email',
      'fileNotImage',
      'invalidTmpKey',
      'memoryPointNotFound',
      'memoryPointNotEditable',
      'pageType',
      'phoneNumber',
      'fields.is_enum',
    ];

    for (const key of requiredKeys) {
      expect(en).toContain(key);
    }
  });
});
