# Permission Gate Extension

A permission mode extension that intercepts and guards `bash`, `edit`, and `write` tool calls with confirmation prompts.

## Modes

| Mode | Color | Behavior |
|------|-------|----------|
| **auto** | ♥ | Allow all actions silently. Only prompt for commands that match the risky patterns list. |
| **manual** | ♡ | Prompt for confirmation before every `bash`, `edit`, and `write` call. |

Toggle modes at runtime:
- `/gate auto` — switch to auto mode
- `/gate manual` — switch to manual mode
- `/gate` or `/gate status` — show current mode and risky patterns

## Configuration

Create `.pi/permission-gate.json` in your project root (where you run `pi`):

> The extension is global, but the config is **project-local**. It loads from `cwd/.pi/permission-gate.json` — wherever you run `pi` from. Each project can have its own config.

```json
{
  "mode": "auto",
  "risky": {
    "bash": ["rm -rf", "sudo", "mkfs", "dd if="],
    "edit": ["\\.env$", "\\.secret$"],
    "write": ["\\.env$", "\\.secret$"]
  }
}
```

### Config keys

| Key | Type | Description |
|-----|------|-------------|
| `mode` | `"auto" \| "manual"` | Default mode on startup. |
| `risky` | `object` | Per-tool pattern lists. Only used in **auto** mode. |
| `risky.bash` | `string[]` | Substrings or regex patterns. If a command matches any, a prompt is shown. |
| `risky.edit` | `string[]` | File path patterns. If the edited file matches any, a prompt is shown. |
| `risky.write` | `string[]` | File path patterns. If the written file matches any, a prompt is shown. |

### Pattern syntax

Each entry in a risky list is a **case-insensitive pattern** matched against:
- `bash` — the full command string
- `edit` / `write` — the file path

Patterns are tried as **regex first**, then fall back to plain substring matching.

Examples:
- `"rm -rf"` — simple substring (matches any command containing `rm -rf`)
- `"sudo"` — catches any command using `sudo`
- `"\\.env$"` — regex matching paths ending in `.env`
- `"^/etc/"` — regex matching paths under `/etc/`

### Default risky patterns

```json
{
  "bash": [
    "rm -rf", "rm -r", "sudo", "mkfs", "dd if=",
    "mkfs.ext4", "mkfs.ntfs", ":(){:|:&};:",
    "chmod -R 777 /", "chown -R", "format ", "> /dev/sd"
  ],
  "edit": [],
  "write": []
}
```

## Config location

Because the extension loads from the working directory, the config file is searched per project:

```
project-a/
  .pi/permission-gate.json   ← used when running pi from project-a

project-b/
  .pi/permission-gate.json   ← used when running pi from project-b
```

No central config file exists — each project has its own gate settings.

## UI display

The current gate mode is shown:
- **In the footer** via `setStatus` (as a status indicator)
- **As a widget** below the editor area (persistent, always visible)

The widget shows: `♥ mode: auto` or `♡ mode: manual`

## Warp notifications

When running in Warp terminal, the extension sends OSC 777 notifications so you get a native popup when the agent is waiting for a permission decision.
