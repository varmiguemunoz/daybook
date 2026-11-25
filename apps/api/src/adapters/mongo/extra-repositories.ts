/* eslint-disable @typescript-eslint/no-explicit-any */
import type { CalendarEvent, Comment, FileRecord, Notification, SavedView, Team } from '@daybook/domain';
import { modelFor, toDomain } from './connection';
import { CommentModel, EventModel, FileModel, NotificationModel, SavedViewModel, TeamModel } from './models/support';

const TeamDocument = modelFor(TeamModel) as any;
const CommentDocument = modelFor(CommentModel) as any;
const FileDocument = modelFor(FileModel) as any;
const EventDocument = modelFor(EventModel) as any;
const SavedViewDocument = modelFor(SavedViewModel) as any;
const NotificationDocument = modelFor(NotificationModel) as any;
const RETURN_NEW = { returnDocument: 'after', lean: true };

function many<T>(documents: unknown[]): T[] {
  return documents.map(document => toDomain<T>(document) as T);
}

async function scopedUpdate<T>(model: any, workspaceId: string, id: string, patch: Partial<T>): Promise<T | null> {
  return toDomain<T>(await model.findOneAndUpdate({ _id: id, workspaceId }, { $set: patch }, RETURN_NEW));
}

async function scopedRemove(model: any, workspaceId: string, id: string): Promise<boolean> {
  const result = await model.deleteOne({ _id: id, workspaceId });
  return result.deletedCount > 0;
}

export class MongoTeamRepository {
  async listByWorkspace(workspaceId: string): Promise<Team[]> {
    return many<Team>(await TeamDocument.find({ workspaceId }).lean());
  }

  async findById(workspaceId: string, id: string): Promise<Team | null> {
    return toDomain<Team>(await TeamDocument.findOne({ _id: id, workspaceId }).lean());
  }

  async create(team: Team): Promise<Team> {
    return toDomain<Team>(await TeamDocument.create({ _id: team.id, ...team })) as Team;
  }

  update = (workspaceId: string, id: string, patch: Partial<Team>) => scopedUpdate<Team>(TeamDocument, workspaceId, id, patch);
  remove = (workspaceId: string, id: string) => scopedRemove(TeamDocument, workspaceId, id);
}

export class MongoCommentRepository {
  async listByTask(workspaceId: string, taskId: string): Promise<Comment[]> {
    return many<Comment>(await CommentDocument.find({ workspaceId, taskId }).sort({ createdAt: 1 }).lean());
  }

  async findById(workspaceId: string, id: string): Promise<Comment | null> {
    return toDomain<Comment>(await CommentDocument.findOne({ _id: id, workspaceId }).lean());
  }

  async create(comment: Comment): Promise<Comment> {
    return toDomain<Comment>(await CommentDocument.create({ _id: comment.id, ...comment })) as Comment;
  }

  update = (workspaceId: string, id: string, patch: Partial<Comment>) => scopedUpdate<Comment>(CommentDocument, workspaceId, id, patch);
  remove = (workspaceId: string, id: string) => scopedRemove(CommentDocument, workspaceId, id);
}

export class MongoFileRepository {
  async listByWorkspace(workspaceId: string): Promise<FileRecord[]> {
    return many<FileRecord>(await FileDocument.find({ workspaceId }).sort({ at: -1 }).lean());
  }

  async listByTask(workspaceId: string, taskId: string): Promise<FileRecord[]> {
    return many<FileRecord>(await FileDocument.find({ workspaceId, taskId }).sort({ at: -1 }).lean());
  }

  async findById(workspaceId: string, id: string): Promise<FileRecord | null> {
    return toDomain<FileRecord>(await FileDocument.findOne({ _id: id, workspaceId }).lean());
  }

  async create(file: FileRecord): Promise<FileRecord> {
    return toDomain<FileRecord>(await FileDocument.create({ _id: file.id, ...file })) as FileRecord;
  }

  remove = (workspaceId: string, id: string) => scopedRemove(FileDocument, workspaceId, id);
}

export class MongoCalendarEventRepository {
  async listByWorkspace(workspaceId: string, from?: string, to?: string): Promise<CalendarEvent[]> {
    const date = { ...(from && { $gte: from }), ...(to && { $lte: to }) };
    const filter = from || to ? { workspaceId, date } : { workspaceId };
    return many<CalendarEvent>(await EventDocument.find(filter).sort({ date: 1 }).lean());
  }

  async create(event: CalendarEvent): Promise<CalendarEvent> {
    return toDomain<CalendarEvent>(await EventDocument.create({ _id: event.id, ...event })) as CalendarEvent;
  }

  update = (workspaceId: string, id: string, patch: Partial<CalendarEvent>) => scopedUpdate<CalendarEvent>(EventDocument, workspaceId, id, patch);
  remove = (workspaceId: string, id: string) => scopedRemove(EventDocument, workspaceId, id);
}

export class MongoSavedViewRepository {
  async listByWorkspace(workspaceId: string, ownerId?: string): Promise<SavedView[]> {
    const filter = ownerId ? { workspaceId, ownerId } : { workspaceId };
    return many<SavedView>(await SavedViewDocument.find(filter).lean());
  }

  async findById(workspaceId: string, id: string): Promise<SavedView | null> {
    return toDomain<SavedView>(await SavedViewDocument.findOne({ _id: id, workspaceId }).lean());
  }

  async create(view: SavedView): Promise<SavedView> {
    return toDomain<SavedView>(await SavedViewDocument.create({ _id: view.id, ...view })) as SavedView;
  }

  update = (workspaceId: string, id: string, patch: Partial<SavedView>) => scopedUpdate<SavedView>(SavedViewDocument, workspaceId, id, patch);
  remove = (workspaceId: string, id: string) => scopedRemove(SavedViewDocument, workspaceId, id);
}

export class MongoNotificationRepository {
  async listByUser(userId: string, unreadOnly: boolean, limit: number): Promise<Notification[]> {
    const filter = unreadOnly ? { userId, read: false } : { userId };
    return many<Notification>(await NotificationDocument.find(filter).sort({ at: -1 }).limit(limit).lean());
  }

  async create(notification: Notification): Promise<Notification> {
    return toDomain<Notification>(await NotificationDocument.create({ _id: notification.id, ...notification })) as Notification;
  }

  async update(id: string, patch: Partial<Notification>): Promise<Notification | null> {
    return toDomain<Notification>(await NotificationDocument.findByIdAndUpdate(id, { $set: patch }, RETURN_NEW));
  }

  async markRead(userId: string, id: string): Promise<Notification | null> {
    return toDomain<Notification>(await NotificationDocument.findOneAndUpdate({ _id: id, userId }, { $set: { read: true } }, RETURN_NEW));
  }

  async markAllRead(userId: string): Promise<number> {
    const result = await NotificationDocument.updateMany({ userId, read: false }, { $set: { read: true } });
    return result.modifiedCount ?? 0;
  }
}
