import type { editor } from "monaco-editor"

export const DEFAULT_TSCIRCUIT_IMPORTS = `
import React from "@types/react/jsx-runtime"
import { Circuit, createUseComponent } from "@tscircuit/core"
import type { CommonLayoutProps } from "@tscircuit/props"
import type { ManualEditEvent } from "@tscircuit/props"
import type { PcbTraceHint } from "@tscircuit/props"
`

export const TSCIRCUIT_MODULE_ALIAS =
  'declare module "tscircuit" { export * from "@tscircuit/core"; }'

export const DEFAULT_EDITOR_OPTIONS: editor.IStandaloneEditorConstructionOptions =
  {
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
    hover: { enabled: true, delay: 100 },
    padding: { top: 8, bottom: 8 },
    mouseWheelZoom: false,
    gotoLocation: {
      multiple: "goto",
      multipleDefinitions: "goto",
      multipleTypeDefinitions: "goto",
      multipleDeclarations: "goto",
      multipleImplementations: "goto",
      multipleReferences: "goto",
    },
  }

export const SIDEBAR_WIDTH = 240
export const HEADER_HEIGHT = 40
export const STATUSBAR_HEIGHT = 24
export const TAB_HEIGHT = 36
export const MIN_FONT_SIZE = 8
export const MAX_FONT_SIZE = 32
export const DEFAULT_FONT_SIZE = 14
export const DEFAULT_TAB_SIZE = 2
