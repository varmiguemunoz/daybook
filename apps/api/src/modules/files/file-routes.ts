import { Hono } from 'hono';
import { z } from 'zod';
import type { Repositories } from '../../ports/repositories';
import { requestContext } from '../../http/context';
import { requirePermission } from '../../http/actor';
import { parseBody, readJson } from '../../http/validate';
import { confirmUploadInput, deleteFile, downloadUrl, getFile, getLocalFile, listFiles, presignUpload, storeLocalFile } from './file-service';

const presignSchema = z.object({
  projectId: z.string().min(1).nullable().optional(),
  name: z.string().min(1).max(255),
  mimeType: z.string().max(128).default('application/octet-stream'),
});

const confirmSchema = z.object({
  projectId: z.string().min(1).nullable().optional(),
  taskId: z.string().nullable().optional(),
  fileId: z.string().min(1),
  key: z.string().min(1),
  name: z.string().min(1).max(255),
  sizeBytes: z.number().int().nonnegative(),
  mimeType: z.string().max(128).default('application/octet-stream'),
});

function localRoutes(repositories: Repositories): Hono {
  const routes = new Hono();
  routes.post('/local-upload/:fileId', async context => {
    const fileId = context.req.param('fileId');
    const mimeType = context.req.header('content-type') ?? 'application/octet-stream';
    const buffer = Buffer.from(await context.req.arrayBuffer());
    storeLocalFile(fileId, buffer, mimeType);
    return context.body(null, 204);
  });
  routes.get('/local/:fileId', async context => {
    const { workspace } = await requestContext(repositories, context);
    await getFile(repositories, workspace.id, context.req.param('fileId'));
    const file = getLocalFile(context.req.param('fileId'));
    if (!file) return context.json({ error: { message: 'Not found' } }, 404);
    return context.body(new Uint8Array(file.data), 200, { 'content-type': file.mimeType });
  });
  return routes;
}

export function fileRoutes(repositories: Repositories): Hono {
  const routes = new Hono();
  routes.route('/', localRoutes(repositories));

  routes.post('/presign', async context => {
    const { workspace, member } = await requestContext(repositories, context);
    requirePermission(member, 'task:write');
    const input = parseBody(presignSchema, await readJson(context));
    const result = await presignUpload(repositories, workspace.id, input.projectId ?? 'workspace', input.name, input.mimeType);
    return context.json(result);
  });

  routes.post('/', async context => {
    const { workspace, member } = await requestContext(repositories, context);
    requirePermission(member, 'task:write');
    const input = parseBody(confirmSchema, await readJson(context));
    const file = await confirmUploadInput(repositories, workspace.id, member, { ...input, projectId: input.projectId ?? null });
    return context.json(file, 201);
  });

  routes.get('/', async context => {
    const { workspace } = await requestContext(repositories, context);
    const taskId = context.req.query('taskId') ?? undefined;
    return context.json(await listFiles(repositories, workspace.id, taskId));
  });

  routes.get('/:id/download', async context => {
    const { workspace } = await requestContext(repositories, context);
    const file = await getFile(repositories, workspace.id, context.req.param('id'));
    return context.json({ url: await downloadUrl(file) });
  });

  routes.delete('/:id', async context => {
    const { workspace, member } = await requestContext(repositories, context);
    requirePermission(member, 'task:write');
    await deleteFile(repositories, workspace.id, context.req.param('id'));
    return context.body(null, 204);
  });

  return routes;
}
