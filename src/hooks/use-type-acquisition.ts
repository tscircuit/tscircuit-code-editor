import { useRef, useEffect, useCallback } from "react"
import { setupTypeAcquisition } from "@typescript/ata"
import tsModule from "typescript"
import { fetchWithCache } from "../lib/ts-lib-cache"
import {
  DEFAULT_TSCIRCUIT_IMPORTS,
  TSCIRCUIT_MODULE_ALIAS,
} from "../lib/constants"

const ataFileCache = new Map<string, string>()

export function getAtaFileCache(): Map<string, string> {
  return ataFileCache
}

interface UseTypeAcquisitionOptions {
  monaco: any
  enabled?: boolean
}

export function useTypeAcquisition({
  monaco,
  enabled = true,
}: UseTypeAcquisitionOptions) {
  const ataRef = useRef<ReturnType<typeof setupTypeAcquisition> | null>(null)
  const processedImportsRef = useRef(new Set<string>())

  useEffect(() => {
    if (!monaco || !enabled) return

    const tsDefaults = (monaco.languages.typescript as any)
      .typescriptDefaults as {
      addExtraLib: (content: string, filePath: string) => void
    }

    tsDefaults.addExtraLib(
      TSCIRCUIT_MODULE_ALIAS,
      "file:///tscircuit-alias.d.ts",
    )
    ataFileCache.set("/tscircuit-alias.d.ts", TSCIRCUIT_MODULE_ALIAS)

    const manualEditsDecl = `
declare module "manual-edits.json" {
  const value: {
    pcb_placements?: any[];
    schematic_placements?: any[];
    edit_events?: any[];
    manual_trace_hints?: any[];
  } | undefined;
  export default value;
}
`
    tsDefaults.addExtraLib(manualEditsDecl, "file:///manual-edits.d.ts")
    ataFileCache.set("/manual-edits.d.ts", manualEditsDecl)

    const ata = setupTypeAcquisition({
      projectName: "tscircuit-editor",
      typescript: tsModule,
      logger: console,
      fetcher: fetchWithCache as unknown as typeof fetch,
      delegate: {
        started: () => {},
        receivedFile: (code: string, path: string) => {
          const uri = `file://${path}`
          tsDefaults.addExtraLib(code, uri)
          ataFileCache.set(path, code)
        },
        errorMessage: (msg: string) => {
          console.warn("[ATA]", msg)
        },
        finished: () => {},
      },
    })

    ataRef.current = ata
    ata(DEFAULT_TSCIRCUIT_IMPORTS)

    return () => {
      ataRef.current = null
      processedImportsRef.current.clear()
    }
  }, [monaco, enabled])

  const acquireTypes = useCallback((code: string) => {
    if (!ataRef.current) return

    const importLines = code
      .split("\n")
      .filter(
        (line) =>
          line.includes("import ") ||
          line.includes("from ") ||
          line.includes("require("),
      )

    const signature = importLines.sort().join("\n")
    if (processedImportsRef.current.has(signature)) return
    processedImportsRef.current.add(signature)

    ataRef.current(`${DEFAULT_TSCIRCUIT_IMPORTS}\n${code}`)
  }, [])

  return { acquireTypes, ataFileCache }
}
