import { create } from 'zustand';
import { EMPTY_FILTER, type TaskDefaults, type TaskFilter } from '../views/view-model';

export type TaskViewKey = 'tasks' | 'board' | 'table' | 'calendar';

interface ViewState {
  query: string;
  filter: TaskFilter;
}

interface TaskUiState {
  composer: TaskDefaults | null;
  openTaskId: string | null;
  views: Partial<Record<TaskViewKey, ViewState>>;
  openComposer: (defaults?: TaskDefaults) => void;
  closeComposer: () => void;
  openTask: (id: string) => void;
  closeTask: () => void;
  setView: (key: TaskViewKey, view: Partial<ViewState>) => void;
}

export const DEFAULT_VIEW: ViewState = { query: '', filter: EMPTY_FILTER };

export const useTaskUi = create<TaskUiState>(set => ({
  composer: null,
  openTaskId: null,
  views: {},
  openComposer: defaults => set({ composer: defaults ?? {} }),
  closeComposer: () => set({ composer: null }),
  openTask: id => set({ openTaskId: id }),
  closeTask: () => set({ openTaskId: null }),
  setView: (key, view) => set(state => ({ views: { ...state.views, [key]: { ...DEFAULT_VIEW, ...state.views[key], ...view } } })),
}));
