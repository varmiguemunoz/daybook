import type { NoteSummary } from '@daybook/domain';
import type { WikiResolver } from '../components/WikiContext';
import { useNoteIndex } from '../services/queries';

// [[Title]] opens the note with that title, or creates it next to the current note when none exists.
export function useWikiResolver(
  folderId: string | null,
  onOpen: (note: NoteSummary) => void,
  onCreate: (folderId: string | null, title: string) => void,
): WikiResolver {
  const { data: notes = [] } = useNoteIndex();
  const find = (title: string) => notes.find(note => note.title.toLowerCase() === title.trim().toLowerCase());

  return {
    exists: title => Boolean(find(title)),
    open: title => {
      const found = find(title);
      if (found) onOpen(found);
      else onCreate(folderId, title.trim());
    },
  };
}
