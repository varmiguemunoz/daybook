import { randomUUID } from 'node:crypto';
import { calendarEventSchema, type CalendarEvent } from '@gr8r/domain';
import type { Repositories } from '../../ports/repositories';
import { notFound } from '../../http/errors';
import { recordActivity } from '../activity/activity-service';

export async function listEvents(repositories: Repositories, workspaceId: string, from?: string, to?: string): Promise<CalendarEvent[]> {
  return repositories.events.listByWorkspace(workspaceId, from, to);
}

export async function createEvent(repositories: Repositories, workspaceId: string, actorId: string, input: Omit<CalendarEvent, 'id' | 'workspaceId' | 'createdAt' | 'createdBy'>): Promise<CalendarEvent> {
  const event = calendarEventSchema.parse({
    ...input,
    id: `ev_${randomUUID()}`,
    workspaceId,
  });
  const created = await repositories.events.create(event);
  await recordActivity(repositories, { workspaceId, actorId, verb: 'created', detail: created.title });
  return created;
}

export async function updateEvent(repositories: Repositories, id: string, patch: Partial<CalendarEvent>): Promise<CalendarEvent> {
  const updated = await repositories.events.update(id, patch);
  if (!updated) throw notFound('Event');
  return updated;
}

export async function deleteEvent(repositories: Repositories, id: string): Promise<void> {
  const removed = await repositories.events.remove(id);
  if (!removed) throw notFound('Event');
}
