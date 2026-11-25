/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from 'mongoose';

export async function connectDatabase(uri: string): Promise<void> {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5_000 });
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
