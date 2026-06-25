import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { createDesignSystemMcpServer } from '../../mcp/server-factory.js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// ── Load metadata ─────────────────────────────────────────────────────────────

function loadMetadata() {
	try {
		const dir = dirname(fileURLToPath(import.meta.url))
		const raw = readFileSync(join(dir, 'metadata.json'), 'utf-8')
		return JSON.parse(raw)
	} catch {
		return null
	}
}

// ── CORS headers ──────────────────────────────────────────────────────────────

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, DELETE',
	'Access-Control-Allow-Headers': 'Content-Type, Mcp-Session-Id',
}

// ── Handler ───────────────────────────────────────────────────────────────────

export default async (req: Request): Promise<Response> => {
	if (req.method === 'OPTIONS') {
		return new Response(null, { status: 204, headers: corsHeaders })
	}

	const metadata = loadMetadata()
	if (!metadata) {
		return new Response(
			JSON.stringify({
				error: 'metadata.json not found. Run npm run build-mcp-metadata first.',
			}),
			{
				status: 500,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			}
		)
	}

	const mcpServer = createDesignSystemMcpServer(metadata)
	const transport = new WebStandardStreamableHTTPServerTransport({
		sessionIdGenerator: undefined,
		enableJsonResponse: true,
	})

	await mcpServer.connect(transport)
	const response = await transport.handleRequest(req)

	const newHeaders = new Headers(response.headers)
	for (const [key, value] of Object.entries(corsHeaders)) {
		newHeaders.set(key, value)
	}

	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers: newHeaders,
	})
}
