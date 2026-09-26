/**
 * The `hidden` utility sets `display: none`, removing content from both the visual page and the accessibility tree.
 * Use `sr-only` and `not-sr-only` so content remains accessible to screen readers while visually hidden.
 * When content must be removed from both sighted and screen reader users, use the HTML `hidden` attribute instead.
 */
import type {Rule} from "eslint";
import {splitClassNames, utilityOf} from "#lib/classes.ts";
import {readNode} from "#lib/nodes.ts";
import type {HtmlAttributeNode, JsxAttributeNode, SvelteAttributeNode, SvelteDirectiveNode} from "#lib/types/markup.ts";

/**
 * Checks a class string for the `hidden` utility and reports any occurrences.
 * @param context The rule context eslint hands the rule
 * @param text The string containing class names
 * @param node The AST node to report against
 */
function checkClassString(context: Rule.RuleContext, text: unknown, node: Rule.Node): void {
	if (typeof text === "string") {
		for (const token of splitClassNames(text)) {
			if (utilityOf(token) === "hidden") {
				context.report({node, messageId: "noHiddenClass", data: {token}});
			}
		}
	}
}

/**
 * Checks a JSX class attribute for the `hidden` utility.
 * @param context The rule context
 * @param node The JSX attribute node
 */
function inspectJsxAttribute(context: Rule.RuleContext, node: unknown): void {
	const attribute = readNode<JsxAttributeNode>(node);
	const value = attribute.value;
	const target = readNode<Rule.Node>(node);

	if (value?.type === "Literal") {
		checkClassString(context, value.value, target);
	} else if (value?.type === "JSXExpressionContainer") {
		const expression = value.expression;

		if (expression?.type === "Literal") {
			checkClassString(context, expression.value, target);
		} else if (expression?.type === "TemplateLiteral" && Array.isArray(expression.quasis)) {
			for (const quasi of expression.quasis) {
				checkClassString(context, quasi.value?.cooked ?? quasi.value?.raw, target);
			}
		}
	}
}

/**
 * Checks a Svelte class attribute for the `hidden` utility.
 * @param context The rule context
 * @param node The Svelte attribute node
 */
function inspectSvelteAttribute(context: Rule.RuleContext, node: unknown): void {
	const attribute = readNode<SvelteAttributeNode>(node);

	if (Array.isArray(attribute.value)) {
		const target = readNode<Rule.Node>(node);

		for (const part of attribute.value) {
			if (part.type === "SvelteLiteral") {
				checkClassString(context, part.value, target);
			} else if (part.type === "SvelteMustacheTag" && part.expression?.type === "Literal") {
				checkClassString(context, part.expression.value, target);
			}
		}
	}
}

/**
 * Checks a Svelte class directive for the `hidden` utility.
 * @param context The rule context
 * @param node The Svelte directive node
 */
function inspectSvelteDirective(context: Rule.RuleContext, node: unknown): void {
	const directive = readNode<SvelteDirectiveNode>(node);
	const written = directive.key?.name;
	const name = typeof written === "object" ? written?.name : written;

	if (typeof name === "string" && utilityOf(name) === "hidden") {
		context.report({node: readNode<Rule.Node>(node), messageId: "noHiddenClass", data: {token: name}});
	}
}

/**
 * Checks an HTML class attribute for the `hidden` utility.
 * @param context The rule context
 * @param node The HTML attribute node
 */
function inspectHtmlAttribute(context: Rule.RuleContext, node: unknown): void {
	const attribute = readNode<HtmlAttributeNode>(node);
	checkClassString(context, attribute.value?.value, readNode<Rule.Node>(node));
}

/** Disallows using the Tailwind `hidden` utility class. */
const rule: Rule.RuleModule = {
	meta: {
		type: "problem",
		docs: {
			description: "Disallows using the Tailwind hidden utility class, enforcing sr-only and not-sr-only or the hidden attribute"
		},
		messages: {
			noHiddenClass:
				"Do not use `{{token}}`. Use `sr-only` and `not-sr-only` to control visibility for screen readers, or use the `hidden` attribute if the element must be hidden completely."
		},
		schema: []
	},

	/**
	 * Reads class attributes in markup and reports uses of the `hidden` utility.
	 * @param context The rule context eslint hands the rule
	 * @returns The visitor eslint runs over the program
	 */
	create: function checkHiddenClasses(context: Rule.RuleContext): Rule.RuleListener {
		return {
			"JSXAttribute[name.name=/^(class|className)$/]": function checkJsx(node: unknown): void {
				inspectJsxAttribute(context, node);
			},
			"SvelteAttribute[key.name='class']": function checkSvelte(node: unknown): void {
				inspectSvelteAttribute(context, node);
			},
			"SvelteDirective[kind='Class']": function checkSvelteDirective(node: unknown): void {
				inspectSvelteDirective(context, node);
			},
			"Attribute[key.value='class']": function checkHtml(node: unknown): void {
				inspectHtmlAttribute(context, node);
			}
		};
	}
};

export default rule;
