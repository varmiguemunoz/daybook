import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateFolderInput, CreateNoteInput, Folder, Note, NoteDetail, NoteSummary, UpdateFolderInput, UpdateNoteInput } from '@daybook/domain';
import { apiFetch, queryKeys } from '../../core/services/api-client';

const json = (body: unknown) => ({ body: JSON.stringify(body) });

export function useFolders() {
  return useQuery({ queryKey: queryKeys.folders, queryFn: () => apiFetch<Folder[]>('/api/folders') });
}

// Summaries only (no body), so the whole index stays cheap and filtering happens locally.
export function useNoteIndex() {
  return useQuery({ queryKey: queryKeys.notes, queryFn: () => apiFetch<NoteSummary[]>('/api/notes') });
}

export function useNote(id: string | null) {
  return useQuery({ queryKey: queryKeys.note(id ?? ''), queryFn: () => apiFetch<NoteDetail>(`/api/notes/${id}`), enabled: Boolean(id) });
}

function useFolderMutation<Variables, Result>(mutationFn: (variables: Variables) => Promise<Result>) {
  const client = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: queryKeys.folders });
      void client.invalidateQueries({ queryKey: ['notes'] });
    },
  });
}

export function useCreateFolder() {
  return useFolderMutation((input: CreateFolderInput) => apiFetch<Folder>('/api/folders', { method: 'POST', ...json(input) }));
}

export function useUpdateFolder() {
  return useFolderMutation(({ id, patch }: { id: string; patch: UpdateFolderInput }) =>
    apiFetch<Folder>(`/api/folders/${id}`, { method: 'PATCH', ...json(patch) }),
  );
}

export function useDeleteFolder() {
  return useFolderMutation((id: string) => apiFetch<void>(`/api/folders/${id}`, { method: 'DELETE' }));
}

export function useCreateNote() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateNoteInput) => apiFetch<Note>('/api/notes', { method: 'POST', ...json(input) }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['notes'] }),
  });
}

// Saving is explicit, so the cache takes the server's answer instead of an optimistic guess.
function useNoteWrite<Variables>(mutationFn: (variables: Variables) => Promise<Note>) {
  const client = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: note => {
      client.setQueryData<NoteDetail>(queryKeys.note(note.id), detail => (detail ? { ...detail, note } : detail));
      void client.invalidateQueries({ queryKey: ['notes'] });
    },
  });
}

export function useSaveNote() {
  return useNoteWrite(({ id, patch }: { id: string; patch: UpdateNoteInput }) => apiFetch<Note>(`/api/notes/${id}`, { method: 'PATCH', ...json(patch) }));
}

export function useSetNoteLinks() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, linkIds }: { id: string; linkIds: string[] }) => apiFetch<Note>(`/api/notes/${id}/links`, { method: 'PUT', ...json({ linkIds }) }),
    // Both ends change: this note's links and the target's backlinks.
    onSuccess: () => client.invalidateQueries({ queryKey: ['note'] }),
  });
}

export function useDeleteNote() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/api/notes/${id}`, { method: 'DELETE' }),
    onSuccess: (_result, id) => {
      client.removeQueries({ queryKey: queryKeys.note(id) });
      void client.invalidateQueries({ queryKey: ['notes'] });
      void client.invalidateQueries({ queryKey: ['note'] });
    },
  });
}
