/** One place to read a node as the shape its parser gives it, since eslint's own types describe only its own AST. */

/**
 * Reads a node as the shape the parser that produced it actually has.
 * A svelte or astro node is not in eslint's AST, so the types have to be taken on trust at exactly one point.
 * @param node The node as eslint handed it over
 * @returns The same node, read as the shape asked for
 */
export function readNode<Shape>(node: unknown): Shape {
	return node as Shape;
}
