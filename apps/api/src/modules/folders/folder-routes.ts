import { Hono } from 'hono';
import { createFolderInputSchema, updateFolderInputSchema } from '@daybook/domain';
import type { Repositories } from '../../ports/repositories';
import { permit } from '../../http/actor';
import { parseBody, readJson } from '../../http/validate';
import { createFolder, deleteFolder, listFolders, updateFolder } from './folder-service';

const write = permit('note:write');

export function folderRoutes(repositories: Repositories): Hono {
  const routes = new Hono();
  routes.get('/', async context => context.json(await listFolders(repositories, context.get('scope').workspace.id)));
  routes.post('/', write, async context => {
    const input = parseBody(createFolderInputSchema, await readJson(context));
    return context.json(await createFolder(repositories, context.get('scope').workspace.id, input), 201);
  });
  routes.patch('/:id', write, async context => {
    const input = parseBody(updateFolderInputSchema, await readJson(context));
    return context.json(await updateFolder(repositories, context.get('scope').workspace.id, context.req.param('id'), input));
  });
  routes.delete('/:id', write, async context => {
    await deleteFolder(repositories, context.get('scope').workspace.id, context.req.param('id'));
    return context.body(null, 204);
  });
  return routes;
}
