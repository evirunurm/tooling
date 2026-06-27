import type { Metadata } from '../../scripts/build-mcp-metadata'
import type { ToolResult } from '../types.js'

export const name = 'list-components'

export const description = 'Returns all available component IDs with their descriptions'

export const schema = undefined

export function handler(_input: undefined, metadata: Metadata): ToolResult {
	const components = Object.entries(metadata.components).map(([id, data]) => ({
		id,
		description: data.description,
	}))

	return {
		content: [
			{
				type: 'text' as const,
				text: JSON.stringify({
					version: metadata.version,
					components,
				}),
			},
		],
	}
}
