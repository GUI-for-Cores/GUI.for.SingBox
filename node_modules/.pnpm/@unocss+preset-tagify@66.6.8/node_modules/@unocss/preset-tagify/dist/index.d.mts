import * as _$_unocss_core0 from "@unocss/core";
import { Extractor, VariantObject } from "@unocss/core";

//#region src/types.d.ts
interface TagifyOptions {
  /**
   * The prefix to use for the tagify variant.
   */
  prefix?: string;
  /**
   * Tags excluded from processing.
   * @default ['b', /^h\d+$/, 'table']
   */
  excludedTags?: (string | RegExp)[];
  /**
   * Extra CSS properties to apply to matched rules
   */
  extraProperties?: Record<string, string> | ((matched: string) => Partial<Record<string, string>>);
  /**
   * Enable default extractor
   * @default true
   */
  defaultExtractor?: boolean;
}
//#endregion
//#region src/extractor.d.ts
declare const MARKER = "__TAGIFY__";
declare const htmlTagRE: RegExp;
declare function extractorTagify(options: TagifyOptions): Extractor;
//#endregion
//#region src/variant.d.ts
declare function variantTagify(options: TagifyOptions): VariantObject;
//#endregion
//#region src/index.d.ts
/**
 * @see https://unocss.dev/presets/tagify
 */
declare const presetTagify: _$_unocss_core0.PresetFactory<object, TagifyOptions>;
//#endregion
export { MARKER, TagifyOptions, presetTagify as default, presetTagify, extractorTagify, htmlTagRE, variantTagify };