interface EmptyStateProps {
  onAddShape: () => void;
  onShowHelp: () => void;
}

export default function EmptyState({ onAddShape, onShowHelp }: EmptyStateProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-10">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg mx-4 pointer-events-auto border-2 border-gray-100">
        {/* Icon */}
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
          <svg
            className="w-8 h-8 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
            />
          </svg>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">
          Welcome to CollabCanvas! 🎨
        </h2>

        {/* Description */}
        <p className="text-gray-600 text-center mb-6 leading-relaxed">
          Start creating your masterpiece! Add shapes, collaborate in real-time,
          and watch your ideas come to life with your team.
        </p>

        {/* Quick Tips */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-6 space-y-3">
          <h3 className="font-semibold text-gray-900 text-sm mb-2">Quick Tips:</h3>
          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">✓</span>
              <span><strong>Add shapes</strong> with the button below</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">✓</span>
              <span><strong>Move</strong> by dragging the canvas</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">✓</span>
              <span><strong>Zoom</strong> with your mousewheel</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">✓</span>
              <span><strong>See teammates' cursors</strong> in real-time!</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onAddShape}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 transform"
          >
            🎨 Add Your First Shape
          </button>
          <button
            onClick={onShowHelp}
            className="px-4 py-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all duration-200"
            title="Show Help"
          >
            ?
          </button>
        </div>
      </div>
    </div>
  );
}

