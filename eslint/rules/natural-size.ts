/**
 * An element takes its natural size unless something measured bounds it.
 * A number typed into a class is a guess at how much text will be there, at what size the reader keeps their type, and in which language.
 * A viewport unit, a percentage, a fraction or a measured custom property all survive being wrong; `h-64` does not.
 * The inline axis answers to the same rule, apart from a reading cap, which bounds a column of text rather than sizing a box.
 */
import type {Rule} from "eslint";
import {createClassVisitor} from "../../lib/class-visitor.ts";
import {describeNaturalSize} from "../../lib/classes.ts";
import type {NaturalSizeOptions} from "../../lib/types/natural-size.ts";

/** Lets content decide how big it is, on both axes. */
const rule: Rule.RuleModule = {
	meta: {
		type: "problem",
		docs: {description: "Keeps a box at its natural size unless something measured bounds it"},
		messages: {
			pinned: "{{explanation}}"
		},
		schema: [
			{
				type: "object",
				properties: {allowMaxInline: {type: "boolean"}},
				additionalProperties: false
			}
		]
	},

	/**
	 * Reads every class in a file and asks about the ones that pin a box to a length.
	 * @param context The rule context eslint hands the rule
	 * @returns The visitor eslint runs over the program
	 */
	create: function checkSizes(context: Rule.RuleContext): Rule.RuleListener {
		const [configured] = context.options as [NaturalSizeOptions | undefined];
		const allowMaxInline = configured?.allowMaxInline ?? true;

		return createClassVisitor(function reportPinned(token: string, node: Rule.Node): void {
			const explanation = describeNaturalSize(token, allowMaxInline);

			if (explanation !== "") {
				context.report({node, messageId: "pinned", data: {explanation}});
			}
		});
	}
};

export default rule;
