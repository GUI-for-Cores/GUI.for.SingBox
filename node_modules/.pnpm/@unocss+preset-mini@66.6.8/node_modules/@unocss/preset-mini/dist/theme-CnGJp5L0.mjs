import { boxShadowsBase, ringBase, transformBase } from "./rules.mjs";
import { t as colors } from "./colors-BSuZg9eF.mjs";
//#region src/_theme/filters.ts
const blur = {
	"DEFAULT": "8px",
	"0": "0",
	"sm": "4px",
	"md": "12px",
	"lg": "16px",
	"xl": "24px",
	"2xl": "40px",
	"3xl": "64px"
};
const dropShadow = {
	"DEFAULT": ["0 1px 2px rgb(0 0 0 / 0.1)", "0 1px 1px rgb(0 0 0 / 0.06)"],
	"sm": "0 1px 1px rgb(0 0 0 / 0.05)",
	"md": ["0 4px 3px rgb(0 0 0 / 0.07)", "0 2px 2px rgb(0 0 0 / 0.06)"],
	"lg": ["0 10px 8px rgb(0 0 0 / 0.04)", "0 4px 3px rgb(0 0 0 / 0.1)"],
	"xl": ["0 20px 13px rgb(0 0 0 / 0.03)", "0 8px 5px rgb(0 0 0 / 0.08)"],
	"2xl": "0 25px 25px rgb(0 0 0 / 0.15)",
	"none": "0 0 rgb(0 0 0 / 0)"
};
//#endregion
//#region src/_theme/font.ts
const fontFamily = {
	sans: [
		"ui-sans-serif",
		"system-ui",
		"-apple-system",
		"BlinkMacSystemFont",
		"\"Segoe UI\"",
		"Roboto",
		"\"Helvetica Neue\"",
		"Arial",
		"\"Noto Sans\"",
		"sans-serif",
		"\"Apple Color Emoji\"",
		"\"Segoe UI Emoji\"",
		"\"Segoe UI Symbol\"",
		"\"Noto Color Emoji\""
	].join(","),
	serif: [
		"ui-serif",
		"Georgia",
		"Cambria",
		"\"Times New Roman\"",
		"Times",
		"serif"
	].join(","),
	mono: [
		"ui-monospace",
		"SFMono-Regular",
		"Menlo",
		"Monaco",
		"Consolas",
		"\"Liberation Mono\"",
		"\"Courier New\"",
		"monospace"
	].join(",")
};
const fontSize = {
	"xs": ["0.75rem", "1rem"],
	"sm": ["0.875rem", "1.25rem"],
	"base": ["1rem", "1.5rem"],
	"lg": ["1.125rem", "1.75rem"],
	"xl": ["1.25rem", "1.75rem"],
	"2xl": ["1.5rem", "2rem"],
	"3xl": ["1.875rem", "2.25rem"],
	"4xl": ["2.25rem", "2.5rem"],
	"5xl": ["3rem", "1"],
	"6xl": ["3.75rem", "1"],
	"7xl": ["4.5rem", "1"],
	"8xl": ["6rem", "1"],
	"9xl": ["8rem", "1"]
};
const textIndent = {
	"DEFAULT": "1.5rem",
	"xs": "0.5rem",
	"sm": "1rem",
	"md": "1.5rem",
	"lg": "2rem",
	"xl": "2.5rem",
	"2xl": "3rem",
	"3xl": "4rem"
};
const textStrokeWidth = {
	DEFAULT: "1.5rem",
	none: "0",
	sm: "thin",
	md: "medium",
	lg: "thick"
};
const textShadow = {
	DEFAULT: ["0 0 1px rgb(0 0 0 / 0.2)", "0 0 1px rgb(1 0 5 / 0.1)"],
	none: "0 0 rgb(0 0 0 / 0)",
	sm: "1px 1px 3px rgb(36 37 47 / 0.25)",
	md: ["0 1px 2px rgb(30 29 39 / 0.19)", "1px 2px 4px rgb(54 64 147 / 0.18)"],
	lg: ["3px 3px 6px rgb(0 0 0 / 0.26)", "0 0 5px rgb(15 3 86 / 0.22)"],
	xl: ["1px 1px 3px rgb(0 0 0 / 0.29)", "2px 4px 7px rgb(73 64 125 / 0.35)"]
};
const lineHeight = {
	none: "1",
	tight: "1.25",
	snug: "1.375",
	normal: "1.5",
	relaxed: "1.625",
	loose: "2"
};
const letterSpacing = {
	tighter: "-0.05em",
	tight: "-0.025em",
	normal: "0em",
	wide: "0.025em",
	wider: "0.05em",
	widest: "0.1em"
};
const fontWeight = {
	thin: "100",
	extralight: "200",
	light: "300",
	normal: "400",
	medium: "500",
	semibold: "600",
	bold: "700",
	extrabold: "800",
	black: "900"
};
const wordSpacing = letterSpacing;
//#endregion
//#region src/_theme/misc.ts
const breakpoints = {
	"sm": "640px",
	"md": "768px",
	"lg": "1024px",
	"xl": "1280px",
	"2xl": "1536px"
};
const verticalBreakpoints = { ...breakpoints };
const lineWidth = {
	DEFAULT: "1px",
	none: "0"
};
const spacing = {
	"DEFAULT": "1rem",
	"none": "0",
	"xs": "0.75rem",
	"sm": "0.875rem",
	"lg": "1.125rem",
	"xl": "1.25rem",
	"2xl": "1.5rem",
	"3xl": "1.875rem",
	"4xl": "2.25rem",
	"5xl": "3rem",
	"6xl": "3.75rem",
	"7xl": "4.5rem",
	"8xl": "6rem",
	"9xl": "8rem"
};
const duration = {
	DEFAULT: "150ms",
	none: "0s",
	75: "75ms",
	100: "100ms",
	150: "150ms",
	200: "200ms",
	300: "300ms",
	500: "500ms",
	700: "700ms",
	1e3: "1000ms"
};
const borderRadius = {
	"DEFAULT": "0.25rem",
	"none": "0",
	"sm": "0.125rem",
	"md": "0.375rem",
	"lg": "0.5rem",
	"xl": "0.75rem",
	"2xl": "1rem",
	"3xl": "1.5rem",
	"full": "9999px"
};
const boxShadow = {
	"DEFAULT": ["var(--un-shadow-inset) 0 1px 3px 0 rgb(0 0 0 / 0.1)", "var(--un-shadow-inset) 0 1px 2px -1px rgb(0 0 0 / 0.1)"],
	"none": "0 0 rgb(0 0 0 / 0)",
	"sm": "var(--un-shadow-inset) 0 1px 2px 0 rgb(0 0 0 / 0.05)",
	"md": ["var(--un-shadow-inset) 0 4px 6px -1px rgb(0 0 0 / 0.1)", "var(--un-shadow-inset) 0 2px 4px -2px rgb(0 0 0 / 0.1)"],
	"lg": ["var(--un-shadow-inset) 0 10px 15px -3px rgb(0 0 0 / 0.1)", "var(--un-shadow-inset) 0 4px 6px -4px rgb(0 0 0 / 0.1)"],
	"xl": ["var(--un-shadow-inset) 0 20px 25px -5px rgb(0 0 0 / 0.1)", "var(--un-shadow-inset) 0 8px 10px -6px rgb(0 0 0 / 0.1)"],
	"2xl": "var(--un-shadow-inset) 0 25px 50px -12px rgb(0 0 0 / 0.25)",
	"inner": "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)"
};
const ringWidth = {
	DEFAULT: "3px",
	none: "0"
};
const zIndex = { auto: "auto" };
const media = { mouse: "(hover) and (pointer: fine)" };
//#endregion
//#region src/_theme/preflight.ts
const preflightBase = {
	...transformBase,
	...boxShadowsBase,
	...ringBase
};
//#endregion
//#region src/_theme/size.ts
const baseSize = {
	"xs": "20rem",
	"sm": "24rem",
	"md": "28rem",
	"lg": "32rem",
	"xl": "36rem",
	"2xl": "42rem",
	"3xl": "48rem",
	"4xl": "56rem",
	"5xl": "64rem",
	"6xl": "72rem",
	"7xl": "80rem",
	"prose": "65ch"
};
const width = {
	auto: "auto",
	...baseSize,
	screen: "100vw"
};
const maxWidth = {
	none: "none",
	...baseSize,
	screen: "100vw"
};
const blockSize = {
	auto: "auto",
	...baseSize,
	screen: "100vb"
};
const inlineSize = {
	auto: "auto",
	...baseSize,
	screen: "100vi"
};
const height = {
	auto: "auto",
	...baseSize,
	screen: "100vh"
};
const maxHeight = {
	none: "none",
	...baseSize,
	screen: "100vh"
};
const maxBlockSize = {
	none: "none",
	...baseSize,
	screen: "100vb"
};
const maxInlineSize = {
	none: "none",
	...baseSize,
	screen: "100vi"
};
const containers = { ...baseSize };
//#endregion
//#region src/_theme/default.ts
const theme = {
	width,
	height,
	maxWidth,
	maxHeight,
	minWidth: maxWidth,
	minHeight: maxHeight,
	inlineSize,
	blockSize,
	maxInlineSize,
	maxBlockSize,
	minInlineSize: maxInlineSize,
	minBlockSize: maxBlockSize,
	colors,
	fontFamily,
	fontSize,
	fontWeight,
	breakpoints,
	verticalBreakpoints,
	borderRadius,
	lineHeight,
	letterSpacing,
	wordSpacing,
	boxShadow,
	textIndent,
	textShadow,
	textStrokeWidth,
	blur,
	dropShadow,
	easing: {
		"DEFAULT": "cubic-bezier(0.4, 0, 0.2, 1)",
		"linear": "linear",
		"in": "cubic-bezier(0.4, 0, 1, 1)",
		"out": "cubic-bezier(0, 0, 0.2, 1)",
		"in-out": "cubic-bezier(0.4, 0, 0.2, 1)"
	},
	transitionProperty: {
		none: "none",
		all: "all",
		colors: [
			"color",
			"background-color",
			"border-color",
			"text-decoration-color",
			"fill",
			"stroke"
		].join(","),
		opacity: "opacity",
		shadow: "box-shadow",
		transform: "transform",
		get DEFAULT() {
			return [
				this.colors,
				"opacity",
				"box-shadow",
				"transform",
				"filter",
				"backdrop-filter"
			].join(",");
		}
	},
	lineWidth,
	spacing,
	duration,
	ringWidth,
	preflightBase,
	containers,
	zIndex,
	media
};
//#endregion
export { textStrokeWidth as A, fontFamily as C, lineHeight as D, letterSpacing as E, blur as M, dropShadow as N, textIndent as O, zIndex as S, fontWeight as T, lineWidth as _, height as a, spacing as b, maxHeight as c, width as d, preflightBase as f, duration as g, breakpoints as h, containers as i, wordSpacing as j, textShadow as k, maxInlineSize as l, boxShadow as m, baseSize as n, inlineSize as o, borderRadius as p, blockSize as r, maxBlockSize as s, theme as t, maxWidth as u, media as v, fontSize as w, verticalBreakpoints as x, ringWidth as y };
