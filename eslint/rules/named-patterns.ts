/**
 * A pattern written inline is a sentence nobody wrote down.
 * An inline regular expression in a condition says what it matches only to whoever can read it back character by character.
 * Given a name, the pattern says what it is for at a glance, can be found by search and reused across the project.
 */
import type {Rule} from "eslint";

/** Keeps a pattern named, so a condition reads as the rule it enforces. */
const rule: Rule.RuleModule = {
	meta: {
		type: "suggestion",
		docs: {description: "Keeps patterns named, so a condition reads as the rule it enforces"},
		messages: {
			unnamed: "This pattern is unnamed, so only its punctuation says what it matches. Lift it into a constant whose name does"
		},
		schema: []
	},

	/**
	 * Watches every literal in a file for a pattern written where a name was wanted.
	 * @param context The rule context eslint hands the rule
	 * @returns The visitor eslint runs over the program
	 */
	create: function checkPatterns(context: Rule.RuleContext): Rule.RuleListener {
		return {
			/**
			 * Reads one literal and asks about a pattern written where a name was wanted.
			 * @param node The literal
			 */
			Literal: function checkLiteral(node): void {
				const isPattern = Boolean((node as {regex?: unknown}).regex);
				const parent = node.parent as Rule.Node | null;
				/* A pattern is named where it is what a constant or a field is declared to be, and nowhere else. */
				const isNamed = parent?.type === "VariableDeclarator" || parent?.type === "PropertyDefinition";

				if (isPattern && !isNamed) {
					context.report({node, messageId: "unnamed"});
				}
			}
		};
	}
};

export default rule;
