# dryer-lint

The shared eslint, stylelint and prettier conventions behind a house style that three projects arrived at separately and kept writing out again.

The opinions, in one paragraph. A name is the cheapest documentation there is, so `outcome`, `data` and `item` are lint errors rather than review notes. A function that answers in one place reads top to bottom, so a second return is an error. A comment says its piece on one line, and prose belongs in a JSDoc block rather than a `//` note nothing will ever read again. A layout follows the writing rather than the screen, so `mt-4` is asked for again as `mbs-4`. And a box takes the size its content asks for: a number typed into a class or a declaration is a guess about how much text there will be, at what size the reader keeps their type, and in which language.

## Install

```sh
npm i -D github:srsgores/dryer-lint
```

Then the peers you actually use:

```sh
npm i -D eslint @eslint/js typescript-eslint eslint-config-prettier eslint-plugin-jsdoc globals jiti
npm i -D stylelint stylelint-config-tailwindcss stylelint-plugin-logical-css
npm i -D prettier
```

Optional peers, only for the frameworks you write in:

```sh
npm i -D eslint-plugin-svelte svelte-eslint-parser prettier-plugin-svelte
npm i -D eslint-plugin-astro astro-eslint-parser prettier-plugin-astro
```

## Running it: this package ships TypeScript, not JavaScript

Every file in `dryer-lint` is a `.ts` source. There is no build step and no compiled output. That has one consequence worth knowing before anything else.

Node strips types from `.ts` files on its own from 22.18 onwards, **except for files inside `node_modules`**, which it refuses with `ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING`. So whatever loads this package has to be something that transpiles TypeScript itself:

| Tool                      | How to load it                                                | Works out of the box     |
| ------------------------- | ------------------------------------------------------------- | ------------------------ |
| eslint                    | `eslint.config.ts`, which ESLint 10 loads through jiti        | yes, with jiti installed |
| stylelint                 | a config that imports the module through jiti (snippet below) | no, needs the jiti hop   |
| prettier                  | a config that imports the module through jiti (snippet below) | no, needs the jiti hop   |
| `dryer-lint/tailwind.css` | a plain `@import` in your stylesheet                          | yes                      |

`jiti` is a peer worth installing either way: ESLint already needs it to read a `.ts` config, and the two snippets below use it for the other two tools.

## eslint

`eslint.config.ts`:

```ts
import {dryerLint} from "dryer-lint/eslint";

export default await dryerLint({svelte: true});
```

`dryerLint()` is async, because it imports the svelte and astro packages only when you ask for them. A project with no svelte in it never needs the svelte packages installed.

### Options

Every one of them is optional.

| Option           | Default                                            | What it does                                                                                                                                                                                                                                                                            |
| ---------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `svelte`         | `false`                                            | Adds eslint-plugin-svelte and svelte-eslint-parser, its recommended and prettier configs, and the house rules on `.svelte`, `.svelte.ts` and `.svelte.js`, plus `dryer/unbroken-sentences` on the markup.                                                                               |
| `astro`          | `false`                                            | Adds eslint-plugin-astro and astro-eslint-parser for `.astro`, with the TypeScript parser on the frontmatter, and the house rules plus `dryer/unbroken-sentences` on the markup.                                                                                                        |
| `typed`          | `false`                                            | Turns on the type-aware rule set with `projectService: true` on `**/*.ts`, and never on svelte or astro files, where the compiler makes linting too slow. Pass `{tsconfigRootDir}` to say where the tsconfig lives; otherwise the working directory is used.                            |
| `documentation`  | `true`                                             | The JSDoc rule set: `jsdoc/*`, `dryer/verb-first-descriptions`, `dryer/notes-are-asides`, `dryer/no-prose-line-comments`, and `@typescript-eslint/explicit-function-return-type` on TypeScript files. Types are asked for in JSDoc only in `.js` files, where nothing else checks them. |
| `aliases`        | the twelve below                                   | The aliases `dryer/aliased-imports` asks imports to use.                                                                                                                                                                                                                                |
| `vagueNames`     | `[]`                                               | Names to add to the denylist on top of the built-in one.                                                                                                                                                                                                                                |
| `allowNames`     | `[]`                                               | Names to take **off** the denylist. The escape hatch for keys in a shape the project does not own.                                                                                                                                                                                      |
| `ignores`        | `[]`                                               | Paths to ignore on top of the defaults.                                                                                                                                                                                                                                                 |
| `sql`            | `false`                                            | Turns on `dryer/no-inline-sql`.                                                                                                                                                                                                                                                         |
| `noNull`         | `false`                                            | Forbids typing anything as `null`.                                                                                                                                                                                                                                                      |
| `allowMaxInline` | `true`                                             | Whether a cap on the inline axis (`max-w-*`, `max-inline-*`) is left alone. See the sizing section.                                                                                                                                                                                     |
| `files`          | `["**/*.{js,mjs,cjs,ts,mts}"]`                     | The files the house rules apply to.                                                                                                                                                                                                                                                     |
| `testFiles`      | `["**/*.test.ts", "**/tests/**", "acceptance/**"]` | Files held to the same style, but not to the same names: magic numbers, `any` and the denylist are relaxed.                                                                                                                                                                             |
| `svelteConfig`   | none                                               | Your `svelte.config.js`, handed to the svelte parser so it reads the compiler's own settings.                                                                                                                                                                                           |

The default aliases: `$lib` → `src/lib`, `@components` → `src/components`, `@layouts` → `src/layouts`, `@styles` → `src/styles`, `@utils` → `src/utils`, `@content` → `src/content`, `@images` → `src/images`, `@icons` → `src/icons`, `@routes` → `src/routes`, `$locales` → `src/locales`, `@tests` → `tests`, `@scripts` → `scripts`. SvelteKit's `./$types` and the eslint config file itself are always exempt.

`vagueNames` and `allowNames` pull in opposite directions and both are honoured: the denylist is the built-in list, plus everything in `vagueNames`, minus everything in `allowNames`. `allowNames` exists because `id-denylist` reports property keys, and a key is not always yours to name. An HTML `<meta content>`, an Astro `getStaticPaths` returning `params`, `items` in an @astrojs/rss feed and `item` in a schema.org `ListItem` are all shapes somebody else designed, and renaming the key is not an option:

```ts
export default await dryerLint({allowNames: ["content", "params", "items", "item"]});
```

The default ignores: `dist`, `build`, `.svelte-kit`, `.astro`, `.netlify`, `.wrangler`, `node_modules`, `playwright-report`, `test-results`, `src/locales` and `**/components/ui/**`, which is where vendored shadcn parts land.

The plugin itself is exported too, for a project that wants to assemble its own config:

```ts
import {plugin} from "dryer-lint/eslint";
```

### Documentation

`documentation: true` asks for a JSDoc block on anything longer than a glance, a description that opens with what the function does, and `@param` and `@returns` that say something.

**In a `.ts` file, JSDoc carries descriptions only. The types live in the signature.** `jsdoc/require-param-type` and `jsdoc/require-returns-type` are off for TypeScript, so a param is documented as `@param token The class as it was written` with no `{string}` in front of it. TypeScript agrees: it reports `ts(80004)` — "JSDoc types may be moved to TypeScript types" — on a `@param {string}` in a file that already declares the type. Writing the type twice means one of the two copies is wrong as soon as the signature changes, and only the signature is checked.

The two type tags are still required in `.js` and `.mjs` files, where JSDoc is the only place a type can be written down at all.

### The rules

Everything below is in the `dryer` namespace.

| Rule                      | Why it exists                                                                                                                                                                                                                                |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `one-return`              | A function that answers in one place reads top to bottom; a guard is a branch of the answer, not a jump out. A return with no enclosing function is left alone, so an astro page may `return Astro.redirect(...)` from its frontmatter.      |
| `named-functions`         | An arrow is for the one thing only an arrow does, which is borrow `this`. Everywhere else it costs the name a reader would have looked for.                                                                                                  |
| `named-patterns`          | A regular expression written inline says what it matches only to whoever can read it back character by character.                                                                                                                            |
| `unwrapped-comments`      | A sentence carried onto a second line is read twice: once to find where it goes, once to read it.                                                                                                                                            |
| `no-prose-line-comments`  | Prose is documentation, and documentation is a JSDoc block the editor and the type checker can both see. Directives keep the line form.                                                                                                      |
| `verb-first-descriptions` | A function's documentation opens with what the function does, not with what category it belongs to.                                                                                                                                          |
| `notes-are-asides`        | What a function throws belongs in `@throws`, where a reader looks for it.                                                                                                                                                                    |
| `unbroken-sentences`      | A sentence on the screen says its piece on one line. Half a sentence also reads like a whole one, which is how a missing translation hides.                                                                                                  |
| `theme-colours`           | A colour written by hand belongs to nothing, so it cannot answer to the theme.                                                                                                                                                               |
| `aliased-imports`         | `../../components/` is a guess at where the reader is sitting today; an alias names the place itself. Fixable.                                                                                                                               |
| `array-destructuring`     | Destructuring names the element where it is drawn out, and keeps the index from drifting silently. A warning.                                                                                                                                |
| `types-directory`         | A shape the application shares belongs where every part of it can find it. A `Props` declared in a `.astro` or `.svelte` file is exempt, because a component's props describe that one component and nothing else can share them. A warning. |
| `switch-break`            | A `break` belongs to a switch; in a loop it hides the condition that actually ends the loop.                                                                                                                                                 |
| `no-array-chain`          | Chaining two array walks reads the list twice for two jobs; fold them into one `flatMap` or `reduce`.                                                                                                                                        |
| `no-inline-sql`           | A query written inline hides from highlighters, formatters and linters. Off unless `sql: true`.                                                                                                                                              |
| `logical-classes`         | A class name is a stylesheet written where stylelint cannot see it, so the physical utilities get asked for again by their logical names.                                                                                                    |
| `natural-size`            | A box takes the size its content asks for. See below.                                                                                                                                                                                        |

On top of those, the house config sets `id-denylist` (the two projects' vague-name lists put together), `id-length` at 2 with properties exempt, `func-style: declaration`, `func-names: always`, `@typescript-eslint/no-magic-numbers` with `-1`, `0`, `1` and `2` allowed, and `no-restricted-syntax` for promise `.then`/`.catch`/`.finally` chains, `new Promise`, `continue`, casting through `unknown`, and functions named `handleX` or `onX` after what they respond to rather than what they do.

### Hardened natural sizing

`dryer/natural-size` reads every string that can hold class names and reports three things, on **both** axes.

**Pinned sizes.** `h-*`, `min-h-*`, `max-h-*`, `block-*`, `min-block-*`, `max-block-*`, `w-*`, `min-w-*`, `inline-*` and `min-inline-*` are reported when the value is a fixed length: a spacing step like `64`, the `px` step, or an arbitrary value in `px`, `rem` or `em`.

**Both axes at once.** Any `size-*` is reported. An icon takes its size from the text beside it, which is what the `icon` utility in `dryer-lint/tailwind.css` is for; anything else is sized on the inline axis with `aspect-square`.

**Pixels.** Any `[0-9]px` inside a class string is reported, wherever it sits.

What stays allowed:

- `full`, `auto`, `fit`, `min`, `max`, `screen` and `0`
- viewport units: `svh`, `dvh`, `lvh`, `svw`, `dvw`, `lvw`
- fractions and percentages: `inline-1/2`, `h-[50%]`
- arbitrary values that measure something: `h-[50dvh]`, `w-[calc(100%-2rem)]`
- custom properties: `h-(--measured)`, `h-[var(--measured)]`

`max-w-*` and `max-inline-*` stay allowed by default, because a reading measure bounds a column of text rather than sizing a box. Pass `allowMaxInline: false` to forbid those as well. Note that the block-axis caps, `max-h-*` and `max-block-*`, are **not** exempt: a cap on the block axis is still a guess at how much content there will be.

The same rule is enforced on stylesheets by `dryer/natural-size` on the stylelint side, on declarations and inside `@apply`.

## stylelint

Stylelint loads its config with plain Node, which will not strip types from a file in `node_modules`, so the config goes through jiti.

`stylelint.config.ts`:

```ts
import {createJiti} from "jiti";
import type {Config} from "stylelint";

const jiti = createJiti(import.meta.url);
const loaded = await jiti.import<{default: Config}>("dryer-lint/stylelint");

export default loaded.default;
```

`stylelint.config.mjs` works the same way if you would rather not have a TypeScript config file:

```js
import {createJiti} from "jiti";

const jiti = createJiti(import.meta.url);
const {default: config} = await jiti.import("dryer-lint/stylelint");

export default config;
```

`extends: ["dryer-lint/stylelint"]` and a plain `import config from "dryer-lint/stylelint"` both resolve correctly but fail to load, for the `node_modules` reason above. The jiti hop is the way in until this package ships compiled output or Node lifts that restriction.

What the config is:

- `stylelint-config-tailwindcss` and `stylelint-plugin-logical-css/configs/recommended` do the logical-property work on declarations. Nothing here reimplements a table somebody else maintains.
- `unit-disallowed-list: ["px"]`, because a pixel is a decision about somebody else's screen.
- `color-no-hex`, because a colour written by hand belongs to nothing.
- `function-disallowed-list` for `rgb`, `rgba`, `hsl`, `hsla`, `hwb`, `lab` and `lch`, because theme colours are written in oklch, which spaces lightness evenly by eye.
- `dryer/natural-size`, which reports `width`, `height`, `inline-size`, `block-size`, `min-width`, `min-height`, `min-inline-size`, `min-block-size`, `max-height` and `max-block-size` whose value is a fixed length or a bare `--spacing(16)`, and the same class names inside `@apply`. `max-width` and `max-inline-size` are allowed unless you pass `[true, {allowMaxInline: false}]`.
- `dryer/no-pixel-classes`, which catches a pixel length hiding inside a class name that `@apply` was given, where `unit-disallowed-list` cannot see it.

## prettier

`prettier.config.ts`:

```ts
import {createJiti} from "jiti";
import type {Config} from "prettier";

const jiti = createJiti(import.meta.url);
const loaded = await jiti.import<{prettierConfig: (options?: Config) => Config}>("dryer-lint/prettier");

export default loaded.prettierConfig({svelte: true});
```

`prettierConfig({svelte, astro, ...overrides})` returns:

```json
{
	"useTabs": true,
	"tabWidth": 4,
	"semi": true,
	"singleQuote": false,
	"trailingComma": "none",
	"bracketSpacing": false,
	"bracketSameLine": true,
	"arrowParens": "always",
	"singleAttributePerLine": false,
	"proseWrap": "preserve",
	"printWidth": 160,
	"endOfLine": "lf"
}
```

`svelte: true` adds `prettier-plugin-svelte` and the `*.svelte` parser override; `astro: true` adds `prettier-plugin-astro` and the `*.astro` override. Anything else you pass is spread last, so it wins.

## The stylesheet

The lint rules ask for class names Tailwind does not ship. This is where they come from.

```css
@import "tailwindcss";
@import "dryer-lint/tailwind.css";
```

It defines the block-axis and shorthand spacing utilities (`mbs`, `mbe`, `mbl`, `mli`, the negative margins and the auto margins), the scroll offsets (`scroll-mbs`, `scroll-mbe`, `scroll-mbl`, `scroll-mli`, `scroll-pbs`, `scroll-pbe`, `scroll-pbl`, `scroll-pli`), the insets and gaps (`inset-bs`, `inset-be`, `inset-bl`, `inset-li` with their `-auto` and `-full` forms, `gap-bl`, `gap-li`), sibling spacing and rules (`space-bs`, `space-is`, `divide-bs`, `divide-is`), inline sizing (`inline-*`, `min-inline-*`, `max-inline-*` with the whole keyword set Tailwind's `w`, `min-w` and `max-w` take), `block-full`, the block-axis borders (`border-bs`, `border-be`, `border-bl`), the block-edge radii (`rounded-bs`, `rounded-be`) and `icon`.

Every keyword class the rule can recommend is covered by a test, so `mx-auto` is never answered with an `mli-auto` that generates nothing. The one deliberate gap is the pixel family: there is no `mbs-px`, because a class that is both logical and a pixel is not an improvement, and `dryer/natural-size` answers `mt-px` by asking for a spacing step instead. A viewport width keeps Tailwind's spelling in the class name (`inline-dvw`, from `w-dvw`) but is measured on the inline axis with `dvi`, which is the axis the text actually runs along.

There is no `block-*` sizing utility, on purpose. `block-full` is the one exception, for a box filling a parent that was already bounded by something else.

## Developing this package

`npm test` runs eslint's `RuleTester` over every rule, through the real svelte and astro parsers for the ones that read markup, stylelint's `lint()` API over the two stylelint plugins, and the whole config over a fixtures directory. `npm run lint` lints this package with its own config and its own stylesheet with its own stylelint config. `npm run check` type checks with `tsc`, and `npm run format:check` checks the formatting with the config it ships.

One dependency detail is worth knowing before you run anything: `typescript-eslint` 8 refuses to load when `require("typescript")` resolves to TypeScript 7, so the root `typescript` is 6 and TypeScript 7 is installed alongside it under the alias `typescript-native`, which is what `npm run check` runs. When typescript-eslint supports TypeScript 7, the alias and the `check` script collapse back into a plain `tsc --noEmit`.

Three places turn a house rule off, each because the thing the rule forbids is the subject rather than the style: the class tables in `lib/classes.ts`, the names eslint's and stylelint's own report APIs own (`data`, `result`, `value`), and the tests, whose fixtures are written colours, inline patterns and physical class names on purpose.

## Licence

MIT. See `LICENSE`.
