import type { Task, TaskQuery } from '@gr8r/domain';
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
  return task.title.toLowerCase().includes(query.search.toLowerCase());
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

export class MemoryTaskRepository implements TaskRepository {
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

  async update(workspaceId: string, id: string, patch: Partial<Task>): Promise<Task | null> {
    return this.items.patch(id, patch, { workspaceId });
  }

  async remove(workspaceId: string, id: string): Promise<boolean> {
    return this.items.remove(id, { workspaceId });
  }
}
