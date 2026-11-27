/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Task, TaskQuery } from '@daybook/domain';
import { modelFor, toDomain } from './connection';
import { TaskModel, TaskSequenceModel } from './models/task';

const TaskDocument = modelFor(TaskModel) as any;
const TaskSequenceDocument = modelFor(TaskSequenceModel) as any;
const KEY_NUMBER = { $convert: { input: { $arrayElemAt: [{ $split: ['$key', '-'] }, -1] }, to: 'int', onError: 0, onNull: 0 } };

export function escapeRegExp(value: string): string {
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
  if (!query.search) return;
  const pattern = { $regex: escapeRegExp(query.search), $options: 'i' };
  filter.$or = [{ title: pattern }, { key: pattern }];
}

export class MongoTaskRepository {
  async list(workspaceId: string, query: TaskQuery): Promise<Task[]> {
    const documents = await TaskDocument.find(taskFilter(workspaceId, query)).sort({ order: 1 }).lean();
    return documents.map((document: any) => toDomain<Task>(document) as Task);
  }

  async findById(workspaceId: string, id: string): Promise<Task | null> {
    return toDomain<Task>(await TaskDocument.findOne({ _id: id, workspaceId }).lean());
  }

  async count(workspaceId: string): Promise<number> {
    return TaskDocument.countDocuments({ workspaceId });
  }

  async create(task: Task): Promise<Task> {
    return toDomain<Task>(await TaskDocument.create({ _id: task.id, ...task })) as Task;
  }

  async update(workspaceId: string, id: string, patch: Partial<Task>): Promise<Task | null> {
    return toDomain<Task>(await TaskDocument.findOneAndUpdate({ _id: id, workspaceId }, { $set: patch }, { returnDocument: 'after', lean: true }));
  }

  async remove(workspaceId: string, id: string): Promise<boolean> {
    const result = await TaskDocument.deleteOne({ _id: id, workspaceId });
    return result.deletedCount === 1;
  }

  async nextKeyNumber(workspaceId: string): Promise<number> {
    if (!(await TaskSequenceDocument.exists({ _id: workspaceId }))) {
      const [highest] = await TaskDocument.aggregate([{ $match: { workspaceId } }, { $group: { _id: null, value: { $max: KEY_NUMBER } } }]);
      await TaskSequenceDocument.updateOne({ _id: workspaceId }, { $max: { value: highest?.value ?? 0 } }, { upsert: true });
    }
    const sequence = await TaskSequenceDocument.findOneAndUpdate({ _id: workspaceId }, { $inc: { value: 1 } }, { returnDocument: 'after', lean: true });
    return sequence.value;
  }
}
