/** The stylesheet plugins, put to stylelint's own lint API. */
import assert from "node:assert/strict";
import {test} from "node:test";
import stylelint from "stylelint";
import type {Config} from "stylelint";
import naturalSize from "#stylelint/plugins/natural-size.ts";
import noPixelClasses from "#stylelint/plugins/no-pixel-classes.ts";
import houseConfig from "#stylelint/index.ts";

/** Just the two plugins, so a case tests one rule rather than the whole config. */
const plugins: Config = {plugins: [naturalSize, noPixelClasses]};

/**
 * Lints one stylesheet and hands back what stylelint said about it.
 * @param code The stylesheet
 * @param config The config to lint it with
 * @returns Every warning, in the order stylelint found them
 */
async function warningsFor(code: string, config: Config): Promise<{rule: string; text: string}[]> {
	const linted = await stylelint.lint({code, config, codeFilename: "test.css"});
	const [first] = linted.results;

	return (first?.warnings ?? []).map(function toWarning(warning): {rule: string; text: string} {
		return {rule: warning.rule, text: warning.text};
	});
}

test("dryer/natural-size reports a declaration pinned to a fixed length", async function checksPinnedDeclarations(): Promise<void> {
	const warnings = await warningsFor("a { block-size: 4rem; }", {...plugins, rules: {"dryer/natural-size": true}});

	assert.equal(warnings.length, 1);
	assert.match(warnings[0].text, /pins the element to a fixed block size/);
});

test("dryer/natural-size reports an inline size and a spacing call", async function checksInlineDeclarations(): Promise<void> {
	const fixed = await warningsFor("a { width: 20rem; }", {...plugins, rules: {"dryer/natural-size": true}});
	const spacing = await warningsFor("a { min-block-size: --spacing(16); }", {...plugins, rules: {"dryer/natural-size": true}});

	assert.match(fixed[0].text, /pins the element to a fixed inline size/);
	assert.match(spacing[0].text, /pins the element to a fixed block size/);
});

test("dryer/natural-size leaves measured and proportional sizes alone", async function checksMeasuredDeclarations(): Promise<void> {
	const warnings = await warningsFor("a { inline-size: 100%; block-size: 50dvh; min-inline-size: var(--measured); max-inline-size: 60ch; }", {
		...plugins,
		rules: {"dryer/natural-size": true}
	});

	assert.deepEqual(warnings, []);
});

test("dryer/natural-size forbids a reading cap when the project asks it to", async function checksCappedInline(): Promise<void> {
	const warnings = await warningsFor("a { max-inline-size: 60ch; }", {...plugins, rules: {"dryer/natural-size": [true, {allowMaxInline: false}]}});

	assert.equal(warnings.length, 1);
	assert.match(warnings[0].text, /pins the element to a fixed inline size/);
});

test("dryer/natural-size reads the classes an apply was given", async function checksAppliedClasses(): Promise<void> {
	const warnings = await warningsFor("a { @apply h-64 size-6; }", {...plugins, rules: {"dryer/natural-size": true}});

	assert.equal(warnings.length, 2);
	assert.match(warnings[0].text, /h-64 pins an element to a fixed block size/);
	assert.match(warnings[1].text, /size-6 sets a physical width and height/);
});

test("dryer/no-pixel-classes reports a pixel length inside an applied class", async function checksPixelClasses(): Promise<void> {
	const warnings = await warningsFor("a { @apply gap-[3px] mbs-4; }", {...plugins, rules: {"dryer/no-pixel-classes": true}});

	assert.equal(warnings.length, 1);
	assert.match(warnings[0].text, /Use a Tailwind spacing step rather than the pixel length in "gap-\[3px\]"/);
});

test("the shipped config keeps colours in the theme and lengths off the screen", async function checksHouseConfig(): Promise<void> {
	const warnings = await warningsFor("a { color: #ff0000; border-block-start-width: 2px; background: rgb(1 2 3); }", houseConfig);
	const said = warnings.map(function toText(warning): string {
		return warning.text;
	});

	assert.ok(
		said.some(function mentionsHex(text: string): boolean {
			return text.includes("A colour written by hand belongs to nothing");
		})
	);
	assert.ok(
		said.some(function mentionsPixels(text: string): boolean {
			return text.includes("A pixel is a decision about somebody else's screen");
		})
	);
	assert.ok(
		said.some(function mentionsOklch(text: string): boolean {
			return text.includes("Theme colours are written in oklch");
		})
	);
});

test("the shipped config can be reached by its subpath export", async function checksExtendsBySubpath(): Promise<void> {
	const linted = await stylelint.lint({
		code: "a { block-size: 4rem; }",
		config: {extends: ["dryer-lint/stylelint"]},
		configBasedir: process.cwd(),
		codeFilename: "test.css"
	});
	const [first] = linted.results;
	const said = (first?.warnings ?? []).map(function toRule(warning): string {
		return warning.rule;
	});

	assert.ok(said.includes("dryer/natural-size"));
});
