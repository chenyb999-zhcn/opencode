import { expect, test } from "bun:test"
import { createRequire } from "node:module"
import { createComponent } from "solid-js"
import { render } from "solid-js/web"

// Compile the real Solid JSX with the same presets as Vite (see the model-selection fixture) so the
// tab avatar component under test mounts unchanged.
const require = createRequire(import.meta.url)

const solid = createRequire(require.resolve("vite-plugin-solid"))

const { transformSync } = solid("@babel/core")

Bun.plugin({
  name: "progress-tint-solid",
  setup(build) {
    build.onLoad({ filter: /\.tsx$/ }, async (args) => ({
      contents: transformSync(await Bun.file(args.path).text(), {
        filename: args.path,
        presets: [solid.resolve("babel-preset-solid"), solid.resolve("@babel/preset-typescript")],
      }).code,
      loader: "js",
    }))
  },
})

const { SessionTabAvatarView } = await import("@/shell/layout/session-tab-avatar")

const spinner = '[data-component="session-progress-indicator-v2"]'
const avatar = '[data-component="project-avatar-v2"]'
const OPENCODE_PROJECT_ID = "4b0ea68d7af9a6031a7ffda7ad66e0cb83315750"

const project = (icon?: { color?: string; url?: string; override?: string }, id?: string) => ({
  worktree: "/repo",
  expanded: true,
  icon,
  id,
})

function view(props: Record<string, unknown>) {
  const container = document.createElement("div")
  render(() => createComponent(SessionTabAvatarView, props), container)
  return container
}

const spinnerColor = (container: HTMLElement) => {
  const element = container.querySelector(spinner)
  expect(element).toBeTruthy()
  return element!.getAttribute("style") ?? ""
}

test("a running session tab tints the progress spinner with the project avatar color", () => {
  const container = view({ directory: "/repo", unread: false, loading: true, project: project({ color: "blue" }) })
  expect(spinnerColor(container)).toMatch(/color:\s*var\(--v2-avatar-border-blue\)/)
})

test("projects without a chosen avatar color keep the neutral spinner", () => {
  const container = view({ directory: "/repo", unread: false, loading: true, project: project() })
  expect(spinnerColor(container)).not.toContain("--v2-avatar-border")
})

test("projects rendering an image avatar skip the tint", () => {
  const custom = view({
    directory: "/repo",
    unread: false,
    loading: true,
    project: project({ color: "blue", override: "https://example.com/icon.png" }),
  })
  expect(spinnerColor(custom)).not.toContain("--v2-avatar-border")

  const opencode = view({
    directory: "/repo",
    unread: false,
    loading: true,
    project: project({ color: "blue" }, OPENCODE_PROJECT_ID),
  })
  expect(spinnerColor(opencode)).not.toContain("--v2-avatar-border")
})

test("idle tabs still render the project avatar instead of a spinner", () => {
  const container = view({ directory: "/repo", unread: false, loading: false, project: project({ color: "blue" }) })
  expect(container.querySelector(spinner)).toBeNull()
  expect(container.querySelector(avatar)).toBeTruthy()
})
