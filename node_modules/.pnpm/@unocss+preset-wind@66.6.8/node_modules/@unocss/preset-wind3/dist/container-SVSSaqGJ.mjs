import { isString } from "@unocss/core";
import { resolveBreakpoints } from "@unocss/preset-mini/utils";
//#region src/rules/container.ts
const queryMatcher = /@media \(min-width: (.+)\)/;
const container = [[
	/^__container$/,
	(m, context) => {
		const { theme, variantHandlers } = context;
		const themePadding = theme.container?.padding;
		let padding;
		if (isString(themePadding)) padding = themePadding;
		else padding = themePadding?.DEFAULT;
		const themeMaxWidth = theme.container?.maxWidth;
		let maxWidth;
		for (const v of variantHandlers) {
			const query = v.handle?.({}, (x) => x)?.parent;
			if (isString(query)) {
				const match = query.match(queryMatcher)?.[1];
				if (match) {
					const matchBp = (resolveBreakpoints(context) ?? []).find((i) => i.size === match)?.point;
					if (!themeMaxWidth) maxWidth = match;
					else if (matchBp) maxWidth = themeMaxWidth?.[matchBp];
					if (matchBp && !isString(themePadding)) padding = themePadding?.[matchBp] ?? padding;
				}
			}
		}
		const css = { "max-width": maxWidth };
		if (!variantHandlers.length) css.width = "100%";
		if (theme.container?.center) {
			css["margin-left"] = "auto";
			css["margin-right"] = "auto";
		}
		if (themePadding) {
			css["padding-left"] = padding;
			css["padding-right"] = padding;
		}
		return css;
	},
	{ internal: true }
]];
const containerShortcuts = [[/^(?:(\w+)[:-])?container$/, ([, bp], context) => {
	let points = (resolveBreakpoints(context) ?? []).map((i) => i.point);
	if (bp) {
		if (!points.includes(bp)) return;
		points = points.slice(points.indexOf(bp));
	}
	const shortcuts = points.map((p) => `${p}:__container`);
	if (!bp) shortcuts.unshift("__container");
	return shortcuts;
}]];
//#endregion
export { containerShortcuts as n, container as t };
