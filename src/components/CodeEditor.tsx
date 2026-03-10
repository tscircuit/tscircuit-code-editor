import { useState, useCallback, useMemo, useRef } from "react"
import {
  PanelLeftClose,
  PanelLeftOpen,
  Eye,
  EyeOff,
  Search,
  Save,
} from "lucide-react"
import type { EditorFile, EditorTheme, CursorPosition } from "../types"
import type { editor } from "monaco-editor"
import { MonacoEditor } from "./MonacoEditor"
import { FileSidebar } from "./FileSidebar"
import { EditorTabs } from "./EditorTabs"
import { QuickOpen } from "./QuickOpen"
import { GlobalFindReplace } from "./GlobalFindReplace"
import { PreviewPanel } from "./PreviewPanel"
import { ResizableDivider } from "./ResizableDivider"
import { StatusBar } from "./StatusBar"
import { useEditor } from "../hooks/use-editor"
import { useHotkey } from "../hooks/use-hotkey"
import { DEFAULT_FONT_SIZE, DEFAULT_TAB_SIZE } from "../lib/constants"

export interface CodeEditorProps {
  files?: EditorFile[]
  initialFile?: string | null
  customThemes?: EditorTheme[]
  readOnly?: boolean
  showSidebar?: boolean
  showHeader?: boolean
  showMinimap?: boolean
  showStatusBar?: boolean
  showPreview?: boolean
  fontSize?: number
  tabSize?: number
  wordWrap?: "on" | "off" | "wordWrapColumn" | "bounded"
  lineNumbers?: "on" | "off" | "relative" | "interval"
  enableTypeAcquisition?: boolean
  options?: editor.IStandaloneEditorConstructionOptions

  onChange?: (value: string, path: string) => void
  onFileSelect?: (path: string) => void
  onSave?: (files: EditorFile[]) => void
  onCreateFile?: (path: string, content: string) => void
  onDeleteFile?: (path: string) => void
  onRenameFile?: (oldPath: string, newPath: string) => void

  renderPreview?: (props: { fsMap: Map<string, string> }) => React.ReactNode

  className?: string
  style?: React.CSSProperties
  width?: string | number
  height?: string | number
}

export function CodeEditor({
  files: externalFiles = [],
  initialFile = null,
  customThemes = [],
  readOnly = false,
  showSidebar: initialShowSidebar = true,
  showHeader = true,
  showMinimap = true,
  showStatusBar = true,
  showPreview: initialShowPreview = false,
  fontSize: initialFontSize = DEFAULT_FONT_SIZE,
  tabSize = DEFAULT_TAB_SIZE,
  wordWrap = "on",
  lineNumbers = "on",
  enableTypeAcquisition = true,
  options = {},

  onChange,
  onFileSelect,
  onSave,
  onCreateFile,
  onDeleteFile,
  onRenameFile,

  renderPreview,

  className = "",
  style,
  width = "100%",
  height = "100vh",
}: CodeEditorProps) {
  const [localFiles, setLocalFiles] = useState<EditorFile[]>(externalFiles)
  const [currentFile, setCurrentFile] = useState<string | null>(
    initialFile ?? externalFiles[0]?.path ?? null,
  )
  const [openFiles, setOpenFiles] = useState<string[]>(() => {
    const initial = initialFile ?? externalFiles[0]?.path
    return initial ? [initial] : []
  })
  const [sidebarOpen, setSidebarOpen] = useState(initialShowSidebar)
  const [previewOpen, setPreviewOpen] = useState(initialShowPreview)
  const [showQuickOpen, setShowQuickOpen] = useState(false)
  const [showGlobalFind, setShowGlobalFind] = useState(false)
  const [minimapEnabled, setMinimapEnabled] = useState(showMinimap)
  const [fontSize, setFontSize] = useState(initialFontSize)
  const [cursorPosition, setCursorPosition] = useState<CursorPosition | null>(
    null,
  )
  const [highlightLine, setHighlightLine] = useState<number | null>(null)
  const [splitPercent, setSplitPercent] = useState(50)

  const editorHook = useEditor()
  const editorContainerRef = useRef<HTMLDivElement>(null)
  const splitContainerRef = useRef<HTMLDivElement>(null)

  const files = useMemo(() => {
    if (localFiles.length > 0 && localFiles !== externalFiles) return localFiles
    return externalFiles
  }, [localFiles, externalFiles])

  const fsMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const f of files) {
      map.set(f.path, f.content)
    }
    return map
  }, [files])

  const handleFileSelect = useCallback(
    (path: string, lineNumber?: number) => {
      setCurrentFile(path)
      setOpenFiles((prev) => (prev.includes(path) ? prev : [...prev, path]))
      onFileSelect?.(path)

      if (lineNumber) {
        setTimeout(() => {
          setHighlightLine(lineNumber)
          editorHook.revealLine(lineNumber)
          setTimeout(() => setHighlightLine(null), 3000)
        }, 100)
      }
    },
    [onFileSelect, editorHook],
  )

  const handleCloseFile = useCallback(
    (path: string) => {
      setOpenFiles((prev) => {
        const next = prev.filter((p) => p !== path)
        if (currentFile === path) {
          const idx = prev.indexOf(path)
          const newCurrent = next[Math.min(idx, next.length - 1)] ?? null
          setCurrentFile(newCurrent)
        }
        return next
      })
    },
    [currentFile],
  )

  const handleChange = useCallback(
    (value: string | undefined, path?: string) => {
      if (value === undefined || !path) return
      setLocalFiles((prev) =>
        prev.map((f) => (f.path === path ? { ...f, content: value } : f)),
      )
      onChange?.(value, path)
    },
    [onChange],
  )

  const handleSave = useCallback(() => {
    onSave?.(files)
  }, [onSave, files])

  const handleCreateFile = useCallback(
    (path: string, content: string) => {
      const newFile: EditorFile = { path, content }
      setLocalFiles((prev) => [...prev, newFile])
      handleFileSelect(path)
      onCreateFile?.(path, content)
    },
    [onCreateFile, handleFileSelect],
  )

  const handleDeleteFile = useCallback(
    (path: string) => {
      setLocalFiles((prev) => prev.filter((f) => f.path !== path))
      setOpenFiles((prev) => prev.filter((p) => p !== path))
      if (currentFile === path) {
        const remaining = files.filter((f) => f.path !== path)
        setCurrentFile(remaining[0]?.path ?? null)
      }
      onDeleteFile?.(path)
    },
    [currentFile, files, onDeleteFile],
  )

  const handleRenameFile = useCallback(
    (oldPath: string, newPath: string) => {
      setLocalFiles((prev) =>
        prev.map((f) => (f.path === oldPath ? { ...f, path: newPath } : f)),
      )
      setOpenFiles((prev) => prev.map((p) => (p === oldPath ? newPath : p)))
      if (currentFile === oldPath) {
        setCurrentFile(newPath)
      }
      onRenameFile?.(oldPath, newPath)
    },
    [currentFile, onRenameFile],
  )

  const handleNavigateToResult = useCallback(
    (path: string, lineNumber: number) => {
      handleFileSelect(path, lineNumber)
    },
    [handleFileSelect],
  )

  const fontSizeRef = useRef(initialFontSize)
  fontSizeRef.current = fontSize

  const handleEditorMount = useCallback(
    (
      ed: editor.IStandaloneCodeEditor,
      monaco: typeof import("monaco-editor"),
    ) => {
      editorHook.setEditor(ed, monaco)

      let lastZoomTime = 0
      const ZOOM_THROTTLE = 50

      const wheelHandler = (e: WheelEvent) => {
        if (!(e.ctrlKey || e.metaKey)) return
        e.preventDefault()
        e.stopPropagation()

        const now = Date.now()
        if (now - lastZoomTime < ZOOM_THROTTLE) return
        lastZoomTime = now

        const direction = e.deltaY < 0 ? 1 : -1
        const current = fontSizeRef.current
        const next = Math.max(8, Math.min(32, current + direction))
        if (next === current) return

        setFontSize(next)
        ed.updateOptions({ fontSize: next })
      }

      const dom = ed.getDomNode()
      dom?.addEventListener("wheel", wheelHandler, { passive: false })
    },
    [editorHook],
  )

  const handleSplitResize = useCallback((delta: number) => {
    if (!splitContainerRef.current) return
    const containerWidth = splitContainerRef.current.offsetWidth
    if (containerWidth === 0) return
    const deltaPercent = (delta / containerWidth) * 100
    setSplitPercent((prev) => Math.max(20, Math.min(80, prev + deltaPercent)))
  }, [])

  useHotkey("mod+b", () => setSidebarOpen((p) => !p))
  useHotkey("mod+p", () => setShowQuickOpen(true))
  useHotkey("mod+shift+f", () => setShowGlobalFind((p) => !p))
  useHotkey("mod+\\", () => setPreviewOpen((p) => !p))
  useHotkey("mod+s", () => handleSave())
  useHotkey("escape", () => {
    if (showQuickOpen) setShowQuickOpen(false)
  })
  useHotkey("ctrl+tab", () => {
    if (openFiles.length < 2) return
    const idx = currentFile ? openFiles.indexOf(currentFile) : -1
    const next = openFiles[(idx + 1) % openFiles.length]
    if (next) handleFileSelect(next)
  })
  useHotkey("ctrl+shift+tab", () => {
    if (openFiles.length < 2) return
    const idx = currentFile ? openFiles.indexOf(currentFile) : 0
    const prev = openFiles[(idx - 1 + openFiles.length) % openFiles.length]
    if (prev) handleFileSelect(prev)
  })

  const hasPreview = previewOpen && (renderPreview || initialShowPreview)

  return (
    <div
      className={`flex flex-col bg-white text-gray-900 overflow-hidden ${className}`}
      style={{ width, height, ...style }}
    >
      {showHeader && (
        <div className="flex items-center h-10 px-2 bg-white border-b border-gray-200 shrink-0 gap-1">
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 hover:bg-blue-50 rounded transition-colors"
            title="Toggle Sidebar (Ctrl+B)"
          >
            {sidebarOpen ? (
              <PanelLeftClose className="w-4 h-4 text-gray-600" />
            ) : (
              <PanelLeftOpen className="w-4 h-4 text-gray-600" />
            )}
          </button>

          <div className="h-4 w-px bg-gray-200 mx-1" />

          <button
            type="button"
            onClick={() => setShowQuickOpen(true)}
            className="flex items-center gap-2 px-3 py-1 text-sm text-gray-500 hover:bg-blue-50 rounded transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Quick Open</span>
            <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-gray-400 bg-gray-100 rounded border border-gray-200">
              Ctrl+P
            </kbd>
          </button>

          <div className="flex-1" />

          {onSave && (
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Save</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setPreviewOpen(!previewOpen)}
            className={`flex items-center gap-1.5 px-3 py-1 text-sm rounded transition-colors ${
              previewOpen
                ? "text-blue-600 bg-blue-50"
                : "text-gray-500 hover:bg-blue-50"
            }`}
            title="Toggle Preview (Ctrl+\\)"
          >
            {previewOpen ? (
              <EyeOff className="w-3.5 h-3.5" />
            ) : (
              <Eye className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">Preview</span>
          </button>

          <button
            type="button"
            onClick={() => setShowGlobalFind((p) => !p)}
            className={`flex items-center gap-1.5 px-3 py-1 text-sm rounded transition-colors ${
              showGlobalFind
                ? "text-blue-600 bg-blue-50"
                : "text-gray-500 hover:bg-blue-50"
            }`}
            title="Find in Files (Ctrl+Shift+F)"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Find</span>
          </button>

          <div className="hidden md:flex items-center text-xs text-gray-400 px-2">
            Font: {fontSize}px
          </div>
        </div>
      )}

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {sidebarOpen && (
          <div className="hidden md:flex w-60 shrink-0">
            <FileSidebar
              files={files}
              currentFile={currentFile}
              onFileSelect={handleFileSelect}
              onCreateFile={onCreateFile ? handleCreateFile : undefined}
              onDeleteFile={onDeleteFile ? handleDeleteFile : undefined}
              onRenameFile={onRenameFile ? handleRenameFile : undefined}
              className="w-full"
            />
          </div>
        )}

        <div
          ref={splitContainerRef}
          className="flex flex-1 min-w-0 flex-col md:flex-row"
        >
          <div
            ref={editorContainerRef}
            className="flex flex-col min-w-0 overflow-hidden"
            style={
              hasPreview
                ? { flexBasis: `${splitPercent}%`, flexGrow: 0, flexShrink: 0 }
                : { flex: 1 }
            }
          >
            <EditorTabs
              openFiles={openFiles}
              currentFile={currentFile}
              onSelectFile={handleFileSelect}
              onCloseFile={handleCloseFile}
            />

            <div className="flex flex-1 min-h-0 overflow-hidden">
              <div
                className={`flex-1 min-w-0 ${showGlobalFind ? "hidden md:block" : ""}`}
              >
                <MonacoEditor
                  files={files}
                  currentFile={currentFile}
                  readOnly={readOnly}
                  fontSize={fontSize}
                  tabSize={tabSize}
                  wordWrap={wordWrap}
                  lineNumbers={lineNumbers}
                  minimap={minimapEnabled}
                  highlightLine={highlightLine}
                  customThemes={customThemes}
                  enableTypeAcquisition={enableTypeAcquisition}
                  options={options}
                  onChange={handleChange}
                  onMount={handleEditorMount}
                  onSave={(value, path) => {
                    if (path) handleChange(value, path)
                    handleSave()
                  }}
                  onQuickOpen={() => setShowQuickOpen(true)}
                  onGlobalFind={() => setShowGlobalFind((p) => !p)}
                  onGoToFile={(path, lineNumber, content) => {
                    if (content && !files.some((f) => f.path === path)) {
                      setLocalFiles((prev) => {
                        if (prev.some((f) => f.path === path)) return prev
                        return [
                          ...prev,
                          { path, content, language: "typescript" },
                        ]
                      })
                    }
                    handleFileSelect(path, lineNumber)
                  }}
                  onToggleMinimap={() => setMinimapEnabled((p) => !p)}
                  onCursorPositionChange={setCursorPosition}
                  width="100%"
                  height="100%"
                />
              </div>

              {showGlobalFind && (
                <div className="w-full md:w-80 shrink-0 border-l border-gray-200">
                  <GlobalFindReplace
                    files={files}
                    onNavigate={handleNavigateToResult}
                    onClose={() => setShowGlobalFind(false)}
                  />
                </div>
              )}
            </div>
          </div>

          {hasPreview && (
            <>
              <ResizableDivider
                direction="horizontal"
                onResize={handleSplitResize}
                className="hidden md:flex"
              />
              <div
                className="flex flex-col min-w-0 overflow-hidden border-t md:border-t-0 min-h-[200px]"
                style={{
                  flexBasis: `${100 - splitPercent}%`,
                  flexGrow: 0,
                  flexShrink: 0,
                }}
              >
                <PreviewPanel
                  fsMap={fsMap}
                  renderPreview={renderPreview}
                  className="h-full"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {showStatusBar && (
        <StatusBar
          cursorPosition={cursorPosition}
          currentFile={currentFile}
          tabSize={tabSize}
          fileCount={files.length}
        />
      )}

      {showQuickOpen && (
        <QuickOpen
          files={files}
          onSelect={handleFileSelect}
          onClose={() => setShowQuickOpen(false)}
        />
      )}
    </div>
  )
}
