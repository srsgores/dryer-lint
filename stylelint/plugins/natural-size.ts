/**
 * An element takes its natural size unless something measured bounds it.
 * A declaration that pins a box to a length in pixels, rems or ems decides in advance how much content there will be.
 * The same is asked of `@apply`, because a utility applied in a stylesheet is the same decision written in Tailwind.
 * A cap on the inline axis is the one exception, since a reading measure bounds a column of text rather than sizing a box.
 */
import stylelint from "stylelint";
import type {PostcssResult} from "stylelint";
import type {AtRule, Declaration, Root} from "postcss";
import {describeNaturalSize, describePinnedDeclaration, sizedAxisOf, splitClassNames} from "#lib/classes.ts";
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
				const axis = sizedAxisOf(declaration.prop, allowMaxInline);

				if (axis !== "" && describePinnedDeclaration(declaration.prop, declaration.value, allowMaxInline) !== "") {
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
