import { z } from 'zod'
import type { Metadata } from '../scripts/build-mcp-metadata'

export type ToolResult = {
	content: Array<{ type: 'text'; text: string }>
	isError?: boolean
}

export const ComponentIdSchema = z.object({
	componentId: z.string().describe('The component ID (e.g. "button")'),
})

export const TokenCategorySchema = z.object({
	category: z
		.enum(['color', 'spacing', 'typography'])
		.describe('The token category: color, spacing or typography'),
})

export type ComponentIdInput = z.infer<typeof ComponentIdSchema>
export type TokenCategoryInput = z.infer<typeof TokenCategorySchema>

export interface ToolConfig {
	name: string
	description: string
	schema: typeof ComponentIdSchema | typeof TokenCategorySchema | undefined
	handler: (
		input: ComponentIdInput | TokenCategoryInput | undefined,
		metadata: Metadata
	) => ToolResult
}
