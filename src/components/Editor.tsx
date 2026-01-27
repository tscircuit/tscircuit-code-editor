import { useRef, useCallback, useMemo, useEffect, useState } from "react"
import MonacoEditor, {
  type OnMount,
  type OnChange,
  type BeforeMount,
  loader,
} from "@monaco-editor/react"
import type { editor, languages, IDisposable } from "monaco-editor"

export interface EditorFile {
  path: string
  content: string
  language?: string
}

export interface EditorTheme {
  name: string
  data: editor.IStandaloneThemeData
}

export interface EditorProps {
  files?: EditorFile[]
  currentFile?: string | null
  defaultValue?: string
  defaultLanguage?: string
  language?: string
  value?: string
  theme?: "light" | "vs-dark" | string
  readOnly?: boolean
  fontSize?: number
  tabSize?: number
  lineNumbers?: "on" | "off" | "relative" | "interval"
  minimap?: boolean
  wordWrap?: "on" | "off" | "wordWrapColumn" | "bounded"
  autoFocus?: boolean
  highlightLine?: number | null
  cursorPosition?: { lineNumber: number; column: number } | null
  options?: editor.IStandaloneEditorConstructionOptions
  customThemes?: EditorTheme[]

  onChange?: (value: string | undefined, path?: string) => void
  onFileChange?: (path: string, content: string) => void
  onMount?: (
    editor: editor.IStandaloneCodeEditor,
    monaco: typeof import("monaco-editor"),
  ) => void
  beforeMount?: (monaco: typeof import("monaco-editor")) => void
  onCursorPositionChange?: (position: {
    lineNumber: number
    column: number
  }) => void
  onSave?: (value: string, path?: string) => void
  onQuickOpen?: () => void
  onGlobalFind?: () => void

  className?: string
  style?: React.CSSProperties
  loading?: React.ReactNode
  width?: string | number
  height?: string | number
}

const DEFAULT_OPTIONS: editor.IStandaloneEditorConstructionOptions = {
  automaticLayout: true,
  scrollBeyondLastLine: false,
  smoothScrolling: true,
  cursorBlinking: "smooth",
  cursorSmoothCaretAnimation: "on",
  folding: true,
  foldingHighlight: true,
  foldingStrategy: "auto",
  showFoldingControls: "mouseover",
  bracketPairColorization: { enabled: true },
  guides: {
    bracketPairs: true,
    indentation: true,
  },
  renderLineHighlight: "all",
  renderWhitespace: "selection",
  quickSuggestions: true,
  suggestOnTriggerCharacters: true,
  acceptSuggestionOnEnter: "on",
  tabCompletion: "on",
  parameterHints: { enabled: true },
  formatOnPaste: true,
  formatOnType: true,
  linkedEditing: true,
  hover: { enabled: true, delay: 300 },
}

const LANGUAGE_MAP: Record<string, string> = {
  ts: "typescript",
  tsx: "typescript",
  js: "javascript",
  jsx: "javascript",
  json: "json",
  md: "markdown",
  css: "css",
  scss: "scss",
  less: "less",
  html: "html",
  xml: "xml",
  yaml: "yaml",
  yml: "yaml",
  py: "python",
  rb: "ruby",
  go: "go",
  rs: "rust",
  c: "c",
  cpp: "cpp",
  h: "c",
  hpp: "cpp",
  java: "java",
  kt: "kotlin",
  swift: "swift",
  sh: "shell",
  bash: "shell",
  sql: "sql",
  graphql: "graphql",
  prisma: "prisma",
}

function getLanguageFromPath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() || ""
  return LANGUAGE_MAP[ext] || "plaintext"
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

export function Editor({
  files = [],
  currentFile = null,
  defaultValue = "",
  defaultLanguage = "typescript",
  language,
  value,
  theme = "vs-dark",
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

  onChange,
  onFileChange,
  onMount,
  beforeMount,
  onCursorPositionChange,
  onSave,
  onQuickOpen,
  onGlobalFind,

  className = "",
  style,
  loading = <DefaultLoading />,
  width = "100%",
  height = "100%",
}: EditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<typeof import("monaco-editor") | null>(null)
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
      ...DEFAULT_OPTIONS,
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

      monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.ESNext,
        module: monaco.languages.typescript.ModuleKind.ESNext,
        moduleResolution:
          monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        jsx: monaco.languages.typescript.JsxEmit.ReactJSX,
        allowJs: true,
        checkJs: false,
        strict: true,
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        resolveJsonModule: true,
        isolatedModules: true,
        noEmit: true,
      })

      monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
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
        run: () => {
          stableOnQuickOpen?.()
        },
      })

      const globalFindAction = editor.addAction({
        id: "editor.globalFind",
        label: "Find in Files",
        keybindings: [
          monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF,
        ],
        run: () => {
          stableOnGlobalFind?.()
        },
      })

      const cursorDisposable = editor.onDidChangeCursorPosition((e) => {
        stableOnCursorPositionChange?.({
          lineNumber: e.position.lineNumber,
          column: e.position.column,
        })
      })

      const wheelDisposable = editor.onDidScrollChange(() => {})

      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.Equal,
        () => {},
        "",
      )
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.Minus,
        () => {},
        "",
      )

      disposablesRef.current.push(
        saveAction,
        quickOpenAction,
        globalFindAction,
        cursorDisposable,
        wheelDisposable,
      )

      if (autoFocus) {
        editor.focus()
      }

      stableOnMount?.(editor, monaco)
    },
    [
      files,
      currentFile,
      autoFocus,
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
      }
    },
    [currentFile, stableOnChange, stableOnFileChange],
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
        highlightDecorationRef.current = editor.deltaDecorations([], [
          {
            range: new monaco.Range(highlightLine, 1, highlightLine, 1),
            options: {
              isWholeLine: true,
              className: "editor-line-highlight",
              glyphMarginClassName: "editor-line-highlight-glyph",
            },
          },
        ])

        editor.revealLineInCenter(highlightLine)
      }
    }
  }, [isReady, highlightLine])

  useEffect(() => {
    if (!isReady || !editorRef.current || !cursorPosition) return

    const editor = editorRef.current
    editor.setPosition(cursorPosition)
    editor.revealPositionInCenter(cursorPosition)
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

  return (
    <div
      className={`tscircuit-editor ${className}`}
      style={{ width, height, ...style }}
    >
      <style>{`
        .editor-line-highlight {
          background-color: rgba(255, 255, 0, 0.15) !important;
        }
        .editor-line-highlight-glyph {
          background-color: rgba(255, 200, 0, 0.5);
        }
      `}</style>
      <MonacoEditor
        width="100%"
        height="100%"
        language={resolvedLanguage}
        value={resolvedValue}
        theme={theme}
        path={path}
        options={editorOptions}
        loading={loading}
        beforeMount={handleBeforeMount}
        onMount={handleMount}
        onChange={handleChange}
      />
    </div>
  )
}

function DefaultLoading() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        width: "100%",
        backgroundColor: "#1e1e1e",
        color: "#808080",
        fontFamily:
          'Consolas, "Courier New", Monaco, "Andale Mono", "Ubuntu Mono", monospace',
        fontSize: "14px",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: "40px",
            height: "40px",
            border: "3px solid #404040",
            borderTop: "3px solid #007acc",
            borderRadius: "50%",
            margin: "0 auto 16px",
            animation: "spin 1s linear infinite",
          }}
        />
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        Loading Editor...
      </div>
    </div>
  )
}

export function useEditor() {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<typeof import("monaco-editor") | null>(null)

  const setEditor = useCallback(
    (
      editor: editor.IStandaloneCodeEditor,
      monaco: typeof import("monaco-editor"),
    ) => {
      editorRef.current = editor
      monacoRef.current = monaco
    },
    [],
  )

  const getValue = useCallback(() => {
    return editorRef.current?.getValue() ?? ""
  }, [])

  const setValue = useCallback((value: string) => {
    editorRef.current?.setValue(value)
  }, [])

  const getPosition = useCallback(() => {
    return editorRef.current?.getPosition() ?? null
  }, [])

  const setPosition = useCallback(
    (lineNumber: number, column: number) => {
      if (editorRef.current) {
        editorRef.current.setPosition({ lineNumber, column })
        editorRef.current.revealPositionInCenter({ lineNumber, column })
      }
    },
    [],
  )

  const focus = useCallback(() => {
    editorRef.current?.focus()
  }, [])

  const format = useCallback(() => {
    editorRef.current?.getAction("editor.action.formatDocument")?.run()
  }, [])

  const getModel = useCallback(() => {
    return editorRef.current?.getModel() ?? null
  }, [])

  const revealLine = useCallback((lineNumber: number, center = true) => {
    if (editorRef.current) {
      if (center) {
        editorRef.current.revealLineInCenter(lineNumber)
      } else {
        editorRef.current.revealLine(lineNumber)
      }
    }
  }, [])

  const getSelection = useCallback(() => {
    return editorRef.current?.getSelection() ?? null
  }, [])

  const setSelection = useCallback(
    (
      startLineNumber: number,
      startColumn: number,
      endLineNumber: number,
      endColumn: number,
    ) => {
      if (editorRef.current && monacoRef.current) {
        const selection = new monacoRef.current.Selection(
          startLineNumber,
          startColumn,
          endLineNumber,
          endColumn,
        )
        editorRef.current.setSelection(selection)
      }
    },
    [],
  )

  const insertText = useCallback((text: string) => {
    if (editorRef.current) {
      const selection = editorRef.current.getSelection()
      if (selection) {
        editorRef.current.executeEdits("", [
          {
            range: selection,
            text,
            forceMoveMarkers: true,
          },
        ])
      }
    }
  }, [])

  const addDecoration = useCallback(
    (
      lineNumber: number,
      options: editor.IModelDecorationOptions,
    ): string[] => {
      if (editorRef.current && monacoRef.current) {
        const range = new monacoRef.current.Range(lineNumber, 1, lineNumber, 1)
        return editorRef.current.deltaDecorations([], [{ range, options }])
      }
      return []
    },
    [],
  )

  const removeDecorations = useCallback((decorationIds: string[]) => {
    editorRef.current?.deltaDecorations(decorationIds, [])
  }, [])

  return {
    setEditor,
    getValue,
    setValue,
    getPosition,
    setPosition,
    focus,
    format,
    getModel,
    revealLine,
    getSelection,
    setSelection,
    insertText,
    addDecoration,
    removeDecorations,
    editor: editorRef,
    monaco: monacoRef,
  }
}

export { loader }
export type { editor, languages }
