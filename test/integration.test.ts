/** The whole config, run over a small set of files the way a project would run it. */
import assert from "node:assert/strict";
import {dirname, join} from "node:path";
import {test} from "node:test";
import {fileURLToPath} from "node:url";
import {ESLint} from "eslint";
import type {Linter} from "eslint";
import {dryerLint} from "#eslint/index.ts";
import type {DryerLintOptions} from "#lib/types/options.ts";

/**
 * Answers whether a rule that spoke was the denylist.
 * @param rule The rule that reported
 * @returns True when it was id-denylist
 */
function isDenylist(rule: string): boolean {
	return rule === "id-denylist";
}

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

/**
 * Answers whether one file was told one thing.
 * @param said The gathered lint reports
 * @param file The fixture
 * @param rule The rule that should have spoken
 * @param wanted What it should have said
 * @returns True when that message is among the ones gathered
 */
function reported(said: Array<{file: string; rule: string; text: string}>, file: string, rule: string, wanted: string): boolean {
	return said.some(function matches(one): boolean {
		return one.file === file && one.rule === rule && one.text.includes(wanted);
	});
}

test("the house config reads svelte, astro and typescript in one run", async function checksEveryFixture(): Promise<void> {
	const said = await lintFixtures();

	assert.ok(reported(said, "Card.svelte", "dryer/logical-classes", "pl-2 is a physical property; use ps-2"));
	assert.ok(reported(said, "Card.svelte", "dryer/logical-classes", "mt-4 is a physical property; use mbs-4"));
	assert.ok(reported(said, "Card.svelte", "dryer/natural-size", "size-6 sets a physical width and height"));
	assert.ok(reported(said, "Card.svelte", "dryer/unbroken-sentences", "This sentence runs onto the next line"));
	assert.ok(reported(said, "Card.svelte", "dryer/heading-group", "probably meant to use an <hgroup> instead"));
	assert.ok(reported(said, "pages/page.astro", "dryer/logical-classes", "mb-4 is a physical property; use mbe-4"));
	assert.ok(reported(said, "pages/page.astro", "dryer/logical-classes", "text-left is a physical alignment; use text-start"));
	assert.ok(reported(said, "pages/page.astro", "dryer/natural-size", "h-64 pins an element to a fixed block size"));
	assert.ok(reported(said, "module.ts", "dryer/one-return", "This returns before the end of the function"));
	assert.ok(reported(said, "arrow.ts", "dryer/named-functions", "This arrow function never uses `this`"));
});

test("an astro page may redirect from its frontmatter without answering twice", async function checksFrontmatterReturn(): Promise<void> {
	const said = await lintFixtures();
	const complained = said.some(function isAboutReturns(one): boolean {
		return one.file === "pages/page.astro" && one.rule === "dryer/one-return";
	});

	assert.equal(complained, false);
});

/**
 * Lints one line of TypeScript with the house config, and names the rules that spoke.
 * @param code The line to lint
 * @param options What the project would have said about itself
 * @returns Every rule that reported, in the order it reported
 */
async function rulesThatSpoke(code: string, options: DryerLintOptions): Promise<string[]> {
	const configuration = await dryerLint(options);
	const eslint = new ESLint({overrideConfigFile: true, overrideConfig: configuration as Linter.Config[]});
	const linted = await eslint.lintText(code, {filePath: "thing.ts"});

	return linted.flatMap(function toRules(one): string[] {
		return one.messages.map(function toRule(said): string {
			return said.ruleId ?? "";
		});
	});
}

test("a vague name is denied until the project says the shape is not its own", async function checksAllowNames(): Promise<void> {
	const denied = await rulesThatSpoke('export const tag = {content: "one", item: "two"};', {documentation: false});
	const allowed = await rulesThatSpoke('export const tag = {content: "one", item: "two"};', {
		documentation: false,
		allowNames: ["content", "params", "items", "item"]
	});

	assert.equal(denied.filter(isDenylist).length, 2);
	assert.equal(allowed.filter(isDenylist).length, 0);
});

test("allowing a name leaves the rest of the denylist standing", async function checksAllowNamesIsNarrow(): Promise<void> {
	const spoke = await rulesThatSpoke('export const tag = {content: "one", payload: "two"};', {documentation: false, allowNames: ["content"]});

	assert.equal(spoke.filter(isDenylist).length, 1);
});

test("a name the project adds is denied alongside the built-in ones", async function checksVagueNamesStillAdds(): Promise<void> {
	const spoke = await rulesThatSpoke('export const tag = {blob: "one"};', {documentation: false, vagueNames: ["blob"]});

	assert.equal(spoke.filter(isDenylist).length, 1);
});

test("the HTML layer reports bare divs and leaves dl groups alone", async function checksHtmlBareDivs(): Promise<void> {
	const configuration = await dryerLint({html: true});
	const eslint = new ESLint({overrideConfigFile: true, overrideConfig: configuration as Linter.Config[]});
	const [invalid] = await eslint.lintText("<div></div>", {filePath: "index.html"});
	const [valid] = await eslint.lintText("<dl><div><dt>Term</dt><dd>Def</dd></div></dl>", {filePath: "index.html"});

	assert.equal(
		invalid.messages.some(function isBareDiv(said): boolean {
			return said.ruleId === "dryer/no-bare-divs";
		}),
		true
	);
	assert.equal(
		valid.messages.some(function isBareDiv(said): boolean {
			return said.ruleId === "dryer/no-bare-divs";
		}),
		false
	);
});

test("typed layers ignore framework virtual script blocks so typescript project service skips them", async function checksFrameworkVirtualIgnores(): Promise<void> {
	const configuration = await dryerLint({astro: true, typed: true});
	const typedConfig = configuration.find(function isTypedLayer(one): boolean {
		const parserOptions = one.languageOptions?.parserOptions as {projectService?: boolean} | undefined;
		return parserOptions?.projectService === true;
	});

	assert.ok(typedConfig?.ignores?.includes("**/*.astro"));
	assert.ok(typedConfig?.ignores?.includes("**/*.astro/*"));
	assert.ok(typedConfig?.ignores?.includes("**/*.svelte/*"));

	const eslint = new ESLint({
		overrideConfigFile: true,
		overrideConfig: configuration as Linter.Config[]
	});

	/**
	 * An Astro page with an early return in a client script:
	 * Without the fix, this fails to parse and reports 0 script errors.
	 * With the fix, projectService is skipped and dryer/one-return speaks.
	 */
	const [linted] = await eslint.lintText("<script>\nfunction test(val: number): void {\n  if (val < 0) return;\n  return;\n}\n</script>\n", {
		filePath: "src/pages/sample.astro"
	});

	const projectServiceError = linted.messages.some(function isProjectServiceError(lintedMessage): boolean {
		return lintedMessage.ruleId === null && lintedMessage.message.includes("project service");
	});
	assert.equal(projectServiceError, false);

	const caughtOneReturn = linted.messages.some(function isOneReturn(lintedMessage): boolean {
		return lintedMessage.ruleId === "dryer/one-return";
	});
	assert.equal(caughtOneReturn, true);
});

test("canonical classes stay off until a stylesheet is named", async function checksCanonicalIsOptIn(): Promise<void> {
	const configuration = await dryerLint({documentation: false});
	const house = configuration.find(function hasHouseRules(one): boolean {
		return one.rules?.["dryer/one-return"] === "error";
	});

	assert.equal(house?.rules?.["tailwind-canonical-classes/tailwind-canonical-classes"], undefined);
});

test("eslint --fix rewrites a non-canonical tailwind class", async function checksCanonicalFix(): Promise<void> {
	const cssPath = join(FIXTURES, "app.css");
	const configuration = await dryerLint({svelte: true, documentation: false, cssPath});
	const eslint = new ESLint({
		overrideConfigFile: true,
		overrideConfig: configuration as Linter.Config[],
		fix: true
	});
	const [linted] = await eslint.lintText('<div class="p-[16px]"></div>\n', {filePath: "Card.svelte"});

	assert.equal(linted.output, '<div class="p-4"></div>\n');
});
