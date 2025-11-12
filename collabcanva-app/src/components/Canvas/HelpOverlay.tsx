interface HelpOverlayProps {
  onClose: () => void;
}

export default function HelpOverlay({ onClose }: HelpOverlayProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">How to Use CollabCanvas</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 help-overlay-content" style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#cbd5e1 transparent'
        }}>
          {/* Canvas Controls */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              🖼️ Canvas Controls
            </h3>
            <div className="space-y-3 bg-gray-50 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <kbd className="px-3 py-1 bg-white border border-gray-300 rounded-lg text-sm font-mono shadow-sm min-w-[80px] text-center">
                  Drag
                </kbd>
                <span className="text-gray-700 flex-1">Pan around the canvas</span>
              </div>
              <div className="flex items-start gap-3">
                <kbd className="px-3 py-1 bg-white border border-gray-300 rounded-lg text-sm font-mono shadow-sm min-w-[80px] text-center">
                  Scroll
                </kbd>
                <span className="text-gray-700 flex-1">Zoom in and out</span>
              </div>
              <div className="flex items-start gap-3">
                <kbd className="px-3 py-1 bg-white border border-gray-300 rounded-lg text-sm font-mono shadow-sm min-w-[80px] text-center">
                  Space
                </kbd>
                <span className="text-gray-700 flex-1">Reset view to center</span>
              </div>
            </div>
          </section>

          {/* Shape Controls */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              🎨 Shape Controls
            </h3>
            <div className="space-y-3 bg-gray-50 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <kbd className="px-3 py-1 bg-white border border-gray-300 rounded-lg text-sm font-mono shadow-sm min-w-[80px] text-center">
                  Click
                </kbd>
                <span className="text-gray-700 flex-1">Select a shape</span>
              </div>
              <div className="flex items-start gap-3">
                <kbd className="px-3 py-1 bg-white border border-gray-300 rounded-lg text-sm font-mono shadow-sm min-w-[80px] text-center">
                  Drag
                </kbd>
                <span className="text-gray-700 flex-1">Move selected shape</span>
              </div>
              <div className="flex items-start gap-3">
                <kbd className="px-3 py-1 bg-white border border-gray-300 rounded-lg text-sm font-mono shadow-sm min-w-[80px] text-center">
                  Corners
                </kbd>
                <span className="text-gray-700 flex-1">Resize shape (drag blue anchors)</span>
              </div>
              <div className="flex items-start gap-3">
                <kbd className="px-3 py-1 bg-white border border-gray-300 rounded-lg text-sm font-mono shadow-sm min-w-[80px] text-center">
                  Rotate
                </kbd>
                <span className="text-gray-700 flex-1">Rotate shape (drag top handle)</span>
              </div>
              <div className="flex items-start gap-3">
                <kbd className="px-3 py-1 bg-white border border-gray-300 rounded-lg text-sm font-mono shadow-sm min-w-[80px] text-center">
                  Delete
                </kbd>
                <span className="text-gray-700 flex-1">Delete selected shape</span>
              </div>
              <div className="flex items-start gap-3">
                <kbd className="px-3 py-1 bg-white border border-gray-300 rounded-lg text-sm font-mono shadow-sm min-w-[80px] text-center">
                  Backspace
                </kbd>
                <span className="text-gray-700 flex-1">Delete selected shape (alternative)</span>
              </div>
              <div className="flex items-start gap-3">
                <kbd className="px-3 py-1 bg-white border border-gray-300 rounded-lg text-sm font-mono shadow-sm min-w-[80px] text-center">
                  Esc
                </kbd>
                <span className="text-gray-700 flex-1">Deselect shape</span>
              </div>
            </div>
          </section>

          {/* Keyboard Shortcuts */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              ⌨️ Keyboard Shortcuts
            </h3>
            <div className="space-y-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <kbd className="px-3 py-1 bg-white border border-gray-300 rounded-lg text-sm font-mono shadow-sm min-w-[120px] text-center">
                  Cmd/Ctrl + Z
                </kbd>
                <span className="text-gray-700 flex-1">Undo last action</span>
              </div>
              <div className="flex items-start gap-3">
                <kbd className="px-3 py-1 bg-white border border-gray-300 rounded-lg text-sm font-mono shadow-sm min-w-[120px] text-center">
                  Cmd/Ctrl + Shift + Z
                </kbd>
                <span className="text-gray-700 flex-1">Redo action</span>
              </div>
              <div className="flex items-start gap-3">
                <kbd className="px-3 py-1 bg-white border border-gray-300 rounded-lg text-sm font-mono shadow-sm min-w-[120px] text-center">
                  Cmd/Ctrl + D
                </kbd>
                <span className="text-gray-700 flex-1">Duplicate selected shape</span>
              </div>
              <div className="flex items-start gap-3">
                <kbd className="px-3 py-1 bg-white border border-gray-300 rounded-lg text-sm font-mono shadow-sm min-w-[120px] text-center">
                  Cmd/Ctrl + A
                </kbd>
                <span className="text-gray-700 flex-1">Select all shapes</span>
              </div>
              <div className="flex items-start gap-3">
                <kbd className="px-3 py-1 bg-white border border-gray-300 rounded-lg text-sm font-mono shadow-sm min-w-[120px] text-center">
                  Arrow Keys
                </kbd>
                <span className="text-gray-700 flex-1">Move selected shape by 1px</span>
              </div>
              <div className="flex items-start gap-3">
                <kbd className="px-3 py-1 bg-white border border-gray-300 rounded-lg text-sm font-mono shadow-sm min-w-[120px] text-center">
                  Shift + Arrows
                </kbd>
                <span className="text-gray-700 flex-1">Move selected shape by 10px</span>
              </div>
              <div className="flex items-start gap-3">
                <kbd className="px-3 py-1 bg-white border border-gray-300 rounded-lg text-sm font-mono shadow-sm min-w-[120px] text-center">
                  ?
                </kbd>
                <span className="text-gray-700 flex-1">Show this help menu</span>
              </div>
            </div>
          </section>

          {/* AI Assistant */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              🤖 AI Assistant
            </h3>
            <div className="space-y-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4">
              <p className="text-gray-700">
                <strong className="text-gray-900">Natural language commands:</strong> Tell the AI what to create in plain English!
              </p>
              <div className="mt-2 space-y-1 text-sm text-gray-600">
                <p>• "Create a red circle at 500, 300"</p>
                <p>• "Make a 3x3 grid of blue squares"</p>
                <p>• "Create a login form"</p>
                <p>• "Add 5 colorful shapes in a row"</p>
              </div>
              <p className="text-gray-700 mt-2">
                <strong className="text-gray-900">Collaborative AI:</strong> All team members can use the AI - changes sync instantly!
              </p>
            </div>
          </section>

          {/* Collaboration */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              👥 Collaboration
            </h3>
            <div className="space-y-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4">
              <p className="text-gray-700">
                <strong className="text-gray-900">Real-time sync:</strong> See your teammates' cursors and changes instantly!
              </p>
              <p className="text-gray-700">
                <strong className="text-gray-900">Object locking:</strong> When someone edits a shape, it's locked (red border) so you don't conflict.
              </p>
              <p className="text-gray-700">
                <strong className="text-gray-900">Presence:</strong> See who's online in the top-right corner.
              </p>
            </div>
          </section>

          {/* Performance */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              📊 Performance
            </h3>
            <div className="space-y-3 bg-gray-50 rounded-xl p-4">
              <p className="text-gray-700">
                Click the <strong className="text-gray-900">chart icon</strong> in the bottom toolbar to see:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                <li>Real-time FPS counter</li>
                <li>Number of shapes on canvas</li>
                <li>Stress test tools (+50, +100, +200 shapes)</li>
              </ul>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
          >
            Got it! Let's Create 🎨
          </button>
        </div>
      </div>
    </div>
  );
}

