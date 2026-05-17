import { Extractor } from "@unocss/core";

//#region src/index.d.ts
declare const quotedArbitraryValuesRE: RegExp;
declare const arbitraryPropertyRE: RegExp;
declare function splitCodeWithArbitraryVariants(code: string): string[];
declare function extractorArbitraryVariants(): Extractor;
//#endregion
export { arbitraryPropertyRE, extractorArbitraryVariants, quotedArbitraryValuesRE, splitCodeWithArbitraryVariants };