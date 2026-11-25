import type { Activity, Member, Task } from '@gr8r/domain';

export interface HomeData {
  me: Member;
  tasks: Task[];
  members: Member[];
  activity: Activity[];
}
