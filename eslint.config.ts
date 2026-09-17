/**
 * This package is linted by the rules it ships, which is the only test that matters for a house style.
 * Three layers follow, each turning a rule off where the thing it forbids is the subject rather than the style.
 */
import {DEFAULT_ALIASES} from "./lib/aliases.ts";
import {dryerLint} from "./eslint/index.ts";

/** Where the class names the rules report are the table they are read from rather than markup. */
const TABLES_OF_CLASSES: string[] = ["lib/classes.ts", "lib/class-visitor.ts", "eslint/rules/logical-classes.ts", "eslint/rules/natural-size.ts"];

/**
 * Where a name is somebody else's to choose.
 * `data` is what eslint's report takes, `result` is what stylelint's takes, and `value` is what a parser calls the text of a node.
 * A denylist of our own names cannot reach into a shape we did not design.
 */
const OTHER_PEOPLE_SHAPES: string[] = ["eslint/rules/**", "lib/**", "stylelint/plugins/**"];

/**
 * Where a rule's own subject is the thing it forbids.
 * A test names a written colour, an inline pattern and an element read by its position because those are what it is testing.
 */
const TESTS: string[] = ["test/**"];

const configuration = await dryerLint({
	ignores: ["coverage/**", "test/fixtures/**"],
	aliases: [...DEFAULT_ALIASES, {prefix: "lib", alias: "#lib"}, {prefix: "eslint", alias: "#eslint"}, {prefix: "stylelint", alias: "#stylelint"}]
});

export default [
	...configuration,
	{
		files: [...TABLES_OF_CLASSES, ...TESTS],
		rules: {
			"dryer/logical-classes": "off",
			"dryer/natural-size": "off"
		}
	},
	{
		files: OTHER_PEOPLE_SHAPES,
		rules: {"id-denylist": "off"}
	},
	{
		files: TESTS,
		rules: {
			"dryer/theme-colours": "off",
			"dryer/named-patterns": "off",
			"dryer/array-destructuring": "off"
		}
	}
];
