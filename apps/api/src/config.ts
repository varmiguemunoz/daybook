/// <reference types="node" />

import 'dotenv/config';

import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3001),
  PERSISTENCE: z.enum(['memory', 'mongo']).default('memory'),
  MONGODB_URI: z.string().min(10).default('mongodb://127.0.0.1:27017/gr8r'),
});

export type Config = z.infer<typeof envSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  return envSchema.parse(env);
}
