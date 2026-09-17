/** The shapes Astro markup rules work with, since astro-eslint-parser nodes are not in eslint's own AST. */

/** An attribute name as the Astro parser writes it, flat or namespaced. */
export interface AstroAttributeName {
	type?: string;
	name?: string | {name?: string; type?: string};
	namespace?: {name?: string};
}

/** An attribute on an Astro element. */
export interface AstroAttribute {
	type?: string;
	name?: AstroAttributeName;
	value?: {
		type?: string;
		value?: unknown;
		expression?: AstroExpression;
	};
}

/** A JSX element that carries an opening tag. */
export interface AstroElement {
	openingElement?: {name?: {type?: string; name?: string}; attributes?: AstroAttribute[]};
}

/** A small slice of an expression tree that Astro rules walk. */
export interface AstroExpression {
	type?: string;
	name?: string;
	value?: unknown;
	operator?: string;
	object?: AstroExpression;
	property?: AstroExpression;
	elements?: (AstroExpression | null)[];
	properties?: {key?: AstroExpression; value?: AstroExpression; type?: string}[];
	expressions?: AstroExpression[];
	callee?: AstroExpression;
	arguments?: AstroExpression[];
	left?: AstroExpression;
	right?: AstroExpression;
	test?: AstroExpression;
	consequent?: AstroExpression;
	alternate?: AstroExpression;
	argument?: AstroExpression;
	expression?: AstroExpression;
}

/** A variable declarator in Astro frontmatter. */
export interface AstroDeclarator {
	id?: {type?: string; name?: string};
	init?: AstroExpression;
	parent?: {kind?: string};
}

/** A rest or spread whose argument is a bare identifier. */
export interface AstroNamedArgument {
	argument?: {type?: string; name?: string};
}
