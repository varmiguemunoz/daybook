import { Hono } from 'hono';
import { createCommentInputSchema } from '@gr8r/domain';
import type { Repositories } from '../../ports/repositories';
import { requestContext } from '../../http/context';
import { requirePermission } from '../../http/actor';
import { parseBody, readJson } from '../../http/validate';
import { createComment, deleteComment, listComments, toggleReaction, updateComment } from './comment-service';

export function commentRoutes(repositories: Repositories): Hono {
  const routes = new Hono();

  routes.get('/tasks/:taskId', async context => {
    const { workspace } = await requestContext(repositories, context);
    return context.json(await listComments(repositories, workspace.id, context.req.param('taskId')));
  });

  routes.post('/tasks/:taskId', async context => {
    const { workspace, member } = await requestContext(repositories, context);
    requirePermission(member, 'comment:write');
    const input = parseBody(createCommentInputSchema, await readJson(context));
    return context.json(await createComment(repositories, workspace.id, context.req.param('taskId'), member.id, input), 201);
  });

  routes.patch('/:id', async context => {
    const { workspace, member } = await requestContext(repositories, context);
    requirePermission(member, 'comment:write');
    const body = await readJson(context);
    return context.json(await updateComment(repositories, workspace.id, context.req.param('id'), (body as { body: string }).body));
  });

  routes.delete('/:id', async context => {
    const { workspace, member } = await requestContext(repositories, context);
    requirePermission(member, 'comment:write');
    await deleteComment(repositories, workspace.id, context.req.param('id'));
    return context.body(null, 204);
  });

  routes.post('/:id/reactions', async context => {
    const { workspace, member } = await requestContext(repositories, context);
    requirePermission(member, 'comment:write');
    const body = await readJson(context);
    const emoji = (body as { emoji: string }).emoji;
    return context.json(await toggleReaction(repositories, workspace.id, context.req.param('id'), member.id, emoji));
  });

  return routes;
}
