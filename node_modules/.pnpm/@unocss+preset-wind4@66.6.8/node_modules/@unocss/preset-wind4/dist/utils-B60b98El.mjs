import { t as __exportAll } from "./chunk-D1SwGrFN.mjs";
import { escapeSelector, symbols, toArray } from "@unocss/core";
import { colorToString, createValueHandler, getStringComponent, getStringComponents, isInterpolatedMethod, parseCssColor, transformThemeFn } from "@unocss/rule-utils";
//#region src/utils/constant.ts
const PRESET_NAME = "@unocss/preset-wind4";
const CONTROL_NO_NEGATIVE = "$$mini-no-negative";
const SpecialColorKey = {
	transparent: "transparent",
	current: "currentColor",
	inherit: "inherit"
};
//#endregion
//#region src/utils/mappings.ts
const directionMap = {
	"l": ["-left"],
	"r": ["-right"],
	"t": ["-top"],
	"b": ["-bottom"],
	"s": ["-inline-start"],
	"e": ["-inline-end"],
	"x": ["-inline"],
	"y": ["-block"],
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
	x: ["-inset-inline"],
	y: ["-inset-block"],
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
//#region src/utils/handlers/regex.ts
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
const bracketTypeRe = /^\[(color|image|length|size|position|quoted|string|number|family):/i;
const splitComma = /,(?![^()]*\))/g;
const remRE = /(-?[.\d]+)rem/g;
const cssVarsRE = /(?<!var\()--([\w.-]+)(\([^)]+\)|,[#.\s\w]+)?/g;
//#endregion
//#region src/utils/handlers/handlers.ts
var handlers_exports = /* @__PURE__ */ __exportAll({
	auto: () => auto,
	bracket: () => bracket,
	bracketOfColor: () => bracketOfColor,
	bracketOfFamily: () => bracketOfFamily,
	bracketOfLength: () => bracketOfLength,
	bracketOfNumber: () => bracketOfNumber,
	bracketOfPosition: () => bracketOfPosition,
	cssvar: () => cssvar,
	degree: () => degree,
	fraction: () => fraction,
	global: () => global,
	none: () => none,
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
	const num = number(str);
	if (num != null) return `${num}%`;
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
/**
* Process a theme variable reference and retrieve its value and corresponding CSS variable key.
*
* @example theme => Theme object
* @example themeKey => 'colors
* @example themeKeyPaths => ['blue', '500']
* @example varPaths => 'colors.blue.500'
*
* @returns An object containing the resolved value from the theme and the corresponding CSS variable key.
*/
function processThemeVariable(theme, themeKey, themeKeyPaths, varPaths) {
	const valOrObj = getThemeByKey(theme, themeKey, themeKeyPaths);
	const hasDefault = typeof valOrObj === "object" && "DEFAULT" in valOrObj;
	if (hasDefault) themeKeyPaths.push("DEFAULT");
	const val = hasDefault ? valOrObj.DEFAULT : valOrObj;
	const varKey = hasDefault && themeKey !== "spacing" ? `${varPaths}.DEFAULT` : varPaths;
	if (val != null) themeTracking(themeKey, themeKeyPaths.length ? themeKeyPaths : void 0);
	return {
		val,
		varKey
	};
}
function bracketWithType(str, requiredType, theme) {
	if (str && str.startsWith("[") && str.endsWith("]")) {
		let base;
		let hintedType;
		const match = str.match(bracketTypeRe);
		if (!match) base = str.slice(1, -1);
		else {
			if (!requiredType) hintedType = match[1];
			else if (match[1] !== requiredType) return;
			base = str.slice(match[0].length, -1);
		}
		if (!base) return;
		if (base === "=\"\"") return;
		if (theme) base = transformThemeFn(base, theme);
		const matches = Array.from(base.matchAll(cssVarsRE));
		for (const match of matches) {
			const [full, varPaths, _value] = match;
			if (theme) {
				const [key, ...paths] = varPaths.split(".");
				const { val, varKey } = processThemeVariable(theme, key, paths, varPaths);
				if (val != null) {
					const cssVar = `--${varKey.replaceAll(".", "-")}`;
					if (_value && !_value.startsWith(",")) base = base.replace(full, `calc(var(${cssVar}) * ${_value.slice(1, -1)})`);
					else {
						const fallback = _value?.slice(1);
						base = base.replace(full, `var(${cssVar}${fallback ? `, ${fallback}` : ""})`);
					}
					continue;
				}
			}
			base = base.replace(full, `var(${full})`);
		}
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
function bracket(str, theme) {
	return bracketWithType(str, void 0, theme);
}
function bracketOfColor(str, theme) {
	return bracketWithType(str, "color", theme);
}
function bracketOfLength(str, theme) {
	return bracketWithType(str, "length", theme) || bracketWithType(str, "size", theme);
}
function bracketOfPosition(str, theme) {
	return bracketWithType(str, "position", theme);
}
function bracketOfFamily(str, theme) {
	return bracketWithType(str, "family", theme);
}
function bracketOfNumber(str, theme) {
	return bracketWithType(str, "number", theme);
}
function cssvar(str) {
	if (str.startsWith("var(")) return str;
	const match = str.match(/^(?:\$|--)([^\s'"`;{}]+)$/);
	if (match) {
		const [name, defaultValue] = match[1].split(",");
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
function none(str) {
	if (str === "none") return "none";
}
//#endregion
//#region src/utils/handlers/index.ts
const handler = createValueHandler(handlers_exports);
const h = handler;
//#endregion
//#region src/utils/utilities.ts
function numberResolver(size, defaultValue) {
	const v = h.number(size) ?? defaultValue;
	if (v != null) {
		let num = Number(v);
		if (String(v).endsWith("%")) num = Number(String(v).slice(0, -1)) / 100;
		return num;
	}
}
/**
* Returns a {@link DynamicMatcher} that generates spacing CSS properties for directional utilities.
*
* @param property - The base CSS property name (e.g. 'margin', 'padding').
* @param map - Optional mapping of direction keys to property postfixes. Defaults to {@link directionMap}.
* @param formatter - Optional function to format the final property name. Defaults to `(p, d) => \`\${p}\${d}\``.
*/
function directionSize(property, map = directionMap, formatter = (p, d) => `${p}${d}`) {
	return (([_, direction, size = "4"], { theme }) => {
		if (size != null && direction != null) {
			let v;
			const isNegative = size.startsWith("-");
			if (isNegative) size = size.slice(1);
			v = numberResolver(size);
			if (v != null && !Number.isNaN(v)) {
				themeTracking("spacing");
				return map[direction].map((i) => [formatter(property, i), `calc(var(--spacing) * ${isNegative ? "-" : ""}${v})`]);
			} else if (theme.spacing && size in theme.spacing) {
				themeTracking("spacing", size);
				return map[direction].map((i) => [formatter(property, i), isNegative ? `calc(var(--${escapeSelector(`spacing-${size}`)}) * -1)` : `var(--${escapeSelector(`spacing-${size}`)})`]);
			}
			v = h.bracket.cssvar.global.auto.fraction.rem(isNegative ? `-${size}` : size, theme);
			if (v != null) return map[direction].map((i) => [formatter(property, i), v]);
		}
	});
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
* '[rgb(100 2 3)]/[var(--op)]/[in_oklab]' // Bracket with rgb color, bracket with opacity and bracket with interpolation method
*
* @param body - Color string to be parsed.
* @param theme - {@link Theme} object.
* @return object if string is parseable.
*/
function parseColor(body, theme) {
	let split;
	const [front, ...rest] = getStringComponents(body, ["/", ":"], 3) ?? [];
	if (front != null) {
		const match = (front.match(bracketTypeRe) ?? [])[1];
		if (match == null || match === "color") split = [front, ...rest];
	}
	if (!split) return;
	let opacity;
	let [main, opacityOrModifier, modifier] = split;
	if (isInterpolatedMethod(opacityOrModifier) || isInterpolatedMethod(h.bracket(opacityOrModifier ?? ""))) modifier = opacityOrModifier;
	else opacity = opacityOrModifier;
	const colors = main.replace(/([a-z])(\d)(?![-_a-z])/g, "$1-$2").split(/-/g);
	const [name] = colors;
	if (!name) return;
	let parsed = parseThemeColor(theme, colors);
	if (!parsed && colors.length >= 2) {
		const last = colors.at(-1);
		const secondLast = colors.at(-2);
		if (/^\d+$/.test(last)) parsed = parseThemeColor(theme, colors.slice(0, -2).concat([`${secondLast}${last}`]));
	}
	let { no, keys, color } = parsed ?? {};
	if (!color) {
		const bracket = h.bracketOfColor(main, theme);
		const bracketOrMain = bracket || main;
		if (h.numberWithUnit(bracketOrMain)) return;
		if (/^#[\da-f]+$/i.test(bracketOrMain)) color = bracketOrMain;
		else if (/^hex-[\da-fA-F]+$/.test(bracketOrMain)) color = `#${bracketOrMain.slice(4)}`;
		else if (main.startsWith("$")) color = h.cssvar(main);
		color = color || bracket;
	}
	return {
		opacity,
		modifier: modifier && h.bracket.cssvar(modifier) || modifier,
		name,
		no,
		color: color ?? SpecialColorKey[name],
		alpha: h.bracket.cssvar.percent(opacity ?? ""),
		keys,
		get cssColor() {
			return parseCssColor(this.color);
		}
	};
}
function parseThemeColor(theme, keys) {
	let color;
	let no;
	let key;
	const colorData = getThemeByKey(theme, "colors", keys);
	if (typeof colorData === "object") {
		if ("DEFAULT" in colorData) {
			color = colorData.DEFAULT;
			no = "DEFAULT";
			key = [...keys, no];
		}
	} else if (typeof colorData === "string") {
		color = colorData;
		key = keys;
		no = keys.at(-1);
	}
	if (!color) return;
	return {
		color,
		no,
		keys: key
	};
}
function getThemeByKey(theme, themeKey, keys) {
	const obj = theme[themeKey];
	function deepGet(current, path) {
		if (path.length === 0) return current;
		if (!current || typeof current !== "object") return void 0;
		for (let i = path.length; i > 0; i--) {
			const flatKey = path.slice(0, i).join("-");
			if (flatKey in current) {
				const v = current[flatKey];
				if (i === path.length) return v;
				return deepGet(v, path.slice(i));
			}
		}
	}
	return deepGet(obj, keys);
}
function colorCSSGenerator(data, property, varName, ctx) {
	if (!data) return;
	const { color, keys, alpha, modifier } = data;
	const rawColorComment = ctx?.generator.config.envMode === "dev" && color ? ` /* ${color} */` : "";
	const css = {};
	if (color) {
		const result = [css];
		const isCSSVar = color.includes("var(");
		const isSpecial = Object.values(SpecialColorKey).includes(color);
		if (isSpecial && !alpha) {
			css[property] = color;
			return result;
		}
		const alphaKey = `--un-${varName}-opacity`;
		const value = keys && !isCSSVar && !isSpecial ? generateThemeVariable("colors", keys) : color;
		let method = modifier ?? (keys ? "in srgb" : "in oklab");
		if (!method.startsWith("in ") && !method.startsWith("var(")) method = `in ${method}`;
		css[property] = `color-mix(${method}, ${value} ${alpha ?? `var(${alphaKey})`}, transparent)${rawColorComment}`;
		result.push(defineProperty(alphaKey, {
			syntax: "<percentage>",
			initialValue: "100%"
		}));
		if (!isSpecial) {
			if (keys && !isCSSVar) {
				themeTracking(`colors`, keys);
				if (!modifier) {
					const colorValue = [
						"shadow",
						"inset-shadow",
						"text-shadow",
						"drop-shadow"
					].includes(varName) ? `${alpha ? `color-mix(in oklab, ${value} ${alpha}, transparent)` : `${value}`} var(${alphaKey})` : `${value} ${alpha ?? `var(${alphaKey})`}`;
					result.push({
						[symbols.parent]: "@supports (color: color-mix(in lab, red, red))",
						[symbols.noMerge]: true,
						[property]: `color-mix(in oklab, ${colorValue}, transparent)${rawColorComment}`
					});
				}
			}
			if (ctx?.theme) detectThemeValue(color, ctx.theme);
		}
		return result;
	}
}
function colorResolver(property, varName) {
	return ([, body], ctx) => {
		const data = parseColor(body ?? "", ctx.theme);
		if (!data) return;
		return colorCSSGenerator(data, property, varName, ctx);
	};
}
function colorableShadows(shadows, colorVar, alpha) {
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
			if (color) colorVarValue = colorToString(color);
		} else if (parseCssColor(lastComp)) {
			const color = parseCssColor(components.pop());
			if (color) colorVarValue = colorToString(color);
		} else if (lastComp && lastComp.startsWith("var(")) {
			const color = components.pop();
			if (color) colorVarValue = color;
		}
		colored.push(`${isInset ? "inset " : ""}${components.join(" ")} var(${colorVar}, ${alpha ? `oklab(from ${colorVarValue} l a b / ${alpha})` : colorVarValue})`);
	}
	return colored;
}
function hasParseableColor(color, theme) {
	return color != null && !!parseColor(color, theme)?.color;
}
const reLetters = /[a-z]+/gi;
const resolvedBreakpoints = /* @__PURE__ */ new WeakMap();
function resolveBreakpoints({ theme, generator }, key = "breakpoint") {
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
	return resolveBreakpoints(context, "verticalBreakpoint");
}
function makeGlobalStaticRules(prefix, property) {
	return globalKeywords.map((keyword) => [`${prefix}-${keyword}`, { [property ?? prefix]: keyword }]);
}
function defineProperty(property, options = {}) {
	const { syntax = "*", inherits = false, initialValue } = options;
	const value = {
		[symbols.shortcutsNoMerge]: true,
		[symbols.noMerge]: true,
		[symbols.noScope]: true,
		[symbols.variants]: () => [{
			parent: "",
			layer: "properties",
			selector: () => `@property ${property}`
		}],
		syntax: JSON.stringify(syntax),
		inherits: inherits ? "true" : "false"
	};
	if (initialValue != null) value["initial-value"] = initialValue;
	propertyTracking(property, initialValue ? String(initialValue) : "initial");
	return value;
}
function isCSSMathFn(value) {
	return value != null && cssMathFnRE.test(value);
}
function isSize(str) {
	if (str[0] === "[" && str.slice(-1) === "]") str = str.slice(1, -1);
	return cssMathFnRE.test(str) || numberWithUnitRE.test(str);
}
function camelize(str) {
	return str.replace(/-(\w)/g, (_, c) => c ? c.toUpperCase() : "");
}
function hyphenate(str) {
	return str.replace(/(?:^|\B)([A-Z])/g, "-$1").toLowerCase();
}
function compressCSS(css, isDev = false) {
	if (isDev) return css.trim();
	return css.trim().replace(/\s+/g, " ").replace(/\/\*[\s\S]*?\*\//g, "");
}
//#endregion
//#region src/utils/track.ts
/**
* Used to track theme keys.
*
* eg: colors:red-100
*
* @internal
*/
const trackedTheme = /* @__PURE__ */ new Set([]);
function themeTracking(key, props = "DEFAULT") {
	const k = `${key}:${toArray(props).join("-")}`;
	if (!trackedTheme.has(k)) trackedTheme.add(k);
}
function generateThemeVariable(key, props) {
	return `var(--${key}-${toArray(props).join("-")})`;
}
function detectThemeValue(value, theme) {
	if (value.startsWith("var(")) {
		const variable = value.match(/var\(--([\w-]+)(?:,.*)?\)/)?.[1];
		if (variable) {
			const [key, ...path] = variable.split("-");
			const themeValue = getThemeByKey(theme, key, path);
			if (typeof themeValue === "string") {
				themeTracking(key, path);
				detectThemeValue(themeValue, theme);
			}
		}
	}
}
const trackedProperties = /* @__PURE__ */ new Map();
function propertyTracking(property, value) {
	if (!trackedProperties.has(property)) trackedProperties.set(property, value);
}
//#endregion
//#region src/utils/unit-resolver.ts
function createRemToPxProcessor(base = 16) {
	function resolver(utility) {
		if (typeof utility[1] === "string" && remRE.test(utility[1])) utility[1] = utility[1].replace(remRE, (_, p1) => `${p1 * base}px`);
	}
	return (utilObjectOrEntry) => {
		if (Array.isArray(utilObjectOrEntry)) resolver(utilObjectOrEntry);
		else utilObjectOrEntry.entries.forEach(resolver);
	};
}
//#endregion
export { bracketTypeRe as A, xyzMap as B, parseThemeColor as C, h as D, splitShorthand as E, directionMap as F, PRESET_NAME as H, globalKeywords as I, insetMap as L, cornerMap as M, cssMathFnRE as N, handler as O, cssVarFnRE as P, positionMap as R, parseColor as S, resolveVerticalBreakpoints as T, SpecialColorKey as U, CONTROL_NO_NEGATIVE as V, hyphenate as _, themeTracking as a, makeGlobalStaticRules as b, camelize as c, colorableShadows as d, compressCSS as f, hasParseableColor as g, getThemeByKey as h, propertyTracking as i, splitComma as j, handlers_exports as k, colorCSSGenerator as l, directionSize as m, detectThemeValue as n, trackedProperties as o, defineProperty as p, generateThemeVariable as r, trackedTheme as s, createRemToPxProcessor as t, colorResolver as u, isCSSMathFn as v, resolveBreakpoints as w, numberResolver as x, isSize as y, xyzArray as z };
