/**
 * Every place a class name can be written, gathered once so two rules read markup the same way.
 * A class name hides from stylelint by living in an attribute, so eslint is the only thing that ever sees it.
 */
import type {Rule} from "eslint";
import {splitClassNames} from "#lib/classes.ts";
import {readNode} from "#lib/nodes.ts";
import type {ClassReporter, ClassStringNode, WrittenName} from "#lib/types/class-visitor.ts";

/** A prop that names a corner of the screen rather than a class, and reads like one. */
const NOT_CLASSES: Set<string> = new Set(["position", "side", "align", "placement", "anchor", "origin"]);

/**
 * Names the attribute a string was written into, so a prop that only looks like a class list is left alone.
 * @param node The string node
 * @returns The attribute's name, or an empty string when the string is not an attribute value
 */
function attributeNameOf(node: ClassStringNode): string {
	const parent = node.parent;
	const svelteName = parent?.key?.name;
	const jsxName = parent?.name?.name;
	let name = "";

	if (typeof svelteName === "string") {
		name = svelteName;
	} else if (typeof jsxName === "string") {
		name = jsxName;
	}

	return name;
}

/**
 * Reads the name a directive gives itself, which the parser nests one level deeper than an attribute does.
 * @param written The directive's key name, flat or nested
 * @returns The name, or an empty string when the directive has none
 */
function directiveNameOf(written: WrittenName): string {
	let name = "";

	if (typeof written === "string") {
		name = written;
	} else if (typeof written?.name === "string") {
		name = written.name;
	}

	return name;
}

/**
 * Hands every class in one string to the reporter.
 * @param report The reporter, called with each class and the node it was written on
 * @param text The string as it was written
 * @param node The node the string belongs to
 */
function inspect(report: ClassReporter, text: unknown, node: ClassStringNode): void {
	const isClassList = typeof text === "string" && !NOT_CLASSES.has(attributeNameOf(node));

	if (isClassList) {
		for (const token of splitClassNames(text as string)) {
			report(token, readNode<Rule.Node>(node));
		}
	}
}

/**
 * Builds the visitor both class rules run, which hands every class in a file to one reporter.
 * @param report The reporter, called with each class and the node it was written on
 * @returns The visitor eslint runs over the program
 */
export function createClassVisitor(report: ClassReporter): Rule.RuleListener {
	return {
		Literal: function readLiteral(node): void {
			inspect(report, node.value, readNode<ClassStringNode>(node));
		},
		TemplateElement: function readTemplatePart(node): void {
			inspect(report, node.value.cooked ?? node.value.raw, readNode<ClassStringNode>(node));
		},
		/**
		 * Reads a svelte attribute's text, which the parser keeps in a node of its own.
		 * @param node The svelte literal
		 */
		SvelteLiteral: function readSvelteLiteral(node: unknown): void {
			const literal = node as ClassStringNode;

			inspect(report, literal.value, literal);
		},
		/**
		 * Reads a `class:` directive, whose name is the class it applies.
		 * @param node The svelte directive
		 */
		SvelteDirective: function readSvelteDirective(node: unknown): void {
			const directive = node as ClassStringNode;
			const written = directiveNameOf(directive.key?.name);

			if (directive.kind === "Class" && written !== "") {
				report(written, readNode<Rule.Node>(directive));
			}
		}
	};
}
