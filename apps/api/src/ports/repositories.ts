import type { Activity, Comment, Member, Notification, Task, TaskQuery, Team, Workspace } from '@daybook/domain';

export interface TaskRepository {
  list(workspaceId: string, query: TaskQuery): Promise<Task[]>;
  findById(workspaceId: string, id: string): Promise<Task | null>;
  create(task: Task): Promise<Task>;
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

export interface Repositories {
  tasks: TaskRepository;
  members: MemberRepository;
  workspaces: WorkspaceRepository;
  activity: ActivityRepository;
  teams: TeamRepository;
  comments: CommentRepository;
  notifications: NotificationRepository;
}
