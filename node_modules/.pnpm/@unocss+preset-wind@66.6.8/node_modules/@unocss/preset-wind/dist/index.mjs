import { definePreset } from "@unocss/core";
import { presetWind3 } from "@unocss/preset-wind3";
//#region src/index.ts
/**
* @deprecated Use `presetWind3` from `@unocss/preset-wind3` instead
*/
const presetWind = definePreset((options = {}) => {
	return {
		...presetWind3(options),
		name: "@unocss/preset-wind"
	};
});
//#endregion
export { presetWind as default, presetWind };
