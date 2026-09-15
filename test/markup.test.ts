/** The class and sentence rules read through the real svelte and astro parsers, since markup is where class names live. */
import {describe, it} from "node:test";
import {RuleTester} from "eslint";
import astroParser from "astro-eslint-parser";
import svelteParser from "svelte-eslint-parser";
import tseslint from "typescript-eslint";
import logicalClasses from "../eslint/rules/logical-classes.ts";
import naturalSize from "../eslint/rules/natural-size.ts";
import unbrokenSentences from "../eslint/rules/unbroken-sentences.ts";

RuleTester.describe = describe;
RuleTester.it = it;

/** Svelte components, read by the parser svelte projects actually use. */
const svelte = new RuleTester({
	languageOptions: {parser: svelteParser, parserOptions: {parser: tseslint.parser, ecmaVersion: 2024, sourceType: "module"}}
});

/** Astro pages, read by the parser astro projects actually use. */
const astro = new RuleTester({
	languageOptions: {parser: astroParser, parserOptions: {parser: tseslint.parser, extraFileExtensions: [".astro"], ecmaVersion: 2024, sourceType: "module"}}
});

svelte.run("logical-classes in svelte", logicalClasses, {
	valid: [{filename: "Card.svelte", code: '<div class="mbs-4 pli-2 rounded-bs-lg"></div>'}],
	invalid: [
		{
			filename: "Card.svelte",
			code: '<div class="mt-4 pl-2"></div>',
			errors: [
				{messageId: "physical", data: {explanation: "mt-4 is a physical property; use mbs-4"}},
				{messageId: "physical", data: {explanation: "pl-2 is a physical property; use ps-2"}}
			]
		},
		{
			filename: "Card.svelte",
			code: "<div class:mr-2={tight}></div>",
			errors: [{messageId: "physical", data: {explanation: "mr-2 is a physical property; use me-2"}}]
		}
	]
});

svelte.run("natural-size in svelte", naturalSize, {
	valid: [{filename: "Card.svelte", code: '<div class="block-full inline-full max-inline-prose"></div>'}],
	invalid: [
		{filename: "Card.svelte", code: '<div class="h-64"></div>', errors: [{messageId: "pinned"}]},
		{filename: "Card.svelte", code: '<img class="size-6" alt="" />', errors: [{messageId: "pinned"}]}
	]
});

svelte.run("unbroken-sentences in svelte", unbrokenSentences, {
	valid: [{filename: "Card.svelte", code: "<p>One sentence on one line.</p>"}],
	invalid: [
		{
			filename: "Card.svelte",
			code: "<p>\n\tA sentence that carries\n\tonto the next line.\n</p>",
			errors: [{messageId: "wrapped"}]
		}
	]
});

astro.run("logical-classes in astro", logicalClasses, {
	valid: [{filename: "index.astro", code: '---\nconst title = "Home";\n---\n<div class="mbs-4 pli-2">{title}</div>'}],
	invalid: [
		{
			filename: "index.astro",
			code: '---\nconst title = "Home";\n---\n<div class="mt-4">{title}</div>',
			errors: [{messageId: "physical", data: {explanation: "mt-4 is a physical property; use mbs-4"}}]
		}
	]
});

astro.run("natural-size in astro", naturalSize, {
	valid: [{filename: "index.astro", code: '---\n---\n<div class="block-full inline-1/2"></div>'}],
	invalid: [{filename: "index.astro", code: '---\n---\n<div class="max-h-[400px]"></div>', errors: [{messageId: "pinned"}]}]
});

astro.run("unbroken-sentences in astro", unbrokenSentences, {
	valid: [{filename: "index.astro", code: "---\n---\n<p>One sentence on one line.</p>"}],
	invalid: [
		{
			filename: "index.astro",
			code: "---\n---\n<p>\n\tA sentence that carries\n\tonto the next line.\n</p>",
			errors: [{messageId: "wrapped"}]
		}
	]
});
