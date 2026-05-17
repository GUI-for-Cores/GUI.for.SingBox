import { rules } from "./rules.mjs";
import { shortcuts } from "./shortcuts.mjs";
import { theme } from "./theme.mjs";
import { variants } from "./variants.mjs";
import { definePreset, toArray } from "@unocss/core";
import presetMini, { colors, preflights, presetMini as presetMini$1 } from "@unocss/preset-mini";
//#region src/postprocessors/important.ts
function important(option) {
	if (option == null || option === false) return [];
	const wrapWithIs = (selector) => {
		if (selector.startsWith(":is(") && selector.endsWith(")")) return selector;
		if (selector.includes("::")) return selector.replace(/(.*?)((?:\s\*)?::.*)/, ":is($1)$2");
		return `:is(${selector})`;
	};
	return [option === true ? (util) => {
		util.entries.forEach((i) => {
			if (i[1] != null && !String(i[1]).endsWith("!important")) i[1] += " !important";
		});
	} : (util) => {
		if (!util.selector.startsWith(option)) util.selector = `${option} ${wrapWithIs(util.selector)}`;
	}];
}
//#endregion
//#region src/postprocessors/default.ts
function postprocessors(options) {
	return [...toArray(presetMini(options).postprocess), ...important(options.important)];
}
//#endregion
//#region src/index.ts
/**
* The Tailwind CSS v3 / Windi CSS compact preset for UnoCSS.
*
* @see https://unocss.dev/presets/wind3
*/
const presetWind3 = definePreset((options = {}) => {
	options.important = options.important ?? false;
	return {
		...presetMini$1(options),
		name: "@unocss/preset-wind3",
		theme,
		rules,
		shortcuts,
		variants: variants(options),
		postprocess: postprocessors(options)
	};
});
//#endregion
export { colors, presetWind3 as default, presetWind3 as presetWind, presetWind3, preflights, rules, shortcuts, theme, variants };
