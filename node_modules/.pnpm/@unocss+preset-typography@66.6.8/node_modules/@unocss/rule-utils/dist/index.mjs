import { escapeRegExp, escapeSelector, isString, toArray } from "@unocss/core";
import MagicString from "magic-string";
//#region src/utilities.ts
function getBracket(str, open, close) {
	if (str === "") return;
	const l = str.length;
	let parenthesis = 0;
	let opened = false;
	let openAt = 0;
	for (let i = 0; i < l; i++) switch (str[i]) {
		case open:
			if (!opened) {
				opened = true;
				openAt = i;
			}
			parenthesis++;
			break;
		case close:
			--parenthesis;
			if (parenthesis < 0) return;
			if (parenthesis === 0) return [
				str.slice(openAt, i + 1),
				str.slice(i + 1),
				str.slice(0, openAt)
			];
			break;
	}
}
function getStringComponent(str, open, close, separators) {
	if (str === "") return;
	if (isString(separators)) separators = [separators];
	if (separators.length === 0) return;
	const l = str.length;
	let parenthesis = 0;
	for (let i = 0; i < l; i++) switch (str[i]) {
		case open:
			parenthesis++;
			break;
		case close:
			if (--parenthesis < 0) return;
			break;
		default: for (const separator of separators) {
			const separatorLength = separator.length;
			if (separatorLength && separator === str.slice(i, i + separatorLength) && parenthesis === 0) {
				if (i === 0 || i === l - separatorLength) return;
				return [str.slice(0, i), str.slice(i + separatorLength)];
			}
		}
	}
	return [str, ""];
}
function getStringComponents(str, separators, limit, open = "(", close = ")") {
	limit = limit ?? 10;
	const components = [];
	let i = 0;
	while (str !== "") {
		if (++i > limit) return;
		const componentPair = getStringComponent(str, open, close, separators);
		if (!componentPair) return;
		const [component, rest] = componentPair;
		components.push(component);
		str = rest;
	}
	if (components.length > 0) return components;
}
//#endregion
//#region src/colors.ts
const cssColorFunctions = [
	"hsl",
	"hsla",
	"hwb",
	"lab",
	"lch",
	"oklab",
	"oklch",
	"rgb",
	"rgba"
];
const rectangularColorSpace = [
	"srgb",
	"srgb-linear",
	"display-p3",
	"a98-rgb",
	"prophoto-rgb",
	"rec2020",
	"lab",
	"oklab",
	"xyz",
	"xyz-d50",
	"xyz-d65"
];
const polarColorSpace = [
	"hsl",
	"hwb",
	"lch",
	"oklch"
];
const hueInterpolationMethods = [
	"shorter",
	"longer",
	"increasing",
	"decreasing"
];
const alphaPlaceholders = ["%alpha", "<alpha-value>"];
const alphaPlaceholdersRE = new RegExp(alphaPlaceholders.map((v) => escapeRegExp(v)).join("|"), "g");
function isInterpolatedMethod(type) {
	if (!type) return false;
	return rectangularColorSpace.some((space) => type.includes(space)) || polarColorSpace.some((space) => type.includes(space)) || hueInterpolationMethods.some((method) => type.includes(method));
}
function hex2rgba(hex = "") {
	const color = parseHexColor(hex);
	if (color != null) {
		const { components, alpha } = color;
		if (alpha == null) return components;
		return [...components, alpha];
	}
}
function parseCssColor(str = "") {
	const color = parseColor(str);
	if (color == null || color === false) return;
	const { type: casedType, components, alpha } = color;
	const type = casedType.toLowerCase();
	if (components.length === 0) return;
	if (cssColorFunctions.includes(type) && ![1, 3].includes(components.length)) return;
	return {
		type,
		components: components.map((c) => typeof c === "string" ? c.trim() : c),
		alpha: typeof alpha === "string" ? alpha.trim() : alpha
	};
}
function colorOpacityToString(color) {
	const alpha = color.alpha ?? 1;
	return typeof alpha === "string" && alphaPlaceholders.includes(alpha) ? 1 : alpha;
}
function colorToString(color, alphaOverride) {
	if (typeof color === "string") return color.replace(alphaPlaceholdersRE, `${alphaOverride ?? 1}`);
	const { components } = color;
	let { alpha, type } = color;
	alpha = alphaOverride ?? alpha;
	type = type.toLowerCase();
	if (["hsla", "rgba"].includes(type)) return `${type}(${components.join(", ")}${alpha == null ? "" : `, ${alpha}`})`;
	alpha = alpha == null ? "" : ` / ${alpha}`;
	if (cssColorFunctions.includes(type)) return `${type}(${components.join(" ")}${alpha})`;
	return `color(${type} ${components.join(" ")}${alpha})`;
}
function parseColor(str) {
	if (!str) return;
	let color = parseHexColor(str);
	if (color != null) return color;
	color = cssColorKeyword(str);
	if (color != null) return color;
	color = parseCssCommaColorFunction(str);
	if (color != null) return color;
	color = parseCssSpaceColorFunction(str);
	if (color != null) return color;
	color = parseCssColorFunction(str);
	if (color != null) return color;
}
function parseHexColor(str) {
	const [, body] = str.match(/^#([\da-f]+)$/i) || [];
	if (!body) return;
	switch (body.length) {
		case 3:
		case 4: {
			const digits = Array.from(body, (s) => Number.parseInt(s, 16)).map((n) => n << 4 | n);
			return {
				type: "rgb",
				components: digits.slice(0, 3),
				alpha: body.length === 3 ? void 0 : Math.round(digits[3] / 255 * 100) / 100
			};
		}
		case 6:
		case 8: {
			const value = Number.parseInt(body, 16);
			return {
				type: "rgb",
				components: body.length === 6 ? [
					value >> 16 & 255,
					value >> 8 & 255,
					value & 255
				] : [
					value >> 24 & 255,
					value >> 16 & 255,
					value >> 8 & 255
				],
				alpha: body.length === 6 ? void 0 : Math.round((value & 255) / 255 * 100) / 100
			};
		}
	}
}
function cssColorKeyword(str) {
	const color = { rebeccapurple: [
		102,
		51,
		153,
		1
	] }[str];
	if (color != null) return {
		type: "rgb",
		components: color.slice(0, 3),
		alpha: color[3]
	};
}
function parseCssCommaColorFunction(color) {
	const match = color.match(/^(rgb|rgba|hsl|hsla)\((.+)\)$/i);
	if (!match) return;
	const [, type, componentString] = match;
	const components = getStringComponents(componentString, ",", 5);
	if (components) {
		if ([3, 4].includes(components.length)) return {
			type,
			components: components.slice(0, 3),
			alpha: components[3]
		};
		else if (components.length !== 1) return false;
	}
}
const cssColorFunctionsRe = new RegExp(`^(${cssColorFunctions.join("|")})\\((.+)\\)$`, "i");
function parseCssSpaceColorFunction(color) {
	const match = color.match(cssColorFunctionsRe);
	if (!match) return;
	const [, fn, componentString] = match;
	const parsed = parseCssSpaceColorValues(`${fn} ${componentString}`);
	if (parsed) {
		const { alpha, components: [type, ...components] } = parsed;
		return {
			type,
			components,
			alpha
		};
	}
}
function parseCssColorFunction(color) {
	const match = color.match(/^color\((.+)\)$/);
	if (!match) return;
	const parsed = parseCssSpaceColorValues(match[1]);
	if (parsed) {
		const { alpha, components: [type, ...components] } = parsed;
		return {
			type,
			components,
			alpha
		};
	}
}
function parseCssSpaceColorValues(componentString) {
	const components = getStringComponents(componentString, " ");
	if (!components) return;
	let totalComponents = components.length;
	if (components[totalComponents - 2] === "/") return {
		components: components.slice(0, totalComponents - 2),
		alpha: components[totalComponents - 1]
	};
	if (components[totalComponents - 2] != null && (components[totalComponents - 2].endsWith("/") || components[totalComponents - 1].startsWith("/"))) {
		const removed = components.splice(totalComponents - 2);
		components.push(removed.join(" "));
		--totalComponents;
	}
	const withAlpha = getStringComponents(components[totalComponents - 1], "/", 2);
	if (!withAlpha) return;
	if (withAlpha.length === 1 || withAlpha[withAlpha.length - 1] === "") return { components };
	const alpha = withAlpha.pop();
	components[totalComponents - 1] = withAlpha.join("/");
	return {
		components,
		alpha
	};
}
//#endregion
//#region src/directive.ts
const themeFnRE = /theme\(\s*(['"])?(.*?)\1?\s*\)/g;
function hasThemeFn(str) {
	return str.includes("theme(") && str.includes(")");
}
function transformThemeFn(code, theme, throwOnMissing = true) {
	const matches = Array.from(code.toString().matchAll(themeFnRE));
	if (!matches.length) return code;
	const s = new MagicString(code);
	for (const match of matches) {
		const rawArg = match[2];
		if (!rawArg) throw new Error("theme() expect exact one argument, but got 0");
		const value = transformThemeString(rawArg, theme, throwOnMissing);
		if (value) s.overwrite(match.index, match.index + match[0].length, value);
	}
	return s.toString();
}
function transformThemeString(code, theme, throwOnMissing = true) {
	const [rawKey, alpha] = code.split("/");
	let value = rawKey.trim().split(".").reduce((t, k) => t === null || t === void 0 ? void 0 : t[k], theme);
	if (typeof value === "object") value = value.DEFAULT;
	if (typeof value === "string") {
		if (alpha) {
			const color = parseCssColor(value);
			if (color) value = colorToString(color, alpha);
		}
		return value;
	} else if (throwOnMissing) throw new Error(`theme of "${code}" did not found`);
}
function calcMaxWidthBySize(size) {
	var _size$match;
	const value = ((_size$match = size.match(/^-?\d+\.?\d*/)) === null || _size$match === void 0 ? void 0 : _size$match[0]) || "";
	const unit = size.slice(value.length);
	if (unit === "px") {
		const maxWidth = Number.parseFloat(value) - .1;
		return Number.isNaN(maxWidth) ? size : `${maxWidth}${unit}`;
	}
	return `calc(${size} - 0.1px)`;
}
//#endregion
//#region src/handlers.ts
function createValueHandler(handlers) {
	const handler = function(str, theme) {
		var _this$__options;
		const s = ((_this$__options = this.__options) === null || _this$__options === void 0 ? void 0 : _this$__options.sequence) || [];
		this.__options.sequence = [];
		for (const n of s) {
			const res = handlers[n](str, theme);
			if (res != null) return res;
		}
	};
	function addProcessor(that, name) {
		if (!that.__options) that.__options = { sequence: [] };
		that.__options.sequence.push(name);
		return that;
	}
	for (const name of Object.keys(handlers)) Object.defineProperty(handler, name, {
		enumerable: true,
		configurable: true,
		get() {
			return addProcessor(this, name);
		}
	});
	return handler;
}
//#endregion
//#region src/icon.ts
const iconFnRE = /icon\(\s*(['"])?(.*?)\1?\s*\)/g;
function hasIconFn(str) {
	return str.includes("icon(") && str.includes(")");
}
//#endregion
//#region src/pseudo.ts
const PseudoPlaceholder = "__pseudo_placeholder__";
/**
* Note: the order of following pseudo classes will affect the order of generated css.
*
* Reference: https://github.com/tailwindlabs/tailwindcss/blob/main/src/corePlugins.js#L83
*/
const PseudoClasses = Object.fromEntries([
	["first-letter", "::first-letter"],
	["first-line", "::first-line"],
	"any-link",
	"link",
	"visited",
	"target",
	["open", "[open]"],
	"default",
	"checked",
	"indeterminate",
	"placeholder-shown",
	"autofill",
	"optional",
	"required",
	"valid",
	"invalid",
	"user-valid",
	"user-invalid",
	"in-range",
	"out-of-range",
	"read-only",
	"read-write",
	"empty",
	"focus-within",
	"hover",
	"focus",
	"focus-visible",
	"active",
	"enabled",
	"disabled",
	"popover-open",
	"root",
	"empty",
	["even-of-type", ":nth-of-type(even)"],
	["even", ":nth-child(even)"],
	["odd-of-type", ":nth-of-type(odd)"],
	["odd", ":nth-child(odd)"],
	["nth", `:nth-child(${PseudoPlaceholder})`],
	["nth-last", `:nth-last-child(${PseudoPlaceholder})`],
	["nth-last-of-type", `:nth-last-of-type(${PseudoPlaceholder})`],
	["nth-of-type", `:nth-of-type(${PseudoPlaceholder})`],
	"first-of-type",
	["first", ":first-child"],
	"last-of-type",
	["last", ":last-child"],
	"only-child",
	"only-of-type",
	["backdrop-element", "::backdrop"],
	["placeholder", "::placeholder"],
	["before", "::before"],
	["after", "::after"],
	["file", "::file-selector-button"],
	["details-content", "::details-content"]
].map((key) => Array.isArray(key) ? key : [key, `:${key}`]));
const PseudoClassesKeys = Object.keys(PseudoClasses);
const PseudoClassesColon = Object.fromEntries([["backdrop", "::backdrop"]].map((key) => Array.isArray(key) ? key : [key, `:${key}`]));
const PseudoClassesColonKeys = Object.keys(PseudoClassesColon);
const PseudoClassFunctions = [
	"not",
	"is",
	"where",
	"has"
];
const PseudoClassesMulti = Object.fromEntries([["selection", ["::selection", " *::selection"]], ["marker", ["::marker", " *::marker"]]]);
const PseudoClassesStr = Object.entries(PseudoClasses).filter(([, pseudo]) => !pseudo.startsWith("::")).map(([key]) => key).sort((a, b) => b.length - a.length).join("|");
const PseudoClassesColonStr = Object.entries(PseudoClassesColon).filter(([, pseudo]) => !pseudo.startsWith("::")).map(([key]) => key).sort((a, b) => b.length - a.length).join("|");
const PseudoClassFunctionsStr = PseudoClassFunctions.join("|");
const PseudoClassesMultiStr = Object.keys(PseudoClassesMulti).sort((a, b) => b.length - a.length).join("|");
const excludedPseudo = [
	"::-webkit-resizer",
	"::-webkit-scrollbar",
	"::-webkit-scrollbar-button",
	"::-webkit-scrollbar-corner",
	"::-webkit-scrollbar-thumb",
	"::-webkit-scrollbar-track",
	"::-webkit-scrollbar-track-piece",
	"::file-selector-button"
];
const PseudoClassesAndElementsStr = Object.entries(PseudoClasses).map(([key]) => key).sort((a, b) => b.length - a.length).join("|");
const PseudoClassesAndElementsColonStr = Object.entries(PseudoClassesColon).map(([key]) => key).sort((a, b) => b.length - a.length).join("|");
function createTaggedPseudoClassMatcher(tag, parent, combinator, utils) {
	const { h, variantGetBracket } = utils;
	const rawRE = new RegExp(`^(${escapeRegExp(parent)}:)(\\S+)${escapeRegExp(combinator)}\\1`);
	let splitRE;
	let pseudoRE;
	let pseudoColonRE;
	let pseudoVarRE;
	const matchBracket = (input) => {
		var _rest$split;
		const body = variantGetBracket(`${tag}-`, input, []);
		if (!body) return;
		const [match, rest] = body;
		const bracketValue = h.bracket(match);
		if (bracketValue == null) return;
		const label = ((_rest$split = rest.split(splitRE, 1)) === null || _rest$split === void 0 ? void 0 : _rest$split[0]) ?? "";
		const prefix = `${parent}${escapeSelector(label)}`;
		return [
			label,
			input.slice(input.length - (rest.length - label.length - 1)),
			bracketValue.includes("&") ? bracketValue.replace(/&/g, prefix) : `${prefix}${bracketValue}`
		];
	};
	const matchPseudo = (input) => {
		const match = input.match(pseudoRE) || input.match(pseudoColonRE);
		if (!match) return;
		const [original, fn, pseudoKey] = match;
		const label = match[3] ?? "";
		let pseudo = PseudoClasses[pseudoKey] || PseudoClassesColon[pseudoKey] || `:${pseudoKey}`;
		if (fn) pseudo = `:${fn}(${pseudo})`;
		return [
			label,
			input.slice(original.length),
			`${parent}${escapeSelector(label)}${pseudo}`,
			pseudoKey
		];
	};
	const matchPseudoVar = (input) => {
		const match = input.match(pseudoVarRE);
		if (!match) return;
		const [original, fn, pseudoValue] = match;
		const label = match[3] ?? "";
		const pseudo = `:${fn}(${pseudoValue})`;
		return [
			label,
			input.slice(original.length),
			`${parent}${escapeSelector(label)}${pseudo}`
		];
	};
	return {
		name: `pseudo:${tag}`,
		match(input, ctx) {
			if (!(splitRE && pseudoRE && pseudoColonRE)) {
				splitRE = new RegExp(`(?:${ctx.generator.config.separators.join("|")})`);
				pseudoRE = new RegExp(`^${tag}-(?:(?:(${PseudoClassFunctionsStr})-)?(${PseudoClassesStr}))(?:(/[\\w-]+))?(?:${ctx.generator.config.separators.join("|")})`);
				pseudoColonRE = new RegExp(`^${tag}-(?:(?:(${PseudoClassFunctionsStr})-)?(${PseudoClassesColonStr}))(?:(/[\\w-]+))?(?:${ctx.generator.config.separators.filter((x) => x !== "-").join("|")})`);
				pseudoVarRE = new RegExp(`^${tag}-(?:(${PseudoClassFunctionsStr})-)?\\[(.+)\\](?:(/[\\w-]+))?(?:${ctx.generator.config.separators.filter((x) => x !== "-").join("|")})`);
			}
			if (!input.startsWith(tag)) return;
			const result = matchBracket(input) || matchPseudo(input) || matchPseudoVar(input);
			if (!result) return;
			const [_label, matcher, prefix, pseudoName = ""] = result;
			return {
				matcher,
				handle: (input, next) => next({
					...input,
					prefix: `${prefix}${combinator}${input.prefix}`.replace(rawRE, "$1$2:"),
					sort: PseudoClassesKeys.indexOf(pseudoName) ?? PseudoClassesColonKeys.indexOf(pseudoName)
				})
			};
		},
		multiPass: true
	};
}
function createPseudoClassesAndElements(utils) {
	const { h } = utils;
	let PseudoClassesAndElementsRE;
	let PseudoClassesAndElementsColonRE;
	let PseudoClassesMultiRE;
	return [{
		name: "pseudo",
		match(input, ctx) {
			if (!(PseudoClassesAndElementsRE && PseudoClassesAndElementsColonRE)) {
				PseudoClassesAndElementsRE = new RegExp(`^(${PseudoClassesAndElementsStr})(?:-(\\d+|\\[(\\w|[+-.])+\\]))?(?:${ctx.generator.config.separators.join("|")})`);
				PseudoClassesAndElementsColonRE = new RegExp(`^(${PseudoClassesAndElementsColonStr})(?:${ctx.generator.config.separators.filter((x) => x !== "-").join("|")})`);
			}
			const match = input.match(PseudoClassesAndElementsRE) || input.match(PseudoClassesAndElementsColonRE);
			if (match) {
				let pseudo = PseudoClasses[match[1]] || PseudoClassesColon[match[1]] || `:${match[1]}`;
				if (match[2]) {
					let anPlusB;
					if (match[2].startsWith("[") && match[2].endsWith("]")) anPlusB = h.bracket(match[2]);
					else anPlusB = match[2];
					if (anPlusB) pseudo = pseudo.replace(PseudoPlaceholder, anPlusB);
				}
				let index = PseudoClassesKeys.indexOf(match[1]);
				if (index === -1) index = PseudoClassesColonKeys.indexOf(match[1]);
				if (index === -1) index = void 0;
				return {
					matcher: input.slice(match[0].length),
					handle: (input, next) => {
						const selectors = pseudo.includes("::") && !excludedPseudo.includes(pseudo) ? { pseudo: `${input.pseudo}${pseudo}` } : { selector: `${input.selector}${pseudo}` };
						return next({
							...input,
							...selectors,
							sort: index,
							noMerge: true
						});
					}
				};
			}
		},
		multiPass: true,
		autocomplete: `(${PseudoClassesAndElementsStr}|${PseudoClassesAndElementsColonStr}):`
	}, {
		name: "pseudo:multi",
		match(input, ctx) {
			if (!PseudoClassesMultiRE) PseudoClassesMultiRE = new RegExp(`^(${PseudoClassesMultiStr})(?:${ctx.generator.config.separators.join("|")})`);
			const match = input.match(PseudoClassesMultiRE);
			if (match) return PseudoClassesMulti[match[1]].map((pseudo) => {
				return {
					matcher: input.slice(match[0].length),
					handle: (input, next) => next({
						...input,
						pseudo: `${input.pseudo}${pseudo}`
					})
				};
			});
		},
		multiPass: false,
		autocomplete: `(${PseudoClassesMultiStr}):`
	}];
}
function createPseudoClassFunctions(utils) {
	const { getBracket, h } = utils;
	let PseudoClassFunctionsRE;
	let PseudoClassColonFunctionsRE;
	let PseudoClassVarFunctionRE;
	return {
		match(input, ctx) {
			if (!(PseudoClassFunctionsRE && PseudoClassColonFunctionsRE)) {
				PseudoClassFunctionsRE = new RegExp(`^(${PseudoClassFunctionsStr})-(${PseudoClassesStr})(?:${ctx.generator.config.separators.join("|")})`);
				PseudoClassColonFunctionsRE = new RegExp(`^(${PseudoClassFunctionsStr})-(${PseudoClassesColonStr})(?:${ctx.generator.config.separators.filter((x) => x !== "-").join("|")})`);
				PseudoClassVarFunctionRE = new RegExp(`^(${PseudoClassFunctionsStr})-(\\[.+\\])(?:${ctx.generator.config.separators.filter((x) => x !== "-").join("|")})`);
			}
			const match = input.match(PseudoClassFunctionsRE) || input.match(PseudoClassColonFunctionsRE) || input.match(PseudoClassVarFunctionRE);
			if (match) {
				const fn = match[1];
				const pseudo = getBracket(match[2], "[", "]") ? h.bracket(match[2]) : PseudoClasses[match[2]] || PseudoClassesColon[match[2]] || `:${match[2]}`;
				return {
					matcher: input.slice(match[0].length),
					selector: (s) => `${s}:${fn}(${pseudo})`
				};
			}
		},
		multiPass: true,
		autocomplete: `(${PseudoClassFunctionsStr})-(${PseudoClassesStr}|${PseudoClassesColonStr}):`
	};
}
function createTaggedPseudoClasses(options, utils) {
	const attributify = !!(options === null || options === void 0 ? void 0 : options.attributifyPseudo);
	let firstPrefix = (options === null || options === void 0 ? void 0 : options.prefix) ?? "";
	firstPrefix = escapeSelector((Array.isArray(firstPrefix) ? firstPrefix : [firstPrefix]).filter(Boolean)[0] ?? "");
	const tagWithPrefix = (tag, combinator) => createTaggedPseudoClassMatcher(tag, attributify ? `[${firstPrefix}${tag}=""]` : `.${firstPrefix}${tag}`, combinator, utils);
	return [
		tagWithPrefix("group", " "),
		tagWithPrefix("peer", "~"),
		tagWithPrefix("parent", ">"),
		tagWithPrefix("previous", "+")
	];
}
const PartClassesRE = /(part-\[(.+)\]:)(.+)/;
function createPartClasses() {
	return {
		match(input) {
			const match = input.match(PartClassesRE);
			if (match) {
				const part = `part(${match[2]})`;
				return {
					matcher: input.slice(match[1].length),
					selector: (s) => `${s}::${part}`
				};
			}
		},
		multiPass: true
	};
}
//#endregion
//#region src/variants.ts
function variantMatcher(name, handler, options = {}) {
	let re;
	return {
		name,
		match(input, ctx) {
			if (!re) re = new RegExp(`^${escapeRegExp(name)}(?:${ctx.generator.config.separators.join("|")})`);
			const match = input.match(re);
			if (match) {
				const matcher = input.slice(match[0].length);
				const handlers = toArray(handler).map((handler) => ({
					matcher,
					handle: (input, next) => next({
						...input,
						...handler(input)
					}),
					...options
				}));
				return handlers.length === 1 ? handlers[0] : handlers;
			}
		},
		autocomplete: `${name}:`
	};
}
function variantParentMatcher(name, parent) {
	let re;
	return {
		name,
		match(input, ctx) {
			if (!re) re = new RegExp(`^${escapeRegExp(name)}(?:${ctx.generator.config.separators.join("|")})`);
			const match = input.match(re);
			if (match) return {
				matcher: input.slice(match[0].length),
				handle: (input, next) => next({
					...input,
					parent: `${input.parent ? `${input.parent} $$ ` : ""}${parent}`
				})
			};
		},
		autocomplete: `${name}:`
	};
}
function variantGetBracket(prefix, matcher, separators) {
	if (matcher.startsWith(`${prefix}[`)) {
		const [match, rest] = getBracket(matcher.slice(prefix.length), "[", "]") ?? [];
		if (match && rest) {
			for (const separator of separators) if (rest.startsWith(separator)) return [
				match,
				rest.slice(separator.length),
				separator
			];
			return [
				match,
				rest,
				""
			];
		}
	}
}
function variantGetParameter(prefix, matcher, separators) {
	for (const p of toArray(prefix)) if (matcher.startsWith(p)) {
		const body = variantGetBracket(p, matcher, separators);
		if (body) {
			const [label = "", rest = body[1]] = variantGetParameter("/", body[1], separators) ?? [];
			return [
				body[0],
				rest,
				label
			];
		}
		for (const separator of separators.filter((x) => x !== "/")) {
			const pos = matcher.indexOf(separator, p.length);
			if (pos !== -1) {
				const labelPos = matcher.indexOf("/", p.length);
				const unlabelled = labelPos === -1 || pos <= labelPos;
				return [
					matcher.slice(p.length, unlabelled ? pos : labelPos),
					matcher.slice(pos + separator.length),
					unlabelled ? "" : matcher.slice(labelPos + 1, pos)
				];
			}
		}
	}
}
//#endregion
export { PseudoClassFunctions, PseudoClassFunctionsStr, PseudoClasses, PseudoClassesAndElementsColonStr, PseudoClassesAndElementsStr, PseudoClassesColon, PseudoClassesColonKeys, PseudoClassesColonStr, PseudoClassesKeys, PseudoClassesMulti, PseudoClassesMultiStr, PseudoClassesStr, alphaPlaceholders, alphaPlaceholdersRE, calcMaxWidthBySize, colorOpacityToString, colorToString, createPartClasses, createPseudoClassFunctions, createPseudoClassesAndElements, createTaggedPseudoClassMatcher, createTaggedPseudoClasses, createValueHandler, cssColorFunctions, excludedPseudo, getBracket, getStringComponent, getStringComponents, hasIconFn, hasThemeFn, hex2rgba, hueInterpolationMethods, iconFnRE, isInterpolatedMethod, parseCssColor, polarColorSpace, rectangularColorSpace, themeFnRE, transformThemeFn, transformThemeString, variantGetBracket, variantGetParameter, variantMatcher, variantParentMatcher };
