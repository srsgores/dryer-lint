/** Shared checks and JSX reads for Astro-only rules. */
import type {Rule} from "eslint";
import {readNode} from "#lib/nodes.ts";
import type {AstroAttribute, AstroElement} from "#lib/types/astro.ts";

/** A backslash, which is how Windows writes the separator between one directory and the next. */
const WINDOWS_SEPARATOR: RegExp = /\\/g;

/** An Astro file, by its extension. */
const ASTRO_FILE: RegExp = /\.astro$/;

/** An Astro page route, which is not a component and does not take a slot or rest spread. */
const ASTRO_PAGE: RegExp = /(?:^|\/)pages\//;

/**
 * Normalizes a path so Windows and Posix paths answer the same questions.
 * @param filename The path of the file being linted
 * @returns The path with forward slashes
 */
function normalizePath(filename: string): string {
	return filename.replace(WINDOWS_SEPARATOR, "/");
}

/**
 * Answers whether the file sits under a pages directory, which is a route rather than a component.
 * @param filename The path of the file being linted
 * @returns True when the path contains `/pages/`
 */
export function isAstroPage(filename: string): boolean {
	return ASTRO_PAGE.test(normalizePath(filename));
}

/**
 * Answers whether the rule should run: an Astro file, and when the parser says so, one it actually parsed as Astro.
 * @param context The rule context eslint hands the rule
 * @returns True when the house Astro rules apply
 */
export function isAstroContext(context: Rule.RuleContext): boolean {
	const fromParser = (context.sourceCode.parserServices as {isAstro?: boolean} | undefined)?.isAstro;

	return ASTRO_FILE.test(normalizePath(context.filename)) && fromParser !== false;
}

/**
 * Reads the tag name of a JSX element.
 * @param node The element
 * @returns The tag name, or an empty string
 */
export function tagNameOf(node: unknown): string {
	const name = readNode<AstroElement>(node).openingElement?.name;

	return name?.type === "JSXIdentifier" && typeof name.name === "string" ? name.name : "";
}

/**
 * Reads the attribute name, including a `class:list` namespace.
 * @param attribute The attribute
 * @returns The name as written, or an empty string
 */
export function attributeNameOf(attribute: AstroAttribute): string {
	const written = attribute.name;
	let name = "";

	if (written?.type === "JSXIdentifier" && typeof written.name === "string") {
		name = written.name;
	} else if (written?.type === "JSXNamespacedName") {
		const space = written.namespace?.name;
		const local = typeof written.name === "object" ? written.name?.name : written.name;

		if (typeof space === "string" && typeof local === "string") {
			name = `${space}:${local}`;
		}
	}

	return name;
}

/**
 * Finds an attribute by name on an opening tag.
 * @param node The element
 * @param wanted The name to find
 * @returns The attribute, or undefined
 */
export function findAttribute(node: unknown, wanted: string): AstroAttribute | undefined {
	return (readNode<AstroElement>(node).openingElement?.attributes ?? []).find(function matches(attribute: AstroAttribute): boolean {
		return attributeNameOf(attribute) === wanted;
	});
}
