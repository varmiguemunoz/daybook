import type {
  Activity,
  CalendarEvent,
  Comment,
  FileRecord,
  Invitation,
  Member,
  Notification,
  SavedView,
  Task,
  Team,
  Workspace,
} from '@gr8r/domain';
import type { Repositories } from '../../ports/repositories';
import { Collection } from './collection';
import { MemoryTaskRepository } from './task-repository';
import {
  MemoryActivityRepository,
  MemoryInvitationRepository,
  MemoryMemberRepository,
  MemoryWorkspaceRepository,
} from './support-repositories';
import {
  MemoryCalendarEventRepository,
  MemoryCommentRepository,
  MemoryFileRepository,
  MemoryNotificationRepository,
  MemorySavedViewRepository,
  MemoryTeamRepository,
} from './extra-repositories';
import { defaultWorkspace, members, tasks } from '../../fixtures/seed';

export interface SeedData {
  workspace?: Workspace;
  members?: Member[];
  tasks?: Task[];
  activity?: Activity[];
}

export function createMemoryRepositories(seed: SeedData = {}): Repositories {
  const workspace: Workspace = seed.workspace ?? defaultWorkspace;

  return {
    workspaces: new MemoryWorkspaceRepository(new Collection<Workspace>([workspace])),
    members: new MemoryMemberRepository(new Collection<Member>(seed.members ?? members)),
    tasks: new MemoryTaskRepository(new Collection<Task>(seed.tasks ?? tasks)),
    activity: new MemoryActivityRepository(new Collection<Activity>(seed.activity ?? [])),
    invitations: new MemoryInvitationRepository(new Collection<Invitation>([])),
    teams: new MemoryTeamRepository(new Collection<Team>([])),
    comments: new MemoryCommentRepository(new Collection<Comment>([])),
    files: new MemoryFileRepository(new Collection<FileRecord>([])),
    events: new MemoryCalendarEventRepository(new Collection<CalendarEvent>([])),
    views: new MemorySavedViewRepository(new Collection<SavedView>([])),
    notifications: new MemoryNotificationRepository(new Collection<Notification>([])),
  };
}
