/**
 * An import addresses a module by its alias rather than walking the tree to find it.
 * `../lib/` or `../../components/` is a guess at where the reader is sitting today.
 * That breaks when a file is moved and hides what part of the app is being asked for.
 * An alias names the place itself, so the import says which part of the app it wants.
 */
import {dirname, relative, resolve} from "node:path";
import type {Rule} from "eslint";
import {DEFAULT_ALIASES} from "../../lib/aliases.ts";
import {readNode} from "../../lib/nodes.ts";
import type {AliasSuggestion, AliasTarget} from "../../lib/types/aliases.ts";

/** ESLint loads its own config by a relative path, so that one file's imports stay relative. */
const BOOTSTRAP_CONFIG_PATTERN: RegExp = /(?:^|\/)eslint\.config\.[cm]?[jt]s$/;

/** SvelteKit writes a per-route type declaration next to the route, which has no alias to reach. */
const ROUTE_TYPES_PATTERN: RegExp = /^\.\/\$types(?:\.js)?$/;

/** A backslash, which is how Windows writes the separator between one directory and the next. */
const WINDOWS_SEPARATOR: RegExp = /\\/g;

/**
 * Finds the alias a relative path should have been written as.
 * @param sourceFile The file making the import
 * @param importPath The import string
 * @param aliases The aliases this project declares
 * @returns The alias and the import to write instead, or nothing when the path reaches none of them
 */
function findAliasReplacement(sourceFile: string, importPath: string, aliases: AliasTarget[]): AliasSuggestion | null {
	const normalizedSource = sourceFile.replace(WINDOWS_SEPARATOR, "/");
	const isReachable = importPath.startsWith(".") && !ROUTE_TYPES_PATTERN.test(importPath) && !BOOTSTRAP_CONFIG_PATTERN.test(normalizedSource);
	let replacement: AliasSuggestion | null = null;

	if (isReachable) {
		const resolved = resolve(dirname(sourceFile), importPath);
		const relativeToRoot = relative(process.cwd(), resolved).replace(WINDOWS_SEPARATOR, "/");
		const matching = aliases.find(function reaches(target: AliasTarget): boolean {
			return relativeToRoot === target.prefix || relativeToRoot.startsWith(`${target.prefix}/`);
		});

		if (matching) {
			replacement = {alias: matching.alias, suggested: `${matching.alias}${relativeToRoot.slice(matching.prefix.length)}`};
		}
	}

	return replacement;
}

/** Addresses a module by the name of the place it lives, rather than by the way there from here. */
const rule: Rule.RuleModule = {
	meta: {
		type: "suggestion",
		docs: {description: "Enforces path aliases rather than relative paths that walk the tree"},
		messages: {
			useAlias: "Use {{alias}} rather than a relative path to reach {{suggested}}"
		},
		fixable: "code",
		schema: [
			{
				type: "array",
				items: {
					type: "object",
					properties: {prefix: {type: "string"}, alias: {type: "string"}},
					required: ["prefix", "alias"],
					additionalProperties: false
				}
			}
		]
	},

	/**
	 * Watches every import in a file for a path that walks the tree to somewhere with a name.
	 * @param context The rule context eslint hands the rule
	 * @returns The visitor eslint runs over the program
	 */
	create: function checkImports(context: Rule.RuleContext): Rule.RuleListener {
		const [configured] = context.options as [AliasTarget[] | undefined];
		const aliases = configured ?? DEFAULT_ALIASES;

		/**
		 * Asks about one import path, and offers the alias that reaches the same module.
		 * @param sourceNode The string the import names its module with
		 * @param importPath What that string says
		 */
		function inspectImportSource(sourceNode: Rule.Node, importPath: string): void {
			const replacement = findAliasReplacement(context.filename, importPath, aliases);

			if (replacement) {
				context.report({
					node: sourceNode,
					messageId: "useAlias",
					data: {alias: replacement.alias, suggested: replacement.suggested},
					fix: function applyAliasFix(fixer): Rule.Fix {
						return fixer.replaceText(sourceNode, `"${replacement.suggested}"`);
					}
				});
			}
		}

		/**
		 * Reads whatever module string a declaration carries, when it carries one.
		 * @param node The import or export declaration
		 */
		function inspectDeclaration(node: unknown): void {
			const source = (node as {source?: {value?: unknown; type?: string}}).source;

			if (source && typeof source.value === "string") {
				inspectImportSource(readNode<Rule.Node>(source), source.value);
			}
		}

		return {
			ImportDeclaration: inspectDeclaration,
			ExportNamedDeclaration: inspectDeclaration,
			ExportAllDeclaration: inspectDeclaration,
			/**
			 * Reads the module string a dynamic import names, when it names one at all.
			 * @param node The import expression
			 */
			ImportExpression: function checkImportExpression(node): void {
				const source = node.source as {type?: string; value?: unknown};

				if (source.type === "Literal" && typeof source.value === "string") {
					inspectImportSource(readNode<Rule.Node>(source), source.value);
				}
			}
		};
	}
};

export default rule;
