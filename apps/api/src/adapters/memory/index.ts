import type { Activity, Comment, Folder, Member, Note, Notification, Task, Team, Workspace } from '@daybook/domain';
import type { Repositories } from '../../ports/repositories';
import { Collection } from './collection';
import { MemoryTaskRepository } from './task-repository';
import { MemoryActivityRepository, MemoryMemberRepository, MemoryWorkspaceRepository } from './support-repositories';
import { MemoryCommentRepository, MemoryNotificationRepository, MemoryTeamRepository } from './extra-repositories';
import { MemoryFolderRepository, MemoryNoteRepository } from './notes-repositories';
import { defaultWorkspace, members, tasks } from '../../fixtures/seed';

export interface SeedData {
  workspace?: Workspace;
  members?: Member[];
  tasks?: Task[];
  activity?: Activity[];
}

export function createMemoryRepositories(seed: SeedData = {}): Repositories {
  const collections = {
    members: new Collection<Member>(seed.members ?? members),
    tasks: new Collection<Task>(seed.tasks ?? tasks),
    activity: new Collection<Activity>(seed.activity ?? []),
    teams: new Collection<Team>([]),
    comments: new Collection<Comment>([]),
    notifications: new Collection<Notification>([]),
    folders: new Collection<Folder>([]),
    notes: new Collection<Note>([]),
  };

  return {
    workspaces: new MemoryWorkspaceRepository(new Collection<Workspace>([seed.workspace ?? defaultWorkspace]), Object.values(collections)),
    members: new MemoryMemberRepository(collections.members),
    tasks: new MemoryTaskRepository(collections.tasks),
    activity: new MemoryActivityRepository(collections.activity),
    teams: new MemoryTeamRepository(collections.teams),
    comments: new MemoryCommentRepository(collections.comments),
    notifications: new MemoryNotificationRepository(collections.notifications),
    folders: new MemoryFolderRepository(collections.folders),
    notes: new MemoryNoteRepository(collections.notes),
  };
}
