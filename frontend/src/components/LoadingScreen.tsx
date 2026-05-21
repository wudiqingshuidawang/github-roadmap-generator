export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-center px-4">
      <div className="relative mb-8">
        <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Generating your roadmap</h2>
      <p className="text-gray-600 text-center max-w-md">
        Searching GitHub for similar projects and building your personalized learning path...
      </p>
      <div className="mt-8 flex gap-2">
        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
}
