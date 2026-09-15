/** The whole config, run over a small set of files the way a project would run it. */
import assert from "node:assert/strict";
import {dirname, join} from "node:path";
import {test} from "node:test";
import {fileURLToPath} from "node:url";
import {ESLint} from "eslint";
import type {Linter} from "eslint";
import {dryerLint} from "../eslint/index.ts";

/** Where the files this test lints sit, whichever directory the test was started from. */
const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), "fixtures");

/**
 * Lints the fixtures with the whole house config and gathers what was said about each file.
 * @returns Every message, as the file it was about and the text of what was said
 */
async function lintFixtures(): Promise<{file: string; rule: string; text: string}[]> {
	const configuration = await dryerLint({svelte: true, astro: true});
	const eslint = new ESLint({
		cwd: FIXTURES,
		overrideConfigFile: true,
		overrideConfig: configuration as Linter.Config[]
	});
	const linted = await eslint.lintFiles(["."]);

	return linted.flatMap(function toMessages(one): {file: string; rule: string; text: string}[] {
		return one.messages.map(function toMessage(said): {file: string; rule: string; text: string} {
			return {file: one.filePath.replace(`${FIXTURES}/`, ""), rule: said.ruleId ?? "", text: said.message};
		});
	});
}

test("the house config reads svelte, astro and typescript in one run", async function checksEveryFixture(): Promise<void> {
	const said = await lintFixtures();

	/**
	 * Answers whether one file was told one thing.
	 * @param file The fixture
	 * @param rule The rule that should have spoken
	 * @param wanted What it should have said
	 * @returns True when that message is among the ones gathered
	 */
	function reported(file: string, rule: string, wanted: string): boolean {
		return said.some(function matches(one): boolean {
			return one.file === file && one.rule === rule && one.text.includes(wanted);
		});
	}

	assert.ok(reported("Card.svelte", "dryer/logical-classes", "pl-2 is a physical property; use ps-2"));
	assert.ok(reported("Card.svelte", "dryer/logical-classes", "mt-4 is a physical property; use mbs-4"));
	assert.ok(reported("Card.svelte", "dryer/natural-size", "size-6 sets a physical width and height"));
	assert.ok(reported("Card.svelte", "dryer/unbroken-sentences", "This sentence runs onto the next line"));
	assert.ok(reported("page.astro", "dryer/logical-classes", "mb-4 is a physical property; use mbe-4"));
	assert.ok(reported("page.astro", "dryer/logical-classes", "text-left is a physical alignment; use text-start"));
	assert.ok(reported("page.astro", "dryer/natural-size", "h-64 pins an element to a fixed block size"));
	assert.ok(reported("module.ts", "dryer/one-return", "This returns before the end of the function"));
	assert.ok(reported("arrow.ts", "dryer/named-functions", "This arrow function never uses `this`"));
});

test("an astro page may redirect from its frontmatter without answering twice", async function checksFrontmatterReturn(): Promise<void> {
	const said = await lintFixtures();
	const complained = said.some(function isAboutReturns(one): boolean {
		return one.file === "page.astro" && one.rule === "dryer/one-return";
	});

	assert.equal(complained, false);
});
