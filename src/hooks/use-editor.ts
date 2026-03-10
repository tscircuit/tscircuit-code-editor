import { useRef, useCallback } from "react"
import type { editor } from "monaco-editor"

type Monaco = typeof import("monaco-editor")

export function useEditor() {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<Monaco | null>(null)

  const setEditor = useCallback(
    (ed: editor.IStandaloneCodeEditor, mon: Monaco) => {
      editorRef.current = ed
      monacoRef.current = mon
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

  const setPosition = useCallback((lineNumber: number, column: number) => {
    if (!editorRef.current) return
    editorRef.current.setPosition({ lineNumber, column })
    editorRef.current.revealPositionInCenter({ lineNumber, column })
  }, [])

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
    if (!editorRef.current) return
    if (center) {
      editorRef.current.revealLineInCenter(lineNumber)
    } else {
      editorRef.current.revealLine(lineNumber)
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
      if (!editorRef.current || !monacoRef.current) return
      const selection = new monacoRef.current.Selection(
        startLineNumber,
        startColumn,
        endLineNumber,
        endColumn,
      )
      editorRef.current.setSelection(selection)
    },
    [],
  )

  const insertText = useCallback((text: string) => {
    if (!editorRef.current) return
    const selection = editorRef.current.getSelection()
    if (selection) {
      editorRef.current.executeEdits("", [
        { range: selection, text, forceMoveMarkers: true },
      ])
    }
  }, [])

  const addDecoration = useCallback(
    (lineNumber: number, options: editor.IModelDecorationOptions): string[] => {
      if (!editorRef.current || !monacoRef.current) return []
      const range = new monacoRef.current.Range(lineNumber, 1, lineNumber, 1)
      return editorRef.current.deltaDecorations([], [{ range, options }])
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
