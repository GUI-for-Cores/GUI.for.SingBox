import { SourceCodeTransformer } from "@unocss/core";

//#region src/index.d.ts
interface TransformerVariantGroupOptions {
  /**
   * Separators to expand.
   *
   * ```
   * foo-(bar baz) -> foo-bar foo-baz
   *    ^
   *    separator
   * ```
   *
   * You may set it to `[':']` for strictness.
   *
   * @default [':', '-']
   * @see https://github.com/unocss/unocss/pull/1231
   */
  separators?: (':' | '-')[];
}
declare function transformerVariantGroup(options?: TransformerVariantGroupOptions): SourceCodeTransformer;
//#endregion
export { TransformerVariantGroupOptions, transformerVariantGroup as default };