/**
 * Self-hosted MCP server using Express
 *
 * Run with: npx tsx server/mcp.ts
 */

import express from 'express'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { createDesignSystemMcpServer } from '../mcp/server-factory.js'
import { readFileSync } from 'fs'
import { join } from 'path'

// ── Load metadata ─────────────────────────────────────────────────────────────

function loadMetadata() {
	try {
		const raw = readFileSync(join(process.cwd(), 'metadata.json'), 'utf-8')
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

// ── Express App ───────────────────────────────────────────────────────────────

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.raw({ type: 'application/json' }))

// CORS preflight
app.options('/mcp', (_req, res) => {
	for (const [key, value] of Object.entries(corsHeaders)) {
		res.setHeader(key, value)
	}
	res.status(204).end()
})

// MCP endpoint
app.all('/mcp', async (req, res) => {
	for (const [key, value] of Object.entries(corsHeaders)) {
		res.setHeader(key, value)
	}

	const metadata = loadMetadata()
	if (!metadata) {
		res.status(500).json({
			error: 'metadata.json not found. Run npm run build-mcp-metadata first.',
		})
		return
	}

	// Convert Express request to Web Request
	const protocol = req.protocol
	const host = req.get('host')
	const url = `${protocol}://${host}${req.originalUrl}`

	const body = req.method === 'GET' ? null : req.body

	const headers = new Headers()
	for (const [key, value] of Object.entries(req.headers)) {
		if (value) {
			if (Array.isArray(value)) {
				for (const v of value) headers.append(key, v)
			} else {
				headers.set(key, value)
			}
		}
	}

	const request = new Request(url, {
		method: req.method,
		headers,
		body: body ? Buffer.from(body) : null,
	})

	const mcpServer = createDesignSystemMcpServer(metadata)
	const transport = new WebStandardStreamableHTTPServerTransport({
		sessionIdGenerator: undefined,
		enableJsonResponse: true,
	})

	await mcpServer.connect(transport)
	const response = await transport.handleRequest(request)

	res.status(response.status)
	response.headers.forEach((value, key) => {
		res.setHeader(key, value)
	})

	const responseBody = await response.arrayBuffer()
	res.send(Buffer.from(responseBody))
})

app.listen(PORT, () => {
	console.log(`MCP server running on http://localhost:${PORT}/mcp`)
})
