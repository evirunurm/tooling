/**
 * Permission Gate Extension
 *
 * Prompts for confirmation before every bash, edit, or write tool call.
 * No "allow all" option — each action is confirmed individually.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
	pi.on("tool_call", async (event, ctx) => {
		const toolName = event.toolName;

		// Only gate bash, edit, and write
		if (!["bash", "edit", "write"].includes(toolName)) {
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

		const allowed = await ctx.ui.confirm(
			`Permission required: ${toolName}`,
			`${details}\n\nAllow this action?`,
		);

		if (!allowed) {
			return { block: true, reason: "Blocked by user" };
		}

		return undefined;
	});
}
