import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { Metadata } from '../scripts/build-mcp-metadata'
import * as tools from './tools/index.js'
import type { ComponentIdInput, TokenCategoryInput } from './types.js'

/**
 * Creates an MCP server for the design system.
 *
 * This factory is used by the deployment entry point. It registers all tools
 * from the tools/ directory and wires them up to the metadata.
 */
export function createDesignSystemMcpServer(metadata: Metadata): McpServer {
	const server = new McpServer({
		name: 'design-system-mcp',
		version: metadata.version,
	})

	// Register all tools from the tools directory
	for (const [key, toolModule] of Object.entries(tools)) {
		const tool = toolModule as {
			name: string
			description: string
			schema?: import('zod').ZodTypeAny
			handler: (input: unknown, metadata: Metadata) => import('./types.js').ToolResult
		}

		if (tool.schema) {
			server.registerTool(
				tool.name,
				{
					description: tool.description,
					inputSchema: tool.schema as any,
				},
				(input: ComponentIdInput | TokenCategoryInput) =>
					tool.handler(input, metadata)
			)
		} else {
			server.tool(tool.name, tool.description, () =>
				tool.handler(undefined, metadata)
			)
		}
	}

	return server
}
