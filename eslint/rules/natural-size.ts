/**
 * An element takes its natural size unless something measured bounds it.
 * A number typed into a class is a guess at how much text will be there, at what size the reader keeps their type, and in which language.
 * A viewport unit, a percentage, a fraction or a measured custom property all survive being wrong; `h-64` does not.
 * The same decision hides in a `style` attribute, so those declarations are asked the same question.
 * The inline axis answers to the same rule, apart from a reading cap, which bounds a column of text rather than sizing a box.
 */
import type {Rule} from "eslint";
import {createClassVisitor} from "#lib/class-visitor.ts";
import {describeNaturalSize, describePinnedDeclaration} from "#lib/classes.ts";
import {createStyleVisitor} from "#lib/style-visitor.ts";
import type {NaturalSizeOptions} from "#lib/types/natural-size.ts";

/**
 * Runs two visitors that share selector names by calling both handlers.
 * @param left The first visitor
 * @param right The second visitor
 * @returns One visitor that does both jobs
 */
function mergeVisitors(left: Rule.RuleListener, right: Rule.RuleListener): Rule.RuleListener {
	const names = new Set([...Object.keys(left), ...Object.keys(right)]);
	const merged: Rule.RuleListener = {};

	for (const name of names) {
		const first = left[name as keyof Rule.RuleListener];
		const second = right[name as keyof Rule.RuleListener];

		merged[name as keyof Rule.RuleListener] = function runBoth(node: Rule.Node): void {
			if (typeof first === "function") {
				(first as (node: Rule.Node) => void)(node);
			}

			if (typeof second === "function") {
				(second as (node: Rule.Node) => void)(node);
			}
		} as Rule.RuleListener[keyof Rule.RuleListener];
	}

	return merged;
}

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
	 * Reads every class and every style declaration in a file and asks about the ones that pin a box to a length.
	 * @param context The rule context eslint hands the rule
	 * @returns The visitor eslint runs over the program
	 */
	create: function checkSizes(context: Rule.RuleContext): Rule.RuleListener {
		const [configured] = context.options as [NaturalSizeOptions | undefined];
		const allowMaxInline = configured?.allowMaxInline ?? true;

		const classes = createClassVisitor(function reportPinnedClass(token: string, node: Rule.Node): void {
			const explanation = describeNaturalSize(token, allowMaxInline);

			if (explanation !== "") {
				context.report({node, messageId: "pinned", data: {explanation}});
			}
		});

		const styles = createStyleVisitor(function reportPinnedStyle(property: string, value: string, node: Rule.Node): void {
			const explanation = describePinnedDeclaration(property, value, allowMaxInline);

			if (explanation !== "") {
				context.report({node, messageId: "pinned", data: {explanation}});
			}
		});

		return mergeVisitors(classes, styles);
	}
};

export default rule;
