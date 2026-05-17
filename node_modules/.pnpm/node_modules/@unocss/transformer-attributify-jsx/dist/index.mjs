import { toArray } from "@unocss/core";
import { parseSync } from "oxc-parser";
import { walk } from "oxc-walker";
//#region ../../virtual-shared/integration/src/env.ts
function getEnvFlags() {
	const isNode = typeof process !== "undefined" && process.stdout;
	return {
		isNode,
		isVSCode: isNode && !!process.env.VSCODE_CWD,
		isESLint: isNode && !!process.env.ESLINT
	};
}
//#endregion
//#region src/resolver/oxc.ts
async function attributifyJsxOxcResolver(params) {
	const { code, id, uno, isBlocked } = params;
	const tasks = [];
	const ast = parseSync(id, code.toString(), { sourceType: "module" });
	if (ast.errors?.length) throw new Error(`Oxc parse errors:\n${ast.errors.map((err) => err.codeframe ?? err.helpMessage ?? err.message).join("\n")}`);
	walk(ast.program, { enter(node) {
		if (node.type !== "JSXAttribute") return;
		if (node.value === null) {
			const attr = node.name.type === "JSXNamespacedName" ? `${node.name.namespace.name}:${node.name.name.name}` : node.name.name;
			if (isBlocked(attr)) return;
			tasks.push(uno.parseToken(attr).then((matched) => {
				if (matched) code.appendRight(node.end, "=\"\"");
			}));
		}
	} });
	await Promise.all(tasks);
}
//#endregion
//#region src/resolver/regex.ts
const elementRE = /<([^/?<>0-9$_!][^\s>]*)\s+((?:"[^"]*"|'[^"]*'|(\{[^}]*\})|[^{>])+)>/g;
const attributeRE = /(?<![~`!$%^&*()_+\-=[{;':"|,.<>/?])([a-z()#][[?\w\-:()#%\]]*)(?:\s*=\s*('[^']*'|"[^"]*"|\S+))?|\{[^}]*\}/gi;
const valuedAttributeRE = /((?!\d|-{2}|-\d)[\w\u00A0-\uFFFF:!%.~<-]+)=(?:"[^"]*"|'[^']*'|(\{)((?:[`(][^`)]*[`)]|[^}])+)(\}))/g;
async function attributifyJsxRegexResolver(params) {
	const { code, uno, isBlocked } = params;
	const tasks = [];
	const attributifyPrefix = uno.config.presets.find((i) => i.name === "@unocss/preset-attributify")?.options?.prefix ?? "un-";
	for (const item of Array.from(code.original.matchAll(elementRE))) {
		let attributifyPart = item[2];
		if (valuedAttributeRE.test(attributifyPart)) attributifyPart = attributifyPart.replace(valuedAttributeRE, (match, _, dynamicFlagStart) => {
			if (!dynamicFlagStart) return " ".repeat(match.length);
			let preLastModifierIndex = 0;
			let temp = match;
			for (const _item of match.matchAll(elementRE)) {
				const attrAttributePart = _item[2];
				if (valuedAttributeRE.test(attrAttributePart)) attrAttributePart.replace(valuedAttributeRE, (m) => " ".repeat(m.length));
				const pre = temp.slice(0, preLastModifierIndex) + " ".repeat(_item.index + _item[0].indexOf(_item[2]) - preLastModifierIndex) + attrAttributePart;
				temp = pre + " ".repeat(_item.input.length - pre.length);
				preLastModifierIndex = pre.length;
			}
			if (preLastModifierIndex !== 0) return temp;
			return " ".repeat(match.length);
		});
		for (const attr of attributifyPart.matchAll(attributeRE)) {
			const matchedRule = attr[0];
			if (matchedRule.includes("=") || isBlocked(matchedRule)) continue;
			const updatedMatchedRule = matchedRule.startsWith(attributifyPrefix) ? matchedRule.slice(attributifyPrefix.length) : matchedRule;
			tasks.push(uno.parseToken(updatedMatchedRule).then((matched) => {
				if (matched) {
					const startIdx = (item.index || 0) + (attr.index || 0) + item[0].indexOf(item[2]);
					const endIdx = startIdx + matchedRule.length;
					code.overwrite(startIdx, endIdx, `${matchedRule}=""`);
				}
			}));
		}
	}
	await Promise.all(tasks);
}
//#endregion
//#region src/index.ts
function createFilter(include, exclude) {
	const includePattern = toArray(include || []);
	const excludePattern = toArray(exclude || []);
	return (id) => {
		if (excludePattern.some((p) => id.match(p))) return false;
		return includePattern.some((p) => id.match(p));
	};
}
function transformerAttributifyJsx(options = {}) {
	const { blocklist = [] } = options;
	const isBlocked = (matchedRule) => {
		for (const blockedRule of blocklist) if (blockedRule instanceof RegExp) {
			if (blockedRule.test(matchedRule)) return true;
		} else if (matchedRule === blockedRule) return true;
		return false;
	};
	return {
		name: "@unocss/transformer-attributify-jsx",
		enforce: "pre",
		idFilter: createFilter(options.include || [/\.[jt]sx$/, /\.mdx$/], options.exclude || []),
		async transform(code, id, { uno }) {
			try {
				if (getEnvFlags().isVSCode) return;
			} catch {}
			const params = {
				code,
				id,
				uno,
				isBlocked
			};
			try {
				await attributifyJsxOxcResolver(params);
			} catch (error) {
				console.warn(`[@unocss/transformer-attributify-jsx]: Oxc resolver failed for "${id}", falling back to regex resolver:\n`, error);
				await attributifyJsxRegexResolver(params);
			}
		}
	};
}
//#endregion
export { transformerAttributifyJsx as default };
