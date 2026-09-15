/**
 * What prettier settles, so no review ever spends a line on it.
 * Tabs, because a tab is a width the reader chooses and a space is one somebody else did.
 * A wide line, because a sentence in a comment or a string is not improved by being folded in half.
 */
import type {Config} from "prettier";
import type {PrettierOptions} from "../lib/types/prettier.ts";

/** What every project in this house formats to, whichever framework it is written in. */
export const SHARED_OPTIONS: Config = {
	useTabs: true,
	tabWidth: 4,
	semi: true,
	singleQuote: false,
	trailingComma: "none",
	bracketSpacing: false,
	bracketSameLine: true,
	arrowParens: "always",
	singleAttributePerLine: false,
	proseWrap: "preserve",
	printWidth: 160,
	endOfLine: "lf"
};

/**
 * Builds the prettier config, with the plugin and parser each framework needs and nothing it does not.
 * @param options Which frameworks the project has, and anything it wants to say instead
 * @returns The config, ready to be the default export of a prettier config file
 */
export function prettierConfig(options: PrettierOptions = {}): Config {
	const {svelte = false, astro = false, ...overrides} = options;
	const plugins: string[] = [];
	const configured: NonNullable<Config["overrides"]> = [];

	if (svelte) {
		plugins.push("prettier-plugin-svelte");
		configured.push({files: "*.svelte", options: {parser: "svelte"}});
	}

	if (astro) {
		plugins.push("prettier-plugin-astro");
		configured.push({files: "*.astro", options: {parser: "astro"}});
	}

	return {
		...SHARED_OPTIONS,
		...(plugins.length > 0 ? {plugins} : {}),
		...(configured.length > 0 ? {overrides: configured} : {}),
		...overrides
	};
}

export default prettierConfig();
