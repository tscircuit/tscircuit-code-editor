import { useEffect, useState } from "react"
import { Cpu, TriangleAlert, X } from "lucide-react"
import type { PreviewWarning } from "../types"

interface PreviewPanelProps {
  fsMap: Map<string, string>
  renderPreview?: (props: { fsMap: Map<string, string> }) => React.ReactNode
  warnings?: PreviewWarning[]
  className?: string
}

export function PreviewPanel({
  fsMap,
  renderPreview,
  warnings = [],
  className = "",
}: PreviewPanelProps) {
  const [dismissed, setDismissed] = useState(false)
  const signature = warnings.map((w) => w.message).join("\n")

  useEffect(() => {
    setDismissed(false)
  }, [signature])

  const showWarnings = warnings.length > 0 && !dismissed

  return (
    <div className={`flex flex-col h-full bg-white ${className}`}>
      {showWarnings && (
        <div className="shrink-0 border-b border-amber-200 bg-amber-50 px-3 py-2">
          <div className="flex items-start gap-2">
            <TriangleAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-amber-800">
                {warnings.length === 1
                  ? "1 property was ignored"
                  : `${warnings.length} properties were ignored`}
              </p>
              <ul className="mt-1 space-y-0.5">
                {warnings.map((w) => (
                  <li
                    key={w.message}
                    className="text-xs text-amber-700 break-words"
                  >
                    {w.message}
                  </li>
                ))}
              </ul>
            </div>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="p-0.5 rounded hover:bg-amber-100 transition-colors"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5 text-amber-600" />
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0">
        {renderPreview ? renderPreview({ fsMap }) : <PreviewPlaceholder />}
      </div>
    </div>
  )
}

function PreviewPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-gray-50">
      <div className="flex flex-col items-center gap-4 text-center px-6">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center">
          <Cpu className="w-8 h-8 text-blue-600" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-1">
            Circuit Preview
          </h3>
          <p className="text-xs text-gray-400 max-w-[200px]">
            Preview will render here when @tscircuit/runframe is connected
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-xs text-blue-600 font-medium">
            Waiting for renderer
          </span>
        </div>
      </div>
    </div>
  )
}
