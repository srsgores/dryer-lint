/**
 * One reading of a Tailwind class string, shared by the eslint rules and the stylelint plugins.
 * A class name is the one place a stylesheet gets written without a stylesheet, so it answers to the same rules a declaration does.
 * Physical box properties have a logical name, and a size is the content's to decide rather than a number typed here.
 */
import type {SizeAxis, SizePrefix} from "./types/classes.ts";

/** Physical utility prefixes and the logical prefix each one is written as instead. */
export const LOGICAL_REPLACEMENTS: Map<string, string> = new Map([
	["w", "inline"],
	["min-w", "min-inline"],
	["max-w", "max-inline"],
	["top", "inset-bs"],
	["bottom", "inset-be"],
	["left", "start"],
	["right", "end"],
	["inset-x", "inset-li"],
	["inset-y", "inset-bl"],
	["mt", "mbs"],
	["mb", "mbe"],
	["ml", "ms"],
	["mr", "me"],
	["mx", "mli"],
	["my", "mbl"],
	["pt", "pbs"],
	["pb", "pbe"],
	["pl", "ps"],
	["pr", "pe"],
	["px", "pli"],
	["py", "pbl"],
	["space-x", "space-is"],
	["space-y", "space-bs"],
	["divide-x", "divide-is"],
	["divide-y", "divide-bs"],
	["border-t", "border-bs"],
	["border-b", "border-be"],
	["border-l", "border-s"],
	["border-r", "border-e"],
	["border-x", "border-li"],
	["border-y", "border-bl"],
	["rounded-t", "rounded-bs"],
	["rounded-b", "rounded-be"],
	["rounded-l", "rounded-s"],
	["rounded-r", "rounded-e"],
	["rounded-tl", "rounded-ss"],
	["rounded-tr", "rounded-se"],
	["rounded-bl", "rounded-es"],
	["rounded-br", "rounded-ee"],
	["scroll-mx", "scroll-mli"],
	["scroll-my", "scroll-mbl"],
	["scroll-mt", "scroll-mbs"],
	["scroll-mb", "scroll-mbe"],
	["scroll-ml", "scroll-ms"],
	["scroll-mr", "scroll-me"],
	["scroll-px", "scroll-pli"],
	["scroll-py", "scroll-pbl"],
	["scroll-pt", "scroll-pbs"],
	["scroll-pb", "scroll-pbe"],
	["scroll-pl", "scroll-ps"],
	["scroll-pr", "scroll-pe"]
]);

/** Physical utilities that carry no value of their own, so a prefix match never sees them. */
export const BARE_REPLACEMENTS: Map<string, string> = new Map([
	["border-t", "border-bs"],
	["border-b", "border-be"],
	["border-l", "border-s"],
	["border-r", "border-e"],
	["border-x", "border-li"],
	["border-y", "border-bl"],
	["rounded-t", "rounded-bs"],
	["rounded-b", "rounded-be"],
	["rounded-l", "rounded-s"],
	["rounded-r", "rounded-e"],
	["rounded-tl", "rounded-ss"],
	["rounded-tr", "rounded-se"],
	["rounded-bl", "rounded-es"],
	["rounded-br", "rounded-ee"],
	["divide-x", "divide-is"],
	["divide-y", "divide-bs"],
	["space-x", "space-is"],
	["space-y", "space-bs"]
]);

/** Utilities that name a side of the page rather than a side of the writing, whole class and all. */
export const ALIGNMENT_REPLACEMENTS: Map<string, string> = new Map([
	["text-left", "text-start"],
	["text-right", "text-end"],
	["float-left", "float-start"],
	["float-right", "float-end"],
	["clear-left", "clear-start"],
	["clear-right", "clear-end"]
]);

/** Size prefixes on the block axis, where a cap pins a box just as a size does. */
const BLOCK_SIZE_PREFIXES: string[] = ["h", "min-h", "max-h", "block", "min-block", "max-block"];

/** Size prefixes on the inline axis, where the reading measure is the one exception. */
const INLINE_SIZE_PREFIXES: string[] = ["w", "min-w", "inline", "min-inline"];

/** Inline caps, which bound a container for reading rather than sizing it. */
const CAPPED_INLINE_PREFIXES: string[] = ["max-w", "max-inline"];

/** Values that say how a box is sized rather than how big it is. */
const NATURAL_VALUES: Set<string> = new Set(["full", "auto", "fit", "min", "max", "screen", "none", "prose", "inherit", "initial", "revert", "unset", "0"]);

/** Viewport units, which follow the screen the reader is actually holding. */
const VIEWPORT_VALUES: Set<string> = new Set(["svh", "dvh", "lvh", "svw", "dvw", "lvw", "vh", "vw", "dvi", "svi", "lvi", "dvb", "svb", "lvb"]);

/** Where a Tailwind value starts, so `bottom-start` is never read as a physical class. */
const TAILWIND_SCALE: RegExp =
	/^(?:\d|\[|\(|(?:full|auto|fit|px|min|max|screen|none|prose|dvh|dvw|svh|lvh|svw|lvw|xs|sm|md|lg|xl|current|transparent|inherit|white|black)\b)/;

/** A palette entry such as `red-500`, which is a value even though it is a word. */
const TAILWIND_PALETTE: RegExp = /^[a-z]+-\d{2,3}(?:\/\d{1,3})?$/;

/** A fraction of the space around it, which is a proportion rather than a length. */
const FRACTION: RegExp = /^\d+(?:\.\d+)?\/\d+$/;

/** A step on the spacing scale, which resolves to a fixed length. */
const SPACING_STEP: RegExp = /^\d+(?:\.\d+)?$/;

/** A value handed to the stylesheet as a custom property, which something else measured. */
const MEASURED_PROPERTY: RegExp = /^\(--/;

/** An arbitrary value, written between brackets. */
const ARBITRARY_VALUE: RegExp = /^\[.*\]$/;

/** A length that answers to nothing but the number in front of it. */
const FIXED_UNIT: RegExp = /\d(?:\.\d+)?(?:px|rem|em|ch|ex|pt|pc|cm|mm|in|q)\b/i;

/** A measure taken from the viewport, the container, the reader's text or something already measured. */
const RELATIVE_MEASURE: RegExp = /%|\bv(?:h|w|i|b|min|max)\b|\b[dsl]v[hwib]\b|\bcq[whibms]*\b|var\(|--/i;

/** The pixel a class asks for, spelled out with the number in front of it. */
const PIXEL_LENGTH: RegExp = /\d(?:\.\d+)?px\b/;

/** The important marker, which sits on either end of a utility in Tailwind 4. */
const IMPORTANT_MARKER: RegExp = /^!+|!+$/g;

/** Whitespace between one class and the next. */
const BETWEEN_CLASSES: RegExp = /\s+/;

/** A declaration whose value is one fixed length and nothing else. */
const FIXED_LENGTH_VALUE: RegExp = /^[\d.]+(?:px|rem|em|ch|ex|pt|pc|cm|mm|in|q)$/i;

/** A spacing step asked for in a stylesheet, which is a fixed length spelled differently. */
const SPACING_CALL: RegExp = /^--spacing\(\s*[\d.]+\s*\)$/;

/** Declarations that size a box on the block axis, caps included. */
export const BLOCK_SIZE_PROPERTIES: Set<string> = new Set(["height", "block-size", "min-height", "min-block-size", "max-height", "max-block-size"]);

/** Declarations that size a box on the inline axis, apart from the reading cap. */
export const INLINE_SIZE_PROPERTIES: Set<string> = new Set(["width", "inline-size", "min-width", "min-inline-size"]);

/** The reading cap, which bounds a column of text rather than sizing a box. */
export const CAPPED_INLINE_PROPERTIES: Set<string> = new Set(["max-width", "max-inline-size"]);

/**
 * Splits a string that may hold class names into the classes it holds.
 * @param text The string as it was written
 * @returns Every class in it, in the order they were written
 */
export function splitClassNames(text: string): string[] {
	return text.split(BETWEEN_CLASSES).filter(function isWritten(token: string): boolean {
		return token.length > 0;
	});
}

/**
 * Reads a class as the utility it applies, with its variants and its important marker taken off.
 * A variant carries brackets of its own, as `[&:hover]:mbs-4` does, so only a colon outside brackets separates one.
 * @param token The class as it was written
 * @returns The utility alone
 */
export function utilityOf(token: string): string {
	let depth = 0;
	let start = 0;

	for (let index = 0; index < token.length; index += 1) {
		const character = token.charAt(index);

		if (character === "[" || character === "(") {
			depth += 1;
		} else if (character === "]" || character === ")") {
			depth -= 1;
		} else if (character === ":" && depth === 0) {
			start = index + 1;
		}
	}

	return token.slice(start).replace(IMPORTANT_MARKER, "");
}

/**
 * Answers whether the text after a prefix is a value Tailwind would recognise.
 * @param written The text following the prefix
 * @returns True when it is a value rather than the rest of an English word
 */
function isTailwindValue(written: string): boolean {
	return TAILWIND_SCALE.test(written) || TAILWIND_PALETTE.test(written);
}

/**
 * Finds the longest physical prefix a utility is written with, so `min-w` is never read as `w`.
 * @param name The utility, without any negation
 * @returns The prefix, or an empty string when none of them fits
 */
function findPhysicalPrefix(name: string): string {
	let found = "";

	for (const [physical] of LOGICAL_REPLACEMENTS) {
		const isLonger = physical.length > found.length;

		if (isLonger && name.startsWith(`${physical}-`) && isTailwindValue(name.slice(physical.length + 1))) {
			found = physical;
		}
	}

	return found;
}

/**
 * Names the logical class a physical one should have been written as.
 * @param token The class as it was written
 * @returns What is wrong with it and what to write instead, or an empty string when nothing is
 */
export function describePhysicalClass(token: string): string {
	const utility = utilityOf(token);
	const negated = utility.startsWith("-");
	const name = negated ? utility.slice(1) : utility;
	const sign = negated ? "-" : "";
	let message = "";

	if (ALIGNMENT_REPLACEMENTS.has(name)) {
		message = `${token} is a physical alignment; use ${ALIGNMENT_REPLACEMENTS.get(name)}`;
	} else if (BARE_REPLACEMENTS.has(name)) {
		message = `${token} is a physical property; use ${sign}${BARE_REPLACEMENTS.get(name)}`;
	} else {
		const prefix = findPhysicalPrefix(name);

		if (prefix !== "") {
			message = `${token} is a physical property; use ${sign}${LOGICAL_REPLACEMENTS.get(prefix)}-${name.slice(prefix.length + 1)}`;
		}
	}

	return message;
}

/**
 * Answers whether a utility's value pins a box to a length nothing else can talk it out of.
 * @param written The value the utility was given
 * @returns True when the value is a fixed length
 */
export function isFixedLength(written: string): boolean {
	const isMeasured = MEASURED_PROPERTY.test(written) || FRACTION.test(written) || NATURAL_VALUES.has(written) || VIEWPORT_VALUES.has(written);
	let isFixed = false;

	if (ARBITRARY_VALUE.test(written)) {
		isFixed = !RELATIVE_MEASURE.test(written) && FIXED_UNIT.test(written);
	} else if (!isMeasured) {
		isFixed = written === "px" || (SPACING_STEP.test(written) && written !== "0");
	}

	return isFixed;
}

/**
 * Finds the axis a sizing utility works on, so the report says which way the box was pinned.
 * @param name The utility, without any negation
 * @param allowMaxInline Whether a reading cap on the inline axis is left alone
 * @returns The axis and the prefix, with an empty prefix when the utility sizes nothing
 */
function findSizePrefix(name: string, allowMaxInline: boolean): SizePrefix {
	const capped: string[] = allowMaxInline ? [] : CAPPED_INLINE_PREFIXES;
	const inlinePrefixes: string[] = [...INLINE_SIZE_PREFIXES, ...capped];
	const axes: [SizeAxis, string[]][] = [
		["block", BLOCK_SIZE_PREFIXES],
		["inline", inlinePrefixes]
	];
	let found: SizePrefix = {axis: "block", prefix: ""};

	for (const [axis, prefixes] of axes) {
		for (const prefix of prefixes) {
			if (prefix.length > found.prefix.length && name.startsWith(`${prefix}-`)) {
				found = {axis, prefix};
			}
		}
	}

	return found;
}

/**
 * Names what a class does to a box that the box should have decided for itself.
 * @param token The class as it was written
 * @param allowMaxInline Whether a reading cap on the inline axis is left alone
 * @returns What is wrong with it, or an empty string when nothing is
 */
export function describeNaturalSize(token: string, allowMaxInline: boolean): string {
	const utility = utilityOf(token);
	const negated = utility.startsWith("-");
	const name = negated ? utility.slice(1) : utility;
	const {axis, prefix} = findSizePrefix(name, allowMaxInline);
	let message = "";

	if (name.startsWith("size-")) {
		message = `${token} sets a physical width and height; size an icon with the text around it using \`icon\`, or use inline-* with aspect-square`;
	} else if (prefix !== "" && isFixedLength(name.slice(prefix.length + 1))) {
		message = `${token} pins an element to a fixed ${axis} size; let it take its natural size, or bound it with a viewport unit or a measured custom property`;
	} else if (hasPixelLength(token)) {
		message = `${token} is a length in pixels; use a rem, a spacing step or a percentage so it follows the reader's text size`;
	}

	return message;
}

/**
 * Answers whether a class asks for a length in pixels, whichever way it spells one.
 * @param token The class as it was written
 * @returns True when a pixel length is written into it
 */
export function hasPixelLength(token: string): boolean {
	const utility = utilityOf(token);

	return PIXEL_LENGTH.test(utility) || utility.endsWith("-px");
}

/**
 * Answers whether a declaration's value pins a box to a length rather than letting its content decide.
 * @param written The declaration's value, as the stylesheet wrote it
 * @returns True when the value is a fixed length
 */
export function isFixedDeclaration(written: string): boolean {
	const trimmed = written.trim();

	return FIXED_LENGTH_VALUE.test(trimmed) || SPACING_CALL.test(trimmed);
}
