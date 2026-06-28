import type { Metadata } from '../../scripts/build-mcp-metadata'
import type { ToolResult, ComponentIdInput } from '../types.js'
import { ComponentIdSchema } from '../types.js'

export const name = 'get-component-docs'

export const description = 'Returns the MDX documentation for a specific component'

export const schema = ComponentIdSchema

function componentError(componentId: string): string {
	return `Component '${componentId}' not found. Call list-components to see available options.`
}

export function handler(
	input: ComponentIdInput,
	metadata: Metadata
): ToolResult {
	const { componentId } = input
	const comp = metadata.components[componentId.toLowerCase()]

	if (!comp) {
		return {
			isError: true,
			content: [
				{
					type: 'text' as const,
					text: componentError(componentId),
				},
			],
		}
	}

	return {
		content: [
			{
				type: 'text' as const,
				text: JSON.stringify({
					version: metadata.version,
					id: componentId,
					mdx: comp.mdx,
				}),
			},
		],
	}
}
