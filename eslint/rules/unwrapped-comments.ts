/**
 * A comment says its piece on one line.
 * A sentence carried onto a second line is read twice: once to find where it goes, once to read it.
 * Where a thought will not fit on a line, it is summarized rather than wrapped.
 */
import type {Rule} from "eslint";

/** How much of a line a comment's own text may take before it should be shortened. */
const COMFORTABLE = 140;

/** A line that finishes what it was saying, so what follows starts something new. */
const FINISHED: RegExp = /[.:;!?]$/;

/** A tag line stands on its own, however it ends. */
const TAG: RegExp = /^@\w/;

/** A directive is not prose, so it never continues the line above it. */
const DIRECTIVE: RegExp = /^(?:svelte-ignore|eslint-|@ts-|prettier-|c8 |istanbul )/;

/** The `*` a block comment's lines are drawn with, which is not part of what was said. */
const DRAWN_MARGIN: RegExp = /^\s*\*\s?/;

/**
 * Reads the lines of a comment as the text of each rather than the drawing around it.
 * @param written The comment's whole text, without its delimiters
 * @returns What each line says
 */
function readLines(written: string): string[] {
	return written.split("\n").map(function toText(line: string): string {
		return line.replace(DRAWN_MARGIN, "").trim();
	});
}

/**
 * Answers whether a line leaves its sentence unfinished for the next one to carry.
 * @param line What the line says
 * @param next What the line below says
 * @returns True when the two are one sentence split in half
 */
function wrapsOnto(line: string, next: string): boolean {
	return Boolean(line) && Boolean(next) && !FINISHED.test(line) && !TAG.test(line) && !TAG.test(next) && !DIRECTIVE.test(next);
}

/**
 * Reads the file's comments once, whichever kind of source it came from.
 * @param context The rule context
 */
function inspectComments(context: Rule.RuleContext): void {
	const comments = context.sourceCode.getAllComments();

	for (const comment of comments) {
		const lines = readLines(comment.value);

		for (let index = 0; index < lines.length; index += 1) {
			const line = lines.at(index) ?? "";
			const at = {line: (comment.loc?.start.line ?? 1) + index, column: 0};

			if (index + 1 < lines.length && wrapsOnto(line, lines.at(index + 1) ?? "")) {
				context.report({loc: {start: at, end: at}, messageId: "wrapped"});
			} else if (line.length > COMFORTABLE) {
				context.report({loc: {start: at, end: at}, messageId: "long", data: {width: String(line.length), comfortable: String(COMFORTABLE)}});
			}
		}
	}
}

/** Keeps a comment on one line, so a sentence is never read twice to find out where it went. */
const rule: Rule.RuleModule = {
	meta: {
		type: "layout",
		docs: {description: "Keeps a comment's sentence on one line, summarized rather than wrapped"},
		messages: {
			wrapped: "This comment runs onto the next line. Say it in one line, or summarize it until it fits",
			long: "This comment line is {{width}} characters. Summarize it to {{comfortable}} or fewer"
		},
		schema: []
	},

	/**
	 * Reads every comment in a file, line by line, and asks about the ones that run on.
	 * @param context The rule context eslint hands the rule
	 * @returns The visitor eslint runs over the program
	 */
	create: function checkComments(context: Rule.RuleContext): Rule.RuleListener {
		return {
			Program: function inspectProgramComments(): void {
				inspectComments(context);
			},
			StyleSheet: function inspectStyleSheetComments(): void {
				inspectComments(context);
			}
		};
	}
};

export default rule;
