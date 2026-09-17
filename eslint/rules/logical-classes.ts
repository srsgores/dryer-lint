/**
 * A class name is a stylesheet written where stylelint cannot see it.
 * `mt-4` says "the top of the screen"; `mbs-4` says "before the text starts", which is the same edge until the writing turns around.
 * Every physical utility in a class attribute is asked for again by its logical name, variants, negations and arbitrary values included.
 */
import type {Rule} from "eslint";
import {createClassVisitor} from "#lib/class-visitor.ts";
import {describePhysicalClass} from "#lib/classes.ts";

/** Names the logical class a physical one should have been written as. */
const rule: Rule.RuleModule = {
	meta: {
		type: "problem",
		docs: {description: "Keeps class names logical, so a layout follows the writing rather than the screen"},
		messages: {
			physical: "{{explanation}}"
		},
		schema: []
	},

	/**
	 * Reads every class in a file and asks about the ones that name a side of the screen.
	 * @param context The rule context eslint hands the rule
	 * @returns The visitor eslint runs over the program
	 */
	create: function checkClassNames(context: Rule.RuleContext): Rule.RuleListener {
		return createClassVisitor(function reportPhysical(token: string, node: Rule.Node): void {
			const explanation = describePhysicalClass(token);

			if (explanation !== "") {
				context.report({node, messageId: "physical", data: {explanation}});
			}
		});
	}
};

export default rule;
