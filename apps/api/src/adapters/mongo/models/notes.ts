import { Schema } from 'mongoose';

const folderSchema = new Schema(
  {
    _id: String,
    workspaceId: { type: String, required: true },
    parentId: { type: String, default: null },
    name: String,
    order: { type: Number, default: 0 },
    createdAt: Number,
    updatedAt: Number,
  },
  { versionKey: false },
);

folderSchema.index({ workspaceId: 1, parentId: 1 });

const noteSchema = new Schema(
  {
    _id: String,
    workspaceId: { type: String, required: true },
    folderId: { type: String, default: null },
    authorId: String,
    title: String,
    body: { type: String, default: '' },
    linkIds: { type: [String], default: [] },
    mentionIds: { type: [String], default: [] },
    createdAt: Number,
    updatedAt: Number,
  },
  { versionKey: false },
);

noteSchema.index({ workspaceId: 1, folderId: 1, updatedAt: -1 });
noteSchema.index({ workspaceId: 1, linkIds: 1 });
noteSchema.index({ workspaceId: 1, mentionIds: 1 });

export const FolderModel = { name: 'Folder', schema: folderSchema };
export const NoteModel = { name: 'Note', schema: noteSchema };
