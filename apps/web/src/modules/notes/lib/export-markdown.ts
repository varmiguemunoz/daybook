import type { Note } from '@daybook/domain';

function fileName(title: string): string {
  const slug = title
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase();
  return `${slug || 'note'}.md`;
}

// The title becomes the top heading unless the body already starts with one.
export function exportMarkdown(note: Note): void {
  const body = note.body.trimStart();
  const text = body.startsWith('# ') ? body : `# ${note.title}\n\n${body}`;
  const url = URL.createObjectURL(new Blob([text], { type: 'text/markdown;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName(note.title);
  link.click();
  URL.revokeObjectURL(url);
}
