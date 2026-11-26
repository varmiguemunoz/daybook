import { parseWikiLink, WIKILINK } from '@daybook/domain';

interface MdNode {
  type: string;
  value?: string;
  url?: string;
  children?: MdNode[];
}

export const WIKI_PREFIX = '#wiki/';

function split(value: string): MdNode[] {
  const nodes: MdNode[] = [];
  let last = 0;
  for (const match of value.matchAll(WIKILINK)) {
    const { title, label } = parseWikiLink(match);
    const start = match.index ?? 0;
    if (start > last) nodes.push({ type: 'text', value: value.slice(last, start) });
    nodes.push({ type: 'link', url: WIKI_PREFIX + encodeURIComponent(title), children: [{ type: 'text', value: label }] });
    last = start + match[0].length;
  }
  if (last < value.length) nodes.push({ type: 'text', value: value.slice(last) });
  return nodes;
}

function walk(node: MdNode): void {
  if (!node.children || node.type === 'link' || node.type === 'linkReference') return;
  node.children = node.children.flatMap(child => {
    if (child.type === 'text' && child.value?.includes('[[')) return split(child.value);
    walk(child);
    return [child];
  });
}

// Turns [[Title]] in text (never in code) into links that the note view resolves by title.
export function remarkWikiLinks() {
  return (tree: MdNode) => walk(tree);
}
