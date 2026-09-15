/**
 * A break statement belongs to a switch.
 * In a loop, it jumps out of iteration the way an early return jumps out of a function.
 * That abandons the structure the loop set up and hides the condition that actually ends it.
 * Let the loop run to its natural end, or express the exit with an array method like `find` or `some`.
 */
import type {Rule} from "eslint";
import {readNode} from "../../lib/nodes.ts";

/** The loop statements that a break jumps out of when it is not inside a switch. */
const LOOP_NODES: Set<string> = new Set(["ForStatement", "ForInStatement", "ForOfStatement", "WhileStatement", "DoWhileStatement"]);

/** The function nodes where walking stops, since a break cannot cross a function boundary. */
const FUNCTION_NODES: Set<string> = new Set(["FunctionDeclaration", "FunctionExpression", "ArrowFunctionExpression"]);

/**
 * Answers whether a labelled break names a switch rather than a loop.
 * @param node The break statement
 * @param labelName The label it names
 * @returns True when the label belongs to a switch
 */
function breaksLabelledSwitch(node: Rule.Node, labelName: string): boolean {
	let statement = node.parent as Rule.Node | null;
	let isSwitch = false;

	while (statement && !FUNCTION_NODES.has(statement.type)) {
		const labelled = readNode<{label?: {name?: string}; body?: {type?: string}}>(statement);

		if (statement.type === "LabeledStatement" && labelled.label?.name === labelName) {
			isSwitch = labelled.body?.type === "SwitchStatement";
			statement = null;
		} else {
			statement = statement.parent as Rule.Node | null;
		}
	}

	return isSwitch;
}

/**
 * Answers whether a break targets a switch statement rather than a loop.
 * @param node The break statement
 * @returns True when the statement breaks a switch
 */
function isSwitchBreak(node: Rule.Node): boolean {
	const labelName = readNode<{label?: {name?: string}}>(node).label?.name;
	let isSwitch = false;

	if (typeof labelName === "string") {
		isSwitch = breaksLabelledSwitch(node, labelName);
	} else {
		let statement = node.parent as Rule.Node | null;

		while (statement && !FUNCTION_NODES.has(statement.type)) {
			if (statement.type === "SwitchStatement") {
				isSwitch = true;
				statement = null;
			} else if (LOOP_NODES.has(statement.type)) {
				isSwitch = false;
				statement = null;
			} else {
				statement = statement.parent as Rule.Node | null;
			}
		}
	}

	return isSwitch;
}

/** Keeps a break inside the switch it belongs to, and out of the loops it hides the end of. */
const rule: Rule.RuleModule = {
	meta: {
		type: "suggestion",
		docs: {description: "Forbids break outside of switch statements"},
		messages: {
			outsideSwitch: "Break belongs to a switch. Let the loop run to its natural end or use an array method"
		},
		schema: []
	},

	/**
	 * Watches every break in a file for one that jumps out of a loop.
	 * @param context The rule context eslint hands the rule
	 * @returns The visitor eslint runs over the program
	 */
	create: function checkBreaks(context: Rule.RuleContext): Rule.RuleListener {
		return {
			/**
			 * Reads one break and asks about it when it jumps out of a loop.
			 * @param node The break statement
			 */
			BreakStatement: function inspectBreak(node): void {
				if (!isSwitchBreak(node as Rule.Node)) {
					context.report({node, messageId: "outsideSwitch"});
				}
			}
		};
	}
};

export default rule;
