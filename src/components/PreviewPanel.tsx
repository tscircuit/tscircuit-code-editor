import { Cpu } from "lucide-react"

interface PreviewPanelProps {
  fsMap: Map<string, string>
  renderPreview?: (props: { fsMap: Map<string, string> }) => React.ReactNode
  className?: string
}

export function PreviewPanel({
  fsMap,
  renderPreview,
  className = "",
}: PreviewPanelProps) {
  if (renderPreview) {
    return (
      <div className={`flex flex-col h-full bg-white ${className}`}>
        {renderPreview({ fsMap })}
      </div>
    )
  }

  return (
    <div
      className={`flex flex-col items-center justify-center h-full bg-gray-50 ${className}`}
    >
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
