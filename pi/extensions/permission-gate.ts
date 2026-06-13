/**
 * Permission Gate Extension
 *
 * Prompts for confirmation before bash, edit, or write tool calls.
 * "Allow all for this session" option using confirm dialogs.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
	let allowAllForSession = false;
	let hasPromptedForAllowAll = false;

	// Reset on every new session so each session starts fresh
	pi.on("session_start", async () => {
		allowAllForSession = false;
		hasPromptedForAllowAll = false;
	});

	pi.on("tool_call", async (event, ctx) => {
		const toolName = event.toolName;

		// Only gate bash, edit, and write
		if (!["bash", "edit", "write"].includes(toolName)) {
			return undefined;
		}

		// If user already allowed all for this session, skip
		if (allowAllForSession) {
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

		// Step 1: confirm this individual action
		const allowed = await ctx.ui.confirm(
			`Permission required: ${toolName}`,
			`${details}\n\nAllow this action?`,
		);

		if (!allowed) {
			return { block: true, reason: "Blocked by user" };
		}

		// Step 2: on the first allowed action, ask if they want to allow all for the session
		if (!hasPromptedForAllowAll) {
			const allowAll = await ctx.ui.confirm(
				"Permission required",
				"Allow all remaining actions for this session?",
			);
			if (allowAll) {
				allowAllForSession = true;
				ctx.ui.notify("Permission gate: allowing all for this session", "info");
			}
			hasPromptedForAllowAll = true;
		}

		return undefined;
	});
}
