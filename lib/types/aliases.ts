/** What an alias names, and where the directory it stands for sits on disk. */

/** One alias, and the directory it is the name of. */
export interface AliasTarget {
	prefix: string;
	alias: string;
}

/** The alias an import should have used, and the import to write instead. */
export interface AliasSuggestion {
	alias: string;
	suggested: string;
}
