/** The shapes the style visitor works with, since svelte and astro nodes are not in eslint's own AST. */
import type {Rule} from "eslint";
import type {WrittenName} from "#lib/types/class-visitor.ts";

/** A node that may hold a style string or a style directive. */
export interface StyleStringNode {
	type?: string;
	value?: unknown;
	key?: {name?: WrittenName};
	name?: {name?: string; type?: string};
	parent?: StyleStringNode;
	expression?: StyleObject;
	properties?: StyleProperty[];
	shorthand?: boolean;
}

/** A JSX object handed to `style={...}`. */
export interface StyleObject {
	type?: string;
	properties?: StyleProperty[];
}

/** One property on a JSX style object. */
export interface StyleProperty {
	type?: string;
	key?: {type?: string; name?: string; value?: unknown};
	value?: {type?: string; value?: unknown};
}

/** What a style rule does with each declaration the visitor finds. */
export type StyleReporter = (property: string, value: string, node: Rule.Node) => void;
