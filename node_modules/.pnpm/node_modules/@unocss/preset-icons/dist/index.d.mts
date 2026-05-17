import { a as parseIconWithLoader, i as createPresetIcons, n as combineLoaders, o as _default, r as createCDNFetchLoader, s as IconsOptions, t as IconsAPI } from "./core-KGRmP95_.mjs";
import { UniversalIconLoader } from "@iconify/utils";
import * as _$_unocss_core0 from "@unocss/core";

//#region src/index.d.ts
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
declare const presetIcons: _$_unocss_core0.PresetFactory<object, IconsOptions>;
declare function createNodeLoader(): Promise<UniversalIconLoader | undefined>;
//#endregion
export { IconsAPI, IconsOptions, combineLoaders, createCDNFetchLoader, createNodeLoader, createPresetIcons, presetIcons as default, presetIcons, _default as icons, parseIconWithLoader };