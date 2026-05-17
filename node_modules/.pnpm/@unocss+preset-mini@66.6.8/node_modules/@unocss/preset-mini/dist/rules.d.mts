import { r as Theme } from "./colors-DCBiEX2u.mjs";
import { CSSEntries, Rule, StaticRule } from "@unocss/core";

//#region src/_rules/align.d.ts
declare const verticalAligns: Rule[];
declare const textAligns: Rule[];
//#endregion
//#region src/_rules/behaviors.d.ts
declare const outline: Rule<Theme>[];
declare const appearance: Rule[];
declare const willChange: Rule[];
//#endregion
//#region src/_rules/border.d.ts
declare const borderStyles: string[];
declare const borders: Rule[];
declare function handlerBorderStyle([, a, s]: string[]): CSSEntries | undefined;
//#endregion
//#region src/_rules/color.d.ts
/**
 * @example op10 op-30 opacity-100
 */
declare const opacity: Rule[];
declare const bgColors: Rule[];
declare const colorScheme: Rule[];
//#endregion
//#region src/_rules/container.d.ts
declare const containerParent: Rule[];
//#endregion
//#region src/_rules/decoration.d.ts
declare const textDecorations: Rule<Theme>[];
//#endregion
//#region src/_rules/default.d.ts
declare const rules: Rule<Theme>[];
//#endregion
//#region src/_rules/flex.d.ts
declare const flex: Rule<Theme>[];
//#endregion
//#region src/_rules/gap.d.ts
declare const gaps: Rule[];
//#endregion
//#region src/_rules/grid.d.ts
declare const grids: Rule<Theme>[];
//#endregion
//#region src/_rules/layout.d.ts
declare const overflows: Rule[];
//#endregion
//#region src/_rules/position.d.ts
declare const positions: Rule[];
declare const justifies: StaticRule[];
declare const orders: Rule[];
declare const alignments: StaticRule[];
declare const placements: StaticRule[];
/**
 * This is to add `flex-` and `grid-` prefix to the alignment rules,
 * supporting `flex="~ items-center"` in attributify mode.
 */
declare const flexGridJustifiesAlignments: StaticRule[];
declare const insets: Rule[];
declare const floats: Rule[];
declare const zIndexes: Rule[];
declare const boxSizing: Rule[];
//#endregion
//#region src/_rules/question-mark.d.ts
/**
 * Used for debugging, only available in development mode.
 *
 * @example `?` / `where`
 */
declare const questionMark: Rule[];
//#endregion
//#region src/_rules/ring.d.ts
declare const ringBase: {
  '--un-ring-inset': string;
  '--un-ring-offset-width': string;
  '--un-ring-offset-color': string;
  '--un-ring-width': string;
  '--un-ring-color': string;
  '--un-shadow': string;
};
declare const rings: Rule<Theme>[];
//#endregion
//#region src/_rules/shadow.d.ts
declare const boxShadowsBase: {
  '--un-ring-offset-shadow': string;
  '--un-ring-shadow': string;
  '--un-shadow-inset': string;
  '--un-shadow': string;
};
declare const boxShadows: Rule<Theme>[];
//#endregion
//#region src/_rules/size.d.ts
declare const sizes: Rule<Theme>[];
declare const aspectRatio: Rule[];
//#endregion
//#region src/_rules/spacing.d.ts
declare const paddings: Rule[];
declare const margins: Rule[];
//#endregion
//#region src/_rules/static.d.ts
declare const varEmpty = " ";
declare const displays: Rule[];
declare const appearances: Rule[];
declare const cursors: Rule[];
declare const contains: Rule[];
declare const pointerEvents: Rule[];
declare const resizes: Rule[];
declare const userSelects: Rule[];
declare const whitespaces: Rule[];
declare const contentVisibility: Rule[];
declare const contents: Rule[];
declare const breaks: Rule[];
declare const textWraps: Rule[];
declare const textOverflows: Rule[];
declare const textTransforms: Rule[];
declare const fontStyles: Rule[];
declare const fontSmoothings: Rule[];
declare const fieldSizing: Rule[];
//#endregion
//#region src/_rules/svg.d.ts
declare const svgUtilities: Rule<Theme>[];
//#endregion
//#region src/_rules/transform.d.ts
declare const transformBase: {
  '--un-rotate': number;
  '--un-rotate-x': number;
  '--un-rotate-y': number;
  '--un-rotate-z': number;
  '--un-scale-x': number;
  '--un-scale-y': number;
  '--un-scale-z': number;
  '--un-skew-x': number;
  '--un-skew-y': number;
  '--un-translate-x': number;
  '--un-translate-y': number;
  '--un-translate-z': number;
};
declare const transforms: Rule[];
//#endregion
//#region src/_rules/transition.d.ts
declare const transitions: Rule<Theme>[];
//#endregion
//#region src/_rules/typography.d.ts
declare const fonts: Rule<Theme>[];
declare const tabSizes: Rule<Theme>[];
declare const textIndents: Rule<Theme>[];
declare const textStrokes: Rule<Theme>[];
declare const textShadows: Rule<Theme>[];
//#endregion
//#region src/_rules/variables.d.ts
declare const cssVariables: Rule[];
declare const cssProperty: Rule[];
//#endregion
export { alignments, appearance, appearances, aspectRatio, bgColors, borderStyles, borders, boxShadows, boxShadowsBase, boxSizing, breaks, colorScheme, containerParent, contains, contentVisibility, contents, cssProperty, cssVariables, cursors, displays, fieldSizing, flex, flexGridJustifiesAlignments, floats, fontSmoothings, fontStyles, fonts, gaps, grids, handlerBorderStyle, insets, justifies, margins, opacity, orders, outline, overflows, paddings, placements, pointerEvents, positions, questionMark, resizes, ringBase, rings, rules, sizes, svgUtilities, tabSizes, textAligns, textDecorations, textIndents, textOverflows, textShadows, textStrokes, textTransforms, textWraps, transformBase, transforms, transitions, userSelects, varEmpty, verticalAligns, whitespaces, willChange, zIndexes };