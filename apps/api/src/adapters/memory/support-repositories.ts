import type { Activity, Invitation, Member, Workspace } from '@gr8r/domain';
import type {
  ActivityRepository,
  InvitationRepository,
  MemberRepository,
  WorkspaceRepository,
} from '../../ports/repositories';
import type { Collection } from './collection';

export class MemoryMemberRepository implements MemberRepository {
  constructor(private readonly items: Collection<Member>) {}

  async listByWorkspace(workspaceId: string): Promise<Member[]> {
    return this.items.all().filter(member => member.workspaceId === workspaceId);
  }

  async findById(id: string): Promise<Member | null> {
    return this.items.find(id);
  }

  async create(member: Member): Promise<Member> {
    return this.items.insert(member);
  }

  async update(id: string, patch: Partial<Member>): Promise<Member | null> {
    return this.items.patch(id, patch);
  }

  async remove(id: string): Promise<boolean> {
    return this.items.remove(id);
  }
}

export class MemoryWorkspaceRepository implements WorkspaceRepository {
  constructor(private readonly items: Collection<Workspace>) {}

  async findFirst(): Promise<Workspace | null> {
    return this.items.all()[0] ?? null;
  }

  async findById(id: string): Promise<Workspace | null> {
    return this.items.find(id);
  }

  async create(workspace: Workspace): Promise<Workspace> {
    return this.items.insert(workspace);
  }

  async update(id: string, patch: Partial<Workspace>): Promise<Workspace | null> {
    return this.items.patch(id, patch);
  }
}

export class MemoryActivityRepository implements ActivityRepository {
  constructor(private readonly items: Collection<Activity>) {}

  async recent(workspaceId: string, limit: number): Promise<Activity[]> {
    return this.items
      .all()
      .filter(entry => entry.workspaceId === workspaceId)
      .sort((a, b) => b.at - a.at)
      .slice(0, limit);
  }

  async append(activity: Activity): Promise<void> {
    this.items.insert(activity);
  }
}

export class MemoryInvitationRepository implements InvitationRepository {
  constructor(private readonly items: Collection<Invitation>) {}

  async listByWorkspace(workspaceId: string): Promise<Invitation[]> {
    return this.items.all().filter(item => item.workspaceId === workspaceId);
  }

  async findByToken(token: string): Promise<Invitation | null> {
    return this.items.all().find(item => item.token === token) ?? null;
  }

  async create(invitation: Invitation): Promise<Invitation> {
    return this.items.insert(invitation);
  }

  async markAccepted(id: string, at: number): Promise<Invitation | null> {
    return this.items.patch(id, { acceptedAt: at });
  }
}

