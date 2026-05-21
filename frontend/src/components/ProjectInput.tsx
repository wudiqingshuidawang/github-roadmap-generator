import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ProjectInput() {
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (description.trim().length < 5) {
      setError("Please describe your project in at least 5 characters");
      return;
    }
    navigate("/generating", { state: { description } });
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="relative">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your project idea... e.g., 'I want to build an e-commerce website with shopping cart and payment'"
          className="w-full h-40 p-4 text-lg border-2 border-gray-200 rounded-xl resize-none focus:border-blue-500 focus:outline-none transition-colors"
        />
      </div>
      {error && <p className="mt-2 text-red-500 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={description.trim().length < 5}
        className="mt-4 px-8 py-3 bg-blue-600 text-white text-lg font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        Generate Roadmap
      </button>
    </form>
  );
}
