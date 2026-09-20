/**
 * A function belongs at the top of the file, where the reader looks for what a module can do.
 * Nested inside another function, it hides its dependencies in a closure and cannot be read or tested on its own.
 * An inline function passed once as a callback or returned as an answer is left alone.
 * Everywhere else, move the function to the top of the file or write it inline where it is used.
 */
import type {Rule} from "eslint";

/** The function node types that can enclose another function. */
const FUNCTION_NODES: Set<string> = new Set(["FunctionDeclaration", "FunctionExpression", "ArrowFunctionExpression"]);

/**
 * Answers whether a node sits inside an enclosing function.
 * @param node The AST node to check
 * @returns True when an ancestor is a function
 */
function isInsideFunction(node: Rule.Node): boolean {
	let ancestor = node.parent as Rule.Node | null;
	let inside = false;

	while (ancestor && !inside) {
		if (FUNCTION_NODES.has(ancestor.type)) {
			inside = true;
		} else {
			ancestor = ancestor.parent as Rule.Node | null;
		}
	}

	return inside;
}

/**
 * Reports a function that was declared inside another function rather than at the top of the file.
 * @param context The rule context
 * @param node The function or declarator node to report
 * @param name The name of the function, when it has one
 */
function reportNested(context: Rule.RuleContext, node: Rule.Node, name?: string): void {
	if (name) {
		context.report({node, messageId: "nested", data: {name}});
	} else {
		context.report({node, messageId: "nestedUnnamed"});
	}
}

/** Keeps reusable functions at the top of the file and single-use ones inline. */
const rule: Rule.RuleModule = {
	meta: {
		type: "suggestion",
		docs: {description: "Keep functions at the top of the file, or write them inline when used only once"},
		messages: {
			nested: "{{name}} is nested inside another function. Put the function at the top of the file, or use an inline named function if it is used only once.",
			nestedUnnamed:
				"This function is nested inside another function. Put the function at the top of the file, or use an inline named function if it is used only once."
		},
		schema: []
	},

	/**
	 * Watches every function and declarator for one declared inside another function.
	 * @param context The rule context eslint hands the rule
	 * @returns The visitor eslint runs over the program
	 */
	create: function checkTopLevelFunctions(context: Rule.RuleContext): Rule.RuleListener {
		return {
			/**
			 * Inspects a function declaration for one nested inside another function.
			 * @param node The function declaration
			 */
			FunctionDeclaration: function inspectFunctionDeclaration(node): void {
				const declaration = node as Rule.Node & {id?: {name?: string}};

				if (isInsideFunction(declaration)) {
					reportNested(context, declaration, declaration.id?.name);
				}
			},
			/**
			 * Inspects a variable declarator for a function assigned inside another function.
			 * @param node The variable declarator
			 */
			VariableDeclarator: function inspectVariableDeclarator(node): void {
				const declarator = node as Rule.Node & {id?: {name?: string}; init?: Rule.Node | null};

				if (declarator.init && FUNCTION_NODES.has(declarator.init.type) && isInsideFunction(declarator)) {
					reportNested(context, declarator, declarator.id?.name);
				}
			},
			/**
			 * Inspects an assignment expression for a function assigned inside another function.
			 * @param node The assignment expression
			 */
			AssignmentExpression: function inspectAssignmentExpression(node): void {
				const assignment = node as Rule.Node & {left?: {name?: string}; right?: Rule.Node};

				if (assignment.right && FUNCTION_NODES.has(assignment.right.type) && isInsideFunction(assignment)) {
					reportNested(context, assignment, assignment.left?.name);
				}
			}
		};
	}
};

export default rule;
