/**
 * A type or interface names a shape the application shares across its parts.
 * Defined where it is used, it hides from other screens that need the same shape.
 * Put it in the types directory so every part of the application finds it in one place.
 */
import type {Rule} from "eslint";

/** A backslash, which is how Windows writes the separator between one directory and the next. */
const WINDOWS_SEPARATOR: RegExp = /\\/g;

/** A file that sits inside a types directory, at whatever depth. */
const TYPES_DIRECTORY_PATTERN: RegExp = /(?:^|\/)types(?:\/|$)/;

/** An ambient declaration file, which has to declare the shapes of its environment. */
const AMBIENT_DECLARATIONS_PATTERN: RegExp = /\.d\.ts$/;

/**
 * Answers whether a file sits inside a types directory or declares an environment.
 * @param filename The path of the file being linted
 * @returns True when the file is exempt from the rule
 */
function isExemptFile(filename: string): boolean {
	const normalized = filename.replace(WINDOWS_SEPARATOR, "/");

	return TYPES_DIRECTORY_PATTERN.test(normalized) || AMBIENT_DECLARATIONS_PATTERN.test(normalized);
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

		if (!isExemptFile(context.filename)) {
			visitors = {
				TSInterfaceDeclaration: function checkInterface(node: unknown): void {
					context.report({node: node as Rule.Node, messageId: "typesDirectory"});
				},
				TSTypeAliasDeclaration: function checkTypeAlias(node: unknown): void {
					context.report({node: node as Rule.Node, messageId: "typesDirectory"});
				}
			};
		}

		return visitors;
	}
};

export default rule;
