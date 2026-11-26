import Markdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { remarkWikiLinks } from '../lib/remark-wikilinks';
import { MarkdownAnchor } from './WikiContext';

const PLUGINS = [remarkGfm, remarkWikiLinks];
// Raw HTML stays inert because rehype-raw is never added.
const COMPONENTS: Components = { a: MarkdownAnchor };

function MarkdownBody({ body }: { body: string }) {
  return (
    <div className="markdown">
      <Markdown remarkPlugins={PLUGINS} components={COMPONENTS}>
        {body}
      </Markdown>
    </div>
  );
}

export function MarkdownView({ body, onEdit }: { body: string; onEdit: () => void }) {
  if (!body.trim()) {
    return (
      <button type="button" className="md-empty" onClick={onEdit}>
        This note is empty. Double-click here or press Edit to start writing.
      </button>
    );
  }

  return (
    <div className="md-wrap" onDoubleClick={onEdit}>
      <MarkdownBody body={body} />
    </div>
  );
}
