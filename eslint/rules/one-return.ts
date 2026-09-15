/**
 * One return per function.
 * A function that answers in one place reads top to bottom: the reader follows the value being built, not several ways out.
 * A guard becomes the first branch of the answer instead of a jump out.
 */
import type {Rule} from "eslint";

/** The nodes that start a function, so a return is counted against the one it stands in. */
const FUNCTION_NODES: string[] = ["FunctionDeclaration", "FunctionExpression", "ArrowFunctionExpression"];

/**
 * Answers whether a node is one of the three ways a function is written.
 * @param node The node to weigh, which is missing above the top of the file
 * @returns True when it is a function
 */
function isFunction(node: Rule.Node | null | undefined): boolean {
	return FUNCTION_NODES.includes(node?.type ?? "");
}

/**
 * Finds the function a return belongs to, walking out through whatever it is nested in.
 * A return in an Astro page's frontmatter answers for the module rather than a function, and the file itself comes back.
 * @param node The return statement
 * @returns The function it answers for, or the file when no function holds it
 */
function findAnsweringFunction(node: Rule.Node): Rule.Node {
	let owner = node.parent as Rule.Node | null;

	while (owner?.parent && !isFunction(owner)) {
		owner = owner.parent as Rule.Node;
	}

	return owner as Rule.Node;
}

/**
 * Answers whether a statement is the last one in the block it stands in.
 * @param statement The statement
 * @param block The block it stands in
 * @returns True when nothing follows it there
 */
function isLastIn(statement: Rule.Node, block: Rule.Node | null | undefined): boolean {
	return block?.type === "BlockStatement" && block.body.at(-1) === statement;
}

/**
 * Answers whether a return is the last thing its function does, rather than a jump out of the middle of it.
 * A return that ends the `try` of a trailing `try`/`finally` counts: the finally is cleanup, not another answer.
 * @param node The return statement
 * @returns True when it stands last in the function's own body
 */
function isLastStatementOfFunction(node: Rule.Node): boolean {
	const block = node.parent as Rule.Node | null;
	const owner = block?.parent as Rule.Node | null;
	const functionBody = owner?.parent as Rule.Node | null;
	let isLast = false;

	if (isFunction(owner)) {
		isLast = isLastIn(node, block);
	} else if (owner?.type === "TryStatement" && owner.finalizer && Object.is(owner.block, block)) {
		isLast = isLastIn(node, block) && isFunction(functionBody?.parent as Rule.Node | null) && isLastIn(owner, functionBody);
	}

	return isLast;
}

/** Answers in one place, so a function reads top to bottom rather than as several ways out. */
const rule: Rule.RuleModule = {
	meta: {
		type: "suggestion",
		docs: {description: "Answer in one place: a function has a single return statement, at its end"},
		schema: [],
		messages: {
			tooManyReturns: "This function returns in {{count}} places. Build the answer in one variable and return it once, at the end.",
			earlyReturn: "This returns before the end of the function. Make it a branch of the answer, and return that once, at the end."
		}
	},

	/**
	 * Watches every return in a file and asks about the second one in any function.
	 * @param context The rule context eslint hands the rule
	 * @returns The visitor eslint runs over the program
	 */
	create: function watchReturns(context: Rule.RuleContext): Rule.RuleListener {
		/** How many returns each function walked so far has, so the second one in any of them is reported. */
		const returnCounts: Map<Rule.Node, number> = new Map();

		return {
			/**
			 * Weighs one return against the function it answers for.
			 * @param node The return statement
			 */
			ReturnStatement: function weighReturn(node): void {
				const answering = findAnsweringFunction(node as Rule.Node);

				/* A page's frontmatter redirects by returning, and has no function to build an answer in. */
				if (isFunction(answering)) {
					const counted = (returnCounts.get(answering) ?? 0) + 1;

					returnCounts.set(answering, counted);

					if (counted > 1) {
						context.report({node, messageId: "tooManyReturns", data: {count: String(counted)}});
					} else if (!isLastStatementOfFunction(node as Rule.Node)) {
						context.report({node, messageId: "earlyReturn"});
					}
				}
			}
		};
	}
};

export default rule;
