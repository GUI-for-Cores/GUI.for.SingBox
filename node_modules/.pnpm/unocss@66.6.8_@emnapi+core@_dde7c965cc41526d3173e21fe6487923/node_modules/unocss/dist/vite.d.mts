import { VitePluginConfig } from "@unocss/vite";
import { Plugin } from "vite";
export * from "@unocss/vite";

//#region src/vite.d.ts
declare function UnocssVitePlugin<Theme extends object>(configOrPath?: VitePluginConfig<Theme> | string): Plugin[];
//#endregion
export { UnocssVitePlugin as default };