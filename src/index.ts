export {
  CodeEditor,
  MonacoEditor,
  FileSidebar,
  EditorTabs,
  QuickOpen,
  GlobalFindReplace,
  PreviewPanel,
  StatusBar,
  loader,
} from "./components"

export type { CodeEditorProps, MonacoEditorProps } from "./components"

export { useEditor, useTypeAcquisition, useHotkey } from "./hooks"

export type {
  EditorFile,
  EditorTheme,
  CursorPosition,
  SearchMatch,
  FileTreeNode,
} from "./types"

export {
  getLanguageFromPath,
  getFileExtension,
  fetchWithCache,
} from "./lib"
