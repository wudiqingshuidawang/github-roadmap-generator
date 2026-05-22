import { create } from "zustand";
import { persist } from "zustand/middleware";

const STORAGE_KEY = "projectpath_favorites";

interface FavoritesState {
  /** Stored as array for JSON serialization; use helpers for set operations */
  favorites: string[];
  toggleFavorite: (shareToken: string) => boolean;
  isFavorited: (shareToken: string) => boolean;
  getFavoriteCount: () => number;
  getFavorites: () => Set<string>;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],

      toggleFavorite: (shareToken) => {
        const { favorites } = get();
        const idx = favorites.indexOf(shareToken);
        if (idx >= 0) {
          set({ favorites: favorites.filter((t) => t !== shareToken) });
          return false;
        }
        set({ favorites: [...favorites, shareToken] });
        return true;
      },

      isFavorited: (shareToken) => get().favorites.includes(shareToken),

      getFavoriteCount: () => get().favorites.length,

      getFavorites: () => new Set(get().favorites),
    }),
    {
      name: STORAGE_KEY,
    }
  )
);
