import * as _$_unocss_core0 from "@unocss/core";
import { Variant, VariantFunction, VariantObject } from "@unocss/core";
import * as _$_unocss_preset_mini0 from "@unocss/preset-mini";
import { PresetMiniOptions, Theme as Theme$1, colors, preflights } from "@unocss/preset-mini";

//#region src/variants/combinators.d.ts
declare const variantCombinators: Variant[];
//#endregion
//#region src/variants/dark.d.ts
declare const variantColorsScheme: Variant[];
//#endregion
//#region src/variants/default.d.ts
declare function variants(options: PresetWind3Options): Variant<Theme$1>[];
//#endregion
//#region src/variants/media.d.ts
declare const variantContrasts: Variant[];
declare const variantMotions: Variant[];
declare const variantOrientations: Variant[];
//#endregion
//#region src/variants/misc.d.ts
declare const variantSpaceAndDivide: Variant;
declare const variantStickyHover: Variant[];
//#endregion
//#region src/variants/mix.d.ts
/**
 * Shade the color if the weight is positive, tint the color otherwise.
 * Shading mixes the color with black, Tinting mixes the color with white.
 * @see {@link mixColor}
 */
declare function variantColorMix<Theme extends object>(): VariantObject<Theme>;
//#endregion
//#region src/variants/placeholder.d.ts
declare const placeholderModifier: VariantFunction;
//#endregion
//#region src/index.d.ts
interface PresetWind3Options extends PresetMiniOptions {
  /**
   * The important option lets you control whether UnoCSS’s utilities should be marked with `!important`.
   *
   * This can be really useful when using UnoCSS with existing CSS that has high specificity selectors.
   *
   * You can also set `important` to a selector like `#app` instead, which will generate `#app :is(.m-1) { ... }`
   *
   * Also check out the compatibility with [:is()](https://caniuse.com/?search=%3Ais())
   *
   * @default false
   */
  important?: boolean | string;
}
/**
 * The Tailwind CSS v3 / Windi CSS compact preset for UnoCSS.
 *
 * @see https://unocss.dev/presets/wind3
 */
declare const presetWind3: _$_unocss_core0.PresetFactory<_$_unocss_preset_mini0.Theme, PresetWind3Options>;
//#endregion
export { presetWind3 as a, variantSpaceAndDivide as c, variantMotions as d, variantOrientations as f, variantCombinators as h, preflights as i, variantStickyHover as l, variantColorsScheme as m, Theme$1 as n, placeholderModifier as o, variants as p, colors as r, variantColorMix as s, PresetWind3Options as t, variantContrasts as u };