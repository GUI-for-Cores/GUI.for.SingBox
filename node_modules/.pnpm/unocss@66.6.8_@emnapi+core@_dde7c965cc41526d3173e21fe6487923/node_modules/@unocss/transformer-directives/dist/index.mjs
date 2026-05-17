import { cssIdRE, expandVariantGroup, notNull, regexScopePlaceholder, toArray } from "@unocss/core";
import { calcMaxWidthBySize, hasIconFn, hasThemeFn, transformThemeFn, transformThemeString } from "@unocss/rule-utils";
import { List, clone, generate, parse, walk } from "css-tree";
//#region src/apply.ts
async function handleApply(ctx, node) {
	const { code, uno, options, filename } = ctx;
	await Promise.all(node.block.children.map(async (childNode) => {
		if (childNode.type === "Raw") return transformDirectives(code, uno, options, filename, childNode.value, childNode.loc.start.offset);
		await parseApply(ctx, node, childNode);
	}).toArray());
}
async function parseApply({ code, uno, applyVariable }, node, childNode) {
	const original = code.original;
	let body;
	if (childNode.type === "Atrule" && childNode.name === "apply" && childNode.prelude && childNode.prelude.type === "Raw") body = removeQuotes(childNode.prelude.value.trim());
	else if (childNode.type === "Declaration" && applyVariable.includes(childNode.property) && (childNode.value.type === "Value" || childNode.value.type === "Raw")) {
		let rawValue = original.slice(childNode.value.loc.start.offset, childNode.value.loc.end.offset).trim();
		rawValue = removeQuotes(rawValue);
		body = rawValue.split(/\s+/g).filter(Boolean).map((i) => removeQuotes(i)).join(" ");
	}
	if (!body) return;
	body = removeComments(body);
	const classNames = expandVariantGroup(body).split(/\s+/g).map((className) => className.trim().replace(/\\/, ""));
	const utils = (await Promise.all(classNames.map((i) => uno.parseToken(i, "-")))).filter(notNull).flat().sort((a, b) => a[0] - b[0]).sort((a, b) => (a[3] ? uno.parentOrders.get(a[3]) ?? 0 : 0) - (b[3] ? uno.parentOrders.get(b[3]) ?? 0 : 0)).reduce((acc, item) => {
		const target = acc.find((i) => i[1] === item[1] && i[3] === item[3]);
		if (target) target[2] += item[2];
		else acc.push([...item]);
		return acc;
	}, []);
	if (!utils.length) return;
	let semicolonOffset = original[childNode.loc.end.offset] === ";" ? 1 : original[childNode.loc.end.offset] === "@" ? -1 : 0;
	for (const i of utils) {
		const [, _selector, body, parent, meta] = i;
		const selectorOrGroup = _selector?.replace(regexScopePlaceholder, " ") || _selector;
		if (parent || selectorOrGroup && selectorOrGroup !== ".\\-" || meta?.noMerge) {
			let newSelector = generate(node.prelude);
			const className = code.slice(node.prelude.loc.start.offset, node.prelude.loc.end.offset);
			if (meta?.noMerge) newSelector = selectorOrGroup;
			else if (selectorOrGroup && selectorOrGroup !== ".\\-") {
				const ruleAST = parse(`${selectorOrGroup}{}`, { context: "rule" });
				const prelude = clone(node.prelude);
				prelude.children?.forEach((child) => {
					const selectorListAst = clone(ruleAST.prelude);
					const classSelectors = new List();
					selectorListAst?.children?.forEach((selectorAst) => {
						classSelectors.appendList(selectorAst?.children?.filter((i) => i.type === "ClassSelector" && i.name === "\\-"));
					});
					classSelectors.forEach((i) => Object.assign(i, clone(child)));
					Object.assign(child, selectorListAst);
				});
				newSelector = generate(prelude);
			}
			let css = `${newSelector.includes(".\\-") ? className.split(",").map((e) => newSelector.replace(/.\\-/g, e.trim())).join(",") : newSelector}{${body}}`;
			if (parent) if (parent.includes(" $$ ")) {
				const [first, ...parentSelectors] = parent.split(" $$ ").reverse();
				css = `${parentSelectors.reduce((p, c, i) => i === parentSelectors.length - 1 ? `${p}{${c}{${css}}}${"}".repeat(i)}` : `${p}{${c}`, first)}`;
			} else if (parent === ".\\-") css = `${className}{${css}}`;
			else css = `${parent}{${css}}`;
			semicolonOffset = 0;
			code.appendLeft(node.loc.end.offset, css);
		} else if (body.includes("@")) code.appendRight(original.length, body);
		else code.appendRight(childNode.loc.end.offset + semicolonOffset, body);
	}
	code.remove(childNode.loc.start.offset, childNode.loc.end.offset + semicolonOffset);
}
function removeQuotes(value) {
	return value.replace(/^(['"])(.*)\1$/, "$2");
}
function removeComments(value) {
	return value.replace(/(\/\*(?:.|\n)*?\*\/)|(\/\/.*)/g, "");
}
//#endregion
//#region src/icon.ts
async function transformIconString(uno, icon, color) {
	const presetIcons = uno.config.presets?.flat()?.find((i) => i.name === "@unocss/preset-icons");
	if (!presetIcons) {
		console.warn("@unocss/preset-icons not found, icon() directive will be keep as-is");
		return;
	}
	const { scale = 1, prefix = "i-", collections: customCollections, customizations = {}, autoInstall = false, iconifyCollectionsNames, collectionsNodeResolvePath, unit } = presetIcons.options;
	const api = presetIcons.api;
	const loaderOptions = {
		addXmlNs: true,
		scale,
		customCollections,
		autoInstall,
		cwd: collectionsNodeResolvePath,
		warn: void 0,
		customizations: {
			...customizations,
			trimCustomSvg: true,
			async iconCustomizer(collection, icon, props) {
				await customizations.iconCustomizer?.(collection, icon, props);
				if (unit) {
					if (!props.width) props.width = `${scale}${unit}`;
					if (!props.height) props.height = `${scale}${unit}`;
				}
			}
		}
	};
	const loader = await api.createNodeLoader?.() || (async () => void 0);
	for (const p of toArray(prefix)) if (icon.startsWith(p)) {
		icon = icon.slice(p.length);
		const parsed = await api.parseIconWithLoader(icon, loader, loaderOptions, iconifyCollectionsNames);
		if (parsed) return `url("data:image/svg+xml;utf8,${color ? api.encodeSvgForCss(parsed.svg).replace(/currentcolor/gi, color) : api.encodeSvgForCss(parsed.svg)}")`;
	}
}
//#endregion
//#region src/functions.ts
async function handleFunction({ code, uno, options }, node) {
	const { throwOnMissing = true } = options;
	switch (node.name) {
		case "theme": {
			if (!node.children.size) throw new Error("theme() expect exact one argument");
			if (node.children.first.type !== "String") throw new Error("theme() expect a string argument");
			let defaultValueLoc;
			if (node.children.size > 1) {
				const remains = node.children.toArray().slice(1);
				if (!(remains[0].type === "Operator" && remains[0].value === ",")) throw new Error("theme() expect a comma between expression string and default value");
				if (remains.length > 1) defaultValueLoc = [remains[1].loc.start.offset, node.children.last.loc.end.offset];
			}
			const themeStr = node.children.first.value;
			let value = transformThemeString(themeStr, uno.config.theme, !defaultValueLoc && throwOnMissing);
			if (!value && defaultValueLoc) value = code.slice(defaultValueLoc[0], defaultValueLoc[1]);
			if (value) code.overwrite(node.loc.start.offset, node.loc.end.offset, value);
			break;
		}
		case "icon": {
			const params = node.children.toArray().filter((node) => node.type === "String").map((node) => node.value);
			if (params.length === 0) throw new Error("icon() expects at least one argument");
			let [icon, color] = params;
			if (color) color = encodeURIComponent(transformThemeFn(color, uno.config.theme, throwOnMissing));
			const value = await transformIconString(uno, icon, color);
			if (value) code.overwrite(node.loc.start.offset, node.loc.end.offset, value);
			break;
		}
	}
}
//#endregion
//#region src/screen.ts
const screenRuleRE = /(@screen [^{]+)(.+)/g;
function handleScreen({ code, uno }, node) {
	let breakpointName = "";
	let prefix = "";
	if (node.prelude?.type === "Raw") breakpointName = node.prelude.value.trim();
	if (!breakpointName) return;
	const match = breakpointName.match(/^(?:(lt|at)-)?(\w+)$/);
	if (match) {
		prefix = match[1];
		breakpointName = match[2];
	}
	const resolveBreakpoints = () => {
		const key = uno.config.presets.some((p) => p.name === "@unocss/preset-wind4") ? "breakpoint" : "breakpoints";
		const breakpoints = uno.config.theme[key];
		return breakpoints ? Object.entries(breakpoints).sort((a, b) => Number.parseInt(a[1].replace(/[a-z]+/gi, "")) - Number.parseInt(b[1].replace(/[a-z]+/gi, ""))).map(([point, size]) => ({
			point,
			size
		})) : void 0;
	};
	const variantEntries = (resolveBreakpoints() ?? []).map(({ point, size }, idx) => [
		point,
		size,
		idx
	]);
	const generateMediaQuery = (breakpointName, prefix) => {
		const [, size, idx] = variantEntries.find((i) => i[0] === breakpointName);
		if (prefix) if (prefix === "lt") return `@media (max-width: ${calcMaxWidthBySize(size)})`;
		else if (prefix === "at") return `@media (min-width: ${size})${variantEntries[idx + 1] ? ` and (max-width: ${calcMaxWidthBySize(variantEntries[idx + 1][1])})` : ""}`;
		else throw new Error(`breakpoint variant not supported: ${prefix}`);
		return `@media (min-width: ${size})`;
	};
	if (!variantEntries.some((i) => i[0] === breakpointName)) throw new Error(`breakpoint ${breakpointName} not found`);
	const offset = node.loc.start.offset;
	const str = code.original.slice(offset, node.loc.end.offset);
	const matches = Array.from(str.matchAll(screenRuleRE));
	if (!matches.length) return;
	for (const match of matches) code.overwrite(offset + match.index, offset + match.index + match[1].length, `${generateMediaQuery(breakpointName, prefix)}`);
}
//#endregion
//#region src/transform.ts
async function transformDirectives(code, uno, options, filename, originalCode, offset) {
	let { applyVariable } = options;
	const varStyle = options.varStyle;
	if (applyVariable === void 0) {
		if (varStyle !== void 0) applyVariable = varStyle ? [`${varStyle}apply`] : [];
		applyVariable = [
			"--at-apply",
			"--uno-apply",
			"--uno"
		];
	}
	applyVariable = toArray(applyVariable || []);
	const isHasApply = (code) => code.includes("@apply") || applyVariable.some((s) => code.includes(s));
	const parseCode = originalCode || code.original;
	const hasApply = isHasApply(parseCode);
	const hasScreen = parseCode.includes("@screen");
	const hasFn = hasThemeFn(parseCode) || hasIconFn(parseCode);
	if (!hasApply && !hasFn && !hasScreen) return;
	const ast = parse(parseCode, {
		parseCustomProperty: true,
		parseAtrulePrelude: false,
		positions: true,
		filename,
		offset
	});
	if (ast.type !== "StyleSheet") return;
	const stack = [];
	const ctx = {
		options,
		applyVariable,
		uno,
		code,
		filename,
		offset
	};
	const processNode = async (node, _item, _list) => {
		if (hasScreen && node.type === "Atrule" && node.name === "screen") handleScreen(ctx, node);
		else if (node.type === "Function") await handleFunction(ctx, node);
		else if (hasApply && node.type === "Rule") await handleApply(ctx, node);
	};
	walk(ast, (...args) => stack.push(processNode(...args)));
	await Promise.all(stack);
	const oldCode = code.toString();
	if (!isHasApply(oldCode)) {
		const newCode = oldCode.replace(/([^{}]+)\{\s*\}\s*/g, (m, selector) => {
			if (/^[\s\w\-.,#:[\]=*"'>~+^$|()\\]+$/.test(selector.trim())) return "";
			return m;
		});
		if (newCode !== oldCode) code.update(0, code.original.length, newCode);
	}
}
//#endregion
//#region src/index.ts
function transformerDirectives(options = {}) {
	return {
		name: "@unocss/transformer-directives",
		enforce: options?.enforce,
		idFilter: (id) => cssIdRE.test(id),
		transform: (code, id, ctx) => {
			return transformDirectives(code, ctx.uno, options, id);
		}
	};
}
//#endregion
export { transformerDirectives as default };
