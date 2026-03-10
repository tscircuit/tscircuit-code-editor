import type { CursorPosition } from "../types"
import { getLanguageFromPath } from "../lib/language-map"

interface StatusBarProps {
  cursorPosition: CursorPosition | null
  currentFile: string | null
  tabSize: number
  fileCount: number
  className?: string
}

export function StatusBar({
  cursorPosition,
  currentFile,
  tabSize,
  fileCount,
  className = "",
}: StatusBarProps) {
  const language = currentFile ? getLanguageFromPath(currentFile) : "plaintext"

  return (
    <div
      className={`flex items-center justify-between px-3 h-6 bg-blue-600 text-white text-[11px] font-mono select-none shrink-0 ${className}`}
    >
      <div className="flex items-center gap-4">
        {cursorPosition && (
          <span>
            Ln {cursorPosition.lineNumber}, Col {cursorPosition.column}
          </span>
        )}
        <span>Spaces: {tabSize}</span>
        <span>UTF-8</span>
        <span>LF</span>
      </div>

      <div className="flex items-center gap-4">
        <span className="capitalize">{language}</span>
        <span>
          {fileCount} file{fileCount !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  )
}
