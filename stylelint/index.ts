/**
 * Stylesheets answer to the rules eslint applies to components.
 * Logical properties come from the plugins that already ship them, so nothing here reimplements a table somebody else maintains.
 * What is left is the house's own: colours that belong to the theme, lengths that follow the reader, and boxes that take their content's size.
 */
import type {Config} from "stylelint";
import naturalSize from "#stylelint/plugins/natural-size.ts";
import noPixelClasses from "#stylelint/plugins/no-pixel-classes.ts";

/** What is not ours to style: build output and vendored component css. */
export const DEFAULT_IGNORE_FILES: string[] = [
	"**/node_modules/**",
	"dist/**",
	"build/**",
	".svelte-kit/**",
	".astro/**",
	"**/components/ui/**",
	"**/shadcn*.css"
];

/** The house's stylesheet rules, ready to be extended or spread over. */
const config: Config = {
	extends: ["stylelint-config-tailwindcss", "stylelint-plugin-logical-css/configs/recommended"],
	plugins: [naturalSize, noPixelClasses],
	rules: {
		"unit-disallowed-list": [
			["px"],
			{
				message:
					"A pixel is a decision about somebody else's screen. Use rem, a percentage or a viewport unit so the interface follows the reader's own text size."
			}
		],
		"color-no-hex": [
			true,
			{
				message: "A colour written by hand belongs to nothing. Use one of the theme's own tokens, or a Tailwind palette colour."
			}
		],
		"function-disallowed-list": [
			["rgb", "rgba", "hsl", "hsla", "hwb", "lab", "lch"],
			{
				message: "Theme colours are written in oklch, which spaces lightness evenly by eye so a palette reads the same in both themes."
			}
		],
		"dryer/natural-size": true,
		"dryer/no-pixel-classes": true
	},
	ignoreFiles: DEFAULT_IGNORE_FILES
};

export default config;
