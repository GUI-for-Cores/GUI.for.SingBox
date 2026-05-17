import { postprocessors } from "./postprocess.mjs";
import { H as PRESET_NAME, I as globalKeywords, a as themeTracking, f as compressCSS, h as getThemeByKey, n as detectThemeValue, o as trackedProperties, s as trackedTheme } from "./utils-B60b98El.mjs";
import { rules } from "./rules.mjs";
import { shortcuts } from "./shortcuts.mjs";
import { theme } from "./theme.mjs";
import { t as variants } from "./variants-B5PDncV-.mjs";
import { definePreset, escapeSelector, toArray, uniq } from "@unocss/core";
import { extractorArbitraryVariants } from "@unocss/extractor-arbitrary-variants";
import { alphaPlaceholdersRE } from "@unocss/rule-utils";
//#region src/preflights/property.ts
function property(options) {
	if (options.preflights?.property === false) return void 0;
	const propertyConfig = typeof options.preflights?.property === "object" ? options.preflights.property : void 0;
	const parentSelector = propertyConfig?.parent !== void 0 ? propertyConfig.parent : "@supports ((-webkit-hyphens: none) and (not (margin-trim: inline))) or ((-moz-orient: inline) and (not (color:rgb(from red r g b))))";
	const selector = propertyConfig?.selector ?? "*, ::before, ::after, ::backdrop";
	const prefix = options.variablePrefix ?? "un-";
	return {
		getCSS: () => {
			if (trackedProperties.size === 0) return;
			const css = Array.from(trackedProperties.entries()).map(([property, value]) => `${property.replace(/^--un-/, `--${prefix}`)}:${value};`).join("");
			return parentSelector === false ? `${selector}{${css}}` : `${parentSelector}{${selector}{${css}}}`;
		},
		layer: "properties"
	};
}
//#endregion
//#region src/preflights/reset.ts
const resetCSS = `
/*
  1. Prevent padding and border from affecting element width. (https://github.com/mozdevs/cssremedy/issues/4)
  2. Remove default margins and padding
  3. Reset all borders.
*/

*,
::after,
::before,
::backdrop,
::file-selector-button {
  box-sizing: border-box; /* 1 */
  margin: 0; /* 2 */
  padding: 0; /* 2 */
  border: 0 solid; /* 3 */
}

/*
  1. Use a consistent sensible line-height in all browsers.
  2. Prevent adjustments of font size after orientation changes in iOS.
  3. Use a more readable tab size.
  4. Use the user's configured \`sans\` font-family by default.
  5. Use the user's configured \`sans\` font-feature-settings by default.
  6. Use the user's configured \`sans\` font-variation-settings by default.
  7. Disable tap highlights on iOS.
*/

html,
:host {
  line-height: 1.5; /* 1 */
  -webkit-text-size-adjust: 100%; /* 2 */
  tab-size: 4; /* 3 */
  font-family: var(
    --default-font-family,
    ui-sans-serif,
    system-ui,
    sans-serif,
    'Apple Color Emoji',
    'Segoe UI Emoji',
    'Segoe UI Symbol',
    'Noto Color Emoji'
  ); /* 4 */
  font-feature-settings: var(--default-font-featureSettings, normal); /* 5 */
  font-variation-settings: var(--default-font-variationSettings, normal); /* 6 */
  -webkit-tap-highlight-color: transparent; /* 7 */
}

/*
  1. Add the correct height in Firefox.
  2. Correct the inheritance of border color in Firefox. (https://bugzilla.mozilla.org/show_bug.cgi?id=190655)
  3. Reset the default border style to a 1px solid border.
*/

hr {
  height: 0; /* 1 */
  color: inherit; /* 2 */
  border-top-width: 1px; /* 3 */
}

/*
  Add the correct text decoration in Chrome, Edge, and Safari.
*/

abbr:where([title]) {
  -webkit-text-decoration: underline dotted;
  text-decoration: underline dotted;
}

/*
  Remove the default font size and weight for headings.
*/

h1,
h2,
h3,
h4,
h5,
h6 {
  font-size: inherit;
  font-weight: inherit;
}

/*
  Reset links to optimize for opt-in styling instead of opt-out.
*/

a {
  color: inherit;
  -webkit-text-decoration: inherit;
  text-decoration: inherit;
}

/*
  Add the correct font weight in Edge and Safari.
*/

b,
strong {
  font-weight: bolder;
}

/*
  1. Use the user's configured \`mono\` font-family by default.
  2. Use the user's configured \`mono\` font-feature-settings by default.
  3. Use the user's configured \`mono\` font-variation-settings by default.
  4. Correct the odd \`em\` font sizing in all browsers.
*/

code,
kbd,
samp,
pre {
  font-family: var(
    --default-monoFont-family,
    ui-monospace,
    SFMono-Regular,
    Menlo,
    Monaco,
    Consolas,
    'Liberation Mono',
    'Courier New',
    monospace
  ); /* 1 */
  font-feature-settings: var(--default-monoFont-featureSettings, normal); /* 2 */
  font-variation-settings: var(--default-monoFont-variationSettings, normal); /* 3 */
  font-size: 1em; /* 4 */
}

/*
  Add the correct font size in all browsers.
*/

small {
  font-size: 80%;
}

/*
  Prevent \`sub\` and \`sup\` elements from affecting the line height in all browsers.
*/

sub,
sup {
  font-size: 75%;
  line-height: 0;
  position: relative;
  vertical-align: baseline;
}

sub {
  bottom: -0.25em;
}

sup {
  top: -0.5em;
}

/*
  1. Remove text indentation from table contents in Chrome and Safari. (https://bugs.chromium.org/p/chromium/issues/detail?id=999088, https://bugs.webkit.org/show_bug.cgi?id=201297)
  2. Correct table border color inheritance in all Chrome and Safari. (https://bugs.chromium.org/p/chromium/issues/detail?id=935729, https://bugs.webkit.org/show_bug.cgi?id=195016)
  3. Remove gaps between table borders by default.
*/

table {
  text-indent: 0; /* 1 */
  border-color: inherit; /* 2 */
  border-collapse: collapse; /* 3 */
}

/*
  Use the modern Firefox focus style for all focusable elements.
*/

:-moz-focusring {
  outline: auto;
}

/*
  Add the correct vertical alignment in Chrome and Firefox.
*/

progress {
  vertical-align: baseline;
}

/*
  Add the correct display in Chrome and Safari.
*/

summary {
  display: list-item;
}

/*
  Make lists unstyled by default.
*/

ol,
ul,
menu {
  list-style: none;
}

/*
  1. Make replaced elements \`display: block\` by default. (https://github.com/mozdevs/cssremedy/issues/14)
  2. Add \`vertical-align: middle\` to align replaced elements more sensibly by default. (https://github.com/jensimmons/cssremedy/issues/14#issuecomment-634934210)
      This can trigger a poorly considered lint error in some tools but is included by design.
*/

img,
svg,
video,
canvas,
audio,
iframe,
embed,
object {
  display: block; /* 1 */
  vertical-align: middle; /* 2 */
}

/*
  Constrain images and videos to the parent width and preserve their intrinsic aspect ratio. (https://github.com/mozdevs/cssremedy/issues/14)
*/

img,
video {
  max-width: 100%;
  height: auto;
}

/*
  1. Inherit font styles in all browsers.
  2. Remove border radius in all browsers.
  3. Remove background color in all browsers.
  4. Ensure consistent opacity for disabled states in all browsers.
*/

button,
input,
select,
optgroup,
textarea,
::file-selector-button {
  font: inherit; /* 1 */
  font-feature-settings: inherit; /* 1 */
  font-variation-settings: inherit; /* 1 */
  letter-spacing: inherit; /* 1 */
  color: inherit; /* 1 */
  border-radius: 0; /* 2 */
  background-color: transparent; /* 3 */
  opacity: 1; /* 4 */
}

/*
  Restore default font weight.
*/

:where(select:is([multiple], [size])) optgroup {
  font-weight: bolder;
}

/*
  Restore indentation.
*/

:where(select:is([multiple], [size])) optgroup option {
  padding-inline-start: 20px;
}

/*
  Restore space after button.
*/

::file-selector-button {
  margin-inline-end: 4px;
}

/*
  Reset the default placeholder opacity in Firefox. (https://github.com/tailwindlabs/tailwindcss/issues/3300)
*/

::placeholder {
  opacity: 1;
}

/*
  Set the default placeholder color to a semi-transparent version of the current text color in browsers that do not
  crash when using \`color-mix(…)\` with \`currentcolor\`. (https://github.com/tailwindlabs/tailwindcss/issues/17194)
*/

@supports (not (-webkit-appearance: -apple-pay-button)) /* Not Safari */ or
  (contain-intrinsic-size: 1px) /* Safari 17+ */ {
  ::placeholder {
    color: color-mix(in oklab, currentcolor 50%, transparent);
  }
}

/*
  Prevent resizing textareas horizontally by default.
*/

textarea {
  resize: vertical;
}

/*
  Remove the inner padding in Chrome and Safari on macOS.
*/

::-webkit-search-decoration {
  -webkit-appearance: none;
}

/*
  1. Ensure date/time inputs have the same height when empty in iOS Safari.
  2. Ensure text alignment can be changed on date/time inputs in iOS Safari.
*/

::-webkit-date-and-time-value {
  min-height: 1lh; /* 1 */
  text-align: inherit; /* 2 */
}

/*
  Prevent height from changing on date/time inputs in macOS Safari when the input is set to \`display: block\`.
*/

::-webkit-datetime-edit {
  display: inline-flex;
}

/*
  Remove excess padding from pseudo-elements in date/time inputs to ensure consistent height across browsers.
*/

::-webkit-datetime-edit-fields-wrapper {
  padding: 0;
}

::-webkit-datetime-edit,
::-webkit-datetime-edit-year-field,
::-webkit-datetime-edit-month-field,
::-webkit-datetime-edit-day-field,
::-webkit-datetime-edit-hour-field,
::-webkit-datetime-edit-minute-field,
::-webkit-datetime-edit-second-field,
::-webkit-datetime-edit-millisecond-field,
::-webkit-datetime-edit-meridiem-field {
  padding-block: 0;
}

/*
  Center dropdown marker shown on inputs with paired \`<datalist>\`s in Chrome. (https://github.com/tailwindlabs/tailwindcss/issues/18499)
*/

::-webkit-calendar-picker-indicator {
  line-height: 1;
}

/*
  Remove the additional \`:invalid\` styles in Firefox. (https://github.com/mozilla/gecko-dev/blob/2f9eacd9d3d995c937b4251a5557d95d494c9be1/layout/style/res/forms.css#L728-L737)
*/

:-moz-ui-invalid {
  box-shadow: none;
}

/*
  Correct the inability to style the border radius in iOS Safari.
*/

button,
input:where([type='button'], [type='reset'], [type='submit']),
::file-selector-button {
  appearance: button;
}

/*
  Correct the cursor style of increment and decrement buttons in Safari.
*/

::-webkit-inner-spin-button,
::-webkit-outer-spin-button {
  height: auto;
}

/*
  Make elements with the HTML hidden attribute stay hidden by default.
*/

[hidden]:where(:not([hidden~='until-found'])) {
  display: none !important;
}
`;
function reset(options) {
	if (options.preflights?.reset === false) return void 0;
	return {
		getCSS: ({ generator }) => {
			themeTracking("font", "sans");
			themeTracking("font", "mono");
			themeTracking("default", ["font", "family"]);
			themeTracking("default", ["monoFont", "family"]);
			return compressCSS(resetCSS, generator.config.envMode === "dev");
		},
		layer: "base"
	};
}
//#endregion
//#region src/preflights/theme.ts
/** Exclude output for CSS Variables */
const ExcludeCssVarKeys = [
	"spacing",
	"breakpoint",
	"verticalBreakpoint",
	"shadow",
	"insetShadow",
	"dropShadow",
	"textShadow",
	"animation",
	"property",
	"aria",
	"media",
	"supports",
	"containers"
];
function getThemeVarsMap(theme, keys) {
	const themeMap = new Map([["--spacing", theme.spacing.DEFAULT]]);
	const normalizeValue = (value) => value.replace(alphaPlaceholdersRE, "1");
	function process(obj, prefix) {
		for (const key in obj) if (Array.isArray(obj[key])) themeMap.set(`--${prefix}-${key}`, normalizeValue(obj[key].join(",")));
		else if (typeof obj[key] === "object") process(obj[key], `${prefix}-${key}`);
		else themeMap.set(`--${prefix}-${key}`, normalizeValue(obj[key]));
	}
	for (const key in theme) {
		if (!keys.includes(key)) continue;
		process(theme[key], key);
	}
	return themeMap;
}
function theme$1(options) {
	const preflightsTheme = typeof options.preflights?.theme === "boolean" || typeof options.preflights?.theme === "string" ? { mode: options.preflights.theme ?? "on-demand" } : {
		mode: options.preflights?.theme?.mode ?? "on-demand",
		...options.preflights?.theme
	};
	return {
		layer: "theme",
		getCSS(ctx) {
			const { theme, generator } = ctx;
			const safelist = uniq(generator.config.safelist.flatMap((s) => typeof s === "function" ? s(ctx) : s));
			const { mode, process } = preflightsTheme;
			if (mode === false) return;
			if (safelist.length > 0) for (const s of safelist) {
				const [key, ...prop] = s.trim().split(":");
				if (key in theme && prop.length <= 1) {
					const props = prop.length === 0 ? ["DEFAULT"] : prop[0].split("-");
					const v = getThemeByKey(theme, key, props);
					if (typeof v === "string") {
						themeTracking(key, props);
						detectThemeValue(v, theme);
					}
				}
			}
			let deps;
			const generateCSS = (deps) => {
				if (process) for (const utility of deps) for (const p of toArray(process)) p(utility, ctx);
				const resolvedDeps = deps.map(([key, value]) => key && value ? `${escapeSelector(key)}: ${value};` : void 0).filter(Boolean);
				if (resolvedDeps.length === 0) return;
				return compressCSS(`
:root, :host {
${resolvedDeps.join("\n")}
}`, generator.config.envMode === "dev");
			};
			if (mode === "on-demand") {
				if (trackedTheme.size === 0) return void 0;
				deps = Array.from(trackedTheme).map((k) => {
					const [key, prop] = k.split(":");
					const v = getThemeByKey(theme, key, prop.split("-"));
					if (typeof v === "string") return [`--${key}${`${key === "spacing" && prop === "DEFAULT" ? "" : `-${prop}`}`}`, v];
				}).filter(Boolean);
			} else {
				const keys = Object.keys(theme).filter((k) => !ExcludeCssVarKeys.includes(k));
				deps = Array.from(getThemeVarsMap(theme, keys));
			}
			return generateCSS(deps);
		}
	};
}
//#endregion
//#region src/preflights/index.ts
const preflights = (options) => {
	return [
		reset(options),
		theme$1(options),
		property(options)
	].filter(Boolean);
};
//#endregion
//#region src/shorthands.ts
const shorthands = {
	position: [
		"relative",
		"absolute",
		"fixed",
		"sticky",
		"static"
	],
	globalKeyword: globalKeywords
};
//#endregion
//#region src/index.ts
const presetWind4 = definePreset((options = {}) => {
	options.dark = options.dark ?? "class";
	options.attributifyPseudo = options.attributifyPseudo ?? false;
	options.variablePrefix = options.variablePrefix ?? "un-";
	options.important = options.important ?? false;
	return {
		name: PRESET_NAME,
		rules,
		shortcuts,
		theme,
		layers: {
			properties: -200,
			theme: -150,
			base: -100
		},
		preflights: preflights(options),
		variants: variants(options),
		prefix: options.prefix,
		postprocess: postprocessors(options),
		extractorDefault: options.arbitraryVariants === false ? void 0 : extractorArbitraryVariants(),
		autocomplete: { shorthands },
		options,
		configResolved() {
			trackedTheme.clear();
			trackedProperties.clear();
		},
		meta: {
			themeDeps: trackedTheme,
			propertyDeps: trackedProperties
		}
	};
});
//#endregion
export { presetWind4 as default, presetWind4, postprocessors, preflights, rules, shortcuts, shorthands, theme, variants };
