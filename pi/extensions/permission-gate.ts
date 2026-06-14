/**
 * Permission Gate Extension
 *
 * Supports two modes:
 *   - "manual" — prompts for confirmation before every bash/edit/write call
 *   - "auto"  — allows all calls silently; prompts only for commands matching
 *               patterns in the risky list
 *
 * Risky list is loaded from `.pi/permission-gate.json` in the project root:
 *
 *   {
 *     "mode": "auto",
 *     "risky": {
 *       "bash": ["rm -rf", "sudo", "mkfs", "dd if="],
 *       "edit": ["\\.env$", "\\.secret$"],
 *       "write": ["\\.env$", "\\.secret$"]
 *     }
 *   }
 *
 * Use `/gate` to toggle between modes at runtime.
 * Use `/gate status` to see current mode and risky patterns.
 *
 * Sends Warp terminal notifications via OSC 777 so the user knows
 * the agent is waiting for input.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const GATED_TOOLS = ["bash", "edit", "write"] as const;
type GatedTool = (typeof GATED_TOOLS)[number];

const CONFIG_FILE = "permission-gate.json";
const CONFIG_DIR = ".pi";

interface GateConfig {
	mode: "auto" | "manual";
	risky: Partial<Record<GatedTool, string[]>>;
}

const DEFAULT_CONFIG: GateConfig = {
	mode: "auto",
	risky: {
		bash: ["rm -rf", "rm -r", "sudo", "mkfs", "dd if=", "mkfs.ext4", "mkfs.ntfs", ":(){:|:&};:", "chmod -R 777 /", "chown -R", "format ", "> /dev/sd"],
		edit: [],
		write: [],
	},
};

const MAX_FIELD_LENGTH = 200;
const MAX_PREVIEW_LENGTH = 120;

function truncate(str: string, maxLen: number = MAX_FIELD_LENGTH): string {
	if (!str || str.length <= maxLen) return str || "";
	return str.slice(0, maxLen - 3) + "...";
}

function buildPreview(toolName: string, input: Record<string, unknown>): string {
	let raw: string;
	if (typeof input.command === "string") {
		raw = input.command;
	} else if (typeof input.path === "string") {
		raw = input.path;
	} else {
		raw = JSON.stringify(input).slice(0, MAX_PREVIEW_LENGTH);
	}
	return truncate(raw, MAX_PREVIEW_LENGTH);
}

function isInWarp(): boolean {
	return !!process.env.WARP_HONOR_PS1;
}

function sendWarpNotification(payload: Record<string, unknown>): void {
	const seq = `\x1b]777;notify;warp://cli-agent;${JSON.stringify(payload)}\x07`;
	try {
		if (process.platform === "win32") {
			process.stdout.write(seq);
		} else {
			writeFileSync("/dev/tty", seq);
		}
	} catch {
		// Silently ignore if terminal is not available
	}
}

function matchesAnyPattern(value: string, patterns: string[]): boolean {
	for (const pattern of patterns) {
		// Try as regex first; fall back to plain-string includes
		try {
			const regex = new RegExp(pattern, "i");
			if (regex.test(value)) return true;
		} catch {
			// Not a valid regex — use case-insensitive substring match
			if (value.toLowerCase().includes(pattern.toLowerCase())) return true;
		}
	}
	return false;
}

function loadConfig(cwd: string): GateConfig {
	const configPath = join(cwd, CONFIG_DIR, CONFIG_FILE);
	if (!existsSync(configPath)) return { ...DEFAULT_CONFIG };

	try {
		const raw = readFileSync(configPath, "utf8");
		const parsed = JSON.parse(raw);
		// Support legacy "deny" key as alias for "risky"
		const patterns = parsed.risky ?? parsed.deny;
		return {
			mode: parsed.mode === "manual" ? "manual" : "auto",
			risky: {
				bash: Array.isArray(patterns?.bash) ? patterns.bash : DEFAULT_CONFIG.risky.bash!,
				edit: Array.isArray(patterns?.edit) ? patterns.edit : [],
				write: Array.isArray(patterns?.write) ? patterns.write : [],
			},
		};
	} catch {
		return { ...DEFAULT_CONFIG };
	}
}

function saveConfig(cwd: string, config: GateConfig): void {
	const configPath = join(cwd, CONFIG_DIR, CONFIG_FILE);
	try {
		writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n", "utf8");
	} catch {
		// Best-effort save
	}
}

function buildPromptSubmitPayload(
	ctx: { cwd: string; sessionManager: { getSessionFile(): string | undefined } },
	query: string,
): Record<string, unknown> {
	const sessionFile = ctx.sessionManager.getSessionFile();
	const project = ctx.cwd ? ctx.cwd.split("/").pop() ?? "" : "";

	return {
		v: 1,
		agent: "pi",
		event: "prompt_submit",
		session_id: sessionFile ?? "",
		cwd: ctx.cwd,
		project,
		query: truncate(query),
	};
}

function buildPermissionRequestPayload(
	ctx: { cwd: string; sessionManager: {getSessionFile(): string | undefined } },
	toolName: string,
	input: Record<string, unknown>,
): Record<string, unknown> {
	const preview = buildPreview(toolName, input);
	const sessionFile = ctx.sessionManager.getSessionFile();
	const project = ctx.cwd ? ctx.cwd.split("/").pop() ?? "" : "";

	return {
		v: 1,
		agent: "pi",
		event: "permission_request",
		session_id: sessionFile ?? "",
		cwd: ctx.cwd,
		project,
		summary: `Wants to run ${toolName}: ${preview}`,
		tool_name: toolName,
		tool_input: input,
	};
}

/** Build the gate-mode label for the current config. */
function modeLabel(config: GateConfig): string {
	return config.mode === "auto"
		? "♥ auto (prompt only for risky patterns)"
		: "♡ manual (prompt for every action)";
}

export default function (pi: ExtensionAPI) {
	let cachedCtx: Parameters<typeof buildPermissionRequestPayload>[0] | null = null;
	let config: GateConfig | null = null;

	/** Update the persistent widget (primary) and footer status (secondary). */
	function refreshDisplay(ctx: { ui: { setStatus: typeof ExtensionAPI.prototype.setStatus; setWidget: typeof ExtensionAPI.prototype.setWidget } }) {
		if (!config) return;
		const label = modeLabel(config);
		const icon = config.mode === "auto" ? "♥" : "♡";
		const short = config.mode === "manual" ? "manual" : "auto";
		// Persistent widget — always visible
		ctx.ui.setWidget("mode", [`${icon} mode: ${short}`], { placement: "belowEditor" });
		// Also try the footer status
		ctx.ui.setStatus("mode", label);
	}

	pi.on("session_start", async (_event, ctx) => {
		cachedCtx = ctx;
		config = loadConfig(ctx.cwd);
		const label = modeLabel(config);
		ctx.ui.notify(`Permission mode: ${label}`, "info");
		refreshDisplay(ctx);
	});

	pi.on("tool_call", async (event, ctx) => {
		const toolName = event.toolName as GatedTool;

		// Only gate bash, edit, and write
		if (!(GATED_TOOLS as readonly string[]).includes(toolName)) {
			return undefined;
		}

		// Reload config each time so edits to the file are picked up
		config = loadConfig(ctx.cwd);

		// Update display in case mode changed
		refreshDisplay(ctx);

		// In non-interactive mode (e.g. pi -p), block by default
		if (!ctx.hasUI) {
			return { block: true, reason: `${toolName} blocked (no UI for confirmation)` };
		}

		// Resolve the value to check against risky patterns
		const value = toolName === "bash"
			? String(event.input.command ?? "")
			: String(event.input.path ?? "");

		const riskyPatterns = config.risky[toolName] ?? [];
		const isRisky = matchesAnyPattern(value, riskyPatterns);

		// ── Auto mode: allow silently if not risky, prompt if risky ──
		if (config.mode === "auto" && !isRisky) {
			return undefined;
		}

		// ── Prompt for confirmation (manual mode always, auto mode for risky) ──
		let details = "";
		if (toolName === "bash") {
			details = `Command: ${event.input.command}`;
		} else {
			details = `File: ${event.input.path}`;
		}

		if (isRisky) {
			details += "\n\n⚠️  This matches a risky pattern — please confirm.";
		}

		// Notify Warp that the agent needs a permission decision
		if (isInWarp() && cachedCtx) {
			const payload = buildPermissionRequestPayload(cachedCtx, toolName, event.input as Record<string, unknown>);
			sendWarpNotification(payload);
		}

		const allowed = await ctx.ui.confirm(
			`Permission required: ${toolName}`,
			`${details}\n\nAllow this action?`,
		);

		// Notify Warp that the permission request was resolved
		if (isInWarp() && cachedCtx) {
			sendWarpNotification(buildPromptSubmitPayload(cachedCtx, `Permission ${allowed ? "allowed" : "denied"}: ${toolName}`));
		}

		if (!allowed) {
			return { block: true, reason: "Blocked by user" };
		}

		return undefined;
	});

	// ── /gate command ────────────────────────────────────────────────
	pi.registerCommand("gate", {
		description: "Toggle permission gate mode or show status (auto/manual)",
		handler: async (args, ctx) => {
			const subcommand = (args ?? "").trim().toLowerCase();

			config = loadConfig(ctx.cwd);

			if (subcommand === "status" || subcommand === "") {
				const label = config.mode === "auto" ? "♥ auto" : "♡ manual";
				const riskyList = config.risky;
				let msg = `Permission mode: ${label}\n`;

				for (const tool of GATED_TOOLS) {
					const patterns = riskyList[tool] ?? [];
					if (patterns.length > 0) {
						msg += `\n  ${tool} risky patterns:\n    ${patterns.map(p => `• ${p}`).join("\n    ")}`;
					} else {
						msg += `\n  ${tool}: no risky patterns (all allowed silently)`;
					}
				}

				msg += `\n\nConfig file: .pi/${CONFIG_FILE}`;
				ctx.ui.notify(msg, "info");
				return;
			}

			if (subcommand === "auto") {
				config.mode = "auto";
				saveConfig(ctx.cwd, config);
				refreshDisplay(ctx);
				ctx.ui.notify("Permission mode: switched to ♡ auto — prompt only for risky patterns", "info");
				return;
			}

			if (subcommand === "manual") {
				config.mode = "manual";
				saveConfig(ctx.cwd, config);
				refreshDisplay(ctx);
				ctx.ui.notify("Permission mode: switched to ♥ manual — prompt for every action", "info");
				return;
			}

			ctx.ui.notify("Usage: /gate [auto|manual|status]", "warning");
		},
	});
}