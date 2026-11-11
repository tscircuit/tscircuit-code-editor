import type { EditorFile, SearchMatch } from "../types"

export interface SearchOptions {
  caseSensitive: boolean
  wholeWord: boolean
  useRegex: boolean
}

export function searchInFiles(
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
            startIdx = foundIdx + Math.max(m[0].length, 1)
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
