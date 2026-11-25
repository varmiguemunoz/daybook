import { describe, expect, it } from 'vitest';
import { can, permissionsOf } from './permissions';
import { parseTask, taskFixture } from './test-fixtures';

describe('task schema', () => {
  it('applies the documented defaults', () => {
    const task = parseTask({ status: 'todo' });

    expect(task.labels).toEqual([]);
    expect(task.subtasks).toEqual([]);
    expect(task.assigneeId).toBeNull();
    expect(task.recurrence).toBeNull();
  });

  it('rejects an unknown status', () => {
    expect(() => parseTask({ status: 'blocked' })).toThrow();
  });

  it('rejects a malformed key', () => {
    expect(() => parseTask({ key: 'web-13' })).toThrow();
  });

  it('rejects an unknown label', () => {
    expect(() => parseTask({ labels: ['design', 'invented'] })).toThrow();
  });

  it('round-trips a complete task', () => {
    expect(parseTask(taskFixture).title).toBe('Finalize navigation');
  });
});

describe('permissions', () => {
  it('gives the owner every permission', () => {
    expect(permissionsOf('owner')).toContain('role:manage');
    expect(can('owner', 'project:delete')).toBe(true);
  });

  it('keeps destructive project actions away from admins', () => {
    expect(can('admin', 'project:delete')).toBe(false);
    expect(can('admin', 'member:invite')).toBe(true);
  });

  it('limits guests to reading projects', () => {
    expect(can('guest', 'project:read')).toBe(true);
    expect(can('guest', 'task:write')).toBe(false);
  });
});
