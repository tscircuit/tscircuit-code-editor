import "../src/styles.css"
import { MonacoEditor } from "../src/components/MonacoEditor"

const tsxCode = `import { Circuit } from "tscircuit"

export default function MyCircuit() {
  return (
    <board>
      <resistor name="R1" resistance="10kohm" footprint="0402" />
      <capacitor name="C1" capacitance="100nF" footprint="0603" />
      <trace from=".R1 > .pin2" to=".C1 > .pos" />
    </board>
  )
}`

const jsonCode = `{
  "name": "tscircuit-code-editor",
  "version": "1.0.0",
  "description": "A Monaco-based code editor for tscircuit",
  "dependencies": {
    "@monaco-editor/react": "^4.8.0",
    "react": "^19.0.0"
  }
}`

export default {
  "TypeScript (TSX)": () => (
    <MonacoEditor
      defaultValue={tsxCode}
      defaultLanguage="typescript"
      height="100vh"
    />
  ),

  JSON: () => (
    <MonacoEditor
      defaultValue={jsonCode}
      defaultLanguage="json"
      height="100vh"
    />
  ),

  "Read Only": () => (
    <MonacoEditor
      defaultValue={tsxCode}
      defaultLanguage="typescript"
      readOnly
      height="100vh"
    />
  ),

  "No Minimap": () => (
    <MonacoEditor
      defaultValue={tsxCode}
      defaultLanguage="typescript"
      minimap={false}
      height="100vh"
    />
  ),

  "Large Font": () => (
    <MonacoEditor
      defaultValue={tsxCode}
      defaultLanguage="typescript"
      fontSize={20}
      height="100vh"
    />
  ),

  "With Type Acquisition": () => (
    <MonacoEditor
      defaultValue={tsxCode}
      defaultLanguage="typescript"
      enableTypeAcquisition
      height="100vh"
      onChange={(value) => console.log("Changed:", value?.length, "chars")}
    />
  ),
}
