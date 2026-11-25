/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  CalendarEvent,
  Comment,
  FileRecord,
  Notification,
  SavedView,
  Team,
} from '@gr8r/domain';
import { modelFor, toDomain } from './connection';
import {
  CommentModel,
  EventModel,
  FileModel,
  NotificationModel,
  SavedViewModel,
  TeamModel,
} from './models/support';

const TeamDocument = modelFor(TeamModel) as any;
const CommentDocument = modelFor(CommentModel) as any;
const FileDocument = modelFor(FileModel) as any;
const EventDocument = modelFor(EventModel) as any;
const SavedViewDocument = modelFor(SavedViewModel) as any;
const NotificationDocument = modelFor(NotificationModel) as any;


export class MongoTeamRepository {
  async listByWorkspace(workspaceId: string): Promise<Team[]> {
    const documents = await TeamDocument.find({ workspaceId }).lean();
    return documents.map((document: any) => toDomain<Team>(document) as Team);
  }

  async findById(id: string): Promise<Team | null> {
    return toDomain<Team>(await TeamDocument.findById(id).lean());
  }

  async create(team: Team): Promise<Team> {
    return toDomain<Team>(await TeamDocument.create({ _id: team.id, ...team })) as Team;
  }

  async update(id: string, patch: Partial<Team>): Promise<Team | null> {
    return toDomain<Team>(await TeamDocument.findByIdAndUpdate(id, { $set: patch }, { new: true, lean: true }));
  }

  async remove(id: string): Promise<boolean> {
    const result = await TeamDocument.deleteOne({ _id: id });
    return result.deletedCount > 0;
  }
}

export class MongoCommentRepository {
  async listByTask(taskId: string): Promise<Comment[]> {
    const documents = await CommentDocument.find({ taskId }).sort({ createdAt: 1 }).lean();
    return documents.map((document: any) => toDomain<Comment>(document) as Comment);
  }

  async findById(id: string): Promise<Comment | null> {
    return toDomain<Comment>(await CommentDocument.findById(id).lean());
  }

  async create(comment: Comment): Promise<Comment> {
    return toDomain<Comment>(await CommentDocument.create({ _id: comment.id, ...comment })) as Comment;
  }

  async update(id: string, patch: Partial<Comment>): Promise<Comment | null> {
    return toDomain<Comment>(await CommentDocument.findByIdAndUpdate(id, { $set: patch }, { new: true, lean: true }));
  }

  async remove(id: string): Promise<boolean> {
    const result = await CommentDocument.deleteOne({ _id: id });
    return result.deletedCount > 0;
  }
}

export class MongoFileRepository {
  async listByWorkspace(workspaceId: string): Promise<FileRecord[]> {
    const documents = await FileDocument.find({ workspaceId }).sort({ at: -1 }).lean();
    return documents.map((document: any) => toDomain<FileRecord>(document) as FileRecord);
  }

  async listByTask(taskId: string): Promise<FileRecord[]> {
    const documents = await FileDocument.find({ taskId }).sort({ at: -1 }).lean();
    return documents.map((document: any) => toDomain<FileRecord>(document) as FileRecord);
  }

  async findById(id: string): Promise<FileRecord | null> {
    return toDomain<FileRecord>(await FileDocument.findById(id).lean());
  }

  async create(file: FileRecord): Promise<FileRecord> {
    return toDomain<FileRecord>(await FileDocument.create({ _id: file.id, ...file })) as FileRecord;
  }

  async remove(id: string): Promise<boolean> {
    const result = await FileDocument.deleteOne({ _id: id });
    return result.deletedCount > 0;
  }
}

export class MongoCalendarEventRepository {
  async listByWorkspace(workspaceId: string, from?: string, to?: string): Promise<CalendarEvent[]> {
    const filter: Record<string, unknown> = { workspaceId };
    if (from || to) {
      const dateFilter: Record<string, string> = {};
      if (from) dateFilter.$gte = from;
      if (to) dateFilter.$lte = to;
      filter.date = dateFilter;
    }
    const documents = await EventDocument.find(filter).sort({ date: 1 }).lean();
    return documents.map((document: any) => toDomain<CalendarEvent>(document) as CalendarEvent);
  }

  async findById(id: string): Promise<CalendarEvent | null> {
    return toDomain<CalendarEvent>(await EventDocument.findById(id).lean());
  }

  async create(event: CalendarEvent): Promise<CalendarEvent> {
    return toDomain<CalendarEvent>(await EventDocument.create({ _id: event.id, ...event })) as CalendarEvent;
  }

  async update(id: string, patch: Partial<CalendarEvent>): Promise<CalendarEvent | null> {
    return toDomain<CalendarEvent>(await EventDocument.findByIdAndUpdate(id, { $set: patch }, { new: true, lean: true }));
  }

  async remove(id: string): Promise<boolean> {
    const result = await EventDocument.deleteOne({ _id: id });
    return result.deletedCount > 0;
  }
}

export class MongoSavedViewRepository {
  async listByWorkspace(workspaceId: string, ownerId?: string): Promise<SavedView[]> {
    const filter: Record<string, unknown> = { workspaceId };
    if (ownerId) filter.ownerId = ownerId;
    const documents = await SavedViewDocument.find(filter).lean();
    return documents.map((document: any) => toDomain<SavedView>(document) as SavedView);
  }

  async findById(id: string): Promise<SavedView | null> {
    return toDomain<SavedView>(await SavedViewDocument.findById(id).lean());
  }

  async create(view: SavedView): Promise<SavedView> {
    return toDomain<SavedView>(await SavedViewDocument.create({ _id: view.id, ...view })) as SavedView;
  }

  async update(id: string, patch: Partial<SavedView>): Promise<SavedView | null> {
    return toDomain<SavedView>(await SavedViewDocument.findByIdAndUpdate(id, { $set: patch }, { new: true, lean: true }));
  }

  async remove(id: string): Promise<boolean> {
    const result = await SavedViewDocument.deleteOne({ _id: id });
    return result.deletedCount > 0;
  }
}

export class MongoNotificationRepository {
  async listByUser(userId: string, unreadOnly?: boolean): Promise<Notification[]> {
    const filter: Record<string, unknown> = { userId };
    if (unreadOnly) filter.read = false;
    const documents = await NotificationDocument.find(filter).sort({ at: -1 }).lean();
    return documents.map((document: any) => toDomain<Notification>(document) as Notification);
  }

  async findById(id: string): Promise<Notification | null> {
    return toDomain<Notification>(await NotificationDocument.findById(id).lean());
  }

  async create(notification: Notification): Promise<Notification> {
    return toDomain<Notification>(await NotificationDocument.create({ _id: notification.id, ...notification })) as Notification;
  }

  async update(id: string, patch: Partial<Notification>): Promise<Notification | null> {
    return toDomain<Notification>(await NotificationDocument.findByIdAndUpdate(id, { $set: patch }, { new: true, lean: true }));
  }

  async markRead(id: string): Promise<Notification | null> {
    return toDomain<Notification>(await NotificationDocument.findByIdAndUpdate(id, { $set: { read: true } }, { new: true, lean: true }));
  }

  async markAllRead(userId: string): Promise<number> {
    const result = await NotificationDocument.updateMany({ userId, read: false }, { $set: { read: true } });
    return result.modifiedCount ?? 0;
  }

  async remove(id: string): Promise<boolean> {
    const result = await NotificationDocument.deleteOne({ _id: id });
    return result.deletedCount > 0;
  }
}
