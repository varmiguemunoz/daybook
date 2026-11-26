import { createContext, useContext, type ReactNode } from 'react';
import { WIKI_PREFIX } from '../lib/remark-wikilinks';

export interface WikiResolver {
  exists: (title: string) => boolean;
  open: (title: string) => void;
}

export const WikiContext = createContext<WikiResolver | null>(null);

interface AnchorProps {
  href?: string;
  title?: string;
  children?: ReactNode;
}

export function MarkdownAnchor({ href, title, children }: AnchorProps) {
  const wiki = useContext(WikiContext);
  if (!href?.startsWith(WIKI_PREFIX) || !wiki) {
    return (
      <a href={href} title={title} target="_blank" rel="noreferrer">
        {children}
      </a>
    );
  }
  const name = decodeURIComponent(href.slice(WIKI_PREFIX.length));
  const found = wiki.exists(name);
  return (
    <a
      href={href}
      className={`wikilink ${found ? '' : 'missing'}`.trim()}
      title={found ? `Open “${name}”` : `No note named “${name}” yet. Click to create it.`}
      onClick={event => {
        event.preventDefault();
        wiki.open(name);
      }}
    >
      {children}
    </a>
  );
}
