/** What a project can say about how it wants to be formatted. */
import type {Config} from "prettier";

/** The shared options, plus a word about which frameworks the project writes in. */
export interface PrettierOptions extends Config {
	/** Whether the project has svelte components, which need their own plugin and parser. */
	svelte?: boolean;
	/** Whether the project has astro pages, which need their own plugin and parser. */
	astro?: boolean;
}
