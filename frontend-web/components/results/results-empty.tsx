export function ResultsEmpty({ onStartNew }: { onStartNew: () => void }) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-gray-500 mb-4">No results found</p>
        <button
          onClick={onStartNew}
          className="bg-cyan-500 text-white px-6 py-3 rounded-lg hover:bg-cyan-600"
        >
          Start New Analysis
        </button>
      </div>
    </div>
  );
}
