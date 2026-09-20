/**
 * A sentence on the screen says its piece on one line, the way a comment does.
 * Prose carried onto a second line is read twice: once to find where it goes, once to read it.
 * It is also the shape that hides a missing translation, since half a sentence reads like a whole one.
 * Where a thought will not fit on a line, it is summarized rather than wrapped.
 */
import type {Rule} from "eslint";

/** A line that finishes what it was saying, so what follows starts something new. */
const FINISHED: RegExp = /[.:;!?]["')\]]?$/;

/** What a line says, without the indentation it was written at. */
const INDENTATION: RegExp = /^\s+|\s+$/g;

/** Markup that is plumbing rather than prose: a lone tag, an expression, or an attribute carried over. */
const PLUMBING: RegExp = /^[<>{}/]|^[a-z-]+=|^\|/i;

/**
 * Reads the lines a piece of text is written across, as the text of each rather than the spacing around it.
 * @param written The text as it stands in the file
 * @returns What each line says
 */
function readLines(written: string): string[] {
	return written.split("\n").map(function toText(line: string): string {
		return line.replace(INDENTATION, "");
	});
}

/**
 * Answers whether a line leaves its sentence unfinished for the next one to carry.
 * @param line What the line says
 * @param next What the line below says
 * @returns True when the two are one sentence split in half
 */
function wrapsOnto(line: string, next: string): boolean {
	return Boolean(line) && Boolean(next) && !FINISHED.test(line) && !PLUMBING.test(next) && !PLUMBING.test(line);
}

/**
 * Asks about one run of shown text, wherever the template kept it.
 * @param context The rule context
 * @param node The text node
 * @param written What it says
 */
function inspectText(context: Rule.RuleContext, node: Rule.Node, written: unknown): void {
	const lines = readLines(typeof written === "string" ? written : "");

	for (let index = 0; index < lines.length - 1; index += 1) {
		if (wrapsOnto(lines.at(index) ?? "", lines.at(index + 1) ?? "")) {
			context.report({node, messageId: "wrapped"});
		}
	}
}

/** Keeps a sentence the reader will see on one line, the way a comment is kept. */
const rule: Rule.RuleModule = {
	meta: {
		type: "layout",
		docs: {description: "Keeps a sentence shown on the screen on one line, summarized rather than wrapped"},
		messages: {
			wrapped: "This sentence runs onto the next line. Say it in one line, or summarize it until it fits"
		},
		schema: []
	},

	/**
	 * Reads every run of text a template shows and asks about the sentences split across lines.
	 * @param context The rule context eslint hands the rule
	 * @returns The visitor eslint runs over the program
	 */
	create: function checkText(context: Rule.RuleContext): Rule.RuleListener {
		return {
			SvelteText: function checkSvelteText(node: unknown): void {
				inspectText(context, node as Rule.Node, (node as {value?: unknown}).value);
			},
			JSXText: function checkJsxText(node: unknown): void {
				inspectText(context, node as Rule.Node, (node as {value?: unknown}).value);
			}
		};
	}
};

export default rule;
