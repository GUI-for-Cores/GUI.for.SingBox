import { Arrayable, VariantHandlerContext, VariantObject } from "@unocss/core";

//#region src/colors.d.ts
interface CSSColorValue {
  type: string;
  components: (string | number)[];
  alpha: string | number | undefined;
}
type RGBAColorValue = [number, number, number, number] | [number, number, number];
interface ParsedColorValue {
  /**
   * Parsed color value.
   */
  color?: string;
  /**
   * Parsed opacity value.
   */
  opacity: string;
  /**
   * Color name.
   */
  name: string;
  /**
   * Color scale, preferably 000 - 999.
   */
  no: string;
  /**
   * {@link CSSColorValue}
   */
  cssColor: CSSColorValue | undefined;
  /**
   * Parsed alpha value from opacity
   */
  alpha: string | number | undefined;
}
declare const cssColorFunctions: string[];
declare const rectangularColorSpace: string[];
declare const polarColorSpace: string[];
declare const hueInterpolationMethods: string[];
declare const alphaPlaceholders: string[];
declare const alphaPlaceholdersRE: RegExp;
declare function isInterpolatedMethod(type?: string): boolean;
declare function hex2rgba(hex?: string): RGBAColorValue | undefined;
declare function parseCssColor(str?: string): CSSColorValue | undefined;
declare function colorOpacityToString(color: CSSColorValue): string | number;
declare function colorToString(color: CSSColorValue | string, alphaOverride?: string | number): string;
//#endregion
//#region src/directive.d.ts
declare const themeFnRE: RegExp;
declare function hasThemeFn(str: string): boolean;
declare function transformThemeFn(code: string, theme: Record<string, any>, throwOnMissing?: boolean): string;
declare function transformThemeString(code: string, theme: Record<string, any>, throwOnMissing?: boolean): string | undefined;
declare function calcMaxWidthBySize(size: string): string;
//#endregion
//#region src/handlers.d.ts
type ValueHandlerCallback<T extends object> = (str: string, theme?: T) => string | number | undefined;
type ValueHandler<K extends string, T extends object> = { [S in K]: ValueHandler<K, T> } & {
  (str: string, theme?: T): string | undefined;
  __options: {
    sequence: K[];
  };
};
declare function createValueHandler<K extends string, T extends object>(handlers: Record<K, ValueHandlerCallback<T>>): ValueHandler<K, T>;
//#endregion
//#region src/icon.d.ts
declare const iconFnRE: RegExp;
declare function hasIconFn(str: string): boolean;
//#endregion
//#region src/utilities.d.ts
declare function getBracket(str: string, open: string, close: string): string[] | undefined;
declare function getStringComponent(str: string, open: string, close: string, separators: string | string[]): string[] | undefined;
declare function getStringComponents(str: string, separators: string | string[], limit?: number, open?: string, close?: string): string[] | undefined;
//#endregion
//#region src/variants.d.ts
declare function variantMatcher<T extends object = object>(name: string, handler: Arrayable<(input: VariantHandlerContext) => Record<string, any>>, options?: Omit<VariantObject<T>, 'match'>): VariantObject<T>;
declare function variantParentMatcher<T extends object = object>(name: string, parent: string): VariantObject<T>;
declare function variantGetBracket(prefix: string, matcher: string, separators: string[]): string[] | undefined;
declare function variantGetParameter(prefix: Arrayable<string>, matcher: string, separators: string[]): string[] | undefined;
//#endregion
//#region src/pseudo.d.ts
/**
 * Note: the order of following pseudo classes will affect the order of generated css.
 *
 * Reference: https://github.com/tailwindlabs/tailwindcss/blob/main/src/corePlugins.js#L83
 */
declare const PseudoClasses: Record<string, string>;
declare const PseudoClassesKeys: string[];
declare const PseudoClassesColon: Record<string, string>;
declare const PseudoClassesColonKeys: string[];
declare const PseudoClassFunctions: string[];
declare const PseudoClassesMulti: Record<string, string[]>;
declare const PseudoClassesStr: string;
declare const PseudoClassesColonStr: string;
declare const PseudoClassFunctionsStr: string;
declare const PseudoClassesMultiStr: string;
declare const excludedPseudo: string[];
declare const PseudoClassesAndElementsStr: string;
declare const PseudoClassesAndElementsColonStr: string;
interface PseudoVariantOptions {
  /**
   * Generate tagged pseudo selector as `[group=""]` instead of `.group`
   *
   * @default false
   */
  attributifyPseudo?: boolean;
  /**
   * Utils prefix
   */
  prefix?: string | string[];
}
interface PseudoVariantUtilities<Theme extends object = object> {
  getBracket: typeof getBracket;
  h: {
    bracket: (s: string, theme?: Theme) => string | undefined;
  };
  variantGetBracket: typeof variantGetBracket;
}
declare function createTaggedPseudoClassMatcher<T extends object = object>(tag: string, parent: string, combinator: string, utils: PseudoVariantUtilities): VariantObject<T>;
declare function createPseudoClassesAndElements<T extends object = object>(utils: PseudoVariantUtilities): VariantObject<T>[];
declare function createPseudoClassFunctions<T extends object = object>(utils: PseudoVariantUtilities): VariantObject<T>;
declare function createTaggedPseudoClasses<T extends object = object>(options: PseudoVariantOptions, utils: PseudoVariantUtilities): VariantObject<T>[];
declare function createPartClasses<T extends object = object>(): VariantObject<T>;
//#endregion
export { CSSColorValue, ParsedColorValue, PseudoClassFunctions, PseudoClassFunctionsStr, PseudoClasses, PseudoClassesAndElementsColonStr, PseudoClassesAndElementsStr, PseudoClassesColon, PseudoClassesColonKeys, PseudoClassesColonStr, PseudoClassesKeys, PseudoClassesMulti, PseudoClassesMultiStr, PseudoClassesStr, PseudoVariantOptions, PseudoVariantUtilities, RGBAColorValue, ValueHandler, ValueHandlerCallback, alphaPlaceholders, alphaPlaceholdersRE, calcMaxWidthBySize, colorOpacityToString, colorToString, createPartClasses, createPseudoClassFunctions, createPseudoClassesAndElements, createTaggedPseudoClassMatcher, createTaggedPseudoClasses, createValueHandler, cssColorFunctions, excludedPseudo, getBracket, getStringComponent, getStringComponents, hasIconFn, hasThemeFn, hex2rgba, hueInterpolationMethods, iconFnRE, isInterpolatedMethod, parseCssColor, polarColorSpace, rectangularColorSpace, themeFnRE, transformThemeFn, transformThemeString, variantGetBracket, variantGetParameter, variantMatcher, variantParentMatcher };