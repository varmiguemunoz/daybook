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
    teamId: { type: String, default: null },
    color: String,
    status: String,
    timezone: String,
    lastSeenAt: { type: Number, default: null },
    clerkUserId: { type: String, required: true },
    preferences: { type: Schema.Types.Mixed, default: {} },
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

const fileSchema = new Schema(
  {
    _id: String,
    workspaceId: { type: String, required: true },
    projectId: { type: String, required: true, index: true },
    taskId: { type: String, default: null, index: true },
    name: String,
    type: String,
    size: String,
    sizeBytes: Number,
    mimeType: String,
    r2Key: String,
    r2Bucket: String,
    uploadedBy: String,
    at: { type: Number, index: true },
  },
  { versionKey: false },
);
fileSchema.index({ projectId: 1, at: -1 });
export const FileModel = { name: 'File', schema: fileSchema };

const eventSchema = new Schema(
  {
    _id: String,
    workspaceId: { type: String, required: true, index: true },
    projectId: { type: String, default: null },
    title: String,
    date: { type: String, index: true },
    time: String,
    createdAt: Number,
    createdBy: String,
  },
  { versionKey: false },
);
eventSchema.index({ workspaceId: 1, date: 1 });
export const EventModel = { name: 'CalendarEvent', schema: eventSchema };

const savedViewSchema = new Schema(
  {
    _id: String,
    workspaceId: { type: String, required: true, index: true },
    ownerId: String,
    projectId: { type: String, default: null },
    name: String,
    type: String,
    filters: { type: [Schema.Types.Mixed], default: [] },
    sort: { type: Schema.Types.Mixed, default: { field: 'manual', direction: 1 } },
    group: String,
    query: String,
    hiddenColumns: { type: [String], default: [] },
    createdAt: Number,
    updatedAt: Number,
  },
  { versionKey: false },
);
export const SavedViewModel = { name: 'SavedView', schema: savedViewSchema };

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
