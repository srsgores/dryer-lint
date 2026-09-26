/**
 * The HTML `hidden` attribute removes an element from the rendering tree and the accessibility tree.
 * Assistive technologies and screen readers will not announce elements marked with `hidden` or styled with `display: none`.
 * Content that should be hidden visually but accessible to assistive technologies should use `sr-only` instead.
 */
import type {Rule} from "eslint";
import {readNode} from "#lib/nodes.ts";
import type {HtmlAttributeNode, JsxAttributeNode, SvelteAttributeNode, SvelteShorthandNode} from "#lib/types/markup.ts";

/**
 * Answers whether a JSX attribute value is explicitly set to boolean false.
 * @param attribute The JSX attribute
 * @returns True when the value is explicitly false
 */
function isJsxExplicitlyFalse(attribute: JsxAttributeNode): boolean {
	const value = attribute.value;
	let isFalse = false;

	if (value?.type === "JSXExpressionContainer") {
		isFalse = value.expression?.type === "Literal" && value.expression.value === false;
	} else if (value?.type === "Literal") {
		isFalse = value.value === false;
	}

	return isFalse;
}

/**
 * Answers whether a Svelte attribute value is explicitly set to boolean false.
 * @param attribute The Svelte attribute
 * @returns True when the value is explicitly false
 */
function isSvelteExplicitlyFalse(attribute: SvelteAttributeNode): boolean {
	let isFalse = false;

	if (Array.isArray(attribute.value) && attribute.value.length === 1) {
		const [item] = attribute.value;
		if (item?.type === "SvelteMustacheTag" && item.expression?.type === "Literal") {
			isFalse = item.expression.value === false;
		}
	}

	return isFalse;
}

/**
 * Checks a JSX hidden attribute and warns when it hides content.
 * @param context The rule context
 * @param node The JSX attribute node
 */
function inspectJsxHidden(context: Rule.RuleContext, node: unknown): void {
	const attribute = readNode<JsxAttributeNode>(node);

	if (!isJsxExplicitlyFalse(attribute)) {
		context.report({node: readNode<Rule.Node>(node), messageId: "hiddenAttribute"});
	}
}

/**
 * Checks a Svelte hidden attribute and warns when it hides content.
 * @param context The rule context
 * @param node The Svelte attribute node
 */
function inspectSvelteHidden(context: Rule.RuleContext, node: unknown): void {
	const attribute = readNode<SvelteAttributeNode>(node);

	if (!isSvelteExplicitlyFalse(attribute)) {
		context.report({node: readNode<Rule.Node>(node), messageId: "hiddenAttribute"});
	}
}

/**
 * Checks a Svelte shorthand hidden attribute like `{hidden}` and warns.
 * @param context The rule context
 * @param node The Svelte shorthand attribute node
 */
function inspectSvelteShorthand(context: Rule.RuleContext, node: unknown): void {
	const attribute = readNode<SvelteShorthandNode>(node);

	if (attribute.key?.name === "hidden") {
		context.report({node: readNode<Rule.Node>(node), messageId: "hiddenAttribute"});
	}
}

/**
 * Checks an HTML hidden attribute and warns.
 * @param context The rule context
 * @param node The HTML attribute node
 */
function inspectHtmlHidden(context: Rule.RuleContext, node: unknown): void {
	const attribute = readNode<HtmlAttributeNode>(node);

	if (attribute.key?.value === "hidden") {
		context.report({node: readNode<Rule.Node>(node), messageId: "hiddenAttribute"});
	}
}

/** Warns when elements use the `hidden` attribute because screen readers will not announce them. */
const rule: Rule.RuleModule = {
	meta: {
		type: "suggestion",
		docs: {
			description: "Warns against using the hidden attribute because screen readers will not announce hidden elements"
		},
		messages: {
			hiddenAttribute:
				"Screen-readers will not announce elements with `display: none` or `hidden`. Use `sr-only` if the element should remain accessible to assistive technology."
		},
		schema: []
	},

	/**
	 * Reads attributes across JSX, Svelte and HTML templates and warns about the `hidden` attribute.
	 * @param context The rule context eslint hands the rule
	 * @returns The visitor eslint runs over the program
	 */
	create: function checkHiddenAttribute(context: Rule.RuleContext): Rule.RuleListener {
		return {
			"JSXAttribute[name.name='hidden']": function checkJsx(node: unknown): void {
				inspectJsxHidden(context, node);
			},
			"SvelteAttribute[key.name='hidden']": function checkSvelte(node: unknown): void {
				inspectSvelteHidden(context, node);
			},
			"SvelteShorthandAttribute[key.name='hidden']": function checkSvelteShorthand(node: unknown): void {
				inspectSvelteShorthand(context, node);
			},
			"Attribute[key.value='hidden']": function checkHtml(node: unknown): void {
				inspectHtmlHidden(context, node);
			}
		};
	}
};

export default rule;
