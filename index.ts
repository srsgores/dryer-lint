/**
 * Everything the house shares, in one import for whoever wants all of it.
 * The three tools are also reachable one at a time, as `dryer-lint/eslint`, `dryer-lint/stylelint` and `dryer-lint/prettier`.
 */
export {DEFAULT_FILES, DEFAULT_IGNORES, DEFAULT_TEST_FILES, VAGUE_NAMES, dryerLint, plugin} from "#eslint/index.ts";
export {DEFAULT_ALIASES} from "#lib/aliases.ts";
export {default as stylelintConfig, DEFAULT_IGNORE_FILES} from "#stylelint/index.ts";
export {SHARED_OPTIONS, prettierConfig} from "./prettier/index.ts";
export type {AliasSuggestion, AliasTarget} from "#lib/types/aliases.ts";
export type {DryerLintOptions, TypedOptions} from "#lib/types/options.ts";
export type {PrettierOptions} from "#lib/types/prettier.ts";
