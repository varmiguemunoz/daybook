import type { Task, TaskQuery } from '@daybook/domain';
import type { TaskRepository } from '../../ports/repositories';
import type { Collection } from './collection';

function matchesWorkspace(task: Task, workspaceId: string): boolean {
  return task.workspaceId === workspaceId;
}

function matchesProject(task: Task, query: TaskQuery): boolean {
  return !query.projectId || task.projectId === query.projectId;
}

function matchesStatus(task: Task, query: TaskQuery): boolean {
  return !query.status?.length || query.status.includes(task.status);
}

function matchesPriority(task: Task, query: TaskQuery): boolean {
  return !query.priority?.length || query.priority.includes(task.priority);
}

function matchesAssignee(task: Task, query: TaskQuery): boolean {
  if (!query.assigneeId?.length) return true;
  return Boolean(task.assigneeId) && query.assigneeId.includes(task.assigneeId as string);
}

function matchesLabel(task: Task, query: TaskQuery): boolean {
  if (!query.label?.length) return true;
  return query.label.some(label => task.labels.includes(label as Task['labels'][number]));
}

function matchesDue(task: Task, query: TaskQuery): boolean {
  if (!query.dueBefore) return true;
  if (!task.dueDate) return false;
  return task.dueDate <= query.dueBefore;
}

function matchesSearch(task: Task, query: TaskQuery): boolean {
  if (!query.search) return true;
  const term = query.search.toLowerCase();
  return task.title.toLowerCase().includes(term) || task.key.toLowerCase().includes(term);
}

function matches(task: Task, workspaceId: string, query: TaskQuery): boolean {
  return (
    matchesWorkspace(task, workspaceId) &&
    matchesProject(task, query) &&
    matchesStatus(task, query) &&
    matchesPriority(task, query) &&
    matchesAssignee(task, query) &&
    matchesLabel(task, query) &&
    matchesDue(task, query) &&
    matchesSearch(task, query)
  );
}

function keyNumber(task: Task): number {
  const parsed = Number(task.key.split('-').pop());
  return Number.isFinite(parsed) ? parsed : 0;
}

export class MemoryTaskRepository implements TaskRepository {
  private readonly sequences = new Map<string, number>();

  constructor(private readonly items: Collection<Task>) {}

  async list(workspaceId: string, query: TaskQuery): Promise<Task[]> {
    return this.items
      .all()
      .filter(task => matches(task, workspaceId, query))
      .sort((a, b) => a.order - b.order);
  }

  async findById(workspaceId: string, id: string): Promise<Task | null> {
    return this.items.find(id, { workspaceId });
  }

  async create(task: Task): Promise<Task> {
    return this.items.insert(task);
  }

  async count(workspaceId: string): Promise<number> {
    return this.items.filter({ workspaceId }).length;
  }

  async update(workspaceId: string, id: string, patch: Partial<Task>): Promise<Task | null> {
    return this.items.patch(id, patch, { workspaceId });
  }

  async remove(workspaceId: string, id: string): Promise<boolean> {
    return this.items.remove(id, { workspaceId });
  }

  async nextKeyNumber(workspaceId: string): Promise<number> {
    const next = (this.sequences.get(workspaceId) ?? Math.max(0, ...this.items.filter({ workspaceId }).map(keyNumber))) + 1;
    this.sequences.set(workspaceId, next);
    return next;
  }
}
