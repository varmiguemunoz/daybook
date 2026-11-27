// Bundles the API into dist/server.js. @daybook/domain ships TypeScript sources, so it is inlined; npm packages stay external.
import { readFileSync } from 'node:fs';
import { build } from 'esbuild';

const { dependencies } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

await build({
  entryPoints: ['src/server.ts'],
  outfile: 'dist/server.js',
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  sourcemap: true,
  external: Object.keys(dependencies).filter(name => name !== '@daybook/domain'),
  logLevel: 'info',
});
