/** The Astro-only house rules, read through the real astro parser. */
import {describe, it} from "node:test";
import {RuleTester} from "eslint";
import * as astroParser from "astro-eslint-parser";
import tseslint from "typescript-eslint";
import classList from "#eslint/rules/class-list.ts";
import componentSlot from "#eslint/rules/component-slot.ts";
import explicitFragment from "#eslint/rules/explicit-fragment.ts";
import imageLayout from "#eslint/rules/image-layout.ts";
import noFrontmatterClasses from "#eslint/rules/no-frontmatter-classes.ts";
import spreadAttributes from "#eslint/rules/spread-attributes.ts";

RuleTester.describe = describe;
RuleTester.it = it;

/** Astro components and pages, read by the parser astro projects actually use. */
const astro = new RuleTester({
	languageOptions: {
		parser: astroParser,
		parserOptions: {parser: tseslint.parser, extraFileExtensions: [".astro"], ecmaVersion: 2024, sourceType: "module"}
	}
});

/** A valid component that rests props, spreads them, and renders a default slot. */
const VALID_COMPONENT = `---
const {title, ...attributes} = Astro.props;
---
<div {...attributes}>
	<h1>{title}</h1>
	<slot />
</div>
`;

astro.run("component-slot", componentSlot, {
	valid: [
		{filename: "src/components/Card.astro", code: VALID_COMPONENT},
		{filename: "src/components/Card.astro", code: '---\n---\n<header><slot name="title" /></header><slot />'},
		{filename: "src/pages/index.astro", code: "---\n---\n<main>A page</main>"}
	],
	invalid: [
		{
			filename: "src/components/Card.astro",
			code: "---\n---\n<div>No slot</div>",
			errors: [{messageId: "missingSlot"}]
		},
		{
			filename: "src/components/Card.astro",
			code: '---\n---\n<header><slot name="title" /></header>',
			errors: [{messageId: "missingSlot"}]
		}
	]
});

astro.run("spread-attributes", spreadAttributes, {
	valid: [
		{filename: "src/components/Card.astro", code: VALID_COMPONENT},
		{
			filename: "src/components/Card.astro",
			code: "---\nconst {title, ...rest} = Astro.props;\n---\n<div {...rest}><slot /></div>"
		},
		{filename: "src/pages/index.astro", code: "---\n---\n<main>A page</main>"}
	],
	invalid: [
		{
			filename: "src/components/Card.astro",
			code: "---\nconst {title} = Astro.props;\n---\n<div><slot /></div>",
			errors: [{messageId: "missingSpread"}]
		},
		{
			filename: "src/components/Card.astro",
			code: "---\nconst {title, ...rest} = Astro.props;\n---\n<div {...attributes}><slot /></div>",
			errors: [{messageId: "missingSpread"}]
		},
		{
			filename: "src/components/Card.astro",
			code: "---\nconst {title} = Astro.props;\n---\n<div {...Astro.props}><slot /></div>",
			errors: [{messageId: "missingSpread"}]
		}
	]
});

astro.run("explicit-fragment", explicitFragment, {
	valid: [
		{filename: "src/components/Card.astro", code: "---\n---\n<Fragment><slot /></Fragment>"},
		{filename: "src/pages/index.astro", code: "---\n---\n<main>A page</main>"}
	],
	invalid: [
		{
			filename: "src/components/Card.astro",
			code: "---\n---\n<><slot /></>",
			errors: [{messageId: "shorthand"}]
		}
	]
});

astro.run("class-list", classList, {
	valid: [
		{filename: "src/components/Card.astro", code: '---\n---\n<div class="card"><slot /></div>'},
		{filename: "src/components/Card.astro", code: "---\nconst {class: className} = Astro.props;\n---\n<div class={className}><slot /></div>"},
		{
			filename: "src/components/Card.astro",
			code: '---\n---\n<div class:list={[active && "on", "card"]}><slot /></div>'
		},
		{
			filename: "src/components/Card.astro",
			code: '---\n---\n<div class:list={[active ? "on" : "off"]}><slot /></div>'
		}
	],
	invalid: [
		{
			filename: "src/components/Card.astro",
			code: '---\n---\n<div class={active ? "on" : "off"}><slot /></div>',
			errors: [{messageId: "useClassList"}]
		},
		{
			filename: "src/components/Card.astro",
			code: '---\n---\n<div class={active && "on"}><slot /></div>',
			errors: [{messageId: "useClassList"}]
		},
		{
			filename: "src/components/Card.astro",
			code: '---\n---\n<div class={className || "card"}><slot /></div>',
			errors: [{messageId: "useClassList"}]
		}
	]
});

astro.run("image-layout", imageLayout, {
	valid: [
		{
			filename: "src/components/Card.astro",
			code: '---\n---\n<Image src={img} alt="" inferSize layout="constrained" />'
		},
		{
			filename: "src/components/Card.astro",
			code: '---\n---\n<Picture src={img} alt="" inferSize layout="full-width" />'
		},
		{
			filename: "src/components/Card.astro",
			code: '---\n---\n<Image src={img} alt="" inferSize layout="fixed" />'
		}
	],
	invalid: [
		{
			filename: "src/components/Card.astro",
			code: '---\n---\n<Image src={img} alt="" />',
			errors: [{messageId: "missingLayout", data: {tag: "Image"}}]
		},
		{
			filename: "src/components/Card.astro",
			code: '---\n---\n<Picture src={img} alt="" layout="constrained" />',
			errors: [{messageId: "missingLayout", data: {tag: "Picture"}}]
		},
		{
			filename: "src/components/Card.astro",
			code: '---\n---\n<Image src={img} alt="" inferSize layout="none" />',
			errors: [{messageId: "missingLayout", data: {tag: "Image"}}]
		},
		{
			filename: "src/components/Card.astro",
			code: '---\n---\n<Image src={img} alt="" inferSize />',
			errors: [{messageId: "missingLayout", data: {tag: "Image"}}]
		}
	]
});

astro.run("no-frontmatter-classes", noFrontmatterClasses, {
	valid: [
		{filename: "src/components/Card.astro", code: '---\n---\n<div class="flex gap-4"><slot /></div>'},
		{
			filename: "src/components/Card.astro",
			code: "---\nconst {class: className} = Astro.props;\n---\n<div class={className}><slot /></div>"
		},
		{
			filename: "src/components/Card.astro",
			code: '---\nconst label = "Invoice";\n---\n<p>{label}</p>'
		}
	],
	invalid: [
		{
			filename: "src/components/Card.astro",
			code: '---\nconst card = "flex gap-4";\n---\n<div class={card}><slot /></div>',
			errors: [{messageId: "frontmatterClass"}]
		},
		{
			filename: "src/components/Card.astro",
			code: "---\nconst card = `flex gap-4`;\n---\n<div class:list={[card]}><slot /></div>",
			errors: [{messageId: "frontmatterClass"}]
		}
	]
});
