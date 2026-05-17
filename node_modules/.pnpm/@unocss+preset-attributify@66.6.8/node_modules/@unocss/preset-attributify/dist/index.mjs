import { definePreset, isAttributifySelector, isValidSelector } from "@unocss/core";
//#region src/variant.ts
const variantsRE = /^(?!.*\[[^:]+:.+\]$)((?:.+:)?!?)(.*)$/;
function variantAttributify(options = {}) {
	const prefix = options.prefix ?? "un-";
	const prefixedOnly = options.prefixedOnly ?? false;
	const trueToNonValued = options.trueToNonValued ?? false;
	let variantsValueRE;
	return {
		name: "attributify",
		match(input, { generator }) {
			const match = isAttributifySelector(input);
			if (!match) return;
			let name = match[1];
			if (name.startsWith(prefix)) name = name.slice(prefix.length);
			else if (prefixedOnly) return;
			const content = match[2];
			const [, variants = "", body = content] = content.match(variantsRE) || [];
			if (body === "~" || trueToNonValued && body === "true" || !body) return `${variants}${name}`;
			if (variantsValueRE == null) {
				const separators = generator?.config?.separators?.join("|");
				if (separators) variantsValueRE = new RegExp(`^(.*\\](?:${separators}))(\\[[^\\]]+?\\])$`);
				else variantsValueRE = false;
			}
			if (variantsValueRE) {
				const [, bodyVariant, bracketValue] = content.match(variantsValueRE) || [];
				if (bracketValue) return `${bodyVariant}${variants}${name}-${bracketValue}`;
			}
			if (variants && /^[\d.]+$/.test(body)) {
				const variantParts = variants.split(/([^:]*:)/g).filter(Boolean);
				const _body = variantParts.pop() + body;
				const _variants = variantParts.join("");
				return [{ matcher: `${variants}${name}-${body}` }, { matcher: `${_variants}${name}-${_body}` }];
			}
			return `${variants}${name}-${body}`;
		}
	};
}
//#endregion
//#region src/autocomplete.ts
const elementRE$1 = /(<\w[\w:.$-]*\s)((?:'[^>']*'|"[^>"]*"|`[^>`]*`|\{[^>}]*\}|[^>]*?)*)/g;
const valuedAttributeRE$1 = /(\?|(?!\d|-{2}|-\d)[\w\u00A0-\uFFFF-:%]+)(?:=("[^"]*|'[^']*))?/g;
const splitterRE$1 = /[\s'"`;>]+/;
function autocompleteExtractorAttributify(options) {
	return {
		name: "attributify",
		extract: ({ content, cursor }) => {
			const matchedElements = content.matchAll(elementRE$1);
			let attrs;
			let elPos = 0;
			for (const match of matchedElements) {
				const [, prefix, content] = match;
				const currentPos = match.index + prefix.length;
				if (cursor > currentPos && cursor <= currentPos + content.length) {
					elPos = currentPos;
					attrs = content;
					break;
				}
			}
			if (!attrs) return null;
			const matchedAttributes = attrs.matchAll(valuedAttributeRE$1);
			let attrsPos = 0;
			let attrName;
			let attrValues;
			for (const match of matchedAttributes) {
				const [matched, name, rawValues] = match;
				const currentPos = elPos + match.index;
				if (cursor > currentPos && cursor <= currentPos + matched.length) {
					attrsPos = currentPos;
					attrName = name;
					attrValues = rawValues?.slice(1);
					break;
				}
			}
			if (!attrName) return null;
			if (attrName === "class" || attrName === "className" || attrName === ":class") return null;
			const hasPrefix = !!options?.prefix && attrName.startsWith(options.prefix);
			if (options?.prefixedOnly && !hasPrefix) return null;
			const attrNameWithoutPrefix = hasPrefix ? attrName.slice(options.prefix.length) : attrName;
			if (attrValues === void 0) return {
				extracted: attrNameWithoutPrefix,
				resolveReplacement(suggestion) {
					const startOffset = hasPrefix ? options.prefix.length : 0;
					return {
						start: attrsPos + startOffset,
						end: attrsPos + attrName.length,
						replacement: suggestion
					};
				}
			};
			const attrValuePos = attrsPos + attrName.length + 2;
			let matchSplit = splitterRE$1.exec(attrValues);
			let currentPos = 0;
			let value;
			while (matchSplit) {
				const [matched] = matchSplit;
				if (cursor > attrValuePos + currentPos && cursor <= attrValuePos + currentPos + matchSplit.index) {
					value = attrValues.slice(currentPos, currentPos + matchSplit.index);
					break;
				}
				currentPos += matchSplit.index + matched.length;
				matchSplit = splitterRE$1.exec(attrValues.slice(currentPos));
			}
			if (value === void 0) value = attrValues.slice(currentPos);
			const [, variants = "", body] = value.match(variantsRE) || [];
			return {
				extracted: `${variants}${attrNameWithoutPrefix}-${body}`,
				transformSuggestions(suggestions) {
					return suggestions.filter((v) => v.startsWith(`${variants}${attrNameWithoutPrefix}-`)).map((v) => variants + v.slice(variants.length + attrNameWithoutPrefix.length + 1));
				},
				resolveReplacement(suggestion) {
					return {
						start: currentPos + attrValuePos,
						end: currentPos + attrValuePos + value.length,
						replacement: variants + suggestion.slice(variants.length + attrNameWithoutPrefix.length + 1)
					};
				}
			};
		}
	};
}
//#endregion
//#region src/extractor.ts
const strippedPrefixes = ["v-bind:", ":"];
const splitterRE = /[\s'"`;]+/g;
const elementRE = /<[^>\s]*\s((?:'[^']*'|"[^"]*"|`[^`]*`|\{[^}]*\}|=>|[^>]*?)*)/g;
const valuedAttributeRE = /(\?|(?!\d|-{2}|-\d)[\w\u00A0-\uFFFF:!%.~<-]+)=?(?:"([^"]*)"|'([^']*)'|\{([^}]*)\})?/g;
const defaultIgnoreAttributes = [
	"placeholder",
	"fill",
	"opacity",
	"stroke-opacity"
];
function extractorAttributify(options) {
	const ignoreAttributes = options?.ignoreAttributes ?? defaultIgnoreAttributes;
	const nonValuedAttribute = options?.nonValuedAttribute ?? true;
	const trueToNonValued = options?.trueToNonValued ?? false;
	return {
		name: "@unocss/preset-attributify/extractor",
		extract({ code }) {
			return Array.from(code.matchAll(elementRE)).flatMap((match) => Array.from((match[1] || "").matchAll(valuedAttributeRE))).flatMap(([, name, ...contents]) => {
				const content = contents.filter(Boolean).join("");
				if (ignoreAttributes.includes(name)) return [];
				for (const prefix of strippedPrefixes) if (name.startsWith(prefix)) {
					name = name.slice(prefix.length);
					break;
				}
				if (!content) {
					if (isValidSelector(name) && nonValuedAttribute !== false) {
						const result = [`[${name}=""]`];
						if (trueToNonValued) result.push(`[${name}="true"]`);
						return result;
					}
					return [];
				}
				if (["class", "className"].includes(name)) return content.split(splitterRE).filter(isValidSelector);
				else if (elementRE.test(content)) {
					elementRE.lastIndex = 0;
					return this.extract({ code: content });
				} else {
					if (options?.prefixedOnly && options.prefix && !name.startsWith(options.prefix)) return [];
					return content.split(splitterRE).filter((v) => Boolean(v) && v !== ":").map((v) => `[${name}~="${v}"]`);
				}
			});
		}
	};
}
//#endregion
//#region src/index.ts
/**
* This enables the attributify mode for other presets.
*
* @example
*
* ```html
* <button
*   bg="blue-400 hover:blue-500 dark:blue-500 dark:hover:blue-600"
*   text="sm white"
*   font="mono light"
*   p="y-2 x-4"
*   border="2 rounded blue-200"
* >
*   Button
* </button>
* ```
*
* @see https://unocss.dev/presets/attributify
*/
const presetAttributify = definePreset((options = {}) => {
	options.strict = options.strict ?? false;
	options.prefix = options.prefix ?? "un-";
	options.prefixedOnly = options.prefixedOnly ?? false;
	options.nonValuedAttribute = options.nonValuedAttribute ?? true;
	options.ignoreAttributes = options.ignoreAttributes ?? defaultIgnoreAttributes;
	return {
		name: "@unocss/preset-attributify",
		enforce: "post",
		variants: [variantAttributify(options)],
		extractors: [extractorAttributify(options)],
		options,
		autocomplete: { extractors: [autocompleteExtractorAttributify(options)] },
		extractorDefault: options.strict ? false : void 0
	};
});
//#endregion
export { autocompleteExtractorAttributify, presetAttributify as default, presetAttributify, defaultIgnoreAttributes, extractorAttributify, variantAttributify, variantsRE };
