import { Icon } from '../../../shared/ui/Icon';
import type { TaskDefaults } from '../../views/view-model';
import { useTaskUi } from '../task-ui-store';

export function NewTaskButton({ defaults }: { defaults?: TaskDefaults }) {
  const openComposer = useTaskUi(state => state.openComposer);

  return (
    <button className="btn btn-primary" type="button" onClick={() => openComposer(defaults)}>
      <Icon name="plus" size={14} />
      New task
    </button>
  );
}
