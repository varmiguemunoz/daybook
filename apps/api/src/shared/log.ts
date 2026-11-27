type Level = 'info' | 'warn' | 'error';

// One JSON object per line, so Railway and docker logs can be filtered by field.
export function log(level: Level, msg: string, fields: Record<string, unknown> = {}): void {
  const line = JSON.stringify({ time: new Date().toISOString(), level, msg, ...fields });
  if (level === 'error') console.error(line);
  else console.log(line);
}
