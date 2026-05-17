import { C as globalKeywords, d as parseColor } from "./utils-BtCNpQqm.mjs";
import { rules } from "./rules.mjs";
import { t as colors } from "./colors-BSuZg9eF.mjs";
import { t as theme } from "./theme-CnGJp5L0.mjs";
import { variants } from "./variants.mjs";
import { definePreset, entriesToCss, toArray } from "@unocss/core";
import { extractorArbitraryVariants } from "@unocss/extractor-arbitrary-variants";
//#region src/preflights.ts
function preflights(options) {
	if (options.preflight) return [{
		layer: "preflights",
		getCSS({ theme, generator }) {
			if (theme.preflightBase) {
				let entries = Object.entries(theme.preflightBase);
				if (options.preflight === "on-demand") {
					const keys = new Set(Array.from(generator.activatedRules).map((r) => r[2]?.custom?.preflightKeys).filter(Boolean).flat());
					entries = entries.filter(([k]) => keys.has(k));
				}
				if (entries.length > 0) {
					let css = entriesToCss(entries);
					if (options.variablePrefix !== "un-") css = css.replace(/--un-/g, `--${options.variablePrefix}`);
					return toArray(theme.preflightRoot ?? ["*,::before,::after", "::backdrop"]).map((root) => `${root}{${css}}`).join("");
				}
			}
		}
	}];
}
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
/**
* The basic preset for UnoCSS, with only the most essential utilities.
*
* @see https://unocss.dev/presets/mini
*/
const presetMini = definePreset((options = {}) => {
	options.dark = options.dark ?? "class";
	options.attributifyPseudo = options.attributifyPseudo ?? false;
	options.preflight = options.preflight ?? true;
	options.variablePrefix = options.variablePrefix ?? "un-";
	return {
		name: "@unocss/preset-mini",
		theme,
		rules,
		variants: variants(options),
		options,
		prefix: options.prefix,
		postprocess: VarPrefixPostprocessor(options.variablePrefix),
		preflights: preflights(options),
		extractorDefault: options.arbitraryVariants === false ? void 0 : extractorArbitraryVariants(),
		autocomplete: { shorthands }
	};
});
function VarPrefixPostprocessor(prefix) {
	if (prefix !== "un-") return (obj) => {
		obj.entries.forEach((i) => {
			i[0] = i[0].replace(/^--un-/, `--${prefix}`);
			if (typeof i[1] === "string") i[1] = i[1].replace(/var\(--un-/g, `var(--${prefix}`);
		});
	};
}
//#endregion
export { VarPrefixPostprocessor, colors, presetMini as default, presetMini, parseColor, preflights, theme };
