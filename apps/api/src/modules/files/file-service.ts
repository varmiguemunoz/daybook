import { randomUUID } from 'node:crypto';
import { fileSchema, type FileRecord } from '@gr8r/domain';
import type { Repositories } from '../../ports/repositories';
import { invalidInput, notFound } from '../../http/errors';
import { recordActivity } from '../activity/activity-service';
import { bucketName, presignGet, presignPut, r2Configured } from '../../shared/storage/r2';

const TYPE_BY_EXT: Record<string, FileRecord['type']> = {
  fig: 'fig',
  pdf: 'pdf',
  zip: 'zip',
  rar: 'zip',
  '7z': 'zip',
  png: 'img',
  jpg: 'img',
  jpeg: 'img',
  gif: 'img',
  webp: 'img',
  svg: 'img',
  heic: 'img',
  xlsx: 'sheet',
  xls: 'sheet',
  csv: 'sheet',
  numbers: 'sheet',
  doc: 'doc',
  docx: 'doc',
  txt: 'doc',
  md: 'doc',
  pages: 'doc',
  rtf: 'doc',
  js: 'code',
  ts: 'code',
  json: 'code',
  html: 'code',
  css: 'code',
  py: 'code',
};

const ALLOWED_MIME_PREFIXES = [
  'image/',
  'application/pdf',
  'application/zip',
  'text/',
  'application/json',
  'application/msword',
  'application/vnd.',
  'application/octet-stream',
];

export function fileTypeOf(name: string): FileRecord['type'] {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  return TYPE_BY_EXT[ext] ?? 'other';
}

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export interface PresignResult {
  fileId: string;
  uploadUrl: string;
  key: string;
  bucket: string;
}

export async function presignUpload(
  _repositories: Repositories,
  workspaceId: string,
  projectId: string | null,
  name: string,
  mimeType: string,
): Promise<PresignResult> {
  const fileId = `f_${randomUUID()}`;
  const safeName = name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const key = `gr8r-files/${workspaceId}/${projectId ?? 'workspace'}/${fileId}-${safeName}`;

  const uploadUrl = r2Configured() ? await presignPut(key, mimeType) : `http://localhost:3001/api/files/local-upload/${fileId}`;

  return { fileId, uploadUrl, key, bucket: bucketName() };
}

export interface ConfirmUploadInput {
  projectId: string | null;
  taskId?: string | null;
  fileId: string;
  key: string;
  name: string;
  sizeBytes: number;
  mimeType: string;
}

export async function confirmUploadInput(
  repositories: Repositories,
  workspaceId: string,
  member: { id: string },
  input: ConfirmUploadInput,
): Promise<FileRecord> {
  return confirmUpload(
    repositories,
    workspaceId,
    input.projectId ?? null,
    input.taskId ?? null,
    input.fileId,
    input.key,
    input.name,
    input.sizeBytes,
    input.mimeType,
    member.id,
  );
}
export async function confirmUpload(
  repositories: Repositories,
  workspaceId: string,
  projectId: string | null,
  taskId: string | null,
  fileId: string,
  key: string,
  name: string,
  sizeBytes: number,
  mimeType: string,
  uploadedBy: string,
): Promise<FileRecord> {
  if (sizeBytes > 250 * 1024 * 1024) {
    throw invalidInput([{ path: 'sizeBytes', message: 'File exceeds 250 MB limit' }]);
  }
  if (!ALLOWED_MIME_PREFIXES.some(prefix => mimeType.startsWith(prefix))) {
    throw invalidInput([{ path: 'mimeType', message: 'Unsupported file type' }]);
  }

  const file = fileSchema.parse({
    id: fileId,
    workspaceId,
    projectId,
    taskId,
    name,
    type: fileTypeOf(name),
    size: humanSize(sizeBytes),
    sizeBytes,
    mimeType,
    r2Key: key,
    r2Bucket: bucketName(),
    uploadedBy,
    at: Date.now(),
  });
  const created = await repositories.files.create(file);
  await recordActivity(repositories, { workspaceId, actorId: uploadedBy, verb: 'created', projectId, detail: name });
  return created;
}

export async function listFiles(repositories: Repositories, workspaceId: string, taskId?: string): Promise<FileRecord[]> {
  if (taskId) return repositories.files.listByTask(workspaceId, taskId);
  return repositories.files.listByWorkspace(workspaceId);
}

export async function getFile(repositories: Repositories, workspaceId: string, id: string): Promise<FileRecord> {
  const file = await repositories.files.findById(workspaceId, id);
  if (!file) throw notFound('File');
  return file;
}

export async function downloadUrl(file: FileRecord): Promise<string> {
  if (!r2Configured()) return `/api/files/local/${file.id}`;
  if (!file.r2Key) return `/api/files/local/${file.id}`;
  return presignGet(file.r2Key);
}

export async function deleteFile(repositories: Repositories, workspaceId: string, id: string): Promise<void> {
  const file = await getFile(repositories, workspaceId, id);
  if (r2Configured()) {
    const { deleteObject } = await import('../../shared/storage/r2');
    if (file.r2Key) await deleteObject(file.r2Key).catch(() => undefined);
  }
  const removed = await repositories.files.remove(workspaceId, id);
  if (!removed) throw notFound('File');
}

const localStore = new Map<string, { data: Buffer; mimeType: string }>();

export function storeLocalFile(fileId: string, data: Buffer, mimeType: string): void {
  localStore.set(fileId, { data, mimeType });
}

export function getLocalFile(fileId: string): { data: Buffer; mimeType: string } | null {
  return localStore.get(fileId) ?? null;
}
