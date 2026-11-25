import type { Activity, Invitation, Member, Workspace } from '@gr8r/domain';
import { modelFor, toDomain } from './connection';
import {
  ActivityModel,
  InvitationModel,
  MemberModel,
  WorkspaceModel,
} from './models/support';

const WorkspaceDocument = modelFor(WorkspaceModel);
const MemberDocument = modelFor(MemberModel);
const ActivityDocument = modelFor(ActivityModel);
const InvitationDocument = modelFor(InvitationModel);

export class MongoMemberRepository {
  async listByWorkspace(workspaceId: string): Promise<Member[]> {
    const documents = await MemberDocument.find({ workspaceId }).sort({ name: 1 }).lean();
    return documents.map((document: unknown) => toDomain<Member>(document) as Member);
  }

  async findById(id: string): Promise<Member | null> {
    return toDomain<Member>(await MemberDocument.findById(id).lean());
  }

  async create(member: Member): Promise<Member> {
    return toDomain<Member>(await MemberDocument.create({ _id: member.id, ...member })) as Member;
  }

  async update(id: string, patch: Partial<Member>): Promise<Member | null> {
    return toDomain<Member>(await MemberDocument.findByIdAndUpdate(id, { $set: patch }, { new: true, lean: true }));
  }

  async remove(id: string): Promise<boolean> {
    const result = await MemberDocument.deleteOne({ _id: id });
    return result.deletedCount > 0;
  }
}

export class MongoWorkspaceRepository {
  async findFirst(): Promise<Workspace | null> {
    return toDomain<Workspace>(await WorkspaceDocument.findOne().sort({ createdAt: 1 }).lean());
  }

  async findById(id: string): Promise<Workspace | null> {
    return toDomain<Workspace>(await WorkspaceDocument.findById(id).lean());
  }

  async create(workspace: Workspace): Promise<Workspace> {
    return toDomain<Workspace>(await WorkspaceDocument.create({ _id: workspace.id, ...workspace })) as Workspace;
  }

  async update(id: string, patch: Partial<Workspace>): Promise<Workspace | null> {
    return toDomain<Workspace>(await WorkspaceDocument.findByIdAndUpdate(id, { $set: patch }, { new: true, lean: true }));
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

export class MongoInvitationRepository {
  async listByWorkspace(workspaceId: string): Promise<Invitation[]> {
    const documents = await InvitationDocument.find({ workspaceId }).lean();
    return documents.map((document: unknown) => toDomain<Invitation>(document) as Invitation);
  }

  async findByToken(token: string): Promise<Invitation | null> {
    return toDomain<Invitation>(await InvitationDocument.findOne({ token }).lean());
  }

  async create(invitation: Invitation): Promise<Invitation> {
    return toDomain<Invitation>(await InvitationDocument.create({ _id: invitation.id, ...invitation })) as Invitation;
  }

  async markAccepted(id: string, at: number): Promise<Invitation | null> {
    return toDomain<Invitation>(await InvitationDocument.findByIdAndUpdate(id, { $set: { acceptedAt: at } }, { new: true, lean: true }));
  }
}

