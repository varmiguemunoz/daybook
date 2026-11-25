import type { Activity, CalendarEvent, Comment, FileRecord, Member, Notification, SavedView, Task, Team, Workspace } from '@daybook/domain';
import type { Repositories } from '../../ports/repositories';
import { Collection } from './collection';
import { MemoryTaskRepository } from './task-repository';
import { MemoryActivityRepository, MemoryMemberRepository, MemoryWorkspaceRepository } from './support-repositories';
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
  const collections = {
    members: new Collection<Member>(seed.members ?? members),
    tasks: new Collection<Task>(seed.tasks ?? tasks),
    activity: new Collection<Activity>(seed.activity ?? []),
    teams: new Collection<Team>([]),
    comments: new Collection<Comment>([]),
    files: new Collection<FileRecord>([]),
    events: new Collection<CalendarEvent>([]),
    views: new Collection<SavedView>([]),
    notifications: new Collection<Notification>([]),
  };

  return {
    workspaces: new MemoryWorkspaceRepository(new Collection<Workspace>([seed.workspace ?? defaultWorkspace]), Object.values(collections)),
    members: new MemoryMemberRepository(collections.members),
    tasks: new MemoryTaskRepository(collections.tasks),
    activity: new MemoryActivityRepository(collections.activity),
    teams: new MemoryTeamRepository(collections.teams),
    comments: new MemoryCommentRepository(collections.comments),
    files: new MemoryFileRepository(collections.files),
    events: new MemoryCalendarEventRepository(collections.events),
    views: new MemorySavedViewRepository(collections.views),
    notifications: new MemoryNotificationRepository(collections.notifications),
  };
}
