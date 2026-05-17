import { definePreset } from "@unocss/core";
import { presetWind3 } from "@unocss/preset-wind3";
//#region src/index.ts
/**
* @deprecated Use `presetWind3` from `@unocss/preset-wind3` instead
*/
const presetUno = definePreset((options = {}) => {
	return {
		...presetWind3(options),
		name: "@unocss/preset-uno"
	};
});
//#endregion
export { presetUno as default, presetUno };
