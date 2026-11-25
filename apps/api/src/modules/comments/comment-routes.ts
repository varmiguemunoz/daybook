import { Hono } from 'hono';
import { createCommentInputSchema, reactionInputSchema, updateCommentInputSchema } from '@daybook/domain';
import type { Repositories } from '../../ports/repositories';
import { permit } from '../../http/actor';
import { parseBody, readJson } from '../../http/validate';
import { createComment, deleteComment, listComments, toggleReaction, updateComment } from './comment-service';

export function commentRoutes(repositories: Repositories): Hono {
  const routes = new Hono();

  routes.get('/tasks/:taskId', async context => {
    const { workspace } = context.get('scope');
    return context.json(await listComments(repositories, workspace.id, context.req.param('taskId')));
  });

  routes.post('/tasks/:taskId', permit('comment:write'), async context => {
    const { workspace, member } = context.get('scope');
    const input = parseBody(createCommentInputSchema, await readJson(context));
    return context.json(await createComment(repositories, workspace.id, context.req.param('taskId'), member.id, input), 201);
  });

  routes.patch('/:id', permit('comment:write'), async context => {
    const { workspace, member } = context.get('scope');
    const { body } = parseBody(updateCommentInputSchema, await readJson(context));
    return context.json(await updateComment(repositories, workspace.id, context.req.param('id'), member, body));
  });

  routes.delete('/:id', permit('comment:write'), async context => {
    const { workspace, member } = context.get('scope');
    await deleteComment(repositories, workspace.id, context.req.param('id'), member);
    return context.body(null, 204);
  });

  routes.post('/:id/reactions', permit('comment:write'), async context => {
    const { workspace, member } = context.get('scope');
    const { emoji } = parseBody(reactionInputSchema, await readJson(context));
    return context.json(await toggleReaction(repositories, workspace.id, context.req.param('id'), member.id, emoji));
  });

  return routes;
}
