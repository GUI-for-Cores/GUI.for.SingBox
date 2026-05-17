import { AstroIntegrationConfig } from "@unocss/astro";
import { AstroIntegration } from "astro";

//#region src/astro.d.ts
declare function UnocssAstroIntegration<Theme extends object>(config?: AstroIntegrationConfig<Theme>): AstroIntegration;
//#endregion
export { UnocssAstroIntegration as default };