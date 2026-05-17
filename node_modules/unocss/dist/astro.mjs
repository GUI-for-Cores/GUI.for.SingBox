import presetUno from "@unocss/preset-uno";
import AstroIntegrationPlugin from "@unocss/astro";
//#region src/astro.ts
function UnocssAstroIntegration(config) {
	return AstroIntegrationPlugin(config, { presets: [presetUno()] });
}
//#endregion
export { UnocssAstroIntegration as default };
