import { r as Theme } from "./colors-DCBiEX2u.mjs";
import * as _$_unocss_core0 from "@unocss/core";
import { Postprocessor, Preflight, PresetOptions } from "@unocss/core";

//#region src/preflights.d.ts
declare function preflights(options: PresetMiniOptions): Preflight<Theme>[] | undefined;
//#endregion
//#region src/index.d.ts
interface DarkModeSelectors {
  /**
   * Selectors for light variant.
   *
   * @default '.light'
   */
  light?: string | string[];
  /**
   * Selectors for dark variant.
   *
   * @default '.dark'
   */
  dark?: string | string[];
}
interface PresetMiniOptions extends PresetOptions {
  /**
   * Dark mode options
   *
   * @default 'class'
   */
  dark?: 'class' | 'media' | DarkModeSelectors;
  /**
   * Generate tagged pseudo selector as `[group=""]` instead of `.group`
   *
   * @default false
   */
  attributifyPseudo?: boolean;
  /**
   * Prefix for CSS variables.
   *
   * @default 'un-'
   */
  variablePrefix?: string;
  /**
   * Utils prefix. When using tagged pseudo selector, only the first truthy prefix will be used.
   *
   * @default undefined
   */
  prefix?: string | string[];
  /**
   * Generate preflight
   *
   * @default true
   */
  preflight?: boolean | 'on-demand';
  /**
   * Enable arbitrary variants, for example `<div class="[&>*]:m-1 [&[open]]:p-2"></div>`.
   *
   * Disable this might slightly improve the performance.
   *
   * @default true
   */
  arbitraryVariants?: boolean;
}
/**
 * The basic preset for UnoCSS, with only the most essential utilities.
 *
 * @see https://unocss.dev/presets/mini
 */
declare const presetMini: _$_unocss_core0.PresetFactory<Theme, PresetMiniOptions>;
declare function VarPrefixPostprocessor(prefix: string): Postprocessor | undefined;
//#endregion
export { preflights as a, presetMini as i, PresetMiniOptions as n, VarPrefixPostprocessor as r, DarkModeSelectors as t };