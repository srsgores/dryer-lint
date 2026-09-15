/**
 * The little this package uses of the plugins a project installs only when it writes in that framework.
 * Declaring the shapes here rather than importing them keeps `tsc` from going looking for a package the project never asked for.
 */
import type {Linter} from "eslint";

/** What this package uses of eslint-plugin-svelte, which is its two flat configs. */
export interface SveltePlugin {
	configs: {recommended: Linter.Config[]; prettier: Linter.Config[]};
}

/** What this package uses of eslint-plugin-astro, which is its flat config. */
export interface AstroPlugin {
	configs: {recommended: Linter.Config[]};
}
