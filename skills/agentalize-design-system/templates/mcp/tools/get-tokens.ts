import type { Metadata } from '../../scripts/build-mcp-metadata'
import type { ToolResult, TokenCategoryInput } from '../types.js'
import { TokenCategorySchema } from '../types.js'

export const name = 'get-tokens'

export const description = 'Returns design tokens for a specific category (color, spacing, or typography)'

export const schema = TokenCategorySchema

export function handler(
	input: TokenCategoryInput,
	metadata: Metadata
): ToolResult {
	const { category } = input
	const tokens = metadata.tokens[category]

	if (!tokens) {
		return {
			isError: true,
			content: [
				{
					type: 'text' as const,
					text: `Invalid category '${category}'. Valid categories are: color, spacing, typography.`,
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
					category,
					tokens,
				}),
			},
		],
	}
}
