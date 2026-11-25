import type { Activity, Member, Task } from '@daybook/domain';

export interface HomeData {
  me: Member;
  tasks: Task[];
  members: Member[];
  activity: Activity[];
}
