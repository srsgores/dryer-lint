/**
 * Every place a CSS declaration can hide in markup, gathered once so natural-size sees attributes stylelint never will.
 * A `style` attribute is a stylesheet written where only eslint can read it.
 */
import type {Rule} from "eslint";
import {cssPropertyOf, declarationsOf} from "#lib/classes.ts";
import {readNode} from "#lib/nodes.ts";
import type {StyleObject, StyleProperty, StyleReporter, StyleStringNode} from "#lib/types/style-visitor.ts";
import type {WrittenName} from "#lib/types/class-visitor.ts";

/**
 * Names the attribute a string was written into.
 * @param node The string node
 * @returns The attribute's name, or an empty string when the string is not an attribute value
 */
function attributeNameOf(node: StyleStringNode): string {
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
 * Reads the name a directive or key gives itself, which one parser writes flat and another nests.
 * @param written The key name, flat or nested
 * @returns The name, or an empty string when there is none
 */
function writtenNameOf(written: WrittenName): string {
	let name = "";

	if (typeof written === "string") {
		name = written;
	} else if (typeof written?.name === "string") {
		name = written.name;
	}

	return name;
}

/**
 * Hands every declaration in one style string to the reporter.
 * @param report The reporter
 * @param text The style string as it was written
 * @param node The node the string belongs to
 */
function inspectStyleString(report: StyleReporter, text: unknown, node: StyleStringNode): void {
	if (typeof text === "string" && attributeNameOf(node) === "style") {
		for (const {property, value} of declarationsOf(text)) {
			report(property, value, readNode<Rule.Node>(node));
		}
	}
}

/**
 * Hands every fixed-looking property on a JSX style object to the reporter.
 * @param report The reporter
 * @param object The object expression
 * @param node The attribute the object was written on
 */
function inspectStyleObject(report: StyleReporter, object: StyleObject | undefined, node: Rule.Node): void {
	for (const property of object?.properties ?? []) {
		const prop = property as StyleProperty;
		const key = prop.key;
		let name = "";

		if (key?.type === "Identifier" && typeof key.name === "string") {
			name = cssPropertyOf(key.name);
		} else if (key?.type === "Literal" && typeof key.value === "string") {
			name = key.value;
		}

		if (name !== "" && prop.value?.type === "Literal" && typeof prop.value.value === "string") {
			report(name, prop.value.value, node);
		}
	}
}

/**
 * Builds the visitor that hands every style declaration in a file to one reporter.
 * @param report The reporter, called with each property, value and the node it was written on
 * @returns The visitor eslint runs over the program
 */
export function createStyleVisitor(report: StyleReporter): Rule.RuleListener {
	return {
		Literal: function readLiteral(node): void {
			inspectStyleString(report, node.value, readNode<StyleStringNode>(node));
		},
		TemplateElement: function readTemplatePart(node): void {
			inspectStyleString(report, node.value.cooked ?? node.value.raw, readNode<StyleStringNode>(node));
		},
		/**
		 * Reads a svelte attribute's text, which the parser keeps in a node of its own.
		 * @param node The svelte literal
		 */
		SvelteLiteral: function readSvelteLiteral(node: unknown): void {
			const literal = node as StyleStringNode;

			inspectStyleString(report, literal.value, literal);
		},
		/**
		 * Reads a `style:property` directive, whose name is the declaration it applies.
		 * @param node The svelte style directive
		 */
		SvelteStyleDirective: function readSvelteStyleDirective(node: unknown): void {
			const directive = node as StyleStringNode;
			const property = writtenNameOf(directive.key?.name);
			const [first] = (directive.value as StyleStringNode[] | undefined) ?? [];
			const value = typeof first?.value === "string" ? first.value : "";

			if (property !== "" && value !== "") {
				report(property, value, readNode<Rule.Node>(directive));
			}
		},
		/**
		 * Reads a JSX `style={{...}}` object, which writes the same declarations in camelCase.
		 * @param node The JSX attribute
		 */
		JSXAttribute: function readJsxStyle(node: unknown): void {
			const attribute = readNode<StyleStringNode>(node);
			const value = attribute.value as StyleStringNode | undefined;

			if (attribute.name?.name === "style" && value?.type === "JSXExpressionContainer") {
				const expression = value.expression;

				if (expression?.type === "ObjectExpression") {
					inspectStyleObject(report, expression, readNode<Rule.Node>(node));
				}
			}
		}
	};
}
