# Tool vault

Personal collection of [Pi](https://github.com/earendil-works/pi-coding-agent) extensions and agent skills. I clone or symlink this into projects when I want my setup available.

## What's here

### `pi/extensions/permission-gate.ts`

A Pi extension that confirms every `bash`, `edit`, and `write` tool call before it runs. No "allow all" option — each action is confirmed individually. Useful when you want to catch destructive operations before they happen.

- **Auto-discovered** by Pi when this repo is the working directory (project-local)
- **Global version** also lives at `~/.pi/agent/extensions/permission-gate.ts` for non-project use

### `skills/`

Agent skills for Pi's `/skill:` command system:

| Skill | Purpose |
|-------|---------|
| `planning` | Analyze a codebase and produce a structured implementation plan (`plan.md`) for a ticket or feature. Splits work into independently shippable phases. |
| `digest` | Generates a visual HTML digest (`digest.html`) from a `plan.md` — a concept-level overview of the problem, approach, and phases, without code or file lists. |

Both are invoked via `/skill:name` or trigger words (e.g. `/planning`, `/digest`).

## How I use this

```bash
# Clone into a project
 git clone https://github.com/evirunurm/tooling.git
 cd tooling

# Or symlink skills globally
ln -s $(pwd)/skills/* ~/.pi/agent/skills/
```

Pi auto-discovers:
- `pi/extensions/` → project-local extensions
- `skills/` → project-local skills

## Scope

This is personal tooling. Not a product, not a framework. Fork it if you want, but it's built for my workflow and may not generalize cleanly.
