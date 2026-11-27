/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from 'mongoose';

export async function connectDatabase(uri: string): Promise<void> {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5_000 });
}

export async function databaseReady(): Promise<boolean> {
  if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) return false;
  return mongoose.connection.db
    .admin()
    .ping()
    .then(() => true)
    .catch(() => false);
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}

interface DocumentSource {
  toObject?: (options: object) => Record<string, unknown>;
}

export function toDomain<T>(document: unknown): T | null {
  if (!document) return null;
  const source = document as DocumentSource;
  const raw = source.toObject ? source.toObject({ versionKey: false }) : (document as Record<string, unknown>);
  const { _id, ...rest } = raw;
  return { id: String(_id), ...rest } as T;
}

export function modelFor(definition: { name: string; schema: unknown }): any {
  const models = mongoose.models as Record<string, any>;
  const existing = models[definition.name];
  if (existing) return existing;
  return mongoose.model(definition.name, definition.schema as any);
}

export function upsertUpdate<T extends object>(document: T & { id: string }, patch: Partial<T>): Record<string, unknown> {
  const { id, ...rest } = document;
  const insertOnly = Object.fromEntries(Object.entries(rest).filter(([key]) => !(key in patch)));
  return { $setOnInsert: { _id: id, ...insertOnly }, $set: patch };
}
