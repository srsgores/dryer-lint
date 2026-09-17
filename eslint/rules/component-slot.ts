/**
 * A component that cannot take children is a page written in the wrong place.
 * The default `<slot />` is how a caller fills the component; a named slot alone does not answer that.
 * Pages under `pages/` are routes, not components, and are left alone.
 */
import type {Rule} from "eslint";
import {findAttribute, isAstroContext, isAstroPage, tagNameOf} from "#lib/astro.ts";

/** Requires every Astro component to render a default `<slot />`. */
const rule: Rule.RuleModule = {
	meta: {
		type: "problem",
		docs: {description: "Requires Astro components to render a default <slot />"},
		messages: {
			missingSlot:
				"This component never renders a default <slot />. Add one so callers can pass children, or move the file under pages/ if it is a route."
		},
		schema: []
	},

	/**
	 * Watches every slot in an Astro component and asks for a default one by the end of the file.
	 * @param context The rule context eslint hands the rule
	 * @returns The visitor eslint runs over the program
	 */
	create: function checkDefaultSlot(context: Rule.RuleContext): Rule.RuleListener {
		let visitors: Rule.RuleListener = {};

		if (isAstroContext(context) && !isAstroPage(context.filename)) {
			let hasDefaultSlot = false;

			visitors = {
				/**
				 * Notes a default slot when one appears.
				 * @param node The element
				 */
				JSXElement: function noteSlot(node: unknown): void {
					if (tagNameOf(node) === "slot" && !findAttribute(node, "name")) {
						hasDefaultSlot = true;
					}
				},
				/**
				 * Reports when the file never rendered a default slot.
				 * @param node The program
				 */
				"Program:exit": function reportMissing(node): void {
					if (!hasDefaultSlot) {
						context.report({node, messageId: "missingSlot"});
					}
				}
			};
		}

		return visitors;
	}
};

export default rule;
