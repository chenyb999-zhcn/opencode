import { describe, expect, test } from "bun:test"
import { projectProgressTint } from "./project-progress-tint"

const OPENCODE_PROJECT_ID = "4b0ea68d7af9a6031a7ffda7ad66e0cb83315750"

const project = (icon?: { color?: string; url?: string; override?: string }, id?: string) => ({
  worktree: "/repo",
  expanded: true,
  icon,
  id,
})

describe("projectProgressTint", () => {
  test("tints the spinner with the project avatar's border token", () => {
    expect(projectProgressTint(project({ color: "blue" }))).toBe("var(--v2-avatar-border-blue)")
    expect(projectProgressTint(project({ color: "mint" }))).toBe("var(--v2-avatar-border-cyan)")
    expect(projectProgressTint(project({ color: "gray" }))).toBe("var(--v2-avatar-border-gray)")
  })

  test("leaves the tint alone for projects without a chosen avatar color", () => {
    expect(projectProgressTint(project())).toBeUndefined()
    expect(projectProgressTint(project({}))).toBeUndefined()
    expect(projectProgressTint(project({ color: "bogus" }))).toBe("var(--v2-avatar-border-gray)")
    expect(projectProgressTint(undefined)).toBeUndefined()
  })

  test("skips projects rendering an image avatar", () => {
    expect(projectProgressTint(project({ color: "blue", override: "https://example.com/icon.png" }))).toBeUndefined()
    expect(projectProgressTint(project({ url: "https://example.com/icon.png" }))).toBeUndefined()
    expect(projectProgressTint(project({ color: "blue" }, OPENCODE_PROJECT_ID))).toBeUndefined()
  })
})
