import type { editor } from "monaco-editor"

export interface EditorFile {
  path: string
  content: string
  language?: string
}

export interface EditorTheme {
  name: string
  data: editor.IStandaloneThemeData
}

export interface CursorPosition {
  lineNumber: number
  column: number
}

export interface SearchMatch {
  filePath: string
  lineNumber: number
  column: number
  lineContent: string
  matchStart: number
  matchEnd: number
}

export interface FileTreeNode {
  name: string
  path: string
  type: "file" | "directory"
  children?: FileTreeNode[]
}
