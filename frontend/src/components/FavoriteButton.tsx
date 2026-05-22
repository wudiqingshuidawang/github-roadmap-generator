import { useState } from "react";
import toast from "react-hot-toast";
import { isFavorited, toggleFavorite } from "../utils/favorites";

interface Props {
  shareToken: string;
}

export default function FavoriteButton({ shareToken }: Props) {
  const [fav, setFav] = useState(() => isFavorited(shareToken));

  const handleClick = () => {
    const newState = toggleFavorite(shareToken);
    setFav(newState);
    toast(newState ? "已收藏 ⭐" : "已取消收藏", { icon: newState ? "⭐" : "💔" });
  };

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors ${
        fav
          ? "bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100"
          : "bg-white border-gray-200 text-gray-600 hover:border-yellow-300 hover:text-yellow-600"
      }`}
    >
      {fav ? "⭐" : "☆"} {fav ? "已收藏" : "收藏"}
    </button>
  );
}
