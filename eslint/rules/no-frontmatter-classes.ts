/**
 * A class string parked in the frontmatter is a stylesheet the markup cannot see at a glance.
 * Put the classes on the element; keep the frontmatter for values that are not style.
 * Props and imports are left alone — those are not hard-coded class lists invented in this file.
 */
import type {Rule} from "eslint";
import {attributeNameOf, isAstroContext} from "#lib/astro.ts";
import {readNode} from "#lib/nodes.ts";
import type {AstroAttribute, AstroDeclarator, AstroExpression} from "#lib/types/astro.ts";

/**
 * Answers whether an initializer is a plain string written in the frontmatter.
 * @param init The initializer
 * @returns True when it is a string literal or a static template
 */
function isHardCodedClassString(init: AstroExpression | undefined): boolean {
	return (init?.type === "Literal" && typeof init.value === "string") || (init?.type === "TemplateLiteral" && (init.expressions?.length ?? 0) === 0);
}

/**
 * Answers whether an expression mentions one of the hard-coded class bindings.
 * @param expression The expression to walk
 * @param names The frontmatter bindings that hold class strings
 * @returns True when a named binding is used
 */
function mentionsClassBinding(expression: AstroExpression | null | undefined, names: Set<string>): boolean {
	let found = false;

	if (expression && typeof expression === "object") {
		if (expression.type === "Identifier" && typeof expression.name === "string" && names.has(expression.name)) {
			found = true;
		} else {
			const children: (AstroExpression | null | undefined)[] = [
				expression.object,
				expression.property,
				expression.left,
				expression.right,
				expression.test,
				expression.consequent,
				expression.alternate,
				expression.argument,
				expression.expression,
				expression.callee,
				...(expression.elements ?? []),
				...(expression.arguments ?? []),
				...(expression.expressions ?? []),
				...(expression.properties?.map(function valueOf(property): AstroExpression | undefined {
					return property.value;
				}) ?? [])
			];

			found = children.some(function childMentions(child): boolean {
				return mentionsClassBinding(child, names);
			});
		}
	}

	return found;
}

/** Warns when hard-coded class strings live in the frontmatter instead of the markup. */
const rule: Rule.RuleModule = {
	meta: {
		type: "suggestion",
		docs: {description: "Warns when hard-coded class strings sit in Astro frontmatter instead of the markup"},
		messages: {
			frontmatterClass:
				"This class string is hard-coded in the frontmatter. Put it directly on the element (or in class:list) so the markup shows its own styles."
		},
		schema: []
	},

	/**
	 * Collects frontmatter class strings and reports when the markup uses them in class attributes.
	 * @param context The rule context eslint hands the rule
	 * @returns The visitor eslint runs over the program
	 */
	create: function checkFrontmatterClasses(context: Rule.RuleContext): Rule.RuleListener {
		let visitors: Rule.RuleListener = {};

		if (isAstroContext(context)) {
			const classBindings: Set<string> = new Set();

			visitors = {
				/**
				 * Notes a frontmatter binding whose value is a hard-coded class string.
				 * @param node The variable declarator
				 */
				VariableDeclarator: function noteBinding(node: unknown): void {
					const declarator = readNode<AstroDeclarator>(node);
					const id = declarator.id;
					const isLocal = declarator.parent?.kind === "const" || declarator.parent?.kind === "let";

					if (isLocal && id?.type === "Identifier" && typeof id.name === "string" && isHardCodedClassString(declarator.init)) {
						classBindings.add(id.name);
					}
				},
				/**
				 * Reports when a class attribute uses a frontmatter class string.
				 * @param node The attribute
				 */
				JSXAttribute: function inspectAttribute(node: unknown): void {
					const attribute = readNode<AstroAttribute>(node);
					const name = attributeNameOf(attribute);
					const expression = attribute.value?.type === "JSXExpressionContainer" ? attribute.value.expression : undefined;

					if ((name === "class" || name === "class:list") && mentionsClassBinding(expression, classBindings)) {
						context.report({node: readNode<Rule.Node>(node), messageId: "frontmatterClass"});
					}
				}
			};
		}

		return visitors;
	}
};

export default rule;
