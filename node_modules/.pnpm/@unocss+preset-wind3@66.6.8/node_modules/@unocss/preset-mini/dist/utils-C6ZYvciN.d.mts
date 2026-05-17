import { r as Theme } from "./colors-DCBiEX2u.mjs";
import { CSSObject, DynamicMatcher, StaticRule, VariantContext } from "@unocss/core";
import * as _$_unocss_rule_utils0 from "@unocss/rule-utils";
import { ParsedColorValue } from "@unocss/rule-utils";

//#region src/_utils/handlers/handlers.d.ts
declare namespace handlers_d_exports {
  export { auto, bracket, bracketOfColor, bracketOfLength, bracketOfPosition, cssvar, degree, fraction, global, number, numberWithUnit, percent, position, properties, px, rem, time };
}
declare function numberWithUnit(str: string): string | undefined;
declare function auto(str: string): "auto" | undefined;
declare function rem(str: string): string | undefined;
declare function px(str: string): string | undefined;
declare function number(str: string): number | undefined;
declare function percent(str: string): string | undefined;
declare function fraction(str: string): string | undefined;
declare function bracket(str: string): string | undefined;
declare function bracketOfColor(str: string): string | undefined;
declare function bracketOfLength(str: string): string | undefined;
declare function bracketOfPosition(str: string): string | undefined;
declare function cssvar(str: string): string | undefined;
declare function time(str: string): string | undefined;
declare function degree(str: string): string | undefined;
declare function global(str: string): string | undefined;
declare function properties(str: string): string | undefined;
declare function position(str: string): string | undefined;
//#endregion
//#region src/_utils/handlers/index.d.ts
declare const handler: _$_unocss_rule_utils0.ValueHandler<"number" | "auto" | "position" | "numberWithUnit" | "rem" | "px" | "percent" | "fraction" | "bracket" | "bracketOfColor" | "bracketOfLength" | "bracketOfPosition" | "cssvar" | "time" | "degree" | "global" | "properties", object>;
declare const h: _$_unocss_rule_utils0.ValueHandler<"number" | "auto" | "position" | "numberWithUnit" | "rem" | "px" | "percent" | "fraction" | "bracket" | "bracketOfColor" | "bracketOfLength" | "bracketOfPosition" | "cssvar" | "time" | "degree" | "global" | "properties", object>;
//#endregion
//#region src/_utils/mappings.d.ts
declare const directionMap: Record<string, string[]>;
declare const insetMap: Record<string, string[]>;
declare const cornerMap: Record<string, string[]>;
declare const xyzMap: Record<string, string[]>;
declare const xyzArray: string[];
declare const positionMap: Record<string, string>;
declare const globalKeywords: string[];
declare const cssMathFnRE: RegExp;
declare const cssVarFnRE: RegExp;
//#endregion
//#region src/_utils/utilities.d.ts
declare const CONTROL_MINI_NO_NEGATIVE = "$$mini-no-negative";
/**
 * Provide {@link DynamicMatcher} function returning spacing definition. See spacing rules.
 *
 * @param propertyPrefix - Property for the css value to be created. Postfix will be appended according to direction matched.
 * @see {@link directionMap}
 */
declare function directionSize(propertyPrefix: string): DynamicMatcher;
type ThemeColorKeys = 'colors' | 'borderColor' | 'backgroundColor' | 'textColor' | 'shadowColor' | 'accentColor';
/**
 * Split utility shorthand delimited by / or :
 */
declare function splitShorthand(body: string, type: string): string[] | undefined;
/**
 * Parse color string into {@link ParsedColorValue} (if possible). Color value will first be matched to theme object before parsing.
 * See also color.tests.ts for more examples.
 *
 * @example Parseable strings:
 * 'red' // From theme, if 'red' is available
 * 'red-100' // From theme, plus scale
 * 'red-100/20' // From theme, plus scale/opacity
 * '[rgb(100 2 3)]/[var(--op)]' // Bracket with rgb color and bracket with opacity
 *
 * @param body - Color string to be parsed.
 * @param theme - {@link Theme} object.
 * @return object if string is parseable.
 */
declare function parseColor(body: string, theme: Theme, key?: ThemeColorKeys): ParsedColorValue | undefined;
/**
 * Provide {@link DynamicMatcher} function to produce color value matched from rule.
 *
 * @see {@link parseColor}
 *
 * @example Resolving 'red' from theme:
 * colorResolver('background-color', 'background')('', 'red')
 * return { 'background-color': '#f12' }
 *
 * @example Resolving 'red-100' from theme:
 * colorResolver('background-color', 'background')('', 'red-100')
 * return { '--un-background-opacity': '1', 'background-color': 'rgb(254 226 226 / var(--un-background-opacity))' }
 *
 * @example Resolving 'red-100/20' from theme:
 * colorResolver('background-color', 'background')('', 'red-100/20')
 * return { 'background-color': 'rgb(204 251 241 / 0.22)' }
 *
 * @example Resolving 'hex-124':
 * colorResolver('color', 'text')('', 'hex-124')
 * return { '--un-text-opacity': '1', 'color': 'rgb(17 34 68 / var(--un-text-opacity))' }
 *
 * @param property - Property for the css value to be created.
 * @param varName - Base name for the opacity variable.
 * @param [key] - Theme key to select the color from.
 * @param [shouldPass] - Function to decide whether to pass the css.
 * @return object.
 */
declare function colorResolver(property: string, varName: string, key?: ThemeColorKeys, shouldPass?: (css: CSSObject) => boolean): DynamicMatcher;
declare function colorableShadows(shadows: string | string[], colorVar: string): string[];
declare function hasParseableColor(color: string | undefined, theme: Theme, key: ThemeColorKeys): boolean;
declare function resolveBreakpoints({
  theme,
  generator
}: Readonly<VariantContext<Theme>>, key?: 'breakpoints' | 'verticalBreakpoints'): {
  point: string;
  size: string;
}[] | undefined;
declare function resolveVerticalBreakpoints(context: Readonly<VariantContext<Theme>>): {
  point: string;
  size: string;
}[] | undefined;
declare function makeGlobalStaticRules(prefix: string, property?: string): StaticRule[];
declare function isCSSMathFn(value: string | undefined): boolean;
declare function isSize(str: string): boolean;
declare function transformXYZ(d: string, v: string, name: string): [string, string][];
declare namespace utils_d_exports {
  export { CONTROL_MINI_NO_NEGATIVE, colorResolver, colorableShadows, cornerMap, cssMathFnRE, cssVarFnRE, directionMap, directionSize, globalKeywords, h, handler, hasParseableColor, insetMap, isCSSMathFn, isSize, makeGlobalStaticRules, parseColor, positionMap, resolveBreakpoints, resolveVerticalBreakpoints, splitShorthand, transformXYZ, handlers_d_exports as valueHandlers, xyzArray, xyzMap };
}
//#endregion
export { h as C, xyzMap as S, handlers_d_exports as T, directionMap as _, hasParseableColor as a, positionMap as b, makeGlobalStaticRules as c, resolveVerticalBreakpoints as d, splitShorthand as f, cssVarFnRE as g, cssMathFnRE as h, directionSize as i, parseColor as l, cornerMap as m, colorResolver as n, isCSSMathFn as o, transformXYZ as p, colorableShadows as r, isSize as s, CONTROL_MINI_NO_NEGATIVE as t, resolveBreakpoints as u, globalKeywords as v, handler as w, xyzArray as x, insetMap as y };