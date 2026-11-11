import assert from "node:assert/strict"
import { test } from "node:test"
import { createContext, Script } from "node:vm"
import { searchInFiles, type SearchOptions } from "../src/lib/search-in-files.ts"
import type { EditorFile, SearchMatch } from "../src/types.ts"

// Run with Node.js 22.18+ using: node --test tests/search-in-files.test.ts
const cases: {
  name: string
  query: string
  content: string
  options: Partial<SearchOptions>
  expected: [number, number, number, number][]
}[] = [
  {
    name: "beginning anchor",
    query: "^",
    content: "a",
    options: {},
    expected: [[1, 1, 0, 0]],
  },
  {
    name: "ending anchor",
    query: "$",
    content: "a",
    options: {},
    expected: [[1, 2, 1, 1]],
  },
  {
    name: "successive lookaheads",
    query: "(?=a)",
    content: "aba",
    options: {},
    expected: [
      [1, 1, 0, 0],
      [1, 3, 2, 2],
    ],
  },
  {
    name: "consuming then empty matches",
    query: "a*",
    content: "ab",
    options: {},
    expected: [
      [1, 1, 0, 1],
      [1, 2, 1, 1],
      [1, 3, 2, 2],
    ],
  },
  {
    name: "empty line anchor",
    query: "^",
    content: "",
    options: {},
    expected: [[1, 1, 0, 0]],
  },
  {
    name: "both line boundaries",
    query: "^|$",
    content: "a",
    options: {},
    expected: [
      [1, 1, 0, 0],
      [1, 2, 1, 1],
    ],
  },
  {
    name: "UTF-16 code unit positions",
    query: "(?=.)",
    content: "😀a",
    options: {},
    expected: [
      [1, 1, 0, 0],
      [1, 2, 1, 1],
      [1, 3, 2, 2],
    ],
  },
  {
    name: "anchors on each line including blank lines",
    query: "^",
    content: "a\n\nb",
    options: {},
    expected: [
      [1, 1, 0, 0],
      [2, 1, 0, 0],
      [3, 1, 0, 0],
    ],
  },
  {
    name: "whole-word accepted empty match",
    query: "^",
    content: " ",
    options: { wholeWord: true },
    expected: [[1, 1, 0, 0]],
  },
  {
    name: "whole-word rejected empty match",
    query: "^",
    content: "word",
    options: { wholeWord: true },
    expected: [],
  },
  {
    name: "greedy consuming regex",
    query: "a+",
    content: "aaa",
    options: {},
    expected: [[1, 1, 0, 3]],
  },
  {
    name: "overlapping lookaheads",
    query: "(?=aa)",
    content: "aaa",
    options: {},
    expected: [
      [1, 1, 0, 0],
      [1, 2, 1, 1],
    ],
  },
  {
    name: "nonoverlapping consuming matches",
    query: "aa",
    content: "aaa",
    options: {},
    expected: [[1, 1, 0, 2]],
  },
  {
    name: "case-insensitive regex",
    query: "a",
    content: "aA",
    options: { caseSensitive: false },
    expected: [
      [1, 1, 0, 1],
      [1, 2, 1, 2],
    ],
  },
  {
    name: "whole-word consuming matches",
    query: "cat",
    content: "cat scatter cat",
    options: { wholeWord: true },
    expected: [
      [1, 1, 0, 3],
      [1, 13, 12, 15],
    ],
  },
  {
    name: "literal caret",
    query: "^",
    content: "a^b",
    options: { useRegex: false },
    expected: [[1, 2, 1, 2]],
  },
  {
    name: "empty query",
    query: "",
    content: "a",
    options: {},
    expected: [],
  },
  {
    name: "invalid regex",
    query: "[",
    content: "a",
    options: {},
    expected: [],
  },
  {
    name: "lookbehind keeps preceding context",
    query: "(?<=a)",
    content: "aba",
    options: {},
    expected: [
      [1, 2, 1, 1],
      [1, 4, 3, 3],
    ],
  },
  {
    name: "word boundaries use the whole line",
    query: "\\b",
    content: "a b",
    options: {},
    expected: [
      [1, 1, 0, 0],
      [1, 2, 1, 1],
      [1, 3, 2, 2],
      [1, 4, 3, 3],
    ],
  },
  {
    name: "consuming lookbehind keeps preceding context",
    query: "(?<=a)b",
    content: "ab ab",
    options: {},
    expected: [
      [1, 2, 1, 2],
      [1, 5, 4, 5],
    ],
  },
]

function searchWithDeadline(
  files: EditorFile[],
  query: string,
  options: SearchOptions,
): Map<string, SearchMatch[]> {
  // This watchdog bounds synchronous infinite-loop regressions, not performance.
  // Keep setup outside the timed call and isolate every invocation.
  const context = createContext({ searchInFiles, files, query, options })
  const script = new Script("searchInFiles(files, query, options)")
  return script.runInContext(context, { timeout: 500 })
}

for (const { name, query, content, options, expected } of cases) {
  test(name, () => {
    const file = Object.freeze({ path: "example.ts", content })
    const files = [file]
    const result = searchWithDeadline(files, query, {
      caseSensitive: true,
      wholeWord: false,
      useRegex: true,
      ...options,
    })

    assert.deepEqual(
      result.get(file.path) ?? [],
      expected.map(([lineNumber, column, matchStart, matchEnd]) => ({
        filePath: file.path,
        lineNumber,
        column,
        lineContent: content.split("\n")[lineNumber - 1],
        matchStart,
        matchEnd,
      })),
    )
    assert.equal(result.size, expected.length > 0 ? 1 : 0)
    assert.deepEqual(files, [{ path: "example.ts", content }])
  })
}

test("searches every file without changing input order or content", () => {
  const files = [
    { path: "first.ts", content: "a" },
    { path: "second.ts", content: "b" },
  ]
  const result = searchWithDeadline(files, "$", {
    caseSensitive: true,
    wholeWord: false,
    useRegex: true,
  })
  assert.deepEqual([...result.keys()], ["first.ts", "second.ts"])
  assert.deepEqual(
    [...result.values()].flat().map((match) => [
      match.filePath,
      match.lineNumber,
      match.column,
      match.matchStart,
      match.matchEnd,
    ]),
    [
      ["first.ts", 1, 2, 1, 1],
      ["second.ts", 1, 2, 1, 1],
    ],
  )
  assert.deepEqual(files, [
    { path: "first.ts", content: "a" },
    { path: "second.ts", content: "b" },
  ])
})

test("empty file collection", () => {
  assert.equal(
    searchWithDeadline([], "^", {
      caseSensitive: true,
      wholeWord: false,
      useRegex: true,
    }).size,
    0,
  )
})

test("regex results agree with native whole-line matchAll", () => {
  for (const { name, query, content, options } of cases) {
    if (
      !query ||
      query === "[" ||
      options.useRegex === false ||
      options.wholeWord
    ) {
      continue
    }

    const file = { path: "oracle.ts", content }
    const caseSensitive = options.caseSensitive ?? true
    const flags = caseSensitive ? "g" : "gi"
    const expected = content.split("\n").flatMap((lineContent, lineIndex) =>
      Array.from(lineContent.matchAll(new RegExp(query, flags)), (match) => ({
        filePath: file.path,
        lineNumber: lineIndex + 1,
        column: match.index + 1,
        lineContent,
        matchStart: match.index,
        matchEnd: match.index + match[0].length,
      })),
    )

    assert.deepEqual(
      searchWithDeadline([file], query, {
        caseSensitive,
        wholeWord: false,
        useRegex: true,
      }).get(file.path) ?? [],
      expected,
      name,
    )
  }
})
