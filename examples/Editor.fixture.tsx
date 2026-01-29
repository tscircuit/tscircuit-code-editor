import { useState } from "react"
import { Editor, useEditor } from "../src/components/Editor"
import type { EditorFile } from "../src/components/Editor"

const typescriptCode = `interface User {
  id: number
  name: string
  email: string
}

async function fetchUsers(): Promise<User[]> {
  const response = await fetch('/api/users')
  return response.json()
}

export function UserList() {
  const [users, setUsers] = useState<User[]>([])
  
  useEffect(() => {
    fetchUsers().then(setUsers)
  }, [])
  
  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>
          {user.name} - {user.email}
        </li>
      ))}
    </ul>
  )
}`

const jsonCode = `{
  "name": "tscircuit-code-editor",
  "version": "1.0.0",
  "description": "A Monaco-based code editor for tscircuit",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "vite",
    "test": "vitest"
  },
  "dependencies": {
    "@monaco-editor/react": "^4.8.0",
    "react": "^19.0.0"
  }
}`

const files: EditorFile[] = [
  { path: "index.tsx", content: typescriptCode },
  { path: "package.json", content: jsonCode },
]

function EditorWithHook() {
  const { setEditor, getValue, setValue, format, focus } = useEditor()
  const [output, setOutput] = useState("")

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <div
        style={{
          padding: "8px",
          backgroundColor: "#252526",
          display: "flex",
          gap: "8px",
        }}
      >
        <button
          type="button"
          onClick={() => setOutput(getValue())}
          style={{
            padding: "6px 12px",
            backgroundColor: "#0e639c",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Get Value
        </button>
        <button
          type="button"
          onClick={() => setValue("// Replaced content\n")}
          style={{
            padding: "6px 12px",
            backgroundColor: "#0e639c",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Set Value
        </button>
        <button
          type="button"
          onClick={format}
          style={{
            padding: "6px 12px",
            backgroundColor: "#0e639c",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Format
        </button>
        <button
          type="button"
          onClick={focus}
          style={{
            padding: "6px 12px",
            backgroundColor: "#0e639c",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Focus
        </button>
      </div>
      <div style={{ flex: 1 }}>
        <Editor
          defaultValue={typescriptCode}
          defaultLanguage="typescript"
          theme="vs-dark"
          onMount={setEditor}
        />
      </div>
      {output && (
        <div
          style={{
            padding: "8px",
            backgroundColor: "#1e1e1e",
            color: "#ccc",
            maxHeight: "150px",
            overflow: "auto",
            fontSize: "12px",
            fontFamily: "monospace",
            whiteSpace: "pre-wrap",
          }}
        >
          {output.slice(0, 500)}...
        </div>
      )}
    </div>
  )
}

function MultiFileEditor() {
  const [currentFile, setCurrentFile] = useState<string>("index.tsx")

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <div
        style={{
          padding: "8px",
          backgroundColor: "#252526",
          display: "flex",
          gap: "4px",
        }}
      >
        {files.map((file) => (
          <button
            type="button"
            key={file.path}
            onClick={() => setCurrentFile(file.path)}
            style={{
              padding: "6px 16px",
              backgroundColor:
                currentFile === file.path ? "#1e1e1e" : "transparent",
              color: currentFile === file.path ? "#fff" : "#808080",
              border: "none",
              borderBottom:
                currentFile === file.path ? "2px solid #007acc" : "none",
              cursor: "pointer",
            }}
          >
            {file.path}
          </button>
        ))}
      </div>
      <div style={{ flex: 1 }}>
        <Editor
          files={files}
          currentFile={currentFile}
          theme="vs-dark"
          onChange={(value, path) => console.log("Changed:", path)}
        />
      </div>
    </div>
  )
}

function ControlledEditor() {
  const [value, setValue] = useState(typescriptCode)
  const [charCount, setCharCount] = useState(typescriptCode.length)

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <div
        style={{
          padding: "8px",
          backgroundColor: "#252526",
          color: "#808080",
          fontSize: "12px",
        }}
      >
        Characters: {charCount}
      </div>
      <div style={{ flex: 1 }}>
        <Editor
          value={value}
          language="typescript"
          theme="vs-dark"
          onChange={(newValue) => {
            if (newValue !== undefined) {
              setValue(newValue)
              setCharCount(newValue.length)
            }
          }}
        />
      </div>
    </div>
  )
}

export default {
  "Basic TypeScript": () => (
    <Editor
      defaultValue={typescriptCode}
      defaultLanguage="typescript"
      theme="vs-dark"
      height="100vh"
    />
  ),

  "Basic JSON": () => (
    <Editor
      defaultValue={jsonCode}
      defaultLanguage="json"
      theme="vs-dark"
      height="100vh"
    />
  ),

  "Light Theme": () => (
    <Editor
      defaultValue={typescriptCode}
      defaultLanguage="typescript"
      theme="light"
      height="100vh"
    />
  ),

  "Read Only": () => (
    <Editor
      defaultValue={typescriptCode}
      defaultLanguage="typescript"
      theme="vs-dark"
      readOnly
      height="100vh"
    />
  ),

  "No Minimap": () => (
    <Editor
      defaultValue={typescriptCode}
      defaultLanguage="typescript"
      theme="vs-dark"
      minimap={false}
      height="100vh"
    />
  ),

  "Large Font": () => (
    <Editor
      defaultValue={typescriptCode}
      defaultLanguage="typescript"
      theme="vs-dark"
      fontSize={20}
      height="100vh"
    />
  ),

  "Word Wrap Off": () => (
    <Editor
      defaultValue={`// This is a very long line that will not wrap because word wrap is turned off, so you will need to scroll horizontally to see the entire content of this comment which demonstrates the word wrap feature being disabled`}
      defaultLanguage="typescript"
      theme="vs-dark"
      wordWrap="off"
      height="100vh"
    />
  ),

  "Relative Line Numbers": () => (
    <Editor
      defaultValue={typescriptCode}
      defaultLanguage="typescript"
      theme="vs-dark"
      lineNumbers="relative"
      height="100vh"
    />
  ),

  "With useEditor Hook": () => <EditorWithHook />,

  "Multi-File Editor": () => <MultiFileEditor />,

  "Controlled Editor": () => <ControlledEditor />,

  "Highlight Line 5": () => (
    <Editor
      defaultValue={typescriptCode}
      defaultLanguage="typescript"
      theme="vs-dark"
      highlightLine={5}
      height="100vh"
    />
  ),

  "Custom Options": () => (
    <Editor
      defaultValue={typescriptCode}
      defaultLanguage="typescript"
      theme="vs-dark"
      options={{
        cursorStyle: "block",
        cursorBlinking: "expand",
        fontLigatures: true,
        renderLineHighlight: "gutter",
        scrollbar: {
          vertical: "visible",
          horizontal: "visible",
          verticalScrollbarSize: 14,
          horizontalScrollbarSize: 14,
        },
      }}
      height="100vh"
    />
  ),
}
