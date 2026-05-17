import { LoadConfigResult, LoadConfigSource } from "unconfig";
import { UserConfig, UserConfigDefaults } from "@unocss/core";

//#region src/index.d.ts
declare function loadConfig<U extends UserConfig>(cwd?: string, configOrPath?: string | U, extraConfigSources?: LoadConfigSource[], defaults?: UserConfigDefaults): Promise<LoadConfigResult<U>>;
/**
 * Create a factory function that returns a config loader that recovers from errors.
 *
 * When it fails to load the config, it will return the last successfully loaded config.
 *
 * Mainly used for dev-time where users might have a broken config in between changes.
 */
declare function createRecoveryConfigLoader<U extends UserConfig>(): (cwd?: string, configOrPath?: string | U, extraConfigSources?: LoadConfigSource[], defaults?: UserConfigDefaults) => Promise<LoadConfigResult<U>>;
//#endregion
export { type LoadConfigResult, type LoadConfigSource, createRecoveryConfigLoader, loadConfig };