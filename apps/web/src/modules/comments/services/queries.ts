import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys, apiFetch } from '../../core/services/api-client';
import type { Comment, CreateCommentInput } from '@daybook/domain';

export function useComments(taskId: string) {
  return useQuery({ queryKey: queryKeys.comments(taskId), queryFn: () => apiFetch<Comment[]>(`/api/comments/tasks/${taskId}`) });
}

export function useCreateComment(taskId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCommentInput) => apiFetch<Comment>(`/api/comments/tasks/${taskId}`, { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.comments(taskId) }),
  });
}
