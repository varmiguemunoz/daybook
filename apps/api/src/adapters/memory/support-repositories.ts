import type { Activity, Member, Workspace } from '@gr8r/domain';
import type { ActivityRepository, MemberRepository, WorkspaceRepository } from '../../ports/repositories';
import type { Collection } from './collection';

export class MemoryMemberRepository implements MemberRepository {
  constructor(private readonly items: Collection<Member>) {}

  async listByWorkspace(workspaceId: string): Promise<Member[]> {
    return this.items.filter({ workspaceId });
  }

  async findById(workspaceId: string, id: string): Promise<Member | null> {
    return this.items.find(id, { workspaceId });
  }

  async findByClerkUserId(workspaceId: string, clerkUserId: string): Promise<Member | null> {
    return this.items.findWhere({ workspaceId, clerkUserId });
  }

  async upsert(member: Member, patch: Partial<Member>): Promise<Member> {
    return this.items.upsert({ workspaceId: member.workspaceId, clerkUserId: member.clerkUserId }, member, patch);
  }

  async update(workspaceId: string, id: string, patch: Partial<Member>): Promise<Member | null> {
    return this.items.patch(id, patch, { workspaceId });
  }

  async updateByClerkUserId(clerkUserId: string, patch: Partial<Member>): Promise<void> {
    this.items.filter({ clerkUserId }).forEach(member => this.items.patch(member.id, patch));
  }

  async remove(workspaceId: string, id: string): Promise<boolean> {
    return this.items.remove(id, { workspaceId });
  }
}

export class MemoryWorkspaceRepository implements WorkspaceRepository {
  constructor(private readonly items: Collection<Workspace>) {}

  async findByClerkOrgId(clerkOrgId: string): Promise<Workspace | null> {
    return this.items.findWhere({ clerkOrgId });
  }

  async upsert(workspace: Workspace, patch: Partial<Workspace>): Promise<Workspace> {
    return this.items.upsert({ clerkOrgId: workspace.clerkOrgId }, workspace, patch);
  }
}

export class MemoryActivityRepository implements ActivityRepository {
  constructor(private readonly items: Collection<Activity>) {}

  async recent(workspaceId: string, limit: number): Promise<Activity[]> {
    return this.items
      .filter({ workspaceId })
      .sort((a, b) => b.at - a.at)
      .slice(0, limit);
  }

  async append(activity: Activity): Promise<void> {
    this.items.insert(activity);
  }
}
