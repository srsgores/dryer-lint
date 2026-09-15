/**
 * An array value is read by destructuring what it contains rather than pointing at where it sits.
 * Destructuring names the element where it is drawn out and keeps the index from drifting silently.
 */
import type {Rule} from "eslint";

/** A positive integer, written as the index of an element. */
const INTEGER_INDEX_PATTERN: RegExp = /^\d+$/;

/**
 * Answers whether a property literal is a numeric array index.
 * @param property The literal value to weigh
 * @returns True when the value is a non-negative integer index
 */
function isNumericIndex(property: unknown): boolean {
	let matches = false;

	if (typeof property === "number" && Number.isInteger(property) && property >= 0) {
		matches = true;
	} else if (typeof property === "string" && INTEGER_INDEX_PATTERN.test(property)) {
		matches = true;
	}

	return matches;
}

/** Draws array elements out by name rather than by the place they happen to sit in. */
const rule: Rule.RuleModule = {
	meta: {
		type: "suggestion",
		docs: {description: "Encourages destructuring array values rather than accessing them by numeric index"},
		messages: {
			destructure: "only access array values by destructuring"
		},
		schema: []
	},

	/**
	 * Watches every member access for an element picked out by its position.
	 * @param context The rule context eslint hands the rule
	 * @returns The visitor eslint runs over the program
	 */
	create: function checkArrayAccess(context: Rule.RuleContext): Rule.RuleListener {
		return {
			/**
			 * Reads one member access and asks about an element picked out by its position.
			 * @param node The member expression
			 */
			MemberExpression: function checkMember(node): void {
				if (node.computed && node.property.type === "Literal" && isNumericIndex(node.property.value)) {
					context.report({node, messageId: "destructure"});
				}
			}
		};
	}
};

export default rule;
