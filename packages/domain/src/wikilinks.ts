// [[Title]] or [[Title|shown text]]; titles cannot contain brackets, pipes or line breaks.
export const WIKILINK = /\[\[([^[\]|\n]{1,200})(?:\|([^[\]\n]{1,200}))?\]\]/g;

export interface WikiLink {
  title: string;
  label: string;
}

export function parseWikiLink(match: RegExpMatchArray): WikiLink {
  const title = (match[1] ?? '').trim();
  return { title, label: (match[2] ?? '').trim() || title };
}

export function wikiTitles(body: string): string[] {
  const titles = [...body.matchAll(WIKILINK)].map(match => parseWikiLink(match).title.toLowerCase());
  return [...new Set(titles)].filter(Boolean);
}
