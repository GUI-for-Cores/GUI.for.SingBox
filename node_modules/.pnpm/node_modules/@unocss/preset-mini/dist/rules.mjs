import { C as globalKeywords, S as directionMap, T as positionMap, a as colorableShadows, c as isCSSMathFn, d as parseColor, f as resolveBreakpoints, g as h, h as transformXYZ, i as colorResolver, l as isSize, m as splitShorthand, o as directionSize, s as hasParseableColor, u as makeGlobalStaticRules, w as insetMap, y as cornerMap } from "./utils-BtCNpQqm.mjs";
import { toArray } from "@unocss/core";
import { colorOpacityToString, colorToString } from "@unocss/rule-utils";
//#region src/_rules/align.ts
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
//#region src/_rules/behaviors.ts
const outline = [
	[
		/^outline-(?:width-|size-)?(.+)$/,
		handleWidth$3,
		{ autocomplete: "outline-(width|size)-<num>" }
	],
	[
		/^outline-(?:color-)?(.+)$/,
		handleColorOrWidth$3,
		{ autocomplete: "outline-$colors" }
	],
	[
		/^outline-offset-(.+)$/,
		([, d], { theme }) => ({ "outline-offset": theme.lineWidth?.[d] ?? h.bracket.cssvar.global.px(d) }),
		{ autocomplete: "outline-(offset)-<num>" }
	],
	["outline", { "outline-style": "solid" }],
	...[
		"auto",
		"dashed",
		"dotted",
		"double",
		"hidden",
		"solid",
		"groove",
		"ridge",
		"inset",
		"outset",
		...globalKeywords
	].map((v) => [`outline-${v}`, { "outline-style": v }]),
	["outline-none", {
		"outline": "2px solid transparent",
		"outline-offset": "2px"
	}]
];
function handleWidth$3([, b], { theme }) {
	return { "outline-width": theme.lineWidth?.[b] ?? h.bracket.cssvar.global.px(b) };
}
function handleColorOrWidth$3(match, ctx) {
	if (isCSSMathFn(h.bracket(match[1]))) return handleWidth$3(match, ctx);
	return colorResolver("outline-color", "outline-color", "borderColor")(match, ctx);
}
const appearance = [["appearance-auto", {
	"-webkit-appearance": "auto",
	"appearance": "auto"
}], ["appearance-none", {
	"-webkit-appearance": "none",
	"appearance": "none"
}]];
function willChangeProperty(prop) {
	return h.properties.auto.global(prop) ?? {
		contents: "contents",
		scroll: "scroll-position"
	}[prop];
}
const willChange = [[/^will-change-(.+)/, ([, p]) => ({ "will-change": willChangeProperty(p) })]];
//#endregion
//#region src/_rules/border.ts
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
			"(border|b)-(rounded|rd)-$borderRadius",
			"(rounded|rd)",
			"(rounded|rd)-$borderRadius"
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
function transformBorderColor(color, alpha, direction) {
	if (alpha != null) return { [`border${direction}-color`]: colorToString(color, alpha) };
	if (direction === "") {
		const object = {};
		const opacityVar = `--un-border-opacity`;
		const result = colorToString(color, `var(${opacityVar})`);
		if (result.includes(opacityVar)) object[opacityVar] = typeof color === "string" ? 1 : colorOpacityToString(color);
		object["border-color"] = result;
		return object;
	} else {
		const object = {};
		const opacityVar = "--un-border-opacity";
		const opacityDirectionVar = `--un-border${direction}-opacity`;
		const result = colorToString(color, `var(${opacityDirectionVar})`);
		if (result.includes(opacityDirectionVar)) {
			object[opacityVar] = typeof color === "string" ? 1 : colorOpacityToString(color);
			object[opacityDirectionVar] = `var(${opacityVar})`;
		}
		object[`border${direction}-color`] = result;
		return object;
	}
}
function borderColorResolver(direction) {
	return ([, body], theme) => {
		const data = parseColor(body, theme, "borderColor");
		if (!data) return;
		const { alpha, color, cssColor } = data;
		if (cssColor) return transformBorderColor(cssColor, alpha, direction);
		else if (color) return transformBorderColor(color, alpha, direction);
	};
}
function handlerBorderSize([, a = "", b], { theme }) {
	const v = theme.lineWidth?.[b || "DEFAULT"] ?? h.bracket.cssvar.global.px(b || "1");
	if (a in directionMap && v != null) return directionMap[a].map((i) => [`border${i}-width`, v]);
}
function handlerBorderColorOrSize([, a = "", b], ctx) {
	if (a in directionMap) {
		if (isCSSMathFn(h.bracket(b))) return handlerBorderSize([
			"",
			a,
			b
		], ctx);
		if (hasParseableColor(b, ctx.theme, "borderColor")) return Object.assign({}, ...directionMap[a].map((i) => borderColorResolver(i)(["", b], ctx.theme)));
	}
}
function handlerBorderOpacity([, a = "", opacity]) {
	const v = h.bracket.percent.cssvar(opacity);
	if (a in directionMap && v != null) return directionMap[a].map((i) => [`--un-border${i}-opacity`, v]);
}
function handlerRounded([, a = "", s], { theme }) {
	const v = theme.borderRadius?.[s || "DEFAULT"] || h.bracket.cssvar.global.fraction.rem(s || "1");
	if (a in cornerMap && v != null) return cornerMap[a].map((i) => [`border${i}-radius`, v]);
}
function handlerBorderStyle([, a = "", s]) {
	if (borderStyles.includes(s) && a in directionMap) return directionMap[a].map((i) => [`border${i}-style`, s]);
}
//#endregion
//#region src/_rules/color.ts
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
		return colorResolver("background-color", "bg", "backgroundColor")(...args);
	},
	{ autocomplete: "bg-$colors" }
], [
	/^bg-op(?:acity)?-?(.+)$/,
	([, opacity]) => ({ "--un-bg-opacity": h.bracket.percent.cssvar(opacity) }),
	{ autocomplete: "bg-(op|opacity)-<percent>" }
]];
const colorScheme = [[/^color-scheme-(\w+)$/, ([, v]) => ({ "color-scheme": v })]];
//#endregion
//#region src/_rules/container.ts
const containerParent = [[/^@container(?:\/(\w+))?(?:-(normal|inline-size|size))?$/, ([, l, v]) => {
	return {
		"container-type": v ?? "inline-size",
		"container-name": l
	};
}]];
//#endregion
//#region src/_rules/decoration.ts
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
		handleWidth$2,
		{ autocomplete: "(underline|decoration)-<num>" }
	],
	[
		/^(?:underline|decoration)-(auto|from-font)$/,
		([, s]) => ({ "text-decoration-thickness": s }),
		{ autocomplete: "(underline|decoration)-(auto|from-font)" }
	],
	[
		/^(?:underline|decoration)-(.+)$/,
		handleColorOrWidth$2,
		{ autocomplete: "(underline|decoration)-$colors" }
	],
	[
		/^(?:underline|decoration)-op(?:acity)?-?(.+)$/,
		([, opacity]) => ({ "--un-line-opacity": h.bracket.percent.cssvar(opacity) }),
		{ autocomplete: "(underline|decoration)-(op|opacity)-<percent>" }
	],
	[
		/^(?:underline|decoration)-offset-(.+)$/,
		([, s], { theme }) => ({ "text-underline-offset": theme.lineWidth?.[s] ?? h.auto.bracket.cssvar.global.px(s) }),
		{ autocomplete: "(underline|decoration)-(offset)-<num>" }
	],
	...decorationStyles.map((v) => [`underline-${v}`, { "text-decoration-style": v }]),
	...decorationStyles.map((v) => [`decoration-${v}`, { "text-decoration-style": v }]),
	["no-underline", { "text-decoration": "none" }],
	["decoration-none", { "text-decoration": "none" }]
];
function handleWidth$2([, b], { theme }) {
	return { "text-decoration-thickness": theme.lineWidth?.[b] ?? h.bracket.cssvar.global.px(b) };
}
function handleColorOrWidth$2(match, ctx) {
	if (isCSSMathFn(h.bracket(match[1]))) return handleWidth$2(match, ctx);
	const result = colorResolver("text-decoration-color", "line", "borderColor")(match, ctx);
	if (result) return {
		"-webkit-text-decoration-color": result["text-decoration-color"],
		...result
	};
}
//#endregion
//#region src/_rules/flex.ts
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
		([, d], { theme }) => ({ "flex-basis": theme.spacing?.[d] ?? h.bracket.cssvar.auto.fraction.rem(d) }),
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
//#region src/_rules/gap.ts
const directions = {
	"": "",
	"x": "column-",
	"y": "row-",
	"col": "column-",
	"row": "row-"
};
function handleGap([, d = "", s], { theme }) {
	const v = theme.spacing?.[s] ?? h.bracket.cssvar.global.rem(s);
	if (v != null) return { [`${directions[d]}gap`]: v };
}
const gaps = [
	[
		/^(?:flex-|grid-)?gap-?()(.+)$/,
		handleGap,
		{ autocomplete: ["gap-$spacing", "gap-<num>"] }
	],
	[
		/^(?:flex-|grid-)?gap-([xy])-?(.+)$/,
		handleGap,
		{ autocomplete: ["gap-(x|y)-$spacing", "gap-(x|y)-<num>"] }
	],
	[
		/^(?:flex-|grid-)?gap-(col|row)-?(.+)$/,
		handleGap,
		{ autocomplete: ["gap-(col|row)-$spacing", "gap-(col|row)-<num>"] }
	]
];
//#endregion
//#region src/_rules/grid.ts
function rowCol(s) {
	return s.replace("col", "column");
}
function rowColTheme(s) {
	return s[0] === "r" ? "Row" : "Column";
}
function autoDirection(c, theme, prop) {
	const v = theme[`gridAuto${rowColTheme(c)}`]?.[prop];
	if (v != null) return v;
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
	[/^(?:grid-)?(row|col)-(.+)$/, ([, c, v], { theme }) => ({ [`grid-${rowCol(c)}`]: theme[`grid${rowColTheme(c)}`]?.[v] ?? h.bracket.cssvar.auto(v) })],
	[
		/^(?:grid-)?(row|col)-span-(.+)$/,
		([, c, s]) => {
			if (s === "full") return { [`grid-${rowCol(c)}`]: "1/-1" };
			const v = h.bracket.number(s);
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
		([, c, v], { theme }) => ({ [`grid-auto-${rowCol(c)}`]: autoDirection(c, theme, v) }),
		{ autocomplete: "(grid-auto|auto)-(rows|cols)-<num>" }
	],
	[/^(?:grid-auto-flow|auto-flow|grid-flow)-(.+)$/, ([, v]) => ({ "grid-auto-flow": h.bracket.cssvar(v) })],
	[
		/^(?:grid-auto-flow|auto-flow|grid-flow)-(row|col|dense|row-dense|col-dense)$/,
		([, v]) => ({ "grid-auto-flow": rowCol(v).replace("-", " ") }),
		{ autocomplete: ["(grid-auto-flow|auto-flow|grid-flow)-(row|col|dense|row-dense|col-dense)"] }
	],
	[/^(?:grid-)?(rows|cols)-(.+)$/, ([, c, v], { theme }) => ({ [`grid-template-${rowCol(c)}`]: theme[`gridTemplate${rowColTheme(c)}`]?.[v] ?? h.bracket.cssvar(v) })],
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
//#region src/_rules/layout.ts
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
//#region src/_rules/position.ts
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
	["order-first", { order: "-9999" }],
	["order-last", { order: "9999" }],
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
function handleInsetValue(v, { theme }) {
	return theme.spacing?.[v] ?? h.bracket.cssvar.global.auto.fraction.rem(v);
}
function handleInsetValues([, d, v], ctx) {
	const r = handleInsetValue(v, ctx);
	if (r != null && d in insetMap) return insetMap[d].map((i) => [i.slice(1), r]);
}
const insets = [
	[
		/^(?:position-|pos-)?inset-(.+)$/,
		([, v], ctx) => ({ inset: handleInsetValue(v, ctx) }),
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
	[/^(?:position-|pos-)?(top|left|right|bottom)-(.+)$/, ([, d, v], ctx) => ({ [d]: handleInsetValue(v, ctx) })]
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
	([, v], { theme }) => ({ "z-index": theme.zIndex?.[v] ?? h.bracket.cssvar.global.auto.number(v) }),
	{ autocomplete: "z-<num>" }
]];
const boxSizing = [
	["box-border", { "box-sizing": "border-box" }],
	["box-content", { "box-sizing": "content-box" }],
	...makeGlobalStaticRules("box", "box-sizing")
];
//#endregion
//#region src/_rules/question-mark.ts
/**
* Used for debugging, only available in development mode.
*
* @example `?` / `where`
*/
const questionMark = [[/^(where|\?)$/, (_, { constructCSS, generator }) => {
	if (generator.userConfig.envMode === "dev") return `@keyframes __un_qm{0%{box-shadow:inset 4px 4px #ff1e90, inset -4px -4px #ff1e90}100%{box-shadow:inset 8px 8px #3399ff, inset -8px -8px #3399ff}} ${constructCSS({ animation: "__un_qm 0.5s ease-in-out alternate infinite" })}`;
}]];
//#endregion
//#region src/_rules/static.ts
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
	"none",
	"strict",
	"content",
	"size",
	"inline-size",
	"layout",
	"style",
	"paint"
];
const varEmpty = " ";
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
	["backface-visible", { "backface-visibility": "visible" }],
	["backface-hidden", { "backface-visibility": "hidden" }],
	...makeGlobalStaticRules("backface", "backface-visibility")
];
const cursors = [[/^cursor-(.+)$/, ([, c]) => ({ cursor: h.bracket.cssvar.global(c) })], ...cursorValues.map((v) => [`cursor-${v}`, { cursor: v }])];
const contains = [[/^contain-(.*)$/, ([, d]) => {
	if (h.bracket(d) != null) return { contain: h.bracket(d).split(" ").map((e) => h.cssvar.fraction(e) ?? e).join(" ") };
	return containValues.includes(d) ? { contain: d } : void 0;
}]];
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
	[/^content-(.+)$/, ([, v]) => ({ content: h.bracket.cssvar(v) })],
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
	["break-anywhere", { "overflow-wrap": "anywhere" }]
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
const fieldSizing = [["field-sizing-fixed", { "field-sizing": "fixed" }], ["field-sizing-content", { "field-sizing": "content" }]];
//#endregion
//#region src/_rules/ring.ts
const ringBase = {
	"--un-ring-inset": " ",
	"--un-ring-offset-width": "0px",
	"--un-ring-offset-color": "#fff",
	"--un-ring-width": "0px",
	"--un-ring-color": "rgb(147 197 253 / 0.5)",
	"--un-shadow": "0 0 rgb(0 0 0 / 0)"
};
const rings = [
	[
		/^ring(?:-(.+))?$/,
		([, d], { theme }) => {
			const value = theme.ringWidth?.[d || "DEFAULT"] ?? h.px(d || "1");
			if (value) return {
				"--un-ring-width": value,
				"--un-ring-offset-shadow": "var(--un-ring-inset) 0 0 0 var(--un-ring-offset-width) var(--un-ring-offset-color)",
				"--un-ring-shadow": "var(--un-ring-inset) 0 0 0 calc(var(--un-ring-width) + var(--un-ring-offset-width)) var(--un-ring-color)",
				"box-shadow": "var(--un-ring-offset-shadow), var(--un-ring-shadow), var(--un-shadow)"
			};
		},
		{
			custom: { preflightKeys: Object.keys(ringBase) },
			autocomplete: "ring-$ringWidth"
		}
	],
	[
		/^ring-(?:width-|size-)(.+)$/,
		handleWidth$1,
		{ autocomplete: "ring-(width|size)-$lineWidth" }
	],
	["ring-offset", { "--un-ring-offset-width": "1px" }],
	[
		/^ring-offset-(?:width-|size-)?(.+)$/,
		([, d], { theme }) => ({ "--un-ring-offset-width": theme.lineWidth?.[d] ?? h.bracket.cssvar.px(d) }),
		{ autocomplete: "ring-offset-(width|size)-$lineWidth" }
	],
	[
		/^ring-(.+)$/,
		handleColorOrWidth$1,
		{ autocomplete: "ring-$colors" }
	],
	[
		/^ring-op(?:acity)?-?(.+)$/,
		([, opacity]) => ({ "--un-ring-opacity": h.bracket.percent.cssvar(opacity) }),
		{ autocomplete: "ring-(op|opacity)-<percent>" }
	],
	[
		/^ring-offset-(.+)$/,
		colorResolver("--un-ring-offset-color", "ring-offset", "borderColor"),
		{ autocomplete: "ring-offset-$colors" }
	],
	[
		/^ring-offset-op(?:acity)?-?(.+)$/,
		([, opacity]) => ({ "--un-ring-offset-opacity": h.bracket.percent.cssvar(opacity) }),
		{ autocomplete: "ring-offset-(op|opacity)-<percent>" }
	],
	["ring-inset", { "--un-ring-inset": "inset" }]
];
function handleWidth$1([, b], { theme }) {
	return { "--un-ring-width": theme.ringWidth?.[b] ?? h.bracket.cssvar.px(b) };
}
function handleColorOrWidth$1(match, ctx) {
	if (isCSSMathFn(h.bracket(match[1]))) return handleWidth$1(match, ctx);
	return colorResolver("--un-ring-color", "ring", "borderColor")(match, ctx);
}
//#endregion
//#region src/_rules/shadow.ts
const boxShadowsBase = {
	"--un-ring-offset-shadow": "0 0 rgb(0 0 0 / 0)",
	"--un-ring-shadow": "0 0 rgb(0 0 0 / 0)",
	"--un-shadow-inset": " ",
	"--un-shadow": "0 0 rgb(0 0 0 / 0)"
};
const boxShadows = [
	[
		/^shadow(?:-(.+))?$/,
		(match, context) => {
			const [, d] = match;
			const { theme } = context;
			const v = theme.boxShadow?.[d || "DEFAULT"];
			const c = d ? h.bracket.cssvar(d) : void 0;
			if ((v != null || c != null) && !hasParseableColor(c, theme, "shadowColor")) return {
				"--un-shadow": colorableShadows(v || c, "--un-shadow-color").join(","),
				"box-shadow": "var(--un-ring-offset-shadow), var(--un-ring-shadow), var(--un-shadow)"
			};
			return colorResolver("--un-shadow-color", "shadow", "shadowColor")(match, context);
		},
		{
			custom: { preflightKeys: Object.keys(boxShadowsBase) },
			autocomplete: ["shadow-$colors", "shadow-$boxShadow"]
		}
	],
	[
		/^shadow-op(?:acity)?-?(.+)$/,
		([, opacity]) => ({ "--un-shadow-opacity": h.bracket.percent.cssvar(opacity) }),
		{ autocomplete: "shadow-(op|opacity)-<percent>" }
	],
	["shadow-inset", { "--un-shadow-inset": "inset" }]
];
//#endregion
//#region src/_rules/size.ts
const sizeMapping = {
	h: "height",
	w: "width",
	inline: "inline-size",
	block: "block-size"
};
function getPropName(minmax, hw) {
	return `${minmax || ""}${sizeMapping[hw]}`;
}
function getSizeValue(minmax, hw, theme, prop) {
	const v = theme[getPropName(minmax, hw).replace(/-(\w)/g, (_, p) => p.toUpperCase())]?.[prop];
	if (v != null) return v;
	switch (prop) {
		case "fit":
		case "max":
		case "min": return `${prop}-content`;
		case "stretch": return "stretch";
	}
	return h.bracket.cssvar.global.auto.fraction.rem(prop);
}
const sizes = [
	[/^size-(min-|max-)?(.+)$/, ([, m, s], { theme }) => ({
		[getPropName(m, "w")]: getSizeValue(m, "w", theme, s),
		[getPropName(m, "h")]: getSizeValue(m, "h", theme, s)
	})],
	[/^(?:size-)?(min-|max-)?([wh])-?(.+)$/, ([, m, w, s], { theme }) => ({ [getPropName(m, w)]: getSizeValue(m, w, theme, s) })],
	[
		/^(?:size-)?(min-|max-)?(block|inline)-(.+)$/,
		([, m, w, s], { theme }) => ({ [getPropName(m, w)]: getSizeValue(m, w, theme, s) }),
		{ autocomplete: [
			"(w|h)-$width|height|maxWidth|maxHeight|minWidth|minHeight|inlineSize|blockSize|maxInlineSize|maxBlockSize|minInlineSize|minBlockSize",
			"(block|inline)-$width|height|maxWidth|maxHeight|minWidth|minHeight|inlineSize|blockSize|maxInlineSize|maxBlockSize|minInlineSize|minBlockSize",
			"(max|min)-(w|h|block|inline)",
			"(max|min)-(w|h|block|inline)-$width|height|maxWidth|maxHeight|minWidth|minHeight|inlineSize|blockSize|maxInlineSize|maxBlockSize|minInlineSize|minBlockSize",
			"(w|h)-full",
			"(max|min)-(w|h)-full"
		] }
	],
	[/^(?:size-)?(min-|max-)?(h)-screen-(.+)$/, ([, m, h, p], context) => ({ [getPropName(m, h)]: handleBreakpoint(context, p, "verticalBreakpoints") })],
	[
		/^(?:size-)?(min-|max-)?(w)-screen-(.+)$/,
		([, m, w, p], context) => ({ [getPropName(m, w)]: handleBreakpoint(context, p) }),
		{ autocomplete: [
			"(w|h)-screen",
			"(min|max)-(w|h)-screen",
			"h-screen-$verticalBreakpoints",
			"(min|max)-h-screen-$verticalBreakpoints",
			"w-screen-$breakpoints",
			"(min|max)-w-screen-$breakpoints"
		] }
	]
];
function handleBreakpoint(context, point, key = "breakpoints") {
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
//#region src/_rules/spacing.ts
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
//#endregion
//#region src/_rules/svg.ts
const svgUtilities = [
	[
		/^fill-(.+)$/,
		colorResolver("fill", "fill", "backgroundColor"),
		{ autocomplete: "fill-$colors" }
	],
	[
		/^fill-op(?:acity)?-?(.+)$/,
		([, opacity]) => ({ "--un-fill-opacity": h.bracket.percent.cssvar(opacity) }),
		{ autocomplete: "fill-(op|opacity)-<percent>" }
	],
	["fill-none", { fill: "none" }],
	[
		/^stroke-(?:width-|size-)?(.+)$/,
		handleWidth,
		{ autocomplete: ["stroke-width-$lineWidth", "stroke-size-$lineWidth"] }
	],
	[
		/^stroke-dash-(.+)$/,
		([, s]) => ({ "stroke-dasharray": h.bracket.cssvar.number(s) }),
		{ autocomplete: "stroke-dash-<num>" }
	],
	[
		/^stroke-offset-(.+)$/,
		([, s], { theme }) => ({ "stroke-dashoffset": theme.lineWidth?.[s] ?? h.bracket.cssvar.px.numberWithUnit(s) }),
		{ autocomplete: "stroke-offset-$lineWidth" }
	],
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
function handleWidth([, b], { theme }) {
	return { "stroke-width": theme.lineWidth?.[b] ?? h.bracket.cssvar.fraction.px.number(b) };
}
function handleColorOrWidth(match, ctx) {
	if (isCSSMathFn(h.bracket(match[1]))) return handleWidth(match, ctx);
	return colorResolver("stroke", "stroke", "borderColor")(match, ctx);
}
//#endregion
//#region src/_rules/transform.ts
const transformValues = [
	"translate",
	"rotate",
	"scale"
];
const transformCpu = [
	"translateX(var(--un-translate-x))",
	"translateY(var(--un-translate-y))",
	"rotate(var(--un-rotate))",
	"rotateZ(var(--un-rotate-z))",
	"skewX(var(--un-skew-x))",
	"skewY(var(--un-skew-y))",
	"scaleX(var(--un-scale-x))",
	"scaleY(var(--un-scale-y))"
].join(" ");
const transform = [
	"translateX(var(--un-translate-x))",
	"translateY(var(--un-translate-y))",
	"translateZ(var(--un-translate-z))",
	"rotate(var(--un-rotate))",
	"rotateX(var(--un-rotate-x))",
	"rotateY(var(--un-rotate-y))",
	"rotateZ(var(--un-rotate-z))",
	"skewX(var(--un-skew-x))",
	"skewY(var(--un-skew-y))",
	"scaleX(var(--un-scale-x))",
	"scaleY(var(--un-scale-y))",
	"scaleZ(var(--un-scale-z))"
].join(" ");
const transformGpu = [
	"translate3d(var(--un-translate-x), var(--un-translate-y), var(--un-translate-z))",
	"rotate(var(--un-rotate))",
	"rotateX(var(--un-rotate-x))",
	"rotateY(var(--un-rotate-y))",
	"rotateZ(var(--un-rotate-z))",
	"skewX(var(--un-skew-x))",
	"skewY(var(--un-skew-y))",
	"scaleX(var(--un-scale-x))",
	"scaleY(var(--un-scale-y))",
	"scaleZ(var(--un-scale-z))"
].join(" ");
const transformBase = {
	"--un-rotate": 0,
	"--un-rotate-x": 0,
	"--un-rotate-y": 0,
	"--un-rotate-z": 0,
	"--un-scale-x": 1,
	"--un-scale-y": 1,
	"--un-scale-z": 1,
	"--un-skew-x": 0,
	"--un-skew-y": 0,
	"--un-translate-x": 0,
	"--un-translate-y": 0,
	"--un-translate-z": 0
};
const preflightKeys = Object.keys(transformBase);
const transforms = [
	[
		/^(?:transform-)?origin-(.+)$/,
		([, s]) => ({ "transform-origin": positionMap[s] ?? h.bracket.cssvar(s) }),
		{ autocomplete: [`transform-origin-(${Object.keys(positionMap).join("|")})`, `origin-(${Object.keys(positionMap).join("|")})`] }
	],
	[/^(transform-)?perspect(?:ive)?-(.+)$/, ([, t, s]) => {
		const v = h.bracket.cssvar.px.numberWithUnit(s);
		if (v != null) {
			if (t) return {
				"--un-perspective": `perspective(${v})`,
				"transform": `var(--un-perspective) ${transform}`
			};
			return {
				"-webkit-perspective": v,
				"perspective": v
			};
		}
	}],
	[/^perspect(?:ive)?-origin-(.+)$/, ([, s]) => {
		const v = h.bracket.cssvar(s) ?? (s.length >= 3 ? positionMap[s] : void 0);
		if (v != null) return {
			"-webkit-perspective-origin": v,
			"perspective-origin": v
		};
	}],
	[
		/^(?:transform-)?translate-()(.+)$/,
		handleTranslate,
		{ custom: { preflightKeys } }
	],
	[
		/^(?:transform-)?translate-([xyz])-(.+)$/,
		handleTranslate,
		{ custom: { preflightKeys } }
	],
	[
		/^(?:transform-)?rotate-()(.+)$/,
		handleRotate,
		{ custom: { preflightKeys } }
	],
	[
		/^(?:transform-)?rotate-([xyz])-(.+)$/,
		handleRotate,
		{ custom: { preflightKeys } }
	],
	[
		/^(?:transform-)?skew-()(.+)$/,
		handleSkew,
		{ custom: { preflightKeys } }
	],
	[
		/^(?:transform-)?skew-([xy])-(.+)$/,
		handleSkew,
		{
			custom: { preflightKeys },
			autocomplete: ["transform-skew-(x|y)-<percent>", "skew-(x|y)-<percent>"]
		}
	],
	[
		/^(?:transform-)?scale-()(.+)$/,
		handleScale,
		{ custom: { preflightKeys } }
	],
	[
		/^(?:transform-)?scale-([xyz])-(.+)$/,
		handleScale,
		{
			custom: { preflightKeys },
			autocomplete: [
				`transform-(${transformValues.join("|")})-<percent>`,
				`transform-(${transformValues.join("|")})-(x|y|z)-<percent>`,
				`(${transformValues.join("|")})-<percent>`,
				`(${transformValues.join("|")})-(x|y|z)-<percent>`
			]
		}
	],
	[/^(?:transform-)?preserve-3d$/, () => ({ "transform-style": "preserve-3d" })],
	[/^(?:transform-)?preserve-flat$/, () => ({ "transform-style": "flat" })],
	[
		"transform",
		{ transform },
		{ custom: { preflightKeys } }
	],
	[
		"transform-cpu",
		{ transform: transformCpu },
		{ custom: { preflightKeys: [
			"--un-translate-x",
			"--un-translate-y",
			"--un-rotate",
			"--un-rotate-z",
			"--un-skew-x",
			"--un-skew-y",
			"--un-scale-x",
			"--un-scale-y"
		] } }
	],
	[
		"transform-gpu",
		{ transform: transformGpu },
		{ custom: { preflightKeys } }
	],
	["transform-none", { transform: "none" }],
	...makeGlobalStaticRules("transform")
];
function handleTranslate([, d, b], { theme }) {
	const v = theme.spacing?.[b] ?? h.bracket.cssvar.fraction.rem(b);
	if (v != null) return [...transformXYZ(d, v, "translate"), ["transform", transform]];
}
function handleScale([, d, b]) {
	const v = h.bracket.cssvar.fraction.percent(b);
	if (v != null) return [...transformXYZ(d, v, "scale"), ["transform", transform]];
}
function handleRotate([, d = "", b]) {
	const v = h.bracket.cssvar.degree(b);
	if (v != null) if (d) return {
		"--un-rotate": 0,
		[`--un-rotate-${d}`]: v,
		"transform": transform
	};
	else return {
		"--un-rotate-x": 0,
		"--un-rotate-y": 0,
		"--un-rotate-z": 0,
		"--un-rotate": v,
		"transform": transform
	};
}
function handleSkew([, d, b]) {
	const v = h.bracket.cssvar.degree(b);
	if (v != null) return [...transformXYZ(d, v, "skew"), ["transform", transform]];
}
//#endregion
//#region src/_rules/transition.ts
function resolveTransitionProperty(prop, theme) {
	let p;
	if (h.cssvar(prop) != null) p = h.cssvar(prop);
	else {
		if (prop.startsWith("[") && prop.endsWith("]")) prop = prop.slice(1, -1);
		const props = prop.split(",").map((p) => theme.transitionProperty?.[p] ?? h.properties(p));
		if (props.every(Boolean)) p = props.join(",");
	}
	return p;
}
const transitions = [
	[
		/^transition(?:-(\D+?))?(?:-(\d+))?$/,
		([, prop, d], { theme }) => {
			if (!prop && !d) return {
				"transition-property": theme.transitionProperty?.DEFAULT,
				"transition-timing-function": theme.easing?.DEFAULT,
				"transition-duration": theme.duration?.DEFAULT ?? h.time("150")
			};
			else if (prop != null) {
				const p = resolveTransitionProperty(prop, theme);
				const duration = theme.duration?.[d || "DEFAULT"] ?? h.time(d || "150");
				if (p) return {
					"transition-property": p,
					"transition-timing-function": theme.easing?.DEFAULT,
					"transition-duration": duration
				};
			} else if (d != null) return {
				"transition-property": theme.transitionProperty?.DEFAULT,
				"transition-timing-function": theme.easing?.DEFAULT,
				"transition-duration": theme.duration?.[d] ?? h.time(d)
			};
		},
		{ autocomplete: "transition-$transitionProperty-$duration" }
	],
	[
		/^(?:transition-)?duration-(.+)$/,
		([, d], { theme }) => ({ "transition-duration": theme.duration?.[d || "DEFAULT"] ?? h.bracket.cssvar.time(d) }),
		{ autocomplete: ["transition-duration-$duration", "duration-$duration"] }
	],
	[
		/^(?:transition-)?delay-(.+)$/,
		([, d], { theme }) => ({ "transition-delay": theme.duration?.[d || "DEFAULT"] ?? h.bracket.cssvar.time(d) }),
		{ autocomplete: ["transition-delay-$duration", "delay-$duration"] }
	],
	[
		/^(?:transition-)?ease(?:-(.+))?$/,
		([, d], { theme }) => ({ "transition-timing-function": theme.easing?.[d || "DEFAULT"] ?? h.bracket.cssvar(d) }),
		{ autocomplete: ["transition-ease-(linear|in|out|in-out|DEFAULT)", "ease-(linear|in|out|in-out|DEFAULT)"] }
	],
	[
		/^(?:transition-)?property-(.+)$/,
		([, v], { theme }) => {
			const p = h.global(v) || resolveTransitionProperty(v, theme);
			if (p) return { "transition-property": p };
		},
		{ autocomplete: [
			`transition-property-(${[...globalKeywords].join("|")})`,
			"transition-property-$transitionProperty",
			"property-$transitionProperty"
		] }
	],
	["transition-none", { transition: "none" }],
	...makeGlobalStaticRules("transition"),
	["transition-discrete", { "transition-behavior": "allow-discrete" }],
	["transition-normal", { "transition-behavior": "normal" }]
];
//#endregion
//#region src/_rules/typography.ts
const fonts = [
	[
		/^text-(.+)$/,
		handleText,
		{ autocomplete: "text-$fontSize" }
	],
	[
		/^(?:text|font)-size-(.+)$/,
		handleSize,
		{ autocomplete: "text-size-$fontSize" }
	],
	[
		/^text-(?:color-)?(.+)$/,
		handlerColorOrSize,
		{ autocomplete: "text-$colors" }
	],
	[
		/^(?:color|c)-(.+)$/,
		colorResolver("color", "text", "textColor"),
		{ autocomplete: "(color|c)-$colors" }
	],
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
		/^(?:font|fw)-?([^-]+)$/,
		([, s], { theme }) => ({ "font-weight": theme.fontWeight?.[s] || h.bracket.global.number(s) }),
		{ autocomplete: ["(font|fw)-(100|200|300|400|500|600|700|800|900)", "(font|fw)-$fontWeight"] }
	],
	[
		/^(?:font-)?(?:leading|lh|line-height)-(.+)$/,
		([, s], { theme }) => ({ "line-height": handleThemeByKey(s, theme, "lineHeight") }),
		{ autocomplete: "(leading|lh|line-height)-$lineHeight" }
	],
	["font-synthesis-weight", { "font-synthesis": "weight" }],
	["font-synthesis-style", { "font-synthesis": "style" }],
	["font-synthesis-small-caps", { "font-synthesis": "small-caps" }],
	["font-synthesis-none", { "font-synthesis": "none" }],
	[/^font-synthesis-(.+)$/, ([, s]) => ({ "font-synthesis": h.bracket.cssvar.global(s) })],
	[
		/^(?:font-)?tracking-(.+)$/,
		([, s], { theme }) => ({ "letter-spacing": theme.letterSpacing?.[s] || h.bracket.cssvar.global.rem(s) }),
		{ autocomplete: "tracking-$letterSpacing" }
	],
	[
		/^(?:font-)?word-spacing-(.+)$/,
		([, s], { theme }) => ({ "word-spacing": theme.wordSpacing?.[s] || h.bracket.cssvar.global.rem(s) }),
		{ autocomplete: "word-spacing-$wordSpacing" }
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
		([, d], { theme }) => ({ "font-family": theme.fontFamily?.[d] || h.bracket.cssvar.global(d) }),
		{ autocomplete: "font-$fontFamily" }
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
const textIndents = [[
	/^indent(?:-(.+))?$/,
	([, s], { theme }) => ({ "text-indent": theme.textIndent?.[s || "DEFAULT"] || h.bracket.cssvar.global.fraction.rem(s) }),
	{ autocomplete: "indent-$textIndent" }
]];
const textStrokes = [
	[
		/^text-stroke(?:-(.+))?$/,
		([, s], { theme }) => ({ "-webkit-text-stroke-width": theme.textStrokeWidth?.[s || "DEFAULT"] || h.bracket.cssvar.px(s) }),
		{ autocomplete: "text-stroke-$textStrokeWidth" }
	],
	[
		/^text-stroke-(.+)$/,
		colorResolver("-webkit-text-stroke-color", "text-stroke", "borderColor"),
		{ autocomplete: "text-stroke-$colors" }
	],
	[
		/^text-stroke-op(?:acity)?-?(.+)$/,
		([, opacity]) => ({ "--un-text-stroke-opacity": h.bracket.percent.cssvar(opacity) }),
		{ autocomplete: "text-stroke-(op|opacity)-<percent>" }
	]
];
const textShadows = [
	[
		/^text-shadow(?:-(.+))?$/,
		([, s], { theme }) => {
			const v = theme.textShadow?.[s || "DEFAULT"];
			if (v != null) return {
				"--un-text-shadow": colorableShadows(v, "--un-text-shadow-color").join(","),
				"text-shadow": "var(--un-text-shadow)"
			};
			return { "text-shadow": h.bracket.cssvar.global(s) };
		},
		{ autocomplete: "text-shadow-$textShadow" }
	],
	[
		/^text-shadow-color-(.+)$/,
		colorResolver("--un-text-shadow-color", "text-shadow", "shadowColor"),
		{ autocomplete: "text-shadow-color-$colors" }
	],
	[
		/^text-shadow-color-op(?:acity)?-?(.+)$/,
		([, opacity]) => ({ "--un-text-shadow-opacity": h.bracket.percent.cssvar(opacity) }),
		{ autocomplete: "text-shadow-color-(op|opacity)-<percent>" }
	]
];
function handleThemeByKey(s, theme, key) {
	return theme[key]?.[s] || h.bracket.cssvar.global.rem(s);
}
function handleSize([, s], { theme }) {
	const size = toArray(theme.fontSize?.[s])?.[0] ?? h.bracket.cssvar.global.rem(s);
	if (size != null) return { "font-size": size };
}
function handlerColorOrSize(match, ctx) {
	if (isCSSMathFn(h.bracket(match[1]))) return handleSize(match, ctx);
	return colorResolver("color", "text", "textColor")(match, ctx);
}
function handleText([, s = "base"], { theme }) {
	const split = splitShorthand(s, "length");
	if (!split) return;
	const [size, leading] = split;
	const sizePairs = toArray(theme.fontSize?.[size]);
	const lineHeight = leading ? handleThemeByKey(leading, theme, "lineHeight") : void 0;
	if (sizePairs?.[0]) {
		const [fontSize, height, letterSpacing] = sizePairs;
		if (typeof height === "object") return {
			"font-size": fontSize,
			...height
		};
		return {
			"font-size": fontSize,
			"line-height": lineHeight ?? height ?? "1",
			"letter-spacing": letterSpacing ? handleThemeByKey(letterSpacing, theme, "letterSpacing") : void 0
		};
	}
	const fontSize = h.bracketOfLength.rem(size);
	if (lineHeight && fontSize) return {
		"font-size": fontSize,
		"line-height": lineHeight
	};
	return { "font-size": h.bracketOfLength.rem(s) };
}
//#endregion
//#region src/_rules/variables.ts
const variablesAbbrMap = {
	backface: "backface-visibility",
	break: "word-break",
	case: "text-transform",
	content: "align-content",
	fw: "font-weight",
	items: "align-items",
	justify: "justify-content",
	select: "user-select",
	self: "align-self",
	vertical: "vertical-align",
	visible: "visibility",
	whitespace: "white-space",
	ws: "white-space"
};
const cssVariables = [[/^(.+?)-(\$.+)$/, ([, name, varname]) => {
	const prop = variablesAbbrMap[name];
	if (prop) return { [prop]: h.cssvar(varname) };
}]];
const cssProperty = [[/^\[(.*)\]$/, ([_, body]) => {
	if (!body.includes(":")) return;
	const [prop, ...rest] = body.split(":");
	const value = rest.join(":");
	if (!isURI(body) && /^[\w-]+$/.test(prop) && isValidCSSBody(value)) {
		const parsed = h.bracket(`[${value}]`);
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
//#region src/_rules/default.ts
const rules = [
	cssVariables,
	cssProperty,
	contains,
	pointerEvents,
	appearances,
	positions,
	insets,
	zIndexes,
	orders,
	grids,
	floats,
	margins,
	boxSizing,
	displays,
	aspectRatio,
	sizes,
	flex,
	transforms,
	cursors,
	userSelects,
	resizes,
	appearance,
	placements,
	alignments,
	justifies,
	gaps,
	flexGridJustifiesAlignments,
	overflows,
	textOverflows,
	whitespaces,
	breaks,
	borders,
	bgColors,
	colorScheme,
	svgUtilities,
	paddings,
	textAligns,
	textIndents,
	textWraps,
	verticalAligns,
	fonts,
	textTransforms,
	fontStyles,
	textDecorations,
	fontSmoothings,
	tabSizes,
	textStrokes,
	textShadows,
	opacity,
	boxShadows,
	outline,
	rings,
	transitions,
	willChange,
	contentVisibility,
	contents,
	containerParent,
	fieldSizing,
	questionMark
].flat(1);
//#endregion
export { alignments, appearance, appearances, aspectRatio, bgColors, borderStyles, borders, boxShadows, boxShadowsBase, boxSizing, breaks, colorScheme, containerParent, contains, contentVisibility, contents, cssProperty, cssVariables, cursors, displays, fieldSizing, flex, flexGridJustifiesAlignments, floats, fontSmoothings, fontStyles, fonts, gaps, grids, handlerBorderStyle, insets, justifies, margins, opacity, orders, outline, overflows, paddings, placements, pointerEvents, positions, questionMark, resizes, ringBase, rings, rules, sizes, svgUtilities, tabSizes, textAligns, textDecorations, textIndents, textOverflows, textShadows, textStrokes, textTransforms, textWraps, transformBase, transforms, transitions, userSelects, varEmpty, verticalAligns, whitespaces, willChange, zIndexes };
