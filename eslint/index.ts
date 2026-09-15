/**
 * The house rules, gathered so a project asks for them in one line.
 * A name is the cheapest documentation there is, so `outcome` or `data` is a lint error rather than a review note.
 * A function answers in one place, a comment says its piece on one line, and a box takes the size its content asks for.
 * Everything else about style is prettier's.
 */
import js from "@eslint/js";
import type {Linter} from "eslint";
import {defineConfig, globalIgnores} from "eslint/config";
import prettier from "eslint-config-prettier";
import jsdoc from "eslint-plugin-jsdoc";
import globals from "globals";
import tseslint from "typescript-eslint";
import {DEFAULT_ALIASES} from "../lib/aliases.ts";
import {readNode} from "../lib/nodes.ts";
import type {DryerLintOptions} from "../lib/types/options.ts";
import aliasedImports from "./rules/aliased-imports.ts";
import arrayDestructuring from "./rules/array-destructuring.ts";
import logicalClasses from "./rules/logical-classes.ts";
import namedFunctions from "./rules/named-functions.ts";
import namedPatterns from "./rules/named-patterns.ts";
import naturalSize from "./rules/natural-size.ts";
import noArrayChain from "./rules/no-array-chain.ts";
import noInlineSql from "./rules/no-inline-sql.ts";
import noProseLineComments from "./rules/no-prose-line-comments.ts";
import notesAreAsides from "./rules/notes-are-asides.ts";
import oneReturn from "./rules/one-return.ts";
import switchBreak from "./rules/switch-break.ts";
import themeColours from "./rules/theme-colours.ts";
import typesDirectory from "./rules/types-directory.ts";
import unbrokenSentences from "./rules/unbroken-sentences.ts";
import unwrappedComments from "./rules/unwrapped-comments.ts";
import verbFirstDescriptions from "./rules/verb-first-descriptions.ts";

/** The rules this house writes itself, since neither eslint nor its plugins ship them. */
export const plugin = {
	meta: {name: "dryer-lint"},
	rules: {
		"aliased-imports": aliasedImports,
		"array-destructuring": arrayDestructuring,
		"logical-classes": logicalClasses,
		"named-functions": namedFunctions,
		"named-patterns": namedPatterns,
		"natural-size": naturalSize,
		"no-array-chain": noArrayChain,
		"no-inline-sql": noInlineSql,
		"no-prose-line-comments": noProseLineComments,
		"notes-are-asides": notesAreAsides,
		"one-return": oneReturn,
		"switch-break": switchBreak,
		"theme-colours": themeColours,
		"types-directory": typesDirectory,
		"unbroken-sentences": unbrokenSentences,
		"unwrapped-comments": unwrappedComments,
		"verb-first-descriptions": verbFirstDescriptions
	}
};

/**
 * Names that say what something is made of rather than what it is, or nothing at all.
 * The list is the two projects' own lists put together, so a name barred in one is barred in the other.
 */
export const VAGUE_NAMES: string[] = [
	"outcome",
	"outcomes",
	"item",
	"items",
	"entry",
	"entries",
	"thing",
	"things",
	"stuff",
	"info",
	"obj",
	"temp",
	"tmp",
	"val",
	"vals",
	"arr",
	"res",
	"req",
	"foo",
	"bar",
	"baz",
	"cb",
	"fn",
	"elem",
	"ret",
	"num",
	"str",
	"payload",
	"value",
	"values",
	"data",
	"result",
	"results",
	"response",
	"resp",
	"contents",
	"content",
	"handler",
	"callback",
	"el",
	"evt",
	"args",
	"params",
	"opts",
	"cfg",
	"ctx",
	"msg",
	"idx"
];

/** What is not ours to name: build output, dependencies, generated catalogues, test artefacts and vendored parts. */
export const DEFAULT_IGNORES: string[] = [
	"dist/**",
	"build/**",
	".svelte-kit/**",
	".astro/**",
	".netlify/**",
	".wrangler/**",
	"node_modules/**",
	"playwright-report/**",
	"test-results/**",
	"src/locales/**",
	"**/components/ui/**"
];

/** The files the house rules are written for, before a project says otherwise. */
export const DEFAULT_FILES: string[] = ["**/*.{js,mjs,cjs,ts,mts}"];

/** The files that are tests, which are held to the same style but not to the same names. */
export const DEFAULT_TEST_FILES: string[] = ["**/*.test.ts", "**/tests/**", "acceptance/**"];

/** Svelte writes components and the modules that share their runes in three extensions. */
const SVELTE_FILES: string[] = ["**/*.svelte", "**/*.svelte.ts", "**/*.svelte.js"];

/** Astro writes pages, layouts and components in one. */
const ASTRO_FILES: string[] = ["**/*.astro"];

/** A function longer than a glance is documented; shorter ones read as prose. */
const GLANCEABLE_LINES = 4;

/** What a value is must be known, not guessed at from where it came. */
const TYPE_SAFETY: Linter.RulesRecord = {
	"@typescript-eslint/no-unsafe-argument": "error",
	"@typescript-eslint/no-unsafe-assignment": "error",
	"@typescript-eslint/no-unsafe-call": "error",
	"@typescript-eslint/no-unsafe-member-access": "error",
	"@typescript-eslint/no-unsafe-return": "error",
	"@typescript-eslint/no-unnecessary-type-assertion": "error",
	"@typescript-eslint/no-redundant-type-constituents": "error",
	"@typescript-eslint/no-duplicate-type-constituents": "error",
	"@typescript-eslint/await-thenable": "error",
	"@typescript-eslint/no-floating-promises": "error",
	"@typescript-eslint/no-misused-promises": "error",
	"@typescript-eslint/require-await": "error",
	"@typescript-eslint/switch-exhaustiveness-check": "error",
	"@typescript-eslint/prefer-nullish-coalescing": "error",
	"@typescript-eslint/prefer-optional-chain": "error",
	"@typescript-eslint/restrict-template-expressions": ["error", {allowNumber: true}],
	"@typescript-eslint/strict-boolean-expressions": "error"
};

/** How this house documents itself: JSDoc, annotated, one line a sentence. */
const DOCUMENTATION: Linter.RulesRecord = {
	"dryer/no-prose-line-comments": "error",
	"dryer/verb-first-descriptions": "error",
	"dryer/notes-are-asides": "error",
	"jsdoc/require-jsdoc": [
		"error",
		{
			minLineCount: GLANCEABLE_LINES,
			require: {ClassDeclaration: true, FunctionDeclaration: true, FunctionExpression: true, MethodDefinition: true}
		}
	],
	"jsdoc/require-description": "error",
	"jsdoc/require-param": ["error", {checkDestructuredRoots: false}],
	"jsdoc/require-param-description": "error",
	"jsdoc/require-param-name": "error",
	"jsdoc/check-param-names": ["error", {checkDestructured: false}],
	"jsdoc/require-returns": "error",
	"jsdoc/require-returns-check": "error",
	"jsdoc/require-returns-description": "error",
	"jsdoc/require-throws": "error",
	"jsdoc/require-yields": "error",
	"jsdoc/check-types": "error",
	"jsdoc/valid-types": "error",
	"jsdoc/no-blank-blocks": "error",
	"jsdoc/no-multi-asterisks": "error",
	"jsdoc/check-alignment": "error",
	"jsdoc/check-tag-names": ["error", {definedTags: ["note"]}],
	"jsdoc/empty-tags": "error",
	"jsdoc/require-asterisk-prefix": "error",
	"jsdoc/require-hyphen-before-param-description": ["error", "never"],
	"jsdoc/tag-lines": ["error", "never", {startLines: 0}],
	"jsdoc/sort-tags": "error"
};

/** A type written in a comment is a type nothing checks, so only JavaScript is asked for one. */
const UNTYPED_DOCUMENTATION: Linter.RulesRecord = {
	"jsdoc/require-param-type": "error",
	"jsdoc/require-returns-type": "error"
};

/** The magic numbers this house allows, which are the ones that mean first, none, one and a pair. */
const MAGIC_NUMBERS: Linter.RulesRecord = {
	"no-magic-numbers": "off",
	"@typescript-eslint/no-magic-numbers": [
		"error",
		{
			ignoreNumericLiteralTypes: true,
			ignoreEnums: true,
			ignoreReadonlyClassProperties: true,
			ignore: [-1, 0, 1, 2],
			ignoreArrayIndexes: true,
			ignoreDefaultValues: true,
			ignoreClassFieldInitialValues: true,
			enforceConst: true,
			detectObjects: false
		}
	]
};

/** How this house is written, wherever a rule of its own does not already say so. */
const CODE_STYLE = [
	{
		selector: "CallExpression[callee.property.name=/^(then|catch|finally)$/]",
		message: "Use async/await instead of promise chains."
	},
	{
		selector: "NewExpression[callee.name='Promise']",
		message: "Use async/await instead of constructing promises."
	},
	{
		selector: "ContinueStatement",
		message: "Do not break out of loops."
	},
	{
		selector: "TSAsExpression > TSUnknownKeyword",
		message: "Do not cast through unknown; narrow at a boundary module instead."
	},
	{
		selector: "FunctionDeclaration > Identifier.id[name=/^(handle|on)[A-Z]/], FunctionExpression > Identifier.id[name=/^(handle|on)[A-Z]/]",
		message: "Name a function after what it does, not what it responds to."
	}
];

/** Nothing is typed as null, where a total value or an option says the same thing without the hole. */
const NO_NULL = {
	selector: "TSNullKeyword",
	message: "Do not type anything as null; use Option or a total value."
};

/**
 * Builds the rules every file answers to, with the parts a project asked for turned on.
 * @param options What the project said about itself
 * @returns The rules, ready to be given to as many file globs as the project has kinds of file
 */
function buildHouseRules(options: DryerLintOptions): Linter.RulesRecord {
	const restricted = options.noNull === true ? [...CODE_STYLE, NO_NULL] : CODE_STYLE;

	return {
		"id-denylist": ["error", ...VAGUE_NAMES, ...(options.vagueNames ?? [])],
		"id-length": ["error", {min: 2, properties: "never"}],
		"func-style": ["error", "declaration"],
		"func-names": ["error", "always"],
		"no-restricted-syntax": ["error", ...restricted],
		"dryer/one-return": "error",
		"dryer/unwrapped-comments": "error",
		"dryer/named-functions": "error",
		"dryer/named-patterns": "error",
		"dryer/theme-colours": "error",
		"dryer/aliased-imports": ["error", options.aliases ?? DEFAULT_ALIASES],
		"dryer/array-destructuring": "warn",
		"dryer/types-directory": "warn",
		"dryer/switch-break": "error",
		"dryer/no-array-chain": "error",
		"dryer/logical-classes": "error",
		"dryer/natural-size": ["error", {allowMaxInline: options.allowMaxInline ?? true}],
		"dryer/no-inline-sql": options.sql === true ? "error" : "off",
		...MAGIC_NUMBERS
	};
}

/**
 * Builds the svelte layers, loading the svelte plugin and parser only for a project that has components.
 * @param options What the project said about itself
 * @param houseRules The rules every file answers to
 * @returns The layers to add, or none when the project has no svelte in it
 */
async function buildSvelteLayers(options: DryerLintOptions, houseRules: Linter.RulesRecord): Promise<Linter.Config[]> {
	const svelte = await import("eslint-plugin-svelte");
	const configs = readNode<{configs: {recommended: Linter.Config[]; prettier: Linter.Config[]}}>(svelte.default ?? svelte).configs;

	return [
		...configs.recommended,
		...configs.prettier,
		{
			files: SVELTE_FILES,
			languageOptions: {
				parserOptions: {
					parser: tseslint.parser,
					extraFileExtensions: [".svelte"],
					svelteConfig: options.svelteConfig
				}
			},
			rules: {...houseRules, "dryer/unbroken-sentences": "error"}
		}
	];
}

/**
 * Builds the astro layers, loading the astro plugin and parser only for a project that has pages.
 * @param houseRules The rules every file answers to
 * @returns The layers to add, or none when the project has no astro in it
 */
async function buildAstroLayers(houseRules: Linter.RulesRecord): Promise<Linter.Config[]> {
	const astro = await import("eslint-plugin-astro");
	const astroParser = await import("astro-eslint-parser");
	const configs = readNode<{configs: {recommended: Linter.Config[]}}>(astro.default ?? astro).configs;

	return [
		...configs.recommended,
		{
			files: ASTRO_FILES,
			languageOptions: {
				parser: readNode<Linter.Parser>(astroParser.default ?? astroParser),
				parserOptions: {
					parser: tseslint.parser,
					extraFileExtensions: [".astro"]
				}
			},
			rules: {...houseRules, "dryer/unbroken-sentences": "error"}
		}
	];
}

/**
 * Builds the whole flat config a project answers to, with only the parts it asked for.
 * @param options What the project said about itself
 * @returns The flat config, ready to be the default export of an eslint config file
 */
export async function dryerLint(options: DryerLintOptions = {}): Promise<Linter.Config[]> {
	const files = options.files ?? DEFAULT_FILES;
	const testFiles = options.testFiles ?? DEFAULT_TEST_FILES;
	const houseRules = buildHouseRules(options);
	const typed = options.typed ?? false;
	const svelteLayers = options.svelte === true ? await buildSvelteLayers(options, houseRules) : [];
	const astroLayers = options.astro === true ? await buildAstroLayers(houseRules) : [];
	const documented: Linter.Config[] =
		options.documentation === false
			? []
			: [
					{files, rules: DOCUMENTATION},
					{files: ["**/*.{js,mjs,cjs}"], rules: UNTYPED_DOCUMENTATION},
					{
						files: ["**/*.{ts,mts}"],
						rules: {
							"@typescript-eslint/explicit-function-return-type": [
								"error",
								{allowExpressions: false, allowTypedFunctionExpressions: true, allowHigherOrderFunctions: false}
							]
						}
					}
				];
	const typedLayers: Linter.Config[] =
		typed === false
			? []
			: [
					{
						files: ["**/*.ts"],
						ignores: [...SVELTE_FILES, ...ASTRO_FILES],
						languageOptions: {
							parserOptions: {
								projectService: true,
								tsconfigRootDir: typeof typed === "object" ? typed.tsconfigRootDir : process.cwd()
							}
						},
						rules: TYPE_SAFETY
					}
				];

	return readNode<Linter.Config[]>(
		defineConfig(
			globalIgnores([...DEFAULT_IGNORES, ...(options.ignores ?? [])]),
			js.configs.recommended,
			...tseslint.configs.recommended,
			prettier,
			...svelteLayers,
			...astroLayers,
			{
				plugins: {dryer: plugin, jsdoc},
				settings: {jsdoc: {mode: "typescript"}},
				languageOptions: {globals: {...globals.browser, ...globals.node}},
				rules: {"no-undef": "off"}
			},
			{files, rules: houseRules},
			...documented,
			...typedLayers,
			{
				files: testFiles,
				rules: {
					"@typescript-eslint/no-explicit-any": "off",
					"id-denylist": "off",
					"no-magic-numbers": "off",
					"@typescript-eslint/no-magic-numbers": "off"
				}
			}
		)
	);
}

export default dryerLint;
