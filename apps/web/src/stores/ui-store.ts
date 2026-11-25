import { create } from 'zustand';

export type Theme = 'light' | 'dark' | 'system';

export interface UiState {
  sidebarOpen: boolean;
  commandPaletteOpen: boolean;
  theme: Theme;
  density: 'comfortable' | 'compact';
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setTheme: (theme: Theme) => void;
  setDensity: (density: 'comfortable' | 'compact') => void;
}

export const useUiStore = create<UiState>(set => ({
  sidebarOpen: true,
  commandPaletteOpen: false,
  theme: 'system',
  density: 'comfortable',
  setSidebarOpen: open => set({ sidebarOpen: open }),
  toggleSidebar: () => set(state => ({ sidebarOpen: !state.sidebarOpen })),
  setCommandPaletteOpen: open => set({ commandPaletteOpen: open }),
  setTheme: theme => set({ theme }),
  setDensity: density => set({ density }),
}));
