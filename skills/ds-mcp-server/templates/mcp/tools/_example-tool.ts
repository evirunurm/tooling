/**
 * Example tool template - copy this file to create a new tool.
 *
 * To add this tool:
 * 1. Rename this file (e.g., search-components.ts)
 * 2. Update the exports below
 * 3. Add `export * as searchComponents from './search-components.js'` to index.ts
 */

import { z } from 'zod'
import type { Metadata } from '../../scripts/build-mcp-metadata'
import type { ToolResult } from '../types.js'

// ── Tool definition ───────────────────────────────────────────────────────────

export const name = 'example-tool'

export const description = 'Brief description of what this tool does'

// Schema is optional - omit it if your tool takes no input
export const schema = z.object({
	query: z.string().describe('Description of this parameter'),
	limit: z
		.number()
		.optional()
		.describe('Optional parameter with description'),
})

export type Input = z.infer<typeof schema>

// ── Handler ───────────────────────────────────────────────────────────────────

export function handler(input: Input, metadata: Metadata): ToolResult {
	// Your tool logic here
	// input contains the validated parameters
	// metadata contains the full design system metadata

	const result = {
		version: metadata.version,
		query: input.query,
		// ... your results
	}

	return {
		content: [
			{
				type: 'text' as const,
				text: JSON.stringify(result),
			},
		],
	}
}

// ── Error handling example ────────────────────────────────────────────────────

function handlerWithErrors(input: Input, metadata: Metadata): ToolResult {
	// Example: handle not-found cases
	const component = metadata.components[input.query.toLowerCase()]

	if (!component) {
		// Return isError: true for expected error cases
		return {
			isError: true,
			content: [
				{
					type: 'text' as const,
					text: `Component '${input.query}' not found.`,
				},
			],
		}
	}

	// Return normal response for success cases
	return {
		content: [
			{
				type: 'text' as const,
				text: JSON.stringify({
					version: metadata.version,
					component: input.query,
					props: component.props,
				}),
			},
		],
	}
}
