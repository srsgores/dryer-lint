/** Every rule this package writes itself, put to eslint's own rule tester. */
import {describe, it} from "node:test";
import {RuleTester} from "eslint";
import tseslint from "typescript-eslint";
import aliasedImports from "#eslint/rules/aliased-imports.ts";
import arrayDestructuring from "#eslint/rules/array-destructuring.ts";
import logicalClasses from "#eslint/rules/logical-classes.ts";
import namedFunctions from "#eslint/rules/named-functions.ts";
import namedPatterns from "#eslint/rules/named-patterns.ts";
import naturalSize from "#eslint/rules/natural-size.ts";
import noArrayChain from "#eslint/rules/no-array-chain.ts";
import noBareDivs from "#eslint/rules/no-bare-divs.ts";
import noInlineSql from "#eslint/rules/no-inline-sql.ts";
import noProseLineComments from "#eslint/rules/no-prose-line-comments.ts";
import notesAreAsides from "#eslint/rules/notes-are-asides.ts";
import oneReturn from "#eslint/rules/one-return.ts";
import switchBreak from "#eslint/rules/switch-break.ts";
import themeColours from "#eslint/rules/theme-colours.ts";
import typesDirectory from "#eslint/rules/types-directory.ts";
import unwrappedComments from "#eslint/rules/unwrapped-comments.ts";
import verbFirstDescriptions from "#eslint/rules/verb-first-descriptions.ts";

RuleTester.describe = describe;
RuleTester.it = it;

/** Plain modules, which is what most of the rules read. */
const script = new RuleTester({languageOptions: {ecmaVersion: 2024, sourceType: "module"}});

/** TypeScript modules, for the rules that only have anything to say about types. */
const typescript = new RuleTester({
	languageOptions: {parser: tseslint.parser, ecmaVersion: 2024, sourceType: "module"}
});

script.run("one-return", oneReturn, {
	valid: [
		"function only() { let answer = 1; if (answer) { answer = 2; } return answer; }",
		"function guarded() { let answer = 0; try { answer = 1; return answer; } finally { close(); } }",
		"const redirect = Astro.redirect('/in');"
	],
	invalid: [
		{code: "function twice(ask) { if (ask) { return 1; } return 2; }", errors: [{messageId: "earlyReturn"}, {messageId: "tooManyReturns"}]},
		{code: "function early(ask) { if (ask) { return 1; } doSomething(); }", errors: [{messageId: "earlyReturn"}]}
	]
});

script.run("unwrapped-comments", unwrappedComments, {
	valid: ["/** One sentence, finished. */\nconst one = 1;", "/**\n * One sentence.\n * Another sentence.\n */\nconst two = 2;"],
	invalid: [
		{code: "/**\n * A sentence that carries\n * onto the next line.\n */\nconst three = 3;", errors: [{messageId: "wrapped"}]},
		{code: `/** ${"a".repeat(150)} */\nconst four = 4;`, errors: [{messageId: "long"}]}
	]
});

script.run("named-functions", namedFunctions, {
	valid: ["const bound = {run() { return () => this.name; }};", "records.map(function toName(record) { return record.name; });"],
	invalid: [{code: "records.map((record) => record.name);", errors: [{messageId: "unnamed"}]}]
});

script.run("named-patterns", namedPatterns, {
	valid: ["const TRAILING_SPACE = /\\s+$/;\nif (TRAILING_SPACE.test(line)) { report(); }"],
	invalid: [{code: "if (/\\s+$/.test(line)) { report(); }", errors: [{messageId: "unnamed"}]}]
});

script.run("theme-colours", themeColours, {
	valid: [{code: 'const brand = "#ff0000";', filename: "app.css"}, 'const brand = "var(--brand)";'],
	invalid: [
		{code: 'const brand = "#ff0000";', filename: "page.ts", errors: [{messageId: "written"}]},
		{code: "const brand = `rgb(1 2 3)`;", filename: "page.ts", errors: [{messageId: "written"}]}
	]
});

script.run("aliased-imports", aliasedImports, {
	valid: [
		{code: 'import {one} from "$lib/one.ts";', filename: "src/routes/page.ts"},
		{code: 'import {Load} from "./$types";', filename: "src/routes/page.ts"},
		{code: 'import config from "./elsewhere.ts";', filename: "src/pages/page.ts"},
		{code: 'import {dryerLint} from "../eslint/index.ts";', filename: "eslint.config.ts"}
	],
	invalid: [
		{
			code: 'import {one} from "../lib/one.ts";',
			filename: "src/routes/page.ts",
			output: 'import {one} from "$lib/one.ts";',
			errors: [{messageId: "useAlias"}]
		},
		{
			code: 'import {two} from "../../tests/two.ts";',
			filename: "src/deep/page.ts",
			options: [[{prefix: "tests", alias: "@tests"}]],
			output: 'import {two} from "@tests/two.ts";',
			errors: [{messageId: "useAlias"}]
		},
		{
			code: 'import {readNode} from "../../lib/nodes.ts";',
			filename: "eslint/rules/no-bare-divs.ts",
			errors: [{messageId: "noRelative"}]
		},
		{
			code: 'import {something} from "../unaliased/module.ts";',
			filename: "src/deep/page.ts",
			errors: [{messageId: "noRelative"}]
		}
	]
});

script.run("array-destructuring", arrayDestructuring, {
	valid: ["const [first] = list;", "const found = list[index];"],
	invalid: [{code: "const first = list[0];", errors: [{messageId: "destructure"}]}]
});

typescript.run("types-directory", typesDirectory, {
	valid: [
		{code: "interface Shape { side: number; }", filename: "src/types/shape.ts"},
		{code: "type Shape = {side: number};", filename: "src/app.d.ts"}
	],
	invalid: [
		{code: "interface Shape { side: number; }", filename: "src/page.ts", errors: [{messageId: "typesDirectory"}]},
		{code: "interface Props { title: string; }", filename: "src/page.ts", errors: [{messageId: "typesDirectory"}]}
	]
});

script.run("switch-break", switchBreak, {
	valid: ["switch (kind) { case 1: break; default: break; }", "const found = list.find(function isReady(one) { return one.ready; });"],
	invalid: [{code: "for (const one of list) { break; }", errors: [{messageId: "outsideSwitch"}]}]
});

script.run("no-array-chain", noArrayChain, {
	valid: ["const names = list.flatMap(function toNames(one) { return one.names; });", "const names = list.map(toName).join(', ');"],
	invalid: [{code: "const names = list.filter(isReady).map(toName);", errors: [{messageId: "chained"}]}]
});

script.run("no-inline-sql", noInlineSql, {
	valid: ['const note = "chosen from the menu";', 'import statement from "./query.surql";'],
	invalid: [
		{code: 'const query = "SELECT * FROM invoice";', errors: [{messageId: "inlineSql"}]},
		{code: "const query = `UPDATE invoice SET paid = true`;", errors: [{messageId: "inlineSql"}]}
	]
});

script.run("no-prose-line-comments", noProseLineComments, {
	valid: ["// eslint-disable-next-line no-undef\nconst one = 1;", "/** A note, said properly. */\nconst two = 2;"],
	invalid: [{code: "// a note in passing\nconst three = 3;", errors: [{messageId: "notDocumentation"}]}]
});

script.run("verb-first-descriptions", verbFirstDescriptions, {
	valid: ["/** Builds one row of the table. */\nfunction buildRow() {}", "/** A table of rows. */\nconst rows = [];"],
	invalid: [
		{code: "/** A helper for the table. */\nfunction buildRow() {}", errors: [{messageId: "notAVerb"}]},
		{code: "/** Returns one row. */\nfunction buildRow() {}", errors: [{messageId: "saysTheReturn"}]}
	]
});

script.run("notes-are-asides", notesAreAsides, {
	valid: ["/**\n * Builds a row.\n * @note The order follows the header.\n */\nfunction buildRow() {}"],
	invalid: [{code: "/**\n * Builds a row.\n * @note Throws when the header is missing.\n */\nfunction buildRow() {}", errors: [{messageId: "noteThrows"}]}]
});

script.run("logical-classes", logicalClasses, {
	valid: [
		'const classes = "mbs-4 pli-2 inset-bs-0 rounded-bs-lg text-start";',
		'const corner = "bottom-start";',
		'const nearly = "text-lefty";',
		'const prop = {position: "bottom-right"};'
	],
	invalid: [
		{code: 'const classes = "mt-4";', errors: [{messageId: "physical", data: {explanation: "mt-4 is a physical property; use mbs-4"}}]},
		{code: 'const classes = "md:hover:-ml-2";', errors: [{messageId: "physical", data: {explanation: "md:hover:-ml-2 is a physical property; use -ms-2"}}]},
		{code: 'const classes = "text-left";', errors: [{messageId: "physical", data: {explanation: "text-left is a physical alignment; use text-start"}}]},
		{code: 'const classes = "divide-y";', errors: [{messageId: "physical", data: {explanation: "divide-y is a physical property; use divide-bs"}}]},
		{code: 'const classes = "border-x-2";', errors: [{messageId: "physical", data: {explanation: "border-x-2 is a physical property; use border-li-2"}}]},
		{code: 'const classes = "border-y";', errors: [{messageId: "physical", data: {explanation: "border-y is a physical property; use border-bl"}}]},
		{code: "const classes = `w-[3rem]`;", errors: [{messageId: "physical", data: {explanation: "w-[3rem] is a physical property; use inline-[3rem]"}}]}
	]
});

script.run("natural-size", naturalSize, {
	valid: [
		'const classes = "block-full inline-full h-dvh max-inline-prose min-inline-0";',
		'const classes = "h-[50vh] inline-1/2 h-(--measured) max-w-prose";',
		'const classes = "h-full w-auto h-screen";'
	],
	invalid: [
		{code: 'const classes = "h-64";', errors: [{messageId: "pinned"}]},
		{code: 'const classes = "min-block-[3rem]";', errors: [{messageId: "pinned"}]},
		{code: 'const classes = "max-h-96";', errors: [{messageId: "pinned"}]},
		{code: 'const classes = "inline-12";', errors: [{messageId: "pinned"}]},
		{code: 'const classes = "size-4";', errors: [{messageId: "pinned"}]},
		{code: 'const classes = "gap-[3px]";', errors: [{messageId: "pinned"}]},
		{code: 'const classes = "max-inline-64";', options: [{allowMaxInline: false}], errors: [{messageId: "pinned"}]}
	]
});

/** JSX modules, for the rules that inspect tags and markup written in JavaScript. */
const jsx = new RuleTester({
	languageOptions: {
		ecmaVersion: 2024,
		sourceType: "module",
		parserOptions: {ecmaFeatures: {jsx: true}}
	}
});

jsx.run("no-bare-divs", noBareDivs, {
	valid: [
		{code: 'const element = <div className="card"></div>;'},
		{code: 'const element = <div id="card"></div>;'},
		{code: "const element = <div {...props}></div>;"},
		{code: "const element = <div hidden></div>;"},
		{code: "const element = <dl><div><dt>Term</dt><dd>Def</dd></div></dl>;"},
		{code: "const element = <dl>{records.map(record => <div><dt>{record.title}</dt><dd>{record.detail}</dd></div>)}</dl>;"},
		{code: "const element = <dl><><div><dt>Term</dt><dd>Def</dd></div></></dl>;"},
		{code: "const element = <dl><div></div></dl>;"},
		{code: "const element = <Div></Div>;"},
		{code: "const element = <section><span>Hello</span></section>;"}
	],
	invalid: [
		{code: "const element = <div></div>;", errors: [{messageId: "bareDiv"}]},
		{code: "const element = <div />;", errors: [{messageId: "bareDiv"}]},
		{code: "const element = <main><div></div></main>;", errors: [{messageId: "bareDiv"}]},
		{code: "const element = <dl><div><div></div></div></dl>;", errors: [{messageId: "bareDiv"}]},
		{code: "const element = <dl><dt>Term</dt><dd><div></div></dd></dl>;", errors: [{messageId: "bareDiv"}]}
	]
});
