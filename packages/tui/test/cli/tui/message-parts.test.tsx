import { expect, test } from "bun:test"
import { testRender } from "@opentui/solid"
import { addDefaultParsers, CodeRenderable, type Renderable } from "@opentui/core"
import parsers from "../../../src/parsers-config"
import type { SessionMessageAssistant, SessionMessageAssistantReasoning } from "@opencode/client"
import { ConfigProvider } from "../../../src/config"
import { ThemeProvider } from "../../../src/context/theme"
import { ReasoningPart } from "../../../src/routes/session/message-parts"
import { createTimelineAnchors } from "../../../src/routes/session/anchors"
import { context } from "../../../src/routes/session/render-context"
import { emptyThemeSource } from "../../fixture/fixture"
import { TestTuiContexts } from "../../fixture/tui-environment"
import { createTuiResolvedConfig } from "../../fixture/tui-runtime"

const REASONING = [
  "Paragraph one. " + "word ".repeat(40),
  "Paragraph two. " + "word ".repeat(40),
  "Paragraph three. " + "word ".repeat(40),
  "Paragraph four. " + "word ".repeat(40),
  "Paragraph five. " + "word ".repeat(40),
  "Paragraph six. " + "word ".repeat(40),
].join("\n\n")

function findCode(node: Renderable): CodeRenderable | undefined {
  if (node instanceof CodeRenderable) return node
  for (const child of node.getChildren()) {
    const found = findCode(child)
    if (found) return found
  }
  return undefined
}

function mountReasoning(part: SessionMessageAssistantReasoning, message: SessionMessageAssistant) {
  const config = createTuiResolvedConfig({ animations: false })
  return testRender(
    () => (
      <TestTuiContexts>
        <ConfigProvider config={config}>
          <ThemeProvider mode="dark" source={emptyThemeSource}>
            <context.Provider
              value={{
                width: 40,
                terminal: { width: 40, height: 24 },
                sessionID: "fixture",
                anchors: createTimelineAnchors(),
                groupExpanded: () => false,
                setGroupExpanded: () => {},
                thinkingMode: () => "show",
                markdownMode: () => "rendered",
                groupExploration: () => true,
                legacyTurns: () => false,
                diffWrapMode: () => "word",
                models: () => [],
                messageIndex: () => undefined,
                config,
                mutatePending: async () => true,
                pendingDelivery: () => undefined,
              }}
            >
              <ReasoningPart last part={part} message={message} />
            </context.Provider>
          </ThemeProvider>
        </ConfigProvider>
      </TestTuiContexts>
    ),
    { width: 40, height: 24 },
  )
}

const message = (completed: boolean): SessionMessageAssistant => ({
  id: "a",
  type: "assistant",
  agent: "build",
  model: { providerID: "fixture", id: "fixture" },
  time: completed ? { created: 0, completed: 2 } : { created: 0 },
  content: [],
})

test("a completed thinking block is laid out at full height before highlighting resolves", async () => {
  addDefaultParsers(parsers.parsers)
  const app = await mountReasoning(
    { type: "reasoning", text: REASONING, time: { created: 0, completed: 2 } },
    message(true),
  )
  app.renderer.start()
  try {
    await app.renderOnce()
    const code = findCode(app.renderer.root)
    expect(code).toBeDefined()
    // A completed block is no longer a stream: its content must reach the text
    // buffer synchronously. While `streaming` is stuck on true, opentui's
    // CodeRenderable defers setText to the next highlight cycle, so the block
    // measures as one line and backfilled history under-compensates its
    // scroll offset (the viewport slides by a whole block once parsing lands).
    expect(code?.streaming).toBe(false)
    expect(code?.height).toBeGreaterThan(1)
  } finally {
    app.renderer.destroy()
  }
})

test("a still-streaming thinking block keeps the streaming buffer path", async () => {
  addDefaultParsers(parsers.parsers)
  const app = await mountReasoning({ type: "reasoning", text: REASONING, time: { created: 0 } }, message(false))
  app.renderer.start()
  try {
    await app.renderOnce()
    const code = findCode(app.renderer.root)
    expect(code).toBeDefined()
    expect(code?.streaming).toBe(true)
  } finally {
    app.renderer.destroy()
  }
})
