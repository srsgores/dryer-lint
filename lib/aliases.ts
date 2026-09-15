/**
 * The aliases a project addresses its own directories by, before anybody configures their own.
 * `$lib` and `@components` name the part of the app being asked for; `../../components` names where the reader happens to sit.
 */
import type {AliasTarget} from "./types/aliases.ts";

/** The aliases most of these projects declare, in the order a longer prefix has to beat a shorter one. */
export const DEFAULT_ALIASES: AliasTarget[] = [
	{prefix: "src/lib", alias: "$lib"},
	{prefix: "src/components", alias: "@components"},
	{prefix: "src/layouts", alias: "@layouts"},
	{prefix: "src/styles", alias: "@styles"},
	{prefix: "src/utils", alias: "@utils"},
	{prefix: "src/content", alias: "@content"},
	{prefix: "src/images", alias: "@images"},
	{prefix: "src/icons", alias: "@icons"},
	{prefix: "src/routes", alias: "@routes"},
	{prefix: "src/locales", alias: "$locales"},
	{prefix: "tests", alias: "@tests"},
	{prefix: "scripts", alias: "@scripts"}
];
