/**
 * A database query belongs in its own file.
 * Written inline, SQL strings hide from syntax highlighters, query formatters and linters.
 * Put every statement in a query file with named blocks so queries stay organized.
 */
import type {Rule} from "eslint";

/** How long a string has to be before it is worth reading as a statement. */
const MINIMUM_QUERY_LENGTH = 10;

/** A SELECT statement, written from its start. */
const SELECT_QUERY_PATTERN: RegExp = /^\s*(SELECT\b[\s\S]*?\bFROM\b|SELECT\s+VALUE\b)/i;

/** A SELECT statement embedded inside a larger one. */
const EMBEDDED_SELECT_PATTERN: RegExp = /\bSELECT\b[\s\S]+?\bFROM\b(?![\w])/i;

/** An UPDATE statement, written from its start. */
const UPDATE_QUERY_PATTERN: RegExp = /^\s*UPDATE\b[\s\S]+?\bSET\b/i;

/** An UPDATE aimed at one record by its identifier. */
const UPDATE_RECORD_PATTERN: RegExp = /\bUPDATE\s+type::record\b[\s\S]+?\bSET\b/i;

/** A DELETE aimed at a table or a record. */
const DELETE_QUERY_PATTERN: RegExp = /^\s*DELETE\b\s+(FROM\s+)?[a-z0-9_:]+;/i;

/** An INSERT INTO statement. */
const INSERT_QUERY_PATTERN: RegExp = /^\s*INSERT\s+INTO\b/i;

/** A CREATE statement that writes a record. */
const CREATE_QUERY_PATTERN: RegExp = /^\s*CREATE\b\s+[a-z0-9_:]+\s+(SET|CONTENT)\b/i;

/** A RELATE statement, which draws an edge between two records. */
const RELATE_QUERY_PATTERN: RegExp = /^\s*RELATE\b\s+[\s\S]+?->/i;

/** A DEFINE statement, which is schema rather than data. */
const DEFINE_QUERY_PATTERN: RegExp = /^\s*DEFINE\s+(TABLE|FIELD|INDEX|ACCESS|SCOPE)\b/i;

/** A REMOVE statement, which is schema rather than data. */
const REMOVE_QUERY_PATTERN: RegExp = /^\s*REMOVE\s+(TABLE|FIELD|INDEX|ACCESS|SCOPE)\b/i;

/** Every shape a statement written inline takes. */
const SQL_PATTERNS: RegExp[] = [
	SELECT_QUERY_PATTERN,
	EMBEDDED_SELECT_PATTERN,
	UPDATE_QUERY_PATTERN,
	UPDATE_RECORD_PATTERN,
	DELETE_QUERY_PATTERN,
	INSERT_QUERY_PATTERN,
	CREATE_QUERY_PATTERN,
	RELATE_QUERY_PATTERN,
	DEFINE_QUERY_PATTERN,
	REMOVE_QUERY_PATTERN
];

/**
 * Answers whether a string is a database statement written inline.
 * @param written The text to read
 * @returns True when the text is a query
 */
function isInlineSql(written: string): boolean {
	const trimmed = written.trim();
	let matches = false;

	if (trimmed.length >= MINIMUM_QUERY_LENGTH) {
		matches = SQL_PATTERNS.some(function matchesPattern(pattern: RegExp): boolean {
			return pattern.test(trimmed);
		});
	}

	return matches;
}

/** Keeps a database query in a query file, where the tools that read queries can find it. */
const rule: Rule.RuleModule = {
	meta: {
		type: "problem",
		docs: {description: "Forbids inline SQL and requires statements in query files (.surql)"},
		messages: {
			inlineSql: "A database query belongs in its own .surql file rather than inline in code"
		},
		schema: []
	},

	/**
	 * Watches every string in a file for a statement that should have been a query file.
	 * @param context The rule context eslint hands the rule
	 * @returns The visitor eslint runs over the program
	 */
	create: function checkInlineSql(context: Rule.RuleContext): Rule.RuleListener {
		return {
			/**
			 * Reads one string and asks about a statement written where a query file was wanted.
			 * @param node The literal
			 */
			Literal: function inspectLiteral(node): void {
				const parentType = (node.parent as Rule.Node | null)?.type;
				const isImportOrExport = parentType === "ImportDeclaration" || parentType === "ExportNamedDeclaration" || parentType === "ExportAllDeclaration";

				if (!isImportOrExport && typeof node.value === "string" && isInlineSql(node.value)) {
					context.report({node, messageId: "inlineSql"});
				}
			},
			/**
			 * Reads one template and asks about a statement assembled inside it.
			 * @param node The template literal
			 */
			TemplateLiteral: function inspectTemplate(node): void {
				const written = node.quasis
					.map(function readRaw(quasi): string {
						return quasi.value.raw;
					})
					.join(" ");

				if (isInlineSql(written)) {
					context.report({node, messageId: "inlineSql"});
				}
			}
		};
	}
};

export default rule;
