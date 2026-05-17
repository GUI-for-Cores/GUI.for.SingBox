import { UnocssPluginContext, UserConfig, UserConfigDefaults } from "@unocss/core";
import * as _$vite from "vite";
import { Plugin } from "vite";

//#region src/types.d.ts
interface VitePluginConfig<Theme extends object = object> extends UserConfig<Theme> {
  /**
   * Enable UnoCSS inspector
   *
   * @default true
   */
  inspector?: boolean;
  /**
   * CSS Generation mode
   *
   * - `global` - generate a single CSS sheet for entire App
   * - `dist-chunk` - generate a CSS sheet for each code chunk on build, great for MPA
   * - `per-module` - generate a CSS sheet for each module, can be scoped
   * - `vue-scoped` - inject generated CSS to Vue SFC's `<style scoped>` for isolation
   * - `shadow-dom` - inject generated CSS to `Shadow DOM` css style block for each web component
   *
   * @default 'global'
   */
  mode?: 'global' | 'per-module' | 'vue-scoped' | 'dist-chunk' | 'shadow-dom';
  /**
   * Transform CSS for `@apply` directive
   *
   * @experimental
   * @default false
   */
  transformCSS?: boolean | 'pre' | 'post';
  /**
   * Make the generated css processed by postcss (https://vitejs.dev/guide/features.html#postcss)
   *
   * @default true
   */
  postcss?: boolean;
  /**
   * Use top level await in HMR code to avoid FOUC on dev time.
   *
   * You usually don't need to disable this, unless you are developing on
   * a browser that does not support top level await.
   *
   * This will only affect on dev time.
   *
   * @default true
   */
  hmrTopLevelAwait?: boolean;
  /**
   * Fetch mode in devtools.
   *
   * Some server does not configure its CORS and you may want to set this to 'no-cors'.
   * See https://github.com/unocss/unocss/issues/2822.
   *
   * @default 'cors'
   */
  fetchMode?: 'cors' | 'navigate' | 'no-cors' | 'same-origin';
  /**
   * Disable `import 'uno.css'` existing check.
   *
   * @default true
   */
  checkImport?: boolean;
}
//#endregion
//#region src/modes/chunk-build.d.ts
declare function ChunkModeBuildPlugin(ctx: UnocssPluginContext): Plugin;
//#endregion
//#region src/modes/global/build.d.ts
declare function GlobalModeBuildPlugin(ctx: UnocssPluginContext<VitePluginConfig>): Plugin[];
//#endregion
//#region src/modes/global/dev.d.ts
declare function GlobalModeDevPlugin(ctx: UnocssPluginContext): Plugin[];
//#endregion
//#region src/modes/global/index.d.ts
declare function GlobalModePlugin(ctx: UnocssPluginContext): _$vite.Plugin<any>[];
//#endregion
//#region src/modes/per-module.d.ts
declare function PerModuleModePlugin(ctx: UnocssPluginContext): Plugin[];
//#endregion
//#region src/modes/vue-scoped.d.ts
declare function VueScopedPlugin(ctx: UnocssPluginContext): Plugin;
//#endregion
//#region src/index.d.ts
declare function defineConfig<Theme extends object>(config: VitePluginConfig<Theme>): VitePluginConfig<Theme>;
interface UnocssVitePluginAPI {
  getContext: () => UnocssPluginContext<VitePluginConfig>;
  getMode: () => VitePluginConfig['mode'];
}
declare function UnocssPlugin<Theme extends object>(configOrPath?: VitePluginConfig<Theme> | string, defaults?: UserConfigDefaults): Plugin[];
//#endregion
export { ChunkModeBuildPlugin, GlobalModeBuildPlugin, GlobalModeDevPlugin, GlobalModePlugin, PerModuleModePlugin, UnocssVitePluginAPI, VitePluginConfig, VueScopedPlugin, UnocssPlugin as default, defineConfig };