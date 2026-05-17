import { a as collections_default, i as parseIconWithLoader, n as createCDNFetchLoader, o as getEnvFlags, r as createPresetIcons, t as combineLoaders } from "./core-DIrlUwzK.mjs";
import { t as createCDNLoader } from "./cdn-DYTPkoFm.mjs";
import { createRequire } from "node:module";
import { loadIcon } from "@iconify/utils";
import { definePreset } from "@unocss/core";
//#region \0rolldown/runtime.js
var __require = /* @__PURE__ */ createRequire(import.meta.url);
//#endregion
//#region src/index.ts
const _factory = /* @__PURE__ */ createPresetIcons(async (options) => {
	const { cdn } = options;
	const loaders = [];
	const { isNode, isVSCode, isESLint } = getEnvFlags();
	if (isNode && !isVSCode && !isESLint) {
		const nodeLoader = await createNodeLoader();
		if (nodeLoader !== void 0) loaders.push(nodeLoader);
	}
	if (cdn) loaders.push(await createCDNLoader(cdn));
	loaders.push(loadIcon);
	return combineLoaders(loaders);
});
/**
* Use any icon with Pure CSS for UnoCSS.
*
* @example
*
* ```html
* <div class="i-mdi-alarm"></div>
* <div class="i-logos-vue text-3xl"></div>
* <button class="i-carbon-sun dark:i-carbon-moon"></div>
* ```
*
* @see https://unocss.dev/presets/icons
*/
const presetIcons = /* @__PURE__ */ definePreset((options = {}) => {
	const preset = _factory(options);
	const api = preset.api;
	api.createNodeLoader = createNodeLoader;
	return preset;
});
async function createNodeLoader() {
	try {
		return await import("@iconify/utils/lib/loader/node-loader").then((i) => i?.loadNodeIcon);
	} catch {}
	try {
		return __require("@iconify/utils/lib/loader/node-loader.cjs").loadNodeIcon;
	} catch {}
}
//#endregion
export { combineLoaders, createCDNFetchLoader, createNodeLoader, createPresetIcons, presetIcons as default, presetIcons, collections_default as icons, parseIconWithLoader };
