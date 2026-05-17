import presetAttributify from "@unocss/preset-attributify";
import presetIcons from "@unocss/preset-icons";
import presetMini from "@unocss/preset-mini";
import presetTagify from "@unocss/preset-tagify";
import presetTypography from "@unocss/preset-typography";
import presetUno from "@unocss/preset-uno";
import presetWebFonts from "@unocss/preset-web-fonts";
import presetWind from "@unocss/preset-wind";
import presetWind3 from "@unocss/preset-wind3";
import presetWind4 from "@unocss/preset-wind4";
import transformerAttributifyJsx from "@unocss/transformer-attributify-jsx";
import transformerCompileClass from "@unocss/transformer-compile-class";
import transformerDirectives from "@unocss/transformer-directives";
import transformerVariantGroup from "@unocss/transformer-variant-group";
export * from "@unocss/core";
//#region src/index.ts
/**
* Define UnoCSS config
*/
function defineConfig(config) {
	return config;
}
//#endregion
export { defineConfig, presetAttributify, presetIcons, presetMini, presetTagify, presetTypography, presetUno, presetWebFonts, presetWind, presetWind3, presetWind4, transformerAttributifyJsx, transformerCompileClass, transformerDirectives, transformerVariantGroup };
