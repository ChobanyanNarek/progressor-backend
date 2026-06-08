import { join } from 'node:path';

import { PluginMetadataGenerator } from '@nestjs/cli/lib/compiler/plugins/plugin-metadata-generator';
import { ReadonlyVisitor } from '@nestjs/swagger/dist/plugin';

/**
 * Regenerates `src/metadata.ts` (the @nestjs/swagger plugin metadata) for the
 * SWC builder, which — unlike the tsc builder — does not emit it during build.
 * Run via `pnpm metadata:generate`.
 */
const sourceDir = join(process.cwd(), 'src');

const generator = new PluginMetadataGenerator();

generator.generate({
  visitors: [
    new ReadonlyVisitor({ introspectComments: true, pathToSource: sourceDir }),
  ],
  outputDir: sourceDir,
  watch: false,
  tsconfigPath: 'tsconfig.json',
});
