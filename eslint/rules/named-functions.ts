/**
 * An arrow function is for the one thing only an arrow can do: borrow `this` from around it.
 * Everywhere else it costs the name a reader would have used to find out what the function is for.
 * `records.map(function toClientOption(client) {...})` says what the map is making; `(c) => ...` says nothing.
 * So an arrow that never mentions `this` is a named function with the name left off.
 * It is asked for again, written the long way, with a name that says what it is for.
 */
import type {Rule} from "eslint";
import type {WalkedFunction} from "../../lib/types/walked-function.ts";

/** Keeps arrows for borrowing `this`, and asks for a name everywhere else. */
const rule: Rule.RuleModule = {
	meta: {
		type: "suggestion",
		docs: {description: "Keeps arrow functions for the one thing they are for, which is borrowing `this`"},
		messages: {
			unnamed: "This arrow function never uses `this`, so it is a function with the name left off. Write it as `function whatItDoes(...)`"
		},
		schema: []
	},

	/**
	 * Walks every function in a file and asks about each arrow that borrowed nothing.
	 * @param context The rule context eslint hands the rule
	 * @returns The visitor eslint runs over the program
	 */
	create: function checkArrows(context: Rule.RuleContext): Rule.RuleListener {
		/** The functions being walked through, innermost last, so a `this` is credited to the one it belongs to. */
		const walked: WalkedFunction[] = [];

		/**
		 * Remembers a function while its body is walked.
		 * @param node The function
		 * @param isArrow Whether it is an arrow
		 */
		function enter(node: Rule.Node, isArrow: boolean): void {
			walked.push({node, isArrow, borrowsThis: false});
		}

		/** Finishes with a function, and asks about it if it was an arrow that never borrowed anything. */
		function leave(): void {
			const finished = walked.pop();

			if (finished?.isArrow && !finished.borrowsThis) {
				context.report({node: finished.node, messageId: "unnamed"});
			}
		}

		return {
			ArrowFunctionExpression: function enterArrow(node): void {
				enter(node as Rule.Node, true);
			},
			"ArrowFunctionExpression:exit": leave,
			FunctionDeclaration: function enterDeclaration(node): void {
				enter(node as Rule.Node, false);
			},
			"FunctionDeclaration:exit": leave,
			FunctionExpression: function enterExpression(node): void {
				enter(node as Rule.Node, false);
			},
			"FunctionExpression:exit": leave,
			/*
			 * A `this` belongs to the nearest function that binds one, and an arrow binds none.
			 * So every arrow up to and including the first non-arrow has borrowed it.
			 */
			/**
			 * Credits a `this` to every arrow up to the first function that binds one.
			 */
			ThisExpression: function creditThis(): void {
				let index = walked.length - 1;
				let walking = walked.at(index);

				while (index >= 0 && walking?.isArrow) {
					walking.borrowsThis = true;
					index -= 1;
					walking = walked.at(index);
				}
			}
		};
	}
};

export default rule;
