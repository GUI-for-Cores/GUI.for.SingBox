import presetWind3 from "@unocss/preset-wind3";
import VitePlugin from "@unocss/vite";
export * from "@unocss/vite";
//#region src/vite.ts
function UnocssVitePlugin(configOrPath) {
	return VitePlugin(configOrPath, { presets: [presetWind3()] });
}
//#endregion
export { UnocssVitePlugin as default };
