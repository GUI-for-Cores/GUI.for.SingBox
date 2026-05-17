import { A as bracketTypeRe, B as xyzMap, D as h, F as directionMap, I as globalKeywords, L as insetMap, M as cornerMap, R as positionMap, S as parseColor, U as SpecialColorKey, V as CONTROL_NO_NEGATIVE, _ as hyphenate, a as themeTracking, b as makeGlobalStaticRules, d as colorableShadows, g as hasParseableColor, j as splitComma, l as colorCSSGenerator, m as directionSize, n as detectThemeValue, p as defineProperty, r as generateThemeVariable, u as colorResolver, v as isCSSMathFn, w as resolveBreakpoints, x as numberResolver, y as isSize, z as xyzArray } from "./utils-B60b98El.mjs";
import { n as containerParent, r as containerShortcuts, t as container } from "./container-m1WfKD7R.mjs";
import { notNull, symbols } from "@unocss/core";
import { getStringComponent, getStringComponents } from "@unocss/rule-utils";
//#region src/rules/align.ts
const verticalAlignAlias = {
	"mid": "middle",
	"base": "baseline",
	"btm": "bottom",
	"baseline": "baseline",
	"top": "top",
	"start": "top",
	"middle": "middle",
	"bottom": "bottom",
	"end": "bottom",
	"text-top": "text-top",
	"text-bottom": "text-bottom",
	"sub": "sub",
	"super": "super",
	...Object.fromEntries(globalKeywords.map((x) => [x, x]))
};
const verticalAligns = [[
	/^(?:vertical|align|v)-(.+)$/,
	([, v]) => ({ "vertical-align": verticalAlignAlias[v] ?? h.bracket.cssvar.numberWithUnit(v) }),
	{ autocomplete: [`(vertical|align|v)-(${Object.keys(verticalAlignAlias).join("|")})`, "(vertical|align|v)-<percentage>"] }
]];
const textAlignValues = [
	"center",
	"left",
	"right",
	"justify",
	"start",
	"end"
];
const textAligns = [...textAlignValues.map((v) => [`text-${v}`, { "text-align": v }]), ...[...globalKeywords, ...textAlignValues].map((v) => [`text-align-${v}`, { "text-align": v }])];
//#endregion
//#region src/rules/animation.ts
const animations = [
	[
		/^(?:animate-)?keyframes-(.+)$/,
		([, name], { theme }) => {
			const kf = theme.animation?.keyframes?.[name];
			if (kf) return [`@keyframes ${name}${kf}`, { animation: name }];
		},
		{ autocomplete: ["animate-keyframes-$animation.keyframes", "keyframes-$animation.keyframes"] }
	],
	[
		/^animate-(.+)$/,
		([, name], { theme }) => {
			const kf = theme.animation?.keyframes?.[name];
			if (kf) {
				const duration = theme.animation?.durations?.[name] ?? "1s";
				const timing = theme.animation?.timingFns?.[name] ?? "linear";
				const count = theme.animation?.counts?.[name] ?? 1;
				const props = theme.animation?.properties?.[name];
				return [`@keyframes ${name}${kf}`, {
					animation: `${name} ${duration} ${timing} ${count}`,
					...props
				}];
			}
			return { animation: h.bracket.cssvar(name) };
		},
		{ autocomplete: "animate-$animation.keyframes" }
	],
	[/^animate-name-(.+)/, ([, d]) => ({ "animation-name": h.bracket.cssvar(d) ?? d })],
	[
		/^animate-duration-(.+)$/,
		([, d], { theme }) => ({ "animation-duration": theme.duration?.[d || "DEFAULT"] ?? h.bracket.cssvar.time(d) }),
		{ autocomplete: ["animate-duration"] }
	],
	[
		/^animate-delay-(.+)$/,
		([, d], { theme }) => ({ "animation-delay": theme.duration?.[d || "DEFAULT"] ?? h.bracket.cssvar.time(d) }),
		{ autocomplete: ["animate-delay"] }
	],
	[
		/^animate-ease(?:-(.+))?$/,
		([, d], { theme }) => ({ "animation-timing-function": theme.ease?.[d || "DEFAULT"] ?? h.bracket.cssvar(d) }),
		{ autocomplete: ["animate-ease", "animate-ease-$ease"] }
	],
	[
		/^animate-(fill-mode-|fill-|mode-)?(.+)$/,
		([, t, d]) => [
			"none",
			"forwards",
			"backwards",
			"both",
			...[t ? globalKeywords : []]
		].includes(d) ? { "animation-fill-mode": d } : void 0,
		{ autocomplete: [
			"animate-(fill|mode|fill-mode)",
			"animate-(fill|mode|fill-mode)-(none|forwards|backwards|both|inherit|initial|revert|revert-layer|unset)",
			"animate-(none|forwards|backwards|both|inherit|initial|revert|revert-layer|unset)"
		] }
	],
	[
		/^animate-(direction-)?(.+)$/,
		([, t, d]) => [
			"normal",
			"reverse",
			"alternate",
			"alternate-reverse",
			...[t ? globalKeywords : []]
		].includes(d) ? { "animation-direction": d } : void 0,
		{ autocomplete: [
			"animate-direction",
			"animate-direction-(normal|reverse|alternate|alternate-reverse|inherit|initial|revert|revert-layer|unset)",
			"animate-(normal|reverse|alternate|alternate-reverse|inherit|initial|revert|revert-layer|unset)"
		] }
	],
	[
		/^animate-(?:iteration-count-|iteration-|count-)(.+)$/,
		([, d]) => ({ "animation-iteration-count": h.bracket.cssvar(d) ?? d.replace(/-/g, ",") }),
		{ autocomplete: ["animate-(iteration|count|iteration-count)", "animate-(iteration|count|iteration-count)-<num>"] }
	],
	[
		/^animate-(play-state-|play-|state-)?(.+)$/,
		([, t, d]) => [
			"paused",
			"running",
			...[t ? globalKeywords : []]
		].includes(d) ? { "animation-play-state": d } : void 0,
		{ autocomplete: [
			"animate-(play|state|play-state)",
			"animate-(play|state|play-state)-(paused|running|inherit|initial|revert|revert-layer|unset)",
			"animate-(paused|running|inherit|initial|revert|revert-layer|unset)"
		] }
	],
	["animate-none", { animation: "none" }],
	...makeGlobalStaticRules("animate", "animation")
];
//#endregion
//#region src/rules/background.ts
const properties = {
	"gradient-position": defineProperty("--un-gradient-position"),
	"gradient-from": defineProperty("--un-gradient-from", {
		syntax: "<color>",
		initialValue: "#0000"
	}),
	"gradient-via": defineProperty("--un-gradient-via", {
		syntax: "<color>",
		initialValue: "#0000"
	}),
	"gradient-to": defineProperty("--un-gradient-to", {
		syntax: "<color>",
		initialValue: "#0000"
	}),
	"gradient-stops": defineProperty("--un-gradient-stops"),
	"gradient-via-stops": defineProperty("--un-gradient-via-stops"),
	"gradient-from-position": defineProperty("--un-gradient-from-position", {
		syntax: "<length-percentage>",
		initialValue: "0%"
	}),
	"gradient-via-position": defineProperty("--un-gradient-via-position", {
		syntax: "<length-percentage>",
		initialValue: "50%"
	}),
	"gradient-to-position": defineProperty("--un-gradient-to-position", {
		syntax: "<length-percentage>",
		initialValue: "100%"
	})
};
function resolveModifier(modifier) {
	let interpolationMethod = "in oklab";
	if (modifier) if (modifier.startsWith("[") && modifier.endsWith("]")) interpolationMethod = modifier.slice(1, -1);
	else switch (modifier) {
		case "longer":
		case "shorter":
		case "increasing":
		case "decreasing":
			interpolationMethod = `in oklch ${modifier} hue`;
			break;
		default: interpolationMethod = `in ${modifier}`;
	}
	return interpolationMethod;
}
function bgGradientColorResolver() {
	return function* ([, position, body], { theme }) {
		const css = {};
		const data = parseColor(body, theme);
		if (data) {
			const { color, keys, alpha } = data;
			if (color) {
				if (Object.values(SpecialColorKey).includes(color)) css[`--un-gradient-${position}`] = color;
				else {
					css[`--un-${position}-opacity`] = alpha;
					const value = keys ? generateThemeVariable("colors", keys) : color;
					css[`--un-gradient-${position}`] = `color-mix(in oklab, ${value} var(--un-${position}-opacity), transparent)`;
					yield defineProperty(`--un-${position}-opacity`, {
						syntax: "<percentage>",
						initialValue: "100%"
					});
				}
				if (keys) themeTracking(`colors`, keys);
				if (theme) detectThemeValue(color, theme);
			}
		} else css[`--un-gradient-${position}`] = h.bracket.cssvar(body);
		if (css[`--un-gradient-${position}`]) {
			switch (position) {
				case "from":
					yield {
						...css,
						"--un-gradient-stops": "var(--un-gradient-via-stops, var(--un-gradient-position), var(--un-gradient-from) var(--un-gradient-from-position), var(--un-gradient-to) var(--un-gradient-to-position))"
					};
					break;
				case "via":
					yield {
						...css,
						"--un-gradient-via-stops": `var(--un-gradient-position), var(--un-gradient-from) var(--un-gradient-from-position), var(--un-gradient-via) var(--un-gradient-via-position), var(--un-gradient-to) var(--un-gradient-to-position)`,
						"--un-gradient-stops": `var(--un-gradient-via-stops)`
					};
					break;
				case "to":
					yield {
						...css,
						"--un-gradient-stops": "var(--un-gradient-via-stops, var(--un-gradient-position), var(--un-gradient-from) var(--un-gradient-from-position), var(--un-gradient-to) var(--un-gradient-to-position))"
					};
					break;
				case "stops":
					yield { ...css };
					break;
			}
			for (const p of Object.values(properties)) yield p;
		}
	};
}
function bgGradientPositionResolver() {
	return function* ([, mode, body]) {
		yield { [`--un-gradient-${mode}-position`]: `${h.bracket.cssvar.percent(body)}` };
		for (const p of Object.values(properties)) yield p;
	};
}
const backgroundStyles = [
	[
		/^bg-(linear|radial|conic)-([^/]+)(?:\/(.+))?$/,
		([, m, d, s]) => {
			let v;
			if (h.number(d) != null) v = `from ${h.number(d)}deg ${resolveModifier(s)};`;
			else v = h.bracket(d);
			if (v) return {
				"--un-gradient-position": v,
				"background-image": `${m}-gradient(var(--un-gradient-stops))`
			};
		},
		{ autocomplete: [
			"bg-(linear|radial|conic)",
			"(from|to|via)-$colors",
			"(from|to|via)-(op|opacity)",
			"(from|to|via)-(op|opacity)-<percent>"
		] }
	],
	[/^(from|via|to|stops)-(.+)$/, bgGradientColorResolver()],
	[/^(from|via|to)-op(?:acity)?-?(.+)$/, ([, position, opacity]) => ({ [`--un-${position}-opacity`]: h.bracket.percent(opacity) })],
	[/^(from|via|to)-([\d.]+%)$/, bgGradientPositionResolver()],
	[
		/^bg-((?:repeating-)?(?:linear|radial|conic))$/,
		([, s]) => ({ "background-image": `${s}-gradient(var(--un-gradient, var(--un-gradient-stops, rgb(255 255 255 / 0))))` }),
		{ autocomplete: [
			"bg-gradient-repeating",
			"bg-gradient-(linear|radial|conic)",
			"bg-gradient-repeating-(linear|radial|conic)"
		] }
	],
	[
		/^bg-(gradient|linear|radial|conic)(?:-to-([rltb]{1,2}))?(?:\/(.+))?$/,
		([, m, d, s]) => {
			return {
				"--un-gradient-position": `${d in positionMap ? `to ${positionMap[d]} ` : " "}${resolveModifier(s)}`,
				"background-image": `${m === "gradient" ? "linear" : m}-gradient(var(--un-gradient-stops))`
			};
		},
		{ autocomplete: [
			"gradient",
			"linear",
			"radial",
			"conic"
		].map((i) => {
			return `bg-${i}-to-(${Object.keys(positionMap).filter((k) => k.length <= 2 && Array.from(k).every((c) => "rltb".includes(c))).join("|")})`;
		}) }
	],
	["bg-none", { "background-image": "none" }],
	["box-decoration-slice", { "box-decoration-break": "slice" }],
	["box-decoration-clone", { "box-decoration-break": "clone" }],
	...makeGlobalStaticRules("box-decoration", "box-decoration-break"),
	["bg-auto", { "background-size": "auto" }],
	["bg-cover", { "background-size": "cover" }],
	["bg-contain", { "background-size": "contain" }],
	[/^bg-size-(.+)$/, ([, v]) => ({ "background-size": h.bracket.cssvar(v) })],
	["bg-fixed", { "background-attachment": "fixed" }],
	["bg-local", { "background-attachment": "local" }],
	["bg-scroll", { "background-attachment": "scroll" }],
	["bg-clip-border", {
		"-webkit-background-clip": "border-box",
		"background-clip": "border-box"
	}],
	["bg-clip-content", {
		"-webkit-background-clip": "content-box",
		"background-clip": "content-box"
	}],
	["bg-clip-padding", {
		"-webkit-background-clip": "padding-box",
		"background-clip": "padding-box"
	}],
	["bg-clip-text", {
		"-webkit-background-clip": "text",
		"background-clip": "text"
	}],
	...globalKeywords.map((keyword) => [`bg-clip-${keyword}`, {
		"-webkit-background-clip": keyword,
		"background-clip": keyword
	}]),
	[/^bg-([-\w]{3,})$/, ([, s]) => ({ "background-position": positionMap[s] })],
	["bg-repeat", { "background-repeat": "repeat" }],
	["bg-no-repeat", { "background-repeat": "no-repeat" }],
	["bg-repeat-x", { "background-repeat": "repeat-x" }],
	["bg-repeat-y", { "background-repeat": "repeat-y" }],
	["bg-repeat-round", { "background-repeat": "round" }],
	["bg-repeat-space", { "background-repeat": "space" }],
	...makeGlobalStaticRules("bg-repeat", "background-repeat"),
	["bg-origin-border", { "background-origin": "border-box" }],
	["bg-origin-padding", { "background-origin": "padding-box" }],
	["bg-origin-content", { "background-origin": "content-box" }],
	...makeGlobalStaticRules("bg-origin", "background-origin")
];
//#endregion
//#region src/rules/behaviors.ts
const outline = [
	[
		/^outline-(?:width-|size-)?(.+)$/,
		handleWidth$2,
		{ autocomplete: "outline-(width|size)-<num>" }
	],
	[
		/^outline-(?:color-)?(.+)$/,
		handleColorOrWidth$2,
		{ autocomplete: "outline-$colors" }
	],
	[
		/^outline-op(?:acity)?-?(.+)$/,
		([, opacity]) => ({ "--un-outline-opacity": h.bracket.percent.cssvar(opacity) }),
		{ autocomplete: "outline-(op|opacity)-<percent>" }
	],
	[
		/^outline-offset-(.+)$/,
		([, d]) => ({ "outline-offset": h.bracket.cssvar.global.px(d) }),
		{ autocomplete: "outline-(offset)-<num>" }
	],
	["outline-offset-none", { "outline-offset": "0" }],
	["outline", [{
		"outline-style": "var(--un-outline-style)",
		"outline-width": "1px"
	}, defineProperty("--un-outline-style", { initialValue: "solid" })]],
	["outline-hidden", [{ "outline-style": "none" }, {
		[symbols.parent]: `@media (forced-colors: active)`,
		"outline": `2px solid transparent`,
		"outline-offset": `2px`
	}]],
	["outline-none", {
		"--un-outline-style": "none",
		"outline-style": "none"
	}],
	...[
		"auto",
		"dashed",
		"dotted",
		"double",
		"solid",
		"groove",
		"ridge",
		"inset",
		"outset",
		...globalKeywords
	].map((v) => [`outline-${v}`, {
		"--un-outline-style": v,
		"outline-style": v
	}])
];
function* handleWidth$2([, b]) {
	const v = h.bracket.cssvar.global.px(b);
	if (v != null) {
		yield {
			"outline-style": "var(--un-outline-style)",
			"outline-width": v
		};
		yield defineProperty("--un-outline-style", { initialValue: "solid" });
	}
}
function* handleColorOrWidth$2(match, ctx) {
	if (isCSSMathFn(h.bracket(match[1]))) yield* handleWidth$2(match);
	else {
		const result = colorResolver("outline-color", "outline")(match, ctx);
		if (result) for (const i of result) yield i;
	}
}
const appearance = [["appearance-auto", {
	"-webkit-appearance": "auto",
	"appearance": "auto"
}], ["appearance-none", {
	"-webkit-appearance": "none",
	"appearance": "none"
}]];
function willChangeProperty(prop) {
	const v = h.bracket(prop);
	if (v && h.properties(v)) return v;
	return h.properties.auto.cssvar.global(prop) ?? {
		contents: "contents",
		scroll: "scroll-position"
	}[prop];
}
const willChange = [[/^will-change-(.+)/, ([, p]) => ({ "will-change": willChangeProperty(p) })]];
const listStyles = {
	"disc": "disc",
	"circle": "circle",
	"square": "square",
	"decimal": "decimal",
	"zero-decimal": "decimal-leading-zero",
	"greek": "lower-greek",
	"roman": "lower-roman",
	"upper-roman": "upper-roman",
	"alpha": "lower-alpha",
	"upper-alpha": "upper-alpha",
	"latin": "lower-latin",
	"upper-latin": "upper-latin"
};
const listStyle = [
	[
		/^list-(.+?)(?:-(outside|inside))?$/,
		([, alias, position]) => {
			const style = listStyles[alias];
			if (style) {
				if (position) return {
					"list-style-position": position,
					"list-style-type": style
				};
				return { "list-style-type": style };
			}
		},
		{ autocomplete: [`list-(${Object.keys(listStyles).join("|")})`, `list-(${Object.keys(listStyles).join("|")})-(outside|inside)`] }
	],
	["list-outside", { "list-style-position": "outside" }],
	["list-inside", { "list-style-position": "inside" }],
	["list-none", { "list-style-type": "none" }],
	[/^list-image-(.+)$/, ([, d]) => {
		if (/^\[url\(.+\)\]$/.test(d)) return { "list-style-image": h.bracket(d) };
	}],
	["list-image-none", { "list-style-image": "none" }],
	...makeGlobalStaticRules("list", "list-style-type")
];
const accents = [[
	/^accent-(.+)$/,
	colorResolver("accent-color", "accent"),
	{ autocomplete: "accent-$colors" }
], [
	/^accent-op(?:acity)?-?(.+)$/,
	([, d]) => ({ "--un-accent-opacity": h.bracket.percent(d) }),
	{ autocomplete: ["accent-(op|opacity)", "accent-(op|opacity)-<percent>"] }
]];
const carets = [[
	/^caret-(.+)$/,
	colorResolver("caret-color", "caret"),
	{ autocomplete: "caret-$colors" }
], [
	/^caret-op(?:acity)?-?(.+)$/,
	([, d]) => ({ "--un-caret-opacity": h.bracket.percent(d) }),
	{ autocomplete: ["caret-(op|opacity)", "caret-(op|opacity)-<percent>"] }
]];
const imageRenderings = [
	["image-render-auto", { "image-rendering": "auto" }],
	["image-render-edge", { "image-rendering": "crisp-edges" }],
	["image-render-pixel", [
		["-ms-interpolation-mode", "nearest-neighbor"],
		["image-rendering", "-webkit-optimize-contrast"],
		["image-rendering", "-moz-crisp-edges"],
		["image-rendering", "-o-pixelated"],
		["image-rendering", "pixelated"]
	]]
];
const overscrolls = [
	["overscroll-auto", { "overscroll-behavior": "auto" }],
	["overscroll-contain", { "overscroll-behavior": "contain" }],
	["overscroll-none", { "overscroll-behavior": "none" }],
	...makeGlobalStaticRules("overscroll", "overscroll-behavior"),
	["overscroll-x-auto", { "overscroll-behavior-x": "auto" }],
	["overscroll-x-contain", { "overscroll-behavior-x": "contain" }],
	["overscroll-x-none", { "overscroll-behavior-x": "none" }],
	...makeGlobalStaticRules("overscroll-x", "overscroll-behavior-x"),
	["overscroll-y-auto", { "overscroll-behavior-y": "auto" }],
	["overscroll-y-contain", { "overscroll-behavior-y": "contain" }],
	["overscroll-y-none", { "overscroll-behavior-y": "none" }],
	...makeGlobalStaticRules("overscroll-y", "overscroll-behavior-y")
];
const scrollBehaviors = [
	["scroll-auto", { "scroll-behavior": "auto" }],
	["scroll-smooth", { "scroll-behavior": "smooth" }],
	...makeGlobalStaticRules("scroll", "scroll-behavior")
];
//#endregion
//#region src/rules/border.ts
const borderStyles = [
	"solid",
	"dashed",
	"dotted",
	"double",
	"hidden",
	"none",
	"groove",
	"ridge",
	"inset",
	"outset",
	...globalKeywords
];
const borders = [
	[
		/^(?:border|b)()(?:-(.+))?$/,
		handlerBorderSize,
		{ autocomplete: "(border|b)-<directions>" }
	],
	[/^(?:border|b)-([xy])(?:-(.+))?$/, handlerBorderSize],
	[/^(?:border|b)-([rltbse])(?:-(.+))?$/, handlerBorderSize],
	[/^(?:border|b)-(block|inline)(?:-(.+))?$/, handlerBorderSize],
	[/^(?:border|b)-([bi][se])(?:-(.+))?$/, handlerBorderSize],
	[
		/^(?:border|b)-()(?:width|size)-(.+)$/,
		handlerBorderSize,
		{ autocomplete: ["(border|b)-<num>", "(border|b)-<directions>-<num>"] }
	],
	[/^(?:border|b)-([xy])-(?:width|size)-(.+)$/, handlerBorderSize],
	[/^(?:border|b)-([rltbse])-(?:width|size)-(.+)$/, handlerBorderSize],
	[/^(?:border|b)-(block|inline)-(?:width|size)-(.+)$/, handlerBorderSize],
	[/^(?:border|b)-([bi][se])-(?:width|size)-(.+)$/, handlerBorderSize],
	[
		/^(?:border|b)-()(?:color-)?(.+)$/,
		handlerBorderColorOrSize,
		{ autocomplete: ["(border|b)-$colors", "(border|b)-<directions>-$colors"] }
	],
	[/^(?:border|b)-([xy])-(?:color-)?(.+)$/, handlerBorderColorOrSize],
	[/^(?:border|b)-([rltbse])-(?:color-)?(.+)$/, handlerBorderColorOrSize],
	[/^(?:border|b)-(block|inline)-(?:color-)?(.+)$/, handlerBorderColorOrSize],
	[/^(?:border|b)-([bi][se])-(?:color-)?(.+)$/, handlerBorderColorOrSize],
	[
		/^(?:border|b)-()op(?:acity)?-?(.+)$/,
		handlerBorderOpacity,
		{ autocomplete: "(border|b)-(op|opacity)-<percent>" }
	],
	[/^(?:border|b)-([xy])-op(?:acity)?-?(.+)$/, handlerBorderOpacity],
	[/^(?:border|b)-([rltbse])-op(?:acity)?-?(.+)$/, handlerBorderOpacity],
	[/^(?:border|b)-(block|inline)-op(?:acity)?-?(.+)$/, handlerBorderOpacity],
	[/^(?:border|b)-([bi][se])-op(?:acity)?-?(.+)$/, handlerBorderOpacity],
	[
		/^(?:border-|b-)?(?:rounded|rd)()(?:-(.+))?$/,
		handlerRounded,
		{ autocomplete: [
			"(border|b)-(rounded|rd)",
			"(border|b)-(rounded|rd)-$radius",
			"(rounded|rd)",
			"(rounded|rd)-$radius"
		] }
	],
	[/^(?:border-|b-)?(?:rounded|rd)-([rltbse])(?:-(.+))?$/, handlerRounded],
	[/^(?:border-|b-)?(?:rounded|rd)-([rltb]{2})(?:-(.+))?$/, handlerRounded],
	[/^(?:border-|b-)?(?:rounded|rd)-([bise][se])(?:-(.+))?$/, handlerRounded],
	[/^(?:border-|b-)?(?:rounded|rd)-([bi][se]-[bi][se])(?:-(.+))?$/, handlerRounded],
	[
		/^(?:border|b)-(?:style-)?()(.+)$/,
		handlerBorderStyle,
		{ autocomplete: [
			"(border|b)-style",
			`(border|b)-(${borderStyles.join("|")})`,
			"(border|b)-<directions>-style",
			`(border|b)-<directions>-(${borderStyles.join("|")})`,
			`(border|b)-<directions>-style-(${borderStyles.join("|")})`,
			`(border|b)-style-(${borderStyles.join("|")})`
		] }
	],
	[/^(?:border|b)-([xy])-(?:style-)?(.+)$/, handlerBorderStyle],
	[/^(?:border|b)-([rltbse])-(?:style-)?(.+)$/, handlerBorderStyle],
	[/^(?:border|b)-(block|inline)-(?:style-)?(.+)$/, handlerBorderStyle],
	[/^(?:border|b)-([bi][se])-(?:style-)?(.+)$/, handlerBorderStyle]
];
function borderColorResolver(direction) {
	return ([, body], ctx) => {
		const data = parseColor(body, ctx.theme);
		const result = colorCSSGenerator(data, `border${direction}-color`, `border${direction}`, ctx);
		if (result) {
			const css = result[0];
			if (data?.color && !Object.values(SpecialColorKey).includes(data.color) && !data.alpha && direction && direction !== "") css[`--un-border${direction}-opacity`] = `var(--un-border-opacity)`;
			return result;
		}
	};
}
function handlerBorderSize([, a = "", b = "1"]) {
	const v = h.bracket.cssvar.global.px(b);
	if (a in directionMap && v != null) return directionMap[a].map((i) => [`border${i}-width`, v]);
}
function handlerBorderColorOrSize([, a = "", b], ctx) {
	if (a in directionMap) {
		if (isCSSMathFn(h.bracket(b))) return handlerBorderSize([
			"",
			a,
			b
		]);
		if (hasParseableColor(b, ctx.theme)) {
			const directions = directionMap[a].map((i) => borderColorResolver(i)(["", b], ctx)).filter(notNull);
			return [directions.map((d) => d[0]).reduce((acc, item) => {
				Object.assign(acc, item);
				return acc;
			}, {}), ...directions.flatMap((d) => d.slice(1))];
		}
	}
}
function handlerBorderOpacity([, a = "", opacity]) {
	const v = h.bracket.percent.cssvar(opacity);
	if (a in directionMap && v != null) return directionMap[a].map((i) => [`--un-border${i}-opacity`, v]);
}
function handlerRounded([, a = "", s = "DEFAULT"], { theme }) {
	if (a in cornerMap) {
		if (s === "full") return cornerMap[a].map((i) => [`border${i}-radius`, "calc(infinity * 1px)"]);
		const _v = theme.radius?.[s] ?? h.bracket.cssvar.global.fraction.rem(s);
		if (_v != null) {
			const isVar = theme.radius && s in theme.radius;
			if (isVar) themeTracking(`radius`, s);
			return cornerMap[a].map((i) => [`border${i}-radius`, isVar ? generateThemeVariable("radius", s) : _v]);
		}
	}
}
function handlerBorderStyle([, a = "", s]) {
	if (borderStyles.includes(s) && a in directionMap) return [["--un-border-style", s], ...directionMap[a].map((i) => [`border${i}-style`, s])];
}
//#endregion
//#region src/rules/color.ts
/**
* @example op10 op-30 opacity-100
*/
const opacity = [[/^op(?:acity)?-?(.+)$/, ([, d]) => ({ opacity: h.bracket.percent.cssvar(d) })]];
const bgUrlRE = /^\[url\(.+\)\]$/;
const bgLengthRE = /^\[(?:length|size):.+\]$/;
const bgPositionRE = /^\[position:.+\]$/;
const bgGradientRE = /^\[(?:linear|conic|radial)-gradient\(.+\)\]$/;
const bgImageRE = /^\[image:.+\]$/;
const bgColors = [[
	/^bg-(.+)$/,
	(...args) => {
		const d = args[0][1];
		if (bgUrlRE.test(d)) return {
			"--un-url": h.bracket(d),
			"background-image": "var(--un-url)"
		};
		if (bgLengthRE.test(d) && h.bracketOfLength(d) != null) return { "background-size": h.bracketOfLength(d).split(" ").map((e) => h.fraction.auto.px.cssvar(e) ?? e).join(" ") };
		if ((isSize(d) || bgPositionRE.test(d)) && h.bracketOfPosition(d) != null) return { "background-position": h.bracketOfPosition(d).split(" ").map((e) => h.position.fraction.auto.px.cssvar(e) ?? e).join(" ") };
		if (bgGradientRE.test(d) || bgImageRE.test(d)) {
			const s = h.bracket(d);
			if (s) {
				const url = s.startsWith("http") ? `url(${s})` : h.cssvar(s);
				return { "background-image": url ?? s };
			}
		}
		return colorResolver("background-color", "bg")(...args);
	},
	{ autocomplete: "bg-$colors" }
], [
	/^bg-op(?:acity)?-?(.+)$/,
	([, opacity]) => ({ "--un-bg-opacity": h.bracket.percent.cssvar(opacity) }),
	{ autocomplete: "bg-(op|opacity)-<percent>" }
]];
const colorScheme = [[/^(?:color-)?scheme-(.+)$/, ([, v]) => ({ "color-scheme": v.split("-").join(" ") })]];
//#endregion
//#region src/rules/columns.ts
const columns = [
	[
		/^columns-(.+)$/,
		([, v], { theme }) => {
			if (theme.container && v in theme.container) {
				themeTracking("container", v);
				return { columns: generateThemeVariable("container", v) };
			}
			return { columns: h.bracket.numberWithUnit.number.cssvar(v) };
		},
		{ autocomplete: ["columns-<num>", "columns-$container"] }
	],
	["columns-auto", { columns: "auto" }],
	["break-before-auto", { "break-before": "auto" }],
	["break-before-avoid", { "break-before": "avoid" }],
	["break-before-all", { "break-before": "all" }],
	["break-before-avoid-page", { "break-before": "avoid-page" }],
	["break-before-page", { "break-before": "page" }],
	["break-before-left", { "break-before": "left" }],
	["break-before-right", { "break-before": "right" }],
	["break-before-column", { "break-before": "column" }],
	...makeGlobalStaticRules("break-before"),
	["break-inside-auto", { "break-inside": "auto" }],
	["break-inside-avoid", { "break-inside": "avoid" }],
	["break-inside-avoid-page", { "break-inside": "avoid-page" }],
	["break-inside-avoid-column", { "break-inside": "avoid-column" }],
	...makeGlobalStaticRules("break-inside"),
	["break-after-auto", { "break-after": "auto" }],
	["break-after-avoid", { "break-after": "avoid" }],
	["break-after-all", { "break-after": "all" }],
	["break-after-avoid-page", { "break-after": "avoid-page" }],
	["break-after-page", { "break-after": "page" }],
	["break-after-left", { "break-after": "left" }],
	["break-after-right", { "break-after": "right" }],
	["break-after-column", { "break-after": "column" }],
	...makeGlobalStaticRules("break-after")
];
//#endregion
//#region src/rules/decoration.ts
const decorationStyles = [
	"solid",
	"double",
	"dotted",
	"dashed",
	"wavy",
	...globalKeywords
];
const textDecorations = [
	[
		/^(?:decoration-)?(underline|overline|line-through)$/,
		([, s]) => ({ "text-decoration-line": s }),
		{ autocomplete: "decoration-(underline|overline|line-through)" }
	],
	[
		/^(?:underline|decoration)-(?:size-)?(.+)$/,
		handleWidth$1,
		{ autocomplete: "(underline|decoration)-<num>" }
	],
	[
		/^(?:underline|decoration)-(auto|from-font)$/,
		([, s]) => ({ "text-decoration-thickness": s }),
		{ autocomplete: "(underline|decoration)-(auto|from-font)" }
	],
	[
		/^(?:underline|decoration)-(.+)$/,
		handleColorOrWidth$1,
		{ autocomplete: "(underline|decoration)-$colors" }
	],
	[
		/^(?:underline|decoration)-op(?:acity)?-?(.+)$/,
		([, opacity]) => ({ "--un-line-opacity": h.bracket.percent.cssvar(opacity) }),
		{ autocomplete: "(underline|decoration)-(op|opacity)-<percent>" }
	],
	[
		/^(?:underline|decoration)-offset-(.+)$/,
		([, s]) => ({ "text-underline-offset": h.auto.bracket.cssvar.global.px(s) }),
		{ autocomplete: "(underline|decoration)-(offset)-<num>" }
	],
	...decorationStyles.map((v) => [`underline-${v}`, { "text-decoration-style": v }]),
	...decorationStyles.map((v) => [`decoration-${v}`, { "text-decoration-style": v }]),
	["no-underline", { "text-decoration": "none" }],
	["decoration-none", { "text-decoration": "none" }]
];
function handleWidth$1([, b]) {
	return { "text-decoration-thickness": h.bracket.cssvar.global.px(b) };
}
function handleColorOrWidth$1(match, ctx) {
	if (isCSSMathFn(h.bracket(match[1]))) return handleWidth$1(match);
	const result = colorResolver("text-decoration-color", "line")(match, ctx);
	if (result) {
		const css = result[0];
		css["-webkit-text-decoration-color"] = css["text-decoration-color"];
		return result;
	}
}
//#endregion
//#region src/rules/spacing.ts
const paddings = [
	[
		/^pa?()-?(.+)$/,
		directionSize("padding"),
		{ autocomplete: ["(m|p)<num>", "(m|p)-<num>"] }
	],
	[
		/^p-?xy()()$/,
		directionSize("padding"),
		{ autocomplete: "(m|p)-(xy)" }
	],
	[/^p-?([xy])(?:-?(.+))?$/, directionSize("padding")],
	[
		/^p-?([rltbse])(?:-?(.+))?$/,
		directionSize("padding"),
		{ autocomplete: "(m|p)<directions>-<num>" }
	],
	[
		/^p-(block|inline)(?:-(.+))?$/,
		directionSize("padding"),
		{ autocomplete: "(m|p)-(block|inline)-<num>" }
	],
	[
		/^p-?([bi][se])(?:-?(.+))?$/,
		directionSize("padding"),
		{ autocomplete: "(m|p)-(bs|be|is|ie)-<num>" }
	]
];
const margins = [
	[/^ma?()-?(.+)$/, directionSize("margin")],
	[/^m-?xy()()$/, directionSize("margin")],
	[/^m-?([xy])(?:-?(.+))?$/, directionSize("margin")],
	[/^m-?([rltbse])(?:-?(.+))?$/, directionSize("margin")],
	[/^m-(block|inline)(?:-(.+))?$/, directionSize("margin")],
	[/^m-?([bi][se])(?:-?(.+))?$/, directionSize("margin")]
];
const spaces = [[
	/^space-([xy])-(.+)$/,
	handlerSpace,
	{ autocomplete: [
		"space-(x|y)",
		"space-(x|y)-reverse",
		"space-(x|y)-$spacing"
	] }
], [/^space-([xy])-reverse$/, function* ([m, d], { symbols }) {
	yield {
		[symbols.variants]: [notLastChildSelectorVariant(m)],
		[`--un-space-${d}-reverse`]: "1"
	};
	yield defineProperty(`--un-space-${d}-reverse`, { initialValue: 0 });
}]];
function notLastChildSelectorVariant(s) {
	return {
		matcher: s,
		handle: (input, next) => next({
			...input,
			parent: `${input.parent ? `${input.parent} $$ ` : ""}${input.selector}`,
			selector: ":where(&>:not(:last-child))"
		})
	};
}
function* handlerSpace([m, d, s], { theme, symbols }) {
	let v;
	const num = numberResolver(s);
	if (num != null) {
		themeTracking(`spacing`);
		v = `calc(var(--spacing) * ${num})`;
	} else v = theme.spacing?.[s] ?? h.bracket.cssvar.auto.fraction.rem(s || "1");
	if (v != null) {
		const results = directionMap[d === "x" ? "inline" : "block"].map((item, index) => {
			return [`margin${item}`, `calc(${v} * ${index === 0 ? `var(--un-space-${d}-reverse)` : `calc(1 - var(--un-space-${d}-reverse))`})`];
		});
		if (results) {
			yield {
				[symbols.variants]: [notLastChildSelectorVariant(m)],
				[`--un-space-${d}-reverse`]: "0",
				...Object.fromEntries(results)
			};
			yield defineProperty(`--un-space-${d}-reverse`, { initialValue: 0 });
		}
	}
}
//#endregion
//#region src/rules/divide.ts
const divides = [
	[
		/^divide-(.+)$/,
		function* (match, ctx) {
			const result = colorResolver("border-color", "divide")(match, ctx);
			if (result) {
				yield {
					[ctx.symbols.variants]: [notLastChildSelectorVariant(match[0])],
					...result[0]
				};
				yield result[1];
			}
		},
		{ autocomplete: "divide-$colors" }
	],
	[
		/^divide-op(?:acity)?-?(.+)$/,
		function* ([match, opacity], { symbols }) {
			yield {
				[symbols.variants]: [notLastChildSelectorVariant(match)],
				"--un-divide-opacity": h.bracket.percent(opacity)
			};
		},
		{ autocomplete: ["divide-(op|opacity)", "divide-(op|opacity)-<percent>"] }
	],
	[
		/^divide-?([xy])$/,
		handlerDivide,
		{ autocomplete: ["divide-(x|y)", "divide-(x|y)-reverse"] }
	],
	[/^divide-?([xy])-?(.+)$/, handlerDivide],
	[/^divide-?([xy])-reverse$/, function* ([m, d], { symbols }) {
		yield {
			[symbols.variants]: [notLastChildSelectorVariant(m)],
			[`--un-divide-${d}-reverse`]: "1"
		};
		yield defineProperty(`--un-divide-${d}-reverse`, { initialValue: 0 });
	}],
	[
		new RegExp(`^divide-(${borderStyles.join("|")})$`),
		function* ([match, style], { symbols }) {
			yield {
				[symbols.variants]: [notLastChildSelectorVariant(match)],
				"border-style": style
			};
		},
		{ autocomplete: borderStyles.map((i) => `divide-${i}`) }
	]
];
function* handlerDivide([m, d, s], { symbols }) {
	let v = h.bracket.cssvar.px(s || "1");
	if (v != null) {
		if (v === "0") v = "0px";
		const results = {
			x: ["-left", "-right"],
			y: ["-top", "-bottom"]
		}[d].map((item) => {
			const value = item.endsWith("left") || item.endsWith("top") ? `calc(${v} * var(--un-divide-${d}-reverse))` : `calc(${v} * calc(1 - var(--un-divide-${d}-reverse)))`;
			return [[`border${item}-width`, value], [`border${item}-style`, `var(--un-border-style)`]];
		});
		if (results) {
			yield {
				[symbols.variants]: [notLastChildSelectorVariant(m)],
				[`--un-divide-${d}-reverse`]: 0,
				...Object.fromEntries(results.flat())
			};
			yield defineProperty(`--un-divide-${d}-reverse`, { initialValue: 0 });
			yield defineProperty(`--un-border-style`, { initialValue: "solid" });
		}
	}
}
//#endregion
//#region src/rules/filters.ts
const filterBaseKeys = [
	"blur",
	"brightness",
	"contrast",
	"grayscale",
	"hue-rotate",
	"invert",
	"saturate",
	"sepia",
	"drop-shadow"
];
const filterProperties = filterBaseKeys.map((i) => defineProperty(`--un-${i}`));
const filterCSS = filterBaseKeys.map((i) => `var(--un-${i},)`).join(" ");
const backdropBaseKeys = [
	"backdrop-blur",
	"backdrop-brightness",
	"backdrop-contrast",
	"backdrop-grayscale",
	"backdrop-hue-rotate",
	"backdrop-invert",
	"backdrop-opacity",
	"backdrop-saturate",
	"backdrop-sepia"
];
const backdropProperties = backdropBaseKeys.map((i) => defineProperty(`--un-${i}`));
const backdropCSS = backdropBaseKeys.map((i) => `var(--un-${i},)`).join(" ");
function percentWithDefault(str) {
	let v = h.bracket.cssvar(str || "");
	if (v != null) return v;
	v = str ? h.percent(str) : "100%";
	if (v != null && Number.parseFloat(v.slice(0, -1)) <= 100) return v;
}
function toFilter(varName, resolver) {
	return ([, b, s], { theme }) => {
		const value = resolver(s, theme) ?? (s === "none" ? "0" : "");
		if (value !== "") if (b) return [{
			[`--un-${b}${varName}`]: `${varName}(${value})`,
			"-webkit-backdrop-filter": backdropCSS,
			"backdrop-filter": backdropCSS
		}, ...backdropProperties];
		else return [{
			[`--un-${varName}`]: `${varName}(${value})`,
			filter: filterCSS
		}, ...filterProperties];
	};
}
function dropShadowResolver(match, ctx) {
	const [, s] = match;
	const { theme } = ctx;
	let res = [];
	if (s) {
		res = getStringComponents(s, "/", 2) ?? [];
		if (s.startsWith("/")) res = ["", s.slice(1)];
	}
	let v = theme.dropShadow?.[res[0] || "DEFAULT"];
	const c = s ? h.bracket.cssvar(s) : void 0;
	if ((v != null || c != null) && !hasParseableColor(c, theme)) {
		const alpha = res[1] ? h.bracket.percent.cssvar(res[1]) : void 0;
		return [{
			"--un-drop-shadow-opacity": alpha,
			"--un-drop-shadow": `drop-shadow(${colorableShadows(v || c, "--un-drop-shadow-color", alpha).join(") drop-shadow(")})`,
			"filter": filterCSS
		}, ...filterProperties];
	}
	if (hasParseableColor(s, theme)) return colorResolver("--un-drop-shadow-color", "drop-shadow")(match, ctx);
	v = h.bracket.cssvar(s) ?? (s === "none" ? "" : void 0);
	if (v != null) return [{
		"--un-drop-shadow": v ? `drop-shadow(${v})` : v,
		"filter": filterCSS
	}, ...filterProperties];
}
const filters = [
	[
		/^(?:(backdrop-)|filter-)?blur(?:-(.+))?$/,
		toFilter("blur", (s, theme) => theme.blur?.[s || "DEFAULT"] || h.bracket.cssvar.px(s)),
		{ autocomplete: [
			"(backdrop|filter)-blur-$blur",
			"blur-$blur",
			"filter-blur"
		] }
	],
	[
		/^(?:(backdrop-)|filter-)?brightness-(.+)$/,
		toFilter("brightness", (s) => h.bracket.cssvar.percent(s)),
		{ autocomplete: ["(backdrop|filter)-brightness-<percent>", "brightness-<percent>"] }
	],
	[
		/^(?:(backdrop-)|filter-)?contrast-(.+)$/,
		toFilter("contrast", (s) => h.bracket.cssvar.percent(s)),
		{ autocomplete: ["(backdrop|filter)-contrast-<percent>", "contrast-<percent>"] }
	],
	[
		/^(?:filter-)?drop-shadow(?:-?(.+))?$/,
		dropShadowResolver,
		{ autocomplete: [
			"filter-drop",
			"filter-drop-shadow",
			"filter-drop-shadow-color",
			"drop-shadow",
			"drop-shadow-color",
			"filter-drop-shadow-$dropShadow",
			"drop-shadow-$dropShadow",
			"filter-drop-shadow-$colors",
			"drop-shadow-$colors",
			"filter-drop-shadow-color-$colors",
			"drop-shadow-color-$colors",
			"filter-drop-shadow-color-(op|opacity)",
			"drop-shadow-color-(op|opacity)",
			"filter-drop-shadow-color-(op|opacity)-<percent>",
			"drop-shadow(-color)?-(op|opacity)-<percent>"
		] }
	],
	[/^(?:filter-)?drop-shadow-color-(.+)$/, colorResolver("--un-drop-shadow-color", "drop-shadow")],
	[/^(?:filter-)?drop-shadow(?:-color)?-op(?:acity)?-?(.+)$/, ([, opacity]) => ({ "--un-drop-shadow-opacity": h.bracket.percent(opacity) })],
	[
		/^(?:(backdrop-)|filter-)?grayscale(?:-(.+))?$/,
		toFilter("grayscale", percentWithDefault),
		{ autocomplete: [
			"(backdrop|filter)-grayscale",
			"(backdrop|filter)-grayscale-<percent>",
			"grayscale-<percent>"
		] }
	],
	[/^(?:(backdrop-)|filter-)?hue-rotate-(.+)$/, toFilter("hue-rotate", (s) => h.bracket.cssvar.degree(s))],
	[
		/^(?:(backdrop-)|filter-)?invert(?:-(.+))?$/,
		toFilter("invert", percentWithDefault),
		{ autocomplete: [
			"(backdrop|filter)-invert",
			"(backdrop|filter)-invert-<percent>",
			"invert-<percent>"
		] }
	],
	[
		/^(backdrop-)op(?:acity)?-(.+)$/,
		toFilter("opacity", (s) => h.bracket.cssvar.percent(s)),
		{ autocomplete: ["backdrop-(op|opacity)", "backdrop-(op|opacity)-<percent>"] }
	],
	[
		/^(?:(backdrop-)|filter-)?saturate-(.+)$/,
		toFilter("saturate", (s) => h.bracket.cssvar.percent(s)),
		{ autocomplete: [
			"(backdrop|filter)-saturate",
			"(backdrop|filter)-saturate-<percent>",
			"saturate-<percent>"
		] }
	],
	[
		/^(?:(backdrop-)|filter-)?sepia(?:-(.+))?$/,
		toFilter("sepia", percentWithDefault),
		{ autocomplete: [
			"(backdrop|filter)-sepia",
			"(backdrop|filter)-sepia-<percent>",
			"sepia-<percent>"
		] }
	],
	["filter", { filter: filterCSS }],
	["backdrop-filter", {
		"-webkit-backdrop-filter": backdropCSS,
		"backdrop-filter": backdropCSS
	}],
	["filter-none", { filter: "none" }],
	["backdrop-filter-none", {
		"-webkit-backdrop-filter": "none",
		"backdrop-filter": "none"
	}],
	...globalKeywords.map((keyword) => [`filter-${keyword}`, { filter: keyword }]),
	...globalKeywords.map((keyword) => [`backdrop-filter-${keyword}`, {
		"-webkit-backdrop-filter": keyword,
		"backdrop-filter": keyword
	}])
];
//#endregion
//#region src/rules/flex.ts
const flex = [
	["flex", { display: "flex" }],
	["inline-flex", { display: "inline-flex" }],
	["flex-inline", { display: "inline-flex" }],
	[/^flex-(.*)$/, ([, d]) => ({ flex: h.bracket(d) != null ? h.bracket(d).split(" ").map((e) => h.cssvar.fraction(e) ?? e).join(" ") : h.cssvar.fraction(d) })],
	["flex-1", { flex: "1 1 0%" }],
	["flex-auto", { flex: "1 1 auto" }],
	["flex-initial", { flex: "0 1 auto" }],
	["flex-none", { flex: "none" }],
	[
		/^(?:flex-)?shrink(?:-(.*))?$/,
		([, d = ""]) => ({ "flex-shrink": h.bracket.cssvar.number(d) ?? 1 }),
		{ autocomplete: ["flex-shrink-<num>", "shrink-<num>"] }
	],
	[
		/^(?:flex-)?grow(?:-(.*))?$/,
		([, d = ""]) => ({ "flex-grow": h.bracket.cssvar.number(d) ?? 1 }),
		{ autocomplete: ["flex-grow-<num>", "grow-<num>"] }
	],
	[
		/^(?:flex-)?basis-(.+)$/,
		([, d]) => {
			const v = numberResolver(d);
			if (v != null) {
				themeTracking(`spacing`);
				return { "flex-basis": `calc(var(--spacing) * ${v})` };
			}
			return { "flex-basis": h.bracket.cssvar.auto.fraction.rem(d) };
		},
		{ autocomplete: ["flex-basis-$spacing", "basis-$spacing"] }
	],
	["flex-row", { "flex-direction": "row" }],
	["flex-row-reverse", { "flex-direction": "row-reverse" }],
	["flex-col", { "flex-direction": "column" }],
	["flex-col-reverse", { "flex-direction": "column-reverse" }],
	["flex-wrap", { "flex-wrap": "wrap" }],
	["flex-wrap-reverse", { "flex-wrap": "wrap-reverse" }],
	["flex-nowrap", { "flex-wrap": "nowrap" }]
];
//#endregion
//#region src/rules/gap.ts
const directions = {
	"": [""],
	"x": ["column-"],
	"y": ["row-"],
	"col": ["column-"],
	"row": ["row-"]
};
const gaps = [
	[
		/^(?:flex-|grid-)?gap-?()(.+)$/,
		directionSize("gap", directions, (p, i) => `${i}${p}`),
		{ autocomplete: ["gap-$spacing", "gap-<num>"] }
	],
	[
		/^(?:flex-|grid-)?gap-([xy])-?(.+)$/,
		directionSize("gap", directions, (p, i) => `${i}${p}`),
		{ autocomplete: ["gap-(x|y)-$spacing", "gap-(x|y)-<num>"] }
	],
	[
		/^(?:flex-|grid-)?gap-(col|row)-?(.+)$/,
		directionSize("gap", directions, (p, i) => `${i}${p}`),
		{ autocomplete: ["gap-(col|row)-$spacing", "gap-(col|row)-<num>"] }
	]
];
//#endregion
//#region src/rules/grid.ts
function rowCol(s) {
	return s.replace("col", "column");
}
function autoDirection(prop) {
	switch (prop) {
		case "min": return "min-content";
		case "max": return "max-content";
		case "fr": return "minmax(0,1fr)";
	}
	return h.bracket.cssvar.auto.rem(prop);
}
const grids = [
	["grid", { display: "grid" }],
	["inline-grid", { display: "inline-grid" }],
	[/^(?:grid-)?(row|col)-(.+)$/, ([, c, v]) => ({ [`grid-${rowCol(c)}`]: h.bracket.number.cssvar.auto(v) })],
	[
		/^(?:grid-)?(row|col)-span-(.+)$/,
		([, c, s]) => {
			if (s === "full") return { [`grid-${rowCol(c)}`]: "1/-1" };
			const v = h.bracket.number.cssvar(s);
			if (v != null) return { [`grid-${rowCol(c)}`]: `span ${v}/span ${v}` };
		},
		{ autocomplete: "(grid-row|grid-col|row|col)-span-<num>" }
	],
	[/^(?:grid-)?(row|col)-start-(.+)$/, ([, c, v]) => ({ [`grid-${rowCol(c)}-start`]: h.bracket.cssvar(v) ?? v })],
	[
		/^(?:grid-)?(row|col)-end-(.+)$/,
		([, c, v]) => ({ [`grid-${rowCol(c)}-end`]: h.bracket.cssvar(v) ?? v }),
		{ autocomplete: "(grid-row|grid-col|row|col)-(start|end)-<num>" }
	],
	[
		/^(?:grid-)?auto-(rows|cols)-(.+)$/,
		([, c, v]) => ({ [`grid-auto-${rowCol(c)}`]: autoDirection(v) }),
		{ autocomplete: "(grid-auto|auto)-(rows|cols)-<num>" }
	],
	[/^(?:grid-auto-flow|auto-flow|grid-flow)-(.+)$/, ([, v]) => ({ "grid-auto-flow": h.bracket.cssvar(v) })],
	[
		/^(?:grid-auto-flow|auto-flow|grid-flow)-(row|col|dense|row-dense|col-dense)$/,
		([, v]) => ({ "grid-auto-flow": rowCol(v).replace("-", " ") }),
		{ autocomplete: ["(grid-auto-flow|auto-flow|grid-flow)-(row|col|dense|row-dense|col-dense)"] }
	],
	[/^(?:grid-)?(rows|cols)-(.+)$/, ([, c, v]) => ({ [`grid-template-${rowCol(c)}`]: h.bracket.cssvar(v) })],
	[/^(?:grid-)?(rows|cols)-minmax-([\w.-]+)$/, ([, c, d]) => ({ [`grid-template-${rowCol(c)}`]: `repeat(auto-fill,minmax(${d},1fr))` })],
	[
		/^(?:grid-)?(rows|cols)-(\d+)$/,
		([, c, d]) => ({ [`grid-template-${rowCol(c)}`]: `repeat(${d},minmax(0,1fr))` }),
		{ autocomplete: "(grid-rows|grid-cols|rows|cols)-<num>" }
	],
	[/^grid-area(s)?-(.+)$/, ([, s, v]) => {
		if (s != null) return { "grid-template-areas": h.cssvar(v) ?? v.split("-").map((s) => `"${h.bracket(s)}"`).join(" ") };
		return { "grid-area": h.bracket.cssvar(v) };
	}],
	["grid-rows-none", { "grid-template-rows": "none" }],
	["grid-cols-none", { "grid-template-columns": "none" }],
	["grid-rows-subgrid", { "grid-template-rows": "subgrid" }],
	["grid-cols-subgrid", { "grid-template-columns": "subgrid" }]
];
//#endregion
//#region src/rules/layout.ts
const overflowValues = [
	"auto",
	"hidden",
	"clip",
	"visible",
	"scroll",
	"overlay",
	...globalKeywords
];
const overflows = [[
	/^(?:overflow|of)-(.+)$/,
	([, v]) => overflowValues.includes(v) ? { overflow: v } : void 0,
	{ autocomplete: [`(overflow|of)-(${overflowValues.join("|")})`, `(overflow|of)-(x|y)-(${overflowValues.join("|")})`] }
], [/^(?:overflow|of)-([xy])-(.+)$/, ([, d, v]) => overflowValues.includes(v) ? { [`overflow-${d}`]: v } : void 0]];
//#endregion
//#region src/rules/line-clamp.ts
const lineClamps = [[
	/^line-clamp-(\d+)$/,
	([, v]) => ({
		"overflow": "hidden",
		"display": "-webkit-box",
		"-webkit-box-orient": "vertical",
		"-webkit-line-clamp": v
	}),
	{ autocomplete: ["line-clamp", "line-clamp-(1|2|3|4|5|6|none)"] }
], ["line-clamp-none", {
	"overflow": "visible",
	"display": "block",
	"-webkit-box-orient": "horizontal",
	"-webkit-line-clamp": "unset"
}]];
//#endregion
//#region src/rules/mask.ts
const linearMap = {
	t: ["top"],
	b: ["bottom"],
	l: ["left"],
	r: ["right"],
	x: ["left", "right"],
	y: ["top", "bottom"]
};
const maskInitialValue = "linear-gradient(#fff, #fff)";
const baseMaskImage = {
	"mask-image": "var(--un-mask-linear), var(--un-mask-radial), var(--un-mask-conic)",
	"mask-composite": "intersect"
};
function handlePosition([, v = ""]) {
	if (v in cornerMap) {
		const positions = v.split("").flatMap((c) => linearMap[c]).join(" ");
		return { "mask-position": positions };
	}
	const _v = h.bracket.cssvar.global.position(v);
	if (_v !== null) return { "mask-position": _v };
}
function handleImage([_, gradient = "", direction, val], ctx) {
	const css = { ...baseMaskImage };
	const props = [];
	props.push(...[
		"linear",
		"radial",
		"conic"
	].map((g) => defineProperty(`--un-mask-${g}`, { initialValue: maskInitialValue })));
	if (gradient in linearMap) {
		css["--un-mask-linear"] = "var(--un-mask-left), var(--un-mask-right), var(--un-mask-bottom), var(--un-mask-top)";
		for (const dir of linearMap[gradient]) {
			css[`--un-mask-${dir}`] = `linear-gradient(to ${dir}, var(--un-mask-${dir}-from-color) var(--un-mask-${dir}-from-position), var(--un-mask-${dir}-to-color) var(--un-mask-${dir}-to-position))`;
			if (numberResolver(val) != null) {
				themeTracking("spacing");
				css[`--un-mask-${dir}-${direction}-position`] = `calc(var(--spacing) * ${h.bracket.cssvar.fraction.number(val)})`;
			} else css[`--un-mask-${dir}-${direction}-position`] = h.bracket.cssvar.fraction.rem(val);
			if (hasParseableColor(val, ctx.theme)) {
				const result = colorResolver(`--un-mask-${dir}-${direction}-color`, hyphenate("colors"))([_, val], ctx);
				if (result) {
					const [c, ...p] = result;
					Object.assign(css, c);
					props.push(...p);
				}
			}
			props.push(...["from", "to"].flatMap((p) => [defineProperty(`--un-mask-${dir}-${p}-position`, {
				syntax: "<length-percentage>",
				initialValue: p === "from" ? "0%" : "100%"
			}), defineProperty(`--un-mask-${dir}-${p}-color`, {
				syntax: "<color>",
				initialValue: p === "from" ? "black" : "transparent"
			})]));
		}
		props.push(...[
			"top",
			"right",
			"bottom",
			"left"
		].map((d) => defineProperty(`--un-mask-${d}`, { initialValue: maskInitialValue })));
	} else {
		if (direction == null) if (gradient === "radial") {
			css["--un-mask-radial"] = "radial-gradient(var(--un-mask-radial-stops, var(--un-mask-radial-size)))";
			css["--un-mask-radial-size"] = h.bracket.cssvar.rem(val);
		} else {
			css[`--un-mask-${gradient}`] = `${gradient}-gradient(var(--un-mask-${gradient}-stops, var(--un-mask-${gradient}-position)))`;
			css[`--un-mask-${gradient}-position`] = numberResolver(val) ? `calc(1deg * ${h.bracket.cssvar.number(val)})` : h.bracket.cssvar.fraction(val);
		}
		else {
			const gradientStopsPrefixMap = {
				linear: "",
				radial: "var(--un-mask-radial-shape) var(--un-mask-radial-size) at ",
				conic: "from "
			};
			css[`--un-mask-${gradient}-stops`] = `${gradientStopsPrefixMap[gradient]}var(--un-mask-${gradient}-position), var(--un-mask-${gradient}-from-color) var(--un-mask-${gradient}-from-position), var(--un-mask-${gradient}-to-color) var(--un-mask-${gradient}-to-position)`;
			css[`--un-mask-${gradient}`] = `${gradient}-gradient(var(--un-mask-${gradient}-stops))`;
			if (hasParseableColor(val, ctx.theme)) {
				const result = colorResolver(`--un-mask-${gradient}-${direction}-color`, hyphenate("colors"))([_, val], ctx);
				if (result) {
					const [c, ...p] = result;
					Object.assign(css, c);
					props.push(...p);
				}
			} else if (numberResolver(val) != null) {
				themeTracking("spacing");
				css[`--un-mask-${gradient}-${direction}-position`] = `calc(var(--spacing) * ${h.bracket.cssvar.fraction.number(val)})`;
			} else css[`--un-mask-${gradient}-${direction}-position`] = h.bracket.cssvar.fraction.rem(val);
		}
		if (gradient === "radial") props.push(...[defineProperty("--un-mask-radial-shape", { initialValue: "ellipse" }), defineProperty("--un-mask-radial-size", { initialValue: "farthest-corner" })]);
		props.push(...["from", "to"].flatMap((p) => [
			defineProperty(`--un-mask-${gradient}-position`, { initialValue: gradient === "radial" ? "center" : "0deg" }),
			defineProperty(`--un-mask-${gradient}-${p}-position`, {
				syntax: "<length-percentage>",
				initialValue: p === "from" ? "0%" : "100%"
			}),
			defineProperty(`--un-mask-${gradient}-${p}-color`, {
				syntax: "<color>",
				initialValue: p === "from" ? "black" : "transparent"
			})
		]));
	}
	return [css, ...props];
}
function handleSize$1([, v = ""]) {
	const _v = h.bracket.cssvar.global.fraction.rem(v);
	if (_v !== null) return { "mask-size": _v };
}
const masks = [
	["mask-clip-border", { "mask-clip": "border-box" }],
	["mask-clip-padding", { "mask-clip": "padding-box" }],
	["mask-clip-content", { "mask-clip": "content-box" }],
	["mask-clip-fill", { "mask-clip": "fill-box" }],
	["mask-clip-stroke", { "mask-clip": "stroke-box" }],
	["mask-clip-view", { "mask-clip": "view-box" }],
	["mask-no-clip", { "mask-clip": "no-clip" }],
	["mask-add", { "mask-composite": "add" }],
	["mask-subtract", { "mask-composite": "subtract" }],
	["mask-intersect", { "mask-composite": "intersect" }],
	["mask-exclude", { "mask-composite": "exclude" }],
	[/^mask-(.+)$/, ([, v]) => ({ "mask-image": h.bracket.cssvar(v) })],
	[
		/^mask-(linear|radial|conic|[xytblr])-(from|to)()(?:-(.+))?$/,
		handleImage,
		{ autocomplete: [
			"mask-(linear|radial|conic)-(from|to)-$colors",
			"mask-(linear|radial|conic)-(from|to)-<percentage>",
			"mask-(linear|radial|conic)-(from|to)",
			"mask-(linear|radial|conic)-<percent>",
			"mask-(x|y|t|b|l|r)-(from|to)-$colors",
			"mask-(x|y|t|b|l|r)-(from|to)-<percentage>",
			"mask-(x|y|t|b|l|r)-(from|to)",
			"mask-(x|y|t|b|l|r)-<percent>"
		] }
	],
	[/^mask-(linear|radial|conic)-(from|to)?-?(.*)$/, handleImage],
	[/^mask-([trblxy])-(from|to)-(.*)$/, handleImage],
	["mask-none", { "mask-image": "none" }],
	["mask-radial-circle", { "--un-mask-radial-shape": "circle" }],
	["mask-radial-ellipse", { "--un-mask-radial-shape": "ellipse" }],
	["mask-radial-closest-side", { "--un-mask-radial-size": "closest-side" }],
	["mask-radial-closest-corner", { "--un-mask-radial-size": "closest-corner" }],
	["mask-radial-farthest-side", { "--un-mask-radial-size": "farthest-side" }],
	["mask-radial-farthest-corner", { "--un-mask-radial-size": "farthest-corner" }],
	[
		/^mask-radial-at-([-\w]{3,})$/,
		([, s]) => ({ "--un-mask-radial-position": positionMap[s] }),
		{ autocomplete: [`mask-radial-at-(${Object.keys(positionMap).filter((p) => p.length > 2).join("|")})`] }
	],
	["mask-alpha", { "mask-mode": "alpha" }],
	["mask-luminance", { "mask-mode": "luminance" }],
	["mask-match", { "mask-mode": "match-source" }],
	["mask-origin-border", { "mask-origin": "border-box" }],
	["mask-origin-padding", { "mask-origin": "padding-box" }],
	["mask-origin-content", { "mask-origin": "content-box" }],
	["mask-origin-fill", { "mask-origin": "fill-box" }],
	["mask-origin-stroke", { "mask-origin": "stroke-box" }],
	["mask-origin-view", { "mask-origin": "view-box" }],
	[/^mask-([rltb]{1,2})$/, handlePosition],
	[/^mask-([-\w]{3,})$/, ([, s]) => ({ "mask-position": positionMap[s] })],
	[/^mask-(?:position-|pos-)(.+)$/, handlePosition],
	["mask-repeat", { "mask-repeat": "repeat" }],
	["mask-no-repeat", { "mask-repeat": "no-repeat" }],
	["mask-repeat-x", { "mask-repeat": "repeat-x" }],
	["mask-repeat-y", { "mask-repeat": "repeat-y" }],
	["mask-repeat-space", { "mask-repeat": "space" }],
	["mask-repeat-round", { "mask-repeat": "round" }],
	["mask-auto", { "mask-size": "auto" }],
	["mask-cover", { "mask-size": "cover" }],
	["mask-contain", { "mask-size": "contain" }],
	[/^mask-size-(.+)$/, handleSize$1],
	["mask-type-luminance", { "mask-type": "luminance" }],
	["mask-type-alpha", { "mask-type": "alpha" }]
];
//#endregion
//#region src/rules/placeholder.ts
const placeholders = [[
	/^\$ placeholder-(.+)$/,
	colorResolver("color", "placeholder"),
	{ autocomplete: "placeholder-$colors" }
], [
	/^\$ placeholder-op(?:acity)?-?(.+)$/,
	([, opacity]) => ({ "--un-placeholder-opacity": h.bracket.percent(opacity) }),
	{ autocomplete: ["placeholder-(op|opacity)", "placeholder-(op|opacity)-<percent>"] }
]];
//#endregion
//#region src/rules/position.ts
const positions = [
	[
		/^(?:position-|pos-)?(relative|absolute|fixed|sticky)$/,
		([, v]) => ({ position: v }),
		{ autocomplete: [
			"(position|pos)-<position>",
			"(position|pos)-<globalKeyword>",
			"<position>"
		] }
	],
	[/^(?:position-|pos-)([-\w]+)$/, ([, v]) => globalKeywords.includes(v) ? { position: v } : void 0],
	[/^(?:position-|pos-)?(static)$/, ([, v]) => ({ position: v })]
];
const justifies = [
	["justify-start", { "justify-content": "flex-start" }],
	["justify-end", { "justify-content": "flex-end" }],
	["justify-center", { "justify-content": "center" }],
	["justify-between", { "justify-content": "space-between" }],
	["justify-around", { "justify-content": "space-around" }],
	["justify-evenly", { "justify-content": "space-evenly" }],
	["justify-stretch", { "justify-content": "stretch" }],
	["justify-left", { "justify-content": "left" }],
	["justify-right", { "justify-content": "right" }],
	["justify-center-safe", { "justify-content": "safe center" }],
	["justify-end-safe", { "justify-content": "safe flex-end" }],
	["justify-normal", { "justify-content": "normal" }],
	...makeGlobalStaticRules("justify", "justify-content"),
	["justify-items-start", { "justify-items": "start" }],
	["justify-items-end", { "justify-items": "end" }],
	["justify-items-center", { "justify-items": "center" }],
	["justify-items-stretch", { "justify-items": "stretch" }],
	["justify-items-center-safe", { "justify-items": "safe center" }],
	["justify-items-end-safe", { "justify-items": "safe flex-end" }],
	...makeGlobalStaticRules("justify-items"),
	["justify-self-auto", { "justify-self": "auto" }],
	["justify-self-start", { "justify-self": "start" }],
	["justify-self-end", { "justify-self": "end" }],
	["justify-self-center", { "justify-self": "center" }],
	["justify-self-stretch", { "justify-self": "stretch" }],
	["justify-self-baseline", { "justify-self": "baseline" }],
	["justify-self-center-safe", { "justify-self": "safe center" }],
	["justify-self-end-safe", { "justify-self": "safe flex-end" }],
	...makeGlobalStaticRules("justify-self")
];
const orders = [
	[/^order-(.+)$/, ([, v]) => ({ order: h.bracket.cssvar.number(v) })],
	["order-first", { order: "calc(-infinity)" }],
	["order-last", { order: "calc(infinity)" }],
	["order-none", { order: "0" }]
];
const alignments = [
	["content-center", { "align-content": "center" }],
	["content-start", { "align-content": "flex-start" }],
	["content-end", { "align-content": "flex-end" }],
	["content-between", { "align-content": "space-between" }],
	["content-around", { "align-content": "space-around" }],
	["content-evenly", { "align-content": "space-evenly" }],
	["content-baseline", { "align-content": "baseline" }],
	["content-center-safe", { "align-content": "safe center" }],
	["content-end-safe", { "align-content": "safe flex-end" }],
	["content-stretch", { "align-content": "stretch" }],
	["content-normal", { "align-content": "normal" }],
	...makeGlobalStaticRules("content", "align-content"),
	["items-start", { "align-items": "flex-start" }],
	["items-end", { "align-items": "flex-end" }],
	["items-center", { "align-items": "center" }],
	["items-baseline", { "align-items": "baseline" }],
	["items-stretch", { "align-items": "stretch" }],
	["items-baseline-last", { "align-items": "last baseline" }],
	["items-center-safe", { "align-items": "safe center" }],
	["items-end-safe", { "align-items": "safe flex-end" }],
	...makeGlobalStaticRules("items", "align-items"),
	["self-auto", { "align-self": "auto" }],
	["self-start", { "align-self": "flex-start" }],
	["self-end", { "align-self": "flex-end" }],
	["self-center", { "align-self": "center" }],
	["self-stretch", { "align-self": "stretch" }],
	["self-baseline", { "align-self": "baseline" }],
	["self-baseline-last", { "align-self": "last baseline" }],
	["self-center-safe", { "align-self": "safe center" }],
	["self-end-safe", { "align-self": "safe flex-end" }],
	...makeGlobalStaticRules("self", "align-self")
];
const placements = [
	["place-content-center", { "place-content": "center" }],
	["place-content-start", { "place-content": "start" }],
	["place-content-end", { "place-content": "end" }],
	["place-content-between", { "place-content": "space-between" }],
	["place-content-around", { "place-content": "space-around" }],
	["place-content-evenly", { "place-content": "space-evenly" }],
	["place-content-stretch", { "place-content": "stretch" }],
	["place-content-baseline", { "place-content": "baseline" }],
	["place-content-center-safe", { "place-content": "safe center" }],
	["place-content-end-safe", { "place-content": "safe flex-end" }],
	...makeGlobalStaticRules("place-content"),
	["place-items-start", { "place-items": "start" }],
	["place-items-end", { "place-items": "end" }],
	["place-items-center", { "place-items": "center" }],
	["place-items-stretch", { "place-items": "stretch" }],
	["place-items-baseline", { "place-items": "baseline" }],
	["place-items-center-safe", { "place-items": "safe center" }],
	["place-items-end-safe", { "place-items": "safe flex-end" }],
	...makeGlobalStaticRules("place-items"),
	["place-self-auto", { "place-self": "auto" }],
	["place-self-start", { "place-self": "start" }],
	["place-self-end", { "place-self": "end" }],
	["place-self-center", { "place-self": "center" }],
	["place-self-stretch", { "place-self": "stretch" }],
	["place-self-center-safe", { "place-self": "safe center" }],
	["place-self-end-safe", { "place-self": "safe flex-end" }],
	...makeGlobalStaticRules("place-self")
];
/**
* This is to add `flex-` and `grid-` prefix to the alignment rules,
* supporting `flex="~ items-center"` in attributify mode.
*/
const flexGridJustifiesAlignments = [
	...justifies,
	...alignments,
	...placements
].flatMap(([k, v]) => [[`flex-${k}`, v], [`grid-${k}`, v]]);
function handleInsetValue(v) {
	const _v = numberResolver(v);
	if (_v != null) {
		themeTracking(`spacing`);
		return `calc(var(--spacing) * ${_v})`;
	} else return h.bracket.cssvar.global.auto.fraction.rem(v);
}
function handleInsetValues([, d, v]) {
	const r = handleInsetValue(v);
	if (r != null && d in insetMap) return insetMap[d].map((i) => [i.slice(1), r]);
}
const insets = [
	[
		/^(?:position-|pos-)?inset-(.+)$/,
		([, v]) => ({ inset: handleInsetValue(v) }),
		{ autocomplete: [
			"(position|pos)-inset-<directions>-$spacing",
			"(position|pos)-inset-(block|inline)-$spacing",
			"(position|pos)-inset-(bs|be|is|ie)-$spacing",
			"(position|pos)-(top|left|right|bottom)-$spacing"
		] }
	],
	[/^(?:position-|pos-)?(start|end)-(.+)$/, handleInsetValues],
	[/^(?:position-|pos-)?inset-([xy])-(.+)$/, handleInsetValues],
	[/^(?:position-|pos-)?inset-([rltbse])-(.+)$/, handleInsetValues],
	[/^(?:position-|pos-)?inset-(block|inline)-(.+)$/, handleInsetValues],
	[/^(?:position-|pos-)?inset-([bi][se])-(.+)$/, handleInsetValues],
	[/^(?:position-|pos-)?(top|left|right|bottom)-(.+)$/, ([, d, v]) => ({ [d]: handleInsetValue(v) })]
];
const floats = [
	["float-left", { float: "left" }],
	["float-right", { float: "right" }],
	["float-start", { float: "inline-start" }],
	["float-end", { float: "inline-end" }],
	["float-none", { float: "none" }],
	...makeGlobalStaticRules("float"),
	["clear-left", { clear: "left" }],
	["clear-right", { clear: "right" }],
	["clear-both", { clear: "both" }],
	["clear-start", { clear: "inline-start" }],
	["clear-end", { clear: "inline-end" }],
	["clear-none", { clear: "none" }],
	...makeGlobalStaticRules("clear")
];
const zIndexes = [[/^(?:position-|pos-)?z([\d.]+)$/, ([, v]) => ({ "z-index": h.number(v) })], [
	/^(?:position-|pos-)?z-(.+)$/,
	([, v]) => ({ "z-index": h.bracket.cssvar.global.auto.number(v) }),
	{ autocomplete: "z-<num>" }
]];
const boxSizing = [
	["box-border", { "box-sizing": "border-box" }],
	["box-content", { "box-sizing": "content-box" }],
	...makeGlobalStaticRules("box", "box-sizing")
];
//#endregion
//#region src/rules/question-mark.ts
/**
* Used for debugging, only available in development mode.
*
* @example `?` / `where`
*/
const questionMark = [[/^(where|\?)$/, (_, { constructCSS, generator }) => {
	if (generator.userConfig.envMode === "dev") return `@keyframes __un_qm{0%{box-shadow:inset 4px 4px #ff1e90, inset -4px -4px #ff1e90}100%{box-shadow:inset 8px 8px #3399ff, inset -8px -8px #3399ff}} ${constructCSS({ animation: "__un_qm 0.5s ease-in-out alternate infinite" })}`;
}]];
//#endregion
//#region src/rules/shadow.ts
const shadowProperties = {
	shadow: defineProperty("--un-shadow", { initialValue: "0 0 #0000" }),
	shadowColor: defineProperty("--un-shadow-color"),
	insetShadow: defineProperty("--un-inset-shadow", { initialValue: "0 0 #0000" }),
	insetShadowColor: defineProperty("--un-inset-shadow-color"),
	ringColor: defineProperty("--un-ring-color"),
	ringShadow: defineProperty("--un-ring-shadow", { initialValue: "0 0 #0000" }),
	insetRingColor: defineProperty("--un-inset-ring-color"),
	insetRingShadow: defineProperty("--un-inset-ring-shadow", { initialValue: "0 0 #0000" }),
	ringInset: defineProperty("--un-ring-inset"),
	ringOffsetWidth: defineProperty("--un-ring-offset-width", {
		syntax: "<length>",
		initialValue: "0px"
	}),
	ringOffsetColor: defineProperty("--un-ring-offset-color"),
	ringOffsetShadow: defineProperty("--un-ring-offset-shadow", { initialValue: "0 0 #0000" })
};
const boxShadows = [
	[
		/^shadow(?:-?(.+))?$/,
		handleShadow("shadow"),
		{ autocomplete: ["shadow-$colors", "shadow-$shadow"] }
	],
	[
		/^shadow-op(?:acity)?-?(.+)$/,
		([, opacity]) => ({ "--un-shadow-opacity": h.bracket.percent.cssvar(opacity) }),
		{ autocomplete: "shadow-(op|opacity)-<percent>" }
	],
	[
		/^inset-shadow(?:-(.+))?$/,
		handleShadow("insetShadow"),
		{ autocomplete: ["inset-shadow-$colors", "inset-shadow-$insetShadow"] }
	],
	[
		/^inset-shadow-op(?:acity)?-?(.+)$/,
		([, opacity]) => ({ "--un-inset-shadow-opacity": h.bracket.percent.cssvar(opacity) }),
		{ autocomplete: "shadow-(op|opacity)-<percent>" }
	]
];
function handleShadow(themeKey) {
	return (match, ctx) => {
		const [, d] = match;
		const { theme } = ctx;
		let res = [];
		if (d) {
			res = getStringComponents(d, "/", 2) ?? [];
			if (d.startsWith("/")) res = ["", d.slice(1)];
		}
		const v = theme[themeKey]?.[res[0] || "DEFAULT"];
		const c = d ? h.bracket.cssvar(d) : void 0;
		const shadowVar = hyphenate(themeKey);
		if ((v != null || c != null) && !hasParseableColor(c, theme)) {
			const alpha = res[1] ? h.bracket.percent.cssvar(res[1]) : void 0;
			return [{
				[`--un-${shadowVar}-opacity`]: alpha,
				[`--un-${shadowVar}`]: colorableShadows(v || c, `--un-${shadowVar}-color`, alpha).join(","),
				"box-shadow": "var(--un-inset-shadow), var(--un-inset-ring-shadow), var(--un-ring-offset-shadow), var(--un-ring-shadow), var(--un-shadow)"
			}, ...Object.values(shadowProperties)];
		}
		return colorResolver(`--un-${shadowVar}-color`, shadowVar)(match, ctx);
	};
}
//#endregion
//#region src/rules/ring.ts
const rings = [
	[/^ring(?:-(.+))?$/, ([, d]) => {
		const v = h.bracket.px(d || "1");
		if (v != null) return [{
			"--un-ring-shadow": `var(--un-ring-inset,) 0 0 0 calc(${v} + var(--un-ring-offset-width)) var(--un-ring-color, currentColor)`,
			"box-shadow": "var(--un-inset-shadow), var(--un-inset-ring-shadow), var(--un-ring-offset-shadow), var(--un-ring-shadow), var(--un-shadow)"
		}, ...Object.values(shadowProperties)];
	}],
	[
		/^ring-(.+)$/,
		colorResolver(`--un-ring-color`, "ring"),
		{ autocomplete: "ring-$colors" }
	],
	[
		/^ring-op(?:acity)?-?(.+)$/,
		([, opacity]) => ({ "--un-ring-opacity": h.bracket.percent.cssvar(opacity) }),
		{ autocomplete: "ring-(op|opacity)-<percent>" }
	],
	[/^inset-ring(?:-(.+))?$/, ([, d]) => {
		const v = h.bracket.px(d || "1");
		if (v != null) return [{
			"--un-inset-ring-shadow": `inset 0 0 0 ${v} var(--un-inset-ring-color, currentColor)`,
			"box-shadow": "var(--un-inset-shadow), var(--un-inset-ring-shadow), var(--un-ring-offset-shadow), var(--un-ring-shadow), var(--un-shadow)"
		}, ...Object.values(shadowProperties)];
	}],
	[
		/^inset-ring-(.+)$/,
		colorResolver(`--un-inset-ring-color`, "inset-ring"),
		{ autocomplete: "inset-ring-$colors" }
	],
	[
		/^inset-ring-op(?:acity)?-?(.+)$/,
		([, opacity]) => ({ "--un-inset-ring-opacity": h.bracket.percent.cssvar(opacity) }),
		{ autocomplete: "inset-ring-(op|opacity)-<percent>" }
	],
	[
		/^ring-offset(?:-(?:width-|size-)?(.+))?$/,
		([, d]) => {
			const v = h.bracket.cssvar.px(d || "1");
			if (v != null) return {
				"--un-ring-offset-width": v,
				"--un-ring-offset-shadow": "var(--un-ring-inset,) 0 0 0 var(--un-ring-offset-width) var(--un-ring-offset-color)"
			};
		},
		{ autocomplete: "ring-offset-$colors" }
	],
	[
		/^ring-offset-(.+)$/,
		colorResolver(`--un-ring-offset-color`, "ring-offset"),
		{ autocomplete: "ring-offset-$colors" }
	],
	[
		/^ring-offset-op(?:acity)?-?(.+)$/,
		([, opacity]) => ({ "--un-ring-offset-opacity": h.bracket.percent.cssvar(opacity) }),
		{ autocomplete: "ring-offset-(op|opacity)-<percent>" }
	],
	["ring-inset", { "--un-ring-inset": "inset" }]
];
//#endregion
//#region src/rules/scrolls.ts
const scrolls = [
	...[
		"x",
		"y",
		"both"
	].map((d) => [`snap-${d}`, [{ "scroll-snap-type": `${d} var(--un-scroll-snap-strictness)` }, defineProperty("--un-scroll-snap-strictness", { initialValue: "proximity" })]]),
	...["mandatory", "proximity"].map((d) => [`snap-${d}`, [{ "--un-scroll-snap-strictness": d }, defineProperty("--un-scroll-snap-strictness", { initialValue: "proximity" })]]),
	["snap-none", { "scroll-snap-type": "none" }],
	["snap-start", { "scroll-snap-align": "start" }],
	["snap-end", { "scroll-snap-align": "end" }],
	["snap-center", { "scroll-snap-align": "center" }],
	["snap-align-none", { "scroll-snap-align": "none" }],
	["snap-normal", { "scroll-snap-stop": "normal" }],
	["snap-always", { "scroll-snap-stop": "always" }],
	[
		/^scroll-ma?()-?(.+)$/,
		directionSize("scroll-margin"),
		{ autocomplete: [
			"scroll-(m|p|ma|pa|block|inline)",
			"scroll-(m|p|ma|pa|block|inline)-$spacing",
			"scroll-(m|p|ma|pa|block|inline)-(x|y|r|l|t|b|bs|be|is|ie)",
			"scroll-(m|p|ma|pa|block|inline)-(x|y|r|l|t|b|bs|be|is|ie)-$spacing"
		] }
	],
	[/^scroll-m-?([xy])-?(.+)$/, directionSize("scroll-margin")],
	[/^scroll-m-?([rltb])-?(.+)$/, directionSize("scroll-margin")],
	[/^scroll-m-(block|inline)-(.+)$/, directionSize("scroll-margin")],
	[/^scroll-m-?([bi][se])-?(.+)$/, directionSize("scroll-margin")],
	[/^scroll-pa?()-?(.+)$/, directionSize("scroll-padding")],
	[/^scroll-p-?([xy])-?(.+)$/, directionSize("scroll-padding")],
	[/^scroll-p-?([rltb])-?(.+)$/, directionSize("scroll-padding")],
	[/^scroll-p-(block|inline)-(.+)$/, directionSize("scroll-padding")],
	[/^scroll-p-?([bi][se])-?(.+)$/, directionSize("scroll-padding")]
];
//#endregion
//#region src/rules/size.ts
const sizeMapping = {
	h: "height",
	w: "width",
	inline: "inline-size",
	block: "block-size"
};
function getPropName(minmax, hw) {
	return `${minmax || ""}${sizeMapping[hw]}`;
}
function getSizeValue(theme, hw, prop) {
	let v;
	for (const key of ["container", "spacing"]) if (theme[key]?.[prop]) {
		themeTracking(key, prop);
		v = generateThemeVariable(key, prop);
		break;
	}
	if (!v) switch (prop) {
		case "fit":
		case "max":
		case "min":
			v = `${prop}-content`;
			break;
		case "stretch":
			v = "stretch";
			break;
		case "screen":
			v = hw === "w" ? "100vw" : "100vh";
			break;
	}
	if (!v && h.number(prop) != null) {
		themeTracking(`spacing`);
		v = `calc(var(--spacing) * ${h.number(prop)})`;
	}
	return v ?? h.bracket.cssvar.global.auto.none.fraction.rem(prop, theme);
}
const sizes = [
	[/^size-(min-|max-)?(.+)$/, ([, m, s], { theme }) => ({
		[getPropName(m, "w")]: getSizeValue(theme, "w", s),
		[getPropName(m, "h")]: getSizeValue(theme, "h", s)
	})],
	[/^(?:size-)?(min-|max-)?([wh])-?(.+)$/, ([, m, w, s], { theme }) => ({ [getPropName(m, w)]: getSizeValue(theme, w, s) })],
	[
		/^(?:size-)?(min-|max-)?(block|inline)-(.+)$/,
		([, m, w, s], { theme }) => ({ [getPropName(m, w)]: getSizeValue(theme, w, s) }),
		{ autocomplete: [
			"(w|h)-<num>",
			"(w|h)-(full|screen|fit|max|min)",
			"(max|min)-(w|h)-<num>",
			"(max|min)-(w|h)-(full|screen|fit|max|min)",
			"(block|inline)-<num>",
			"(block|inline)-(full|screen|fit|max|min)",
			"(max|min)-(w|h|block|inline)",
			"(max|min)-(w|h|block|inline)-<num>",
			"(max|min)-(w|h|block|inline)-(full|screen|fit|max|min)"
		] }
	],
	[/^(?:size-)?(min-|max-)?(h)-screen-(.+)$/, ([, m, h, p], context) => ({ [getPropName(m, h)]: handleBreakpoint(context, p, "verticalBreakpoint") })],
	[
		/^(?:size-)?(min-|max-)?(w)-screen-(.+)$/,
		([, m, w, p], context) => ({ [getPropName(m, w)]: handleBreakpoint(context, p) }),
		{ autocomplete: [
			"(w|h)-screen",
			"(min|max)-(w|h)-screen",
			"h-screen-$breakpoint",
			"(min|max)-h-screen-$breakpoint",
			"w-screen-$breakpoint",
			"(min|max)-w-screen-$breakpoint"
		] }
	]
];
function handleBreakpoint(context, point, key = "breakpoint") {
	const bp = resolveBreakpoints(context, key);
	if (bp) return bp.find((i) => i.point === point)?.size;
}
function getAspectRatio(prop) {
	if (/^\d+\/\d+$/.test(prop)) return prop;
	switch (prop) {
		case "square": return "1/1";
		case "video": return "16/9";
	}
	return h.bracket.cssvar.global.auto.number(prop);
}
const aspectRatio = [[
	/^(?:size-)?aspect-(?:ratio-)?(.+)$/,
	([, d]) => ({ "aspect-ratio": getAspectRatio(d) }),
	{ autocomplete: ["aspect-(square|video|ratio)", "aspect-ratio-(square|video)"] }
]];
//#endregion
//#region src/rules/static.ts
const cursorValues = [
	"auto",
	"default",
	"none",
	"context-menu",
	"help",
	"pointer",
	"progress",
	"wait",
	"cell",
	"crosshair",
	"text",
	"vertical-text",
	"alias",
	"copy",
	"move",
	"no-drop",
	"not-allowed",
	"grab",
	"grabbing",
	"all-scroll",
	"col-resize",
	"row-resize",
	"n-resize",
	"e-resize",
	"s-resize",
	"w-resize",
	"ne-resize",
	"nw-resize",
	"se-resize",
	"sw-resize",
	"ew-resize",
	"ns-resize",
	"nesw-resize",
	"nwse-resize",
	"zoom-in",
	"zoom-out"
];
const containValues = [
	"size",
	"layout",
	"paint",
	"style"
];
const displays = [
	["inline", { display: "inline" }],
	["block", { display: "block" }],
	["inline-block", { display: "inline-block" }],
	["contents", { display: "contents" }],
	["flow-root", { display: "flow-root" }],
	["list-item", { display: "list-item" }],
	["hidden", { display: "none" }],
	[/^display-(.+)$/, ([, c]) => ({ display: h.bracket.cssvar.global(c) })]
];
const appearances = [
	["visible", { visibility: "visible" }],
	["invisible", { visibility: "hidden" }],
	["collapse", { visibility: "collapse" }],
	["backface-visible", { "backface-visibility": "visible" }],
	["backface-hidden", { "backface-visibility": "hidden" }],
	...makeGlobalStaticRules("backface", "backface-visibility")
];
const cursors = [[/^cursor-(.+)$/, ([, c]) => ({ cursor: h.bracket.cssvar.global(c) })], ...cursorValues.map((v) => [`cursor-${v}`, { cursor: v }])];
const contains = [
	[/^contain-(.*)$/, ([, d]) => {
		if (h.bracket(d) != null) return { contain: h.bracket(d).split(" ").map((e) => h.cssvar.fraction(e) ?? e).join(" ") };
		return containValues.includes(d) ? [{
			"--un-contain-size": d,
			"contain": containValues.map((i) => `var(--un-contain-${i})`).join(" ")
		}, ...containValues.map((i) => defineProperty(`--un-contain-${i}`))] : void 0;
	}],
	["contain-strict", { contain: "strict" }],
	["contain-content", { contain: "content" }],
	["contain-none", { contain: "none" }]
];
const pointerEvents = [
	["pointer-events-auto", { "pointer-events": "auto" }],
	["pointer-events-none", { "pointer-events": "none" }],
	...makeGlobalStaticRules("pointer-events")
];
const resizes = [
	["resize-x", { resize: "horizontal" }],
	["resize-y", { resize: "vertical" }],
	["resize", { resize: "both" }],
	["resize-none", { resize: "none" }],
	...makeGlobalStaticRules("resize")
];
const userSelects = [
	["select-auto", {
		"-webkit-user-select": "auto",
		"user-select": "auto"
	}],
	["select-all", {
		"-webkit-user-select": "all",
		"user-select": "all"
	}],
	["select-text", {
		"-webkit-user-select": "text",
		"user-select": "text"
	}],
	["select-none", {
		"-webkit-user-select": "none",
		"user-select": "none"
	}],
	...makeGlobalStaticRules("select", "user-select")
];
const whitespaces = [[
	/^(?:whitespace-|ws-)([-\w]+)$/,
	([, v]) => [
		"normal",
		"nowrap",
		"pre",
		"pre-line",
		"pre-wrap",
		"break-spaces",
		...globalKeywords
	].includes(v) ? { "white-space": v } : void 0,
	{ autocomplete: "(whitespace|ws)-(normal|nowrap|pre|pre-line|pre-wrap|break-spaces)" }
]];
const contentVisibility = [
	[
		/^intrinsic(?:-(block|inline|w|h))?(?:-size)?-(.+)$/,
		([, d, s]) => {
			return { [`contain-intrinsic-${{
				block: "block-size",
				inline: "inline-size",
				w: "width",
				h: "height"
			}[d] ?? "size"}`]: h.bracket.cssvar.global.fraction.rem(s) };
		},
		{ autocomplete: [
			"intrinsic-size-<num>",
			"intrinsic-<num>",
			"intrinsic-(block|inline|w|h)-<num>"
		] }
	],
	["content-visibility-visible", { "content-visibility": "visible" }],
	["content-visibility-hidden", { "content-visibility": "hidden" }],
	["content-visibility-auto", { "content-visibility": "auto" }],
	...makeGlobalStaticRules("content-visibility")
];
const contents = [
	[/^content-(.+)$/, ([, v]) => {
		if (h.bracket.cssvar(v) != null) return [{
			"--un-content": h.bracket.cssvar(v),
			"content": "var(--un-content)"
		}, defineProperty("--un-content", { initialValue: "\"\"" })];
	}],
	["content-empty", { content: "\"\"" }],
	["content-none", { content: "none" }]
];
const breaks = [
	["break-normal", {
		"overflow-wrap": "normal",
		"word-break": "normal"
	}],
	["break-words", { "overflow-wrap": "break-word" }],
	["break-all", { "word-break": "break-all" }],
	["break-keep", { "word-break": "keep-all" }],
	["break-anywhere", { "overflow-wrap": "anywhere" }],
	["wrap-break-word", { "overflow-wrap": "break-word" }],
	["wrap-anywhere", { "overflow-wrap": "anywhere" }],
	["wrap-normal", { "overflow-wrap": "normal" }]
];
const textWraps = [
	["text-wrap", { "text-wrap": "wrap" }],
	["text-nowrap", { "text-wrap": "nowrap" }],
	["text-balance", { "text-wrap": "balance" }],
	["text-pretty", { "text-wrap": "pretty" }]
];
const textOverflows = [
	["truncate", {
		"overflow": "hidden",
		"text-overflow": "ellipsis",
		"white-space": "nowrap"
	}],
	["text-truncate", {
		"overflow": "hidden",
		"text-overflow": "ellipsis",
		"white-space": "nowrap"
	}],
	["text-ellipsis", { "text-overflow": "ellipsis" }],
	["text-clip", { "text-overflow": "clip" }]
];
const textTransforms = [
	["case-upper", { "text-transform": "uppercase" }],
	["case-lower", { "text-transform": "lowercase" }],
	["case-capital", { "text-transform": "capitalize" }],
	["case-normal", { "text-transform": "none" }],
	["uppercase", { "text-transform": "uppercase" }],
	["lowercase", { "text-transform": "lowercase" }],
	["capitalize", { "text-transform": "capitalize" }],
	["normal-case", { "text-transform": "none" }],
	...makeGlobalStaticRules("case", "text-transform")
];
const fontStyles = [
	["italic", { "font-style": "italic" }],
	["not-italic", { "font-style": "normal" }],
	["font-italic", { "font-style": "italic" }],
	["font-not-italic", { "font-style": "normal" }],
	["oblique", { "font-style": "oblique" }],
	["not-oblique", { "font-style": "normal" }],
	["font-oblique", { "font-style": "oblique" }],
	["font-not-oblique", { "font-style": "normal" }]
];
const fontSmoothings = [["antialiased", {
	"-webkit-font-smoothing": "antialiased",
	"-moz-osx-font-smoothing": "grayscale"
}], ["subpixel-antialiased", {
	"-webkit-font-smoothing": "auto",
	"-moz-osx-font-smoothing": "auto"
}]];
const hyphens = [...[
	"manual",
	"auto",
	"none",
	...globalKeywords
].map((keyword) => [`hyphens-${keyword}`, {
	"-webkit-hyphens": keyword,
	"-ms-hyphens": keyword,
	"hyphens": keyword
}])];
const writingModes = [
	["write-vertical-right", { "writing-mode": "vertical-rl" }],
	["write-vertical-left", { "writing-mode": "vertical-lr" }],
	["write-normal", { "writing-mode": "horizontal-tb" }],
	...makeGlobalStaticRules("write", "writing-mode")
];
const writingOrientations = [
	["write-orient-mixed", { "text-orientation": "mixed" }],
	["write-orient-sideways", { "text-orientation": "sideways" }],
	["write-orient-upright", { "text-orientation": "upright" }],
	...makeGlobalStaticRules("write-orient", "text-orientation")
];
const screenReadersAccess = [["sr-only", {
	"position": "absolute",
	"width": "1px",
	"height": "1px",
	"padding": "0",
	"margin": "-1px",
	"overflow": "hidden",
	"clip": "rect(0,0,0,0)",
	"white-space": "nowrap",
	"border-width": 0
}], ["not-sr-only", {
	"position": "static",
	"width": "auto",
	"height": "auto",
	"padding": "0",
	"margin": "0",
	"overflow": "visible",
	"clip": "auto",
	"white-space": "normal"
}]];
const isolations = [
	["isolate", { isolation: "isolate" }],
	["isolate-auto", { isolation: "auto" }],
	["isolation-auto", { isolation: "auto" }]
];
const objectPositions = [
	["object-cover", { "object-fit": "cover" }],
	["object-contain", { "object-fit": "contain" }],
	["object-fill", { "object-fit": "fill" }],
	["object-scale-down", { "object-fit": "scale-down" }],
	["object-none", { "object-fit": "none" }],
	[
		/^object-(.+)$/,
		([, d]) => {
			if (positionMap[d]) return { "object-position": positionMap[d] };
			if (h.bracketOfPosition(d) != null) return { "object-position": h.bracketOfPosition(d).split(" ").map((e) => h.position.fraction.auto.px.cssvar(e) ?? e).join(" ") };
		},
		{ autocomplete: `object-(${Object.keys(positionMap).join("|")})` }
	]
];
const backgroundBlendModes = [
	["bg-blend-multiply", { "background-blend-mode": "multiply" }],
	["bg-blend-screen", { "background-blend-mode": "screen" }],
	["bg-blend-overlay", { "background-blend-mode": "overlay" }],
	["bg-blend-darken", { "background-blend-mode": "darken" }],
	["bg-blend-lighten", { "background-blend-mode": "lighten" }],
	["bg-blend-color-dodge", { "background-blend-mode": "color-dodge" }],
	["bg-blend-color-burn", { "background-blend-mode": "color-burn" }],
	["bg-blend-hard-light", { "background-blend-mode": "hard-light" }],
	["bg-blend-soft-light", { "background-blend-mode": "soft-light" }],
	["bg-blend-difference", { "background-blend-mode": "difference" }],
	["bg-blend-exclusion", { "background-blend-mode": "exclusion" }],
	["bg-blend-hue", { "background-blend-mode": "hue" }],
	["bg-blend-saturation", { "background-blend-mode": "saturation" }],
	["bg-blend-color", { "background-blend-mode": "color" }],
	["bg-blend-luminosity", { "background-blend-mode": "luminosity" }],
	["bg-blend-normal", { "background-blend-mode": "normal" }],
	...makeGlobalStaticRules("bg-blend", "background-blend")
];
const mixBlendModes = [
	["mix-blend-multiply", { "mix-blend-mode": "multiply" }],
	["mix-blend-screen", { "mix-blend-mode": "screen" }],
	["mix-blend-overlay", { "mix-blend-mode": "overlay" }],
	["mix-blend-darken", { "mix-blend-mode": "darken" }],
	["mix-blend-lighten", { "mix-blend-mode": "lighten" }],
	["mix-blend-color-dodge", { "mix-blend-mode": "color-dodge" }],
	["mix-blend-color-burn", { "mix-blend-mode": "color-burn" }],
	["mix-blend-hard-light", { "mix-blend-mode": "hard-light" }],
	["mix-blend-soft-light", { "mix-blend-mode": "soft-light" }],
	["mix-blend-difference", { "mix-blend-mode": "difference" }],
	["mix-blend-exclusion", { "mix-blend-mode": "exclusion" }],
	["mix-blend-hue", { "mix-blend-mode": "hue" }],
	["mix-blend-saturation", { "mix-blend-mode": "saturation" }],
	["mix-blend-color", { "mix-blend-mode": "color" }],
	["mix-blend-luminosity", { "mix-blend-mode": "luminosity" }],
	["mix-blend-plus-lighter", { "mix-blend-mode": "plus-lighter" }],
	["mix-blend-normal", { "mix-blend-mode": "normal" }],
	...makeGlobalStaticRules("mix-blend")
];
const dynamicViewportHeight = [
	["min-h-dvh", { "min-height": "100dvh" }],
	["min-h-svh", { "min-height": "100svh" }],
	["min-h-lvh", { "min-height": "100lvh" }],
	["h-dvh", { height: "100dvh" }],
	["h-svh", { height: "100svh" }],
	["h-lvh", { height: "100lvh" }],
	["max-h-dvh", { "max-height": "100dvh" }],
	["max-h-svh", { "max-height": "100svh" }],
	["max-h-lvh", { "max-height": "100lvh" }]
];
const accessibility = [["forced-color-adjust-auto", { "forced-color-adjust": "auto" }], ["forced-color-adjust-none", { "forced-color-adjust": "none" }]];
const fieldSizing = [["field-sizing-fixed", { "field-sizing": "fixed" }], ["field-sizing-content", { "field-sizing": "content" }]];
//#endregion
//#region src/rules/svg.ts
const svgUtilities = [
	[
		/^fill-(.+)$/,
		colorResolver("fill", "fill"),
		{ autocomplete: "fill-$colors" }
	],
	[
		/^fill-op(?:acity)?-?(.+)$/,
		([, opacity]) => ({ "--un-fill-opacity": h.bracket.percent.cssvar(opacity) }),
		{ autocomplete: "fill-(op|opacity)-<percent>" }
	],
	["fill-none", { fill: "none" }],
	[/^stroke-(?:width-|size-)?(.+)$/, handleWidth],
	[
		/^stroke-dash-(.+)$/,
		([, s]) => ({ "stroke-dasharray": h.bracket.cssvar.number(s) }),
		{ autocomplete: "stroke-dash-<num>" }
	],
	[/^stroke-offset-(.+)$/, ([, s]) => ({ "stroke-dashoffset": h.bracket.cssvar.px.numberWithUnit(s) })],
	[
		/^stroke-(.+)$/,
		handleColorOrWidth,
		{ autocomplete: "stroke-$colors" }
	],
	[
		/^stroke-op(?:acity)?-?(.+)$/,
		([, opacity]) => ({ "--un-stroke-opacity": h.bracket.percent.cssvar(opacity) }),
		{ autocomplete: "stroke-(op|opacity)-<percent>" }
	],
	["stroke-cap-square", { "stroke-linecap": "square" }],
	["stroke-cap-round", { "stroke-linecap": "round" }],
	["stroke-cap-auto", { "stroke-linecap": "butt" }],
	["stroke-join-arcs", { "stroke-linejoin": "arcs" }],
	["stroke-join-bevel", { "stroke-linejoin": "bevel" }],
	["stroke-join-clip", { "stroke-linejoin": "miter-clip" }],
	["stroke-join-round", { "stroke-linejoin": "round" }],
	["stroke-join-auto", { "stroke-linejoin": "miter" }],
	["stroke-none", { stroke: "none" }]
];
function handleWidth([, b]) {
	return { "stroke-width": h.bracket.cssvar.fraction.px.number(b) };
}
function handleColorOrWidth(match, ctx) {
	if (isCSSMathFn(h.bracket(match[1]))) return handleWidth(match);
	return colorResolver("stroke", "stroke")(match, ctx);
}
//#endregion
//#region src/rules/table.ts
const tables = [
	["inline-table", { display: "inline-table" }],
	["table", { display: "table" }],
	["table-caption", { display: "table-caption" }],
	["table-cell", { display: "table-cell" }],
	["table-column", { display: "table-column" }],
	["table-column-group", { display: "table-column-group" }],
	["table-footer-group", { display: "table-footer-group" }],
	["table-header-group", { display: "table-header-group" }],
	["table-row", { display: "table-row" }],
	["table-row-group", { display: "table-row-group" }],
	["border-collapse", { "border-collapse": "collapse" }],
	["border-separate", { "border-collapse": "separate" }],
	[
		/^border-spacing-(.+)$/,
		function* ([, s], { theme }) {
			const v = resolveValue(s, theme);
			if (v != null) {
				yield {
					"--un-border-spacing-x": v,
					"--un-border-spacing-y": v,
					"border-spacing": "var(--un-border-spacing-x) var(--un-border-spacing-y)"
				};
				for (const d of ["x", "y"]) yield defineProperty(`--un-border-spacing-${d}`, {
					syntax: "<length>",
					initialValue: "0"
				});
			}
		},
		{ autocomplete: ["border-spacing", "border-spacing-$spacing"] }
	],
	[
		/^border-spacing-([xy])-(.+)$/,
		function* ([, d, s], { theme }) {
			const v = resolveValue(s, theme);
			if (v != null) {
				yield {
					[`--un-border-spacing-${d}`]: v,
					"border-spacing": "var(--un-border-spacing-x) var(--un-border-spacing-y)"
				};
				for (const d of ["x", "y"]) yield defineProperty(`--un-border-spacing-${d}`, {
					syntax: "<length>",
					initialValue: "0"
				});
			}
		},
		{ autocomplete: ["border-spacing-(x|y)", "border-spacing-(x|y)-$spacing"] }
	],
	["caption-top", { "caption-side": "top" }],
	["caption-bottom", { "caption-side": "bottom" }],
	["table-auto", { "table-layout": "auto" }],
	["table-fixed", { "table-layout": "fixed" }],
	["table-empty-cells-visible", { "empty-cells": "show" }],
	["table-empty-cells-hidden", { "empty-cells": "hide" }]
];
function resolveValue(s, theme) {
	let v = theme.spacing?.[s];
	if (!v) {
		const num = numberResolver(s);
		if (num != null) {
			themeTracking(`spacing`);
			v = `calc(var(--spacing) * ${num})`;
		} else v = h.bracket.cssvar.global.auto.fraction.rem(s);
	}
	return v;
}
//#endregion
//#region src/rules/touch-actions.ts
const touchActionValue = "var(--un-pan-x) var(--un-pan-y) var(--un-pinch-zoom)";
const touchActionProperties = [
	"pan-x",
	"pan-y",
	"pinch-zoom"
].map((d) => defineProperty(`--un-${d}`));
const touchActions = [
	[
		/^touch-pan-(x|left|right)$/,
		function* ([, d]) {
			yield {
				"--un-pan-x": `pan-${d}`,
				"touch-action": touchActionValue
			};
			for (const p of touchActionProperties) yield p;
		},
		{ autocomplete: ["touch-pan", "touch-pan-(x|left|right|y|up|down)"] }
	],
	[/^touch-pan-(y|up|down)$/, function* ([, d]) {
		yield {
			"--un-pan-y": `pan-${d}`,
			"touch-action": touchActionValue
		};
		for (const p of touchActionProperties) yield p;
	}],
	[/^touch-pinch-zoom$/, function* () {
		yield {
			"--un-pinch-zoom": "pinch-zoom",
			"touch-action": touchActionValue
		};
		for (const p of touchActionProperties) yield p;
	}],
	["touch-auto", { "touch-action": "auto" }],
	["touch-manipulation", { "touch-action": "manipulation" }],
	["touch-none", { "touch-action": "none" }],
	...makeGlobalStaticRules("touch", "touch-action")
];
//#endregion
//#region src/rules/transform.ts
const transformValues = [
	"translate",
	"rotate",
	"scale"
];
const transformCpu = [
	"var(--un-rotate-x)",
	"var(--un-rotate-y)",
	"var(--un-rotate-z)",
	"var(--un-skew-x)",
	"var(--un-skew-y)"
].join(" ");
const transform = transformCpu;
const transformGpu = ["translateZ(0)", transformCpu].join(" ");
const transformBase = {
	"--un-rotate-x": "rotateX(0)",
	"--un-rotate-y": "rotateY(0)",
	"--un-rotate-z": "rotateZ(0)",
	"--un-skew-x": "skewX(0)",
	"--un-skew-y": "skewY(0)",
	"--un-translate-x": 0,
	"--un-translate-y": 0,
	"--un-translate-z": 0
};
const transforms = [
	[
		/^(?:transform-)?origin-(.+)$/,
		([, s]) => ({ "transform-origin": positionMap[s] ?? h.bracket.cssvar(s) }),
		{ autocomplete: [`transform-origin-(${Object.keys(positionMap).join("|")})`, `origin-(${Object.keys(positionMap).join("|")})`] }
	],
	[
		/^(transform-)?perspect(?:ive)?-(.+)$/,
		([, t, s], { theme }) => {
			let v;
			if (theme.perspective?.[s]) {
				themeTracking(`perspective`, s);
				v = generateThemeVariable("perspective", s);
			} else v = h.bracket.cssvar.px.numberWithUnit(s);
			if (v != null) {
				if (t) return {
					"--un-perspective": `perspective(${v})`,
					"transform": `var(--un-perspective) ${transform}`
				};
				return { perspective: v };
			}
		},
		{ autocomplete: [`perspective-<num>`, `perspective-$perspective`] }
	],
	[/^(?:transform-)?perspect(?:ive)?-origin-(.+)$/, ([, s]) => {
		const v = h.bracket.cssvar(s) ?? (s.length >= 3 ? positionMap[s] : void 0);
		if (v != null) return { "perspective-origin": v };
	}],
	[/^(?:transform-)?translate-()(.+)$/, handleTranslate],
	[/^(?:transform-)?translate-([xyz])-(.+)$/, handleTranslate],
	[/^(?:transform-)?rotate-()(.+)$/, handleRotate],
	[/^(?:transform-)?rotate-([xyz])-(.+)$/, handleRotate],
	[/^(?:transform-)?skew-()(.+)$/, handleSkew],
	[
		/^(?:transform-)?skew-([xy])-(.+)$/,
		handleSkew,
		{ autocomplete: ["transform-skew-(x|y)-<percent>", "skew-(x|y)-<percent>"] }
	],
	[/^(?:transform-)?scale-()(.+)$/, handleScale],
	[
		/^(?:transform-)?scale-([xyz])-(.+)$/,
		handleScale,
		{ autocomplete: [
			`transform-(${transformValues.join("|")})-<percent>`,
			`transform-(${transformValues.join("|")})-(x|y|z)-<percent>`,
			`(${transformValues.join("|")})-<percent>`,
			`(${transformValues.join("|")})-(x|y|z)-<percent>`
		] }
	],
	["transform-3d", { "transform-style": "preserve-3d" }],
	["transform-flat", { "transform-style": "flat" }],
	[/^transform-(border|content|fill|stroke|view)$/, ([, d]) => ({ "transform-box": `${d}-box` })],
	["transform", { transform }],
	["transform-cpu", { transform: transformCpu }],
	["transform-gpu", { transform: transformGpu }],
	["transform-none", { transform: "none" }],
	...makeGlobalStaticRules("transform")
];
function handleTranslate([, d, b]) {
	const v = numberResolver(b) ?? h.bracket.cssvar.none.fraction.rem(b);
	if (v != null) {
		if (v === "none") return { translate: "none" };
		themeTracking(`spacing`);
		return [[...transformXYZ(d, typeof v === "number" ? `calc(var(--spacing) * ${v})` : v, "translate"), [
			"translate",
			`var(--un-translate-x) var(--un-translate-y)${d === "z" ? " var(--un-translate-z)" : ""}`,
			CONTROL_NO_NEGATIVE
		]], ...[
			"x",
			"y",
			"z"
		].map((d) => defineProperty(`--un-translate-${d}`, { initialValue: 0 }))];
	}
}
function handleScale([, d, b]) {
	const v = h.bracket.cssvar.none.fraction.percent(b);
	if (v != null) {
		if (v === "none") return { scale: "none" };
		return [[...transformXYZ(d, v, "scale"), ["scale", `var(--un-scale-x) var(--un-scale-y)${d === "z" ? " var(--un-scale-z)" : ""}`]], ...[
			"x",
			"y",
			"z"
		].map((d) => defineProperty(`--un-scale-${d}`, { initialValue: 1 }))];
	}
}
function handleRotate([, d = "", b]) {
	const v = h.bracket.cssvar.none.degree(b);
	if (v != null) {
		if (v === "none") return { rotate: "none" };
		if (d) return [
			[...transformXYZ(d, v.endsWith("deg") ? `rotate${d.toUpperCase()}(${v})` : v, "rotate"), ["transform", transform]],
			...[
				"x",
				"y",
				"z"
			].map((d) => defineProperty(`--un-rotate-${d}`, { initialValue: `rotate${d.toUpperCase()}(0)` })),
			...["x", "y"].map((d) => defineProperty(`--un-skew-${d}`, { initialValue: `skew${d.toUpperCase()}(0)` }))
		];
		else return { rotate: h.bracket.cssvar.degree(b) };
	}
}
function handleSkew([, d, b]) {
	const v = h.bracket.cssvar.degree(b);
	const ds = xyzMap[d];
	if (v != null && ds) return [
		[...ds.map((_d) => [`--un-skew${_d}`, v.endsWith("deg") ? `skew${_d.slice(1).toUpperCase()}(${v})` : v]), ["transform", transform]],
		...[
			"x",
			"y",
			"z"
		].map((d) => defineProperty(`--un-rotate-${d}`, { initialValue: `rotate${d.toUpperCase()}(0)` })),
		...["x", "y"].map((d) => defineProperty(`--un-skew-${d}`, { initialValue: `skew${d.toUpperCase()}(0)` }))
	];
}
function transformXYZ(d, v, name) {
	const values = v.split(splitComma);
	if (d || !d && values.length === 1) return xyzMap[d].map((i) => [`--un-${name}${i}`, v]);
	return values.map((v, i) => [`--un-${name}-${xyzArray[i]}`, v]);
}
//#endregion
//#region src/rules/transition.ts
function resolveTransitionProperty(prop, theme) {
	let p;
	if (h.cssvar(prop) != null) p = h.cssvar(prop);
	else {
		if (prop.startsWith("[") && prop.endsWith("]")) prop = prop.slice(1, -1);
		const props = prop.split(",").map((p) => theme.property?.[p] ?? h.properties(p));
		if (props.every(Boolean)) p = props.join(",");
	}
	return p;
}
const transitions = [
	[/^transition(?:-(\D+?))?(?:-(\d+))?$/, ([, prop, d], { theme }) => {
		themeTracking("default", ["transition", "timingFunction"]);
		themeTracking("default", ["transition", "duration"]);
		const defaultTransition = {
			"transition-property": theme.property?.DEFAULT,
			"transition-timing-function": `var(--un-ease, ${generateThemeVariable("default", ["transition", "timingFunction"])})`,
			"transition-duration": `var(--un-duration, ${generateThemeVariable("default", ["transition", "duration"])})`
		};
		if (!prop && !d) return { ...defaultTransition };
		else if (prop != null) {
			const p = resolveTransitionProperty(prop, theme);
			if (p) return {
				"--un-duration": d && h.time(d),
				...defaultTransition,
				"transition-property": p
			};
		} else if (d != null) return {
			"--un-duration": h.time(d),
			...defaultTransition
		};
	}],
	[/^(?:transition-)?duration-(.+)$/, ([, d]) => ({
		"--un-duration": h.bracket.cssvar.time(d),
		"transition-duration": h.bracket.cssvar.time(d)
	})],
	[/^(?:transition-)?delay-(.+)$/, ([, d]) => ({ "transition-delay": h.bracket.cssvar.time(d) })],
	[
		/^(?:transition-)?ease(?:-(.+))?$/,
		([, d = "DEFAULT"], { theme }) => {
			let v;
			if (theme.ease?.[d]) {
				themeTracking("ease", d);
				v = generateThemeVariable("ease", d);
			} else v = h.bracket.cssvar(d);
			return [{
				"--un-ease": v,
				"transition-timing-function": v
			}, defineProperty("--un-ease")];
		},
		{ autocomplete: ["transition-ease-(linear|in|out|in-out)", "ease-(linear|in|out|in-out)"] }
	],
	[
		/^(?:transition-)?property-(.+)$/,
		([, v], { theme }) => {
			const p = h.global(v) || resolveTransitionProperty(v, theme);
			if (p) return { "transition-property": p };
		},
		{ autocomplete: [`transition-property-(${[...globalKeywords].join("|")})`] }
	],
	["transition-none", { transition: "none" }],
	...makeGlobalStaticRules("transition"),
	["transition-discrete", { "transition-behavior": "allow-discrete" }],
	["transition-normal", { "transition-behavior": "normal" }]
];
//#endregion
//#region src/rules/typography.ts
const fonts = [
	[
		/^text-(.+)$/,
		handleText,
		{ autocomplete: "text-$text" }
	],
	[
		/^(?:text|font)-size-(.+)$/,
		handleSize,
		{ autocomplete: "text-size-$text" }
	],
	[
		/^text-(?:color-)?(.+)$/,
		handlerColorOrSize,
		{ autocomplete: "text-$colors" }
	],
	[/^(?:color|c)-(.+)$/, colorResolver("color", "text")],
	[
		/^(?:text|color|c)-(.+)$/,
		([, v]) => globalKeywords.includes(v) ? { color: v } : void 0,
		{ autocomplete: `(text|color|c)-(${globalKeywords.join("|")})` }
	],
	[
		/^(?:text|color|c)-op(?:acity)?-?(.+)$/,
		([, opacity]) => ({ "--un-text-opacity": h.bracket.percent.cssvar(opacity) }),
		{ autocomplete: "(text|color|c)-(op|opacity)-<percent>" }
	],
	[
		/^fw-?([^-]+)$/,
		([, s], { theme }) => {
			let v;
			if (theme.fontWeight?.[s]) {
				themeTracking(`fontWeight`, s);
				v = generateThemeVariable("fontWeight", s);
			} else v = h.bracket.cssvar.global.number(s);
			return {
				"--un-font-weight": v,
				"font-weight": v
			};
		},
		{ autocomplete: ["(font|fw)-(100|200|300|400|500|600|700|800|900)", "(font|fw)-$fontWeight"] }
	],
	[
		/^(?:font-)?(?:leading|lh|line-height)-(.+)$/,
		([, s], { theme }) => {
			let v;
			if (theme.leading?.[s]) {
				themeTracking("leading", s);
				v = generateThemeVariable("leading", s);
			} else if (numberResolver(s)) {
				themeTracking("spacing");
				v = `calc(var(--spacing) * ${numberResolver(s)})`;
			} else v = h.bracket.cssvar.global.rem(s);
			if (v != null) return [{
				"--un-leading": v,
				"line-height": v
			}, defineProperty("--un-leading")];
		},
		{ autocomplete: "(leading|lh|line-height)-$leading" }
	],
	["font-synthesis-weight", { "font-synthesis": "weight" }],
	["font-synthesis-style", { "font-synthesis": "style" }],
	["font-synthesis-small-caps", { "font-synthesis": "small-caps" }],
	["font-synthesis-none", { "font-synthesis": "none" }],
	[/^font-synthesis-(.+)$/, ([, s]) => ({ "font-synthesis": h.bracket.cssvar.global(s) })],
	[
		/^(?:font-)?tracking-(.+)$/,
		([, s], { theme }) => {
			let v;
			if (theme.tracking?.[s]) {
				themeTracking(`tracking`, s);
				v = generateThemeVariable("tracking", s);
			} else v = h.bracket.cssvar.global.rem(s);
			return {
				"--un-tracking": v,
				"letter-spacing": v
			};
		},
		{ autocomplete: "tracking-$tracking" }
	],
	[
		/^(?:font-)?word-spacing-(.+)$/,
		([, s], { theme }) => {
			const v = theme.tracking?.[s] ? generateThemeVariable("tracking", s) : h.bracket.cssvar.global.rem(s);
			return {
				"--un-word-spacing": v,
				"word-spacing": v
			};
		},
		{ autocomplete: "word-spacing-$spacing" }
	],
	["font-stretch-normal", { "font-stretch": "normal" }],
	["font-stretch-ultra-condensed", { "font-stretch": "ultra-condensed" }],
	["font-stretch-extra-condensed", { "font-stretch": "extra-condensed" }],
	["font-stretch-condensed", { "font-stretch": "condensed" }],
	["font-stretch-semi-condensed", { "font-stretch": "semi-condensed" }],
	["font-stretch-semi-expanded", { "font-stretch": "semi-expanded" }],
	["font-stretch-expanded", { "font-stretch": "expanded" }],
	["font-stretch-extra-expanded", { "font-stretch": "extra-expanded" }],
	["font-stretch-ultra-expanded", { "font-stretch": "ultra-expanded" }],
	[
		/^font-stretch-(.+)$/,
		([, s]) => ({ "font-stretch": h.bracket.cssvar.fraction.global(s) }),
		{ autocomplete: "font-stretch-<percentage>" }
	],
	[
		/^font-(.+)$/,
		([, d], { theme }) => {
			let v;
			if (theme.font?.[d]) {
				themeTracking("font", d);
				v = generateThemeVariable("font", d);
				return { "font-family": v };
			}
			if (theme.fontWeight?.[d]) {
				themeTracking("fontWeight", d);
				v = generateThemeVariable("fontWeight", d);
				return {
					"--un-font-weight": v,
					"font-weight": v
				};
			}
			v = h.number(d);
			if (v != null) return {
				"--un-font-weight": v,
				"font-weight": v
			};
			v = h.bracketOfFamily(d);
			if (v != null && h.number(v) == null) {
				v = h.cssvar(v) ?? v;
				return { "font-family": v };
			}
			v = h.bracketOfNumber(d);
			if (v != null) {
				v = h.cssvar.number(v);
				return {
					"--un-font-weight": v,
					"font-weight": v
				};
			}
			v = h.bracket(d);
			if (v != null && h.number(v) != null) {
				const num = h.number(v);
				return {
					"--un-font-weight": num,
					"font-weight": num
				};
			}
			v = h.bracket.cssvar.global(d);
			if (v != null) return { "font-family": v };
		},
		{ autocomplete: ["font-$font", "font-$fontWeight"] }
	]
];
const tabSizes = [[/^tab(?:-(.+))?$/, ([, s]) => {
	const v = h.bracket.cssvar.global.number(s || "4");
	if (v != null) return {
		"-moz-tab-size": v,
		"-o-tab-size": v,
		"tab-size": v
	};
}]];
const textIndents = [[/^indent-(.+)$/, ([, s]) => {
	let v = numberResolver(s);
	if (v != null) {
		themeTracking(`spacing`);
		return { "text-indent": `calc(var(--spacing) * ${v})` };
	}
	v = h.bracket.cssvar.auto.global.rem(s);
	if (v != null) return { "text-indent": v };
}]];
const textStrokes = [
	[
		/^text-stroke(?:-(.+))?$/,
		([, s = "DEFAULT"], { theme }) => {
			if (theme.textStrokeWidth?.[s]) themeTracking(`textStrokeWidth`, s);
			return { "-webkit-text-stroke-width": theme.textStrokeWidth?.[s] ? generateThemeVariable("textStrokeWidth", s) : h.bracket.cssvar.px(s) };
		},
		{ autocomplete: "text-stroke-$textStrokeWidth" }
	],
	[
		/^text-stroke-(.+)$/,
		colorResolver("-webkit-text-stroke-color", "text-stroke"),
		{ autocomplete: "text-stroke-$colors" }
	],
	[
		/^text-stroke-op(?:acity)?-?(.+)$/,
		([, opacity]) => ({ "--un-text-stroke-opacity": h.bracket.percent.cssvar(opacity) }),
		{ autocomplete: "text-stroke-(op|opacity)-<percent>" }
	]
];
function handleTextShadow(match, ctx) {
	const [, s] = match;
	const { theme } = ctx;
	let res = [];
	if (s) res = getStringComponents(s, "/", 2) ?? [];
	const v = theme.textShadow?.[res[0]];
	const c = s ? h.bracket.cssvar(s) : void 0;
	if ((v != null || c != null) && !hasParseableColor(c, theme)) {
		const alpha = res[1] ? h.bracket.percent.cssvar(res[1]) : void 0;
		return {
			"--un-text-shadow-opacity": alpha,
			"--un-text-shadow": colorableShadows(v || c, "--un-text-shadow-color", alpha).join(","),
			"text-shadow": "var(--un-text-shadow)"
		};
	}
	return colorResolver("--un-text-shadow-color", "text-shadow")(match, ctx) ?? { "text-shadow": h.bracket.cssvar.global(s) };
}
const textShadows = [
	[
		/^text-shadow-(.+)$/,
		handleTextShadow,
		{ autocomplete: [
			"text-shadow-$textShadow",
			"text-shadow(-color)?-$colors",
			"text-shadow(-color)?-(op|opacity)-<percent>"
		] }
	],
	[
		/^text-shadow-color-(.+)$/,
		colorResolver("--un-text-shadow-color", "text-shadow"),
		{ autocomplete: "text-shadow-color-$colors" }
	],
	[
		/^text-shadow(?:-color)?-op(?:acity)?-?(.+)$/,
		([, opacity]) => ({ "--un-text-shadow-opacity": h.bracket.percent.cssvar(opacity) }),
		{ autocomplete: "text-shadow(-color)?-(op|opacity)-<percent>" }
	]
];
const fontVariantNumericProperties = [
	defineProperty("--un-ordinal"),
	defineProperty("--un-slashed-zero"),
	defineProperty("--un-numeric-figure"),
	defineProperty("--un-numeric-spacing"),
	defineProperty("--un-numeric-fraction")
];
const baseFontVariantNumeric = { "font-variant-numeric": "var(--un-ordinal,) var(--un-slashed-zero,) var(--un-numeric-figure,) var(--un-numeric-spacing,) var(--un-numeric-fraction,)" };
const fontVariantNumeric = [
	["ordinal", [{
		"--un-ordinal": "ordinal",
		...baseFontVariantNumeric
	}, ...fontVariantNumericProperties]],
	["slashed-zero", [{
		"--un-slashed-zero": "slashed-zero",
		...baseFontVariantNumeric
	}, ...fontVariantNumericProperties]],
	["lining-nums", [{
		"--un-numeric-figure": "lining-nums",
		...baseFontVariantNumeric
	}, ...fontVariantNumericProperties]],
	["oldstyle-nums", [{
		"--un-numeric-figure": "oldstyle-nums",
		...baseFontVariantNumeric
	}, ...fontVariantNumericProperties]],
	["proportional-nums", [{
		"--un-numeric-spacing": "proportional-nums",
		...baseFontVariantNumeric
	}, ...fontVariantNumericProperties]],
	["tabular-nums", [{
		"--un-numeric-spacing": "tabular-nums",
		...baseFontVariantNumeric
	}, ...fontVariantNumericProperties]],
	["diagonal-fractions", [{
		"--un-numeric-fraction": "diagonal-fractions",
		...baseFontVariantNumeric
	}, ...fontVariantNumericProperties]],
	["stacked-fractions", [{
		"--un-numeric-fraction": "stacked-fractions",
		...baseFontVariantNumeric
	}, ...fontVariantNumericProperties]],
	["normal-nums", [{ "font-variant-numeric": "normal" }]]
];
function handleText([, s = "base"], { theme }) {
	const split = splitShorthand(s, "length");
	if (!split) return;
	const [size, leading] = split;
	const sizePairs = theme.text?.[size];
	let lineHeight;
	if (leading) if (theme.leading?.[leading]) {
		themeTracking(`leading`, leading);
		lineHeight = generateThemeVariable("leading", leading);
	} else lineHeight = h.bracket.cssvar.global.rem(leading);
	if (sizePairs) {
		themeTracking(`text`, [size, "fontSize"]);
		themeTracking(`text`, [size, "lineHeight"]);
		if (sizePairs.letterSpacing) themeTracking(`text`, [size, "letterSpacing"]);
		return {
			"font-size": generateThemeVariable("text", [size, "fontSize"]),
			"line-height": lineHeight ?? `var(--un-leading, ${generateThemeVariable("text", [size, "lineHeight"])})`,
			"letter-spacing": sizePairs.letterSpacing ? generateThemeVariable("text", [size, "letterSpacing"]) : void 0
		};
	}
	const fontSize = h.bracketOfLength.rem(size);
	if (lineHeight && fontSize) return {
		"font-size": fontSize,
		"line-height": lineHeight
	};
	return { "font-size": h.bracketOfLength.rem(s) };
}
function handleSize([, s], { theme }) {
	if (theme.text?.[s] != null) {
		themeTracking(`text`, [s, "fontSize"]);
		themeTracking(`text`, [s, "lineHeight"]);
		return {
			"font-size": generateThemeVariable("text", [s, "fontSize"]),
			"line-height": `var(--un-leading, ${generateThemeVariable("text", [s, "lineHeight"])})`
		};
	} else {
		const d = h.bracket.cssvar.global.rem(s);
		if (d) return { "font-size": d };
	}
}
function handlerColorOrSize(match, ctx) {
	if (isCSSMathFn(h.bracket(match[1]))) return handleSize(match, ctx);
	return colorResolver("color", "text")(match, ctx);
}
function splitShorthand(body, type) {
	const [front, rest] = getStringComponent(body, "[", "]", ["/", ":"]) ?? [];
	if (front != null) {
		const match = (front.match(bracketTypeRe) ?? [])[1];
		if (match == null || match === type) return [front, rest];
	}
}
//#endregion
//#region src/rules/variables.ts
const variablesAbbrMap = {
	"backface": "backface-visibility",
	"break": "word-break",
	"case": "text-transform",
	"content": "align-content",
	"fw": "font-weight",
	"items": "align-items",
	"justify": "justify-content",
	"select": "user-select",
	"self": "align-self",
	"vertical": "vertical-align",
	"visible": "visibility",
	"whitespace": "white-space",
	"ws": "white-space",
	"bg-blend": "background-blend-mode",
	"bg-clip": "-webkit-background-clip",
	"bg-image": "background-image",
	"bg-origin": "background-origin",
	"bg-position": "background-position",
	"bg-repeat": "background-repeat",
	"bg-size": "background-size",
	"mix-blend": "mix-blend-mode",
	"object": "object-fit",
	"object-position": "object-position",
	"write": "writing-mode",
	"write-orient": "text-orientation"
};
const cssVariables = [[/^(.+?)-(\$.+)$/, ([, name, varname]) => {
	const prop = variablesAbbrMap[name];
	if (prop) return { [prop]: h.cssvar(varname) };
}]];
const cssProperty = [[/^\[(.*)\]$/, ([_, body], { theme }) => {
	if (!body.includes(":")) return;
	const [prop, ...rest] = body.split(":");
	const value = rest.join(":");
	if (!isURI(body) && /^[\w-]+$/.test(prop) && isValidCSSBody(value)) {
		const parsed = h.bracket(`[${value}]`, theme);
		if (parsed) return { [prop]: parsed };
	}
}]];
function isValidCSSBody(body) {
	let i = 0;
	function findUntil(c) {
		while (i < body.length) {
			i += 1;
			if (body[i] === c) return true;
		}
		return false;
	}
	for (i = 0; i < body.length; i++) {
		const c = body[i];
		if ("\"`'".includes(c)) {
			if (!findUntil(c)) return false;
		} else if (c === "(") {
			if (!findUntil(")")) return false;
		} else if ("[]{}:".includes(c)) return false;
	}
	return true;
}
function isURI(declaration) {
	if (!declaration.includes("://")) return false;
	try {
		return new URL(declaration).host !== "";
	} catch {
		return false;
	}
}
//#endregion
//#region src/rules/view-transition.ts
const viewTransition = [[/^view-transition-([\w-]+)$/, ([, name]) => {
	return { "view-transition-name": name };
}]];
//#endregion
//#region src/rules/default.ts
const rules = [
	fonts,
	tabSizes,
	textIndents,
	textStrokes,
	textShadows,
	margins,
	paddings,
	textAligns,
	verticalAligns,
	appearance,
	outline,
	willChange,
	listStyle,
	accents,
	carets,
	imageRenderings,
	overscrolls,
	outline,
	scrollBehaviors,
	willChange,
	borders,
	bgColors,
	opacity,
	colorScheme,
	container,
	containerParent,
	textDecorations,
	flex,
	gaps,
	grids,
	sizes,
	aspectRatio,
	displays,
	appearances,
	cursors,
	contains,
	pointerEvents,
	resizes,
	userSelects,
	whitespaces,
	contentVisibility,
	contents,
	breaks,
	textWraps,
	textOverflows,
	textTransforms,
	fontStyles,
	fontSmoothings,
	rings,
	boxShadows,
	transforms,
	transitions,
	cssVariables,
	cssProperty,
	alignments,
	boxSizing,
	flexGridJustifiesAlignments,
	floats,
	insets,
	justifies,
	orders,
	placements,
	positions,
	zIndexes,
	overflows,
	svgUtilities,
	animations,
	backgroundStyles,
	hyphens,
	writingModes,
	writingOrientations,
	accessibility,
	screenReadersAccess,
	isolations,
	objectPositions,
	backgroundBlendModes,
	mixBlendModes,
	dynamicViewportHeight,
	masks,
	columns,
	filters,
	lineClamps,
	placeholders,
	scrolls,
	tables,
	touchActions,
	fontVariantNumeric,
	viewTransition,
	spaces,
	divides,
	fieldSizing,
	questionMark
].flat();
//#endregion
export { accents, accessibility, alignments, animations, appearance, appearances, aspectRatio, backgroundBlendModes, backgroundStyles, bgColors, borderStyles, borders, boxShadows, boxSizing, breaks, carets, colorScheme, columns, container, containerParent, containerShortcuts, contains, contentVisibility, contents, cssProperty, cssVariables, cursors, displays, divides, dynamicViewportHeight, fieldSizing, filters, flex, flexGridJustifiesAlignments, floats, fontSmoothings, fontStyles, fontVariantNumeric, fonts, gaps, grids, handlerBorderStyle, hyphens, imageRenderings, insets, isolations, justifies, lineClamps, listStyle, margins, masks, mixBlendModes, notLastChildSelectorVariant, objectPositions, opacity, orders, outline, overflows, overscrolls, paddings, placeholders, placements, pointerEvents, positions, questionMark, resizes, rings, rules, screenReadersAccess, scrollBehaviors, scrolls, shadowProperties, sizes, spaces, splitShorthand, svgUtilities, tabSizes, tables, textAligns, textDecorations, textIndents, textOverflows, textShadows, textStrokes, textTransforms, textWraps, touchActions, transformBase, transforms, transitions, userSelects, verticalAligns, viewTransition, whitespaces, willChange, writingModes, writingOrientations, zIndexes };
