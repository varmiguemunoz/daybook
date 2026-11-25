import { useState } from 'react';
import type { CreateTaskPayload, Priority, TaskStatus } from '@daybook/domain';
import type { TaskDefaults } from '../../views/lib/view-model';

export interface TaskDraft {
  title: string;
  status: TaskStatus;
  priority: Priority;
  assigneeId: string | null;
  dueDate: string;
}

export function draftFrom(source: TaskDefaults & { title?: string }): TaskDraft {
  return {
    title: source.title ?? '',
    status: source.status ?? 'todo',
    priority: source.priority ?? 'none',
    assigneeId: source.assigneeId ?? null,
    dueDate: source.dueDate ?? '',
  };
}

export function payloadOf(draft: TaskDraft): CreateTaskPayload {
  return { ...draft, title: draft.title.trim(), dueDate: draft.dueDate || null };
}

export function useTaskDraft(initial: TaskDraft) {
  const [draft, setDraft] = useState(initial);

  function update<Field extends keyof TaskDraft>(field: Field, value: TaskDraft[Field]) {
    setDraft(current => ({ ...current, [field]: value }));
  }

  return { draft, update };
}
