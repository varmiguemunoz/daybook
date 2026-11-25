import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys, apiFetch } from '../../shared/api/client';
import type { Comment, CreateCommentInput } from '@gr8r/domain';

export function useComments(taskId: string) {
  return useQuery({ queryKey: queryKeys.comments(taskId), queryFn: () => apiFetch<Comment[]>(`/api/comments/tasks/${taskId}`) });
}

export function useCreateComment(taskId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCommentInput) =>
      apiFetch<Comment>(`/api/comments/tasks/${taskId}`, { method: 'POST', body: JSON.stringify({ ...input, taskId }) }),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.comments(taskId) }),
  });
}

export function useUpdateComment(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => apiFetch<Comment>(`/api/comments/${id}`, { method: 'PATCH', body: JSON.stringify({ body }) }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['comments'] }),
  });
}

export function useDeleteComment(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<void>(`/api/comments/${id}`, { method: 'DELETE' }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['comments'] }),
  });
}

export function useToggleReaction(commentId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (emoji: string) => apiFetch<Comment>(`/api/comments/${commentId}/reactions`, { method: 'POST', body: JSON.stringify({ emoji }) }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['comments'] }),
  });
}
