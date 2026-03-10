import {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
  type MouseEvent as ReactMouseEvent,
} from "react"
import {
  ChevronRight,
  ChevronDown,
  File,
  FileCode2,
  FileJson,
  FileText,
  FolderOpen,
  Folder,
  Plus,
  Trash2,
  Pencil,
  X,
  Check,
  Copy,
  Eye,
  EyeOff,
} from "lucide-react"
import type { EditorFile } from "../types"
import { getFileExtension } from "../lib/language-map"

interface ContextMenuState {
  x: number
  y: number
  path: string
  name: string
}

interface FileSidebarProps {
  files: EditorFile[]
  currentFile: string | null
  onFileSelect: (path: string) => void
  onCreateFile?: (path: string, content: string) => void
  onDeleteFile?: (path: string) => void
  onRenameFile?: (oldPath: string, newPath: string) => void
  className?: string
}

const HIDDEN_SEGMENTS = new Set([
  "node_modules",
  ".git",
  ".next",
  ".cache",
  "dist",
  ".turbo",
])

function isHiddenFile(path: string): boolean {
  const segments = path.split("/")
  for (const seg of segments) {
    if (seg.startsWith(".") || HIDDEN_SEGMENTS.has(seg)) return true
  }
  return false
}

interface TreeNode {
  name: string
  path: string
  type: "file" | "directory"
  children: TreeNode[]
}

function getFileIcon(path: string) {
  const ext = getFileExtension(path)
  const iconClass = "w-4 h-4 shrink-0"
  switch (ext) {
    case "tsx":
    case "ts":
    case "jsx":
    case "js":
      return <FileCode2 className={`${iconClass} text-blue-600`} />
    case "json":
      return <FileJson className={`${iconClass} text-yellow-600`} />
    case "md":
    case "txt":
      return <FileText className={`${iconClass} text-gray-500`} />
    case "css":
    case "scss":
      return <FileCode2 className={`${iconClass} text-purple-500`} />
    default:
      return <File className={`${iconClass} text-gray-400`} />
  }
}

function buildTree(files: EditorFile[]): TreeNode[] {
  const root: TreeNode[] = []

  const sortedFiles = [...files].sort((a, b) => a.path.localeCompare(b.path))

  for (const file of sortedFiles) {
    const parts = file.path.split("/")
    let current = root

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i] ?? ""
      const isFile = i === parts.length - 1
      const pathSoFar = parts.slice(0, i + 1).join("/")

      const found = current.find((n) => n.name === part)
      if (found) {
        current = found.children
      } else {
        const node: TreeNode = {
          name: part,
          path: isFile ? file.path : pathSoFar,
          type: isFile ? "file" : "directory",
          children: [],
        }
        current.push(node)
        current = node.children
      }
    }
  }

  function sortNodes(nodes: TreeNode[]): TreeNode[] {
    return nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === "directory" ? -1 : 1
      return a.name.localeCompare(b.name)
    })
  }

  function sortTree(nodes: TreeNode[]): TreeNode[] {
    for (const node of nodes) {
      if (node.children.length > 0) {
        node.children = sortTree(node.children)
      }
    }
    return sortNodes(nodes)
  }

  return sortTree(root)
}

function TreeItem({
  node,
  depth,
  currentFile,
  expandedDirs,
  onToggleDir,
  onFileSelect,
  onContextMenu,
  renamingPath,
  renameValue,
  onRenameValueChange,
  onRenameSubmit,
  onRenameCancel,
}: {
  node: TreeNode
  depth: number
  currentFile: string | null
  expandedDirs: Set<string>
  onToggleDir: (path: string) => void
  onFileSelect: (path: string) => void
  onContextMenu: (e: ReactMouseEvent, path: string, name: string) => void
  renamingPath: string | null
  renameValue: string
  onRenameValueChange: (v: string) => void
  onRenameSubmit: () => void
  onRenameCancel: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const isExpanded = expandedDirs.has(node.path)
  const isActive = node.type === "file" && currentFile === node.path
  const isRenaming = renamingPath === node.path

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isRenaming])

  if (node.type === "directory") {
    return (
      <div>
        <button
          type="button"
          className="flex items-center gap-1 w-full px-2 py-1 text-left text-sm hover:bg-blue-50 rounded transition-colors"
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => onToggleDir(node.path)}
        >
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-gray-500 shrink-0" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-gray-500 shrink-0" />
          )}
          {isExpanded ? (
            <FolderOpen className="w-4 h-4 text-blue-500 shrink-0" />
          ) : (
            <Folder className="w-4 h-4 text-blue-500 shrink-0" />
          )}
          <span className="truncate text-gray-700 font-medium">
            {node.name}
          </span>
        </button>
        {isExpanded &&
          node.children.map((child) => (
            <TreeItem
              key={child.path}
              node={child}
              depth={depth + 1}
              currentFile={currentFile}
              expandedDirs={expandedDirs}
              onToggleDir={onToggleDir}
              onFileSelect={onFileSelect}
              onContextMenu={onContextMenu}
              renamingPath={renamingPath}
              renameValue={renameValue}
              onRenameValueChange={onRenameValueChange}
              onRenameSubmit={onRenameSubmit}
              onRenameCancel={onRenameCancel}
            />
          ))}
      </div>
    )
  }

  if (isRenaming) {
    return (
      <div
        className="flex items-center gap-1 px-2 py-0.5"
        style={{ paddingLeft: `${depth * 12 + 24}px` }}
      >
        <input
          ref={inputRef}
          type="text"
          value={renameValue}
          onChange={(e) => onRenameValueChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onRenameSubmit()
            if (e.key === "Escape") onRenameCancel()
          }}
          onBlur={onRenameSubmit}
          className="flex-1 min-w-0 text-sm px-1 py-0.5 border border-blue-400 rounded bg-white outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={onRenameSubmit}
          className="p-0.5 hover:bg-blue-100 rounded"
        >
          <Check className="w-3 h-3 text-green-600" />
        </button>
        <button
          type="button"
          onClick={onRenameCancel}
          className="p-0.5 hover:bg-red-100 rounded"
        >
          <X className="w-3 h-3 text-red-500" />
        </button>
      </div>
    )
  }

  return (
    <button
      type="button"
      className={`flex items-center gap-2 w-full px-2 py-1 text-left text-sm rounded transition-colors ${
        isActive
          ? "bg-blue-100 text-blue-800 border-l-2 border-blue-600"
          : "hover:bg-blue-50 text-gray-700"
      }`}
      style={{ paddingLeft: `${depth * 12 + 24}px` }}
      onClick={() => onFileSelect(node.path)}
      onContextMenu={(e) => onContextMenu(e, node.path, node.name)}
    >
      {getFileIcon(node.path)}
      <span className="truncate">{node.name}</span>
    </button>
  )
}

function ContextMenu({
  menu,
  onRename,
  onDelete,
  onCopyPath,
  onClose,
}: {
  menu: ContextMenuState
  onRename: () => void
  onDelete: () => void
  onCopyPath: () => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [onClose])

  return (
    <div
      ref={ref}
      className="fixed z-50 bg-white rounded-md shadow-lg border border-gray-200 py-1 min-w-[160px] text-[13px]"
      style={{ left: menu.x, top: menu.y }}
    >
      <button
        type="button"
        className="flex items-center gap-2.5 w-full px-3 py-1 text-left text-gray-700 hover:bg-blue-600 hover:text-white transition-colors"
        onClick={() => {
          onCopyPath()
          onClose()
        }}
      >
        <Copy className="w-4 h-4 opacity-60" />
        Copy Path
      </button>
      <button
        type="button"
        className="flex items-center gap-2.5 w-full px-3 py-1 text-left text-gray-700 hover:bg-blue-600 hover:text-white transition-colors"
        onClick={() => {
          onRename()
          onClose()
        }}
      >
        <Pencil className="w-4 h-4 opacity-60" />
        Rename
      </button>
      <div className="h-px bg-gray-200 my-1" />
      <button
        type="button"
        className="flex items-center gap-2.5 w-full px-3 py-1 text-left text-red-600 hover:bg-red-600 hover:text-white transition-colors"
        onClick={() => {
          onDelete()
          onClose()
        }}
      >
        <Trash2 className="w-4 h-4 opacity-60" />
        Delete
      </button>
    </div>
  )
}

export function FileSidebar({
  files,
  currentFile,
  onFileSelect,
  onCreateFile,
  onDeleteFile,
  onRenameFile,
  className = "",
}: FileSidebarProps) {
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(() => new Set())
  const [isCreating, setIsCreating] = useState(false)
  const [newFileName, setNewFileName] = useState("")
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [sidebarMenu, setSidebarMenu] = useState<{
    x: number
    y: number
  } | null>(null)
  const [showHiddenFiles, setShowHiddenFiles] = useState(false)
  const [renamingPath, setRenamingPath] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState("")
  const createInputRef = useRef<HTMLInputElement>(null)
  const sidebarMenuRef = useRef<HTMLDivElement>(null)

  const visibleFiles = useMemo(
    () =>
      showHiddenFiles ? files : files.filter((f) => !isHiddenFile(f.path)),
    [files, showHiddenFiles],
  )

  const hiddenCount = files.length - visibleFiles.length

  const tree = useMemo(() => buildTree(visibleFiles), [visibleFiles])

  useEffect(() => {
    if (currentFile) {
      const parts = currentFile.split("/")
      if (parts.length > 1) {
        setExpandedDirs((prev) => {
          const next = new Set(prev)
          for (let i = 1; i < parts.length; i++) {
            next.add(parts.slice(0, i).join("/"))
          }
          return next
        })
      }
    }
  }, [currentFile])

  useEffect(() => {
    if (isCreating && createInputRef.current) {
      createInputRef.current.focus()
    }
  }, [isCreating])

  useEffect(() => {
    if (!sidebarMenu) return
    const handler = (e: MouseEvent) => {
      if (
        sidebarMenuRef.current &&
        !sidebarMenuRef.current.contains(e.target as Node)
      ) {
        setSidebarMenu(null)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [sidebarMenu])

  const toggleDir = useCallback((path: string) => {
    setExpandedDirs((prev) => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }, [])

  const handleCreate = () => {
    if (newFileName && onCreateFile) {
      onCreateFile(newFileName, "")
      setNewFileName("")
      setIsCreating(false)
    }
  }

  const handleContextMenu = useCallback(
    (e: ReactMouseEvent, path: string, name: string) => {
      if (!onRenameFile && !onDeleteFile) return
      e.preventDefault()
      setContextMenu({ x: e.clientX, y: e.clientY, path, name })
    },
    [onRenameFile, onDeleteFile],
  )

  const handleRenameSubmit = useCallback(() => {
    if (renamingPath && renameValue && onRenameFile) {
      const dir = renamingPath.split("/").slice(0, -1).join("/")
      const newPath = dir ? `${dir}/${renameValue}` : renameValue
      if (newPath !== renamingPath) {
        onRenameFile(renamingPath, newPath)
      }
    }
    setRenamingPath(null)
    setRenameValue("")
  }, [renamingPath, renameValue, onRenameFile])

  return (
    <div
      className={`flex flex-col h-full bg-gray-50 border-r border-gray-200 select-none ${className}`}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
          Explorer
        </span>
        {onCreateFile && (
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="p-1 hover:bg-blue-100 rounded transition-colors"
            title="New File"
          >
            <Plus className="w-3.5 h-3.5 text-gray-600" />
          </button>
        )}
      </div>

      {isCreating && (
        <div className="flex items-center gap-1 px-3 py-1 border-b border-gray-200">
          <input
            ref={createInputRef}
            type="text"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate()
              if (e.key === "Escape") {
                setIsCreating(false)
                setNewFileName("")
              }
            }}
            onBlur={() => {
              if (!newFileName) setIsCreating(false)
            }}
            placeholder="filename.tsx"
            className="flex-1 min-w-0 text-sm px-2 py-1 border border-blue-400 rounded bg-white outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={handleCreate}
            className="p-0.5 hover:bg-blue-100 rounded"
          >
            <Check className="w-3.5 h-3.5 text-green-600" />
          </button>
          <button
            type="button"
            onClick={() => {
              setIsCreating(false)
              setNewFileName("")
            }}
            className="p-0.5 hover:bg-red-100 rounded"
          >
            <X className="w-3.5 h-3.5 text-red-500" />
          </button>
        </div>
      )}

      <div
        className="flex-1 overflow-y-auto py-1 tsce-scrollbar"
        onContextMenu={(e) => {
          if ((e.target as HTMLElement).closest("button")) return
          e.preventDefault()
          setSidebarMenu({ x: e.clientX, y: e.clientY })
        }}
      >
        {tree.map((node) => (
          <TreeItem
            key={node.path}
            node={node}
            depth={0}
            currentFile={currentFile}
            expandedDirs={expandedDirs}
            onToggleDir={toggleDir}
            onFileSelect={onFileSelect}
            onContextMenu={handleContextMenu}
            renamingPath={renamingPath}
            renameValue={renameValue}
            onRenameValueChange={setRenameValue}
            onRenameSubmit={handleRenameSubmit}
            onRenameCancel={() => {
              setRenamingPath(null)
              setRenameValue("")
            }}
          />
        ))}
      </div>

      <div className="px-3 py-1.5 border-t border-gray-200 text-[11px] text-gray-400">
        {visibleFiles.length} file{visibleFiles.length !== 1 ? "s" : ""}
        {hiddenCount > 0 && !showHiddenFiles && (
          <span className="ml-1 text-gray-300">({hiddenCount} hidden)</span>
        )}
      </div>

      {contextMenu && (
        <ContextMenu
          menu={contextMenu}
          onRename={() => {
            setRenamingPath(contextMenu.path)
            setRenameValue(contextMenu.name)
          }}
          onDelete={() => {
            onDeleteFile?.(contextMenu.path)
          }}
          onCopyPath={() => {
            navigator.clipboard.writeText(contextMenu.path).catch(() => {})
          }}
          onClose={() => setContextMenu(null)}
        />
      )}

      {sidebarMenu && (
        <div
          ref={sidebarMenuRef}
          className="fixed z-50 bg-white rounded-md shadow-lg border border-gray-200 py-1 min-w-[180px] text-[13px]"
          style={{ left: sidebarMenu.x, top: sidebarMenu.y }}
        >
          <button
            type="button"
            className="flex items-center gap-2.5 w-full px-3 py-1 text-left text-gray-700 hover:bg-blue-600 hover:text-white transition-colors"
            onClick={() => {
              setShowHiddenFiles((p) => !p)
              setSidebarMenu(null)
            }}
          >
            {showHiddenFiles ? (
              <EyeOff className="w-4 h-4 opacity-60" />
            ) : (
              <Eye className="w-4 h-4 opacity-60" />
            )}
            {showHiddenFiles ? "Hide Hidden Files" : "Show Hidden Files"}
          </button>
          {onCreateFile && (
            <>
              <div className="h-px bg-gray-200 my-1" />
              <button
                type="button"
                className="flex items-center gap-2.5 w-full px-3 py-1 text-left text-gray-700 hover:bg-blue-600 hover:text-white transition-colors"
                onClick={() => {
                  setIsCreating(true)
                  setSidebarMenu(null)
                }}
              >
                <Plus className="w-4 h-4 opacity-60" />
                New File
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
