/**
 * Astro's Image and Picture already know how to build srcset and sizes once they have a layout.
 * Ask for `inferSize` and a real layout (`constrained`, `full-width` or `fixed`) so the house does not hand-write sizes.
 * `layout="none"` opts out of that work and is treated the same as leaving layout off.
 */
import type {Rule} from "eslint";
import {findAttribute, isAstroContext, tagNameOf} from "#lib/astro.ts";
import {readNode} from "#lib/nodes.ts";
import type {AstroAttribute} from "#lib/types/astro.ts";

/** Layout values that ask Astro to generate responsive attributes. */
const RESPONSIVE_LAYOUTS: Set<string> = new Set(["constrained", "full-width", "fixed"]);

/**
 * Reads a literal from an attribute, whether written bare, as a string, or as `{...}`.
 * @param attribute The attribute, if any
 * @returns The literal value, true when the attribute is a boolean flag, or undefined
 */
function literalOf(attribute: AstroAttribute | undefined): unknown {
	const value = attribute?.value;
	let literal: unknown;

	if (!attribute) {
		literal = undefined;
	} else if (!value) {
		literal = true;
	} else if (value.type === "Literal") {
		literal = value.value;
	} else if (value.expression?.type === "Literal") {
		literal = value.expression.value;
	}

	return literal;
}

/** Warns when Image or Picture skip inferSize or a responsive layout. */
const rule: Rule.RuleModule = {
	meta: {
		type: "suggestion",
		docs: {description: "Warns when Astro Image or Picture omit inferSize or a responsive layout"},
		messages: {
			missingLayout:
				'Set inferSize and layout="constrained", "full-width" or "fixed" on <{{tag}}> so Astro generates srcset and sizes. Do not hand-write sizes.'
		},
		schema: []
	},

	/**
	 * Reads every Image and Picture in an Astro file and asks about missing inferSize or layout.
	 * @param context The rule context eslint hands the rule
	 * @returns The visitor eslint runs over the program
	 */
	create: function checkImageLayout(context: Rule.RuleContext): Rule.RuleListener {
		let visitors: Rule.RuleListener = {};

		if (isAstroContext(context)) {
			visitors = {
				/**
				 * Asks about one Image or Picture.
				 * @param node The element
				 */
				JSXElement: function inspectImage(node: unknown): void {
					const tag = tagNameOf(node);
					const inferSize = literalOf(findAttribute(node, "inferSize"));
					const layout = literalOf(findAttribute(node, "layout"));
					const ready = inferSize !== undefined && inferSize !== false && typeof layout === "string" && RESPONSIVE_LAYOUTS.has(layout);

					if ((tag === "Image" || tag === "Picture") && !ready) {
						context.report({node: readNode<Rule.Node>(node), messageId: "missingLayout", data: {tag}});
					}
				}
			};
		}

		return visitors;
	}
};

export default rule;
