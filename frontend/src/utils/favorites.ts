const STORAGE_KEY = "projectpath_favorites";

export function getFavorites(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function isFavorited(shareToken: string): boolean {
  return getFavorites().has(shareToken);
}

export function toggleFavorite(shareToken: string): boolean {
  const favs = getFavorites();
  if (favs.has(shareToken)) {
    favs.delete(shareToken);
  } else {
    favs.add(shareToken);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...favs]));
  return favs.has(shareToken);
}

export function getFavoriteCount(): number {
  return getFavorites().size;
}
