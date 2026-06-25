import type { Metadata } from '../../scripts/build-mcp-metadata'
import type { ToolResult } from '../types.js'

export const name = 'list-components'

export const description = 'Returns all available component IDs in the design system'

export const schema = undefined

export function handler(_input: undefined, metadata: Metadata): ToolResult {
	return {
		content: [
			{
				type: 'text' as const,
				text: JSON.stringify({
					version: metadata.version,
					components: Object.keys(metadata.components),
				}),
			},
		],
	}
}
