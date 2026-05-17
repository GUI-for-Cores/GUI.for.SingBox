import { Rule, Shortcut } from "@unocss/core";
import { Theme } from "@unocss/preset-mini";

//#region src/rules/animation.d.ts
declare const animations: Rule<Theme>[];
//#endregion
//#region src/rules/background.d.ts
declare const backgroundStyles: Rule[];
//#endregion
//#region src/rules/behaviors.d.ts
declare const listStyle: Rule[];
declare const accents: Rule[];
declare const carets: Rule[];
declare const imageRenderings: Rule[];
declare const overscrolls: Rule[];
declare const scrollBehaviors: Rule[];
//#endregion
//#region src/rules/columns.d.ts
declare const columns: Rule<Theme>[];
//#endregion
//#region src/rules/container.d.ts
declare const container: Rule<Theme>[];
declare const containerShortcuts: Shortcut<Theme>[];
//#endregion
//#region src/rules/default.d.ts
declare const rules: Rule<Theme>[];
//#endregion
//#region src/rules/divide.d.ts
declare const divides: Rule[];
//#endregion
//#region src/rules/filters.d.ts
declare const filterBase: {
  '--un-blur': string;
  '--un-brightness': string;
  '--un-contrast': string;
  '--un-drop-shadow': string;
  '--un-grayscale': string;
  '--un-hue-rotate': string;
  '--un-invert': string;
  '--un-saturate': string;
  '--un-sepia': string;
};
declare const backdropFilterBase: {
  '--un-backdrop-blur': string;
  '--un-backdrop-brightness': string;
  '--un-backdrop-contrast': string;
  '--un-backdrop-grayscale': string;
  '--un-backdrop-hue-rotate': string;
  '--un-backdrop-invert': string;
  '--un-backdrop-opacity': string;
  '--un-backdrop-saturate': string;
  '--un-backdrop-sepia': string;
};
declare const filters: Rule<Theme>[];
//#endregion
//#region src/rules/line-clamp.d.ts
declare const lineClamps: Rule[];
//#endregion
//#region src/rules/placeholder.d.ts
declare const placeholders: Rule[];
//#endregion
//#region src/rules/scrolls.d.ts
declare const scrollSnapTypeBase: {
  '--un-scroll-snap-strictness': string;
};
declare const scrolls: Rule[];
//#endregion
//#region src/rules/spacing.d.ts
declare const spaces: Rule[];
//#endregion
//#region src/rules/static.d.ts
declare const textTransforms: Rule[];
declare const hyphens: Rule[];
declare const writingModes: Rule[];
declare const writingOrientations: Rule[];
declare const screenReadersAccess: Rule[];
declare const isolations: Rule[];
declare const objectPositions: Rule[];
declare const backgroundBlendModes: Rule[];
declare const mixBlendModes: Rule[];
declare const dynamicViewportHeight: Rule[];
//#endregion
//#region src/rules/table.d.ts
declare const borderSpacingBase: {
  '--un-border-spacing-x': number;
  '--un-border-spacing-y': number;
};
declare const tables: Rule<Theme>[];
//#endregion
//#region src/rules/touch-actions.d.ts
declare const touchActionBase: {
  '--un-pan-x': string;
  '--un-pan-y': string;
  '--un-pinch-zoom': string;
};
declare const touchActions: Rule[];
//#endregion
//#region src/rules/typography.d.ts
declare const fontVariantNumericBase: {
  '--un-ordinal': string;
  '--un-slashed-zero': string;
  '--un-numeric-figure': string;
  '--un-numeric-spacing': string;
  '--un-numeric-fraction': string;
};
declare const fontVariantNumeric: Rule[];
//#endregion
//#region src/rules/variables.d.ts
declare const cssVariables: Rule[];
//#endregion
//#region src/rules/view-transition.d.ts
declare const viewTransition: Rule[];
//#endregion
export { containerShortcuts as A, lineClamps as C, divides as D, filters as E, listStyle as F, overscrolls as I, scrollBehaviors as L, accents as M, carets as N, rules as O, imageRenderings as P, backgroundStyles as R, placeholders as S, filterBase as T, writingModes as _, touchActionBase as a, scrollSnapTypeBase as b, tables as c, hyphens as d, isolations as f, textTransforms as g, screenReadersAccess as h, fontVariantNumericBase as i, columns as j, container as k, backgroundBlendModes as l, objectPositions as m, cssVariables as n, touchActions as o, mixBlendModes as p, fontVariantNumeric as r, borderSpacingBase as s, viewTransition as t, dynamicViewportHeight as u, writingOrientations as v, backdropFilterBase as w, scrolls as x, spaces as y, animations as z };