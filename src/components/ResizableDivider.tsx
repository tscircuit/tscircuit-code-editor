import { useRef, useCallback, useEffect, useState } from "react"
import { GripVertical } from "lucide-react"

interface ResizableDividerProps {
  direction: "horizontal" | "vertical"
  onResize: (delta: number) => void
  className?: string
}

export function ResizableDivider({
  direction,
  onResize,
  className = "",
}: ResizableDividerProps) {
  const [isDragging, setIsDragging] = useState(false)
  const startPosRef = useRef(0)

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      setIsDragging(true)
      startPosRef.current = direction === "horizontal" ? e.clientX : e.clientY
    },
    [direction],
  )

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const current = direction === "horizontal" ? e.clientX : e.clientY
      const delta = current - startPosRef.current
      startPosRef.current = current
      onResize(delta)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
    document.body.style.cursor =
      direction === "horizontal" ? "col-resize" : "row-resize"
    document.body.style.userSelect = "none"

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }
  }, [isDragging, direction, onResize])

  if (direction === "horizontal") {
    return (
      <div
        className={`flex items-center justify-center w-1.5 shrink-0 cursor-col-resize group hover:bg-blue-100 transition-colors ${
          isDragging ? "bg-blue-200" : "bg-gray-200"
        } ${className}`}
        onMouseDown={handleMouseDown}
      >
        <GripVertical
          className={`w-3 h-3 transition-colors ${
            isDragging
              ? "text-blue-600"
              : "text-gray-400 group-hover:text-blue-500"
          }`}
        />
      </div>
    )
  }

  return (
    <div
      className={`flex items-center justify-center h-1.5 shrink-0 cursor-row-resize group hover:bg-blue-100 transition-colors ${
        isDragging ? "bg-blue-200" : "bg-gray-200"
      } ${className}`}
      onMouseDown={handleMouseDown}
    >
      <GripVertical
        className={`w-3 h-3 rotate-90 transition-colors ${
          isDragging
            ? "text-blue-600"
            : "text-gray-400 group-hover:text-blue-500"
        }`}
      />
    </div>
  )
}
