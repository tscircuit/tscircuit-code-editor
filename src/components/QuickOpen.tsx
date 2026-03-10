import { useState, useRef, useEffect, useMemo, useCallback } from "react"
import { Search, FileCode2, FileJson, FileText, File } from "lucide-react"
import type { EditorFile } from "../types"
import { getFileExtension } from "../lib/language-map"

interface QuickOpenProps {
  files: EditorFile[]
  onSelect: (path: string) => void
  onClose: () => void
}

function getResultIcon(path: string) {
  const ext = getFileExtension(path)
  const cls = "w-4 h-4 shrink-0"
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

function isBoundary(char: string): boolean {
  return char === "/" || char === "." || char === "-" || char === "_"
}

function isUpperCase(char: string): boolean {
  return char >= "A" && char <= "Z"
}

function fuzzyMatch(query: string, target: string): number {
  if (!query) return 1
  const q = query.trim().toLowerCase()
  if (!q) return 1
  const fileName = target.split("/").pop() ?? target
  const fn = fileName.toLowerCase()

  if (fn === q) return 10000
  if (fn.startsWith(q)) return 5000 + (100 - fn.length)

  const exactInFile = fn.indexOf(q)
  if (exactInFile !== -1) return 3000 - exactInFile

  const t = target.toLowerCase()
  const exactInPath = t.indexOf(q)
  if (exactInPath !== -1) return 1000 - exactInPath

  let qi = 0
  let score = 0
  let consecutive = 0
  let lastMatchIdx = -1
  let firstMatchInFileName = false

  const fileNameStart = target.lastIndexOf("/") + 1

  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      score += 10

      if (lastMatchIdx >= 0 && ti === lastMatchIdx + 1) {
        consecutive++
        score += consecutive * 5
      } else {
        consecutive = 0
      }

      if (ti === 0 || (ti > 0 && isBoundary(target[ti - 1] ?? ""))) {
        score += 20
      }

      if (ti > 0 && isUpperCase(target[ti] ?? "")) {
        score += 15
      }

      if (ti >= fileNameStart && !firstMatchInFileName) {
        firstMatchInFileName = true
        score += 30
      }

      if (ti >= fileNameStart) {
        score += 5
      }

      lastMatchIdx = ti
      qi++
    }
  }

  if (qi < q.length) return -1

  score -= (target.length - fileName.length) * 0.5

  return score
}

export function QuickOpen({ files, onSelect, onClose }: QuickOpenProps) {
  const [query, setQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const filtered = useMemo(() => {
    const trimmed = query.trim()
    if (!trimmed) return files

    const scored = files
      .map((file) => ({
        file,
        score: fuzzyMatch(trimmed, file.path),
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)

    return scored.map((item) => item.file)
  }, [files, query])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  useEffect(() => {
    if (listRef.current) {
      const selected = listRef.current.children[selectedIndex] as HTMLElement
      selected?.scrollIntoView({ block: "nearest" })
    }
  }, [selectedIndex])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault()
          setSelectedIndex((prev) =>
            prev < filtered.length - 1 ? prev + 1 : 0,
          )
          break
        case "ArrowUp":
          e.preventDefault()
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : filtered.length - 1,
          )
          break
        case "Enter":
          e.preventDefault()
          if (filtered[selectedIndex]) {
            onSelect(filtered[selectedIndex].path)
            onClose()
          }
          break
        case "Escape":
          e.preventDefault()
          onClose()
          break
      }
    },
    [filtered, selectedIndex, onSelect, onClose],
  )

  return (
    <div
      className="fixed inset-0 z-50 flex justify-center pt-[15vh]"
      onClick={onClose}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
      role="dialog"
    >
      <div className="absolute inset-0 bg-black/20" />
      <div
        className="relative w-full max-w-lg mx-4 bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden"
        style={{ maxHeight: "400px" }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={() => {}}
        role="listbox"
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search files by name..."
            className="flex-1 text-sm bg-transparent outline-none text-gray-900 placeholder-gray-400"
          />
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-gray-400 bg-gray-100 rounded border border-gray-200">
            ESC
          </kbd>
        </div>

        <div
          ref={listRef}
          className="overflow-y-auto tsce-scrollbar"
          style={{ maxHeight: "340px" }}
        >
          {filtered.map((file, index) => {
            const fileName = file.path.split("/").pop() ?? file.path
            const dirPath = file.path.split("/").slice(0, -1).join("/") || ""

            return (
              <button
                key={file.path}
                type="button"
                className={`flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors ${
                  index === selectedIndex
                    ? "bg-blue-50 text-blue-900"
                    : "hover:bg-gray-50 text-gray-700"
                }`}
                onClick={() => {
                  onSelect(file.path)
                  onClose()
                }}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                {getResultIcon(file.path)}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{fileName}</div>
                  {dirPath && (
                    <div className="text-xs text-gray-400 truncate">
                      {dirPath}
                    </div>
                  )}
                </div>
              </button>
            )
          })}

          {filtered.length === 0 && (
            <div className="py-8 text-center text-sm text-gray-400">
              No files found
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
