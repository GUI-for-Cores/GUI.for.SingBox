import { a as SearchOptions, i as LoadConfigSource, n as LoadConfigOptions, o as defaultExtensions, r as LoadConfigResult, t as BuiltinParsers } from "./types-BP4WUQ7G.mjs";
import { QuansyncAwaitableGenerator } from "quansync/macro";
import * as quansync$1 from "quansync";
export * from "unconfig-core";

//#region src/index.d.ts
declare function createConfigLoader<T>(options: LoadConfigOptions): {
  load: quansync$1.QuansyncFn<LoadConfigResult<T>, [force?: Args[0] | undefined]>;
  findConfigs: quansync$1.QuansyncFn<string[], []>;
};
declare const loadConfig: {
  <T>(options: LoadConfigOptions<T>): QuansyncAwaitableGenerator<LoadConfigResult<T>>;
  sync: <T>(options: LoadConfigOptions<T>) => LoadConfigResult<T>;
  async: <T>(options: LoadConfigOptions<T>) => Promise<LoadConfigResult<T>>;
};
declare const loadConfigSync: <T>(options: LoadConfigOptions<T>) => LoadConfigResult<T>;
//#endregion
export { BuiltinParsers, LoadConfigOptions, LoadConfigResult, LoadConfigSource, SearchOptions, createConfigLoader, defaultExtensions, loadConfig, loadConfigSync };