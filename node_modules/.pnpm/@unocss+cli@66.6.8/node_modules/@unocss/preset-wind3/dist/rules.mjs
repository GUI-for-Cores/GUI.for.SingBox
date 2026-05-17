import { n as containerShortcuts, t as container } from "./container-SVSSaqGJ.mjs";
import { colorResolver, colorableShadows, directionMap, directionSize, globalKeywords, h, makeGlobalStaticRules, parseColor, positionMap } from "@unocss/preset-mini/utils";
import { colorOpacityToString, colorToString } from "@unocss/rule-utils";
import * as _ from "@unocss/preset-mini/rules";
import { borderStyles, varEmpty } from "@unocss/preset-mini/rules";
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
		{ autocomplete: ["animate-duration", "animate-duration-$duration"] }
	],
	[
		/^animate-delay-(.+)$/,
		([, d], { theme }) => ({ "animation-delay": theme.duration?.[d || "DEFAULT"] ?? h.bracket.cssvar.time(d) }),
		{ autocomplete: ["animate-delay", "animate-delay-$duration"] }
	],
	[
		/^animate-ease(?:-(.+))?$/,
		([, d], { theme }) => ({ "animation-timing-function": theme.easing?.[d || "DEFAULT"] ?? h.bracket.cssvar(d) }),
		{ autocomplete: ["animate-ease", "animate-ease-$easing"] }
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
function bgGradientToValue(cssColor) {
	if (cssColor) return colorToString(cssColor, 0);
	return "rgb(255 255 255 / 0)";
}
function bgGradientColorValue(mode, cssColor, color, alpha) {
	if (cssColor) if (alpha != null) return colorToString(cssColor, alpha);
	else return colorToString(cssColor, `var(--un-${mode}-opacity, ${colorOpacityToString(cssColor)})`);
	return colorToString(color, alpha);
}
function bgGradientColorResolver() {
	return ([, mode, body], { theme }) => {
		const data = parseColor(body, theme, "backgroundColor");
		if (!data) return;
		const { alpha, color, cssColor } = data;
		if (!color) return;
		const colorString = bgGradientColorValue(mode, cssColor, color, alpha);
		switch (mode) {
			case "from": return {
				"--un-gradient-from-position": "0%",
				"--un-gradient-from": `${colorString} var(--un-gradient-from-position)`,
				"--un-gradient-to-position": "100%",
				"--un-gradient-to": `${bgGradientToValue(cssColor)} var(--un-gradient-to-position)`,
				"--un-gradient-stops": "var(--un-gradient-from), var(--un-gradient-to)"
			};
			case "via": return {
				"--un-gradient-via-position": "50%",
				"--un-gradient-to": bgGradientToValue(cssColor),
				"--un-gradient-stops": `var(--un-gradient-from), ${colorString} var(--un-gradient-via-position), var(--un-gradient-to)`
			};
			case "to": return {
				"--un-gradient-to-position": "100%",
				"--un-gradient-to": `${colorString} var(--un-gradient-to-position)`
			};
		}
	};
}
function bgGradientPositionResolver() {
	return ([, mode, body]) => {
		return { [`--un-gradient-${mode}-position`]: `${Number(h.bracket.cssvar.percent(body)) * 100}%` };
	};
}
const backgroundStyles = [
	[
		/^bg-gradient-(.+)$/,
		([, d]) => ({ "--un-gradient": h.bracket(d) }),
		{ autocomplete: [
			"bg-gradient",
			"bg-gradient-(from|to|via)",
			"bg-gradient-(from|to|via)-$colors",
			"bg-gradient-(from|to|via)-(op|opacity)",
			"bg-gradient-(from|to|via)-(op|opacity)-<percent>"
		] }
	],
	[/^(?:bg-gradient-)?stops-(\[.+\])$/, ([, s]) => ({ "--un-gradient-stops": h.bracket(s) })],
	[/^(?:bg-gradient-)?(from)-(.+)$/, bgGradientColorResolver()],
	[/^(?:bg-gradient-)?(via)-(.+)$/, bgGradientColorResolver()],
	[/^(?:bg-gradient-)?(to)-(.+)$/, bgGradientColorResolver()],
	[/^(?:bg-gradient-)?(from|via|to)-op(?:acity)?-?(.+)$/, ([, position, opacity]) => ({ [`--un-${position}-opacity`]: h.bracket.percent(opacity) })],
	[/^(from|via|to)-([\d.]+)%$/, bgGradientPositionResolver()],
	[
		/^bg-gradient-((?:repeating-)?(?:linear|radial|conic))$/,
		([, s]) => ({ "background-image": `${s}-gradient(var(--un-gradient, var(--un-gradient-stops, rgb(255 255 255 / 0))))` }),
		{ autocomplete: [
			"bg-gradient-repeating",
			"bg-gradient-(linear|radial|conic)",
			"bg-gradient-repeating-(linear|radial|conic)"
		] }
	],
	[
		/^bg-gradient-to-([rltb]{1,2})$/,
		([, d]) => {
			if (d in positionMap) return {
				"--un-gradient-shape": `to ${positionMap[d]} in oklch`,
				"--un-gradient": "var(--un-gradient-shape), var(--un-gradient-stops)",
				"background-image": "linear-gradient(var(--un-gradient))"
			};
		},
		{ autocomplete: `bg-gradient-to-(${Object.keys(positionMap).filter((k) => k.length <= 2 && Array.from(k).every((c) => "rltb".includes(c))).join("|")})` }
	],
	[
		/^(?:bg-gradient-)?shape-(.+)$/,
		([, d]) => {
			const v = d in positionMap ? `to ${positionMap[d]}` : h.bracket(d);
			if (v != null) return {
				"--un-gradient-shape": `${v} in oklch`,
				"--un-gradient": "var(--un-gradient-shape), var(--un-gradient-stops)"
			};
		},
		{ autocomplete: [
			"bg-gradient-shape",
			`bg-gradient-shape-(${Object.keys(positionMap).join("|")})`,
			`shape-(${Object.keys(positionMap).join("|")})`
		] }
	],
	["bg-none", { "background-image": "none" }],
	["box-decoration-slice", { "box-decoration-break": "slice" }],
	["box-decoration-clone", { "box-decoration-break": "clone" }],
	...makeGlobalStaticRules("box-decoration", "box-decoration-break"),
	["bg-auto", { "background-size": "auto" }],
	["bg-cover", { "background-size": "cover" }],
	["bg-contain", { "background-size": "contain" }],
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
	colorResolver("accent-color", "accent", "accentColor"),
	{ autocomplete: "accent-$colors" }
], [
	/^accent-op(?:acity)?-?(.+)$/,
	([, d]) => ({ "--un-accent-opacity": h.bracket.percent(d) }),
	{ autocomplete: ["accent-(op|opacity)", "accent-(op|opacity)-<percent>"] }
]];
const carets = [[
	/^caret-(.+)$/,
	colorResolver("caret-color", "caret", "textColor"),
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
//#region src/rules/columns.ts
const columns = [
	[
		/^columns-(.+)$/,
		([, v], { theme }) => {
			if (theme.containers && v in theme.containers) return { columns: theme.containers[v] };
			return { columns: h.bracket.numberWithUnit.number.cssvar(v) };
		},
		{ autocomplete: ["columns-<num>", "columns-$containers"] }
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
//#region src/rules/divide.ts
const divides = [
	[
		/^divide-?([xy])$/,
		handlerDivide,
		{ autocomplete: [
			"divide-(x|y|block|inline)",
			"divide-(x|y|block|inline)-reverse",
			"divide-(x|y|block|inline)-$lineWidth"
		] }
	],
	[/^divide-?([xy])-?(.+)$/, handlerDivide],
	[/^divide-?([xy])-reverse$/, ([, d]) => ({ [`--un-divide-${d}-reverse`]: 1 })],
	[/^divide-(block|inline)$/, handlerDivide],
	[/^divide-(block|inline)-(.+)$/, handlerDivide],
	[/^divide-(block|inline)-reverse$/, ([, d]) => ({ [`--un-divide-${d}-reverse`]: 1 })],
	[
		/^divide-(.+)$/,
		colorResolver("border-color", "divide", "borderColor"),
		{ autocomplete: "divide-$colors" }
	],
	[
		/^divide-op(?:acity)?-?(.+)$/,
		([, opacity]) => ({ "--un-divide-opacity": h.bracket.percent(opacity) }),
		{ autocomplete: ["divide-(op|opacity)", "divide-(op|opacity)-<percent>"] }
	],
	...borderStyles.map((style) => [`divide-${style}`, { "border-style": style }])
];
function handlerDivide([, d, s], { theme }) {
	let v = theme.lineWidth?.[s || "DEFAULT"] ?? h.bracket.cssvar.px(s || "1");
	if (v != null) {
		if (v === "0") v = "0px";
		const results = directionMap[d].map((item) => {
			return [`border${item}-width`, item.endsWith("right") || item.endsWith("bottom") ? `calc(${v} * var(--un-divide-${d}-reverse))` : `calc(${v} * calc(1 - var(--un-divide-${d}-reverse)))`];
		});
		if (results) return [[`--un-divide-${d}-reverse`, 0], ...results];
	}
}
//#endregion
//#region src/rules/filters.ts
const filterBase = {
	"--un-blur": varEmpty,
	"--un-brightness": varEmpty,
	"--un-contrast": varEmpty,
	"--un-drop-shadow": varEmpty,
	"--un-grayscale": varEmpty,
	"--un-hue-rotate": varEmpty,
	"--un-invert": varEmpty,
	"--un-saturate": varEmpty,
	"--un-sepia": varEmpty
};
const filterBaseKeys = Object.keys(filterBase);
const filterMetaCustom = { preflightKeys: filterBaseKeys };
const filterProperty = "var(--un-blur) var(--un-brightness) var(--un-contrast) var(--un-drop-shadow) var(--un-grayscale) var(--un-hue-rotate) var(--un-invert) var(--un-saturate) var(--un-sepia)";
const backdropFilterBase = {
	"--un-backdrop-blur": varEmpty,
	"--un-backdrop-brightness": varEmpty,
	"--un-backdrop-contrast": varEmpty,
	"--un-backdrop-grayscale": varEmpty,
	"--un-backdrop-hue-rotate": varEmpty,
	"--un-backdrop-invert": varEmpty,
	"--un-backdrop-opacity": varEmpty,
	"--un-backdrop-saturate": varEmpty,
	"--un-backdrop-sepia": varEmpty
};
const backdropFilterBaseKeys = Object.keys(backdropFilterBase);
const backdropMetaCustom = { preflightKeys: backdropFilterBaseKeys };
const backdropFilterProperty = "var(--un-backdrop-blur) var(--un-backdrop-brightness) var(--un-backdrop-contrast) var(--un-backdrop-grayscale) var(--un-backdrop-hue-rotate) var(--un-backdrop-invert) var(--un-backdrop-opacity) var(--un-backdrop-saturate) var(--un-backdrop-sepia)";
const composeMetaCustom = { preflightKeys: [...filterBaseKeys, ...backdropFilterBaseKeys] };
function percentWithDefault(str) {
	let v = h.bracket.cssvar(str || "");
	if (v != null) return v;
	v = str ? h.percent(str) : "1";
	if (v != null && Number.parseFloat(v) <= 1) return v;
}
function toFilter(varName, resolver) {
	return ([, b, s], { theme }) => {
		const value = resolver(s, theme) ?? (s === "none" ? "0" : "");
		if (value !== "") if (b) return {
			[`--un-${b}${varName}`]: `${varName}(${value})`,
			"-webkit-backdrop-filter": backdropFilterProperty,
			"backdrop-filter": backdropFilterProperty
		};
		else return {
			[`--un-${varName}`]: `${varName}(${value})`,
			filter: filterProperty
		};
	};
}
function dropShadowResolver([, s], { theme }) {
	let v = theme.dropShadow?.[s || "DEFAULT"];
	if (v != null) {
		const shadows = colorableShadows(v, "--un-drop-shadow-color");
		return {
			"--un-drop-shadow": `drop-shadow(${shadows.join(") drop-shadow(")})`,
			"filter": filterProperty
		};
	}
	v = h.bracket.cssvar(s);
	if (v != null) return {
		"--un-drop-shadow": `drop-shadow(${v})`,
		"filter": filterProperty
	};
}
const filters = [
	[
		/^(?:(backdrop-)|filter-)?blur(?:-(.+))?$/,
		toFilter("blur", (s, theme) => theme.blur?.[s || "DEFAULT"] || h.bracket.cssvar.px(s)),
		{
			custom: composeMetaCustom,
			autocomplete: [
				"(backdrop|filter)-blur-$blur",
				"blur-$blur",
				"filter-blur"
			]
		}
	],
	[
		/^(?:(backdrop-)|filter-)?brightness-(.+)$/,
		toFilter("brightness", (s) => h.bracket.cssvar.percent(s)),
		{
			custom: composeMetaCustom,
			autocomplete: ["(backdrop|filter)-brightness-<percent>", "brightness-<percent>"]
		}
	],
	[
		/^(?:(backdrop-)|filter-)?contrast-(.+)$/,
		toFilter("contrast", (s) => h.bracket.cssvar.percent(s)),
		{
			custom: composeMetaCustom,
			autocomplete: ["(backdrop|filter)-contrast-<percent>", "contrast-<percent>"]
		}
	],
	[
		/^(?:filter-)?drop-shadow(?:-(.+))?$/,
		dropShadowResolver,
		{
			custom: filterMetaCustom,
			autocomplete: [
				"filter-drop",
				"filter-drop-shadow",
				"filter-drop-shadow-color",
				"drop-shadow",
				"drop-shadow-color",
				"filter-drop-shadow-$dropShadow",
				"drop-shadow-$dropShadow",
				"filter-drop-shadow-color-$colors",
				"drop-shadow-color-$colors",
				"filter-drop-shadow-color-(op|opacity)",
				"drop-shadow-color-(op|opacity)",
				"filter-drop-shadow-color-(op|opacity)-<percent>",
				"drop-shadow-color-(op|opacity)-<percent>"
			]
		}
	],
	[/^(?:filter-)?drop-shadow-color-(.+)$/, colorResolver("--un-drop-shadow-color", "drop-shadow", "shadowColor")],
	[/^(?:filter-)?drop-shadow-color-op(?:acity)?-?(.+)$/, ([, opacity]) => ({ "--un-drop-shadow-opacity": h.bracket.percent(opacity) })],
	[
		/^(?:(backdrop-)|filter-)?grayscale(?:-(.+))?$/,
		toFilter("grayscale", percentWithDefault),
		{
			custom: composeMetaCustom,
			autocomplete: [
				"(backdrop|filter)-grayscale",
				"(backdrop|filter)-grayscale-<percent>",
				"grayscale-<percent>"
			]
		}
	],
	[
		/^(?:(backdrop-)|filter-)?hue-rotate-(.+)$/,
		toFilter("hue-rotate", (s) => h.bracket.cssvar.degree(s)),
		{ custom: composeMetaCustom }
	],
	[
		/^(?:(backdrop-)|filter-)?invert(?:-(.+))?$/,
		toFilter("invert", percentWithDefault),
		{
			custom: composeMetaCustom,
			autocomplete: [
				"(backdrop|filter)-invert",
				"(backdrop|filter)-invert-<percent>",
				"invert-<percent>"
			]
		}
	],
	[
		/^(backdrop-)op(?:acity)?-(.+)$/,
		toFilter("opacity", (s) => h.bracket.cssvar.percent(s)),
		{
			custom: composeMetaCustom,
			autocomplete: ["backdrop-(op|opacity)", "backdrop-(op|opacity)-<percent>"]
		}
	],
	[
		/^(?:(backdrop-)|filter-)?saturate-(.+)$/,
		toFilter("saturate", (s) => h.bracket.cssvar.percent(s)),
		{
			custom: composeMetaCustom,
			autocomplete: [
				"(backdrop|filter)-saturate",
				"(backdrop|filter)-saturate-<percent>",
				"saturate-<percent>"
			]
		}
	],
	[
		/^(?:(backdrop-)|filter-)?sepia(?:-(.+))?$/,
		toFilter("sepia", percentWithDefault),
		{
			custom: composeMetaCustom,
			autocomplete: [
				"(backdrop|filter)-sepia",
				"(backdrop|filter)-sepia-<percent>",
				"sepia-<percent>"
			]
		}
	],
	[
		"filter",
		{ filter: filterProperty },
		{ custom: filterMetaCustom }
	],
	[
		"backdrop-filter",
		{
			"-webkit-backdrop-filter": backdropFilterProperty,
			"backdrop-filter": backdropFilterProperty
		},
		{ custom: backdropMetaCustom }
	],
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
//#region src/rules/line-clamp.ts
const lineClamps = [[
	/^line-clamp-(\d+)$/,
	([, v]) => ({
		"overflow": "hidden",
		"display": "-webkit-box",
		"-webkit-box-orient": "vertical",
		"-webkit-line-clamp": v,
		"line-clamp": v
	}),
	{ autocomplete: ["line-clamp", "line-clamp-<num>"] }
], ...["none", ...globalKeywords].map((keyword) => [`line-clamp-${keyword}`, {
	"overflow": "visible",
	"display": "block",
	"-webkit-box-orient": "horizontal",
	"-webkit-line-clamp": keyword,
	"line-clamp": keyword
}])];
//#endregion
//#region src/rules/placeholder.ts
const placeholders = [[
	/^\$ placeholder-(.+)$/,
	colorResolver("color", "placeholder", "accentColor"),
	{ autocomplete: "placeholder-$colors" }
], [
	/^\$ placeholder-op(?:acity)?-?(.+)$/,
	([, opacity]) => ({ "--un-placeholder-opacity": h.bracket.percent(opacity) }),
	{ autocomplete: ["placeholder-(op|opacity)", "placeholder-(op|opacity)-<percent>"] }
]];
//#endregion
//#region src/rules/scrolls.ts
const scrollSnapTypeBase = { "--un-scroll-snap-strictness": "proximity" };
const custom$3 = { preflightKeys: Object.keys(scrollSnapTypeBase) };
const scrolls = [
	[
		/^snap-(x|y)$/,
		([, d]) => ({ "scroll-snap-type": `${d} var(--un-scroll-snap-strictness)` }),
		{
			custom: custom$3,
			autocomplete: "snap-(x|y|both)"
		}
	],
	[
		/^snap-both$/,
		() => ({ "scroll-snap-type": "both var(--un-scroll-snap-strictness)" }),
		{ custom: custom$3 }
	],
	["snap-mandatory", { "--un-scroll-snap-strictness": "mandatory" }],
	["snap-proximity", { "--un-scroll-snap-strictness": "proximity" }],
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
//#region src/rules/spacing.ts
const spaces = [
	[
		/^space-([xy])-(.+)$/,
		handlerSpace,
		{ autocomplete: [
			"space-(x|y|block|inline)",
			"space-(x|y|block|inline)-reverse",
			"space-(x|y|block|inline)-$spacing"
		] }
	],
	[/^space-([xy])-reverse$/, ([, d]) => ({ [`--un-space-${d}-reverse`]: 1 })],
	[/^space-(block|inline)-(.+)$/, handlerSpace],
	[/^space-(block|inline)-reverse$/, ([, d]) => ({ [`--un-space-${d}-reverse`]: 1 })]
];
function handlerSpace([, d, s], { theme }) {
	let v = theme.spacing?.[s || "DEFAULT"] ?? h.bracket.cssvar.auto.fraction.rem(s || "1");
	if (v != null) {
		if (v === "0") v = "0px";
		const results = directionMap[d].map((item) => {
			return [`margin${item}`, item.endsWith("right") || item.endsWith("bottom") ? `calc(${v} * var(--un-space-${d}-reverse))` : `calc(${v} * calc(1 - var(--un-space-${d}-reverse)))`];
		});
		if (results) return [[`--un-space-${d}-reverse`, 0], ...results];
	}
}
//#endregion
//#region src/rules/static.ts
const textTransforms = [
	["uppercase", { "text-transform": "uppercase" }],
	["lowercase", { "text-transform": "lowercase" }],
	["capitalize", { "text-transform": "capitalize" }],
	["normal-case", { "text-transform": "none" }]
];
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
//#endregion
//#region src/rules/table.ts
const borderSpacingBase = {
	"--un-border-spacing-x": 0,
	"--un-border-spacing-y": 0
};
const custom$2 = { preflightKeys: Object.keys(borderSpacingBase) };
const borderSpacingProperty = "var(--un-border-spacing-x) var(--un-border-spacing-y)";
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
		([, s], { theme }) => {
			const v = theme.spacing?.[s] ?? h.bracket.cssvar.global.auto.fraction.rem(s);
			if (v != null) return {
				"--un-border-spacing-x": v,
				"--un-border-spacing-y": v,
				"border-spacing": borderSpacingProperty
			};
		},
		{
			custom: custom$2,
			autocomplete: ["border-spacing", "border-spacing-$spacing"]
		}
	],
	[
		/^border-spacing-([xy])-(.+)$/,
		([, d, s], { theme }) => {
			const v = theme.spacing?.[s] ?? h.bracket.cssvar.global.auto.fraction.rem(s);
			if (v != null) return {
				[`--un-border-spacing-${d}`]: v,
				"border-spacing": borderSpacingProperty
			};
		},
		{
			custom: custom$2,
			autocomplete: ["border-spacing-(x|y)", "border-spacing-(x|y)-$spacing"]
		}
	],
	["caption-top", { "caption-side": "top" }],
	["caption-bottom", { "caption-side": "bottom" }],
	["table-auto", { "table-layout": "auto" }],
	["table-fixed", { "table-layout": "fixed" }],
	["table-empty-cells-visible", { "empty-cells": "show" }],
	["table-empty-cells-hidden", { "empty-cells": "hide" }]
];
//#endregion
//#region src/rules/touch-actions.ts
const touchActionBase = {
	"--un-pan-x": varEmpty,
	"--un-pan-y": varEmpty,
	"--un-pinch-zoom": varEmpty
};
const custom$1 = { preflightKeys: Object.keys(touchActionBase) };
const touchActionProperty = "var(--un-pan-x) var(--un-pan-y) var(--un-pinch-zoom)";
const touchActions = [
	[
		/^touch-pan-(x|left|right)$/,
		([, d]) => ({
			"--un-pan-x": `pan-${d}`,
			"touch-action": touchActionProperty
		}),
		{
			custom: custom$1,
			autocomplete: ["touch-pan", "touch-pan-(x|left|right|y|up|down)"]
		}
	],
	[
		/^touch-pan-(y|up|down)$/,
		([, d]) => ({
			"--un-pan-y": `pan-${d}`,
			"touch-action": touchActionProperty
		}),
		{ custom: custom$1 }
	],
	[
		"touch-pinch-zoom",
		{
			"--un-pinch-zoom": "pinch-zoom",
			"touch-action": touchActionProperty
		},
		{ custom: custom$1 }
	],
	["touch-auto", { "touch-action": "auto" }],
	["touch-manipulation", { "touch-action": "manipulation" }],
	["touch-none", { "touch-action": "none" }],
	...makeGlobalStaticRules("touch", "touch-action")
];
//#endregion
//#region src/rules/typography.ts
const fontVariantNumericBase = {
	"--un-ordinal": varEmpty,
	"--un-slashed-zero": varEmpty,
	"--un-numeric-figure": varEmpty,
	"--un-numeric-spacing": varEmpty,
	"--un-numeric-fraction": varEmpty
};
const custom = { preflightKeys: Object.keys(fontVariantNumericBase) };
function toEntries(entry) {
	return {
		...entry,
		"font-variant-numeric": "var(--un-ordinal) var(--un-slashed-zero) var(--un-numeric-figure) var(--un-numeric-spacing) var(--un-numeric-fraction)"
	};
}
const fontVariantNumeric = [
	[
		/^ordinal$/,
		() => toEntries({ "--un-ordinal": "ordinal" }),
		{
			custom,
			autocomplete: "ordinal"
		}
	],
	[
		/^slashed-zero$/,
		() => toEntries({ "--un-slashed-zero": "slashed-zero" }),
		{
			custom,
			autocomplete: "slashed-zero"
		}
	],
	[
		/^lining-nums$/,
		() => toEntries({ "--un-numeric-figure": "lining-nums" }),
		{
			custom,
			autocomplete: "lining-nums"
		}
	],
	[
		/^oldstyle-nums$/,
		() => toEntries({ "--un-numeric-figure": "oldstyle-nums" }),
		{
			custom,
			autocomplete: "oldstyle-nums"
		}
	],
	[
		/^proportional-nums$/,
		() => toEntries({ "--un-numeric-spacing": "proportional-nums" }),
		{
			custom,
			autocomplete: "proportional-nums"
		}
	],
	[
		/^tabular-nums$/,
		() => toEntries({ "--un-numeric-spacing": "tabular-nums" }),
		{
			custom,
			autocomplete: "tabular-nums"
		}
	],
	[
		/^diagonal-fractions$/,
		() => toEntries({ "--un-numeric-fraction": "diagonal-fractions" }),
		{
			custom,
			autocomplete: "diagonal-fractions"
		}
	],
	[
		/^stacked-fractions$/,
		() => toEntries({ "--un-numeric-fraction": "stacked-fractions" }),
		{
			custom,
			autocomplete: "stacked-fractions"
		}
	],
	["normal-nums", { "font-variant-numeric": "normal" }]
];
//#endregion
//#region src/rules/variables.ts
const variablesAbbrMap = {
	"bg-blend": "background-blend-mode",
	"bg-clip": "-webkit-background-clip",
	"bg-gradient": "linear-gradient",
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
//#endregion
//#region src/rules/view-transition.ts
const viewTransition = [[/^view-transition-([\w-]+)$/, ([, name]) => {
	return { "view-transition-name": name };
}]];
//#endregion
//#region src/rules/default.ts
const rules = [
	_.cssVariables,
	cssVariables,
	_.cssProperty,
	container,
	_.contains,
	screenReadersAccess,
	_.pointerEvents,
	_.appearances,
	_.positions,
	_.insets,
	lineClamps,
	isolations,
	_.zIndexes,
	_.orders,
	_.grids,
	_.floats,
	_.margins,
	_.boxSizing,
	_.displays,
	_.aspectRatio,
	_.sizes,
	_.flex,
	tables,
	_.transforms,
	animations,
	_.cursors,
	touchActions,
	_.userSelects,
	_.resizes,
	scrolls,
	listStyle,
	_.appearance,
	columns,
	_.placements,
	_.alignments,
	_.justifies,
	_.gaps,
	_.flexGridJustifiesAlignments,
	spaces,
	divides,
	_.overflows,
	overscrolls,
	scrollBehaviors,
	_.textOverflows,
	_.whitespaces,
	_.breaks,
	_.borders,
	_.bgColors,
	backgroundStyles,
	_.colorScheme,
	_.svgUtilities,
	objectPositions,
	_.paddings,
	_.textAligns,
	_.textIndents,
	_.textWraps,
	_.verticalAligns,
	_.fonts,
	_.textTransforms,
	textTransforms,
	_.fontStyles,
	fontVariantNumeric,
	_.textDecorations,
	_.fontSmoothings,
	_.tabSizes,
	_.textStrokes,
	_.textShadows,
	hyphens,
	writingModes,
	writingOrientations,
	carets,
	accents,
	_.opacity,
	backgroundBlendModes,
	mixBlendModes,
	_.boxShadows,
	_.outline,
	_.rings,
	imageRenderings,
	filters,
	_.transitions,
	_.willChange,
	_.contentVisibility,
	_.contents,
	placeholders,
	_.containerParent,
	viewTransition,
	dynamicViewportHeight,
	_.fieldSizing,
	_.questionMark
].flat(1);
//#endregion
export { accents, animations, backdropFilterBase, backgroundBlendModes, backgroundStyles, borderSpacingBase, carets, columns, container, containerShortcuts, cssVariables, divides, dynamicViewportHeight, filterBase, filters, fontVariantNumeric, fontVariantNumericBase, hyphens, imageRenderings, isolations, lineClamps, listStyle, mixBlendModes, objectPositions, overscrolls, placeholders, rules, screenReadersAccess, scrollBehaviors, scrollSnapTypeBase, scrolls, spaces, tables, textTransforms, touchActionBase, touchActions, viewTransition, writingModes, writingOrientations };
