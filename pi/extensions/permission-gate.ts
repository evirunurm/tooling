/**
 * Permission Gate Extension
 *
 * Prompts for confirmation before every bash, edit, or write tool call.
 * No "allow all" option — each action is confirmed individually.
 * Sends Warp terminal notifications via OSC 777 so the user knows
 * the agent is waiting for input.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { writeFileSync } from "node:fs";

const GATED_TOOLS = ["bash", "edit", "write"] as const;

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
			// Windows has no /dev/tty — write directly to stdout which is
			// connected to the Warp terminal emulator
			process.stdout.write(seq);
		} else {
			writeFileSync("/dev/tty", seq);
		}
	} catch {
		// Silently ignore if terminal is not available
	}
}

export default function (pi: ExtensionAPI) {
	let cachedCtx: Parameters<typeof buildPermissionRequestPayload>[0] | null = null;

	pi.on("session_start", async (_event, ctx) => {
		cachedCtx = ctx;
	});

	pi.on("tool_call", async (event, ctx) => {
		const toolName = event.toolName;

		// Only gate bash, edit, and write
		if (!(GATED_TOOLS as readonly string[]).includes(toolName)) {
			return undefined;
		}

		// In non-interactive mode (e.g. pi -p), block by default
		if (!ctx.hasUI) {
			return { block: true, reason: `${toolName} blocked (no UI for confirmation)` };
		}

		// Build details string for the confirm dialog
		let details = "";
		if (toolName === "bash") {
			details = `Command: ${event.input.command}`;
		} else {
			details = `File: ${event.input.path}`;
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
		// Send prompt_submit to transition from "Blocked" back to "In progress"
		if (isInWarp() && cachedCtx) {
			sendWarpNotification(buildPromptSubmitPayload(cachedCtx, `Permission ${allowed ? "allowed" : "denied"}: ${toolName}`));
		}

		if (!allowed) {
			return { block: true, reason: "Blocked by user" };
		}

		return undefined;
	});
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
	ctx: { cwd: string; sessionManager: { getSessionFile(): string | undefined } },
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
