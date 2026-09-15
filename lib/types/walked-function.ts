/** One function being walked through, and whether `this` has turned up inside it. */
import type {Rule} from "eslint";

/** A function the arrow rule is part way through, kept until its body has been read. */
export interface WalkedFunction {
	node: Rule.Node;
	/** Whether the function is an arrow, since only an arrow is asked about. */
	isArrow: boolean;
	borrowsThis: boolean;
}
