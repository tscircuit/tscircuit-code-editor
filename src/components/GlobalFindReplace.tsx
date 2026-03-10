import { useState, useMemo, useRef, useEffect, useCallback } from "react"
import {
  Search,
  Replace,
  X,
  CaseSensitive,
  Regex,
  WholeWord,
  ChevronDown,
  ChevronRight,
  FileCode2,
} from "lucide-react"
import type { EditorFile, SearchMatch } from "../types"

interface GlobalFindReplaceProps {
  files: EditorFile[]
  onNavigate: (path: string, lineNumber: number) => void
  onReplace?: (
    path: string,
    lineNumber: number,
    match: string,
    replacement: string,
  ) => void
  onReplaceAll?: (
    match: string,
    replacement: string,
    options: SearchOptions,
  ) => void
  onClose: () => void
}

interface SearchOptions {
  caseSensitive: boolean
  wholeWord: boolean
  useRegex: boolean
}

function searchInFiles(
  files: EditorFile[],
  query: string,
  options: SearchOptions,
): Map<string, SearchMatch[]> {
  const results = new Map<string, SearchMatch[]>()
  if (!query) return results

  for (const file of files) {
    const lines = file.content.split("\n")
    const matches: SearchMatch[] = []

    for (let i = 0; i < lines.length; i++) {
      const rawLine = lines[i] ?? ""
      let searchLine = rawLine
      let searchQuery = query

      if (!options.caseSensitive) {
        searchLine = rawLine.toLowerCase()
        searchQuery = query.toLowerCase()
      }

      let startIdx = 0
      while (true) {
        let foundIdx: number

        if (options.useRegex) {
          try {
            const flags = options.caseSensitive ? "g" : "gi"
            const regex = new RegExp(query, flags)
            regex.lastIndex = startIdx
            const m = regex.exec(rawLine)
            if (!m) break
            foundIdx = m.index

            if (
              options.wholeWord &&
              !isWholeWord(rawLine, foundIdx, m[0].length)
            ) {
              startIdx = foundIdx + 1
              continue
            }

            matches.push({
              filePath: file.path,
              lineNumber: i + 1,
              column: foundIdx + 1,
              lineContent: rawLine,
              matchStart: foundIdx,
              matchEnd: foundIdx + m[0].length,
            })
            startIdx = foundIdx + m[0].length
          } catch {
            break
          }
        } else {
          foundIdx = searchLine.indexOf(searchQuery, startIdx)
          if (foundIdx === -1) break

          if (
            options.wholeWord &&
            !isWholeWord(rawLine, foundIdx, searchQuery.length)
          ) {
            startIdx = foundIdx + 1
            continue
          }

          matches.push({
            filePath: file.path,
            lineNumber: i + 1,
            column: foundIdx + 1,
            lineContent: rawLine,
            matchStart: foundIdx,
            matchEnd: foundIdx + searchQuery.length,
          })
          startIdx = foundIdx + searchQuery.length
        }
      }
    }

    if (matches.length > 0) {
      results.set(file.path, matches)
    }
  }

  return results
}

function isWholeWord(line: string, start: number, length: number): boolean {
  const before = start > 0 ? (line[start - 1] ?? " ") : " "
  const after =
    start + length < line.length ? (line[start + length] ?? " ") : " "
  return !/\w/.test(before) && !/\w/.test(after)
}

export function GlobalFindReplace({
  files,
  onNavigate,
  onReplace,
  onReplaceAll,
  onClose,
}: GlobalFindReplaceProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [replaceQuery, setReplaceQuery] = useState("")
  const [showReplace, setShowReplace] = useState(false)
  const [options, setOptions] = useState<SearchOptions>({
    caseSensitive: false,
    wholeWord: false,
    useRegex: false,
  })
  const [collapsedFiles, setCollapsedFiles] = useState<Set<string>>(
    () => new Set(),
  )
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    searchInputRef.current?.focus()
  }, [])

  const results = useMemo(
    () => searchInFiles(files, searchQuery, options),
    [files, searchQuery, options],
  )

  const totalMatches = useMemo(() => {
    let count = 0
    for (const matches of results.values()) {
      count += matches.length
    }
    return count
  }, [results])

  const toggleFile = useCallback((path: string) => {
    setCollapsedFiles((prev) => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }, [])

  const toggleOption = (key: keyof SearchOptions) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-gray-700">Search</span>
          {searchQuery && (
            <span className="text-xs text-gray-400">
              {totalMatches} result{totalMatches !== 1 ? "s" : ""} in{" "}
              {results.size} file{results.size !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 hover:bg-gray-200 rounded transition-colors"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      <div className="px-3 py-2 border-b border-gray-200 space-y-2">
        <div className="flex items-center gap-1">
          <div className="relative flex-1">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search"
              className="w-full text-sm px-2 py-1.5 border border-gray-300 rounded bg-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 pr-20"
            />
            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => toggleOption("caseSensitive")}
                className={`p-0.5 rounded transition-colors ${
                  options.caseSensitive
                    ? "bg-blue-100 text-blue-700"
                    : "hover:bg-gray-100 text-gray-400"
                }`}
                title="Match Case"
              >
                <CaseSensitive className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => toggleOption("wholeWord")}
                className={`p-0.5 rounded transition-colors ${
                  options.wholeWord
                    ? "bg-blue-100 text-blue-700"
                    : "hover:bg-gray-100 text-gray-400"
                }`}
                title="Whole Word"
              >
                <WholeWord className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => toggleOption("useRegex")}
                className={`p-0.5 rounded transition-colors ${
                  options.useRegex
                    ? "bg-blue-100 text-blue-700"
                    : "hover:bg-gray-100 text-gray-400"
                }`}
                title="Use Regex"
              >
                <Regex className="w-4 h-4" />
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowReplace(!showReplace)}
            className={`p-1.5 rounded transition-colors ${
              showReplace
                ? "bg-blue-100 text-blue-700"
                : "hover:bg-gray-100 text-gray-400"
            }`}
            title="Toggle Replace"
          >
            <Replace className="w-4 h-4" />
          </button>
        </div>

        {showReplace && (
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={replaceQuery}
              onChange={(e) => setReplaceQuery(e.target.value)}
              placeholder="Replace"
              className="flex-1 text-sm px-2 py-1.5 border border-gray-300 rounded bg-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            {onReplaceAll && (
              <button
                type="button"
                onClick={() => onReplaceAll(searchQuery, replaceQuery, options)}
                className="px-2 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors"
              >
                All
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto tsce-scrollbar">
        {Array.from(results.entries()).map(([filePath, matches]) => {
          const isCollapsed = collapsedFiles.has(filePath)
          const fileName = filePath.split("/").pop() ?? filePath

          return (
            <div key={filePath}>
              <button
                type="button"
                className="flex items-center gap-1.5 w-full px-3 py-1.5 text-left hover:bg-gray-50 transition-colors"
                onClick={() => toggleFile(filePath)}
              >
                {isCollapsed ? (
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                )}
                <FileCode2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span className="text-sm font-medium text-gray-700 truncate">
                  {fileName}
                </span>
                <span className="ml-auto text-xs text-gray-400 shrink-0">
                  {matches.length}
                </span>
              </button>

              {!isCollapsed &&
                matches.map((match, idx) => (
                  <button
                    key={`${match.lineNumber}-${match.column}-${idx}`}
                    type="button"
                    className="flex items-start gap-2 w-full pl-8 pr-3 py-1 text-left hover:bg-blue-50 transition-colors"
                    onClick={() => onNavigate(match.filePath, match.lineNumber)}
                  >
                    <span className="text-xs text-gray-400 font-mono w-6 text-right shrink-0 pt-0.5">
                      {match.lineNumber}
                    </span>
                    <span className="text-xs font-mono text-gray-600 truncate">
                      {match.lineContent.substring(0, match.matchStart)}
                      <span className="bg-yellow-200 text-yellow-900 font-semibold">
                        {match.lineContent.substring(
                          match.matchStart,
                          match.matchEnd,
                        )}
                      </span>
                      {match.lineContent.substring(match.matchEnd)}
                    </span>
                  </button>
                ))}
            </div>
          )
        })}

        {searchQuery && results.size === 0 && (
          <div className="py-8 text-center text-sm text-gray-400">
            No results found
          </div>
        )}

        {!searchQuery && (
          <div className="py-8 text-center text-sm text-gray-400">
            Type to search across files
          </div>
        )}
      </div>
    </div>
  )
}
