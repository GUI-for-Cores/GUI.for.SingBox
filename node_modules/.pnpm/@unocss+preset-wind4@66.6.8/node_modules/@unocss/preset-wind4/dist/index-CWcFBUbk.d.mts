import { C as Theme } from "./theme-C7zgiweA.mjs";
import * as _$_unocss_core0 from "@unocss/core";
import { Arrayable, CSSEntry, Postprocessor, Preflight, PreflightContext, PresetOptions, Variant, VariantFunction, VariantObject } from "@unocss/core";

//#region src/postprocess/default.d.ts
declare function postprocessors(options: PresetWind4Options): Postprocessor[];
//#endregion
//#region src/postprocess/important.d.ts
declare function important({
  important: option
}: PresetWind4Options): Postprocessor[];
//#endregion
//#region src/postprocess/varPrefix.d.ts
declare function varPrefix({
  variablePrefix: prefix
}: PresetWind4Options): Postprocessor[];
//#endregion
//#region src/preflights/index.d.ts
declare const preflights: (options: PresetWind4Options) => Preflight<Theme>[];
//#endregion
//#region src/shortcuts/index.d.ts
declare const shortcuts: _$_unocss_core0.Shortcut<Theme>[];
//#endregion
//#region src/shorthands.d.ts
declare const shorthands: {
  position: string[];
  globalKeyword: string[];
};
//#endregion
//#region src/variants/aria.d.ts
declare const variantAria: VariantObject<Theme>;
declare const variantTaggedAriaAttributes: Variant<Theme>[];
//#endregion
//#region src/variants/breakpoints.d.ts
declare function variantBreakpoints(): VariantObject<Theme>;
//#endregion
//#region src/variants/children.d.ts
declare const variantChildren: Variant<Theme>[];
//#endregion
//#region src/variants/combinators.d.ts
declare const variantCombinators: Variant<Theme>[];
declare const variantSvgCombinators: Variant<Theme>[];
//#endregion
//#region src/variants/container.d.ts
declare const variantContainerQuery: VariantObject<Theme>;
//#endregion
//#region src/variants/dark.d.ts
declare function variantColorsMediaOrClass(options?: PresetWind4Options): Variant<Theme>[];
declare const variantColorsScheme: Variant<Theme>[];
//#endregion
//#region src/variants/data.d.ts
declare const variantDataAttribute: VariantObject<Theme>;
declare const variantTaggedDataAttributes: Variant<Theme>[];
//#endregion
//#region src/variants/default.d.ts
declare function variants(options: PresetWind4Options): Variant<Theme>[];
//#endregion
//#region src/variants/directions.d.ts
declare const variantLanguageDirections: Variant<Theme>[];
//#endregion
//#region src/variants/important.d.ts
declare function variantImportant(): VariantObject<Theme>;
//#endregion
//#region src/variants/media.d.ts
declare const variantNoscript: VariantObject;
declare const variantScripting: VariantObject<Theme>;
declare const variantPrint: VariantObject<Theme>;
declare const variantCustomMedia: VariantObject<Theme>;
declare const variantContrasts: Variant<Theme>[];
declare const variantMotions: Variant<Theme>[];
declare const variantOrientations: Variant<Theme>[];
declare const variantForcedColors: Variant<Theme>[];
//#endregion
//#region src/variants/misc.d.ts
declare const variantSelector: Variant<Theme>;
declare const variantCssLayer: Variant<Theme>;
declare const variantInternalLayer: Variant<Theme>;
declare const variantScope: Variant<Theme>;
declare const variantVariables: Variant<Theme>;
declare const variantTheme: Variant<Theme>;
declare const variantStickyHover: Variant<Theme>[];
declare const variantImplicitGroup: Variant;
//#endregion
//#region src/variants/negative.d.ts
declare const variantNegative: Variant<Theme>;
//#endregion
//#region src/variants/placeholder.d.ts
declare const placeholderModifier: VariantFunction<Theme>;
//#endregion
//#region src/variants/pseudo.d.ts
declare function variantPseudoClassesAndElements(): VariantObject<Theme>[];
declare function variantPseudoClassFunctions(): VariantObject<Theme>;
declare function variantTaggedPseudoClasses(options?: PresetWind4Options): VariantObject<Theme>[];
declare const variantPartClasses: VariantObject<Theme>;
//#endregion
//#region src/variants/startingstyle.d.ts
declare const variantStartingStyle: Variant<Theme>;
//#endregion
//#region src/variants/supports.d.ts
declare const variantSupports: VariantObject<Theme>;
//#endregion
//#region src/index.d.ts
interface DarkModeSelectors {
  /**
   * Selector for light variant.
   *
   * @default '.light'
   */
  light?: string;
  /**
   * Selector for dark variant.
   *
   * @default '.dark'
   */
  dark?: string;
}
interface PreflightsTheme {
  /**
   * Generate theme keys as CSS variables.
   *
   * - `true`: Generate theme keys fully.
   * - `false`: Disable theme keys. (Not recommended ⚠️)
   * - `'on-demand'`: Generate theme keys only when used.
   *
   * @default 'on-demand'
   */
  mode?: boolean | 'on-demand';
  /**
   * Process the theme keys.
   */
  process?: Arrayable<(entry: CSSEntry, ctx: PreflightContext<Theme>) => void>;
}
interface PresetWind4Options extends PresetOptions {
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
   * Enable arbitrary variants, for example `<div class="[&>*]:m-1 [&[open]]:p-2"></div>`.
   *
   * Disable this might slightly improve the performance.
   *
   * @default true
   */
  arbitraryVariants?: boolean;
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
  /**
   * Control the preflight styles.
   */
  preflights?: {
    /**
     * Reset the default preflight styles.
     *
     * @default true
     */
    reset?: boolean;
    /**
     * Theme configuration for preflight styles.
     *
     * This can either be a specific mode from `PreflightsTheme['mode']` or a full `PreflightsTheme` object.
     *
     * The theme defines the base styles applied to elements and can be customized
     * to match the design system or requirements of your project.
     */
    theme?: PreflightsTheme['mode'] | PreflightsTheme;
    /**
     * Configuration for property preflight generation.
     *
     * - `false`: Disable property preflight
     * - `true` or `undefined`: Enable with default configuration
     * - `object`: Enable with custom configuration
     */
    property?: boolean | {
      /**
       * Custom parent selector (e.g., @supports query or @layer).
       *
       * - `string`: Use custom parent selector
       * - `false`: No parent wrapper, apply properties directly to selector
       * - `undefined`: Use default @supports query
       *
       * @default '@supports ((-webkit-hyphens: none) and (not (margin-trim: inline))) or ((-moz-orient: inline) and (not (color:rgb(from red r g b))))'
       */
      parent?: string | false;
      /**
       * Custom selector for applying properties.
       *
       * @default '*, ::before, ::after, ::backdrop'
       */
      selector?: string;
    };
  };
}
declare const presetWind4: _$_unocss_core0.PresetFactory<Theme, PresetWind4Options>;
//#endregion
export { variantLanguageDirections as A, variantBreakpoints as B, variantForcedColors as C, variantPrint as D, variantOrientations as E, variantColorsScheme as F, preflights as G, variantTaggedAriaAttributes as H, variantContainerQuery as I, postprocessors as J, varPrefix as K, variantCombinators as L, variantDataAttribute as M, variantTaggedDataAttributes as N, variantScripting as O, variantColorsMediaOrClass as P, variantSvgCombinators as R, variantCustomMedia as S, variantNoscript as T, shorthands as U, variantAria as V, shortcuts as W, variantSelector as _, variantSupports as a, variantVariables as b, variantPseudoClassFunctions as c, placeholderModifier as d, variantNegative as f, variantScope as g, variantInternalLayer as h, presetWind4 as i, variants as j, variantImportant as k, variantPseudoClassesAndElements as l, variantImplicitGroup as m, PreflightsTheme as n, variantStartingStyle as o, variantCssLayer as p, important as q, PresetWind4Options as r, variantPartClasses as s, DarkModeSelectors as t, variantTaggedPseudoClasses as u, variantStickyHover as v, variantMotions as w, variantContrasts as x, variantTheme as y, variantChildren as z };