/** The shapes the class visitor works with, since svelte and astro nodes are not in eslint's own AST. */
import type {Rule} from "eslint";

/** What an attribute or a directive calls itself, which one parser writes flat and the other nests. */
export type WrittenName = string | {name?: string} | undefined;

/** A node that may hold a class name, whichever parser produced it. */
export interface ClassStringNode {
	type?: string;
	kind?: string;
	value?: unknown;
	key?: {name?: WrittenName};
	name?: {name?: string};
	parent?: ClassStringNode;
}

/** What a class rule does with each class the visitor finds. */
export type ClassReporter = (token: string, node: Rule.Node) => void;
