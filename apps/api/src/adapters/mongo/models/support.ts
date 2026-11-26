import { Schema } from 'mongoose';

const workspaceSchema = new Schema(
  { _id: String, clerkOrgId: { type: String, required: true, unique: true }, name: String, color: String, createdAt: Number },
  { versionKey: false },
);

const memberSchema = new Schema(
  {
    _id: String,
    workspaceId: { type: String, required: true },
    name: String,
    email: { type: String, index: true },
    role: String,
    title: String,
    color: String,
    status: String,
    timezone: String,
    lastSeenAt: { type: Number, default: null },
    clerkUserId: { type: String, required: true },
    createdAt: Number,
    updatedAt: Number,
  },
  { versionKey: false },
);

memberSchema.index({ workspaceId: 1, clerkUserId: 1 }, { unique: true });
memberSchema.index({ clerkUserId: 1 });

const activitySchema = new Schema(
  {
    _id: String,
    workspaceId: { type: String, required: true },
    actorId: { type: String, default: null },
    verb: String,
    taskId: { type: String, default: null },
    projectId: { type: String, default: null },
    detail: { type: String, default: '' },
    at: { type: Number, index: true },
  },
  { versionKey: false },
);

activitySchema.index({ workspaceId: 1, at: -1 });

export const WorkspaceModel = { name: 'Workspace', schema: workspaceSchema };
export const MemberModel = { name: 'Member', schema: memberSchema };
export const ActivityModel = { name: 'Activity', schema: activitySchema };

const teamSchema = new Schema(
  {
    _id: String,
    workspaceId: { type: String, required: true },
    name: String,
    icon: String,
    color: String,
    description: { type: String, default: '' },
    memberIds: { type: [String], default: [] },
    createdAt: Number,
    updatedAt: Number,
  },
  { versionKey: false },
);
teamSchema.index({ workspaceId: 1 });
export const TeamModel = { name: 'Team', schema: teamSchema };

const commentSchema = new Schema(
  {
    _id: String,
    workspaceId: { type: String, required: true },
    taskId: { type: String, required: true, index: true },
    authorId: String,
    body: String,
    reactions: { type: Schema.Types.Mixed, default: {} },
    createdAt: Number,
    editedAt: { type: Number, default: null },
  },
  { versionKey: false },
);
commentSchema.index({ workspaceId: 1, taskId: 1, createdAt: 1 });
export const CommentModel = { name: 'Comment', schema: commentSchema };

const notificationSchema = new Schema(
  {
    _id: String,
    workspaceId: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    type: String,
    actorId: { type: String, default: null },
    taskId: { type: String, default: null },
    projectId: { type: String, default: null },
    text: String,
    snippet: { type: String, default: '' },
    read: { type: Boolean, default: false, index: true },
    channel: { type: String, default: 'inapp' },
    emailedAt: { type: Number, default: null },
    at: { type: Number, index: true },
  },
  { versionKey: false },
);
notificationSchema.index({ userId: 1, read: 1, at: -1 });
export const NotificationModel = { name: 'Notification', schema: notificationSchema };
