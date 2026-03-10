import { useEffect, useRef } from "react"

type KeyCombo = string

interface UseHotkeyOptions {
  enabled?: boolean
  preventDefault?: boolean
}

function parseCombo(combo: KeyCombo) {
  const parts = combo.toLowerCase().split("+")
  return {
    ctrl: parts.includes("ctrl"),
    meta: parts.includes("cmd") || parts.includes("meta"),
    mod: parts.includes("mod"),
    shift: parts.includes("shift"),
    alt: parts.includes("alt"),
    key: parts[parts.length - 1],
  }
}

function matchesCombo(
  event: KeyboardEvent,
  parsed: ReturnType<typeof parseCombo>,
): boolean {
  const isMod = event.metaKey || event.ctrlKey

  if (parsed.mod && !isMod) return false
  if (parsed.ctrl && !event.ctrlKey) return false
  if (parsed.meta && !event.metaKey) return false
  if (parsed.shift && !event.shiftKey) return false
  if (parsed.alt && !event.altKey) return false

  return event.key.toLowerCase() === parsed.key
}

export function useHotkey(
  combo: KeyCombo,
  callback: () => void,
  options: UseHotkeyOptions = {},
) {
  const { enabled = true, preventDefault = true } = options
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    if (!enabled) return

    const parsed = parseCombo(combo)
    const handler = (event: KeyboardEvent) => {
      if (matchesCombo(event, parsed)) {
        if (preventDefault) event.preventDefault()
        callbackRef.current()
      }
    }

    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [combo, enabled, preventDefault])
}
