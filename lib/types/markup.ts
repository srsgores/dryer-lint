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
