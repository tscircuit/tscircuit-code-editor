import "../src/styles.css"
import { CodeEditor } from "../src/components/CodeEditor"
import type { EditorFile } from "../src/types"

const sampleFiles: EditorFile[] = [
  {
    path: "index.tsx",
    content: `import { MyResistor } from "./components/MyResistor"

export default function MyCircuit() {
  return (
    <board>
      <MyResistor name="R1" resistance="10kohm" />
      <capacitor name="C1" capacitance="100nF" footprint="0603" />
      <inductor name="L1" inductance="10uH" footprint="0805" />
      <trace from=".R1 > .pin2" to=".C1 > .pos" />
      <trace from=".C1 > .neg" to=".L1 > .pin1" />
    </board>
  )
}`,
  },
  {
    path: "components/MyResistor.tsx",
    content: `interface MyResistorProps {
  name: string
  resistance: string
}

export function MyResistor({ name, resistance }: MyResistorProps) {
  return <resistor name={name} resistance={resistance} footprint="0402" />
}`,
  },
  {
    path: "components/PowerSupply.tsx",
    content: `interface PowerSupplyProps {
  voltage: string
}

export function PowerSupply({ voltage }: PowerSupplyProps) {
  return (
    <group>
      <capacitor name="C_IN" capacitance="10uF" footprint="0805" />
      <capacitor name="C_OUT" capacitance="22uF" footprint="0805" />
      <resistor name="R_FB1" resistance="100kohm" footprint="0402" />
      <resistor name="R_FB2" resistance="47kohm" footprint="0402" />
    </group>
  )
}`,
  },
  {
    path: "utils/helpers.ts",
    content: `export function formatResistance(value: number): string {
  if (value >= 1000000) return \`\${value / 1000000}M\`
  if (value >= 1000) return \`\${value / 1000}k\`
  return \`\${value}\`
}

export function parseResistance(str: string): number {
  const match = str.match(/^([\\d.]+)([kKmM]?)/)
  if (!match) return 0
  const value = parseFloat(match[1])
  const unit = match[2].toLowerCase()
  switch (unit) {
    case "k": return value * 1000
    case "m": return value * 1000000
    default: return value
  }
}

export function generateNetName(from: string, to: string): string {
  return \`NET_\${from}_\${to}\`.replace(/[^a-zA-Z0-9_]/g, "_")
}`,
  },
  {
    path: "config.json",
    content: `{
  "name": "my-circuit",
  "version": "1.0.0",
  "components": {
    "resistors": ["R1", "R2"],
    "capacitors": ["C1", "C_IN", "C_OUT"],
    "inductors": ["L1"]
  },
  "settings": {
    "autoLayout": true,
    "gridSize": 1.27,
    "traceWidth": 0.25
  }
}`,
  },
  {
    path: "manual-edits.json",
    content: `{
  "pcb_placements": [],
  "schematic_placements": [],
  "edit_events": [],
  "manual_trace_hints": []
}`,
  },
]

export default {
  "Full IDE": () => (
    <CodeEditor
      files={sampleFiles}
      initialFile="index.tsx"
      height="100vh"
      showPreview
      onChange={(value, path) => console.log("Changed:", path)}
      onFileSelect={(path) => console.log("Selected:", path)}
      onSave={(files) => console.log("Save:", files.length, "files")}
      onCreateFile={(path, content) => console.log("Create:", path)}
      onDeleteFile={(path) => console.log("Delete:", path)}
      onRenameFile={(from, to) => console.log("Rename:", from, "->", to)}
    />
  ),

  "Editor Only": () => (
    <CodeEditor
      files={sampleFiles}
      initialFile="index.tsx"
      height="100vh"
      showSidebar={false}
      showPreview={false}
    />
  ),

  "With Preview": () => (
    <CodeEditor
      files={sampleFiles}
      initialFile="index.tsx"
      height="100vh"
      showPreview
    />
  ),

  "Read Only": () => (
    <CodeEditor
      files={sampleFiles}
      initialFile="index.tsx"
      height="100vh"
      readOnly
    />
  ),

  "No Minimap": () => (
    <CodeEditor
      files={sampleFiles}
      initialFile="index.tsx"
      height="100vh"
      showMinimap={false}
    />
  ),

  "Large Font": () => (
    <CodeEditor
      files={sampleFiles}
      initialFile="index.tsx"
      height="100vh"
      fontSize={18}
    />
  ),

  "Single File": () => (
    <CodeEditor
      files={sampleFiles.slice(0, 1)}
      initialFile="index.tsx"
      height="100vh"
      showSidebar={false}
    />
  ),
}
