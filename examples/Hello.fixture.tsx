import { Editor } from "../src/components/Editor"

const sampleCode = `import { Circuit, useResistor, useCapacitor } from "tscircuit"

export default function MyCircuit() {
  useResistor("R1", { resistance: "10kohm", footprint: "0402" })
  useCapacitor("C1", { capacitance: "100nF", footprint: "0603" })

  return (
    <Circuit>
      <resistor name="R1" resistance="10kohm" footprint="0402" />
      <capacitor name="C1" capacitance="100nF" footprint="0603" />
      <trace from=".R1 > .pin1" to=".C1 > .pos" />
    </Circuit>
  )
}`

export default () => (
  <Editor
    defaultValue={sampleCode}
    defaultLanguage="typescript"
    theme="vs-dark"
    height="100vh"
    fontSize={14}
    onChange={(value) => console.log("Changed:", value?.slice(0, 50))}
    onSave={(value) => console.log("Saved!")}
  />
)
