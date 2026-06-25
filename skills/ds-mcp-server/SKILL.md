---
name: ds-mcp-server
disable-model-invocation: true
description: |
  Set up and manage an MCP (Model Context Protocol) server for React design systems with Storybook.
  
  Use this skill when:
  - The user wants to add MCP capabilities to their design system repository
  - They need to expose components, props, stories, and design tokens as MCP tools
  - They want AI assistants to query their design system programmatically
  - Setting up a new MCP server from scratch, adding tools to an existing one, or documenting the setup
  
  The skill scaffolds the complete infrastructure including TypeScript-based metadata extraction,
  tool definitions in separate files, and deployment-ready serverless functions.
---

# Design System MCP Server

This skill helps users build an MCP (Model Context Protocol) server that exposes their React + Storybook design system to AI assistants.

## When to Use This Skill

Trigger this skill when the user wants to:
- Add MCP capabilities to their design system repository
- Expose components, props, stories, and design tokens as MCP tools
- Set up a new MCP server from scratch
- Add new tools to an existing MCP server
- Document their MCP setup

## How to Use This Skill

### 1. Determine the User's Goal

Ask what they want to do:
- **"Set up a new MCP server"** → Go to scaffolding section
- **"Add a new tool"** → Go to tool creation section
- **"Document my MCP setup"** → Generate documentation from SKILL.md body

### 2. Scaffolding a New MCP Server

When setting up from scratch:

**Step 1: Check prerequisites**
- Verify they have a React + Storybook design system
- Confirm their file structure matches: `src/components/<Name>/<Name>.tsx`, `_stories/`, `_docs/`
- Check package.json for TypeScript

**Step 2: Ask about deployment target**
Ask: "Where do you want to deploy the MCP server?"
- Netlify Functions
- Vercel Edge Functions
- AWS Lambda
- Cloudflare Workers
- Self-hosted (Express)

**Step 3: Copy template files**
Use the templates in this skill's `templates/` directory:

| Template | Destination |
|----------|-------------|
| `templates/scripts/build-mcp-metadata.ts` | `scripts/build-mcp-metadata.ts` |
| `templates/mcp/types.ts` | `mcp/types.ts` |
| `templates/mcp/server-factory.ts` | `mcp/server-factory.ts` |
| `templates/mcp/tools/index.ts` | `mcp/tools/index.ts` |
| `templates/mcp/tools/*.ts` | `mcp/tools/*.ts` |
| `templates/<platform>/*` | Platform-specific entry point |
| `templates/config/package-additions.json` | Merge into package.json |

**Step 4: Update package.json**
Add the scripts and dependencies from `templates/config/package-additions.json`

**Step 5: Platform-specific config**
- Netlify: Add `templates/config/netlify.toml` content
- Vercel: No config needed (uses `api/` directory)
- AWS: Add `@types/aws-lambda` dev dependency

**Step 6: Build and verify**
Have them run `npm run build-mcp-metadata` and verify `metadata.json` is created

### 3. Adding a New Tool

When the user wants to add a tool:

**Step 1: Understand the tool's purpose**
Ask:
- What should this tool do?
- What input does it need?
- What data from the metadata will it use?

**Step 2: Create the tool file**
Copy `templates/mcp/tools/_example-tool.ts` to `mcp/tools/<tool-name>.ts`

**Step 3: Update the registry**
Add to `mcp/tools/index.ts`:
```typescript
export * as toolName from './tool-name.js'
```

**Step 4: Rebuild and test**
```bash
npm run build-mcp-metadata
# Deploy and test with MCP Inspector
```

### 4. Key Implementation Details

**Metadata structure:**
The `metadata.json` contains:
- `version` - from package.json
- `components` - Record<componentId, { props, stories, mdx }>
- `tokens` - { color, spacing, typography }

**Tool structure:**
Each tool exports:
- `name` - kebab-case identifier
- `description` - shown to AI assistants
- `schema` - Zod schema for validation (optional)
- `handler` - (input, metadata) => ToolResult

**Error handling:**
Return `{ isError: true, content: [...] }` for expected errors (component not found, invalid category)

## Template Reference

Templates are in `templates/` relative to this skill file:
- `scripts/` - Metadata extraction script
- `mcp/` - Server factory, types, and tools
- `netlify/`, `api/`, `lambda/`, `server/` - Platform entry points
- `config/` - Configuration files

## Tutorial: What This Creates

(This section explains to the user what gets created and why)

## What This Creates

After running this skill, you'll have:

1. **Metadata extraction script** — Parses your TypeScript components to extract props, stories, and docs
2. **Tool registry** — Each MCP tool lives in its own file under `mcp/tools/`
3. **Server factory** — Creates the MCP server instance shared across all entry points
4. **Deployment entry point** — A serverless function ready for your chosen platform
5. **Complete documentation** — How everything works and how to extend it

## Prerequisites

Your design system should follow this structure (the skill enforces this):

```
src/
  components/
    Button/
      Button.tsx           # Component with exported Props interface
      _stories/
        Button.stories.tsx # Storybook stories
      _docs/
        Button.mdx         # Documentation
  tokens/
    ts/
      colors.ts            # Design tokens
      spacing.ts
      typography.ts
```

## Quick Start

### Step 1: Choose Your Deployment Target

When setting up, tell the skill where you want to deploy:

- **Netlify Functions** — `netlify/functions/mcp.mts`
- **Vercel Edge Functions** — `api/mcp.ts`
- **AWS Lambda** — `lambda/mcp/index.ts`
- **Cloudflare Workers** — `workers/mcp.ts`
- **Express/Fastify** — `server/mcp.ts`

The skill generates the right entry point for your choice.

### Step 2: Install Dependencies

```bash
npm install @modelcontextprotocol/sdk zod
npm install -D tsx typescript
```

### Step 3: Build Metadata

```bash
npm run build-mcp-metadata
```

This scans your `src/components/` directory and generates `metadata.json` with:
- Component props (from TypeScript interfaces)
- Story variants (from `.stories.tsx` files)
- MDX documentation
- Design tokens

### Step 4: Deploy

Push to your platform. The MCP endpoint will be available at:
- Netlify: `https://your-site.netlify.app/mcp`
- Vercel: `https://your-site.vercel.app/api/mcp`

## How It Works

### The Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  AI Assistant   │────▶│  MCP Server      │────▶│  metadata.json  │
│  (Claude, etc)  │◀────│  (HTTP endpoint) │◀────│  (built from    │
└─────────────────┘     └──────────────────┘     │  your code)     │
                                                  └─────────────────┘
```

### The Data Flow

1. **Build time**: `build-mcp-metadata.ts` parses your TypeScript files using the TypeScript compiler API
2. **Runtime**: The MCP server loads `metadata.json` and serves it through standardized tools
3. **Request time**: AI assistants call tools like `get-component` with a component ID

### Why This Pattern?

**Why pre-build metadata instead of parsing on every request?**

Parsing TypeScript is slow (500ms-2s). Building `metadata.json` at build time means requests are instant (<50ms). This matters when AI assistants make many tool calls in a conversation.

**Why separate files per tool?**

- Each tool is self-contained and easy to understand
- Multiple developers can work on different tools without merge conflicts
- You can add new tools without touching existing code
- Clear pattern: copy an existing tool, modify the logic

## Tool Reference

### Built-in Tools

| Tool | Description | Input |
|------|-------------|-------|
| `list-components` | Returns all available component IDs | None |
| `get-component` | Returns props definition for a component | `{ componentId: string }` |
| `get-component-stories` | Returns story variants | `{ componentId: string }` |
| `get-component-docs` | Returns MDX documentation | `{ componentId: string }` |
| `get-tokens` | Returns design tokens by category | `{ category: "color" \| "spacing" \| "typography" }` |

## Adding New Tools

### Step 1: Create the Tool File

Create a new file in `mcp/tools/`:

```typescript
// mcp/tools/search-components.ts
import { z } from 'zod'
import type { Metadata } from '../scripts/build-mcp-metadata'

export const name = 'search-components'

export const description = 'Search components by name pattern'

export const schema = z.object({
  query: z.string().describe('Search query (case-insensitive partial match)'),
})

export type Input = z.infer<typeof schema>

export function handler(input: Input, metadata: Metadata) {
  const matches = Object.keys(metadata.components).filter((id) =>
    id.includes(input.query.toLowerCase())
  )

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify({
          version: metadata.version,
          query: input.query,
          matches,
        }),
      },
    ],
  }
}
```

### Step 2: Register the Tool

Add it to `mcp/tools/index.ts`:

```typescript
export * as searchComponents from './search-components'
```

### Step 3: Rebuild and Deploy

```bash
npm run build-mcp-metadata
# Deploy to your platform
```

### Tool Structure Explained

Every tool file exports:

- **`name`**: The tool identifier (kebab-case, unique)
- **`description`**: What the tool does (shown to AI assistants)
- **`schema`**: Zod schema for input validation and type generation
- **`handler`**: Function that receives `(input, metadata)` and returns results

The handler returns:

```typescript
{
  content: [{ type: 'text', text: string }],
  isError?: boolean  // Optional: mark as error
}
```

## File Structure

After running this skill, your repo will have:

```
scripts/
  build-mcp-metadata.ts      # Metadata extraction script
mcp/
  tools/
    index.ts                 # Tool registry
    list-components.ts       # Built-in tools
    get-component.ts
    get-component-stories.ts
    get-component-docs.ts
    get-tokens.ts
  server-factory.ts          # createMcpServer(metadata)
  types.ts                   # Shared TypeScript types
<deployment>/
  <entry-point>              # Platform-specific handler
metadata.json                # Generated at build time
```

## Configuration

### Package.json Scripts

Add these to your `package.json`:

```json
{
  "scripts": {
    "build-mcp-metadata": "tsx scripts/build-mcp-metadata.ts"
  }
}
```

### Netlify Configuration

For Netlify deployments, add to `netlify.toml`:

```toml
[build]
  command = "npm run build-mcp-metadata && npm run build-storybook"

[functions]
  node_bundler = "esbuild"
  included_files = ["netlify/functions/metadata.json"]

[[redirects]]
  from = "/mcp"
  to = "/.netlify/functions/mcp"
  status = 200
```

### Vercel Configuration

For Vercel, no additional config needed if using `api/` directory.

## Testing Your MCP Server

### Using MCP Inspector

```bash
npx @modelcontextprotocol/inspector
```

1. Select "Streamable HTTP" transport
2. Enter your MCP URL (e.g., `http://localhost:8888/mcp`)
3. Click "Connect"
4. Try the tools!

### Manual Testing

```bash
curl -X POST https://your-site.com/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list"
  }'
```

## Troubleshooting

### "metadata.json not found"

Run `npm run build-mcp-metadata` before deploying. The server needs this file to exist.

### Component not found

Component IDs are case-insensitive, but must match the directory name. If your component is at `src/components/Button/`, use `button` or `Button`.

### Props not showing up

Your props interface must:
- Be exported: `export interface ButtonProps`
- End with `Props`
- Be in the same file as the component

### TypeScript compilation errors

Make sure your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "Node",
    "jsx": "react-jsx"
  }
}
```

## Advanced: Custom Token Extraction

If your tokens don't follow the simple `{ cssVariable, value }` pattern, modify `extractSimpleTokens()` in `build-mcp-metadata.ts`:

```typescript
// Example: Extract nested token objects
export function extractNestedTokens(tokenFile: string): Token[] {
  // Your custom extraction logic here
  // Return { cssVariable: string, value: string }[]
}
```

## Next Steps

Once your MCP server is deployed:

1. **Connect Claude Desktop**: Add to your `claude_desktop_config.json`
2. **Document the API**: Share the MCP endpoint URL with your team
3. **Add more tools**: Follow the pattern in "Adding New Tools"
4. **Monitor usage**: Add logging to see which tools get used most

## Why MCP?

MCP (Model Context Protocol) standardizes how AI assistants interact with external data sources. Instead of building custom integrations for each AI tool, you implement MCP once and any MCP-compatible assistant can use your design system.

Benefits:
- **Standardized**: Works with Claude, GitHub Copilot, and other MCP clients
- **Type-safe**: Zod schemas ensure valid inputs
- **Discoverable**: AI assistants can list available tools dynamically
- **Composable**: Tools can call other tools or external APIs
