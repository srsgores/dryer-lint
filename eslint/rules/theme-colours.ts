/**
 * A colour written by hand belongs to nothing.
 * It cannot answer to the theme, so it stays the same in the dark as in the light.
 * Every colour is a token the stylesheet defines, or one of Tailwind's own.
 * The stylesheet is held to the same rule by stylelint, which also insists the tokens are written in oklch.
 */
import type {Rule} from "eslint";
import {readNode} from "#lib/nodes.ts";

/** A colour written out, as a hex triplet or as one of the functions that take channels. */
const WRITTEN_COLOUR: RegExp = /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\s*\(/i;

/** Where a colour written out is the thing being defined rather than used: the stylesheet's own tokens. */
const DEFINES_TOKENS: RegExp = /\.css$/;

/** Keeps colours in the theme, where both modes and every screen can see them. */
const rule: Rule.RuleModule = {
	meta: {
		type: "suggestion",
		docs: {description: "Keeps colours in the theme, where both modes and every screen can see them"},
		messages: {
			written:
				"This colour is written by hand, so nothing can theme it. Name it in the stylesheet as a token and use `var(--its-name)`, or use a Tailwind colour"
		},
		schema: []
	},

	/**
	 * Watches every string in a file for a colour somebody typed out.
	 * @param context The rule context eslint hands the rule
	 * @returns The visitor eslint runs over the program
	 */
	create: function checkColours(context: Rule.RuleContext): Rule.RuleListener {
		return {
			/**
			 * Reads one string and asks about a colour somebody typed out.
			 * @param node The literal
			 */
			Literal: function checkLiteral(node): void {
				const isWrittenColour = typeof node.value === "string" && WRITTEN_COLOUR.test(node.value);

				if (isWrittenColour && !DEFINES_TOKENS.test(context.filename)) {
					context.report({node, messageId: "written"});
				}
			},
			/**
			 * Reads one piece of a template and asks about a colour somebody typed out.
			 * @param node The template part
			 */
			TemplateElement: function checkTemplatePart(node): void {
				if (WRITTEN_COLOUR.test(node.value.raw) && !DEFINES_TOKENS.test(context.filename)) {
					context.report({node: readNode<Rule.Node>(node), messageId: "written"});
				}
			}
		};
	}
};

export default rule;
