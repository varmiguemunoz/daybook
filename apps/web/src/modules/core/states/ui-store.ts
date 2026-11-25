import { create } from 'zustand';

export interface UiState {
  sidebarOpen: boolean;
  commandPaletteOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>(set => ({
  sidebarOpen: true,
  commandPaletteOpen: false,
  setSidebarOpen: open => set({ sidebarOpen: open }),
  toggleSidebar: () => set(state => ({ sidebarOpen: !state.sidebarOpen })),
  setCommandPaletteOpen: open => set({ commandPaletteOpen: open }),
}));
