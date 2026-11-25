import fs from 'node:fs';
import path from 'node:path';
import react from '@vitejs/plugin-react';
import { icons as lucide } from 'lucide';
import { defineConfig } from 'vitest/config';

const ICONS_ID = 'virtual:icons';
const ICONS_RESOLVED = '\0' + ICONS_ID;
const SOURCE_EXTENSIONS = /\.(ts|tsx)$/;
const QUOTED_TOKEN = /['"`]([a-z][a-z0-9]*(?:-[a-z0-9]+)*)['"`]/g;

function walk(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(full);
    return SOURCE_EXTENSIONS.test(entry.name) ? [full] : [];
  });
}

function pascalCase(name: string): string {
  return name
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

function iconMarkup(node: unknown[]): string {
  const children = node[0] === 'svg' ? node[2] : node;
  return (children as Array<[string, Record<string, string>]>)
    .map(
      ([tag, attributes]) =>
        `<${tag} ${Object.entries(attributes)
          .filter(([key]) => key !== 'key')
          .map(([key, value]) => `${key}="${value}"`)
          .join(' ')}/>`,
    )
    .join('');
}

/** Exposes only the Lucide icons the web sources name, mirroring the legacy build. */
function lucideSubset() {
  const table = lucide as unknown as Record<string, unknown[] | undefined>;
  return {
    name: 'lucide-subset',
    resolveId: (id: string) => (id === ICONS_ID ? ICONS_RESOLVED : null),
    load(id: string) {
      if (id !== ICONS_RESOLVED) return null;
      const text = walk(path.resolve('src'))
        .map(file => fs.readFileSync(file, 'utf8'))
        .join('\n');
      const tokens = [...text.matchAll(QUOTED_TOKEN)].map(match => match[1]).filter((token): token is string => Boolean(token));
      const names = [...new Set(tokens)].filter(name => table[pascalCase(name)]).sort();
      const subset = Object.fromEntries(
        names.map(name => {
          const node = table[pascalCase(name)];
          return [name, node ? iconMarkup(node) : ''];
        }),
      );
      return `export const ICONS = ${JSON.stringify(subset)};`;
    },
  };
}

export default defineConfig({
  plugins: [lucideSubset(), react()],
  server: { port: 5175 },
  test: { environment: 'node', include: ['src/**/*.test.{ts,tsx}'] },
});
