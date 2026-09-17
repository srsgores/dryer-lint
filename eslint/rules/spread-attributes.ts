/**
 * A component that swallows extra props leaves the caller nowhere to put class names, ids and data attributes.
 * Rest them as `attributes` or `rest`, and spread that same name onto an element so they reach the markup.
 * Pages under `pages/` are routes, not components, and are left alone.
 */
import type {Rule} from "eslint";
import {isAstroContext, isAstroPage} from "#lib/astro.ts";
import {readNode} from "#lib/nodes.ts";
import type {AstroNamedArgument} from "#lib/types/astro.ts";

/** The rest names this house accepts for leftover props. */
const REST_NAMES: Set<string> = new Set(["attributes", "rest"]);

/**
 * Reads the identifier a rest or spread binds, when it is a bare name.
 * @param node The rest element or spread attribute
 * @returns The name, or an empty string
 */
function identifierOf(node: unknown): string {
	const argument = readNode<AstroNamedArgument>(node).argument;

	return argument?.type === "Identifier" && typeof argument.name === "string" ? argument.name : "";
}

/** Requires Astro components to rest leftover props and spread them onto an element. */
const rule: Rule.RuleModule = {
	meta: {
		type: "problem",
		docs: {description: "Requires Astro components to rest and spread leftover props as attributes or rest"},
		messages: {
			missingSpread:
				"This component never rests leftover props as `...attributes` or `...rest` and spreads that same name onto an element. Callers have nowhere to put class names and other attributes."
		},
		schema: []
	},

	/**
	 * Watches rest bindings and spreads in an Astro component, and asks that one accepted name do both jobs.
	 * @param context The rule context eslint hands the rule
	 * @returns The visitor eslint runs over the program
	 */
	create: function checkSpreadAttributes(context: Rule.RuleContext): Rule.RuleListener {
		let visitors: Rule.RuleListener = {};

		if (isAstroContext(context) && !isAstroPage(context.filename)) {
			const rested: Set<string> = new Set();
			const spread: Set<string> = new Set();

			visitors = {
				/**
				 * Notes a rest binding named `attributes` or `rest`.
				 * @param node The rest element
				 */
				RestElement: function noteRest(node: unknown): void {
					const name = identifierOf(node);

					if (REST_NAMES.has(name)) {
						rested.add(name);
					}
				},
				/**
				 * Notes a spread of a bare identifier.
				 * @param node The spread attribute
				 */
				JSXSpreadAttribute: function noteSpread(node: unknown): void {
					const name = identifierOf(node);

					if (REST_NAMES.has(name)) {
						spread.add(name);
					}
				},
				/**
				 * Reports when no accepted name was both rested and spread.
				 * @param node The program
				 */
				"Program:exit": function reportMissing(node): void {
					const matched = [...rested].some(function wasSpread(name: string): boolean {
						return spread.has(name);
					});

					if (!matched) {
						context.report({node, messageId: "missingSpread"});
					}
				}
			};
		}

		return visitors;
	}
};

export default rule;
