/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Task, TaskQuery } from '@gr8r/domain';
import { modelFor, toDomain } from './connection';
import { TaskModel } from './models/task';

const TaskDocument = modelFor(TaskModel) as any;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function taskFilter(workspaceId: string, query: TaskQuery): Record<string, unknown> {
  const filter: Record<string, unknown> = { workspaceId };
  applyScalarFilters(filter, query);
  applyArrayFilters(filter, query);
  applyTextFilter(filter, query);
  return filter;
}

function applyScalarFilters(filter: Record<string, unknown>, query: TaskQuery): void {
  if (query.projectId) filter.projectId = query.projectId;
  if (query.dueBefore) filter.dueDate = { $lte: query.dueBefore };
}

function applyArrayFilters(filter: Record<string, unknown>, query: TaskQuery): void {
  if (query.status?.length) filter.status = { $in: [...query.status] };
  if (query.priority?.length) filter.priority = { $in: [...query.priority] };
  if (query.assigneeId?.length) filter.assigneeId = { $in: [...query.assigneeId] };
  if (query.label?.length) filter.labels = { $in: [...query.label] };
}

function applyTextFilter(filter: Record<string, unknown>, query: TaskQuery): void {
  if (query.search) filter.title = { $regex: escapeRegExp(query.search), $options: 'i' };
}

export class MongoTaskRepository {
  async list(workspaceId: string, query: TaskQuery): Promise<Task[]> {
    const documents = await TaskDocument.find(taskFilter(workspaceId, query)).sort({ order: 1 }).lean();
    return documents.map((document: any) => toDomain<Task>(document) as Task);
  }

  async findById(workspaceId: string, id: string): Promise<Task | null> {
    return toDomain<Task>(await TaskDocument.findOne({ _id: id, workspaceId }).lean());
  }

  async create(task: Task): Promise<Task> {
    return toDomain<Task>(await TaskDocument.create({ _id: task.id, ...task })) as Task;
  }

  async update(workspaceId: string, id: string, patch: Partial<Task>): Promise<Task | null> {
    return toDomain<Task>(await TaskDocument.findOneAndUpdate({ _id: id, workspaceId }, { $set: patch }, { new: true, lean: true }));
  }

  async remove(workspaceId: string, id: string): Promise<boolean> {
    const result = await TaskDocument.deleteOne({ _id: id, workspaceId });
    return result.deletedCount === 1;
  }
}
