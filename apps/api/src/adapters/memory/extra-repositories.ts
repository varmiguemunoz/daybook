import type { CalendarEvent, Comment, FileRecord, Notification, SavedView, Team } from '@daybook/domain';
import type {
  CalendarEventRepository,
  CommentRepository,
  FileRepository,
  NotificationRepository,
  SavedViewRepository,
  TeamRepository,
} from '../../ports/repositories';
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

export class MemoryFileRepository implements FileRepository {
  constructor(private readonly items: Collection<FileRecord>) {}

  async listByWorkspace(workspaceId: string): Promise<FileRecord[]> {
    return this.items.filter({ workspaceId }).sort((a, b) => b.at - a.at);
  }

  async listByTask(workspaceId: string, taskId: string): Promise<FileRecord[]> {
    return this.items.filter({ workspaceId, taskId }).sort((a, b) => b.at - a.at);
  }

  async findById(workspaceId: string, id: string): Promise<FileRecord | null> {
    return this.items.find(id, { workspaceId });
  }

  async create(file: FileRecord): Promise<FileRecord> {
    return this.items.insert(file);
  }

  async remove(workspaceId: string, id: string): Promise<boolean> {
    return this.items.remove(id, { workspaceId });
  }
}

export class MemoryCalendarEventRepository implements CalendarEventRepository {
  constructor(private readonly items: Collection<CalendarEvent>) {}

  async listByWorkspace(workspaceId: string, from?: string, to?: string): Promise<CalendarEvent[]> {
    return this.items
      .filter({ workspaceId })
      .filter(event => (!from || event.date >= from) && (!to || event.date <= to))
      .sort((a, b) => (a.date < b.date ? -1 : 1));
  }

  async create(event: CalendarEvent): Promise<CalendarEvent> {
    return this.items.insert(event);
  }

  async update(workspaceId: string, id: string, patch: Partial<CalendarEvent>): Promise<CalendarEvent | null> {
    return this.items.patch(id, patch, { workspaceId });
  }

  async remove(workspaceId: string, id: string): Promise<boolean> {
    return this.items.remove(id, { workspaceId });
  }
}

export class MemorySavedViewRepository implements SavedViewRepository {
  constructor(private readonly items: Collection<SavedView>) {}

  async listByWorkspace(workspaceId: string, ownerId?: string): Promise<SavedView[]> {
    return this.items.filter(ownerId ? { workspaceId, ownerId } : { workspaceId });
  }

  async findById(workspaceId: string, id: string): Promise<SavedView | null> {
    return this.items.find(id, { workspaceId });
  }

  async create(view: SavedView): Promise<SavedView> {
    return this.items.insert(view);
  }

  async update(workspaceId: string, id: string, patch: Partial<SavedView>): Promise<SavedView | null> {
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
