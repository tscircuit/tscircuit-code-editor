import {
  useRef,
  useCallback,
  useMemo,
  useState,
  useEffect,
  type CSSProperties,
} from "react"
import { Editor, useEditor, type EditorFile, type EditorTheme } from "./Editor"
import type { editor } from "monaco-editor"

export interface CodeEditorProps {
  files?: EditorFile[]
  initialFile?: string | null
  theme?: "light" | "vs-dark" | string
  customThemes?: EditorTheme[]
  readOnly?: boolean
  showSidebar?: boolean
  showHeader?: boolean
  showMinimap?: boolean
  fontSize?: number
  tabSize?: number
  wordWrap?: "on" | "off" | "wordWrapColumn" | "bounded"
  lineNumbers?: "on" | "off" | "relative" | "interval"
  options?: editor.IStandaloneEditorConstructionOptions

  onChange?: (value: string, path: string) => void
  onFileSelect?: (path: string) => void
  onSave?: (value: string, path: string) => void
  onCreateFile?: (path: string, content: string) => void
  onDeleteFile?: (path: string) => void
  onRenameFile?: (oldPath: string, newPath: string) => void

  className?: string
  style?: CSSProperties
  width?: string | number
  height?: string | number
}

const SIDEBAR_WIDTH = 240
const HEADER_HEIGHT = 40

export function CodeEditor({
  files = [],
  initialFile = null,
  theme = "vs-dark",
  customThemes = [],
  readOnly = false,
  showSidebar = true,
  showHeader = true,
  showMinimap = true,
  fontSize = 14,
  tabSize = 2,
  wordWrap = "on",
  lineNumbers = "on",
  options = {},

  onChange,
  onFileSelect,
  onSave,
  onCreateFile,
  onDeleteFile,
  onRenameFile,

  className = "",
  style,
  width = "100%",
  height = "100vh",
}: CodeEditorProps) {
  const [currentFile, setCurrentFile] = useState<string | null>(
    initialFile || files[0]?.path || null,
  )
  const [sidebarOpen, setSidebarOpen] = useState(showSidebar)
  const [showQuickOpen, setShowQuickOpen] = useState(false)
  const [showFindReplace, setShowFindReplace] = useState(false)
  const [quickOpenQuery, setQuickOpenQuery] = useState("")
  const [highlightedLine, setHighlightedLine] = useState<number | null>(null)
  const [localFontSize, setLocalFontSize] = useState(fontSize)
  const quickOpenRef = useRef<HTMLInputElement>(null)
  const editorHook = useEditor()

  const isDarkTheme =
    theme === "vs-dark" || theme.toLowerCase().includes("dark")
  const colors = useMemo(
    () => ({
      bg: isDarkTheme ? "#1e1e1e" : "#ffffff",
      sidebar: isDarkTheme ? "#252526" : "#f3f3f3",
      border: isDarkTheme ? "#3c3c3c" : "#e5e5e5",
      text: isDarkTheme ? "#cccccc" : "#333333",
      textMuted: isDarkTheme ? "#808080" : "#6b6b6b",
      hover: isDarkTheme ? "#2a2d2e" : "#e8e8e8",
      active: isDarkTheme ? "#37373d" : "#d4d4d4",
      accent: "#007acc",
      input: isDarkTheme ? "#3c3c3c" : "#ffffff",
    }),
    [isDarkTheme],
  )

  const handleFileSelect = useCallback(
    (path: string, lineNumber?: number) => {
      setCurrentFile(path)
      onFileSelect?.(path)
      if (lineNumber) {
        setTimeout(() => {
          setHighlightedLine(lineNumber)
          setTimeout(() => setHighlightedLine(null), 3000)
        }, 100)
      }
    },
    [onFileSelect],
  )

  const handleChange = useCallback(
    (value: string | undefined, path?: string) => {
      if (value !== undefined && path) {
        onChange?.(value, path)
      }
    },
    [onChange],
  )

  const handleSave = useCallback(
    (value: string, path?: string) => {
      if (path) {
        onSave?.(value, path)
      }
    },
    [onSave],
  )

  const handleQuickOpen = useCallback(() => {
    setShowQuickOpen(true)
    setQuickOpenQuery("")
    setTimeout(() => quickOpenRef.current?.focus(), 50)
  }, [])

  const handleGlobalFind = useCallback(() => {
    setShowFindReplace(true)
  }, [])

  const handleEditorMount = useCallback(
    (
      editor: editor.IStandaloneCodeEditor,
      monaco: typeof import("monaco-editor"),
    ) => {
      editorHook.setEditor(editor, monaco)

      const wheelHandler = (e: WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault()
          setLocalFontSize((prev) => {
            const delta = e.deltaY > 0 ? -1 : 1
            return Math.max(8, Math.min(32, prev + delta))
          })
        }
      }

      const editorDom = editor.getDomNode()
      editorDom?.addEventListener("wheel", wheelHandler, { passive: false })

      return () => {
        editorDom?.removeEventListener("wheel", wheelHandler)
      }
    },
    [editorHook],
  )

  const filteredFiles = useMemo(() => {
    if (!quickOpenQuery) return files
    const query = quickOpenQuery.toLowerCase()
    return files
      .filter((f) => f.path.toLowerCase().includes(query))
      .sort((a, b) => {
        const aIndex = a.path.toLowerCase().indexOf(query)
        const bIndex = b.path.toLowerCase().indexOf(query)
        return aIndex - bIndex
      })
  }, [files, quickOpenQuery])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey

      if (isMod && e.key === "b") {
        e.preventDefault()
        setSidebarOpen((prev) => !prev)
      }

      if (e.key === "Escape") {
        setShowQuickOpen(false)
        setShowFindReplace(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const filesByDirectory = useMemo(() => {
    const directories = new Map<string, EditorFile[]>()

    for (const file of files) {
      const parts = file.path.split("/")
      const dir = parts.length > 1 ? parts.slice(0, -1).join("/") : ""
      const existing = directories.get(dir) || []
      existing.push(file)
      directories.set(dir, existing)
    }

    return directories
  }, [files])

  const getFileIcon = (path: string) => {
    const ext = path.split(".").pop()?.toLowerCase() || ""
    const icons: Record<string, string> = {
      tsx: "⚛️",
      ts: "📘",
      jsx: "⚛️",
      js: "📒",
      json: "📋",
      md: "📝",
      css: "🎨",
      scss: "🎨",
      html: "🌐",
      py: "🐍",
      go: "🔵",
      rs: "🦀",
      java: "☕",
    }
    return icons[ext] || "📄"
  }

  return (
    <div
      className={`tscircuit-code-editor ${className}`}
      style={{
        display: "flex",
        flexDirection: "column",
        width,
        height,
        backgroundColor: colors.bg,
        color: colors.text,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: "13px",
        overflow: "hidden",
        position: "relative",
        ...style,
      }}
    >
      {showHeader && (
        <div
          style={{
            height: HEADER_HEIGHT,
            display: "flex",
            alignItems: "center",
            padding: "0 12px",
            backgroundColor: colors.sidebar,
            borderBottom: `1px solid ${colors.border}`,
            gap: "8px",
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: "none",
              border: "none",
              color: colors.text,
              cursor: "pointer",
              padding: "4px 8px",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = colors.hover)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
            title="Toggle Sidebar (Cmd/Ctrl+B)"
          >
            <span style={{ fontSize: "16px" }}>☰</span>
          </button>

          {currentFile && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 12px",
                backgroundColor: colors.active,
                borderRadius: "4px",
              }}
            >
              <span>{getFileIcon(currentFile)}</span>
              <span style={{ fontWeight: 500 }}>
                {currentFile.split("/").pop()}
              </span>
            </div>
          )}

          <div style={{ flex: 1 }} />

          <button
            type="button"
            onClick={handleQuickOpen}
            style={{
              background: "none",
              border: `1px solid ${colors.border}`,
              color: colors.textMuted,
              cursor: "pointer",
              padding: "4px 12px",
              borderRadius: "4px",
              fontSize: "12px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = colors.hover)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            <span>Quick Open</span>
            <span
              style={{
                backgroundColor: colors.hover,
                padding: "2px 6px",
                borderRadius: "3px",
                fontSize: "11px",
              }}
            >
              ⌘P
            </span>
          </button>

          <span
            style={{
              color: colors.textMuted,
              fontSize: "12px",
              padding: "0 8px",
            }}
          >
            Font: {localFontSize}px
          </span>
        </div>
      )}

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {sidebarOpen && (
          <div
            style={{
              width: SIDEBAR_WIDTH,
              backgroundColor: colors.sidebar,
              borderRight: `1px solid ${colors.border}`,
              display: "flex",
              flexDirection: "column",
              flexShrink: 0,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "12px",
                fontWeight: 600,
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                color: colors.textMuted,
              }}
            >
              Explorer
            </div>

            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "0 8px 8px",
              }}
            >
              {Array.from(filesByDirectory.entries()).map(([dir, dirFiles]) => (
                <div key={dir || "root"}>
                  {dir && (
                    <div
                      style={{
                        padding: "4px 8px",
                        fontSize: "12px",
                        fontWeight: 500,
                        color: colors.textMuted,
                        marginTop: "8px",
                      }}
                    >
                      📁 {dir}
                    </div>
                  )}
                  {dirFiles.map((file) => (
                    <button
                      type="button"
                      key={file.path}
                      onClick={() => handleFileSelect(file.path)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "6px 8px",
                        paddingLeft: dir ? "24px" : "8px",
                        width: "100%",
                        background:
                          currentFile === file.path
                            ? colors.active
                            : "transparent",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        color: colors.text,
                        fontSize: "13px",
                        textAlign: "left",
                      }}
                      onMouseEnter={(e) => {
                        if (currentFile !== file.path) {
                          e.currentTarget.style.backgroundColor = colors.hover
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (currentFile !== file.path) {
                          e.currentTarget.style.backgroundColor = "transparent"
                        }
                      }}
                    >
                      <span>{getFileIcon(file.path)}</span>
                      <span
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {file.path.split("/").pop()}
                      </span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ flex: 1, overflow: "hidden" }}>
          <Editor
            files={files}
            currentFile={currentFile}
            theme={theme}
            customThemes={customThemes}
            readOnly={readOnly}
            fontSize={localFontSize}
            tabSize={tabSize}
            wordWrap={wordWrap}
            lineNumbers={lineNumbers}
            minimap={showMinimap}
            highlightLine={highlightedLine}
            options={options}
            onChange={handleChange}
            onMount={handleEditorMount}
            onSave={handleSave}
            onQuickOpen={handleQuickOpen}
            onGlobalFind={handleGlobalFind}
            width="100%"
            height="100%"
          />
        </div>
      </div>

      {showQuickOpen && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.4)",
            display: "flex",
            justifyContent: "center",
            paddingTop: "15vh",
            zIndex: 100,
          }}
          onClick={() => setShowQuickOpen(false)}
          onKeyDown={(e) => e.key === "Escape" && setShowQuickOpen(false)}
          role="button"
          tabIndex={0}
        >
          <div
            style={{
              width: "500px",
              maxHeight: "400px",
              backgroundColor: colors.sidebar,
              borderRadius: "8px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="dialog"
          >
            <input
              ref={quickOpenRef}
              type="text"
              placeholder="Search files..."
              value={quickOpenQuery}
              onChange={(e) => setQuickOpenQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && filteredFiles[0]) {
                  handleFileSelect(filteredFiles[0].path)
                  setShowQuickOpen(false)
                }
                if (e.key === "Escape") {
                  setShowQuickOpen(false)
                }
              }}
              style={{
                width: "100%",
                padding: "16px",
                border: "none",
                borderBottom: `1px solid ${colors.border}`,
                backgroundColor: "transparent",
                color: colors.text,
                fontSize: "14px",
                outline: "none",
              }}
            />

            <div style={{ maxHeight: "340px", overflowY: "auto" }}>
              {filteredFiles.map((file, index) => (
                <button
                  type="button"
                  key={file.path}
                  onClick={() => {
                    handleFileSelect(file.path)
                    setShowQuickOpen(false)
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "10px 16px",
                    width: "100%",
                    background: index === 0 ? colors.active : "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: colors.text,
                    textAlign: "left",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = colors.hover)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor =
                      index === 0 ? colors.active : "transparent")
                  }
                >
                  <span>{getFileIcon(file.path)}</span>
                  <div>
                    <div style={{ fontWeight: 500 }}>
                      {file.path.split("/").pop()}
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: colors.textMuted,
                      }}
                    >
                      {file.path}
                    </div>
                  </div>
                </button>
              ))}
              {filteredFiles.length === 0 && (
                <div
                  style={{
                    padding: "20px",
                    textAlign: "center",
                    color: colors.textMuted,
                  }}
                >
                  No files found
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
