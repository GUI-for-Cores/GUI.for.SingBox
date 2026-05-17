import presetUno from "@unocss/preset-uno";
import WebpackPlugin from "@unocss/webpack";
export * from "@unocss/webpack";
//#region src/webpack.ts
function UnocssWebpackPlugin(configOrPath) {
	return WebpackPlugin(configOrPath, { presets: [presetUno()] });
}
//#endregion
export { UnocssWebpackPlugin as default };
