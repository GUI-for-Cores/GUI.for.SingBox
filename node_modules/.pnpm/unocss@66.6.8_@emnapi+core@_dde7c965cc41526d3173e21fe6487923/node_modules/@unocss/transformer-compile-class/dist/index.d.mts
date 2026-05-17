import { SourceCodeTransformer } from "@unocss/core";

//#region src/index.d.ts
interface CompileClassOptions {
  /**
   * Trigger regex literal. The default trigger regex literal matches `:uno:`,
   * for example: `<div class=":uno: font-bold text-white">`.
   *
   * @example
   * The trigger additionally allows defining a capture group named `name`, which
   * allows custom class names. One possible regex would be:
   *
   * ```
   * export default defineConfig({
   *   transformers: [
   *     transformerCompileClass({
   *       trigger: /(["'`]):uno(?:-)?(?<name>[^\s\1]+)?:\s([^\1]*?)\1/g
   *     }),
   *   ],
   * })
   * ```
   *
   * This regular expression matches `:uno-MYNAME:` and uses `MYNAME` in
   * combination with the class prefix as the final class name, for example:
   * `.uno-MYNAME`. It should be noted that the regex literal needs to include
   * the global flag `/g`.
   *
   * @note
   * This parameter is backwards compatible. It accepts string only trigger
   * words, like `:uno:` or a regex literal.
   *
   * @default `/(["'`]):uno(?:-)?(?<name>[^\s\1]+)?:\s([^\1]*?)\1/g`
   */
  trigger?: string | RegExp;
  /**
   * Prefix for compile class name
   * @default 'uno-'
   */
  classPrefix?: string;
  /**
   * Hash function
   */
  hashFn?: (str: string) => string;
  /**
   * Allow add hash to class name even if the class name is explicitly defined
   *
   * @default false
   */
  alwaysHash?: boolean;
  /**
   * Left unknown classes inside the string
   *
   * @default true
   */
  keepUnknown?: boolean;
  /**
   * The layer name of generated rules
   */
  layer?: string;
}
declare function transformerCompileClass(options?: CompileClassOptions): SourceCodeTransformer;
//#endregion
export { CompileClassOptions, transformerCompileClass as default };