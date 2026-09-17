/**
 * A type or interface names a shape the application shares across its parts.
 * Defined where it is used, it hides from other screens that need the same shape.
 * Put it in the types directory so every part of the application finds it in one place.
 * A component's own `Props` is the exception, since it describes this one component and nothing else can share it.
 */
import type {Rule} from "eslint";
import {readNode} from "#lib/nodes.ts";

/** A backslash, which is how Windows writes the separator between one directory and the next. */
const WINDOWS_SEPARATOR: RegExp = /\\/g;

/** A file that sits inside a types directory, at whatever depth. */
const TYPES_DIRECTORY_PATTERN: RegExp = /(?:^|\/)types(?:\/|$)/;

/** An ambient declaration file, which has to declare the shapes of its environment. */
const AMBIENT_DECLARATIONS_PATTERN: RegExp = /\.d\.ts$/;

/** A single-file component, where the props a component takes are declared beside the markup that reads them. */
const COMPONENT_FILE_PATTERN: RegExp = /\.(?:astro|svelte)$/;

/** What a component calls the shape of its own props, which both astro and svelte read by that name. */
const COMPONENT_PROPS = "Props";

/**
 * Answers whether a file sits inside a types directory or declares an environment.
 * @param filename The path of the file being linted
 * @returns True when the file is exempt from the rule
 */
function isExemptFile(filename: string): boolean {
	const normalized = filename.replace(WINDOWS_SEPARATOR, "/");

	return TYPES_DIRECTORY_PATTERN.test(normalized) || AMBIENT_DECLARATIONS_PATTERN.test(normalized);
}

/**
 * Answers whether a declaration is a component's own props, which live with the component by convention.
 * @param node The interface or type declaration
 * @param filename The path of the file being linted
 * @returns True when a single-file component is declaring the props it takes
 */
function isComponentProps(node: Rule.Node, filename: string): boolean {
	const declared = readNode<{id?: {name?: string}}>(node).id?.name;

	return COMPONENT_FILE_PATTERN.test(filename.replace(WINDOWS_SEPARATOR, "/")) && declared === COMPONENT_PROPS;
}

/** Keeps the shapes an application shares in one place, where every part of it can find them. */
const rule: Rule.RuleModule = {
	meta: {
		type: "suggestion",
		docs: {description: "Keeps interfaces and types in the types directory"},
		messages: {
			typesDirectory: "Define interfaces and types in the types directory"
		},
		schema: []
	},

	/**
	 * Watches a file for a shape declared somewhere other than the types directory.
	 * @param context The rule context eslint hands the rule
	 * @returns The visitor eslint runs over the program
	 */
	create: function checkTypeDeclarations(context: Rule.RuleContext): Rule.RuleListener {
		let visitors: Rule.RuleListener = {};

		/**
		 * Asks about one declared shape, unless it is the props of the component it stands in.
		 * @param node The interface or type declaration
		 */
		function inspectDeclaration(node: unknown): void {
			const declaration = readNode<Rule.Node>(node);

			if (!isComponentProps(declaration, context.filename)) {
				context.report({node: declaration, messageId: "typesDirectory"});
			}
		}

		if (!isExemptFile(context.filename)) {
			visitors = {
				TSInterfaceDeclaration: inspectDeclaration,
				TSTypeAliasDeclaration: inspectDeclaration
			};
		}

		return visitors;
	}
};

export default rule;
