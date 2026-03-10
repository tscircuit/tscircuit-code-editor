import { useRef, useEffect } from "react"
import { X, FileCode2, FileJson, FileText, File } from "lucide-react"
import { getFileExtension } from "../lib/language-map"

interface EditorTabsProps {
  openFiles: string[]
  currentFile: string | null
  onSelectFile: (path: string) => void
  onCloseFile: (path: string) => void
  className?: string
}

function getTabIcon(path: string) {
  const ext = getFileExtension(path)
  const cls = "w-3.5 h-3.5 shrink-0"
  switch (ext) {
    case "tsx":
    case "ts":
    case "jsx":
    case "js":
      return <FileCode2 className={`${cls} text-blue-600`} />
    case "json":
      return <FileJson className={`${cls} text-yellow-600`} />
    case "md":
    case "txt":
      return <FileText className={`${cls} text-gray-500`} />
    default:
      return <File className={`${cls} text-gray-400`} />
  }
}

export function EditorTabs({
  openFiles,
  currentFile,
  onSelectFile,
  onCloseFile,
  className = "",
}: EditorTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const activeTabRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (activeTabRef.current && scrollRef.current) {
      const tab = activeTabRef.current
      const container = scrollRef.current
      const tabLeft = tab.offsetLeft
      const tabRight = tabLeft + tab.offsetWidth
      const scrollLeft = container.scrollLeft
      const containerWidth = container.clientWidth

      if (tabLeft < scrollLeft) {
        container.scrollTo({ left: tabLeft - 8, behavior: "smooth" })
      } else if (tabRight > scrollLeft + containerWidth) {
        container.scrollTo({
          left: tabRight - containerWidth + 8,
          behavior: "smooth",
        })
      }
    }
  }, [currentFile])

  if (openFiles.length === 0) return null

  return (
    <div
      ref={scrollRef}
      className={`flex items-stretch overflow-x-auto border-b border-gray-200 bg-gray-50 tsce-scrollbar ${className}`}
      style={{ minHeight: 36 }}
    >
      {openFiles.map((filePath) => {
        const isActive = filePath === currentFile
        const fileName = filePath.split("/").pop() ?? filePath

        return (
          <button
            key={filePath}
            ref={isActive ? activeTabRef : undefined}
            type="button"
            className={`group flex items-center gap-1.5 px-3 text-sm whitespace-nowrap border-r border-gray-200 transition-colors shrink-0 ${
              isActive
                ? "bg-white text-gray-900 border-b-2 border-b-blue-600"
                : "bg-gray-50 text-gray-600 hover:bg-gray-100 border-b-2 border-b-transparent"
            }`}
            onClick={() => onSelectFile(filePath)}
          >
            {getTabIcon(filePath)}
            <span className="max-w-[120px] truncate">{fileName}</span>
            <span
              className={`ml-1 p-0.5 rounded hover:bg-gray-300/50 transition-colors ${
                isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              }`}
              onClick={(e) => {
                e.stopPropagation()
                onCloseFile(filePath)
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.stopPropagation()
                  onCloseFile(filePath)
                }
              }}
              role="button"
              tabIndex={-1}
            >
              <X className="w-3 h-3" />
            </span>
          </button>
        )
      })}
    </div>
  )
}
