import { CodeEditor } from "../src/components/CodeEditor"
import type { EditorFile } from "../src/components/Editor"

const sampleFiles: EditorFile[] = [
  {
    path: "index.tsx",
    content: `import { Circuit } from "tscircuit"
import { MyResistor } from "./components/MyResistor"

export default function App() {
  return (
    <Circuit>
      <MyResistor name="R1" resistance="10kohm" />
      <capacitor name="C1" capacitance="100nF" footprint="0603" />
      <trace from=".R1 > .pin2" to=".C1 > .pos" />
    </Circuit>
  )
}`,
  },
  {
    path: "components/MyResistor.tsx",
    content: `import { useResistor } from "tscircuit"

interface MyResistorProps {
  name: string
  resistance: string
}

export function MyResistor({ name, resistance }: MyResistorProps) {
  useResistor(name, { resistance, footprint: "0402" })
  return <resistor name={name} resistance={resistance} footprint="0402" />
}`,
  },
  {
    path: "utils/helpers.ts",
    content: `export function formatResistance(value: number): string {
  if (value >= 1000000) {
    return \`\${value / 1000000}M\`
  }
  if (value >= 1000) {
    return \`\${value / 1000}k\`
  }
  return \`\${value}\`
}

export function parseResistance(str: string): number {
  const match = str.match(/^([\\d.]+)([kKmM]?)/)
  if (!match) return 0
  
  const value = parseFloat(match[1])
  const unit = match[2].toLowerCase()
  
  switch (unit) {
    case 'k': return value * 1000
    case 'm': return value * 1000000
    default: return value
  }
}`,
  },
  {
    path: "config.json",
    content: `{
  "name": "my-circuit",
  "version": "1.0.0",
  "components": {
    "resistors": ["R1", "R2"],
    "capacitors": ["C1"]
  },
  "settings": {
    "autoLayout": true,
    "gridSize": 1.27
  }
}`,
  },
  {
    path: "README.md",
    content: `# My Circuit

A sample tscircuit project demonstrating the code editor.

## Features

- TypeScript support with IntelliSense
- Multi-file editing
- Quick open (Cmd/Ctrl+P)
- Sidebar file explorer
- Syntax highlighting

## Usage

\`\`\`tsx
import { CodeEditor } from "tscircuit-code-editor"

<CodeEditor
  files={files}
  theme="vs-dark"
  onChange={(value, path) => console.log(path, value)}
/>
\`\`\`
`,
  },
]

export default {
  "Basic Editor": () => (
    <CodeEditor
      files={sampleFiles}
      initialFile="index.tsx"
      theme="vs-dark"
      height="100vh"
      onChange={(value, path) => console.log("File changed:", path)}
      onFileSelect={(path) => console.log("File selected:", path)}
      onSave={(value, path) => console.log("Saved:", path)}
    />
  ),

  "Light Theme": () => (
    <CodeEditor
      files={sampleFiles}
      initialFile="index.tsx"
      theme="light"
      height="100vh"
    />
  ),

  "No Sidebar": () => (
    <CodeEditor
      files={sampleFiles}
      initialFile="components/MyResistor.tsx"
      theme="vs-dark"
      showSidebar={false}
      height="100vh"
    />
  ),

  "Read Only": () => (
    <CodeEditor
      files={sampleFiles}
      initialFile="index.tsx"
      theme="vs-dark"
      readOnly
      height="100vh"
    />
  ),

  "Custom Font Size": () => (
    <CodeEditor
      files={sampleFiles}
      initialFile="index.tsx"
      theme="vs-dark"
      fontSize={18}
      height="100vh"
    />
  ),

  "No Minimap": () => (
    <CodeEditor
      files={sampleFiles}
      initialFile="utils/helpers.ts"
      theme="vs-dark"
      showMinimap={false}
      height="100vh"
    />
  ),

  "JSON File": () => (
    <CodeEditor
      files={sampleFiles}
      initialFile="config.json"
      theme="vs-dark"
      height="100vh"
    />
  ),

  "Markdown File": () => (
    <CodeEditor
      files={sampleFiles}
      initialFile="README.md"
      theme="vs-dark"
      height="100vh"
    />
  ),
}
