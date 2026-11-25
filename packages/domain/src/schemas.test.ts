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
  it('gives admins every permission', () => {
    expect(permissionsOf('admin')).toContain('workspace:manage');
    expect(can('admin', 'project:delete')).toBe(true);
  });

  it('keeps workspace management and deletes away from members', () => {
    expect(can('member', 'task:write')).toBe(true);
    expect(can('member', 'project:delete')).toBe(false);
    expect(can('member', 'workspace:manage')).toBe(false);
  });
});
