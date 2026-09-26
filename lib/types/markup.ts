/** The shapes markup element rules work with across HTML, Astro, Svelte and JSX parsers. */

/** A node with a tag name, whichever markup parser produced it. */
export interface TaggedNode {
	type?: string;
	name?: string | {type?: string; name?: string};
	tagName?: string;
	openingElement?: {name?: {type?: string; name?: string}; attributes?: unknown[]};
	startTag?: {attributes?: unknown[]};
	attributes?: unknown[];
	children?: unknown[];
	parent?: unknown;
}

/** A JSX attribute node with its name and value expressions. */
export interface JsxAttributeNode {
	name?: {name?: string};
	value?: {
		type?: string;
		value?: unknown;
		expression?: {
			type?: string;
			value?: unknown;
			quasis?: Array<{value?: {raw?: string; cooked?: string}}>;
		};
	} | null;
}

/** A Svelte attribute node, either boolean or carrying values. */
export interface SvelteAttributeNode {
	key?: {name?: string};
	value?: Array<{type?: string; value?: unknown; expression?: {type?: string; value?: unknown}}>;
}

/** A Svelte class directive node. */
export interface SvelteDirectiveNode {
	kind?: string;
	key?: {name?: {name?: string} | string};
}

/** A Svelte shorthand attribute node like `{hidden}`. */
export interface SvelteShorthandNode {
	key?: {name?: string};
}

/** An HTML attribute node parsed by @html-eslint/parser. */
export interface HtmlAttributeNode {
	key?: {value?: string};
	value?: {value?: string};
}
