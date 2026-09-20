/**
 * A function's documentation opens with what the function does.
 * "A helper for the table" names a category; "Builds one row of the table" says what happens when it is called.
 * A third-person verb is the shortest way to say it, and it reads as the answer to "what does this do".
 */
import type {Rule} from "eslint";
import type {Comment} from "estree";

/** A line that declares a function, whichever shape the declaration takes. */
const DECLARES_FUNCTION: RegExp =
	/(?:^|[\s:=(])function\s+[A-Za-z0-9_$]+|^\s*(?:override\s+)?(?:private\s+|public\s+|protected\s+)?(?:async\s+)?(?:get\s+|set\s+)?[A-Za-z0-9_$]+\s*(?:<[^(]*>)?\([^)]*\)\s*(?::|\{)/;

/** Comment lines the tools read, which sit between a block and the function it documents. */
const BETWEEN: RegExp = /^\s*(?:\/\* (?:eslint|prettier)|\/\/ eslint)/;

/** A third-person verb: capitalized, and ending in the s that makes it one. */
const THIRD_PERSON: RegExp = /^[A-Z][a-z-]*(?:e?s)$/;

/** The asterisk a block comment's lines are drawn with, which is not part of what was said. */
const DRAWN_MARGIN: RegExp = /^\s*\*?/;

/** Whitespace between one word and the next. */
const BETWEEN_WORDS: RegExp = /\s+/;

/** Words that end in an s without being a verb. */
const NOT_A_VERB: Set<string> = new Set(["Its", "This", "Always", "Perhaps", "Unless", "Whereas", "Plus", "Yes", "Postgres", "Kit", "Zero", "TipTap"]);

/** Verbs that only say what comes back, which `@returns` says already. */
const SAYS_THE_RETURN: Set<string> = new Set(["Returns", "Gives", "Provides", "Yields"]);

/**
 * Reads one line of a block comment as what it says, without the drawing around it.
 * @param line The line as it stands in the file
 * @returns What the line says
 */
function documentedLine(line: string): string {
	return line.replace(DRAWN_MARGIN, "").trim();
}

/**
 * Names the first word of a comment's description, which is what the reader meets first.
 * @param comment The block comment
 * @returns The opening word, or an empty string when the comment says nothing
 */
function openingWord(comment: Comment): string {
	const spoken: string[] = [];

	for (const line of comment.value.split("\n")) {
		const said = documentedLine(line);

		if (said !== "" && !said.startsWith("@")) {
			spoken.push(said);
		}
	}

	const [description = ""] = spoken;
	const [word = ""] = description.split(BETWEEN_WORDS);

	return word;
}

/**
 * Answers whether a line is blank or a tool directive between a comment and a function.
 * @param line The line of code
 * @returns True when the line can be skipped
 */
function isSkippableLine(line: string): boolean {
	return line.trim() === "" || BETWEEN.test(line);
}

/**
 * Answers whether a comment sits above a function rather than above anything else.
 * @param lines The lines of the file
 * @param comment The block comment
 * @returns True when a function declaration follows it
 */
function documentsAFunction(lines: string[], comment: Comment): boolean {
	let after = comment.loc?.end.line ?? 0;

	while (after < lines.length && isSkippableLine(lines.at(after) ?? "")) {
		after += 1;
	}

	return DECLARES_FUNCTION.test(lines.at(after) ?? "");
}

/** Opens a function's documentation with what it does, rather than with what it is. */
const rule: Rule.RuleModule = {
	meta: {
		type: "suggestion",
		docs: {description: "Opens a function's documentation with what it does"},
		messages: {
			notAVerb: 'Say what the function does: open with a third-person verb, not "{{word}}".',
			saysTheReturn: '"{{word}}" is what @returns says. Open with what the function does instead.'
		},
		schema: []
	},

	/**
	 * Reads every block comment in a file and asks about the ones that document a function.
	 * @param context The rule context eslint hands the rule
	 * @returns The visitor eslint runs over the program
	 */
	create: function checkDescriptions(context: Rule.RuleContext): Rule.RuleListener {
		const source = context.sourceCode;
		const lines = source.lines;

		return {
			/**
			 * Reads every block comment in the file and asks about the ones that document a function.
			 */
			Program: function everyBlock(): void {
				for (const comment of source.getAllComments()) {
					const at = comment.loc;
					const documents = Boolean(at) && comment.type === "Block" && comment.value.startsWith("*") && documentsAFunction(lines, comment);
					const word = documents ? openingWord(comment) : "";

					if (at && documents && SAYS_THE_RETURN.has(word)) {
						context.report({loc: at, messageId: "saysTheReturn", data: {word}});
					} else if (at && documents && (!THIRD_PERSON.test(word) || NOT_A_VERB.has(word))) {
						context.report({loc: at, messageId: "notAVerb", data: {word}});
					}
				}
			}
		};
	}
};

export default rule;
