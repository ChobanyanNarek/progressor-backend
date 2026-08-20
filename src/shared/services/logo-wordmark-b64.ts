import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const gif = fs.readFileSync(
  // eslint-disable-next-line unicorn/prefer-import-meta-properties
  path.join(path.dirname(fileURLToPath(import.meta.url)), 'logo-wordmark.gif'),
);
export const LOGO_GIF_DATA_URI = `data:image/gif;base64,${gif.toString('base64')}`;
