import { useState } from 'react';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core';
import type { Member, Task } from '@daybook/domain';
import { addDays, monthRange, startOfWeek } from '../../core/utils/dates';
import { useUpdateTask } from '../../tasks/services/queries';
import type { CalendarMode } from './CalendarToolbar';
import { CalendarMonth } from './CalendarMonth';
import { CalendarWeek } from './CalendarWeek';
import { MonthChipContent } from './CalendarChips';

const WEEK_LENGTH = 7;

interface Props {
  mode: CalendarMode;
  cursor: Date;
  tasks: Task[];
  memberById: Map<string, Member>;
}

function useCalendarDrag(tasks: Task[]) {
  const update = useUpdateTask();
  const [activeId, setActiveId] = useState<string | null>(null);

  function onDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    const task = tasks.find(item => item.id === active.id);
    const dueDate = over ? String(over.id) : null;
    if (task && dueDate && task.dueDate !== dueDate) update.mutate({ id: task.id, patch: { dueDate } });
  }

  return { activeTask: tasks.find(task => task.id === activeId), onDragStart, onDragEnd, onDragCancel: () => setActiveId(null) };
}

export function CalendarGrid({ mode, cursor, tasks, memberById }: Props) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const { activeTask, ...handlers } = useCalendarDrag(tasks);
  const days = mode === 'month' ? monthRange(cursor) : Array.from({ length: WEEK_LENGTH }, (_, index) => addDays(startOfWeek(cursor), index));

  return (
    <DndContext sensors={sensors} {...handlers}>
      <div className="cal" style={{ minHeight: 640 }}>
        {mode === 'month' ? (
          <CalendarMonth days={days} month={cursor} tasks={tasks} members={memberById} />
        ) : (
          <CalendarWeek days={days} tasks={tasks} members={memberById} />
        )}
      </div>
      <DragOverlay>
        {activeTask && (
          <div className="cev" style={{ ['--c' as string]: 'var(--gray)', cursor: 'grabbing', boxShadow: 'var(--shadow-drag)' }}>
            <MonthChipContent task={activeTask} assignee={activeTask.assigneeId ? memberById.get(activeTask.assigneeId) : undefined} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
