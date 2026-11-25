import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys, apiFetch } from '../../shared/api/client';
import type { FileRecord } from '@gr8r/domain';

export function useFiles(projectId?: string, taskId?: string) {
  return useQuery({ queryKey: queryKeys.files(projectId ?? 'all', taskId), queryFn: () => apiFetch<FileRecord[]>(`/api/files${taskId ? `?taskId=${taskId}` : ''}`) });
}

export function usePresignUpload() {
  return useMutation({
    mutationFn: (input: { projectId?: string | null; name: string; mimeType: string }) => apiFetch<{ fileId: string; uploadUrl: string; key: string; bucket: string }>('/api/files/presign', { method: 'POST', body: JSON.stringify(input) }),
  });
}

export function useConfirmUpload() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { projectId?: string | null; taskId?: string | null; fileId: string; key: string; name: string; sizeBytes: number; mimeType: string }) =>
      apiFetch<FileRecord>('/api/files', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: (_data, variables) => client.invalidateQueries({ queryKey: queryKeys.files(variables.projectId ?? 'all', variables.taskId ?? undefined) }),
  });
}

export function useDeleteFile(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<void>(`/api/files/${id}`, { method: 'DELETE' }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['files'] }),
  });
}

export function useFileDownloadUrl(id: string) {
  return useMutation({
    mutationFn: () => apiFetch<{ url: string }>(`/api/files/${id}/download`, { method: 'GET' }),
  });
}
