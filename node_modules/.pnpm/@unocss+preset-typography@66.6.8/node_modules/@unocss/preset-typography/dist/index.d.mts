import { Arrayable, CSSObject, Preset } from "@unocss/core";

//#region src/types.d.ts
interface TypographyCompatibilityOptions {
  noColonWhere?: boolean;
  noColonIs?: boolean;
  noColonNot?: boolean;
}
interface TypographyTheme {
  colors?: Record<string, any>;
}
interface TypographyColorScheme {
  'body'?: Arrayable<string | number>;
  'headings'?: Arrayable<string | number>;
  'lead'?: Arrayable<string | number>;
  'links'?: Arrayable<string | number>;
  'bold'?: Arrayable<string | number>;
  'counters'?: Arrayable<string | number>;
  'bullets'?: Arrayable<string | number>;
  'hr'?: Arrayable<string | number>;
  'quotes'?: Arrayable<string | number>;
  'quote-borders'?: Arrayable<string | number>;
  'captions'?: Arrayable<string | number>;
  'kbd'?: Arrayable<string | number>;
  'kbd-shadows'?: Arrayable<string | number>;
  'code'?: Arrayable<string | number>;
  'pre-code'?: Arrayable<string | number>;
  'pre-bg'?: Arrayable<string | number>;
  'th-borders'?: Arrayable<string | number>;
  'td-borders'?: Arrayable<string | number>;
}
interface TypographyCSSObject extends Record<string, CSSObject | string | number> {}
interface TypographySizeScheme extends Record<string, TypographyCSSObject> {}
interface TypographyOptions<T extends TypographyTheme = TypographyTheme> {
  /**
   * The selector name to use the typographic utilities.
   * To undo the styles to the elements, use it like
   * `not-${selectorName}` which is by default `not-prose`.
   *
   * Note: `not` utility is only available in class mode.
   *
   * @default `prose`
   */
  selectorName?: string;
  /**
   * Extend or override CSS selectors with CSS declaration block.
   *
   * @default undefined
   */
  cssExtend?: Record<string, CSSObject> | ((theme: T) => Record<string, CSSObject>);
  /**
   * Compatibility option. Notice that it will affect some features.
   * For more instructions, see
   * [README](https://github.com/unocss/unocss/tree/main/packages-presets/preset-typography)
   *
   * @default undefined
   */
  compatibility?: TypographyCompatibilityOptions;
  /**
   * Control whether prose's utilities should be marked with !important.
   *
   * @default false
   */
  important?: boolean | string;
  /**
   * Color scheme for typography elements.
   *
   * Each key represents a typographic element (e.g., 'body', 'headings', 'links').
   *
   * Type: [light, dark] => [color, invert-color]
   *
   * @default
   *
   * {
   *   'body': [700, 300],
   *   'headings': [900, 'white'],
   *   'lead': [600, 400],
   *   'links': [900, 'white'],
   *   'bold': [900, 'white'],
   *   'counters': [500, 400],
   *   'bullets': [300, 600],
   *   'hr': [200, 700],
   *   'quotes': [900, 100],
   *   'quote-borders': [200, 700],
   *   'captions': [500, 400],
   *   'kbd': [900, 'white'],
   *   'kbd-shadows': [900, 'white'],
   *   'code': [900, 'white'],
   *   'pre-code': [200, 300],
   *   'pre-bg': [800, 'rgb(0 0 0 / 50%)'],
   *   'th-borders': [300, 600],
   *   'td-borders': [200, 700],
   * }
   */
  colorScheme?: TypographyColorScheme;
  /**
   * Size scheme for typography elements.
   *
   * Allows you to customize the CSS styles of various typographic elements.
   * Similar to {@link cssExtend}, but it applies granular overlays to different sizes of text.
   *
   * Example:
   *
   * {
   *
   *   'sm': {@link TypographyCSSObject}
   *
   *   'base': {@link TypographyCSSObject}
   *
   *   'lg': {@link TypographyCSSObject}
   *
   *   'xl': {@link TypographyCSSObject}
   *
   *   '2xl': {@link TypographyCSSObject}
   *
   * }
   *
   */
  sizeScheme?: TypographySizeScheme;
  /**
   * Prefix for generated css vars.
   *
   * @default '--un-prose'
   */
  cssVarPrefix?: string;
}
//#endregion
//#region src/index.d.ts
/**
 * UnoCSS Preset for Typography
 *
 * ```js
 * // uno.config.ts
 * import { presetAttributify, presetWind3/4, defineConfig, presetTypography } from 'unocss'
 *
 * export default defineConfig({
 *   presets: [
 *     presetWind3/4(), // required!
 *     presetAttributify(), // required if using attributify mode
 *     presetTypography()
 *   ]
 * })
 * ```
 *
 * @see https://unocss.dev/presets/typography
 * @returns typography preset
 * @public
 */
declare const presetTypography: <Theme extends TypographyTheme = TypographyTheme>(options?: TypographyOptions<Theme> | undefined) => Preset<Theme>;
//#endregion
export { TypographyCSSObject, TypographyColorScheme, TypographyCompatibilityOptions, TypographyOptions, TypographySizeScheme, TypographyTheme, presetTypography as default, presetTypography };