import { LAYER_IMPORTS, definePreset, mergeDeep, toArray } from "@unocss/core";
//#region src/providers/bunny.ts
function createBunnyFontsProvider(name, host) {
	return {
		name,
		getImportUrl(fonts) {
			return `${host}/css?family=${fonts.map((font) => {
				const { name, weights, italic } = font;
				const formattedName = name.toLowerCase().replace(/\s/g, "-");
				if (!weights?.length) return `${formattedName}${italic ? ":i" : ""}`;
				let weightsAsString = weights.map((weight) => weight.toString());
				if (!weightsAsString.some((weight) => weight.endsWith("i")) && italic) weightsAsString = weightsAsString.map((weight) => weight += "i");
				return `${formattedName}:${weightsAsString.join(",")}`;
			}).join("|")}&display=swap`;
		}
	};
}
const BunnyFontsProvider = createBunnyFontsProvider("bunny", "https://fonts.bunny.net");
//#endregion
//#region src/providers/google.ts
function generateFontAxes(axes) {
	if (!axes || axes.length === 0) return "";
	let combinations = [[]];
	for (const { values } of axes) {
		const newCombinations = [];
		for (const combo of combinations) for (const value of values) newCombinations.push([...combo, value]);
		combinations = newCombinations;
	}
	return combinations.map((arr) => arr.join(",")).join(";");
}
function createGoogleCompatibleProvider(name, host) {
	return {
		name,
		getImportUrl(fonts) {
			return `${host}/css2?${fonts.map((i) => {
				let name = i.name.replace(/\s+/g, "+");
				/**
				* When using the Google Fonts API, be sure to list them alphabetically.
				* @see https://fonts.google.com/knowledge/using_type/styling_type_on_the_web_with_variable_fonts
				* @example ital, opsz, slnt, wdth, wght
				*/
				const axisValues = [];
				if (i.italic) axisValues.push({
					axis: "ital",
					values: ["0", "1"]
				});
				if (i.widths?.length) axisValues.push({
					axis: "wdth",
					values: i.widths.map((w) => w.toString())
				});
				if (i.weights?.length) axisValues.push({
					axis: "wght",
					values: i.weights.map((w) => w.toString())
				});
				if (axisValues.length) {
					name += ":";
					name += axisValues.map((a) => a.axis).join(",");
					name += "@";
					name += generateFontAxes(axisValues);
				}
				return `family=${name}`;
			}).join("&")}&display=swap`;
		}
	};
}
const GoogleFontsProvider = createGoogleCompatibleProvider("google", "https://fonts.googleapis.com");
//#endregion
//#region src/providers/coollabs.ts
const CoolLabsFontsProvider = createGoogleCompatibleProvider("coollabs", "https://api.fonts.coollabs.io");
//#endregion
//#region src/providers/fontshare.ts
const FontshareProvider = createFontshareProvider("fontshare", "https://api.fontshare.com");
function createFontshareProvider(name, host) {
	return {
		name,
		getImportUrl(fonts) {
			return `${host}/v2/css?${fonts.map((f) => {
				let name = f.name.replace(/\s+/g, "-").toLocaleLowerCase();
				if (f.weights?.length) name += `@${f.weights.flatMap((w) => f.italic ? Number(w) + 1 : w).sort().join()}`;
				else name += `@${f.italic ? 2 : 1}`;
				return `f[]=${name}`;
			}).join("&")}&display=swap`;
		}
	};
}
//#endregion
//#region src/providers/fontsource/index.ts
function createFontSourceProvider(name, host) {
	const fontsMap = /* @__PURE__ */ new Map();
	const variablesMap = /* @__PURE__ */ new Map();
	return {
		name,
		async getPreflight(fonts, fetcher) {
			return (await Promise.all(fonts.map(async (font) => {
				const css = [];
				const id = font.name.toLowerCase().replace(/\s+/g, "-");
				let metadata = fontsMap.get(id);
				if (!metadata) {
					const url = `https://api.fontsource.org/v1/fonts/${id}`;
					try {
						metadata = await fetcher(url);
						fontsMap.set(id, metadata);
					} catch {
						throw new Error(`Failed to fetch font: ${font.name}`);
					}
				}
				const { weights, unicodeRange, variants, family } = metadata;
				const subsets = metadata.subsets.filter((subset) => font.subsets ? font.subsets.includes(subset) : true);
				const style = font.italic ? "italic" : "normal";
				if (metadata.variable && !font.preferStatic) {
					let variableData = variablesMap.get(id);
					const url = `https://api.fontsource.org/v1/variable/${id}`;
					try {
						variableData = await fetcher(url);
						variablesMap.set(id, variableData);
					} catch {
						throw new Error(`Failed to fetch font variable: ${font.name}`);
					}
					const mergeAxes = mergeDeep(variableData.axes, font.variable ?? {});
					for (const subset of subsets) if (unicodeRange[subset]) {
						const fontObj = {
							family,
							display: "swap",
							style,
							weight: 400,
							src: [{
								url: `${host}/fontsource/fonts/${metadata.id}:vf@latest/${subset}-wght-${style}.woff2`,
								format: "woff2-variations"
							}],
							variable: {
								wght: mergeAxes.wght ?? void 0,
								wdth: mergeAxes.wdth ?? void 0,
								slnt: mergeAxes.slnt ?? void 0
							},
							unicodeRange: unicodeRange[subset],
							comment: `${metadata.id}-${subset}-wght-normal`
						};
						css.push(generateFontFace(fontObj));
					} else Object.entries(unicodeRange).filter(([subKey]) => !metadata.subsets.includes(subKey)).forEach(([subKey, range]) => {
						const fontObj = {
							family,
							display: "swap",
							style,
							weight: 400,
							src: [{
								url: `${host}/fontsource/fonts/${metadata.id}:vf@latest/${subKey.slice(1, -1)}-wght-${style}.woff2`,
								format: "woff2-variations"
							}],
							variable: {
								wght: mergeAxes.wght ?? void 0,
								wdth: mergeAxes.wdth ?? void 0,
								slnt: mergeAxes.slnt ?? void 0
							},
							unicodeRange: range,
							comment: `${metadata.id}-${subKey}-wght-normal`
						};
						css.push(generateFontFace(fontObj));
					});
				} else {
					const _weights = font.weights && font.weights.length > 0 ? font.weights : weights;
					for (const subset of subsets) for (const weight of _weights) {
						const url = variants[weight][style][subset].url;
						const fontObj = {
							family,
							display: "swap",
							style,
							weight: Number(weight),
							src: [{
								url: url.woff2,
								format: "woff2"
							}],
							unicodeRange: unicodeRange[subset],
							comment: `${metadata.id}-${subset}-${weight}-${style}`
						};
						css.push(generateFontFace(fontObj));
					}
				}
				return css;
			}))).flat().join("\n\n");
		}
	};
}
const FontSourceProvider = createFontSourceProvider("fontsource", "https://cdn.jsdelivr.net");
function generateFontFace(font) {
	const { family, style, display, weight, variable, src, unicodeRange, comment, spacer = "\n  " } = font;
	const { wght, wdth, slnt } = variable ?? {};
	let result = "@font-face {";
	result += `${spacer}font-family: '${family}';`;
	result += `${spacer}font-style: ${slnt ? `oblique ${Number(slnt.max) * -1}deg ${Number(slnt.min) * -1}deg` : style};`;
	result += `${spacer}font-display: ${display};`;
	result += `${spacer}font-weight: ${wght ? getVariableWght(wght) : weight};`;
	if (wdth) result += `${spacer}font-stretch: ${wdth.min}% ${wdth.max}%;`;
	result += `${spacer}src: ${src.map(({ url, format }) => `url(${url}) format('${format}')`).join(", ")};`;
	if (unicodeRange) result += `${spacer}unicode-range: ${unicodeRange};`;
	if (comment) result = `/* ${comment} */\n${result}`;
	return `${result}\n}`;
}
function getVariableWght(axes) {
	if (!axes) return "400";
	if (axes.min === axes.max) return `${axes.min}`;
	return `${axes.min} ${axes.max}`;
}
//#endregion
//#region src/preset.ts
const builtinProviders = {
	google: GoogleFontsProvider,
	bunny: BunnyFontsProvider,
	fontshare: FontshareProvider,
	fontsource: FontSourceProvider,
	coollabs: CoolLabsFontsProvider,
	none: {
		name: "none",
		getPreflight() {
			return "";
		},
		getFontName(font) {
			return font.name;
		}
	}
};
function resolveProvider(provider) {
	if (typeof provider === "string") return builtinProviders[provider];
	return provider;
}
function normalizedFontMeta(meta, defaultProvider) {
	if (typeof meta !== "string") {
		meta.provider = resolveProvider(meta.provider || defaultProvider);
		if (meta.weights) meta.weights = [...new Set(meta.weights.sort((a, b) => a.toString().localeCompare(b.toString(), "en", { numeric: true })))];
		if (meta.widths) meta.widths = [...new Set(meta.widths.sort((a, b) => a.toString().localeCompare(b.toString(), "en", { numeric: true })))];
		return meta;
	}
	const [name, weights = ""] = meta.split(":");
	return {
		name,
		weights: [...new Set(weights.split(/[,;]\s*/).filter(Boolean).sort((a, b) => a.localeCompare(b, "en", { numeric: true })))],
		provider: resolveProvider(defaultProvider)
	};
}
function createWebFontPreset(fetcher) {
	return (options = {}) => {
		const { provider: defaultProvider = "google", extendTheme = true, inlineImports = true, customFetch = fetcher, timeouts = {} } = options;
		const fontLayer = "fonts";
		const layerName = inlineImports ? fontLayer : LAYER_IMPORTS;
		const processors = toArray(options.processors || []);
		const fontObject = Object.fromEntries(Object.entries(options.fonts || {}).map(([name, meta]) => [name, toArray(meta).map((m) => normalizedFontMeta(m, defaultProvider))]));
		const fonts = Object.values(fontObject).flatMap((i) => i);
		const importCache = {};
		async function fetchWithTimeout(url) {
			if (timeouts === false) return customFetch(url);
			const { warning = 1e3, failure = 2e3 } = timeouts;
			let warned = false;
			const timer = setTimeout(() => {
				console.warn(`[unocss] Fetching web fonts: ${url}`);
				warned = true;
			}, warning);
			return await Promise.race([customFetch(url), new Promise((_, reject) => {
				setTimeout(() => reject(/* @__PURE__ */ new Error(`[unocss] Fetch web fonts timeout.`)), failure);
			})]).then((res) => {
				if (warned) console.info(`[unocss] Web fonts fetched.`);
				return res;
			}).finally(() => clearTimeout(timer));
		}
		async function importUrl(url) {
			if (inlineImports) {
				if (!importCache[url]) importCache[url] = fetchWithTimeout(url).catch((e) => {
					console.error(`[unocss] Failed to fetch web fonts: ${url}`);
					console.error(e);
					if (typeof process !== "undefined" && process.env.CI) throw e;
				});
				return await importCache[url];
			} else return `@import url('${url}');`;
		}
		const enabledProviders = Array.from(new Set(fonts.map((i) => i.provider)));
		async function getCSSDefault(fonts, providers) {
			const preflights = [];
			for (const provider of providers) {
				const fontsForProvider = fonts.filter((i) => i.provider.name === provider.name);
				if (provider.getImportUrl) {
					const url = provider.getImportUrl(fontsForProvider);
					if (url) preflights.push(await importUrl(url));
				}
				try {
					preflights.push(await provider.getPreflight?.(fontsForProvider, fetchWithTimeout));
				} catch (e) {
					console.warn(`[unocss] Web fonts preflight fetch failed.`, e);
				}
			}
			return preflights.filter(Boolean).join("\n");
		}
		const preset = {
			name: "@unocss/preset-web-fonts",
			preflights: [{
				async getCSS() {
					let css;
					for (const processor of processors) {
						const result = await processor.getCSS?.(fonts, enabledProviders, getCSSDefault);
						if (result) {
							css = result;
							break;
						}
					}
					if (!css) css = await getCSSDefault(fonts, enabledProviders);
					for (const processor of processors) css = await processor.transformCSS?.(css) || css;
					return css;
				},
				layer: layerName
			}],
			layers: { [fontLayer]: -200 }
		};
		if (extendTheme) preset.extendTheme = (theme, config) => {
			const hasWind4 = config.presets.some((p) => p.name === "@unocss/preset-wind4");
			const themeKey = options.themeKey ?? (hasWind4 ? "font" : "fontFamily");
			if (!theme[themeKey]) theme[themeKey] = {};
			const obj = Object.fromEntries(Object.entries(fontObject).map(([name, fonts]) => [name, fonts.map((f) => f.provider.getFontName?.(f) ?? `"${f.name}"`)]));
			for (const key of Object.keys(obj)) if (typeof theme[themeKey][key] === "string") theme[themeKey][key] = obj[key].map((i) => `${i},`).join("") + theme[themeKey][key];
			else theme[themeKey][key] = obj[key].join(",");
		};
		return preset;
	};
}
//#endregion
//#region src/index.ts
const userAgentWoff2 = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";
const defaultFetch = async (url) => (await import("ofetch")).$fetch(url, {
	headers: { "User-Agent": userAgentWoff2 },
	retry: 3
});
/**
* Preset for using web fonts by provide just the names.
*
* @see https://unocss.dev/presets/web-fonts
*/
const presetWebFonts = definePreset(createWebFontPreset(defaultFetch));
//#endregion
export { createGoogleCompatibleProvider as createGoogleProvider, presetWebFonts as default, presetWebFonts, normalizedFontMeta };
