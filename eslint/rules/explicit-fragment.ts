/**
 * A short fragment `<>` hides from search and from readers who look for the word Fragment.
 * Write `<Fragment>` so the grouping is named the same way Astro already provides it globally.
 */
import type {Rule} from "eslint";
import {isAstroContext} from "#lib/astro.ts";
import {readNode} from "#lib/nodes.ts";

/** Forbids the shorthand fragment in Astro files; require an explicit `<Fragment>`. */
const rule: Rule.RuleModule = {
	meta: {
		type: "problem",
		docs: {description: "Requires explicit <Fragment> instead of <> in Astro files"},
		messages: {
			shorthand: "Use <Fragment> instead of <>. The short form hides from search and from readers looking for the word Fragment."
		},
		schema: []
	},

	/**
	 * Reports every shorthand fragment in an Astro file.
	 * @param context The rule context eslint hands the rule
	 * @returns The visitor eslint runs over the program
	 */
	create: function checkFragments(context: Rule.RuleContext): Rule.RuleListener {
		let visitors: Rule.RuleListener = {};

		if (isAstroContext(context)) {
			visitors = {
				/**
				 * Reports one shorthand fragment.
				 * @param node The fragment
				 */
				JSXFragment: function reportShorthand(node: unknown): void {
					context.report({node: readNode<Rule.Node>(node), messageId: "shorthand"});
				}
			};
		}

		return visitors;
	}
};

export default rule;
