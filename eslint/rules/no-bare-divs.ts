/**
 * A div without attributes says nothing about what it holds, how it looks, or why it exists.
 * The only place HTML gives a bare div semantic purpose is inside a `<dl>`, where it groups `<dt>` and `<dd>` pairs.
 * Everywhere else, a wrapper should either describe itself with attributes, be replaced by a semantic element, or be removed.
 */
import type {Rule} from "eslint";
import {readNode} from "#lib/nodes.ts";
import type {TaggedNode} from "#lib/types/markup.ts";

/**
 * Reads the tag name of an element across HTML, Astro, Svelte, JSX and Vue parsers.
 * @param node The AST node to inspect
 * @returns The lowercase tag name, or an empty string when the node is not an element
 */
function tagNameOf(node: unknown): string {
	const tagged = readNode<TaggedNode>(node);
	let name = "";

	if (tagged.type === "JSXElement") {
		const identifier = tagged.openingElement?.name;
		if (identifier?.type === "JSXIdentifier" && typeof identifier.name === "string") {
			name = identifier.name;
		}
	} else if (tagged.type === "SvelteElement") {
		const svelteName = tagged.name as {type?: string; name?: string} | undefined;
		if (typeof svelteName?.name === "string") {
			name = svelteName.name;
		}
	} else if (tagged.type === "VElement") {
		if (typeof tagged.name === "string") {
			name = tagged.name;
		}
	} else if (tagged.type === "Tag" || tagged.type === "Element") {
		const htmlName = tagged.name ?? tagged.tagName;
		if (typeof htmlName === "string") {
			name = htmlName.toLowerCase();
		}
	}

	return name;
}

/**
 * Counts the attributes written on an element, including directives and spread bindings.
 * @param node The AST node to inspect
 * @returns How many attributes the opening tag carries
 */
function countAttributes(node: unknown): number {
	const tagged = readNode<TaggedNode>(node);
	let count = 0;

	if (tagged.type === "JSXElement") {
		count = tagged.openingElement?.attributes?.length ?? 0;
	} else if (tagged.type === "SvelteElement" || tagged.type === "VElement") {
		count = tagged.startTag?.attributes?.length ?? 0;
	} else if (Array.isArray(tagged.attributes)) {
		count = tagged.attributes.length;
	} else if (Array.isArray(tagged.startTag?.attributes)) {
		count = tagged.startTag.attributes.length;
	}

	return count;
}

/**
 * Answers whether a node lives directly inside a description list, stepping past control flow and fragments.
 * @param node The AST node to inspect
 * @returns True when the closest enclosing element is a `<dl>`
 */
function isDirectlyInsideDl(node: unknown): boolean {
	let current = readNode<TaggedNode>(node).parent;
	let found = false;
	let finished = false;

	while (current && typeof current === "object" && !finished) {
		const name = tagNameOf(current);

		if (name !== "") {
			found = name === "dl";
			finished = true;
		} else {
			current = readNode<TaggedNode>(current).parent;
		}
	}

	return found;
}

/**
 * Finds the opening tag or best node to report on, so the squiggly line stays on the tag itself.
 * @param node The element node
 * @returns The opening tag when available, or the node itself
 */
function targetOf(node: unknown): Rule.Node {
	const tagged = readNode<TaggedNode>(node);
	const target = tagged.openingElement ?? tagged.startTag ?? tagged;

	return readNode<Rule.Node>(target);
}

/**
 * Inspects one element and reports bare divs outside `<dl>`.
 * @param context The rule context
 * @param node The element node
 */
function inspectElement(context: Rule.RuleContext, node: unknown): void {
	if (tagNameOf(node) === "div" && countAttributes(node) === 0 && !isDirectlyInsideDl(node)) {
		context.report({node: targetOf(node), messageId: "bareDiv"});
	}
}

/** Forbids `<div>` elements with no attributes unless grouping terms inside a `<dl>`. */
const rule: Rule.RuleModule = {
	meta: {
		type: "problem",
		docs: {description: "Forbids <div> with no attributes unless directly inside a <dl>"},
		messages: {
			bareDiv:
				"A <div> with no attributes tells nothing to readers and leads to <div> soup. Ideally, remove this <div>, but if you really must have it, then add some attributes that will help you find it later -- like a class name."
		},
		schema: []
	},

	/**
	 * Reads every element in markup and asks about bare divs that sit outside a description list.
	 * @param context The rule context eslint hands the rule
	 * @returns The visitor eslint runs over the program
	 */
	create: function checkBareDivs(context: Rule.RuleContext): Rule.RuleListener {
		return {
			JSXElement: function checkJsx(node: unknown): void {
				inspectElement(context, node);
			},
			SvelteElement: function checkSvelte(node: unknown): void {
				inspectElement(context, node);
			},
			VElement: function checkVue(node: unknown): void {
				inspectElement(context, node);
			},
			Tag: function checkHtmlTag(node: unknown): void {
				inspectElement(context, node);
			},
			Element: function checkHtmlElement(node: unknown): void {
				inspectElement(context, node);
			}
		};
	}
};

export default rule;
