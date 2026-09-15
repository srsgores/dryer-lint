/**
 * What `dryer/logical-classes` recommends has to be a class that exists, or the rule is telling projects to write nothing.
 * Tailwind's physical utilities take a handful of keyword values, so every keyword the rule can carry across is checked here.
 */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {dirname, join} from "node:path";
import {test} from "node:test";
import {fileURLToPath} from "node:url";
import {describeNaturalSize, describePhysicalClass} from "../lib/classes.ts";

/** Where the stylesheet sits, whichever directory the test was started from. */
const STYLESHEET = join(dirname(dirname(fileURLToPath(import.meta.url))), "tailwind.css");

/** A utility this stylesheet defines, either as a whole name or as a name with a value after it. */
const DEFINED_UTILITY: RegExp = /^@utility\s+(\S+?)\s*\{/gm;

/** How a suggestion is introduced, so the class itself can be read back out of the sentence. */
const SUGGESTION: RegExp = /; use (\S+)$/;

/**
 * Logical utilities Tailwind ships itself, which this stylesheet has no reason to define again.
 * Every one is a real Tailwind 4 utility.
 * They are the inline margins and padding, the inline insets, the side and corner radii, and the logical alignments.
 */
const TAILWIND_SHIPS: Set<string> = new Set([
	"ms",
	"me",
	"ps",
	"pe",
	"start",
	"end",
	"scroll-ms",
	"scroll-me",
	"scroll-ps",
	"scroll-pe",
	"rounded-s",
	"rounded-e",
	"rounded-ss",
	"rounded-se",
	"rounded-es",
	"rounded-ee",
	"border-s",
	"border-e",
	"text-start",
	"text-end",
	"float-start",
	"float-end",
	"clear-start",
	"clear-end"
]);

/**
 * The keyword values each physical utility actually takes in Tailwind 4.
 * A keyword the physical utility does not take is one the rule can never meet in real markup, so it is not asked for here.
 */
const KEYWORDS_TAKEN: [string, string[]][] = [
	["w", ["auto", "full", "fit", "min", "max", "screen", "px"]],
	["min-w", ["auto", "full", "fit", "min", "max", "screen", "px"]],
	["max-w", ["none", "full", "fit", "min", "max", "screen", "px"]],
	["top", ["auto", "full", "px"]],
	["bottom", ["auto", "full", "px"]],
	["left", ["auto", "full", "px"]],
	["right", ["auto", "full", "px"]],
	["inset-x", ["auto", "full", "px"]],
	["inset-y", ["auto", "full", "px"]],
	["mt", ["auto", "px"]],
	["mb", ["auto", "px"]],
	["ml", ["auto", "px"]],
	["mr", ["auto", "px"]],
	["mx", ["auto", "px"]],
	["my", ["auto", "px"]],
	["pt", ["px"]],
	["pb", ["px"]],
	["pl", ["px"]],
	["pr", ["px"]],
	["px", ["px"]],
	["py", ["px"]],
	["space-x", ["px"]],
	["space-y", ["px"]],
	["divide-x", ["px"]],
	["divide-y", ["px"]],
	["rounded-t", ["none", "full"]],
	["rounded-b", ["none", "full"]],
	["rounded-l", ["none", "full"]],
	["rounded-r", ["none", "full"]],
	["rounded-tl", ["none", "full"]],
	["rounded-tr", ["none", "full"]],
	["rounded-bl", ["none", "full"]],
	["rounded-br", ["none", "full"]],
	["scroll-mx", ["px"]],
	["scroll-my", ["px"]],
	["scroll-mt", ["px"]],
	["scroll-mb", ["px"]],
	["scroll-ml", ["px"]],
	["scroll-mr", ["px"]],
	["scroll-px", ["px"]],
	["scroll-py", ["px"]],
	["scroll-pt", ["px"]],
	["scroll-pb", ["px"]],
	["scroll-pl", ["px"]],
	["scroll-pr", ["px"]]
];

/**
 * Reads every utility the stylesheet defines, keeping the star that stands for a value.
 * @returns The name of each utility, as the stylesheet wrote it
 */
function readDefinedUtilities(): Set<string> {
	const stylesheet = readFileSync(STYLESHEET, "utf8");
	const defined: Set<string> = new Set();

	for (const [, name] of stylesheet.matchAll(DEFINED_UTILITY)) {
		defined.add(name);
	}

	return defined;
}

/** Every utility this package's stylesheet defines, read once. */
const DEFINED = readDefinedUtilities();

/**
 * Answers whether a class the rule suggested for a keyword value is one somebody could actually write.
 * A keyword needs a utility of its own: a `foo-*` pattern matches a number or an arbitrary value and generates nothing for `auto`.
 * So it counts only when this stylesheet names the whole class, or when Tailwind ships the prefix it is built on.
 * @param suggested The class the rule recommended
 * @returns True when the class resolves to something
 */
function isWritable(suggested: string): boolean {
	const cut = suggested.lastIndexOf("-");
	const prefix = cut > 0 ? suggested.slice(0, cut) : suggested;

	return DEFINED.has(suggested) || TAILWIND_SHIPS.has(prefix) || TAILWIND_SHIPS.has(suggested);
}

/**
 * Reads the class out of the sentence the rule wrote about a physical one.
 * @param token The physical class
 * @returns The class the rule recommended instead
 */
function suggestionFor(token: string): string {
	const explanation = describePhysicalClass(token);
	const [, suggested = ""] = SUGGESTION.exec(explanation) ?? [];

	return suggested;
}

test("every keyword class the rule recommends is one the stylesheet or Tailwind defines", function checksKeywordCoverage(): void {
	const missing: string[] = [];

	for (const [physical, keywords] of KEYWORDS_TAKEN) {
		for (const keyword of keywords) {
			const token = `${physical}-${keyword}`;
			const suggested = suggestionFor(token);

			assert.notEqual(suggested, "", `${token} should be reported as physical`);

			/*
			 * A pixel class is the one thing this package refuses to define, so the pixel rule answers it instead of the stylesheet.
			 * Being told to stop using pixels is a better answer than being handed a logical class that is also a pixel.
			 */
			const refusedOnPurpose = keyword === "px" && describeNaturalSize(token, true) !== "";

			if (!refusedOnPurpose && !isWritable(suggested)) {
				missing.push(`${token} -> ${suggested}`);
			}
		}
	}

	assert.deepEqual(missing, []);
});

test("the stylesheet defines the auto margins the centring advice depends on", function checksAutoMargins(): void {
	assert.equal(suggestionFor("mx-auto"), "mli-auto");
	assert.ok(DEFINED.has("mli-auto"));
	assert.ok(DEFINED.has("mbl-auto"));
	assert.ok(DEFINED.has("mbs-auto"));
	assert.ok(DEFINED.has("mbe-auto"));
});

test("a negative margin keeps a utility of its own on every axis", function checksNegativeMargins(): void {
	assert.ok(DEFINED.has("-mbs-*"));
	assert.ok(DEFINED.has("-mbe-*"));
	assert.ok(DEFINED.has("-mbl-*"));
	assert.ok(DEFINED.has("-mli-*"));
});
