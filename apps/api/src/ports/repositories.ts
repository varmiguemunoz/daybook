import type { Activity, CalendarEvent, Comment, FileRecord, Invitation, Member, Notification, SavedView, Task, TaskQuery, Team, Workspace } from '@gr8r/domain';

export interface TaskRepository {
  list(workspaceId: string, query: TaskQuery): Promise<Task[]>;
  findById(id: string): Promise<Task | null>;
  create(task: Task): Promise<Task>;
  update(id: string, patch: Partial<Task>): Promise<Task | null>;
  remove(id: string): Promise<boolean>;
}

export interface MemberRepository {
  listByWorkspace(workspaceId: string): Promise<Member[]>;
  findById(id: string): Promise<Member | null>;
  create(member: Member): Promise<Member>;
  update(id: string, patch: Partial<Member>): Promise<Member | null>;
  remove(id: string): Promise<boolean>;
}

export interface WorkspaceRepository {
  findFirst(): Promise<Workspace | null>;
  findById(id: string): Promise<Workspace | null>;
  create(workspace: Workspace): Promise<Workspace>;
  update(id: string, patch: Partial<Workspace>): Promise<Workspace | null>;
}

export interface ActivityRepository {
  recent(workspaceId: string, limit: number): Promise<Activity[]>;
  append(activity: Activity): Promise<void>;
}

export interface InvitationRepository {
  listByWorkspace(workspaceId: string): Promise<Invitation[]>;
  findByToken(token: string): Promise<Invitation | null>;
  create(invitation: Invitation): Promise<Invitation>;
  markAccepted(id: string, at: number): Promise<Invitation | null>;
}

export interface TeamRepository {
  listByWorkspace(workspaceId: string): Promise<Team[]>;
  findById(id: string): Promise<Team | null>;
  create(team: Team): Promise<Team>;
  update(id: string, patch: Partial<Team>): Promise<Team | null>;
  remove(id: string): Promise<boolean>;
}

export interface CommentRepository {
  listByTask(taskId: string): Promise<Comment[]>;
  findById(id: string): Promise<Comment | null>;
  create(comment: Comment): Promise<Comment>;
  update(id: string, patch: Partial<Comment>): Promise<Comment | null>;
  remove(id: string): Promise<boolean>;
}

export interface FileRepository {
  listByWorkspace(workspaceId: string): Promise<FileRecord[]>;
  listByTask(taskId: string): Promise<FileRecord[]>;
  findById(id: string): Promise<FileRecord | null>;
  create(file: FileRecord): Promise<FileRecord>;
  remove(id: string): Promise<boolean>;
}

export interface CalendarEventRepository {
  listByWorkspace(workspaceId: string, from?: string, to?: string): Promise<CalendarEvent[]>;
  findById(id: string): Promise<CalendarEvent | null>;
  create(event: CalendarEvent): Promise<CalendarEvent>;
  update(id: string, patch: Partial<CalendarEvent>): Promise<CalendarEvent | null>;
  remove(id: string): Promise<boolean>;
}

export interface SavedViewRepository {
  listByWorkspace(workspaceId: string, ownerId?: string): Promise<SavedView[]>;
  findById(id: string): Promise<SavedView | null>;
  create(view: SavedView): Promise<SavedView>;
  update(id: string, patch: Partial<SavedView>): Promise<SavedView | null>;
  remove(id: string): Promise<boolean>;
}

export interface NotificationRepository {
  listByUser(userId: string, unreadOnly?: boolean): Promise<Notification[]>;
  findById(id: string): Promise<Notification | null>;
  create(notification: Notification): Promise<Notification>;
  update(id: string, patch: Partial<Notification>): Promise<Notification | null>;
  markRead(id: string): Promise<Notification | null>;
  markAllRead(userId: string): Promise<number>;
  remove(id: string): Promise<boolean>;
}

export interface Repositories {
  tasks: TaskRepository;
  members: MemberRepository;
  workspaces: WorkspaceRepository;
  activity: ActivityRepository;
  invitations: InvitationRepository;
  teams: TeamRepository;
  comments: CommentRepository;
  files: FileRepository;
  events: CalendarEventRepository;
  views: SavedViewRepository;
  notifications: NotificationRepository;
}
