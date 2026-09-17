/**
 * An element takes its natural size unless something measured bounds it.
 * A declaration that pins a box to a length in pixels, rems or ems decides in advance how much content there will be.
 * The same is asked of `@apply`, because a utility applied in a stylesheet is the same decision written in Tailwind.
 * A cap on the inline axis is the one exception, since a reading measure bounds a column of text rather than sizing a box.
 */
import stylelint from "stylelint";
import type {PostcssResult} from "stylelint";
import type {AtRule, Declaration, Root} from "postcss";
import {
	BLOCK_SIZE_PROPERTIES,
	CAPPED_INLINE_PROPERTIES,
	INLINE_SIZE_PROPERTIES,
	describeNaturalSize,
	isFixedDeclaration,
	splitClassNames
} from "#lib/classes.ts";
import type {NaturalSizeSecondary} from "#lib/types/stylelint.ts";

/** What this rule is called wherever stylelint names it. */
export const ruleName = "dryer/natural-size";

/** What this rule says when it finds a box that was sized for it. */
export const messages = stylelint.utils.ruleMessages(ruleName, {
	pinned: function pinnedDeclaration(property: string, axis: string): string {
		return `"${property}" pins the element to a fixed ${axis} size; let it take its natural size, or bound it with a viewport unit or a measured custom property.`;
	},
	applied: function pinnedUtility(explanation: string): string {
		return `${explanation}.`;
	}
});

/** Where this rule is written down for anybody who wants to read more about it. */
const meta = {url: "https://github.com/srsgores/dryer-lint#dryernatural-size"};

/**
 * Names the axis a declaration sizes, once the project has said whether a reading cap counts.
 * @param property The property being declared
 * @param allowMaxInline Whether a reading cap on the inline axis is left alone
 * @returns The axis, or an empty string when the declaration sizes nothing
 */
function sizedAxisOf(property: string, allowMaxInline: boolean): string {
	const capped = !allowMaxInline && CAPPED_INLINE_PROPERTIES.has(property);
	let axis = "";

	if (BLOCK_SIZE_PROPERTIES.has(property)) {
		axis = "block";
	} else if (INLINE_SIZE_PROPERTIES.has(property) || capped) {
		axis = "inline";
	}

	return axis;
}

/**
 * Reads every stylesheet handed to stylelint and asks about the boxes that were sized in advance.
 * @param primary Whether the rule is turned on
 * @param secondary What the project said about reading caps
 * @returns The walk stylelint runs over the stylesheet
 */
function checkNaturalSize(primary: boolean, secondary?: NaturalSizeSecondary): (root: Root, postcssResult: PostcssResult) => void {
	return function walkStylesheet(root: Root, postcssResult: PostcssResult): void {
		const allowMaxInline = secondary?.allowMaxInline ?? true;

		if (primary) {
			root.walkDecls(function readDeclaration(declaration: Declaration): void {
				const axis = sizedAxisOf(declaration.prop.toLowerCase(), allowMaxInline);

				if (axis !== "" && isFixedDeclaration(declaration.value)) {
					stylelint.utils.report({
						message: messages.pinned(declaration.prop, axis),
						node: declaration,
						result: postcssResult,
						ruleName
					});
				}
			});

			root.walkAtRules("apply", function readApply(atRule: AtRule): void {
				for (const token of splitClassNames(atRule.params)) {
					const explanation = describeNaturalSize(token, allowMaxInline);

					if (explanation !== "") {
						stylelint.utils.report({message: messages.applied(explanation), node: atRule, result: postcssResult, ruleName});
					}
				}
			});
		}
	};
}

checkNaturalSize.ruleName = ruleName;
checkNaturalSize.messages = messages;
checkNaturalSize.meta = meta;

export default stylelint.createPlugin(ruleName, checkNaturalSize);
