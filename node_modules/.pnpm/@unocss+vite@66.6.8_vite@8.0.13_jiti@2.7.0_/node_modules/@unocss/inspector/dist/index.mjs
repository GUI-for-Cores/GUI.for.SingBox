import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { BetterMap, CountableSet, escapeSelector } from "@unocss/core";
import gzipSize from "gzip-size";
import sirv from "sirv";
import { createValueHandler, getStringComponent, parseCssColor } from "@unocss/rule-utils";
//#region \0rolldown/runtime.js
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
//#endregion
//#region ../../virtual-shared/integration/src/constants.ts
const SKIP_START_COMMENT = "@unocss-skip-start";
const SKIP_END_COMMENT = "@unocss-skip-end";
const SKIP_COMMENT_RE = new RegExp(`(\/\/\\s*?${SKIP_START_COMMENT}\\s*?|\\/\\*\\s*?${SKIP_START_COMMENT}\\s*?\\*\\/|<!--\\s*?${SKIP_START_COMMENT}\\s*?-->)[\\s\\S]*?(\/\/\\s*?${SKIP_END_COMMENT}\\s*?|\\/\\*\\s*?${SKIP_END_COMMENT}\\s*?\\*\\/|<!--\\s*?${SKIP_END_COMMENT}\\s*?-->)`, "g");
const basePositionMap = [
	"top",
	"top center",
	"top left",
	"top right",
	"bottom",
	"bottom center",
	"bottom left",
	"bottom right",
	"left",
	"left center",
	"left top",
	"left bottom",
	"right",
	"right center",
	"right top",
	"right bottom",
	"center",
	"center top",
	"center bottom",
	"center left",
	"center right",
	"center center"
];
Object.assign({}, ...basePositionMap.map((p) => ({ [p.replace(/ /, "-")]: p })), ...basePositionMap.map((p) => ({ [p.replace(/\b(\w)\w+/g, "$1").replace(/ /, "")]: p })));
const globalKeywords = [
	"inherit",
	"initial",
	"revert",
	"revert-layer",
	"unset"
];
//#endregion
//#region ../../packages-presets/preset-mini/src/_utils/handlers/regex.ts
const numberWithUnitRE = /^(-?\d*(?:\.\d+)?)(px|pt|pc|%|r?(?:em|ex|lh|cap|ch|ic)|(?:[sld]?v|cq)(?:[whib]|min|max)|in|cm|mm|rpx)?$/i;
const numberRE = /^(-?\d*(?:\.\d+)?)$/;
const unitOnlyRE = /^(px|[sld]?v[wh])$/i;
const unitOnlyMap = {
	px: 1,
	vw: 100,
	vh: 100,
	svw: 100,
	svh: 100,
	dvw: 100,
	dvh: 100,
	lvh: 100,
	lvw: 100
};
const bracketTypeRe = /^\[(color|image|length|size|position|quoted|string):/i;
//#endregion
//#region ../../packages-presets/preset-mini/src/_utils/handlers/handlers.ts
var handlers_exports = /* @__PURE__ */ __exportAll({
	auto: () => auto,
	bracket: () => bracket,
	bracketOfColor: () => bracketOfColor,
	bracketOfLength: () => bracketOfLength,
	bracketOfPosition: () => bracketOfPosition,
	cssvar: () => cssvar,
	degree: () => degree,
	fraction: () => fraction,
	global: () => global,
	number: () => number,
	numberWithUnit: () => numberWithUnit,
	percent: () => percent,
	position: () => position,
	properties: () => properties,
	px: () => px,
	rem: () => rem,
	time: () => time
});
const cssProps = [
	"color",
	"border-color",
	"background-color",
	"outline-color",
	"text-decoration-color",
	"flex-grow",
	"flex",
	"flex-shrink",
	"grid",
	"grid-template-columns",
	"grid-template-rows",
	"caret-color",
	"font",
	"gap",
	"opacity",
	"visibility",
	"z-index",
	"font-weight",
	"zoom",
	"text-shadow",
	"transform",
	"box-shadow",
	"border",
	"background-position",
	"left",
	"right",
	"top",
	"bottom",
	"object-position",
	"max-height",
	"min-height",
	"max-width",
	"min-width",
	"height",
	"width",
	"border-width",
	"margin",
	"padding",
	"outline-width",
	"outline-offset",
	"font-size",
	"line-height",
	"text-indent",
	"vertical-align",
	"border-spacing",
	"letter-spacing",
	"word-spacing",
	"stroke",
	"filter",
	"backdrop-filter",
	"fill",
	"mask",
	"mask-size",
	"mask-border",
	"clip-path",
	"clip",
	"border-radius"
];
function round(n) {
	return +n.toFixed(10);
}
function numberWithUnit(str) {
	const match = str.match(numberWithUnitRE);
	if (!match) return;
	const [, n, unit] = match;
	const num = Number.parseFloat(n);
	if (unit && !Number.isNaN(num)) return `${round(num)}${unit}`;
}
function auto(str) {
	if (str === "auto" || str === "a") return "auto";
}
function rem(str) {
	if (!str) return;
	if (unitOnlyRE.test(str)) return `${unitOnlyMap[str]}${str}`;
	const match = str.match(numberWithUnitRE);
	if (!match) return;
	const [, n, unit] = match;
	const num = Number.parseFloat(n);
	if (!Number.isNaN(num)) {
		if (num === 0) return "0";
		return unit ? `${round(num)}${unit}` : `${round(num / 4)}rem`;
	}
}
function px(str) {
	if (unitOnlyRE.test(str)) return `${unitOnlyMap[str]}${str}`;
	const match = str.match(numberWithUnitRE);
	if (!match) return;
	const [, n, unit] = match;
	const num = Number.parseFloat(n);
	if (!Number.isNaN(num)) return unit ? `${round(num)}${unit}` : `${round(num)}px`;
}
function number(str) {
	if (!numberRE.test(str)) return;
	const num = Number.parseFloat(str);
	if (!Number.isNaN(num)) return round(num);
}
function percent(str) {
	if (str.endsWith("%")) str = str.slice(0, -1);
	if (!numberRE.test(str)) return;
	const num = Number.parseFloat(str);
	if (!Number.isNaN(num)) return `${round(num / 100)}`;
}
function fraction(str) {
	if (!str) return;
	if (str === "full") return "100%";
	const [left, right] = str.split("/");
	const num = Number.parseFloat(left) / Number.parseFloat(right);
	if (!Number.isNaN(num)) {
		if (num === 0) return "0";
		return `${round(num * 100)}%`;
	}
}
function bracketWithType(str, requiredType) {
	if (str && str.startsWith("[") && str.endsWith("]")) {
		let base;
		let hintedType;
		const match = str.match(bracketTypeRe);
		if (!match) base = str.slice(1, -1);
		else {
			if (!requiredType) hintedType = match[1];
			base = str.slice(match[0].length, -1);
		}
		if (!base) return;
		if (base === "=\"\"") return;
		if (base.startsWith("--")) base = `var(${base})`;
		let curly = 0;
		for (const i of base) if (i === "[") curly += 1;
		else if (i === "]") {
			curly -= 1;
			if (curly < 0) return;
		}
		if (curly) return;
		switch (hintedType) {
			case "string": return base.replace(/(^|[^\\])_/g, "$1 ").replace(/\\_/g, "_");
			case "quoted": return base.replace(/(^|[^\\])_/g, "$1 ").replace(/\\_/g, "_").replace(/(["\\])/g, "\\$1").replace(/^(.+)$/, "\"$1\"");
		}
		return base.replace(/(url\(.*?\))/g, (v) => v.replace(/_/g, "\\_")).replace(/(^|[^\\])_/g, "$1 ").replace(/\\_/g, "_").replace(/(?:calc|clamp|max|min)\((.*)/g, (match) => {
			const vars = [];
			return match.replace(/var\((--.+?)[,)]/g, (match, g1) => {
				vars.push(g1);
				return match.replace(g1, "--un-calc");
			}).replace(/(-?\d*\.?\d(?!-\d.+[,)](?![^+\-/*])\D)(?:%|[a-z]+)?|\))([+\-/*])/g, "$1 $2 ").replace(/--un-calc/g, () => vars.shift());
		});
	}
}
function bracket(str) {
	return bracketWithType(str);
}
function bracketOfColor(str) {
	return bracketWithType(str, "color");
}
function bracketOfLength(str) {
	return bracketWithType(str, "length");
}
function bracketOfPosition(str) {
	return bracketWithType(str, "position");
}
function cssvar(str) {
	if (/^\$[^\s'"`;{}]/.test(str)) {
		const [name, defaultValue] = str.slice(1).split(",");
		return `var(--${escapeSelector(name)}${defaultValue ? `, ${defaultValue}` : ""})`;
	}
}
function time(str) {
	const match = str.match(/^(-?[0-9.]+)(s|ms)?$/i);
	if (!match) return;
	const [, n, unit] = match;
	const num = Number.parseFloat(n);
	if (!Number.isNaN(num)) {
		if (num === 0 && !unit) return "0s";
		return unit ? `${round(num)}${unit}` : `${round(num)}ms`;
	}
}
function degree(str) {
	const match = str.match(/^(-?[0-9.]+)(deg|rad|grad|turn)?$/i);
	if (!match) return;
	const [, n, unit] = match;
	const num = Number.parseFloat(n);
	if (!Number.isNaN(num)) {
		if (num === 0) return "0deg";
		return unit ? `${round(num)}${unit}` : `${round(num)}deg`;
	}
}
function global(str) {
	if (globalKeywords.includes(str)) return str;
}
function properties(str) {
	if (str.split(",").every((prop) => cssProps.includes(prop))) return str;
}
function position(str) {
	if ([
		"top",
		"left",
		"right",
		"bottom",
		"center"
	].includes(str)) return str;
}
const h = createValueHandler(handlers_exports);
//#endregion
//#region ../../packages-presets/preset-mini/src/_utils/utilities.ts
function getThemeColorForKey(theme, colors, key = "colors") {
	const obj = theme[key];
	function deepGet(current, path) {
		if (path.length === 0) return current;
		if (!current || typeof current !== "object") return void 0;
		for (let i = path.length; i > 0; i--) {
			const flatKey = path.slice(0, i).join("-");
			const value = current[flatKey.replace(/(-[a-z])/g, (n) => n.slice(1).toUpperCase())] ?? current[flatKey];
			if (value != null) {
				if (i === path.length) return value;
				return deepGet(value, path.slice(i));
			}
		}
	}
	return deepGet(obj, colors);
}
/**
* Obtain color from theme by camel-casing colors.
*/
function getThemeColor(theme, colors, key) {
	return getThemeColorForKey(theme, colors, key) || getThemeColorForKey(theme, colors, "colors");
}
/**
* Split utility shorthand delimited by / or :
*/
function splitShorthand(body, type) {
	const [front, rest] = getStringComponent(body, "[", "]", ["/", ":"]) ?? [];
	if (front != null) {
		const match = (front.match(bracketTypeRe) ?? [])[1];
		if (match == null || match === type) return [front, rest];
	}
}
/**
* Parse color string into {@link ParsedColorValue} (if possible). Color value will first be matched to theme object before parsing.
* See also color.tests.ts for more examples.
*
* @example Parseable strings:
* 'red' // From theme, if 'red' is available
* 'red-100' // From theme, plus scale
* 'red-100/20' // From theme, plus scale/opacity
* '[rgb(100 2 3)]/[var(--op)]' // Bracket with rgb color and bracket with opacity
*
* @param body - Color string to be parsed.
* @param theme - {@link Theme} object.
* @return object if string is parseable.
*/
function parseColor(body, theme, key) {
	const split = splitShorthand(body, "color");
	if (!split) return;
	const [main, opacity] = split;
	const colors = main.replace(/([a-z])(\d)/g, "$1-$2").split(/-/g);
	const [name] = colors;
	if (!name) return;
	let color;
	const bracket = h.bracketOfColor(main);
	const bracketOrMain = bracket || main;
	if (h.numberWithUnit(bracketOrMain)) return;
	if (/^#[\da-f]+$/i.test(bracketOrMain)) color = bracketOrMain;
	else if (/^hex-[\da-fA-F]+$/.test(bracketOrMain)) color = `#${bracketOrMain.slice(4)}`;
	else if (main.startsWith("$")) color = h.cssvar(main);
	color = color || bracket;
	if (!color) {
		const colorData = getThemeColor(theme, [main], key);
		if (typeof colorData === "string") color = colorData;
	}
	let no = "DEFAULT";
	if (!color) {
		let keys = colors;
		let _no;
		const [scale] = colors.slice(-1);
		if (/^\d+$/.test(scale)) {
			no = _no = scale;
			keys = colors.slice(0, -1);
		}
		const colorData = getThemeColor(theme, keys, key);
		if (typeof colorData === "object") color = colorData[_no ?? no];
		else if (typeof colorData === "string" && !_no) color = colorData;
	}
	return {
		opacity,
		name,
		no,
		color,
		cssColor: parseCssColor(color),
		alpha: h.bracket.cssvar.percent(opacity ?? "")
	};
}
//#endregion
//#region src/categories.ts
const staticUtilities = {
	"box-border": "boxSizing",
	"box-content": "boxSizing",
	"b": "border",
	"border": "border",
	"rounded": "border",
	"block": "display",
	"inline-block": "display",
	"inline": "display",
	"flex": "display",
	"inline-flex": "display",
	"table": "display",
	"table-caption": "display",
	"table-cell": "display",
	"table-column": "display",
	"table-column-group": "display",
	"table-footer-group": "display",
	"table-header-group": "display",
	"table-row-group": "display",
	"table-row": "display",
	"flow-root": "display",
	"grid": "display",
	"inline-grid": "display",
	"contents": "display",
	"hidden": "display",
	"float-right": "float",
	"float-left": "float",
	"float-none": "float",
	"clear-left": "clear",
	"clear-right": "clear",
	"clear-both": "clear",
	"clear-none": "clear",
	"object-contain": "objectFit",
	"object-cover": "objectFit",
	"object-fill": "objectFit",
	"object-none": "objectFit",
	"object-scale-down": "objectFit",
	"overflow-auto": "overflow",
	"overflow-hidden": "overflow",
	"overflow-visible": "overflow",
	"overflow-scroll": "overflow",
	"overflow-x-auto": "overflow",
	"overflow-y-auto": "overflow",
	"overflow-x-hidden": "overflow",
	"overflow-y-hidden": "overflow",
	"overflow-x-visible": "overflow",
	"overflow-y-visible": "overflow",
	"overflow-x-scroll": "overflow",
	"overflow-y-scroll": "overflow",
	"of-auto": "overflow",
	"of-hidden": "overflow",
	"of-visible": "overflow",
	"of-scroll": "overflow",
	"of-x-auto": "overflow",
	"of-y-auto": "overflow",
	"of-x-hidden": "overflow",
	"of-y-hidden": "overflow",
	"of-x-visible": "overflow",
	"of-y-visible": "overflow",
	"of-x-scroll": "overflow",
	"of-y-scroll": "overflow",
	"overscroll-auto": "overscrollBehavior",
	"overscroll-contain": "overscrollBehavior",
	"overscroll-none": "overscrollBehavior",
	"overscroll-y-auto": "overscrollBehavior",
	"overscroll-y-contain": "overscrollBehavior",
	"overscroll-y-none": "overscrollBehavior",
	"overscroll-x-auto": "overscrollBehavior",
	"overscroll-x-contain": "overscrollBehavior",
	"overscroll-x-none": "overscrollBehavior",
	"static": "position",
	"fixed": "position",
	"absolute": "position",
	"relative": "position",
	"sticky": "position",
	"visible": "visibility",
	"invisible": "visibility",
	"flex-row": "flex",
	"flex-row-reverse": "flex",
	"flex-col": "flex",
	"flex-col-reverse": "flex",
	"flex-wrap": "flex",
	"flex-wrap-reverse": "flex",
	"flex-nowrap": "flex",
	"col-auto": "grid",
	"row-auto": "grid",
	"grid-flow-row": "grid",
	"grid-flow-col": "grid",
	"grid-flow-row-dense": "grid",
	"grid-flow-col-dense": "grid",
	"justify-start": "justifyContent",
	"justify-end": "justifyContent",
	"justify-center": "justifyContent",
	"justify-between": "justifyContent",
	"justify-around": "justifyContent",
	"justify-evenly": "justifyContent",
	"justify-left": "justifyContent",
	"justify-right": "justifyContent",
	"justify-items-auto": "justifyItems",
	"justify-items-start": "justifyItems",
	"justify-items-end": "justifyItems",
	"justify-items-center": "justifyItems",
	"justify-items-stretch": "justifyItems",
	"justify-self-auto": "justifySelf",
	"justify-self-start": "justifySelf",
	"justify-self-end": "justifySelf",
	"justify-self-center": "justifySelf",
	"justify-self-stretch": "justifySelf",
	"content-center": "alignContent",
	"content-start": "alignContent",
	"content-end": "alignContent",
	"content-between": "alignContent",
	"content-around": "alignContent",
	"content-evenly": "alignContent",
	"items-start": "alignItems",
	"items-end": "alignItems",
	"items-center": "alignItems",
	"items-baseline": "alignItems",
	"items-stretch": "alignItems",
	"self-auto": "alignSelf",
	"self-start": "alignSelf",
	"self-end": "alignSelf",
	"self-center": "alignSelf",
	"self-stretch": "alignSelf",
	"place-content-center": "placeContent",
	"place-content-start": "placeContent",
	"place-content-end": "placeContent",
	"place-content-between": "placeContent",
	"place-content-around": "placeContent",
	"place-content-evenly": "placeContent",
	"place-content-stretch": "placeContent",
	"place-items-auto": "placeItems",
	"place-items-start": "placeItems",
	"place-items-end": "placeItems",
	"place-items-center": "placeItems",
	"place-items-stretch": "placeItems",
	"place-self-auto": "placeSelf",
	"place-self-start": "placeSelf",
	"place-self-end": "placeSelf",
	"place-self-center": "placeSelf",
	"place-self-stretch": "placeSelf",
	"antialiased": "fontSmoothing",
	"subpixel-antialiased": "font",
	"italic": "font",
	"not-italic": "font",
	"normal-nums": "font",
	"ordinal": "font",
	"slashed-zero": "font",
	"lining-nums": "font",
	"oldstyle-nums": "font",
	"proportional-nums": "font",
	"tabular-nums": "font",
	"diagonal-fractions": "font",
	"stacked-fractions": "font",
	"list-inside": "listStylePosition",
	"list-outside": "listStylePosition",
	"text-left": "textAlign",
	"text-center": "textAlign",
	"text-right": "textAlign",
	"text-justify": "textAlign",
	"underline": "textDecoration",
	"line-through": "textDecoration",
	"no-underline": "textDecoration",
	"uppercase": "textTransform",
	"lowercase": "textTransform",
	"capitalize": "textTransform",
	"normal-case": "textTransform",
	"truncate": "textOverflow",
	"overflow-ellipsis": "textOverflow",
	"overflow-clip": "textOverflow",
	"align-baseline": "verticalAlign",
	"align-top": "verticalAlign",
	"align-middle": "verticalAlign",
	"align-bottom": "verticalAlign",
	"align-text-top": "verticalAlign",
	"align-text-bottom": "verticalAlign",
	"whitespace-normal": "whitespace",
	"whitespace-nowrap": "whitespace",
	"whitespace-pre": "whitespace",
	"whitespace-pre-line": "whitespace",
	"whitespace-pre-wrap": "whitespace",
	"ws-normal": "whitespace",
	"ws-nowrap": "whitespace",
	"ws-pre": "whitespace",
	"ws-pre-line": "whitespace",
	"ws-pre-wrap": "whitespace",
	"break-normal": "wordBreak",
	"break-words": "wordBreak",
	"break-all": "wordBreak",
	"bg-fixed": "background",
	"bg-local": "background",
	"bg-scroll": "background",
	"bg-clip-border": "background",
	"bg-clip-padding": "background",
	"bg-clip-content": "background",
	"bg-clip-text": "background",
	"bg-repeat": "background",
	"bg-no-repeat": "background",
	"bg-repeat-x": "background",
	"bg-repeat-y": "background",
	"bg-repeat-round": "background",
	"bg-repeat-space": "background",
	"border-solid": "border",
	"border-dashed": "border",
	"border-dotted": "border",
	"border-double": "border",
	"border-none": "border",
	"border-collapse": "border",
	"border-separate": "border",
	"table-auto": "table",
	"table-fixed": "table",
	"transform": "transform",
	"transform-gpu": "transform",
	"transform-none": "transform",
	"appearance-none": "appearance",
	"pointer-events-none": "pointerEvents",
	"pointer-events-auto": "pointerEvents",
	"resize-none": "resize",
	"resize-y": "resize",
	"resize-x": "resize",
	"resize": "resize",
	"select-none": "userSelect",
	"select-text": "userSelect",
	"select-all": "userSelect",
	"select-auto": "userSelect",
	"fill-current": "fill",
	"stroke-current": "stroke",
	"sr-only": "accessibility",
	"not-sr-only": "accessibility",
	"filter": "filter",
	"invert": "filter"
};
const dynamicUtilities = {
	container: "container",
	space: "space",
	divide: "divide",
	bg: "background",
	from: "gradientColor",
	via: "gradientColor",
	to: "gradientColor",
	border: "border",
	b: "border",
	rounded: "borderRadius",
	cursor: "cursor",
	flex: "flex",
	shrink: "flex",
	order: "order",
	font: "font",
	h: "size",
	leading: "lineHeight",
	list: "listStyleType",
	m: "margin",
	my: "margin",
	mx: "margin",
	mt: "margin",
	mr: "margin",
	mb: "margin",
	ml: "margin",
	min: "size",
	max: "size",
	object: "objectPosition",
	op: "opacity",
	opacity: "opacity",
	outline: "outline",
	p: "padding",
	py: "padding",
	px: "padding",
	pt: "padding",
	pr: "padding",
	pb: "padding",
	pl: "padding",
	placeholder: "placeholder",
	inset: "inset",
	top: "position",
	right: "position",
	bottom: "position",
	left: "position",
	shadow: "boxShadow",
	ring: "ring",
	fill: "fill",
	stroke: "stroke",
	text: "text",
	tracking: "letterSpacing",
	w: "size",
	z: "zIndex",
	gap: "gap",
	auto: "grid",
	grid: "grid",
	col: "grid",
	row: "grid",
	origin: "transform",
	scale: "transform",
	rotate: "transform",
	translate: "transform",
	skew: "transform",
	transition: "animation",
	ease: "animation",
	duration: "animation",
	delay: "animation",
	animate: "animation",
	filter: "filter",
	backdrop: "filter",
	invert: "filter"
};
//#endregion
//#region src/utils.ts
function getSelectorCategory(selector) {
	return staticUtilities[selector] || Object.entries(dynamicUtilities).find(([name]) => new RegExp(`^${name}+(-.+|[0-9]+)$`).test(selector))?.[1];
}
//#endregion
//#region src/analyzer.ts
const ignoredColors = [
	"transparent",
	"current",
	"currentColor",
	"inherit",
	"initial",
	"unset",
	"none"
];
function uniq(array) {
	return [...new Set(array)];
}
async function analyzer(modules, ctx) {
	const matched = [];
	const icons = [];
	const colors = [];
	const tokensInfo = /* @__PURE__ */ new Map();
	await Promise.all(modules.map(async (code, id) => {
		const result = await ctx.uno.generate(code, {
			id,
			extendedInfo: true,
			preflights: false
		});
		for (const [key, value] of result.matched.entries()) {
			const prev = tokensInfo.get(key);
			tokensInfo.set(key, {
				data: value.data,
				count: prev?.modules?.length ? value.count + prev.count : value.count,
				modules: uniq([...prev?.modules || [], id])
			});
		}
	}));
	for (const [rawSelector, { data, count, modules: _modules }] of tokensInfo.entries()) {
		const ruleContext = data[data.length - 1][5];
		const ruleMeta = data[data.length - 1][4];
		const body = data.map((d) => d[2]).join("\n---\n");
		const baseSelector = ruleContext?.currentSelector;
		const variants = ruleContext?.variants?.map((v) => v.name).filter(Boolean);
		const layer = ruleMeta?.layer || "default";
		if (baseSelector) {
			const category = layer !== "default" ? layer : getSelectorCategory(baseSelector);
			const body = baseSelector.replace(/^ring-offset|outline-solid|outline-dotted/, "head").replace(/^\w+-/, "");
			if (category === "icons") {
				const existing = icons.find((i) => i.baseSelector === baseSelector);
				if (existing) {
					existing.count += count;
					existing.modules = uniq([...existing.modules, ..._modules]);
				} else icons.push({
					name: rawSelector,
					rawSelector,
					baseSelector,
					category,
					variants,
					count,
					ruleMeta,
					modules: _modules,
					body
				});
				continue;
			}
			const parsedColor = parseColor(body, ctx.uno.config.theme, "colors");
			if (parsedColor?.color && !ignoredColors.includes(parsedColor?.color)) {
				const existing = colors.find((c) => c.name === parsedColor.name && c.no === parsedColor.no);
				if (existing) {
					existing.count += count;
					existing.modules = uniq([...existing.modules, ..._modules]);
				} else colors.push({
					name: parsedColor.name,
					no: parsedColor.no,
					color: parsedColor.color,
					count,
					modules: _modules,
					rawSelector,
					category: category || "",
					variants,
					body
				});
			}
			if (category) {
				matched.push({
					name: rawSelector,
					rawSelector,
					baseSelector,
					category,
					variants,
					count,
					ruleMeta,
					modules: _modules,
					body
				});
				continue;
			}
		}
		matched.push({
			name: rawSelector,
			rawSelector,
			category: "other",
			count,
			modules: _modules,
			body
		});
	}
	return {
		matched,
		colors,
		icons
	};
}
//#endregion
//#region src/index.ts
const _dirname = typeof __dirname !== "undefined" ? __dirname : dirname(fileURLToPath(import.meta.url));
function UnocssInspector(ctx) {
	const baseUrl = "__unocss";
	async function configureServer(server) {
		await ctx.ready;
		server.middlewares.use(`/${baseUrl}`, sirv(resolve(_dirname, "../dist/client"), {
			single: true,
			dev: true
		}));
		server.middlewares.use(`/${baseUrl}_api`, async (req, res, next) => {
			if (!req.url) return next();
			if (req.url === "/") {
				const info = {
					version: ctx.uno.version,
					root: server.config.root,
					modules: Array.from(ctx.modules.keys()),
					config: ctx.uno.config,
					configSources: (await ctx.ready).sources
				};
				res.setHeader("Content-Type", "application/json");
				res.write(JSON.stringify(info, getCircularReplacer(), 2));
				res.end();
				return;
			}
			if (req.url.startsWith("/module")) {
				const id = new URLSearchParams(req.url.slice(8)).get("id") || "";
				const code = ctx.modules.get(id);
				if (code == null) {
					res.statusCode = 404;
					res.end();
					return;
				}
				const tokens = new CountableSet();
				await ctx.uno.applyExtractors(code.replace(SKIP_COMMENT_RE, ""), id, tokens);
				const result = await ctx.uno.generate(tokens, {
					id,
					extendedInfo: true,
					preflights: false
				});
				const analyzed = await analyzer(new BetterMap([[id, code]]), ctx);
				const mod = {
					...result,
					...analyzed,
					layers: result.layers.map((name) => ({
						name,
						css: result.getLayer(name)
					})),
					gzipSize: await gzipSize(result.css),
					code,
					id
				};
				res.setHeader("Content-Type", "application/json");
				res.write(JSON.stringify(mod, null, 2));
				res.end();
				return;
			}
			if (req.url.startsWith("/repl")) {
				const query = new URLSearchParams(req.url.slice(5));
				const token = query.get("token") || "";
				const includeSafelist = JSON.parse(query.get("safelist") ?? "false");
				const result = await ctx.uno.generate(token, {
					preflights: false,
					safelist: includeSafelist
				});
				const mod = {
					...result,
					matched: Array.from(result.matched)
				};
				res.setHeader("Content-Type", "application/json");
				res.write(JSON.stringify(mod, null, 2));
				res.end();
				return;
			}
			if (req.url.startsWith("/overview")) {
				const result = await ctx.uno.generate(ctx.tokens, { preflights: false });
				const analyzed = await analyzer(ctx.modules, ctx);
				const mod = {
					...result,
					...analyzed,
					gzipSize: await gzipSize(result.css),
					layers: result.layers.map((name) => ({
						name,
						css: result.getLayer(name)
					}))
				};
				res.setHeader("Content-Type", "application/json");
				res.write(JSON.stringify(mod, null, 2));
				res.end();
				return;
			}
			next();
		});
	}
	return {
		name: "unocss:inspector",
		apply: "serve",
		configureServer,
		devtools: { setup(ctx) {
			ctx.docks.register({
				id: "unocss",
				title: "UnoCSS",
				icon: "https://unocss.dev/logo.svg",
				type: "iframe",
				url: `/${baseUrl}`
			});
		} }
	};
}
function getCircularReplacer() {
	const ancestors = [];
	return function(key, value) {
		if (typeof value !== "object" || value === null) return value;
		while (ancestors.length > 0 && ancestors.at(-1) !== this) ancestors.pop();
		if (ancestors.includes(value)) return "[Circular]";
		ancestors.push(value);
		return value;
	};
}
//#endregion
export { UnocssInspector as default };
