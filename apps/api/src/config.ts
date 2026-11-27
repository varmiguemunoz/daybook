/// <reference types="node" />

import 'dotenv/config';

import { z } from 'zod';

const originList = z
  .string()
  .transform(value => value.split(',').map(origin => origin.trim()))
  .pipe(z.array(z.string().min(1)).min(1));

const databaseSchema = z.object({
  PERSISTENCE: z.enum(['memory', 'mongo']).default('memory'),
  MONGODB_URI: z.string().min(10).default('mongodb://127.0.0.1:27017/daybook'),
});

const smtpSchema = z.object({
  SMTP_HOST: z.string().min(1).optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: z.stringbool().default(false),
  SMTP_USER: z.string().min(1).optional(),
  SMTP_PASS: z.string().min(1).optional(),
  SMTP_FROM: z.string().min(1).optional(),
});

const envSchema = databaseSchema
  .extend(smtpSchema.shape)
  .extend({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().positive().default(3001),
    CLERK_SECRET_KEY: z.string().startsWith('sk_'),
    CLERK_PUBLISHABLE_KEY: z.string().startsWith('pk_'),
    CLERK_WEBHOOK_SIGNING_SECRET: z.string().startsWith('whsec_'),
    ALLOWED_ORIGINS: originList,
    // Public URLs: the MCP resource is PUBLIC_API_URL/mcp, and invitations land on APP_URL.
    PUBLIC_API_URL: z.url().optional(),
    APP_URL: z.url().optional(),
    REDIS_URL: z.url({ protocol: /^rediss?$/ }).optional(),
    MAX_TASKS_PER_WORKSPACE: z.coerce.number().int().nonnegative().default(0),
    MAX_NOTES_PER_WORKSPACE: z.coerce.number().int().nonnegative().default(0),
  })
  .refine(env => env.NODE_ENV !== 'production' || env.PERSISTENCE === 'mongo', {
    message: 'Production needs PERSISTENCE=mongo; the memory store loses every change on restart',
    path: ['PERSISTENCE'],
  })
  .refine(env => [env.SMTP_HOST, env.SMTP_USER, env.SMTP_PASS].every(Boolean) || ![env.SMTP_HOST, env.SMTP_USER, env.SMTP_PASS].some(Boolean), {
    message: 'Set SMTP_HOST, SMTP_USER and SMTP_PASS together, or none of them',
    path: ['SMTP_HOST'],
  });

export type Config = z.infer<typeof envSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  return envSchema.parse(env);
}

export function loadDatabaseConfig(env: NodeJS.ProcessEnv = process.env): z.infer<typeof databaseSchema> {
  return databaseSchema.parse(env);
}
