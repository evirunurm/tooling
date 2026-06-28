---
name: agentalize-design-system
description: |
  Set up and manage an MCP (Model Context Protocol) server for React design systems with Storybook.
  
  Use this skill when:
  - The user wants to add MCP/agentic capabilities to their design system repository
  - They need to expose components, props, stories, and design tokens through MCP tools
  - They want AI assistants to query their design system programmatically
  - Setting up a new MCP server from scratch or adding tools to an existing one
  
  The skill scaffolds the complete infrastructure including TypeScript-based metadata extraction and a standard
  tool definitions
---

# Storybook as Design System Documentation

## Storybook's Current Role

Storybook is currently primarily used as a **development playground** for UI components. While useful for developers during implementation, it often feels limited in broader value.

Its most valuable features are:
- Listing all available components
- Displaying component props and variants
- (Rarely) documenting design patterns and usage guidelines

## Design Patterns

**Design patterns** are specific UX/UI decisions made by designers when building screens. These patterns usually require deep knowledge of the **design system** and established UX principles.

### Examples of Design Patterns

- In modals, the **"Accept"** button is placed on the **right**, and the **"Cancel"** button on the **left**.
- In data tables, if an item is clickable, the **entire row** is interactive.
- When navigating from a filtered search results table to a detail page:
  - Show a **Back** button and **breadcrumbs**.
  - Returning via the Back button should **restore the original filters and search state**.

These kinds of decisions are often documented in external platforms (Zeroheight, Confluence, Supernova, etc.), when they even exist.

## Our Vision for Storybook

We want to evolve Storybook into the **single source of truth** for our design system, effectively turning it into a **Zeroheight / Confluence / Supernova** equivalent.

### Target Audiences
- **Designers**
- **Engineers**
- **AI systems** (LLMs)

**Goal**: Make all design decisions, patterns, and rationale easily accessible to both humans *and* AI. This enables AI to:
- Make better design and implementation decisions
- Justify choices using our own design system logic
- Maintain consistency across the product

## Why Storybook?

We chose Storybook as the foundation for this documentation hub because:

- It already provides a **structured documentation scaffolding**
- It includes excellent helpers to **display components and their properties** within Markdown documentation
- We can **extract component metadata** via a build script that parses TypeScript and Storybook files

This gives us a strong technical base to build a comprehensive, living design system documentation.

- What Stoprybook is not:
  - A developer's only domain, becoming a messy place where they add the variants they want 
  - A documentation no one looks at, only to see it certain component exists or not.
- What Storybook is:
  - A complete shared documentation of a complex design system.
  - The core of knowledge a company shares.

## How to use this skill

### 1. Determine the user's goal

Ask what they want to do:
- **"Set up a new MCP server"** → Go to scaffolding section (includes documentation)
- **"Add a new tool"** → Go to tool creation section (includes documentation update)

### 2. Scaffolding a New MCP Server

When setting up from scratch:

**Step 1: Check prerequisites**
- [] Verify they have a React + Storybook design system
- [] Identify their file structure:
  - Where are components stored? (e.g., `src/components/`, `app/components/`)
  - Where are Storybook stories located? (e.g., `__stories__/`, `*.stories.tsx` alongside components)
  - Where should MDX documentation be stored? (e.g., `__docs__/`, `*.mdx` alongside components)
- [] Check package.json for TypeScript
- [] Make sure it's clear which components should be exposed through the MCP, and that all of them have stories defined. If some of them don't, ask the user to confirm next actions.

**Step 3: Verify Storybook Configuration**
Before copying templates, verify the Storybook is properly configured:

1. **Check `.storybook/main.ts`** has:
   - MDX stories pattern: `'../src/**/*.mdx'`
   - `@storybook/addon-docs` in addons
   - `reactDocgen: 'react-docgen-typescript'` configured

2. **Verify each component has:**
   - `_docs/<Component>.mdx` file with comprehensive documentation
   - `_stories/<Component>.stories.tsx` with specific variants (no Playgrounds)
   - JSDoc comments on props in the Props interface
   - Component-level JSDoc describing purpose and usage

3. **If components are missing documentation:**
   - Create the MDX docs file
   - Add JSDoc comments to props
   - Replace any Playground stories with specific variant stories
   - Add component-level description comments

**Step 4: Copy template files**
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

**Step 5: Update package.json**
Add the scripts and dependencies from `templates/config/package-additions.json`

**Step 6: Generate documentation**
Create `MCP_SETUP.md` in the project root with:
- **Architecture overview**: Explain the metadata flow (build-time extraction → runtime serving)
- **Tool reference**: List all available MCP tools with descriptions and example inputs
- **Development workflow**: How to add new components and regenerate metadata
- **Deployment notes**: Platform-specific details for the chosen target

**Step 7: Build and verify**

1. **Build the metadata:**
   ```bash
   npm run build-mcp-metadata
   ```
   Verify `metadata.json` is created in the correct location.

2. **Run the MCP server locally**

3. **Test with MCP Inspector:**
   In a new terminal:
   ```bash
   npx @modelcontextprotocol/inspector
   ```
   
   - Select **"Streamable HTTP"** as the transport
   - Enter your local MCP URL:
     - Netlify: `http://localhost:8888/mcp`
     - Vercel: `http://localhost:3000/api/mcp`
     - Self-hosted: `http://localhost:3000/mcp`
   - Click **"Connect"**
   
4. **Verify the tools work:**
   - Click **"List Tools"** to see all available tools
   - Test `list-components` - should return components with descriptions
   - Test `get-component` with a component ID - should return props with JSDoc descriptions
   - Test `get-component-docs` - should return MDX content
   - Test `get-component-stories` - should return specific variant stories (no Playgrounds)

5. **Fix any issues:**
   - If descriptions are missing → Add JSDoc comments to components
   - If MDX is empty → Verify `_docs/<Component>.mdx` files exist
   - If props lack types/descriptions → Check Storybook's react-docgen-typescript config
   - If stories include Playgrounds → Replace with specific variant stories

**Step 6: Ask about deployment target**
Ask: "Where do you want to deploy the MCP server?"
- Netlify Functions
- Vercel Edge Functions
- AWS Lambda
- Cloudflare Workers
- Self-hosted (Express)

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

**Step 4: Document the new tool**
Update `MCP_SETUP.md` to include:
- Add the new tool to the **Tool reference** section with description, inputs, and example outputs
- Add a **Rationale** subsection explaining why this tool exists and when to use it

**Step 5: Rebuild and verify**

1. **Rebuild metadata:**
   ```bash
   npm run build-mcp-metadata
   ```

2. **Restart the MCP server** (if running locally)

3. **Test in MCP Inspector:**
   ```bash
   npx @modelcontextprotocol/inspector
   ```
   
   - Connect to your local MCP endpoint
   - Click **"List Tools"** - verify your new tool appears
   - Test your new tool with sample inputs
   - Verify the output format matches expectations

4. **Debug if needed:**
   - Check the MCP server logs for errors
   - Verify the tool file exports are correct
   - Ensure the tool is registered in `mcp/tools/index.ts`

### 4. Key Implementation Details

**Metadata structure:**
The `metadata.json` contains:
- `version` - from package.json
- `components` - Record<componentId, { props, stories, mdx, description }>
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
        Button.stories.tsx # Storybook stories (specific variants, NOT Playgrounds)
      _docs/
        Button.mdx         # Documentation shown in Storybook
  tokens/
    ts/
      colors.ts            # Design tokens
      spacing.ts
      typography.ts
```

### Required Storybook Configuration

For the MCP server to work properly, your Storybook must be configured to extract and display component metadata:

**1. Enable MDX documentation in Storybook:**

Ensure your `.storybook/main.ts` includes MDX support and the docs addon:

```typescript
export default {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@storybook/addon-docs',  // Required for MDX documentation
    // ... other addons
  ],
}
```

**2. Configure TypeScript docgen for prop extraction:**

```typescript
// .storybook/main.ts
export default {
  typescript: {
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      shouldRemoveUndefinedFromOptional: true,
      propFilter: (prop) => {
        // Filter out native HTML props to reduce noise
        return !['className', 'style', 'ref', 'key'].includes(prop.name)
      },
    },
  },
}
```

**3. Component structure requirements:**

Each component MUST have:

- **Exported Props interface** with JSDoc descriptions:
  ```typescript
  export interface ButtonProps {
    /** Description of what this prop does */
    variant?: 'primary' | 'secondary'
    /** Click handler for the button */
    onClick?: () => void
  }
  ```

- **MDX documentation file** (`_docs/<Component>.mdx`) with:
  - Component purpose and usage guidelines
  - When to use vs alternatives
  - Accessibility considerations
  - Example usage code

- **Stories file** (`_stories/<Component>.stories.tsx`) with:
  - **Specific variants only** — Stories demonstrate concrete use cases
  - **NO Playground stories** — Playgrounds conflict with MCP's structured approach
  - Each story should have meaningful args that show real-world usage

**4. Component-level descriptions:**

Add a component description comment above your component definition:

```typescript
/**
 * Button triggers actions or events when activated.
 * 
 * Use Button when you need users to:
 * - Submit forms
 * - Trigger modal dialogs
 * - Perform destructive actions (with appropriate variant)
 * 
 * For navigation, consider Link component instead.
 * 
 * @example
 * <Button variant="primary" onClick={handleSubmit}>
 *   Submit
 * </Button>
 */
export const Button = (props: ButtonProps) => { ... }
```

This description will be extracted and returned by the `list-components` tool to help distinguish similar components.

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
| `list-components` | Returns all available component IDs with descriptions | None |
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

### "Playground" stories don't make sense for MCP

**DO NOT create Playground stories.** Playgrounds allow arbitrary prop manipulation, which conflicts with MCP's structured approach. Stories should demonstrate specific, real-world component variants.

**Instead of Playground:**
```typescript
// ❌ DON'T: Playground allows arbitrary changes
export const Playground = { args: {} }

// ✅ DO: Specific variant stories
export const Primary = { args: { variant: 'primary', children: 'Button' } }
export const Secondary = { args: { variant: 'secondary', children: 'Button' } }
export const Disabled = { args: { disabled: true, children: 'Button' } }
```

### Component descriptions not showing up

Add a JSDoc comment above your component definition:

```typescript
/**
 * Brief description of what this component does and when to use it.
 * 
 * This description helps AI assistants distinguish between similar components.
 * Include usage guidelines and alternatives if applicable.
 */
export const Button = (props: ButtonProps) => { ... }
```

The description will be extracted and returned by `list-components` to help users understand what each component does.

### MDX documentation not appearing in Storybook

Ensure your `.storybook/main.ts` includes:

```typescript
export default {
  stories: [
    '../src/**/*.mdx',  // Required for MDX docs
    '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'
  ],
  addons: [
    '@storybook/addon-docs',  // Required for MDX support
  ],
}
```

Also verify your MDX file is in the `_docs/` subdirectory (e.g., `src/components/Button/_docs/Button.mdx`).

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
