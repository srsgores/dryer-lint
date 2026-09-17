/**
 * A ternary or a logical expression in `class` is a class list written by hand.
 * Astro's `class:list` already drops falsy values and joins the rest; write the condition there instead.
 * A bare identifier in `class={className}` is prop forwarding and is left alone.
 */
import type {Rule} from "eslint";
import {attributeNameOf, isAstroContext} from "#lib/astro.ts";
import {readNode} from "#lib/nodes.ts";
import type {AstroAttribute, AstroExpression} from "#lib/types/astro.ts";

/**
 * Answers whether an expression is a ternary or a `||` / `&&` that belongs in `class:list`.
 * @param expression The expression inside `class={...}`
 * @returns True when `class:list` should have been used
 */
function isConditionalClass(expression: AstroExpression | undefined): boolean {
	return (
		expression?.type === "ConditionalExpression" ||
		(expression?.type === "LogicalExpression" && (expression.operator === "||" || expression.operator === "&&"))
	);
}

/** Requires conditional class expressions to use Astro's `class:list` directive. */
const rule: Rule.RuleModule = {
	meta: {
		type: "problem",
		docs: {description: "Requires class:list for ternary, || and && class expressions in Astro"},
		messages: {
			useClassList: "Put this ternary or logical expression in class:list={...} instead of class={...}."
		},
		schema: []
	},

	/**
	 * Reads every `class` attribute in an Astro file and asks about conditionals written there.
	 * @param context The rule context eslint hands the rule
	 * @returns The visitor eslint runs over the program
	 */
	create: function checkClassList(context: Rule.RuleContext): Rule.RuleListener {
		let visitors: Rule.RuleListener = {};

		if (isAstroContext(context)) {
			visitors = {
				/**
				 * Asks about one attribute that may be a conditional class.
				 * @param node The attribute
				 */
				JSXAttribute: function inspectAttribute(node: unknown): void {
					const attribute = readNode<AstroAttribute>(node);
					const value = attribute.value;

					if (attributeNameOf(attribute) === "class" && value?.type === "JSXExpressionContainer" && isConditionalClass(value.expression)) {
						context.report({node: readNode<Rule.Node>(node), messageId: "useClassList"});
					}
				}
			};
		}

		return visitors;
	}
};

export default rule;
