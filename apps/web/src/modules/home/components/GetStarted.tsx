import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { can } from '@daybook/domain';
import { Icon } from '../../core/components/Icon';
import { useNoteIndex } from '../../notes/services/queries';
import type { Bootstrap } from '../../workspace/services/queries';

interface Step {
  id: string;
  title: string;
  text: string;
  done: boolean;
  action: string;
  onAction: () => void;
}

interface GetStartedProps {
  bootstrap: Bootstrap;
  taskCount: number;
  onNewTask: () => void;
  onInvite: () => void;
}

// Per person and workspace, so hiding it in one organization keeps it in the next one.
function useHidden(key: string) {
  const [hidden, setHidden] = useState(() => {
    try {
      return localStorage.getItem(key) === '1';
    } catch {
      return false;
    }
  });

  function hide() {
    setHidden(true);
    try {
      localStorage.setItem(key, '1');
    } catch {
      // Storage can be blocked; the list stays hidden for this visit.
    }
  }

  return { hidden, hide };
}

function useSteps({ bootstrap, taskCount, onNewTask, onInvite }: GetStartedProps): Step[] | null {
  const navigate = useNavigate();
  const { data: notes } = useNoteIndex();
  if (!notes) return null;

  const { workspace, me, members } = bootstrap;
  const steps: Step[] = [
    {
      id: 'task',
      title: 'Add your first task',
      text: 'Give it an owner and a due date so it lands on their Home.',
      done: taskCount > 0,
      action: 'New task',
      onAction: onNewTask,
    },
    {
      id: 'note',
      title: 'Write your first note',
      text: 'Keep decisions, specs and meeting notes next to the work.',
      done: notes.length > 0,
      action: 'Open Notes',
      onAction: () => navigate('/notes'),
    },
  ];
  if (can(me.role, 'workspace:manage')) {
    const active = members.filter(member => member.status === 'active').length;
    steps.push({
      id: 'invite',
      title: 'Invite your team',
      text: `Tasks and notes update live for everyone in ${workspace.name}.`,
      done: active > 1,
      action: 'Invite member',
      onAction: onInvite,
    });
  }
  return steps;
}

function StepRow({ step }: { step: Step }) {
  return (
    <li className={`gs-step ${step.done ? 'done' : ''}`.trim()}>
      <span className="gs-mark">
        <Icon name={step.done ? 'circle-check' : 'circle'} size={16} />
      </span>
      <span className="gs-copy">
        <span className="gs-title">{step.title}</span>
        <span className="gs-text">{step.text}</span>
      </span>
      {step.done ? (
        <span className="gs-state">Done</span>
      ) : (
        <button className="btn btn-secondary btn-sm" type="button" onClick={step.onAction}>
          {step.action}
        </button>
      )}
    </li>
  );
}

export function GetStarted(props: GetStartedProps) {
  const { workspace, me } = props.bootstrap;
  const { hidden, hide } = useHidden(`daybook-get-started-hidden:v1:${workspace.id}:${me.id}`);
  const steps = useSteps(props);
  const done = steps?.filter(step => step.done).length ?? 0;
  if (hidden || !steps || done === steps.length) return null;

  return (
    <section className="panel get-started" aria-labelledby="h-get-started">
      <div className="panel-h">
        <h2 id="h-get-started">Set up {workspace.name}</h2>
        <span className="gs-count">
          {done} of {steps.length} done
        </span>
        <div className="acts">
          <button className="ibtn ibtn-sm" type="button" data-tip="Hide" aria-label="Hide setup steps" onClick={hide}>
            <Icon name="x" size={15} />
          </button>
        </div>
      </div>
      <ol className="gs-list">
        {steps.map(step => (
          <StepRow key={step.id} step={step} />
        ))}
      </ol>
    </section>
  );
}
