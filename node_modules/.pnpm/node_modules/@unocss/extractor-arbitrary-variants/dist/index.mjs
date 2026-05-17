import { defaultSplitRE, isValidSelector } from "@unocss/core";
//#region ../../virtual-shared/integration/src/utils.ts
function hash(str) {
	let i;
	let l;
	let hval = 2166136261;
	for (i = 0, l = str.length; i < l; i++) {
		hval ^= str.charCodeAt(i);
		hval += (hval << 1) + (hval << 4) + (hval << 7) + (hval << 8) + (hval << 24);
	}
	return `00000${(hval >>> 0).toString(36)}`.slice(-6);
}
function transformSkipCode(code, map, SKIP_RULES_RE, keyFlag) {
	for (const item of Array.from(code.matchAll(SKIP_RULES_RE))) if (item != null) {
		const matched = item[0];
		const withHashKey = `${keyFlag}${hash(matched)}`;
		map.set(withHashKey, matched);
		code = code.replace(matched, withHashKey);
	}
	return code;
}
function restoreSkipCode(code, map) {
	for (const [withHashKey, matched] of map.entries()) code = code.replaceAll(withHashKey, matched);
	return code;
}
//#endregion
//#region src/source-map.ts
const sourceMapRE = /\/\/#\s*sourceMappingURL=.*\n?/g;
function removeSourceMap(code) {
	if (code.includes("sourceMappingURL=")) return code.replace(sourceMapRE, "");
	return code;
}
//#endregion
//#region src/index.ts
const quotedArbitraryValuesRE = /(?:[\w&:[\]-]|\[\S{1,64}=\S{1,64}\]){1,64}\[\\?['"]?\S{1,64}?['"]\]\]?[\w:-]{0,64}/g;
const arbitraryPropertyRE = /\[(\\\W|[\w-]){1,64}:[^\s:]{0,64}?("\S{1,64}?"|'\S{1,64}?'|`\S{1,64}?`|[^\s:]{1,64}?)[^\s:]{0,64}?\)?\]/g;
const arbitraryPropertyCandidateRE = /^\[(?:\\\W|[\w-]){1,64}:['"]?\S{1,64}?['"]?\]$/;
function splitCodeWithArbitraryVariants(code) {
	const result = [];
	for (const match of code.matchAll(arbitraryPropertyRE)) {
		if (match.index !== 0 && !/^[\s'"`]/.test(code[match.index - 1] ?? "")) continue;
		result.push(match[0]);
	}
	for (const match of code.matchAll(quotedArbitraryValuesRE)) result.push(match[0]);
	const skipMap = /* @__PURE__ */ new Map();
	const skipFlag = "@unocss-skip-arbitrary-brackets";
	code = transformSkipCode(code, skipMap, /-\[(?!&.+?;)[^\]]*\]/g, skipFlag);
	if (!code) return result;
	code.split(defaultSplitRE).forEach((match) => {
		if (match.includes(skipFlag)) match = restoreSkipCode(match, skipMap);
		if (isValidSelector(match) && !arbitraryPropertyCandidateRE.test(match)) result.push(match);
	});
	return result;
}
function extractorArbitraryVariants() {
	return {
		name: "@unocss/extractor-arbitrary-variants",
		order: 0,
		extract({ code }) {
			return splitCodeWithArbitraryVariants(removeSourceMap(code));
		}
	};
}
//#endregion
export { arbitraryPropertyRE, extractorArbitraryVariants, quotedArbitraryValuesRE, splitCodeWithArbitraryVariants };
