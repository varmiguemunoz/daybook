import { Hono } from 'hono';
import { z } from 'zod';
import { createNoteInputSchema, idSchema, noteLinksInputSchema, updateNoteInputSchema } from '@daybook/domain';
import type { NoteQuery, Repositories } from '../../ports/repositories';
import { permit } from '../../http/actor';
import { parseBody, parseQuery, readJson } from '../../http/validate';
import { createNote, deleteNote, getNote, listNotes, setNoteLinks, updateNote } from './note-service';

const write = permit('note:write');
// An empty folderId selects loose notes; omitting it lists every note.
const listQuerySchema = z.object({ folderId: z.union([idSchema, z.literal('')]).optional(), q: z.string().max(200).optional() });

function toNoteQuery({ folderId, q }: z.output<typeof listQuerySchema>): NoteQuery {
  return { folderId: folderId === '' ? null : folderId, search: q };
}

export function noteRoutes(repositories: Repositories): Hono {
  const routes = new Hono();
  routes.get('/', async context => {
    const query = toNoteQuery(parseQuery(listQuerySchema, context.req.query()));
    return context.json(await listNotes(repositories, context.get('scope').workspace.id, query));
  });
  routes.get('/:id', async context => context.json(await getNote(repositories, context.get('scope').workspace.id, context.req.param('id'))));
  routes.post('/', write, async context => {
    const { workspace, member } = context.get('scope');
    const input = parseBody(createNoteInputSchema, await readJson(context));
    return context.json(await createNote(repositories, workspace.id, input, member.id), 201);
  });
  routes.patch('/:id', write, async context => {
    const input = parseBody(updateNoteInputSchema, await readJson(context));
    return context.json(await updateNote(repositories, context.get('scope').workspace.id, context.req.param('id'), input));
  });
  routes.put('/:id/links', write, async context => {
    const { linkIds } = parseBody(noteLinksInputSchema, await readJson(context));
    return context.json(await setNoteLinks(repositories, context.get('scope').workspace.id, context.req.param('id'), linkIds));
  });
  routes.delete('/:id', write, async context => {
    await deleteNote(repositories, context.get('scope').workspace.id, context.req.param('id'));
    return context.body(null, 204);
  });
  return routes;
}
