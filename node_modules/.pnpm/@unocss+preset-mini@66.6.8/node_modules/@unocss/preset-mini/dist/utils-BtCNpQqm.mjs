import { n as __reExport, t as __exportAll } from "./chunk-D1SwGrFN.mjs";
import { escapeSelector, toArray } from "@unocss/core";
import { colorOpacityToString, colorToString, createValueHandler, getStringComponent, getStringComponents, parseCssColor } from "@unocss/rule-utils";
//#region src/_utils/mappings.ts
const directionMap = {
	"l": ["-left"],
	"r": ["-right"],
	"t": ["-top"],
	"b": ["-bottom"],
	"s": ["-inline-start"],
	"e": ["-inline-end"],
	"x": ["-left", "-right"],
	"y": ["-top", "-bottom"],
	"": [""],
	"bs": ["-block-start"],
	"be": ["-block-end"],
	"is": ["-inline-start"],
	"ie": ["-inline-end"],
	"block": ["-block-start", "-block-end"],
	"inline": ["-inline-start", "-inline-end"]
};
const insetMap = {
	...directionMap,
	s: ["-inset-inline-start"],
	start: ["-inset-inline-start"],
	e: ["-inset-inline-end"],
	end: ["-inset-inline-end"],
	bs: ["-inset-block-start"],
	be: ["-inset-block-end"],
	is: ["-inset-inline-start"],
	ie: ["-inset-inline-end"],
	block: ["-inset-block-start", "-inset-block-end"],
	inline: ["-inset-inline-start", "-inset-inline-end"]
};
const cornerMap = {
	"l": ["-top-left", "-bottom-left"],
	"r": ["-top-right", "-bottom-right"],
	"t": ["-top-left", "-top-right"],
	"b": ["-bottom-left", "-bottom-right"],
	"tl": ["-top-left"],
	"lt": ["-top-left"],
	"tr": ["-top-right"],
	"rt": ["-top-right"],
	"bl": ["-bottom-left"],
	"lb": ["-bottom-left"],
	"br": ["-bottom-right"],
	"rb": ["-bottom-right"],
	"": [""],
	"bs": ["-start-start", "-start-end"],
	"be": ["-end-start", "-end-end"],
	"s": ["-end-start", "-start-start"],
	"is": ["-end-start", "-start-start"],
	"e": ["-start-end", "-end-end"],
	"ie": ["-start-end", "-end-end"],
	"ss": ["-start-start"],
	"bs-is": ["-start-start"],
	"is-bs": ["-start-start"],
	"se": ["-start-end"],
	"bs-ie": ["-start-end"],
	"ie-bs": ["-start-end"],
	"es": ["-end-start"],
	"be-is": ["-end-start"],
	"is-be": ["-end-start"],
	"ee": ["-end-end"],
	"be-ie": ["-end-end"],
	"ie-be": ["-end-end"]
};
const xyzMap = {
	"x": ["-x"],
	"y": ["-y"],
	"z": ["-z"],
	"": ["-x", "-y"]
};
const xyzArray = [
	"x",
	"y",
	"z"
];
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
const positionMap = Object.assign({}, ...basePositionMap.map((p) => ({ [p.replace(/ /, "-")]: p })), ...basePositionMap.map((p) => ({ [p.replace(/\b(\w)\w+/g, "$1").replace(/ /, "")]: p })));
const globalKeywords = [
	"inherit",
	"initial",
	"revert",
	"revert-layer",
	"unset"
];
const cssMathFnRE = /^(calc|clamp|min|max)\s*\((.+)\)(.*)/;
const cssVarFnRE = /^(var)\s*\((.+)\)(.*)/;
//#endregion
//#region src/_utils/handlers/regex.ts
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
const splitComma = /,(?![^()]*\))/g;
//#endregion
//#region src/_utils/handlers/handlers.ts
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
//#endregion
//#region src/_utils/handlers/index.ts
const handler = createValueHandler(handlers_exports);
const h = handler;
//#endregion
//#region src/_utils/utilities.ts
const CONTROL_MINI_NO_NEGATIVE = "$$mini-no-negative";
/**
* Provide {@link DynamicMatcher} function returning spacing definition. See spacing rules.
*
* @param propertyPrefix - Property for the css value to be created. Postfix will be appended according to direction matched.
* @see {@link directionMap}
*/
function directionSize(propertyPrefix) {
	return ([_, direction, size], { theme }) => {
		const v = theme.spacing?.[size || "DEFAULT"] ?? h.bracket.cssvar.global.auto.fraction.rem(size);
		if (v != null) return directionMap[direction].map((i) => [`${propertyPrefix}${i}`, v]);
		else if (size?.startsWith("-")) {
			const v = theme.spacing?.[size.slice(1)];
			if (v != null) return directionMap[direction].map((i) => [`${propertyPrefix}${i}`, `calc(${v} * -1)`]);
		}
	};
}
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
/**
* Provide {@link DynamicMatcher} function to produce color value matched from rule.
*
* @see {@link parseColor}
*
* @example Resolving 'red' from theme:
* colorResolver('background-color', 'background')('', 'red')
* return { 'background-color': '#f12' }
*
* @example Resolving 'red-100' from theme:
* colorResolver('background-color', 'background')('', 'red-100')
* return { '--un-background-opacity': '1', 'background-color': 'rgb(254 226 226 / var(--un-background-opacity))' }
*
* @example Resolving 'red-100/20' from theme:
* colorResolver('background-color', 'background')('', 'red-100/20')
* return { 'background-color': 'rgb(204 251 241 / 0.22)' }
*
* @example Resolving 'hex-124':
* colorResolver('color', 'text')('', 'hex-124')
* return { '--un-text-opacity': '1', 'color': 'rgb(17 34 68 / var(--un-text-opacity))' }
*
* @param property - Property for the css value to be created.
* @param varName - Base name for the opacity variable.
* @param [key] - Theme key to select the color from.
* @param [shouldPass] - Function to decide whether to pass the css.
* @return object.
*/
function colorResolver(property, varName, key, shouldPass) {
	return ([, body], { theme, generator }) => {
		const data = parseColor(body ?? "", theme, key);
		if (!data) return;
		const { alpha, color, cssColor } = data;
		const rawColorComment = generator.config.envMode === "dev" && color ? ` /* ${color} */` : "";
		const css = {};
		if (cssColor) if (alpha != null) css[property] = colorToString(cssColor, alpha) + rawColorComment;
		else {
			const opacityVar = `--un-${varName}-opacity`;
			const result = colorToString(cssColor, `var(${opacityVar})`);
			if (result.includes(opacityVar)) css[opacityVar] = colorOpacityToString(cssColor);
			css[property] = result + rawColorComment;
		}
		else if (color) if (alpha != null) css[property] = colorToString(color, alpha) + rawColorComment;
		else {
			const opacityVar = `--un-${varName}-opacity`;
			const result = colorToString(color, `var(${opacityVar})`);
			if (result.includes(opacityVar)) css[opacityVar] = 1;
			css[property] = result + rawColorComment;
		}
		if (shouldPass?.(css) !== false) return css;
	};
}
function colorableShadows(shadows, colorVar) {
	const colored = [];
	shadows = toArray(shadows);
	for (let i = 0; i < shadows.length; i++) {
		const components = getStringComponents(shadows[i], " ", 6);
		if (!components || components.length < 3) return shadows;
		let isInset = false;
		const pos = components.indexOf("inset");
		if (pos !== -1) {
			components.splice(pos, 1);
			isInset = true;
		}
		let colorVarValue = "";
		const lastComp = components.at(-1);
		if (parseCssColor(components.at(0))) {
			const color = parseCssColor(components.shift());
			if (color) colorVarValue = `, ${colorToString(color)}`;
		} else if (parseCssColor(lastComp)) {
			const color = parseCssColor(components.pop());
			if (color) colorVarValue = `, ${colorToString(color)}`;
		} else if (lastComp && lastComp.startsWith("var(")) colorVarValue = `, ${components.pop()}`;
		colored.push(`${isInset ? "inset " : ""}${components.join(" ")} var(${colorVar}${colorVarValue})`);
	}
	return colored;
}
function hasParseableColor(color, theme, key) {
	return color != null && !!parseColor(color, theme, key)?.color;
}
const reLetters = /[a-z]+/gi;
const resolvedBreakpoints = /* @__PURE__ */ new WeakMap();
function resolveBreakpoints({ theme, generator }, key = "breakpoints") {
	const breakpoints = (generator?.userConfig?.theme)?.[key] || theme[key];
	if (!breakpoints) return void 0;
	if (resolvedBreakpoints.has(theme)) return resolvedBreakpoints.get(theme);
	const resolved = Object.entries(breakpoints).sort((a, b) => Number.parseInt(a[1].replace(reLetters, "")) - Number.parseInt(b[1].replace(reLetters, ""))).map(([point, size]) => ({
		point,
		size
	}));
	resolvedBreakpoints.set(theme, resolved);
	return resolved;
}
function resolveVerticalBreakpoints(context) {
	return resolveBreakpoints(context, "verticalBreakpoints");
}
function makeGlobalStaticRules(prefix, property) {
	return globalKeywords.map((keyword) => [`${prefix}-${keyword}`, { [property ?? prefix]: keyword }]);
}
function isCSSMathFn(value) {
	return value != null && cssMathFnRE.test(value);
}
function isSize(str) {
	if (str[0] === "[" && str.slice(-1) === "]") str = str.slice(1, -1);
	return cssMathFnRE.test(str) || numberWithUnitRE.test(str);
}
function transformXYZ(d, v, name) {
	const values = v.split(splitComma);
	if (d || !d && values.length === 1) return xyzMap[d].map((i) => [`--un-${name}${i}`, v]);
	return values.map((v, i) => [`--un-${name}-${xyzArray[i]}`, v]);
}
//#endregion
//#region src/_utils/index.ts
var _utils_exports = /* @__PURE__ */ __exportAll({
	CONTROL_MINI_NO_NEGATIVE: () => CONTROL_MINI_NO_NEGATIVE,
	colorResolver: () => colorResolver,
	colorableShadows: () => colorableShadows,
	cornerMap: () => cornerMap,
	cssMathFnRE: () => cssMathFnRE,
	cssVarFnRE: () => cssVarFnRE,
	directionMap: () => directionMap,
	directionSize: () => directionSize,
	globalKeywords: () => globalKeywords,
	h: () => h,
	handler: () => handler,
	hasParseableColor: () => hasParseableColor,
	insetMap: () => insetMap,
	isCSSMathFn: () => isCSSMathFn,
	isSize: () => isSize,
	makeGlobalStaticRules: () => makeGlobalStaticRules,
	parseColor: () => parseColor,
	positionMap: () => positionMap,
	resolveBreakpoints: () => resolveBreakpoints,
	resolveVerticalBreakpoints: () => resolveVerticalBreakpoints,
	splitShorthand: () => splitShorthand,
	transformXYZ: () => transformXYZ,
	valueHandlers: () => handlers_exports,
	xyzArray: () => xyzArray,
	xyzMap: () => xyzMap
});
import * as import__unocss_rule_utils from "@unocss/rule-utils";
__reExport(_utils_exports, import__unocss_rule_utils);
//#endregion
//#region src/utils.ts
var utils_exports = /* @__PURE__ */ __exportAll({
	CONTROL_MINI_NO_NEGATIVE: () => CONTROL_MINI_NO_NEGATIVE,
	colorResolver: () => colorResolver,
	colorableShadows: () => colorableShadows,
	cornerMap: () => cornerMap,
	cssMathFnRE: () => cssMathFnRE,
	cssVarFnRE: () => cssVarFnRE,
	directionMap: () => directionMap,
	directionSize: () => directionSize,
	globalKeywords: () => globalKeywords,
	h: () => h,
	handler: () => handler,
	hasParseableColor: () => hasParseableColor,
	insetMap: () => insetMap,
	isCSSMathFn: () => isCSSMathFn,
	isSize: () => isSize,
	makeGlobalStaticRules: () => makeGlobalStaticRules,
	parseColor: () => parseColor,
	positionMap: () => positionMap,
	resolveBreakpoints: () => resolveBreakpoints,
	resolveVerticalBreakpoints: () => resolveVerticalBreakpoints,
	splitShorthand: () => splitShorthand,
	transformXYZ: () => transformXYZ,
	valueHandlers: () => handlers_exports,
	xyzArray: () => xyzArray,
	xyzMap: () => xyzMap
});
__reExport(utils_exports, _utils_exports);
//#endregion
export { globalKeywords as C, xyzMap as D, xyzArray as E, directionMap as S, positionMap as T, handler as _, colorableShadows as a, cssMathFnRE as b, isCSSMathFn as c, parseColor as d, resolveBreakpoints as f, h as g, transformXYZ as h, colorResolver as i, isSize as l, splitShorthand as m, _utils_exports as n, directionSize as o, resolveVerticalBreakpoints as p, CONTROL_MINI_NO_NEGATIVE as r, hasParseableColor as s, utils_exports as t, makeGlobalStaticRules as u, handlers_exports as v, insetMap as w, cssVarFnRE as x, cornerMap as y };
