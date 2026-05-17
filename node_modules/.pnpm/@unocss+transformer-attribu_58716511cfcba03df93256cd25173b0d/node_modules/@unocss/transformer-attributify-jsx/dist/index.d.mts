import { SourceCodeTransformer, UnoGenerator } from "@unocss/core";
import MagicString from "magic-string";

//#region src/index.d.ts
type FilterPattern = Array<string | RegExp> | string | RegExp | null;
interface TransformerAttributifyJsxOptions {
  /**
   * the list of attributes to ignore
   * @default []
   */
  blocklist?: (string | RegExp)[];
  /**
   * Regex of modules to be included from processing
   * @default [/\.[jt]sx$/, /\.mdx$/]
   */
  include?: FilterPattern;
  /**
   * Regex of modules to exclude from processing
   *
   * @default []
   */
  exclude?: FilterPattern;
}
interface AttributifyResolverParams {
  code: MagicString;
  id: string;
  uno: UnoGenerator<object>;
  isBlocked: (matchedRule: string) => boolean;
}
declare function transformerAttributifyJsx(options?: TransformerAttributifyJsxOptions): SourceCodeTransformer;
//#endregion
export { AttributifyResolverParams, FilterPattern, TransformerAttributifyJsxOptions, transformerAttributifyJsx as default };