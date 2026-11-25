import { Schema } from 'mongoose';

const subtaskSchema = new Schema({ id: String, title: String, done: Boolean }, { _id: false });
const attachmentSchema = new Schema({ id: String, name: String, type: String, size: String, uploadedBy: String, at: Number }, { _id: false });

const taskSchema = new Schema(
  {
    _id: String,
    workspaceId: { type: String, required: true },
    projectId: { type: String, required: true },
    key: { type: String, required: true },
    title: { type: String, required: true },
    status: { type: String, required: true },
    assigneeId: { type: String, default: null },
    priority: { type: String, default: 'none' },
    startDate: { type: String, default: null },
    dueDate: { type: String, default: null },
    labels: { type: [String], default: [] },
    subtasks: { type: [subtaskSchema], default: [] },
    attachments: { type: [attachmentSchema], default: [] },
    dependencyIds: { type: [String], default: [] },
    description: { type: String, default: '' },
    estimate: { type: String, default: null },
    order: { type: Number, default: 0 },
    favorite: { type: Boolean, default: false },
    recurrence: { type: String, default: null },
    createdAt: Number,
    updatedAt: Number,
    completedAt: { type: Number, default: null },
  },
  { versionKey: false },
);

taskSchema.index({ workspaceId: 1, projectId: 1, status: 1 });
taskSchema.index({ workspaceId: 1, assigneeId: 1, dueDate: 1 });
taskSchema.index({ title: 'text' });
taskSchema.index({ workspaceId: 1, key: 1 }, { unique: true });

const taskSequenceSchema = new Schema({ _id: String, value: { type: Number, required: true } }, { versionKey: false });

export const TaskModel = { name: 'Task', schema: taskSchema };
export const TaskSequenceModel = { name: 'TaskSequence', schema: taskSequenceSchema };
