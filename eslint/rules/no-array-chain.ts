/**
 * One walk through a list is enough.
 * Chaining `map`, `filter`, `flatMap`, `reduce` or `forEach` walks the same elements again for a second job.
 * Fold the steps into one `flatMap` or `reduce` so the list is read once and the result is built in place.
 */
import type {Rule} from "eslint";
import {readNode} from "../../lib/nodes.ts";

/** Array methods that walk every element, so chaining two of them is two passes. */
const WALKING_METHODS: Set<string> = new Set(["map", "filter", "flatMap", "reduce", "reduceRight", "forEach"]);

/**
 * Names the array method called on a value, when the call is written as `value.method(...)`.
 * @param node The call, or whatever sits where a call was expected
 * @returns The method name, or an empty string when it is not that shape
 */
function walkingMethodName(node: Rule.Node | null | undefined): string {
	let name = "";

	if (node?.type === "CallExpression") {
		const callee = readNode<{callee?: Rule.Node}>(node).callee;

		if (callee?.type === "MemberExpression" && !readNode<{computed?: boolean}>(callee).computed) {
			const property = readNode<{property?: Rule.Node}>(callee).property;

			const written = readNode<{name?: string}>(property).name ?? "";

			if (property?.type === "Identifier" && WALKING_METHODS.has(written)) {
				name = written;
			}
		}
	}

	return name;
}

/** Folds two walks through a list into the one walk that was needed. */
const rule: Rule.RuleModule = {
	meta: {
		type: "suggestion",
		docs: {description: "Forbids chaining array walks; fold them into one flatMap or reduce"},
		messages: {
			chained: "Chaining `.{{inner}}()` into `.{{outer}}()` walks the list twice. Fold both steps into one `flatMap` or `reduce`"
		},
		schema: []
	},

	/**
	 * Watches every call in a file for a walk fed straight into another walk.
	 * @param context The rule context eslint hands the rule
	 * @returns The visitor eslint runs over the program
	 */
	create: function checkArrayChains(context: Rule.RuleContext): Rule.RuleListener {
		return {
			/**
			 * Reads one call and asks about a walk fed straight into another walk.
			 * @param node The call expression
			 */
			CallExpression: function checkCall(node): void {
				const outer = walkingMethodName(node as Rule.Node);

				if (outer !== "") {
					const callee = readNode<{callee?: {object?: Rule.Node}}>(node).callee;
					const inner = walkingMethodName(callee?.object);

					if (inner !== "") {
						context.report({node: node as Rule.Node, messageId: "chained", data: {inner, outer}});
					}
				}
			}
		};
	}
};

export default rule;
