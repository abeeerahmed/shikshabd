import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  dark: boolean;
  setDark: (v: boolean) => void;
  favorites: string[];
  toggleFavorite: (eiin: string) => void;
  isFavorite: (eiin: string) => boolean;
  compareList: string[];
  addToCompare: (eiin: string) => void;
  removeFromCompare: (eiin: string) => void;
  clearCompare: () => void;
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      dark: localStorage.getItem('theme') === 'dark',
      setDark: (v) => {
        set({ dark: v });
        document.documentElement.classList.toggle('dark', v);
        localStorage.setItem('theme', v ? 'dark' : 'light');
      },
      favorites: JSON.parse(localStorage.getItem('edu_favorites') || '[]'),
      toggleFavorite: (eiin) => {
        const favs = get().favorites;
        const idx = favs.indexOf(eiin);
        const next = idx >= 0 ? favs.filter((e) => e !== eiin) : [...favs, eiin];
        set({ favorites: next });
        localStorage.setItem('edu_favorites', JSON.stringify(next));
      },
      isFavorite: (eiin) => get().favorites.includes(eiin),
      compareList: [],
      addToCompare: (eiin) => {
        const list = get().compareList;
        if (list.length < 3 && !list.includes(eiin)) {
          set({ compareList: [...list, eiin] });
        }
      },
      removeFromCompare: (eiin) => {
        set({ compareList: get().compareList.filter((e) => e !== eiin) });
      },
      clearCompare: () => set({ compareList: [] }),
      sidebarOpen: false,
      setSidebarOpen: (v) => set({ sidebarOpen: v }),
    }),
    { name: 'edu-app-store' },
  ),
);