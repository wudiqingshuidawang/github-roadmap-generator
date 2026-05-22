import { useState } from "react";
import { isFavorited, toggleFavorite } from "../utils/favorites";

interface Props {
  shareToken: string;
}

export default function FavoriteButton({ shareToken }: Props) {
  const [favorited, setFavorited] = useState(() => isFavorited(shareToken));

  const handleClick = () => {
    const newState = toggleFavorite(shareToken);
    setFavorited(newState);
  };

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors ${
        favorited
          ? "bg-yellow-50 border-yellow-200 text-yellow-700"
          : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
      }`}
      title={favorited ? "Remove from favorites" : "Add to favorites"}
    >
      {favorited ? "⭐" : "☆"} {favorited ? "Favorited" : "Favorite"}
    </button>
  );
}
