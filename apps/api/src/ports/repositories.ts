import type { Activity, Comment, Folder, Member, Note, NoteSummary, Notification, Task, TaskQuery, Team, Workspace } from '@daybook/domain';

export interface TaskRepository {
  list(workspaceId: string, query: TaskQuery): Promise<Task[]>;
  findById(workspaceId: string, id: string): Promise<Task | null>;
  create(task: Task): Promise<Task>;
  count(workspaceId: string): Promise<number>;
  update(workspaceId: string, id: string, patch: Partial<Task>): Promise<Task | null>;
  remove(workspaceId: string, id: string): Promise<boolean>;
  nextKeyNumber(workspaceId: string): Promise<number>;
}

export interface MemberRepository {
  listByWorkspace(workspaceId: string): Promise<Member[]>;
  findById(workspaceId: string, id: string): Promise<Member | null>;
  findByClerkUserId(workspaceId: string, clerkUserId: string): Promise<Member | null>;
  upsert(member: Member, patch: Partial<Member>): Promise<Member>;
  update(workspaceId: string, id: string, patch: Partial<Member>): Promise<Member | null>;
  updateByClerkUserId(clerkUserId: string, patch: Partial<Member>): Promise<void>;
  remove(workspaceId: string, id: string): Promise<boolean>;
}

export interface WorkspaceRepository {
  findByClerkOrgId(clerkOrgId: string): Promise<Workspace | null>;
  upsert(workspace: Workspace, patch: Partial<Workspace>): Promise<Workspace>;
  purge(id: string): Promise<void>;
}

export interface ActivityRepository {
  recent(workspaceId: string, limit: number): Promise<Activity[]>;
  append(activity: Activity): Promise<void>;
}

export interface TeamRepository {
  listByWorkspace(workspaceId: string): Promise<Team[]>;
  findById(workspaceId: string, id: string): Promise<Team | null>;
  create(team: Team): Promise<Team>;
  update(workspaceId: string, id: string, patch: Partial<Team>): Promise<Team | null>;
  remove(workspaceId: string, id: string): Promise<boolean>;
}

export interface CommentRepository {
  listByTask(workspaceId: string, taskId: string): Promise<Comment[]>;
  findById(workspaceId: string, id: string): Promise<Comment | null>;
  create(comment: Comment): Promise<Comment>;
  update(workspaceId: string, id: string, patch: Partial<Comment>): Promise<Comment | null>;
  remove(workspaceId: string, id: string): Promise<boolean>;
}

export interface NotificationRepository {
  listByUser(userId: string, unreadOnly: boolean, limit: number): Promise<Notification[]>;
  create(notification: Notification): Promise<Notification>;
  update(id: string, patch: Partial<Notification>): Promise<Notification | null>;
  markRead(userId: string, id: string): Promise<Notification | null>;
  markAllRead(userId: string): Promise<number>;
}

export interface FolderRepository {
  listByWorkspace(workspaceId: string): Promise<Folder[]>;
  findById(workspaceId: string, id: string): Promise<Folder | null>;
  create(folder: Folder): Promise<Folder>;
  update(workspaceId: string, id: string, patch: Partial<Folder>): Promise<Folder | null>;
  moveChildren(workspaceId: string, fromParentId: string, toParentId: string | null): Promise<void>;
  remove(workspaceId: string, id: string): Promise<boolean>;
}

export interface NoteQuery {
  folderId?: string | null;
  search?: string;
}

export interface NoteRepository {
  list(workspaceId: string, query: NoteQuery): Promise<NoteSummary[]>;
  findById(workspaceId: string, id: string): Promise<Note | null>;
  findByIds(workspaceId: string, ids: string[]): Promise<NoteSummary[]>;
  findByTitles(workspaceId: string, lowerCaseTitles: string[]): Promise<NoteSummary[]>;
  findLinkingTo(workspaceId: string, id: string): Promise<NoteSummary[]>;
  create(note: Note): Promise<Note>;
  count(workspaceId: string): Promise<number>;
  update(workspaceId: string, id: string, patch: Partial<Note>): Promise<Note | null>;
  updateIfCurrent(workspaceId: string, id: string, updatedAt: number, patch: Partial<Note>): Promise<Note | null>;
  moveFolder(workspaceId: string, fromFolderId: string, toFolderId: string | null): Promise<void>;
  removeLink(workspaceId: string, targetId: string): Promise<void>;
  remove(workspaceId: string, id: string): Promise<boolean>;
}

export interface Repositories {
  tasks: TaskRepository;
  members: MemberRepository;
  workspaces: WorkspaceRepository;
  activity: ActivityRepository;
  teams: TeamRepository;
  comments: CommentRepository;
  notifications: NotificationRepository;
  folders: FolderRepository;
  notes: NoteRepository;
}
