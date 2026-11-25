import { modelFor } from './connection';
import { WorkspaceModel } from './models/support';
import { MemberModel } from './models/support';
import { ActivityModel } from './models/support';
import { TaskModel } from './models/task';
import { defaultWorkspace, members, tasks } from '../../fixtures/seed';

export async function importSeedData(): Promise<void> {
  const WorkspaceDocument = modelFor(WorkspaceModel);
  const MemberDocument = modelFor(MemberModel);
  const TaskDocument = modelFor(TaskModel);
  const ActivityDocument = modelFor(ActivityModel);

  await Promise.all([
    WorkspaceDocument.deleteMany({}),
    MemberDocument.deleteMany({}),
    TaskDocument.deleteMany({}),
    ActivityDocument.deleteMany({}),
  ]);

  await WorkspaceDocument.insertMany([{ _id: defaultWorkspace.id, ...defaultWorkspace }]);
  await MemberDocument.insertMany(members.map(item => ({ _id: item.id, ...item })));
  await TaskDocument.insertMany(tasks.map(item => ({ _id: item.id, ...item })));
}
