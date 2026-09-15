/**
 * Loading the packages a project installs only when it writes in the framework they serve.
 * A package named inline is a package `tsc` goes looking for.
 * A project with no svelte in it would then be told to install svelte before it could type check its own lint config.
 * So the name travels as a value, and the one place it is read is here.
 */
import {readNode} from "./nodes.ts";

/** What node says when the package is simply not installed, as against broken. */
const MISSING_MODULE: Set<string> = new Set(["ERR_MODULE_NOT_FOUND", "MODULE_NOT_FOUND"]);

/**
 * Says what went wrong in terms of what to do about it, when what went wrong is an absent package.
 * Anything else is handed back as it came, since only a missing package has an obvious answer.
 * @param name The package that would not load
 * @param thrown What loading it threw
 * @returns The error to raise in its place
 */
function explainMissing(name: string, thrown: unknown): unknown {
	const code = readNode<{code?: string}>(thrown).code ?? "";
	let explained: unknown = thrown;

	if (MISSING_MODULE.has(code)) {
		explained = new Error(`dryer-lint needs "${name}" for the option you turned on. Install it with \`npm i -D ${name}\`.`, {cause: thrown});
	}

	return explained;
}

/**
 * Loads a package only when a project has asked for the framework it belongs to.
 * @param name The package to load, passed as a value so nothing resolves it until this runs
 * @returns What the package exports, read as the shape this package uses of it
 * @throws When the package is not installed, saying which one to install
 */
export async function loadOptional<Shape>(name: string): Promise<Shape> {
	let loaded: unknown;

	try {
		loaded = await import(name);
	} catch (thrown) {
		throw explainMissing(name, thrown);
	}

	const exported = readNode<{default?: Shape}>(loaded);

	return exported.default ?? readNode<Shape>(loaded);
}
