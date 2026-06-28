import * as ts from 'typescript'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

// __dirname is defined under tsx (CJS shim) but undefined under ESM loaders
const __dir =
	typeof __dirname !== 'undefined' && __dirname
		? __dirname
		: path.dirname(fileURLToPath(import.meta.url))

export const root = path.resolve(__dir, '..')
export const componentsDir = path.join(root, 'src', 'components')
export const outputPath = path.join(
	root,
	'netlify',
	'functions',
	'metadata.json'
)

// ── Helpers ───────────────────────────────────────────────────────────────────

export function readFile(filePath: string): string {
	return fs.readFileSync(filePath, 'utf-8')
}

export function createProgram(filePaths: string[]): ts.Program {
	return ts.createProgram(filePaths, {
		target: ts.ScriptTarget.ES2020,
		module: ts.ModuleKind.ESNext,
		moduleResolution: ts.ModuleResolutionKind.NodeJs,
		jsx: ts.JsxEmit.ReactJSX,
		strict: true,
	})
}

// ── Props extraction ──────────────────────────────────────────────────────────

export interface PropDef {
	name: string
	type: string
	default: string | null
	required: boolean
	description: string | null
}

export function getJsDocTagValue(
	symbol: ts.Symbol,
	tagName: string
): string | null {
	const jsDocs = symbol.getJsDocTags()
	const tag = jsDocs.find((t) => t.name === tagName)
	if (!tag || !tag.text) return null
	return (
		tag.text
			.map((part) => part.text)
			.join('')
			.trim() || null
	)
}

export function getJsDocComment(
	symbol: ts.Symbol,
	checker: ts.TypeChecker
): string | null {
	const comment = ts
		.displayPartsToString(symbol.getDocumentationComment(checker))
		.trim()
	return comment || null
}

export function extractTypeString(
	type: ts.Type,
	checker: ts.TypeChecker
): string {
	return checker.typeToString(type)
}

export function extractProps(componentFile: string): PropDef[] {
	const program = createProgram([componentFile])
	const checker = program.getTypeChecker()
	const sourceFile = program.getSourceFile(componentFile)
	if (!sourceFile) return []

	const props: PropDef[] = []

	function visit(node: ts.Node) {
		if (
			ts.isInterfaceDeclaration(node) &&
			node.name.text.endsWith('Props') &&
			node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
		) {
			for (const member of node.members) {
				if (!ts.isPropertySignature(member) || !member.name) continue

				const name = member.name.getText(sourceFile)
				const required = !member.questionToken
				const symbol = checker.getSymbolAtLocation(member.name)

				let typeStr = 'unknown'
				if (member.type) {
					const type = checker.getTypeAtLocation(member.type)
					typeStr = extractTypeString(type, checker)
				}

				const rawDefault = symbol
					? getJsDocTagValue(symbol, 'default')
					: null
				const defaultVal = rawDefault
					? rawDefault.replace(/^['"]|['"]$/g, '')
					: null
				const description = symbol
					? getJsDocComment(symbol, checker)
					: null

				props.push({
					name,
					type: typeStr,
					default: defaultVal,
					required,
					description,
				})
			}
		}
		ts.forEachChild(node, visit)
	}

	ts.forEachChild(sourceFile, visit)
	return props
}

// ── Stories extraction ────────────────────────────────────────────────────────

export interface StoryDef {
	id: string
	args: Record<string, unknown>
}

export function extractArgs(
	node: ts.ObjectLiteralExpression,
	sourceFile: ts.SourceFile
): Record<string, unknown> {
	const result: Record<string, unknown> = {}
	for (const prop of node.properties) {
		if (!ts.isPropertyAssignment(prop)) continue
		const key = prop.name.getText(sourceFile)
		const val = prop.initializer
		if (ts.isStringLiteral(val)) result[key] = val.text
		else if (ts.isNumericLiteral(val)) result[key] = Number(val.text)
		else if (val.kind === ts.SyntaxKind.TrueKeyword) result[key] = true
		else if (val.kind === ts.SyntaxKind.FalseKeyword) result[key] = false
		else if (val.kind === ts.SyntaxKind.NullKeyword) result[key] = null
		else result[key] = val.getText(sourceFile)
	}
	return result
}

export function extractStories(storiesFile: string): StoryDef[] {
	const program = createProgram([storiesFile])
	const sourceFile = program.getSourceFile(storiesFile)
	if (!sourceFile) return []

	const stories: StoryDef[] = []

	for (const stmt of sourceFile.statements) {
		if (!ts.isVariableStatement(stmt)) continue
		const isExported = stmt.modifiers?.some(
			(m) => m.kind === ts.SyntaxKind.ExportKeyword
		)
		if (!isExported) continue

		for (const decl of stmt.declarationList.declarations) {
			if (!ts.isIdentifier(decl.name)) continue
			const id = decl.name.text
			if (id === 'default') continue
			if (
				!decl.initializer ||
				!ts.isObjectLiteralExpression(decl.initializer)
			)
				continue

			const obj = decl.initializer
			let args: Record<string, unknown> = {}

			for (const prop of obj.properties) {
				if (!ts.isPropertyAssignment(prop)) continue
				if (
					prop.name.getText(sourceFile) === 'args' &&
					ts.isObjectLiteralExpression(prop.initializer)
				) {
					args = extractArgs(prop.initializer, sourceFile)
				}
			}

			stories.push({ id, args })
		}
	}

	return stories
}

// ── Token extraction ──────────────────────────────────────────────────────────

export interface SimpleToken {
	cssVariable: string
	value: string
}

export function getPropKey(
	prop: ts.ObjectLiteralElementLike,
	sourceFile: ts.SourceFile
): string {
	if (ts.isPropertyAssignment(prop)) {
		const name = prop.name
		if (ts.isStringLiteral(name)) return name.text
		if (ts.isIdentifier(name)) return name.text
		return name.getText(sourceFile)
	}
	return ''
}

export function extractSimpleTokens(tokenFile: string): SimpleToken[] {
	const program = createProgram([tokenFile])
	const sourceFile = program.getSourceFile(tokenFile)
	if (!sourceFile) return []

	for (const stmt of sourceFile.statements) {
		if (!ts.isVariableStatement(stmt)) continue
		for (const decl of stmt.declarationList.declarations) {
			if (!ts.isIdentifier(decl.name) || decl.name.text !== 'tokens')
				continue
			if (
				!decl.initializer ||
				!ts.isArrayLiteralExpression(decl.initializer)
			)
				continue

			return decl.initializer.elements
				.filter(ts.isObjectLiteralExpression)
				.map((obj) => {
					const fields: Record<string, string> = {}
					for (const prop of obj.properties) {
						if (!ts.isPropertyAssignment(prop)) continue
						const key = getPropKey(prop, sourceFile)
						if (ts.isStringLiteral(prop.initializer)) {
							fields[key] = prop.initializer.text
						}
					}
					return fields
				})
				.filter((f) => f.cssVariable && f.value)
				.map((f) => ({ cssVariable: f.cssVariable, value: f.value }))
		}
	}
	return []
}

export function extractTypographyTokens(tokenFile: string): SimpleToken[] {
	const program = createProgram([tokenFile])
	const sourceFile = program.getSourceFile(tokenFile)
	if (!sourceFile) return []

	for (const stmt of sourceFile.statements) {
		if (!ts.isVariableStatement(stmt)) continue
		for (const decl of stmt.declarationList.declarations) {
			if (!ts.isIdentifier(decl.name) || decl.name.text !== 'tokens')
				continue
			if (
				!decl.initializer ||
				!ts.isArrayLiteralExpression(decl.initializer)
			)
				continue

			return decl.initializer.elements
				.filter(ts.isObjectLiteralExpression)
				.map((obj) => {
					const fields: Record<string, string | number> = {}
					for (const prop of obj.properties) {
						if (!ts.isPropertyAssignment(prop)) continue
						const key = getPropKey(prop, sourceFile)
						if (ts.isStringLiteral(prop.initializer)) {
							fields[key] = prop.initializer.text
						} else if (ts.isNumericLiteral(prop.initializer)) {
							fields[key] = Number(prop.initializer.text)
						}
					}
					return fields
				})
				.filter((f) => f.cssVariable)
				.map((f) => {
					const weight = f.fontWeight ?? ''
					const size = f.fontSize ?? ''
					const lineHeight = f.lineHeight ?? 'normal'
					const family = f.fontFamily ?? ''
					const value =
						`${weight} ${size}/${lineHeight} ${family}`.trim()
					return { cssVariable: f.cssVariable as string, value }
				})
		}
	}
	return []
}

// ── Component description extraction ───────────────────────────────────────────

export function extractComponentDescription(componentFile: string): string | null {
	const program = createProgram([componentFile])
	const checker = program.getTypeChecker()
	const sourceFile = program.getSourceFile(componentFile)
	if (!sourceFile) return null

	for (const stmt of sourceFile.statements) {
		// Look for exported variable declarations with JSDoc (e.g., export const Button = ...)
		if (ts.isVariableStatement(stmt)) {
			const isExported = stmt.modifiers?.some(
				(m) => m.kind === ts.SyntaxKind.ExportKeyword
			)
			if (!isExported) continue

			for (const decl of stmt.declarationList.declarations) {
				if (!ts.isIdentifier(decl.name)) continue
				const symbol = checker.getSymbolAtLocation(decl.name)
				if (!symbol) continue

				const description = getJsDocComment(symbol, checker)
				if (description) return description
			}
		}
		// Also check for exported function declarations
		if (ts.isFunctionDeclaration(stmt)) {
			const isExported = stmt.modifiers?.some(
				(m) => m.kind === ts.SyntaxKind.ExportKeyword
			)
			if (!isExported || !stmt.name) continue

			const symbol = checker.getSymbolAtLocation(stmt.name)
			if (!symbol) continue

			const description = getJsDocComment(symbol, checker)
			if (description) return description
		}
	}
	return null
}

// ── Main ─────────────────────────────────────────────────────────────────────-

export interface ComponentMeta {
	props: PropDef[]
	stories: StoryDef[]
	mdx: string
	description: string | null
}

export interface Metadata {
	version: string
	components: Record<string, ComponentMeta>
	tokens: {
		color: SimpleToken[]
		spacing: SimpleToken[]
		typography: SimpleToken[]
	}
}

function main() {
	const pkg = JSON.parse(readFile(path.join(root, 'package.json')))
	const version: string = pkg.version

	const componentDirs = fs
		.readdirSync(componentsDir)
		.filter((name) =>
			fs.statSync(path.join(componentsDir, name)).isDirectory()
		)

	const components: Record<string, ComponentMeta> = {}

	for (const dir of componentDirs) {
		const id = dir.toLowerCase()
		const compDir = path.join(componentsDir, dir)

		const componentFile = path.join(compDir, `${dir}.tsx`)
		const storiesFile = path.join(compDir, '_stories', `${dir}.stories.tsx`)
		const mdxFile = path.join(compDir, '_docs', `${dir}.mdx`)

		const props = fs.existsSync(componentFile)
			? extractProps(componentFile)
			: []
		const stories = fs.existsSync(storiesFile)
			? extractStories(storiesFile)
			: []
		const mdx = fs.existsSync(mdxFile) ? readFile(mdxFile) : ''
		const description = fs.existsSync(componentFile)
			? extractComponentDescription(componentFile)
			: null

		components[id] = { props, stories, mdx, description }
	}

	const colorFile = path.join(root, 'src', 'tokens', 'ts', 'colors.ts')
	const spacingFile = path.join(root, 'src', 'tokens', 'ts', 'spacing.ts')
	const typographyFile = path.join(
		root,
		'src',
		'tokens',
		'ts',
		'typography.ts'
	)

	const metadata: Metadata = {
		version,
		components,
		tokens: {
			color: fs.existsSync(colorFile)
				? extractSimpleTokens(colorFile)
				: [],
			spacing: fs.existsSync(spacingFile)
				? extractSimpleTokens(spacingFile)
				: [],
			typography: fs.existsSync(typographyFile)
				? extractTypographyTokens(typographyFile)
				: [],
		},
	}

	fs.mkdirSync(path.dirname(outputPath), { recursive: true })
	fs.writeFileSync(outputPath, JSON.stringify(metadata, null, 2))
	console.log(`metadata.json written to ${outputPath}`)
	console.log(
		`  ${componentDirs.length} components: ${componentDirs.map((d) => d.toLowerCase()).join(', ')}`
	)
	console.log(`  ${metadata.tokens.color.length} color tokens`)
	console.log(`  ${metadata.tokens.spacing.length} spacing tokens`)
	console.log(`  ${metadata.tokens.typography.length} typography tokens`)
}

// Only run main when invoked directly (e.g. `tsx scripts/build-mcp-metadata.ts`),
// not when imported (e.g. by Storybook presets).
const invokedDirectly =
	process.argv[1] &&
	pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
if (invokedDirectly) main()
