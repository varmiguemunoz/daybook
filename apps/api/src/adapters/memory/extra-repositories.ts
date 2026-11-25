import type { CalendarEvent, Comment, FileRecord, Notification, SavedView, Team } from '@gr8r/domain';
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
    return this.items.all().filter(team => team.workspaceId === workspaceId);
  }

  async findById(id: string): Promise<Team | null> {
    return this.items.find(id);
  }

  async create(team: Team): Promise<Team> {
    return this.items.insert(team);
  }

  async update(id: string, patch: Partial<Team>): Promise<Team | null> {
    return this.items.patch(id, patch);
  }

  async remove(id: string): Promise<boolean> {
    return this.items.remove(id);
  }
}

export class MemoryCommentRepository implements CommentRepository {
  constructor(private readonly items: Collection<Comment>) {}

  async listByTask(taskId: string): Promise<Comment[]> {
    return this.items.all().filter(comment => comment.taskId === taskId).sort((a, b) => a.createdAt - b.createdAt);
  }

  async findById(id: string): Promise<Comment | null> {
    return this.items.find(id);
  }

  async create(comment: Comment): Promise<Comment> {
    return this.items.insert(comment);
  }

  async update(id: string, patch: Partial<Comment>): Promise<Comment | null> {
    return this.items.patch(id, patch);
  }

  async remove(id: string): Promise<boolean> {
    return this.items.remove(id);
  }
}

export class MemoryFileRepository implements FileRepository {
  constructor(private readonly items: Collection<FileRecord>) {}

  async listByWorkspace(workspaceId: string): Promise<FileRecord[]> {
    return this.items.all().filter(file => file.workspaceId === workspaceId).sort((a, b) => b.at - a.at);
  }

  async listByTask(taskId: string): Promise<FileRecord[]> {
    return this.items.all().filter(file => file.taskId === taskId).sort((a, b) => b.at - a.at);
  }

  async findById(id: string): Promise<FileRecord | null> {
    return this.items.find(id);
  }

  async create(file: FileRecord): Promise<FileRecord> {
    return this.items.insert(file);
  }

  async remove(id: string): Promise<boolean> {
    return this.items.remove(id);
  }
}

export class MemoryCalendarEventRepository implements CalendarEventRepository {
  constructor(private readonly items: Collection<CalendarEvent>) {}

  async listByWorkspace(workspaceId: string, from?: string, to?: string): Promise<CalendarEvent[]> {
    return this.items
      .all()
      .filter(event => event.workspaceId === workspaceId)
      .filter(event => (!from || event.date >= from) && (!to || event.date <= to))
      .sort((a, b) => (a.date < b.date ? -1 : 1));
  }

  async findById(id: string): Promise<CalendarEvent | null> {
    return this.items.find(id);
  }

  async create(event: CalendarEvent): Promise<CalendarEvent> {
    return this.items.insert(event);
  }

  async update(id: string, patch: Partial<CalendarEvent>): Promise<CalendarEvent | null> {
    return this.items.patch(id, patch);
  }

  async remove(id: string): Promise<boolean> {
    return this.items.remove(id);
  }
}

export class MemorySavedViewRepository implements SavedViewRepository {
  constructor(private readonly items: Collection<SavedView>) {}

  async listByWorkspace(workspaceId: string, ownerId?: string): Promise<SavedView[]> {
    return this.items
      .all()
      .filter(view => view.workspaceId === workspaceId)
      .filter(view => !ownerId || view.ownerId === ownerId);
  }

  async findById(id: string): Promise<SavedView | null> {
    return this.items.find(id);
  }

  async create(view: SavedView): Promise<SavedView> {
    return this.items.insert(view);
  }

  async update(id: string, patch: Partial<SavedView>): Promise<SavedView | null> {
    return this.items.patch(id, patch);
  }

  async remove(id: string): Promise<boolean> {
    return this.items.remove(id);
  }
}

export class MemoryNotificationRepository implements NotificationRepository {
  constructor(private readonly items: Collection<Notification>) {}

  async listByUser(userId: string, unreadOnly?: boolean): Promise<Notification[]> {
    return this.items
      .all()
      .filter(notification => notification.userId === userId)
      .filter(notification => !unreadOnly || !notification.read)
      .sort((a, b) => b.at - a.at);
  }

  async findById(id: string): Promise<Notification | null> {
    return this.items.find(id);
  }

  async create(notification: Notification): Promise<Notification> {
    return this.items.insert(notification);
  }

  async update(id: string, patch: Partial<Notification>): Promise<Notification | null> {
    return this.items.patch(id, patch);
  }

  async markRead(id: string): Promise<Notification | null> {
    return this.items.patch(id, { read: true });
  }

  async markAllRead(userId: string): Promise<number> {
    let count = 0;
    for (const item of this.items.all()) {
      if (item.userId === userId && !item.read) {
        this.items.patch(item.id, { read: true });
        count += 1;
      }
    }
    return count;
  }

  async remove(id: string): Promise<boolean> {
    return this.items.remove(id);
  }
}
