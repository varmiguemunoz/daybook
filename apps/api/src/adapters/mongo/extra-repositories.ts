/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Comment, Notification, Team } from '@daybook/domain';
import { modelFor, toDomain } from './connection';
import { CommentModel, NotificationModel, TeamModel } from './models/support';

const TeamDocument = modelFor(TeamModel) as any;
const CommentDocument = modelFor(CommentModel) as any;
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
