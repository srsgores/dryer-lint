/** The class and sentence rules read through the real svelte and astro parsers, since markup is where class names live. */
import {describe, it} from "node:test";
import {RuleTester} from "eslint";
import htmlParser from "@html-eslint/parser";
import * as astroParser from "astro-eslint-parser";
import svelteParser from "svelte-eslint-parser";
import tseslint from "typescript-eslint";
import logicalClasses from "#eslint/rules/logical-classes.ts";
import headingGroup from "#eslint/rules/heading-group.ts";
import naturalSize from "#eslint/rules/natural-size.ts";
import noBareDivs from "#eslint/rules/no-bare-divs.ts";
import typesDirectory from "#eslint/rules/types-directory.ts";
import unbrokenSentences from "#eslint/rules/unbroken-sentences.ts";

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

/** HTML markup files, read by the parser html projects use. */
const html = new RuleTester({
	languageOptions: {parser: htmlParser}
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
	valid: [
		{filename: "Card.svelte", code: '<div class="block-full inline-full max-inline-prose"></div>'},
		{filename: "Card.svelte", code: '<div style="inline-size: 100%; block-size: 50dvh;"></div>'}
	],
	invalid: [
		{filename: "Card.svelte", code: '<div class="h-64"></div>', errors: [{messageId: "pinned"}]},
		{filename: "Card.svelte", code: '<img class="size-6" alt="" />', errors: [{messageId: "pinned"}]},
		{
			filename: "Card.svelte",
			code: '<div style="inline-size: 2.25rem; block-size: 2.25rem;"></div>',
			errors: [
				{
					messageId: "pinned",
					data: {
						explanation:
							"inline-size pins an element to a fixed inline size; let it take its natural size, or bound it with a viewport unit or a measured custom property"
					}
				},
				{
					messageId: "pinned",
					data: {
						explanation:
							"block-size pins an element to a fixed block size; let it take its natural size, or bound it with a viewport unit or a measured custom property"
					}
				}
			]
		},
		{
			filename: "Card.svelte",
			code: '<div style:inline-size="2.25rem" style:block-size="2.25rem"></div>',
			errors: [{messageId: "pinned"}, {messageId: "pinned"}]
		}
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
	invalid: [
		{filename: "index.astro", code: '---\n---\n<div class="max-h-[400px]"></div>', errors: [{messageId: "pinned"}]},
		{
			filename: "index.astro",
			code: '---\n---\n<div style="inline-size: 2.25rem; block-size: 2.25rem;"></div>',
			errors: [{messageId: "pinned"}, {messageId: "pinned"}]
		}
	]
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

svelte.run("types-directory in svelte", typesDirectory, {
	valid: [{filename: "Card.svelte", code: '<script lang="ts">\n\tinterface Props {\n\t\ttitle: string;\n\t}\n</script>'}],
	invalid: [
		{
			filename: "Card.svelte",
			code: '<script lang="ts">\n\tinterface Invoice {\n\t\ttotal: number;\n\t}\n</script>',
			errors: [{messageId: "typesDirectory"}]
		}
	]
});

astro.run("types-directory in astro", typesDirectory, {
	valid: [{filename: "index.astro", code: "---\ninterface Props {\n\ttitle: string;\n}\n---\n<h1></h1>"}],
	invalid: [
		{
			filename: "index.astro",
			code: "---\ninterface Invoice {\n\ttotal: number;\n}\n---\n<h1></h1>",
			errors: [{messageId: "typesDirectory"}]
		},
		{
			filename: "index.astro",
			code: "---\ntype Props = {title: string};\ntype Invoice = {total: number};\n---\n<h1></h1>",
			errors: [{messageId: "typesDirectory"}]
		}
	]
});

svelte.run("no-bare-divs in svelte", noBareDivs, {
	valid: [
		{filename: "Card.svelte", code: '<div class="card"></div>'},
		{filename: "Card.svelte", code: "<div class:active={true}></div>"},
		{filename: "Card.svelte", code: "<div bind:this={anchor}></div>"},
		{filename: "Card.svelte", code: "<div on:click={run}></div>"},
		{filename: "Card.svelte", code: "<div {...props}></div>"},
		{filename: "Card.svelte", code: "<dl><div><dt>Term</dt><dd>Definition</dd></div></dl>"},
		{filename: "Card.svelte", code: "<dl>{#each records as record}<div><dt>{record.title}</dt><dd>{record.detail}</dd></div>{/each}</dl>"},
		{filename: "Card.svelte", code: "<dl>{#if visible}<div><dt>Term</dt><dd>Definition</dd></div>{/if}</dl>"}
	],
	invalid: [
		{filename: "Card.svelte", code: "<div></div>", errors: [{messageId: "bareDiv"}]},
		{filename: "Card.svelte", code: "<main><div></div></main>", errors: [{messageId: "bareDiv"}]},
		{filename: "Card.svelte", code: "<dl><dt>Term</dt><dd><div></div></dd></dl>", errors: [{messageId: "bareDiv"}]},
		{filename: "Card.svelte", code: "<dl><div><div></div></div></dl>", errors: [{messageId: "bareDiv"}]}
	]
});

astro.run("no-bare-divs in astro", noBareDivs, {
	valid: [
		{filename: "index.astro", code: '---\n---\n<div class="card"></div>'},
		{filename: "index.astro", code: '---\n---\n<div id="card"></div>'},
		{filename: "index.astro", code: "---\n---\n<dl><div><dt>Term</dt><dd>Definition</dd></div></dl>"},
		{filename: "index.astro", code: "---\n---\n<dl>{records.map(record => <div><dt>{record.title}</dt><dd>{record.detail}</dd></div>)}</dl>"}
	],
	invalid: [
		{filename: "index.astro", code: "---\n---\n<div></div>", errors: [{messageId: "bareDiv"}]},
		{filename: "index.astro", code: "---\n---\n<main><div></div></main>", errors: [{messageId: "bareDiv"}]},
		{filename: "index.astro", code: "---\n---\n<dl><dt>Term</dt><dd><div></div></dd></dl>", errors: [{messageId: "bareDiv"}]},
		{filename: "index.astro", code: "---\n---\n<dl><div><div></div></div></dl>", errors: [{messageId: "bareDiv"}]}
	]
});

html.run("no-bare-divs in html", noBareDivs, {
	valid: [
		{filename: "index.html", code: '<div class="card"></div>'},
		{filename: "index.html", code: '<div id="card"></div>'},
		{filename: "index.html", code: "<dl><div><dt>Term</dt><dd>Definition</dd></div></dl>"},
		{filename: "index.html", code: '<dl><div class="group"><dt>Term</dt><dd>Definition</dd></div></dl>'}
	],
	invalid: [
		{filename: "index.html", code: "<div></div>", errors: [{messageId: "bareDiv"}]},
		{filename: "index.html", code: "<main><div></div></main>", errors: [{messageId: "bareDiv"}]},
		{filename: "index.html", code: "<dl><dt>Term</dt><dd><div></div></dd></dl>", errors: [{messageId: "bareDiv"}]},
		{filename: "index.html", code: "<dl><div><div></div></div></dl>", errors: [{messageId: "bareDiv"}]}
	]
});

svelte.run("heading-group in svelte", headingGroup, {
	valid: [
		{filename: "Card.svelte", code: "<hgroup><h1>Title</h1><p>Subtitle</p></hgroup>"},
		{filename: "Card.svelte", code: "<div><h1>Title</h1></div>"},
		{filename: "Card.svelte", code: "<Card><h1>Title</h1><p>Subtitle</p></Card>"}
	],
	invalid: [
		{
			filename: "Card.svelte",
			code: "<div><h1>Title</h1><p>Subtitle</p></div>",
			errors: [{messageId: "preferHgroup", data: {tag: "div"}}]
		},
		{
			filename: "Card.svelte",
			code: "<header><h1>Title</h1><h2>Subtitle</h2></header>",
			errors: [{messageId: "preferHgroup", data: {tag: "header"}}]
		}
	]
});

astro.run("heading-group in astro", headingGroup, {
	valid: [
		{filename: "index.astro", code: "---\n---\n<hgroup><h1>Title</h1><p>Subtitle</p></hgroup>"},
		{filename: "index.astro", code: "---\n---\n<div><h1>Title</h1></div>"}
	],
	invalid: [
		{
			filename: "index.astro",
			code: "---\n---\n<div><h1>Title</h1><p>Subtitle</p></div>",
			errors: [{messageId: "preferHgroup", data: {tag: "div"}}]
		},
		{
			filename: "index.astro",
			code: "---\n---\n<header><h1>Title</h1><p>Subtitle</p></header>",
			errors: [{messageId: "preferHgroup", data: {tag: "header"}}]
		}
	]
});

html.run("heading-group in html", headingGroup, {
	valid: [
		{filename: "index.html", code: "<hgroup><h1>Title</h1><p>Subtitle</p></hgroup>"},
		{filename: "index.html", code: "<div><h1>Title</h1></div>"}
	],
	invalid: [
		{
			filename: "index.html",
			code: "<div><h1>Title</h1><p>Subtitle</p></div>",
			errors: [{messageId: "preferHgroup", data: {tag: "div"}}]
		},
		{
			filename: "index.html",
			code: "<header><h1>Title</h1><h2>Subtitle</h2><p>Description</p></header>",
			errors: [{messageId: "preferHgroup", data: {tag: "header"}}]
		}
	]
});
