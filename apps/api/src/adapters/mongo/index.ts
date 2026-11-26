import type { Repositories } from '../../ports/repositories';
import { connectDatabase, disconnectDatabase } from './connection';
import { MongoActivityRepository, MongoMemberRepository, MongoWorkspaceRepository } from './support-repositories';
import { MongoCommentRepository, MongoNotificationRepository, MongoTeamRepository } from './extra-repositories';
import { MongoTaskRepository } from './task-repository';

export interface MongoRepositories extends Repositories {
  close: () => Promise<void>;
}

export async function createMongoRepositories(uri: string): Promise<MongoRepositories> {
  await connectDatabase(uri);

  return {
    workspaces: new MongoWorkspaceRepository(),
    members: new MongoMemberRepository(),
    tasks: new MongoTaskRepository(),
    activity: new MongoActivityRepository(),
    teams: new MongoTeamRepository(),
    comments: new MongoCommentRepository(),
    notifications: new MongoNotificationRepository(),
    close: disconnectDatabase,
  };
}
