import { useRef, useCallback, useMemo, useEffect, useState } from "react"
import MonacoReactEditor, {
  type OnMount,
  type OnChange,
  type BeforeMount,
  loader,
} from "@monaco-editor/react"
import type { editor, IDisposable } from "monaco-editor"
import type { EditorFile, EditorTheme, CursorPosition } from "../types"
import { getLanguageFromPath } from "../lib/language-map"
import { DEFAULT_EDITOR_OPTIONS } from "../lib/constants"
import {
  useTypeAcquisition,
  getAtaFileCache,
} from "../hooks/use-type-acquisition"
import { Loader2 } from "lucide-react"

type Monaco = typeof import("monaco-editor")

export interface MonacoEditorProps {
  files?: EditorFile[]
  currentFile?: string | null
  defaultValue?: string
  defaultLanguage?: string
  language?: string
  value?: string
  readOnly?: boolean
  fontSize?: number
  tabSize?: number
  lineNumbers?: "on" | "off" | "relative" | "interval"
  minimap?: boolean
  wordWrap?: "on" | "off" | "wordWrapColumn" | "bounded"
  autoFocus?: boolean
  highlightLine?: number | null
  cursorPosition?: CursorPosition | null
  options?: editor.IStandaloneEditorConstructionOptions
  customThemes?: EditorTheme[]
  enableTypeAcquisition?: boolean

  onChange?: (value: string | undefined, path?: string) => void
  onFileChange?: (path: string, content: string) => void
  onMount?: (editor: editor.IStandaloneCodeEditor, monaco: Monaco) => void
  beforeMount?: (monaco: Monaco) => void
  onCursorPositionChange?: (position: CursorPosition) => void
  onSave?: (value: string, path?: string) => void
  onQuickOpen?: () => void
  onGlobalFind?: () => void
  onGoToFile?: (path: string, lineNumber?: number, content?: string) => void
  onToggleMinimap?: () => void

  className?: string
  style?: React.CSSProperties
  loading?: React.ReactNode
  width?: string | number
  height?: string | number
}

function useStableCallback<T extends (...args: never[]) => unknown>(
  callback: T | undefined,
): T {
  const callbackRef = useRef<T | undefined>(callback)
  callbackRef.current = callback
  return useCallback(
    ((...args: Parameters<T>) =>
      callbackRef.current?.(...(args as Parameters<T>))) as T,
    [],
  )
}

export function MonacoEditor({
  files = [],
  currentFile = null,
  defaultValue = "",
  defaultLanguage = "typescript",
  language,
  value,
  readOnly = false,
  fontSize = 14,
  tabSize = 2,
  lineNumbers = "on",
  minimap = true,
  wordWrap = "on",
  autoFocus = true,
  highlightLine = null,
  cursorPosition = null,
  options = {},
  customThemes = [],
  enableTypeAcquisition = true,

  onChange,
  onFileChange,
  onMount,
  beforeMount,
  onCursorPositionChange,
  onSave,
  onQuickOpen,
  onGlobalFind,
  onGoToFile,
  onToggleMinimap,

  className = "",
  style,
  loading,
  width = "100%",
  height = "100%",
}: MonacoEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<Monaco | null>(null)
  const disposablesRef = useRef<IDisposable[]>([])
  const highlightDecorationRef = useRef<string[]>([])
  const [isReady, setIsReady] = useState(false)

  const stableOnChange = useStableCallback(onChange)
  const stableOnFileChange = useStableCallback(onFileChange)
  const stableOnMount = useStableCallback(onMount)
  const stableBeforeMount = useStableCallback(beforeMount)
  const stableOnCursorPositionChange = useStableCallback(onCursorPositionChange)
  const stableOnSave = useStableCallback(onSave)
  const stableOnQuickOpen = useStableCallback(onQuickOpen)
  const stableOnGlobalFind = useStableCallback(onGlobalFind)
  const stableOnGoToFile = useStableCallback(onGoToFile)
  const stableOnToggleMinimap = useStableCallback(onToggleMinimap)

  const { acquireTypes } = useTypeAcquisition({
    monaco: monacoRef.current,
    enabled: enableTypeAcquisition && isReady,
  })

  const fileMap = useMemo(() => {
    const map = new Map<string, EditorFile>()
    for (const file of files) {
      map.set(file.path, file)
    }
    return map
  }, [files])

  const currentFileData = useMemo(() => {
    if (!currentFile) return null
    return fileMap.get(currentFile) ?? null
  }, [fileMap, currentFile])

  const resolvedLanguage = useMemo(() => {
    if (language) return language
    if (currentFileData?.language) return currentFileData.language
    if (currentFile) return getLanguageFromPath(currentFile)
    return defaultLanguage
  }, [language, currentFileData, currentFile, defaultLanguage])

  const resolvedValue = useMemo(() => {
    if (value !== undefined) return value
    if (currentFileData) return currentFileData.content
    return defaultValue
  }, [value, currentFileData, defaultValue])

  const editorOptions = useMemo(
    () => ({
      ...DEFAULT_EDITOR_OPTIONS,
      fontSize,
      tabSize,
      lineNumbers,
      minimap: { enabled: minimap },
      wordWrap,
      readOnly,
      ...options,
    }),
    [fontSize, tabSize, lineNumbers, minimap, wordWrap, readOnly, options],
  )

  const handleBeforeMount: BeforeMount = useCallback(
    (monaco) => {
      for (const { name, data } of customThemes) {
        monaco.editor.defineTheme(name, data)
      }

      monaco.editor.defineTheme("tscircuit-light", {
        base: "vs",
        inherit: true,
        rules: [
          { token: "comment", foreground: "6b7280", fontStyle: "italic" },
          { token: "keyword", foreground: "2563eb" },
          { token: "string", foreground: "059669" },
          { token: "number", foreground: "d97706" },
          { token: "type", foreground: "7c3aed" },
          { token: "identifier", foreground: "1e40af" },
        ],
        colors: {
          "editor.background": "#ffffff",
          "editor.foreground": "#1f2937",
          "editor.lineHighlightBackground": "#eff6ff",
          "editor.selectionBackground": "#bfdbfe",
          "editor.inactiveSelectionBackground": "#dbeafe",
          "editorLineNumber.foreground": "#9ca3af",
          "editorLineNumber.activeForeground": "#2563eb",
          "editorIndentGuide.background": "#e5e7eb",
          "editorIndentGuide.activeBackground": "#93c5fd",
          "editorCursor.foreground": "#2563eb",
          "editor.selectionHighlightBackground": "#dbeafe80",
          "editorBracketMatch.background": "#dbeafe",
          "editorBracketMatch.border": "#93c5fd",
        },
      })

      const ts = (monaco.languages as any).typescript
      ts.typescriptDefaults.setCompilerOptions({
        target: ts.ScriptTarget.ESNext,
        module: ts.ModuleKind.ESNext,
        moduleResolution: ts.ModuleResolutionKind.NodeJs,
        jsx: ts.JsxEmit.ReactJSX,
        allowJs: true,
        checkJs: false,
        strict: true,
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        resolveJsonModule: true,
        isolatedModules: true,
        noEmit: true,
      })

      ts.typescriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: false,
        noSyntaxValidation: false,
      })

      stableBeforeMount?.(monaco)
    },
    [customThemes, stableBeforeMount],
  )

  const handleMount: OnMount = useCallback(
    (editor, monaco) => {
      editorRef.current = editor
      monacoRef.current = monaco
      setIsReady(true)

      for (const file of files) {
        const uri = monaco.Uri.parse(`file:///${file.path}`)
        const existingModel = monaco.editor.getModel(uri)
        if (!existingModel) {
          const lang = file.language || getLanguageFromPath(file.path)
          monaco.editor.createModel(file.content, lang, uri)
        }
      }

      const projectPaths = new Set(files.map((f) => f.path))

      const editorService = (editor as any)._codeEditorService
      if (editorService) {
        const origOpen = editorService.openCodeEditor?.bind(editorService)
        editorService.openCodeEditor = async (
          input: any,
          source: any,
          _sideBySide?: boolean,
        ) => {
          const uri = input?.resource
          if (!uri) {
            if (origOpen) return origOpen(input, source, _sideBySide)
            return null
          }

          const rawPath: string = uri.path ?? ""
          const targetPath = rawPath.replace(/^\//, "")
          const lineNumber: number | undefined =
            input.options?.selection?.startLineNumber

          if (projectPaths.has(targetPath)) {
            stableOnGoToFile?.(targetPath, lineNumber)
            return editor
          }

          const cache = getAtaFileCache()
          const content = cache.get(rawPath) ?? cache.get(`/${targetPath}`)
          if (content) {
            let model = monaco.editor.getModel(uri)
            if (!model) {
              monaco.editor.createModel(content, "typescript", uri)
            }
            stableOnGoToFile?.(targetPath, lineNumber, content)
            return editor
          }

          if (origOpen) return origOpen(input, source, _sideBySide)
          return null
        }
      }

      const saveAction = editor.addAction({
        id: "editor.save",
        label: "Save",
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
        run: () => {
          const currentValue = editor.getValue()
          stableOnSave?.(currentValue, currentFile ?? undefined)
        },
      })

      const quickOpenAction = editor.addAction({
        id: "editor.quickOpen",
        label: "Quick Open",
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyP],
        run: () => stableOnQuickOpen?.(),
      })

      const globalFindAction = editor.addAction({
        id: "editor.globalFind",
        label: "Find in Files",
        keybindings: [
          monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF,
        ],
        run: () => stableOnGlobalFind?.(),
      })

      const toggleMinimapAction = editor.addAction({
        id: "editor.toggleMinimap",
        label: "Toggle Minimap",
        contextMenuGroupId: "view",
        contextMenuOrder: 1,
        run: () => stableOnToggleMinimap?.(),
      })

      const cursorDisposable = editor.onDidChangeCursorPosition((e) => {
        stableOnCursorPositionChange?.({
          lineNumber: e.position.lineNumber,
          column: e.position.column,
        })
      })

      disposablesRef.current.push(
        saveAction,
        quickOpenAction,
        globalFindAction,
        toggleMinimapAction,
        cursorDisposable,
      )

      if (autoFocus) {
        editor.focus()
      }

      if (enableTypeAcquisition) {
        const currentContent = editor.getValue()
        if (currentContent) {
          acquireTypes(currentContent)
        }
      }

      stableOnMount?.(editor, monaco)
    },
    [
      files,
      currentFile,
      autoFocus,
      enableTypeAcquisition,
      acquireTypes,
      stableOnMount,
      stableOnSave,
      stableOnQuickOpen,
      stableOnGlobalFind,
      stableOnCursorPositionChange,
    ],
  )

  const handleChange: OnChange = useCallback(
    (newValue) => {
      stableOnChange?.(newValue, currentFile ?? undefined)
      if (currentFile && newValue !== undefined) {
        stableOnFileChange?.(currentFile, newValue)
        if (enableTypeAcquisition) {
          acquireTypes(newValue)
        }
      }
    },
    [
      currentFile,
      enableTypeAcquisition,
      acquireTypes,
      stableOnChange,
      stableOnFileChange,
    ],
  )

  useEffect(() => {
    if (!isReady || !editorRef.current || !monacoRef.current || !currentFile)
      return

    const monaco = monacoRef.current
    const editor = editorRef.current
    const uri = monaco.Uri.parse(`file:///${currentFile}`)
    let model = monaco.editor.getModel(uri)

    if (!model) {
      const fileData = fileMap.get(currentFile)
      if (fileData) {
        model = monaco.editor.createModel(
          fileData.content,
          fileData.language || getLanguageFromPath(currentFile),
          uri,
        )
      }
    }

    if (model && editor.getModel() !== model) {
      editor.setModel(model)
    }
  }, [isReady, currentFile, fileMap])

  useEffect(() => {
    if (!isReady || !editorRef.current || !monacoRef.current) return

    const editor = editorRef.current
    const monaco = monacoRef.current

    highlightDecorationRef.current = editor.deltaDecorations(
      highlightDecorationRef.current,
      [],
    )

    if (highlightLine !== null && highlightLine > 0) {
      const model = editor.getModel()
      if (model && highlightLine <= model.getLineCount()) {
        highlightDecorationRef.current = editor.deltaDecorations(
          [],
          [
            {
              range: new monaco.Range(highlightLine, 1, highlightLine, 1),
              options: {
                isWholeLine: true,
                className: "editor-line-highlight",
              },
            },
          ],
        )
        editor.revealLineInCenter(highlightLine)
      }
    }
  }, [isReady, highlightLine])

  useEffect(() => {
    if (!isReady || !editorRef.current || !cursorPosition) return
    editorRef.current.setPosition(cursorPosition)
    editorRef.current.revealPositionInCenter(cursorPosition)
  }, [isReady, cursorPosition])

  useEffect(() => {
    return () => {
      for (const disposable of disposablesRef.current) {
        disposable.dispose()
      }
      disposablesRef.current = []
    }
  }, [])

  const path = currentFile || undefined

  const defaultLoading = (
    <div className="flex items-center justify-center h-full w-full bg-white">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
        <span className="text-sm text-gray-500 font-mono">
          Loading Editor...
        </span>
      </div>
    </div>
  )

  return (
    <div
      className={`relative ${className}`}
      style={{ width, height, ...style }}
    >
      <MonacoReactEditor
        width="100%"
        height="100%"
        language={resolvedLanguage}
        value={resolvedValue}
        theme="tscircuit-light"
        path={path}
        options={editorOptions}
        loading={loading ?? defaultLoading}
        beforeMount={handleBeforeMount}
        onMount={handleMount}
        onChange={handleChange}
      />
    </div>
  )
}

export { loader }
