/** The shapes the class reader hands back, shared by the eslint rules and the stylelint plugins. */

/** Which way a box was pinned, so a report can say so in the reader's own words. */
export type SizeAxis = "block" | "inline";

/** A sizing prefix found on a utility, and the axis it works on. */
export interface SizePrefix {
	axis: SizeAxis;
	prefix: string;
}
