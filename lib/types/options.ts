/** What a project is allowed to say about itself when it asks for the house rules. */
import type {AliasTarget} from "#lib/types/aliases.ts";

/** Where the compiler should look for the tsconfig that answers questions about types. */
export interface TypedOptions {
	tsconfigRootDir: string;
}

/** Everything a project can tell `dryerLint()` about itself, all of it optional. */
export interface DryerLintOptions {
	/** Whether the project has svelte components, which need their own parser and plugin. */
	svelte?: boolean;
	/** Whether the project has astro pages, which need their own parser and plugin. */
	astro?: boolean;
	/** Whether the project has html files, which need their own parser. */
	html?: boolean;
	/** Whether the compiler is available to answer questions about types, and where its tsconfig sits. */
	typed?: boolean | TypedOptions;
	/** Whether the code documents itself in JSDoc, which is on unless it is turned off. */
	documentation?: boolean;
	/** The aliases this project addresses its own directories by. */
	aliases?: AliasTarget[];
	/** Names to add to the ones that say nothing about what they hold. */
	vagueNames?: string[];
	/** Names to take off the denylist, for keys in a shape the project did not design. */
	allowNames?: string[];
	/** Paths to ignore on top of the build output and vendored parts that are ignored anyway. */
	ignores?: string[];
	/** Whether to ask for database statements to live in query files, which is off unless asked for. */
	sql?: boolean;
	/** Whether to forbid typing anything as null, which is off unless asked for. */
	noNull?: boolean;
	/** Whether a cap on the inline axis is left alone, which it is unless asked otherwise. */
	allowMaxInline?: boolean;
	/** The files the house rules apply to. */
	files?: string[];
	/** The files that are tests, which are held to the same style but not to the same names. */
	testFiles?: string[];
	/** The project's svelte config, handed to the svelte parser so it can read the compiler's own settings. */
	svelteConfig?: unknown;
}
