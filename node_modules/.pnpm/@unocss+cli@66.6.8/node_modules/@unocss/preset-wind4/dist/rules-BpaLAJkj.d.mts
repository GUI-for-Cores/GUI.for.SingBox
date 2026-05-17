import { C as Theme$1 } from "./theme-C7zgiweA.mjs";
import { CSSEntries, CSSValueInput, Rule, Shortcut, StaticRule, VariantHandler } from "@unocss/core";
import { Theme } from "@unocss/preset-wind4";

//#region src/rules/align.d.ts
declare const verticalAligns: Rule<Theme$1>[];
declare const textAligns: Rule<Theme$1>[];
//#endregion
//#region src/rules/animation.d.ts
declare const animations: Rule<Theme$1>[];
//#endregion
//#region src/rules/background.d.ts
declare const backgroundStyles: Rule<Theme$1>[];
//#endregion
//#region src/rules/behaviors.d.ts
declare const outline: Rule<Theme$1>[];
declare const appearance: Rule<Theme$1>[];
declare const willChange: Rule<Theme$1>[];
declare const listStyle: Rule<Theme$1>[];
declare const accents: Rule<Theme$1>[];
declare const carets: Rule<Theme$1>[];
declare const imageRenderings: Rule<Theme$1>[];
declare const overscrolls: Rule<Theme$1>[];
declare const scrollBehaviors: Rule<Theme$1>[];
//#endregion
//#region src/rules/border.d.ts
declare const borderStyles: string[];
declare const borders: Rule<Theme$1>[];
declare function handlerBorderStyle([, a, s]: string[]): CSSEntries | undefined;
//#endregion
//#region src/rules/color.d.ts
/**
 * @example op10 op-30 opacity-100
 */
declare const opacity: Rule<Theme$1>[];
declare const bgColors: Rule<Theme$1>[];
declare const colorScheme: Rule<Theme$1>[];
//#endregion
//#region src/rules/columns.d.ts
declare const columns: Rule<Theme$1>[];
//#endregion
//#region src/rules/container.d.ts
declare const containerParent: Rule<Theme$1>[];
declare const container: Rule<Theme$1>[];
declare const containerShortcuts: Shortcut<Theme$1>[];
//#endregion
//#region src/rules/decoration.d.ts
declare const textDecorations: Rule<Theme$1>[];
//#endregion
//#region src/rules/default.d.ts
declare const rules: Rule<Theme$1>[];
//#endregion
//#region src/rules/divide.d.ts
declare const divides: Rule<Theme$1>[];
//#endregion
//#region src/rules/filters.d.ts
declare const filters: Rule<Theme$1>[];
//#endregion
//#region src/rules/flex.d.ts
declare const flex: Rule<Theme$1>[];
//#endregion
//#region src/rules/gap.d.ts
declare const gaps: Rule<Theme$1>[];
//#endregion
//#region src/rules/grid.d.ts
declare const grids: Rule<Theme$1>[];
//#endregion
//#region src/rules/layout.d.ts
declare const overflows: Rule<Theme$1>[];
//#endregion
//#region src/rules/line-clamp.d.ts
declare const lineClamps: Rule<Theme$1>[];
//#endregion
//#region src/rules/mask.d.ts
declare const masks: Rule<Theme>[];
//#endregion
//#region src/rules/placeholder.d.ts
declare const placeholders: Rule<Theme$1>[];
//#endregion
//#region src/rules/position.d.ts
declare const positions: Rule<Theme$1>[];
declare const justifies: StaticRule[];
declare const orders: Rule<Theme$1>[];
declare const alignments: StaticRule[];
declare const placements: StaticRule[];
/**
 * This is to add `flex-` and `grid-` prefix to the alignment rules,
 * supporting `flex="~ items-center"` in attributify mode.
 */
declare const flexGridJustifiesAlignments: StaticRule[];
declare const insets: Rule<Theme$1>[];
declare const floats: Rule<Theme$1>[];
declare const zIndexes: Rule<Theme$1>[];
declare const boxSizing: Rule<Theme$1>[];
//#endregion
//#region src/rules/question-mark.d.ts
/**
 * Used for debugging, only available in development mode.
 *
 * @example `?` / `where`
 */
declare const questionMark: Rule<Theme$1>[];
//#endregion
//#region src/rules/ring.d.ts
declare const rings: Rule<Theme$1>[];
//#endregion
//#region src/rules/scrolls.d.ts
declare const scrolls: Rule<Theme$1>[];
//#endregion
//#region src/rules/shadow.d.ts
declare const shadowProperties: {
  shadow: CSSValueInput;
  shadowColor: CSSValueInput;
  insetShadow: CSSValueInput;
  insetShadowColor: CSSValueInput;
  ringColor: CSSValueInput;
  ringShadow: CSSValueInput;
  insetRingColor: CSSValueInput;
  insetRingShadow: CSSValueInput;
  ringInset: CSSValueInput;
  ringOffsetWidth: CSSValueInput;
  ringOffsetColor: CSSValueInput;
  ringOffsetShadow: CSSValueInput;
};
declare const boxShadows: Rule<Theme$1>[];
//#endregion
//#region src/rules/size.d.ts
declare const sizes: Rule<Theme$1>[];
declare const aspectRatio: Rule<Theme$1>[];
//#endregion
//#region src/rules/spacing.d.ts
declare const paddings: Rule<Theme$1>[];
declare const margins: Rule<Theme$1>[];
declare const spaces: Rule<Theme$1>[];
declare function notLastChildSelectorVariant(s: string): VariantHandler;
//#endregion
//#region src/rules/static.d.ts
declare const displays: Rule<Theme$1>[];
declare const appearances: Rule<Theme$1>[];
declare const cursors: Rule<Theme$1>[];
declare const contains: Rule<Theme$1>[];
declare const pointerEvents: Rule<Theme$1>[];
declare const resizes: Rule<Theme$1>[];
declare const userSelects: Rule<Theme$1>[];
declare const whitespaces: Rule<Theme$1>[];
declare const contentVisibility: Rule<Theme$1>[];
declare const contents: Rule<Theme$1>[];
declare const breaks: Rule<Theme$1>[];
declare const textWraps: Rule<Theme$1>[];
declare const textOverflows: Rule<Theme$1>[];
declare const textTransforms: Rule<Theme$1>[];
declare const fontStyles: Rule<Theme$1>[];
declare const fontSmoothings: Rule<Theme$1>[];
declare const hyphens: Rule<Theme$1>[];
declare const writingModes: Rule<Theme$1>[];
declare const writingOrientations: Rule<Theme$1>[];
declare const screenReadersAccess: Rule<Theme$1>[];
declare const isolations: Rule<Theme$1>[];
declare const objectPositions: Rule<Theme$1>[];
declare const backgroundBlendModes: Rule<Theme$1>[];
declare const mixBlendModes: Rule<Theme$1>[];
declare const dynamicViewportHeight: Rule<Theme$1>[];
declare const accessibility: Rule<Theme$1>[];
declare const fieldSizing: Rule<Theme$1>[];
//#endregion
//#region src/rules/svg.d.ts
declare const svgUtilities: Rule<Theme$1>[];
//#endregion
//#region src/rules/table.d.ts
declare const tables: Rule<Theme$1>[];
//#endregion
//#region src/rules/touch-actions.d.ts
declare const touchActions: Rule<Theme$1>[];
//#endregion
//#region src/rules/transform.d.ts
declare const transformBase: {
  '--un-rotate-x': string;
  '--un-rotate-y': string;
  '--un-rotate-z': string;
  '--un-skew-x': string;
  '--un-skew-y': string;
  '--un-translate-x': number;
  '--un-translate-y': number;
  '--un-translate-z': number;
};
declare const transforms: Rule<Theme$1>[];
//#endregion
//#region src/rules/transition.d.ts
declare const transitions: Rule<Theme$1>[];
//#endregion
//#region src/rules/typography.d.ts
declare const fonts: Rule<Theme$1>[];
declare const tabSizes: Rule<Theme$1>[];
declare const textIndents: Rule<Theme$1>[];
declare const textStrokes: Rule<Theme$1>[];
declare const textShadows: Rule<Theme$1>[];
declare const fontVariantNumeric: Rule<Theme$1>[];
declare function splitShorthand(body: string, type: string): string[] | undefined;
//#endregion
//#region src/rules/variables.d.ts
declare const cssVariables: Rule<Theme$1>[];
declare const cssProperty: Rule<Theme$1>[];
//#endregion
//#region src/rules/view-transition.d.ts
declare const viewTransition: Rule<Theme$1>[];
//#endregion
export { rings as $, hyphens as A, borders as At, userSelects as B, willChange as Bt, contents as C, containerParent as Ct, fieldSizing as D, colorScheme as Dt, dynamicViewportHeight as E, bgColors as Et, resizes as F, imageRenderings as Ft, notLastChildSelectorVariant as G, writingModes as H, animations as Ht, screenReadersAccess as I, listStyle as It, aspectRatio as J, paddings as K, textOverflows as L, outline as Lt, mixBlendModes as M, accents as Mt, objectPositions as N, appearance as Nt, fontSmoothings as O, opacity as Ot, pointerEvents as P, carets as Pt, scrolls as Q, textTransforms as R, overscrolls as Rt, contentVisibility as S, container as St, displays as T, columns as Tt, writingOrientations as U, textAligns as Ut, whitespaces as V, backgroundStyles as Vt, margins as W, verticalAligns as Wt, boxShadows as X, sizes as Y, shadowProperties as Z, accessibility as _, flex as _t, fonts as a, insets as at, breaks as b, rules as bt, textIndents as c, placements as ct, transitions as d, placeholders as dt, questionMark as et, transformBase as f, masks as ft, svgUtilities as g, gaps as gt, tables as h, grids as ht, fontVariantNumeric as i, floats as it, isolations as j, handlerBorderStyle as jt, fontStyles as k, borderStyles as kt, textShadows as l, positions as lt, touchActions as m, overflows as mt, cssProperty as n, boxSizing as nt, splitShorthand as o, justifies as ot, transforms as p, lineClamps as pt, spaces as q, cssVariables as r, flexGridJustifiesAlignments as rt, tabSizes as s, orders as st, viewTransition as t, alignments as tt, textStrokes as u, zIndexes as ut, appearances as v, filters as vt, cursors as w, containerShortcuts as wt, contains as x, textDecorations as xt, backgroundBlendModes as y, divides as yt, textWraps as z, scrollBehaviors as zt };