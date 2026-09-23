/**
 * A heading grouped with subheadings or paragraphs belongs in an `<hgroup>`.
 * Wrapping headings and paragraphs in a `<div>` or `<header>` hides the relationship from assistive technology.
 * An `<hgroup>` marks the subheadings and taglines as secondary to the main heading.
 */
import type {Rule} from "eslint";
import {readNode} from "#lib/nodes.ts";
import type {TaggedNode} from "#lib/types/markup.ts";

/** A heading tag, from h1 through h6. */
const HEADING_TAG: RegExp = /^h[1-6]$/i;

/** An HTML tag name that starts with a lowercase letter and contains no namespaces or member expressions. */
const HTML_TAG: RegExp = /^[a-z][a-z0-9-]*$/;

/** Document root elements that can never be replaced by an hgroup. */
const DOCUMENT_ROOTS: Set<string> = new Set(["html", "body"]);

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
 * Answers whether a tag name represents a heading from h1 through h6.
 * @param name The tag name to test
 * @returns True when the tag is an h1, h2, h3, h4, h5 or h6
 */
function isHeading(name: string): boolean {
	return HEADING_TAG.test(name);
}

/**
 * Answers whether a tag name represents a paragraph tag.
 * @param name The tag name to test
 * @returns True when the tag is a p
 */
function isParagraph(name: string): boolean {
	return name.toLowerCase() === "p";
}

/**
 * Reads the children of an element node across parsers.
 * @param node The AST node
 * @returns The array of children, or an empty list
 */
function childrenOf(node: unknown): unknown[] {
	const tagged = readNode<TaggedNode>(node);
	let children: unknown[] = [];

	if (Array.isArray(tagged.children)) {
		children = tagged.children;
	}

	return children;
}

/**
 * Answers whether a child node is formatting whitespace or a comment.
 * @param candidate The child AST node
 * @returns True when the node can be ignored
 */
function isIgnoredChild(candidate: unknown): boolean {
	const child = readNode<{type?: string; value?: unknown; expression?: {type?: string}}>(candidate);
	let ignored = false;

	if (child.type === "JSXText" || child.type === "SvelteText" || child.type === "Text" || child.type === "VText") {
		ignored = typeof child.value === "string" && child.value.trim() === "";
	} else if (child.type === "SvelteHTMLComment" || child.type === "AstroHTMLComment" || child.type === "Comment") {
		ignored = true;
	} else if (child.type === "JSXExpressionContainer" && child.expression?.type === "JSXEmptyExpression") {
		ignored = true;
	}

	return ignored;
}

/**
 * Gathers the significant children of an element, skipping whitespace and comments.
 * @param node The AST node
 * @returns The list of significant child nodes
 */
function significantChildrenOf(node: unknown): unknown[] {
	return childrenOf(node).filter(function isSignificant(candidate: unknown): boolean {
		return !isIgnoredChild(candidate);
	});
}

/**
 * Answers whether a list of children matches the pattern of headings followed by paragraphs.
 * Must contain at least one heading, only headings and paragraphs in order, and at least two elements total.
 * @param children The significant child nodes
 * @returns True when the children form a heading group pattern
 */
function matchesHeadingGroupPattern(children: unknown[]): boolean {
	let index = 0;
	let headingsCount = 0;
	let paragraphsCount = 0;
	let matches = false;

	while (index < children.length && isHeading(tagNameOf(children[index]))) {
		headingsCount++;
		index++;
	}

	while (index < children.length && isParagraph(tagNameOf(children[index]))) {
		paragraphsCount++;
		index++;
	}

	if (headingsCount >= 1 && index === children.length && headingsCount + paragraphsCount >= 2) {
		matches = true;
	}

	return matches;
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
 * Inspects one element and warns when headings followed by paragraphs are wrapped in another element.
 * @param context The rule context
 * @param node The element node
 */
function inspectElement(context: Rule.RuleContext, node: unknown): void {
	const tag = tagNameOf(node);

	if (HTML_TAG.test(tag) && tag !== "hgroup" && !DOCUMENT_ROOTS.has(tag)) {
		const children = significantChildrenOf(node);

		if (matchesHeadingGroupPattern(children)) {
			context.report({
				node: targetOf(node),
				messageId: "preferHgroup",
				data: {tag}
			});
		}
	}
}

/** Warns when headings followed by paragraphs are wrapped in an element other than `<hgroup>`. */
const rule: Rule.RuleModule = {
	meta: {
		type: "suggestion",
		docs: {description: "Warns when headings followed by paragraphs are wrapped in an element other than <hgroup>"},
		messages: {
			preferHgroup: "Headings followed by paragraphs belong in an <hgroup>. You probably meant to use an <hgroup> instead of <{{tag}}>."
		},
		schema: []
	},

	/**
	 * Reads every element in markup and asks about headings followed by paragraphs outside an hgroup.
	 * @param context The rule context eslint hands the rule
	 * @returns The visitor eslint runs over the program
	 */
	create: function checkHeadingGroups(context: Rule.RuleContext): Rule.RuleListener {
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
