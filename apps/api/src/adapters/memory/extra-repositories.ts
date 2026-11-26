import type { Comment, Notification, Team } from '@daybook/domain';
import type { CommentRepository, NotificationRepository, TeamRepository } from '../../ports/repositories';
import type { Collection } from './collection';

export class MemoryTeamRepository implements TeamRepository {
  constructor(private readonly items: Collection<Team>) {}

  async listByWorkspace(workspaceId: string): Promise<Team[]> {
    return this.items.filter({ workspaceId });
  }

  async findById(workspaceId: string, id: string): Promise<Team | null> {
    return this.items.find(id, { workspaceId });
  }

  async create(team: Team): Promise<Team> {
    return this.items.insert(team);
  }

  async update(workspaceId: string, id: string, patch: Partial<Team>): Promise<Team | null> {
    return this.items.patch(id, patch, { workspaceId });
  }

  async remove(workspaceId: string, id: string): Promise<boolean> {
    return this.items.remove(id, { workspaceId });
  }
}

export class MemoryCommentRepository implements CommentRepository {
  constructor(private readonly items: Collection<Comment>) {}

  async listByTask(workspaceId: string, taskId: string): Promise<Comment[]> {
    return this.items.filter({ workspaceId, taskId }).sort((a, b) => a.createdAt - b.createdAt);
  }

  async findById(workspaceId: string, id: string): Promise<Comment | null> {
    return this.items.find(id, { workspaceId });
  }

  async create(comment: Comment): Promise<Comment> {
    return this.items.insert(comment);
  }

  async update(workspaceId: string, id: string, patch: Partial<Comment>): Promise<Comment | null> {
    return this.items.patch(id, patch, { workspaceId });
  }

  async remove(workspaceId: string, id: string): Promise<boolean> {
    return this.items.remove(id, { workspaceId });
  }
}

export class MemoryNotificationRepository implements NotificationRepository {
  constructor(private readonly items: Collection<Notification>) {}

  async listByUser(userId: string, unreadOnly: boolean, limit: number): Promise<Notification[]> {
    return this.items
      .filter(unreadOnly ? { userId, read: false } : { userId })
      .sort((a, b) => b.at - a.at)
      .slice(0, limit);
  }

  async create(notification: Notification): Promise<Notification> {
    return this.items.insert(notification);
  }

  async update(id: string, patch: Partial<Notification>): Promise<Notification | null> {
    return this.items.patch(id, patch);
  }

  async markRead(userId: string, id: string): Promise<Notification | null> {
    return this.items.patch(id, { read: true }, { userId });
  }

  async markAllRead(userId: string): Promise<number> {
    const unread = this.items.filter({ userId, read: false });
    unread.forEach(item => this.items.patch(item.id, { read: true }));
    return unread.length;
  }
}
