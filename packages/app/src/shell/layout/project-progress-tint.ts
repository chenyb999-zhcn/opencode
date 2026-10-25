import type { LocalProject } from "@/shell/state/layout"
import { getProjectAvatarSource, getProjectAvatarVariant } from "@opencode/ui/project-avatar-core"

// The progress spinner is tinted with currentColor, so a project with a chosen avatar color draws
// its spinner in the avatar's border token, which stays legible in both themes. Projects rendering
// an image avatar — custom icons and the OpenCode project's favicon — keep the neutral tint.
export function projectProgressTint(project?: LocalProject) {
  const color = project?.icon?.color
  if (!color) return
  if (getProjectAvatarSource(project.id, project.icon)) return
  return `var(--v2-avatar-border-${getProjectAvatarVariant(color)})`
}
