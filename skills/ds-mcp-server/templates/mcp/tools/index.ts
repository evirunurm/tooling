/**
 * Tool registry - exports all MCP tools.
 *
 * To add a new tool:
 * 1. Create a new file in this directory (e.g., my-tool.ts)
 * 2. Export name, description, schema (optional), and handler
 * 3. Add the export below
 */

export * as listComponents from './list-components.js'
export * as getComponent from './get-component.js'
export * as getComponentStories from './get-component-stories.js'
export * as getComponentDocs from './get-component-docs.js'
export * as getTokens from './get-tokens.js'
