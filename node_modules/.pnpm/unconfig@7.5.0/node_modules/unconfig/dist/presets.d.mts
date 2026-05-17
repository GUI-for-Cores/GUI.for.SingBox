import { i as LoadConfigSource, s as Arrayable, t as BuiltinParsers } from "./types-BP4WUQ7G.mjs";
import * as unconfig_core0 from "unconfig-core";

//#region src/presets.d.ts
interface SourceVitePluginConfigOptions {
  plugins: Arrayable<string>;
  /**
   * Parameters that passed to when the default export is a function
   */
  parameters?: any[];
}
interface SourceObjectFieldOptions extends Omit<LoadConfigSource, 'rewrite'> {
  fields: Arrayable<string>;
  /**
   * Parameters that passed to when the default export is a function
   */
  parameters?: any[];
}
interface SourcePluginFactoryOptions extends Omit<LoadConfigSource, 'transform'> {
  targetModule: string;
  /**
   * Parameters that passed to when the default export is a function
   */
  parameters?: any[];
}
/**
 * Rewrite the config file and extract the options passed to plugin factory
 * (e.g. Vite and Rollup plugins)
 */
declare function sourcePluginFactory(options: SourcePluginFactoryOptions): {
  skipOnError?: boolean | undefined;
  files: Arrayable<string>;
  extensions?: string[] | undefined;
  parser?: "auto" | unconfig_core0.CustomParser<any> | BuiltinParsers | undefined;
  rewrite?: (<F = any>(obj: F, filepath: string) => any) | undefined;
  targetModule: string;
  /**
   * Parameters that passed to when the default export is a function
   */
  parameters?: any[] | undefined;
  transform: (source: string) => string;
};
declare function sourceVitePluginConfig(options: SourceVitePluginConfigOptions): LoadConfigSource;
/**
 * Get one field of the config object
 */
declare function sourceObjectFields(options: SourceObjectFieldOptions): LoadConfigSource;
/**
 * Get one field of `package.json`
 */
declare function sourcePackageJsonFields(options: Pick<SourceObjectFieldOptions, 'fields'>): LoadConfigSource;
//#endregion
export { SourceObjectFieldOptions, SourcePluginFactoryOptions, SourceVitePluginConfigOptions, sourceObjectFields, sourcePackageJsonFields, sourcePluginFactory, sourceVitePluginConfig };