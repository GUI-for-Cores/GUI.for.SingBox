import { a as WebFontProcessor } from "./types-o6CvBLpT.mjs";
import { fetch } from "ofetch";

//#region src/local.d.ts
interface LocalFontProcessorOptions {
  /**
   * Current working directory
   *
   * @default process.cwd()
   */
  cwd?: string;
  /**
   * Directory to cache the fonts
   *
   * @default 'node_modules/.cache/unocss/fonts'
   */
  cacheDir?: string;
  /**
   * Directory to save the fonts assets
   *
   * @default 'public/assets/fonts'
   */
  fontAssetsDir?: string;
  /**
   * Base URL to serve the fonts from the client
   *
   * @default '/assets/fonts'
   */
  fontServeBaseUrl?: string;
  /**
   * Custom fetch function to provide the font data.
   */
  fetch?: typeof fetch;
}
declare function createLocalFontProcessor(options?: LocalFontProcessorOptions): WebFontProcessor;
//#endregion
export { LocalFontProcessorOptions, createLocalFontProcessor };