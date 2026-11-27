import { createFolderInputSchema, idSchema, updateFolderInputSchema } from '@daybook/domain';
import { createFolder, deleteFolder, listFolders, updateFolder } from '../../folders/folder-service';
import { defineTool, fieldsOf, reply, scoped } from '../tool-kit';

const folderId = idSchema.describe('Folder id from list_folders');

export const folderTools = [
  defineTool({
    name: 'list_folders',
    title: 'List folders',
    description: 'List note folders. parentId shows the nesting (null for top-level folders).',
    access: 'read',
    input: scoped({}),
    run: async call => {
      const { workspace } = await call.scope();
      const folders = await listFolders(call.session.deps.repositories, workspace.id);
      return reply(`${folders.length} folder(s).`, { folders });
    },
  }),
  defineTool({
    name: 'create_folder',
    title: 'Create folder',
    description: 'Create a note folder, at the top level or inside parentId.',
    access: 'write',
    input: scoped(createFolderInputSchema.shape),
    run: async (call, args) => {
      const input = fieldsOf(args);
      const { workspace } = await call.scope('note:write');
      const folder = await createFolder(call.session.deps.repositories, workspace.id, input);
      return reply(`Created folder "${folder.name}".`, { folder });
    },
  }),
  defineTool({
    name: 'update_folder',
    title: 'Rename or move folder',
    description: 'Rename a folder or move it under another parentId (null for the top level).',
    access: 'write',
    input: scoped({ folder: folderId, ...updateFolderInputSchema.shape }),
    run: async (call, args) => {
      const { folder: id, ...input } = fieldsOf(args);
      const { workspace } = await call.scope('note:write');
      const folder = await updateFolder(call.session.deps.repositories, workspace.id, id, input);
      return reply(`Saved folder "${folder.name}".`, { folder });
    },
  }),
  defineTool({
    name: 'delete_folder',
    title: 'Delete folder',
    description: 'Delete a folder. Its notes and subfolders move up to the parent folder; nothing else is deleted.',
    access: 'destructive',
    input: scoped({ folder: folderId }),
    run: async (call, args) => {
      const { workspace } = await call.scope('note:write');
      await deleteFolder(call.session.deps.repositories, workspace.id, args.folder);
      return reply('Folder deleted.', { deleted: args.folder });
    },
  }),
];
