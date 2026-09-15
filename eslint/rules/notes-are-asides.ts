/**
 * A note is an aside, for something worth knowing that has no tag of its own.
 * What a function throws has a tag, and a reader looking for it reads `@throws` rather than the prose around it.
 */
import type {Rule} from "eslint";

/** The asterisk a block comment's lines are drawn with, which is not part of what was said. */
const DRAWN_MARGIN: RegExp = /^\s*\*?/;

/** What a note is for is an aside, so anything thrown belongs in `@throws`. */
const THROWING: RegExp = /\bthrows?\b|\bthrown\b|\bexception\b/i;

/** Keeps what a function throws in the tag a reader looks for it in. */
const rule: Rule.RuleModule = {
	meta: {
		type: "suggestion",
		docs: {description: "Keeps what a function throws in @throws, not in a note"},
		messages: {
			noteThrows: "What a function throws belongs in @throws, not in a note."
		},
		schema: []
	},

	/**
	 * Reads every note in a file and asks about the ones that say what is thrown.
	 * @param context The rule context eslint hands the rule
	 * @returns The visitor eslint runs over the program
	 */
	create: function checkNotes(context: Rule.RuleContext): Rule.RuleListener {
		return {
			/**
			 * Reads every comment in the file and asks about the notes that say what is thrown.
			 */
			Program: function everyNote(): void {
				for (const comment of context.sourceCode.getAllComments()) {
					const at = comment.loc;

					for (const line of comment.value.split("\n")) {
						const said = line.replace(DRAWN_MARGIN, "").trim();

						if (at && said.startsWith("@note") && THROWING.test(said)) {
							context.report({loc: at, messageId: "noteThrows"});
						}
					}
				}
			}
		};
	}
};

export default rule;
