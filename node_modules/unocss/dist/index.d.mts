import { UserConfig } from "@unocss/core";
import presetAttributify from "@unocss/preset-attributify";
import presetIcons from "@unocss/preset-icons";
import presetMini, { Theme as PresetMiniTheme } from "@unocss/preset-mini";
import presetTagify from "@unocss/preset-tagify";
import presetTypography from "@unocss/preset-typography";
import presetUno, { Theme, Theme as PresetUnoTheme } from "@unocss/preset-uno";
import presetWebFonts from "@unocss/preset-web-fonts";
import presetWind, { Theme as PresetWindTheme } from "@unocss/preset-wind";
import presetWind3, { Theme as PresetWind3Theme } from "@unocss/preset-wind3";
import presetWind4, { Theme as PresetWind4Theme } from "@unocss/preset-wind4";
import transformerAttributifyJsx from "@unocss/transformer-attributify-jsx";
import transformerCompileClass from "@unocss/transformer-compile-class";
import transformerDirectives from "@unocss/transformer-directives";
import transformerVariantGroup from "@unocss/transformer-variant-group";
export * from "@unocss/core";

//#region src/index.d.ts
/**
 * Define UnoCSS config
 */
declare function defineConfig<T extends object = Theme>(config: UserConfig<T>): UserConfig<T>;
//#endregion
export { type PresetMiniTheme, type PresetUnoTheme, type PresetWind3Theme, type PresetWind4Theme, type PresetWindTheme, defineConfig, presetAttributify, presetIcons, presetMini, presetTagify, presetTypography, presetUno, presetWebFonts, presetWind, presetWind3, presetWind4, transformerAttributifyJsx, transformerCompileClass, transformerDirectives, transformerVariantGroup };