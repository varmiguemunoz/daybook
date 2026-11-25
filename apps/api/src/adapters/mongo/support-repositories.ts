import type { Activity, Member, Workspace } from '@gr8r/domain';
import { modelFor, toDomain, upsertUpdate } from './connection';
import { ActivityModel, MemberModel, WorkspaceModel } from './models/support';

const WorkspaceDocument = modelFor(WorkspaceModel);
const MemberDocument = modelFor(MemberModel);
const ActivityDocument = modelFor(ActivityModel);
const UPSERT = { upsert: true, new: true, lean: true };

export class MongoMemberRepository {
  async listByWorkspace(workspaceId: string): Promise<Member[]> {
    const documents = await MemberDocument.find({ workspaceId }).sort({ name: 1 }).lean();
    return documents.map((document: unknown) => toDomain<Member>(document) as Member);
  }

  async findById(workspaceId: string, id: string): Promise<Member | null> {
    return toDomain<Member>(await MemberDocument.findOne({ _id: id, workspaceId }).lean());
  }

  async findByClerkUserId(workspaceId: string, clerkUserId: string): Promise<Member | null> {
    return toDomain<Member>(await MemberDocument.findOne({ workspaceId, clerkUserId }).lean());
  }

  async upsert(member: Member, patch: Partial<Member>): Promise<Member> {
    const filter = { workspaceId: member.workspaceId, clerkUserId: member.clerkUserId };
    return toDomain<Member>(await MemberDocument.findOneAndUpdate(filter, upsertUpdate(member, patch), UPSERT)) as Member;
  }

  async update(workspaceId: string, id: string, patch: Partial<Member>): Promise<Member | null> {
    return toDomain<Member>(await MemberDocument.findOneAndUpdate({ _id: id, workspaceId }, { $set: patch }, { new: true, lean: true }));
  }

  async updateByClerkUserId(clerkUserId: string, patch: Partial<Member>): Promise<void> {
    await MemberDocument.updateMany({ clerkUserId }, { $set: patch });
  }
}

export class MongoWorkspaceRepository {
  async findByClerkOrgId(clerkOrgId: string): Promise<Workspace | null> {
    return toDomain<Workspace>(await WorkspaceDocument.findOne({ clerkOrgId }).lean());
  }

  async upsert(workspace: Workspace, patch: Partial<Workspace>): Promise<Workspace> {
    const filter = { clerkOrgId: workspace.clerkOrgId };
    return toDomain<Workspace>(await WorkspaceDocument.findOneAndUpdate(filter, upsertUpdate(workspace, patch), UPSERT)) as Workspace;
  }
}

export class MongoActivityRepository {
  async recent(workspaceId: string, limit: number): Promise<Activity[]> {
    const documents = await ActivityDocument.find({ workspaceId }).sort({ at: -1 }).limit(limit).lean();
    return documents.map((document: unknown) => toDomain<Activity>(document) as Activity);
  }

  async append(activity: Activity): Promise<void> {
    await ActivityDocument.create({ _id: activity.id, ...activity });
  }
}
