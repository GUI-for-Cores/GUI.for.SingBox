import { UnocssPluginContext } from "@unocss/core";
import { Plugin } from "vite";

//#region src/index.d.ts
declare function UnocssInspector(ctx: UnocssPluginContext): Plugin;
//#endregion
export { UnocssInspector as default };