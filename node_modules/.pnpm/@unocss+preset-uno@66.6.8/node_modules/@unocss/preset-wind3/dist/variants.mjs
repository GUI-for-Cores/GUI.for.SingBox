import { h, hasParseableColor, variantMatcher, variantParentMatcher } from "@unocss/preset-mini/utils";
import { colorToString, parseCssColor, variantMatcher as variantMatcher$1 } from "@unocss/rule-utils";
import { variants as variants$1 } from "@unocss/preset-mini/variants";
//#region src/variants/combinators.ts
const variantCombinators = [variantMatcher("svg", (input) => ({ selector: `${input.selector} svg` }))];
//#endregion
//#region src/variants/dark.ts
const variantColorsScheme = [
	variantMatcher(".dark", (input) => ({ prefix: `.dark $$ ${input.prefix}` })),
	variantMatcher(".light", (input) => ({ prefix: `.light $$ ${input.prefix}` })),
	variantParentMatcher("@dark", "@media (prefers-color-scheme: dark)"),
	variantParentMatcher("@light", "@media (prefers-color-scheme: light)")
];
//#endregion
//#region src/variants/media.ts
const variantContrasts = [variantParentMatcher("contrast-more", "@media (prefers-contrast: more)"), variantParentMatcher("contrast-less", "@media (prefers-contrast: less)")];
const variantMotions = [variantParentMatcher("motion-reduce", "@media (prefers-reduced-motion: reduce)"), variantParentMatcher("motion-safe", "@media (prefers-reduced-motion: no-preference)")];
const variantOrientations = [variantParentMatcher("landscape", "@media (orientation: landscape)"), variantParentMatcher("portrait", "@media (orientation: portrait)")];
//#endregion
//#region src/variants/misc.ts
const variantSpaceAndDivide = (matcher) => {
	if (matcher.startsWith("_")) return;
	if (/space-[xy]-.+$/.test(matcher) || /divide-/.test(matcher)) return {
		matcher,
		selector: (input) => {
			const not = ">:not([hidden])~:not([hidden])";
			return input.includes(not) ? input : `${input}${not}`;
		}
	};
};
const variantStickyHover = [variantMatcher$1("@hover", (input) => ({
	parent: `${input.parent ? `${input.parent} $$ ` : ""}@media (hover: hover) and (pointer: fine)`,
	selector: `${input.selector || ""}:hover`
}))];
//#endregion
//#region src/variants/mix.ts
function mixComponent(v1, v2, w) {
	return `calc(${v2} + (${v1} - ${v2}) * ${w} / 100)`;
}
/**
* Returns RGB color from a mixture of color1 and color2. Support RGB color values.
* https://sass-lang.com/documentation/modules/color#mix
*
* @param color1
* @param color2
* @param weight - How many of color2 will be used to mix into color1. Value of 0 will resulting in color2, value of 100 color1.
* @return
*/
function mixColor(color1, color2, weight) {
	const colors = [color1, color2];
	const cssColors = [];
	for (let c = 0; c < 2; c++) {
		const color = typeof colors[c] === "string" ? parseCssColor(colors[c]) : colors[c];
		if (!color || !["rgb", "rgba"].includes(color.type)) return;
		cssColors.push(color);
	}
	const newComponents = [];
	for (let x = 0; x < 3; x++) newComponents.push(mixComponent(cssColors[0].components[x], cssColors[1].components[x], weight));
	return {
		type: "rgb",
		components: newComponents,
		alpha: mixComponent(cssColors[0].alpha ?? 1, cssColors[1].alpha ?? 1, weight)
	};
}
/**
* Mix color with white. @see {@link mixColor}
*/
function tint(color, weight) {
	return mixColor("#fff", color, weight);
}
/**
* Mix color with black. @see {@link mixColor}
*/
function shade(color, weight) {
	return mixColor("#000", color, weight);
}
/**
* Mix color with black or white, according to weight. @see {@link mixColor}
*/
function shift(color, weight) {
	const num = Number.parseFloat(`${weight}`);
	if (!Number.isNaN(num)) return num > 0 ? shade(color, weight) : tint(color, -num);
}
const fns = {
	tint,
	shade,
	shift
};
/**
* Shade the color if the weight is positive, tint the color otherwise.
* Shading mixes the color with black, Tinting mixes the color with white.
* @see {@link mixColor}
*/
function variantColorMix() {
	let re;
	return {
		name: "mix",
		match(matcher, ctx) {
			if (!re) re = new RegExp(`^mix-(tint|shade|shift)-(-?\\d{1,3})(?:${ctx.generator.config.separators.join("|")})`);
			const m = matcher.match(re);
			if (m) return {
				matcher: matcher.slice(m[0].length),
				body: (body) => {
					body.forEach((v) => {
						if (v[1]) {
							const color = parseCssColor(`${v[1]}`);
							if (color) {
								const mixed = fns[m[1]](color, m[2]);
								if (mixed) v[1] = colorToString(mixed);
							}
						}
					});
					return body;
				}
			};
		}
	};
}
//#endregion
//#region src/variants/placeholder.ts
const placeholderModifier = (input, { theme }) => {
	const m = input.match(/^(.*)\b(placeholder-)(.+)$/);
	if (m) {
		const [, pre = "", p, body] = m;
		if (hasParseableColor(body, theme, "accentColor") || hasOpacityValue(body)) return { matcher: `${pre}placeholder-$ ${p}${body}` };
	}
};
function hasOpacityValue(body) {
	const match = body.match(/^op(?:acity)?-?(.+)$/);
	if (match && match[1] != null) return h.bracket.percent(match[1]) != null;
	return false;
}
//#endregion
//#region src/variants/default.ts
function variants(options) {
	return [
		placeholderModifier,
		variantSpaceAndDivide,
		...variants$1(options),
		...variantContrasts,
		...variantOrientations,
		...variantMotions,
		...variantCombinators,
		...variantColorsScheme,
		...variantStickyHover,
		variantColorMix()
	];
}
//#endregion
export { placeholderModifier, variantColorMix, variantColorsScheme, variantCombinators, variantContrasts, variantMotions, variantOrientations, variantSpaceAndDivide, variantStickyHover, variants };
