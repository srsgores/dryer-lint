/**
 * Prose is documentation, and documentation is a JSDoc block.
 * A `//` comment is a note to whoever is looking at the line right now, and nothing reads it afterwards.
 * Written as a block, the same sentence is picked up by the editor, by the type checker and by whatever generates docs.
 * Directives keep the line form, because they are instructions to a tool rather than something said to a reader.
 */
import type {Rule} from "eslint";

/** Directives the tools read; they are instructions, not documentation. */
const DIRECTIVE: RegExp = /^\s*(?:eslint|prettier|globals?|exported|jsx|@ts-|v8 |c8 |istanbul |svelte-ignore|@vite|type-coverage)/;

/** Keeps prose in a block, where the tools that read documentation can see it. */
const rule: Rule.RuleModule = {
	meta: {
		type: "suggestion",
		docs: {description: "Keeps prose out of line comments, where only a passing reader would find it"},
		messages: {
			notDocumentation: "Document with a JSDoc block rather than a line comment."
		},
		schema: []
	},

	/**
	 * Reads every line comment in a file and asks about the ones that are prose.
	 * @param context The rule context eslint hands the rule
	 * @returns The visitor eslint runs over the program
	 */
	create: function checkLineComments(context: Rule.RuleContext): Rule.RuleListener {
		return {
			/**
			 * Reads every comment in the file and asks about the line comments that are prose.
			 */
			Program: function everyComment(): void {
				for (const comment of context.sourceCode.getAllComments()) {
					const at = comment.loc;

					if (at && comment.type === "Line" && !DIRECTIVE.test(comment.value)) {
						context.report({loc: at, messageId: "notDocumentation"});
					}
				}
			}
		};
	}
};

export default rule;
