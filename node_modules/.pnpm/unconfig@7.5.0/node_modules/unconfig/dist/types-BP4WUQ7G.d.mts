import { CoreLoadConfigSource, CoreSearchOptions, CustomParser } from "unconfig-core";

//#region ../../node_modules/.pnpm/@antfu+utils@9.3.0/node_modules/@antfu/utils/dist/index.d.mts
/**
 * Array, or not yet
 */
type Arrayable<T> = T | Array<T>;
/**
 * Function
 */
//#endregion
//#region src/types.d.ts
declare const defaultExtensions: string[];
type BuiltinParsers = 'json' | 'import';
interface LoadConfigSource<T = any> extends Omit<CoreLoadConfigSource<T>, 'files' | 'parser'> {
  files: Arrayable<string>;
  /**
   * @default ['mts', 'cts', 'ts', 'mjs', 'cjs', 'js', 'json', '']
   */
  extensions?: string[];
  /**
   * Parser for loading config,
   *
   * @default 'auto'
   */
  parser?: BuiltinParsers | CustomParser<T> | 'auto';
  /**
   * Rewrite the config object,
   * return nullish value to bypassing loading the file
   */
  rewrite?: <F = any>(obj: F, filepath: string) => Promise<T | undefined> | T | undefined;
  /**
   * Transform the source code before loading,
   * return nullish value to skip transformation
   */
  transform?: (code: string, filepath: string) => Promise<string | undefined> | string | undefined;
}
interface SearchOptions extends Omit<CoreSearchOptions, 'multiple'> {
  /**
   * Load from multiple sources and merge them
   *
   * @default false
   */
  merge?: boolean;
}
interface LoadConfigOptions<T = any> extends SearchOptions {
  sources: Arrayable<LoadConfigSource<T>>;
  defaults?: T;
}
interface LoadConfigResult<T> {
  config: T;
  sources: string[];
  dependencies?: string[];
}
//#endregion
export { SearchOptions as a, LoadConfigSource as i, LoadConfigOptions as n, defaultExtensions as o, LoadConfigResult as r, Arrayable as s, BuiltinParsers as t };