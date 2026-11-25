import { describe, expect, it } from 'vitest';
import { isOverdue, projectProgress, statusAfterCompletion, taskProgress } from './progress';
import { parseTask, taskFixture } from './test-fixtures';

describe('task progress', () => {
  it('counts subtasks when present', () => {
    const task = parseTask({
      subtasks: [
        { id: 's1', title: 'One', done: true },
        { id: 's2', title: 'Two', done: false },
      ],
    });

    expect(taskProgress(task)).toBe(50);
  });

  it('falls back to the status weight without subtasks', () => {
    expect(taskProgress(taskFixture)).toBe(45);
  });

  it('treats a done task as complete regardless of subtasks', () => {
    expect(taskProgress(parseTask({ status: 'done' }))).toBe(100);
  });
});

describe('project progress', () => {
  it('is the share of done tasks', () => {
    const tasks = [parseTask({ status: 'done' }), parseTask({ status: 'todo' }), parseTask({ status: 'done' }), parseTask({ status: 'review' })];

    expect(projectProgress(tasks)).toBe(50);
  });

  it('is zero without tasks', () => {
    expect(projectProgress([])).toBe(0);
  });
});

describe('overdue', () => {
  it('ignores completed and undated tasks', () => {
    expect(isOverdue(parseTask({ dueDate: '2026-01-01' }), '2026-06-01')).toBe(true);
    expect(isOverdue(parseTask({ dueDate: '2026-01-01', status: 'done' }), '2026-06-01')).toBe(false);
    expect(isOverdue(parseTask({ dueDate: null }), '2026-06-01')).toBe(false);
  });
});

describe('completion toggle', () => {
  it('reopens a done task to todo', () => {
    expect(statusAfterCompletion('done')).toBe('todo');
    expect(statusAfterCompletion('progress')).toBe('done');
  });
});
