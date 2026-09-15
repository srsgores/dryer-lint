/**
 * A pixel is a decision about somebody else's screen.
 * A declaration in pixels is caught by `unit-disallowed-list`, but a utility applied in a stylesheet hides the length inside a class name.
 * This reads the class names `@apply` was given and asks for a spacing step instead.
 */
import stylelint from "stylelint";
import type {PostcssResult} from "stylelint";
import type {AtRule, Root} from "postcss";
import {hasPixelLength, splitClassNames} from "../../lib/classes.ts";

/** What this rule is called wherever stylelint names it. */
export const ruleName = "dryer/no-pixel-classes";

/** What this rule says when it finds a length in pixels inside a class name. */
export const messages = stylelint.utils.ruleMessages(ruleName, {
	pixels: function pixelLength(token: string): string {
		return `Use a Tailwind spacing step rather than the pixel length in "${token}".`;
	}
});

/** Where this rule is written down for anybody who wants to read more about it. */
const meta = {url: "https://github.com/srsgores/dryer-lint#dryerno-pixel-classes"};

/**
 * Reads every applied class and asks about the ones that spell out a length in pixels.
 * @param primary Whether the rule is turned on
 * @returns The walk stylelint runs over the stylesheet
 */
function checkPixelClasses(primary: boolean): (root: Root, postcssResult: PostcssResult) => void {
	return function walkStylesheet(root: Root, postcssResult: PostcssResult): void {
		if (primary) {
			root.walkAtRules("apply", function readApply(atRule: AtRule): void {
				for (const token of splitClassNames(atRule.params)) {
					if (hasPixelLength(token)) {
						stylelint.utils.report({message: messages.pixels(token), node: atRule, result: postcssResult, ruleName});
					}
				}
			});
		}
	};
}

checkPixelClasses.ruleName = ruleName;
checkPixelClasses.messages = messages;
checkPixelClasses.meta = meta;

export default stylelint.createPlugin(ruleName, checkPixelClasses);
