import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { createDesignSystemMcpServer } from '../../mcp/server-factory.js'
import { readFileSync } from 'fs'
import { join } from 'path'
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

// ── Load metadata ─────────────────────────────────────────────────────────────

function loadMetadata() {
	try {
		const raw = readFileSync(join(__dirname, 'metadata.json'), 'utf-8')
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

// ── AWS Lambda Handler ────────────────────────────────────────────────────────

export async function handler(
	event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
	if (event.httpMethod === 'OPTIONS') {
		return {
			statusCode: 204,
			headers: corsHeaders,
			body: '',
		}
	}

	const metadata = loadMetadata()
	if (!metadata) {
		return {
			statusCode: 500,
			headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			body: JSON.stringify({
				error: 'metadata.json not found. Run npm run build-mcp-metadata first.',
			}),
		}
	}

	// Convert API Gateway event to Web Request
	const url = `https://${event.headers.Host}${event.path}`
	const body = event.body
		? Buffer.from(event.body, event.isBase64Encoded ? 'base64' : 'utf8')
		: null

	const headers = new Headers()
	for (const [key, value] of Object.entries(event.headers)) {
		if (value) headers.set(key, value)
	}

	const request = new Request(url, {
		method: event.httpMethod,
		headers,
		body,
	})

	const mcpServer = createDesignSystemMcpServer(metadata)
	const transport = new WebStandardStreamableHTTPServerTransport({
		sessionIdGenerator: undefined,
		enableJsonResponse: true,
	})

	await mcpServer.connect(transport)
	const response = await transport.handleRequest(request)

	const responseHeaders: Record<string, string> = {}
	response.headers.forEach((value, key) => {
		responseHeaders[key] = value
	})
	Object.assign(responseHeaders, corsHeaders)

	const responseBody = await response.arrayBuffer()

	return {
		statusCode: response.status,
		headers: responseHeaders,
		body: Buffer.from(responseBody).toString('base64'),
		isBase64Encoded: true,
	}
}
