import { definePreset } from "@unocss/core";
//#region src/extractor.ts
const MARKER = "__TAGIFY__";
const htmlTagRE = /<([\w:-]+)/g;
function extractorTagify(options) {
	const { prefix = "", excludedTags = [
		"b",
		/^h\d+$/,
		"table"
	] } = options;
	return {
		name: "tagify",
		extract({ code }) {
			return Array.from(code.matchAll(htmlTagRE)).filter(({ 1: match }) => {
				for (const exclude of excludedTags) if (typeof exclude === "string") {
					if (match === exclude) return false;
				} else {
					exclude.lastIndex = 0;
					if (exclude.test(match)) return false;
				}
				return match.startsWith(prefix);
			}).map(([, matched]) => `${MARKER}${matched}`);
		}
	};
}
//#endregion
//#region src/variant.ts
function variantTagify(options) {
	const { extraProperties } = options;
	const prefix = `${MARKER}${options.prefix ?? ""}`;
	return {
		name: "tagify",
		match(input) {
			if (!input.startsWith(prefix)) return;
			const matcher = input.slice(prefix.length);
			const handler = {
				matcher,
				selector: (i) => i.slice(11)
			};
			if (extraProperties) if (typeof extraProperties === "function") handler.body = (entries) => [...entries, ...Object.entries(extraProperties(matcher) ?? {})];
			else handler.body = (entries) => [...entries, ...Object.entries(extraProperties)];
			return handler;
		}
	};
}
//#endregion
//#region src/index.ts
/**
* @see https://unocss.dev/presets/tagify
*/
const presetTagify = definePreset((options = {}) => {
	const { defaultExtractor = true } = options;
	return {
		name: "@unocss/preset-tagify",
		variants: [variantTagify(options)],
		extractors: [extractorTagify(options)],
		extractorDefault: defaultExtractor ? void 0 : false
	};
});
//#endregion
export { MARKER, presetTagify as default, presetTagify, extractorTagify, htmlTagRE, variantTagify };
