import { r as Theme } from "./colors-DCBiEX2u.mjs";
import { n as PresetMiniOptions } from "./index-Df-rxaWU.mjs";
import { Variant, VariantObject } from "@unocss/core";

//#region src/_variants/aria.d.ts
declare const variantAria: VariantObject;
declare function variantTaggedAriaAttributes(options?: PresetMiniOptions): Variant[];
//#endregion
//#region src/_variants/breakpoints.d.ts
declare function variantBreakpoints(): VariantObject;
//#endregion
//#region src/_variants/children.d.ts
declare const variantChildren: Variant[];
//#endregion
//#region src/_variants/combinators.d.ts
declare const variantCombinators: Variant[];
//#endregion
//#region src/_variants/container.d.ts
declare const variantContainerQuery: VariantObject;
//#endregion
//#region src/_variants/dark.d.ts
declare function variantColorsMediaOrClass(options?: PresetMiniOptions): Variant[];
//#endregion
//#region src/_variants/data.d.ts
declare const variantDataAttribute: VariantObject;
declare function variantTaggedDataAttributes(options?: PresetMiniOptions): Variant[];
//#endregion
//#region src/_variants/default.d.ts
declare function variants(options: PresetMiniOptions): Variant<Theme>[];
//#endregion
//#region src/_variants/directions.d.ts
declare const variantLanguageDirections: Variant[];
//#endregion
//#region src/_variants/important.d.ts
declare function variantImportant(): VariantObject;
//#endregion
//#region src/_variants/media.d.ts
declare const variantPrint: VariantObject;
declare const variantCustomMedia: VariantObject;
//#endregion
//#region src/_variants/misc.d.ts
declare const variantSelector: Variant;
declare const variantCssLayer: Variant;
declare const variantInternalLayer: Variant;
declare const variantScope: Variant;
declare const variantVariables: Variant;
declare const variantTheme: Variant;
//#endregion
//#region src/_variants/negative.d.ts
declare const variantNegative: Variant;
//#endregion
//#region src/_variants/pseudo.d.ts
declare function variantPseudoClassesAndElements(): VariantObject[];
declare function variantPseudoClassFunctions(): VariantObject;
declare function variantTaggedPseudoClasses(options?: PresetMiniOptions): VariantObject[];
declare const variantPartClasses: VariantObject;
//#endregion
//#region src/_variants/startingstyle.d.ts
declare const variantStartingStyle: Variant;
//#endregion
//#region src/_variants/supports.d.ts
declare const variantSupports: VariantObject;
//#endregion
export { variantAria, variantBreakpoints, variantChildren, variantColorsMediaOrClass, variantCombinators, variantContainerQuery, variantCssLayer, variantCustomMedia, variantDataAttribute, variantImportant, variantInternalLayer, variantLanguageDirections, variantNegative, variantPartClasses, variantPrint, variantPseudoClassFunctions, variantPseudoClassesAndElements, variantScope, variantSelector, variantStartingStyle, variantSupports, variantTaggedAriaAttributes, variantTaggedDataAttributes, variantTaggedPseudoClasses, variantTheme, variantVariables, variants };