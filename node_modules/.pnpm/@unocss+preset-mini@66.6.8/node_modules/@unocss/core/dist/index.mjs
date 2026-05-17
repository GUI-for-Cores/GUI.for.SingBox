//#region src/constants.ts
const LAYER_DEFAULT = "default";
const LAYER_PREFLIGHTS = "preflights";
const LAYER_SHORTCUTS = "shortcuts";
const LAYER_IMPORTS = "imports";
const DEFAULT_LAYERS = {
	[LAYER_IMPORTS]: -200,
	[LAYER_PREFLIGHTS]: -100,
	[LAYER_SHORTCUTS]: -10,
	[LAYER_DEFAULT]: 0
};
//#endregion
//#region src/extractors/split.ts
const defaultSplitRE = /[\\:]?[\s'"`;{}]+/g;
const splitWithVariantGroupRE = /([\\:]?[\s"'`;<>]|:\(|\)"|\)\s)/g;
function splitCode(code) {
	return code.split(defaultSplitRE);
}
const extractorSplit = {
	name: "@unocss/core/extractor-split",
	order: 0,
	extract({ code }) {
		return splitCode(code);
	}
};
//#endregion
//#region src/utils/basic.ts
function toArray(value = []) {
	return Array.isArray(value) ? value : [value];
}
function uniq(value) {
	return Array.from(new Set(value));
}
function uniqueBy(array, equalFn) {
	return array.reduce((acc, cur) => {
		if (acc.findIndex((item) => equalFn(cur, item)) === -1) acc.push(cur);
		return acc;
	}, []);
}
function isString(s) {
	return typeof s === "string";
}
//#endregion
//#region src/utils/countable-set.ts
var CountableSet = class extends Set {
	constructor(values) {
		super();
		this._map = /* @__PURE__ */ new Map();
		if (values) for (const key of values) this.add(key);
	}
	add(key) {
		this._map.set(key, (this._map.get(key) ?? 0) + 1);
		return super.add(key);
	}
	delete(key) {
		if (!this._map.has(key)) return false;
		this._map.delete(key);
		return super.delete(key);
	}
	clear() {
		this._map.clear();
		super.clear();
	}
	getCount(key) {
		return this._map.get(key) ?? 0;
	}
	setCount(key, count) {
		this._map.set(key, count);
		return super.add(key);
	}
};
function isCountableSet(value) {
	return value instanceof CountableSet;
}
//#endregion
//#region src/utils/escape.ts
function escapeRegExp(string) {
	return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
/**
* CSS Selector Escape
*/
function escapeSelector(str) {
	const length = str.length;
	let index = -1;
	let codeUnit;
	let result = "";
	const firstCodeUnit = str.charCodeAt(0);
	while (++index < length) {
		codeUnit = str.charCodeAt(index);
		if (codeUnit === 0) {
			result += "�";
			continue;
		}
		if (codeUnit === 37) {
			result += "\\%";
			continue;
		}
		if (codeUnit === 44) {
			result += "\\,";
			continue;
		}
		if (codeUnit >= 1 && codeUnit <= 31 || codeUnit === 127 || index === 0 && codeUnit >= 48 && codeUnit <= 57 || index === 1 && codeUnit >= 48 && codeUnit <= 57 && firstCodeUnit === 45) {
			result += `\\${codeUnit.toString(16)} `;
			continue;
		}
		if (index === 0 && length === 1 && codeUnit === 45) {
			result += `\\${str.charAt(index)}`;
			continue;
		}
		if (codeUnit >= 128 || codeUnit === 45 || codeUnit === 95 || codeUnit >= 48 && codeUnit <= 57 || codeUnit >= 65 && codeUnit <= 90 || codeUnit >= 97 && codeUnit <= 122) {
			result += str.charAt(index);
			continue;
		}
		result += `\\${str.charAt(index)}`;
	}
	return result;
}
const e = escapeSelector;
//#endregion
//#region src/utils/events.ts
/**
* Create event emitter.
*
* ```js
* import { createNanoEvents } from 'nanoevents'
*
* class Ticker {
*   constructor() {
*     this.emitter = createNanoEvents()
*   }
*   on(...args) {
*     return this.emitter.on(...args)
*   }
*   tick() {
*     this.emitter.emit('tick')
*   }
* }
* ```
*/
function createNanoEvents() {
	return {
		events: {},
		emit(event, ...args) {
			(this.events[event] || []).forEach((i) => i(...args));
		},
		on(event, cb) {
			(this.events[event] = this.events[event] || []).push(cb);
			return () => this.events[event] = (this.events[event] || []).filter((i) => i !== cb);
		}
	};
}
//#endregion
//#region src/utils/helpers.ts
const attributifyRE = /^\[(.+?)~?="(.*)"\]$/;
const cssIdRE = /\.(css|postcss|sass|scss|less|stylus|styl)($|\?)/;
const validateFilterRE = /[\w\u00A0-\uFFFF%-?]/;
function isAttributifySelector(selector) {
	return selector.match(attributifyRE);
}
function isValidSelector(selector = "") {
	return validateFilterRE.test(selector);
}
function normalizeVariant(variant) {
	return typeof variant === "function" ? { match: variant } : variant;
}
function isRawUtil(util) {
	return util.length === 3;
}
function notNull(value) {
	return value != null;
}
function noop() {}
//#endregion
//#region src/utils/layer.ts
function withLayer(layer, rules) {
	rules.forEach((r) => {
		if (!r[2]) r[2] = { layer };
		else r[2].layer = layer;
	});
	return rules;
}
//#endregion
//#region src/utils/map.ts
var TwoKeyMap = class {
	constructor() {
		this._map = /* @__PURE__ */ new Map();
	}
	get(key1, key2) {
		const m2 = this._map.get(key1);
		if (m2) return m2.get(key2);
	}
	getFallback(key1, key2, fallback) {
		let m2 = this._map.get(key1);
		if (!m2) {
			m2 = /* @__PURE__ */ new Map();
			this._map.set(key1, m2);
		}
		if (!m2.has(key2)) m2.set(key2, fallback);
		return m2.get(key2);
	}
	set(key1, key2, value) {
		let m2 = this._map.get(key1);
		if (!m2) {
			m2 = /* @__PURE__ */ new Map();
			this._map.set(key1, m2);
		}
		m2.set(key2, value);
		return this;
	}
	has(key1, key2) {
		return this._map.get(key1)?.has(key2);
	}
	delete(key1, key2) {
		return this._map.get(key1)?.delete(key2) || false;
	}
	deleteTop(key1) {
		return this._map.delete(key1);
	}
	map(fn) {
		return Array.from(this._map.entries()).flatMap(([k1, m2]) => Array.from(m2.entries()).map(([k2, v]) => {
			return fn(v, k1, k2);
		}));
	}
};
var BetterMap = class extends Map {
	getFallback(key, fallback) {
		const v = this.get(key);
		if (v === void 0) {
			this.set(key, fallback);
			return fallback;
		}
		return v;
	}
	map(mapFn) {
		const result = [];
		this.forEach((v, k) => {
			result.push(mapFn(v, k));
		});
		return result;
	}
	flatMap(mapFn) {
		const result = [];
		this.forEach((v, k) => {
			result.push(...mapFn(v, k));
		});
		return result;
	}
};
//#endregion
//#region src/utils/object.ts
function normalizeCSSEntries(obj) {
	if (isString(obj)) return obj;
	return (!Array.isArray(obj) ? Object.entries(obj) : obj).filter((i) => i[1] != null);
}
function normalizeCSSValues(obj) {
	if (Array.isArray(obj)) if (obj.some((i) => !Array.isArray(i) || Array.isArray(i[0]))) return obj.map((i) => normalizeCSSEntries(i));
	else return [obj];
	else return [normalizeCSSEntries(obj)];
}
function clearIdenticalEntries(entry) {
	return entry.filter(([k, v], idx) => {
		if (k.startsWith("$$")) return false;
		for (let i = idx - 1; i >= 0; i--) if (entry[i][0] === k && entry[i][1] === v) return false;
		return true;
	});
}
const VirtualKey = "__virtual_key__";
function entriesToCss(arr) {
	if (arr == null) return "";
	return clearIdenticalEntries(arr).map(([key, value]) => value != null && typeof value !== "function" ? key !== "__virtual_key__" ? `${key}:${value};` : value : void 0).filter(Boolean).join("");
}
function isObject(item) {
	return item && typeof item === "object" && !Array.isArray(item);
}
/**
* Deep merge two objects
*/
function mergeDeep(original, patch, mergeArray = false) {
	const o = original;
	const p = patch;
	if (Array.isArray(p)) if (mergeArray && Array.isArray(p)) return [...o, ...p];
	else return [...p];
	const output = { ...o };
	if (isObject(o) && isObject(p)) Object.keys(p).forEach((key) => {
		if (isObject(o[key]) && isObject(p[key]) || Array.isArray(o[key]) && Array.isArray(p[key])) output[key] = mergeDeep(o[key], p[key], mergeArray);
		else Object.assign(output, { [key]: p[key] });
	});
	return output;
}
function clone(val) {
	let k, out, tmp;
	if (Array.isArray(val)) {
		out = Array.from({ length: k = val.length });
		while (k--) out[k] = (tmp = val[k]) && typeof tmp === "object" ? clone(tmp) : tmp;
		return out;
	}
	if (Object.prototype.toString.call(val) === "[object Object]") {
		out = {};
		for (k in val) if (k === "__proto__") Object.defineProperty(out, k, {
			value: clone(val[k]),
			configurable: true,
			enumerable: true,
			writable: true
		});
		else out[k] = (tmp = val[k]) && typeof tmp === "object" ? clone(tmp) : tmp;
		return out;
	}
	return val;
}
function isStaticRule(rule) {
	return isString(rule[0]);
}
function isStaticShortcut(sc) {
	return isString(sc[0]);
}
//#endregion
//#region src/utils/variant-group.ts
const regexCache = {};
function makeRegexClassGroup(separators = ["-", ":"]) {
	const key = separators.join("|");
	if (!regexCache[key]) regexCache[key] = new RegExp(`((?:[!@*<~\\w+:_-]|\\[&?>?:?\\S*\\])+?)(${key})\\(((?:[~!<>\\w\\s:/\\\\,%#.$?-]|\\[[^\\]]*?\\])+?)\\)(?!\\s*?=>)`, "gm");
	regexCache[key].lastIndex = 0;
	return regexCache[key];
}
function parseVariantGroup(str, separators = ["-", ":"], depth = 5) {
	const regexClassGroup = makeRegexClassGroup(separators);
	let hasChanged;
	let content = str.toString();
	const prefixes = /* @__PURE__ */ new Set();
	const groupsByOffset = /* @__PURE__ */ new Map();
	do {
		hasChanged = false;
		content = content.replace(regexClassGroup, (from, pre, sep, body, groupOffset) => {
			if (!separators.includes(sep)) return from;
			hasChanged = true;
			prefixes.add(pre + sep);
			const bodyOffset = groupOffset + pre.length + sep.length + 1;
			const group = {
				length: from.length,
				items: []
			};
			groupsByOffset.set(groupOffset, group);
			for (const itemMatch of [...body.matchAll(/\S+/g)]) {
				const itemOffset = bodyOffset + itemMatch.index;
				let innerItems = groupsByOffset.get(itemOffset)?.items;
				if (innerItems) groupsByOffset.delete(itemOffset);
				else innerItems = [{
					offset: itemOffset,
					length: itemMatch[0].length,
					className: itemMatch[0]
				}];
				for (const item of innerItems) {
					item.className = item.className === "~" ? sep === ":" ? `${pre}${sep}~` : pre : item.className.replace(/^(!?)(.*)/, `$1${pre}${sep}$2`);
					group.items.push(item);
				}
			}
			return "$".repeat(from.length);
		});
		depth -= 1;
	} while (hasChanged && depth);
	let expanded;
	if (typeof str === "string") {
		expanded = "";
		let prevOffset = 0;
		for (const [offset, group] of groupsByOffset) {
			expanded += str.slice(prevOffset, offset);
			expanded += group.items.map((item) => item.className).join(" ");
			prevOffset = offset + group.length;
		}
		expanded += str.slice(prevOffset);
	} else {
		expanded = str;
		for (const [offset, group] of groupsByOffset) expanded.overwrite(offset, offset + group.length, group.items.map((item) => item.className).join(" "));
	}
	return {
		prefixes: Array.from(prefixes),
		hasChanged,
		groupsByOffset,
		get expanded() {
			return expanded.toString();
		}
	};
}
function collapseVariantGroup(str, prefixes) {
	const collection = /* @__PURE__ */ new Map();
	const sortedPrefix = prefixes.sort((a, b) => b.length - a.length);
	return str.split(/\s+/g).map((part) => {
		const prefix = sortedPrefix.find((prefix) => part.startsWith(prefix));
		if (!prefix) return part;
		const body = part.slice(prefix.length);
		if (collection.has(prefix)) {
			collection.get(prefix).push(body);
			return null;
		} else {
			const items = [body];
			collection.set(prefix, items);
			return {
				prefix,
				items
			};
		}
	}).filter(notNull).map((i) => {
		if (typeof i === "string") return i;
		return `${i.prefix}(${i.items.join(" ")})`;
	}).join(" ");
}
function expandVariantGroup(str, separators = ["-", ":"], depth = 5) {
	const res = parseVariantGroup(str, separators, depth);
	return typeof str === "string" ? res.expanded : str;
}
//#endregion
//#region src/utils/warn.ts
const warned = /* @__PURE__ */ new Set();
function warnOnce(msg) {
	if (warned.has(msg)) return;
	console.warn("[unocss]", msg);
	warned.add(msg);
}
//#endregion
//#region src/config.ts
function resolveShortcuts(shortcuts) {
	return toArray(shortcuts).flatMap((s) => {
		if (Array.isArray(s)) return [s];
		return Object.entries(s);
	});
}
const __RESOLVED = "_uno_resolved";
/**
* Resolve a single preset, nested presets are ignored
*/
async function resolvePreset(presetInput) {
	let preset = typeof presetInput === "function" ? await presetInput() : await presetInput;
	if (__RESOLVED in preset) return preset;
	preset = { ...preset };
	Object.defineProperty(preset, __RESOLVED, {
		value: true,
		enumerable: false
	});
	const shortcuts = preset.shortcuts ? resolveShortcuts(preset.shortcuts) : void 0;
	preset.shortcuts = shortcuts;
	if (preset.prefix || preset.layer) {
		const apply = (i) => {
			if (!i[2]) i[2] = {};
			const meta = i[2];
			if (meta.prefix == null && preset.prefix) meta.prefix = toArray(preset.prefix);
			if (meta.layer == null && preset.layer) meta.layer = preset.layer;
		};
		shortcuts?.forEach(apply);
		preset.rules?.forEach(apply);
	}
	return preset;
}
/**
* Resolve presets with nested presets
*/
async function resolvePresets(preset) {
	const root = await resolvePreset(preset);
	if (!root.presets) return [root];
	return [root, ...(await Promise.all((root.presets || []).flatMap(toArray).flatMap(resolvePresets))).flat()];
}
function mergeContentOptions(optionsArray) {
	if (optionsArray.length === 0) return {};
	const pipelineIncludes = [];
	const pipelineExcludes = [];
	let pipelineDisabled = false;
	const filesystem = [];
	const inline = [];
	for (const options of optionsArray) {
		if (options.pipeline === false) {
			pipelineDisabled = true;
			break;
		} else {
			if (options.pipeline?.include) pipelineIncludes.push(options.pipeline.include);
			if (options.pipeline?.exclude) pipelineExcludes.push(options.pipeline.exclude);
		}
		if (options.filesystem) filesystem.push(options.filesystem);
		if (options.inline) inline.push(options.inline);
	}
	const mergedContent = { pipeline: pipelineDisabled ? false : {
		include: uniq(mergeFilterPatterns(...pipelineIncludes)),
		exclude: uniq(mergeFilterPatterns(...pipelineExcludes))
	} };
	if (filesystem.length) mergedContent.filesystem = uniq(filesystem.flat());
	if (inline.length) mergedContent.inline = uniq(inline.flat());
	return mergedContent;
}
async function resolveConfig(userConfig = {}, defaults = {}) {
	const config = Object.assign({}, defaults, userConfig);
	const rawPresets = uniqueBy((await Promise.all((config.presets || []).flatMap(toArray).flatMap(resolvePresets))).flat(), (a, b) => a.name === b.name);
	const sortedPresets = [
		...rawPresets.filter((p) => p.enforce === "pre"),
		...rawPresets.filter((p) => !p.enforce),
		...rawPresets.filter((p) => p.enforce === "post")
	];
	const sources = [...sortedPresets, config];
	const sourcesReversed = [...sources].reverse();
	const layers = Object.assign({}, DEFAULT_LAYERS, ...sources.map((i) => i.layers));
	function getMerged(key) {
		return uniq(sources.flatMap((p) => toArray(p[key] || [])));
	}
	const extractors = getMerged("extractors");
	let extractorDefault = sourcesReversed.find((i) => i.extractorDefault !== void 0)?.extractorDefault;
	if (extractorDefault === void 0) extractorDefault = extractorSplit;
	if (extractorDefault && !extractors.includes(extractorDefault)) extractors.unshift(extractorDefault);
	extractors.sort((a, b) => (a.order || 0) - (b.order || 0));
	const rules = getMerged("rules");
	const rulesSize = rules.length;
	const rulesStaticMap = {};
	const rulesDynamic = [];
	for (const [index, rule] of rules.entries()) {
		const meta = rule[2] ?? (rule[2] = {});
		meta.__index = index;
		if (isStaticRule(rule)) toArray(meta.prefix ?? "").forEach((prefix) => {
			rulesStaticMap[prefix + rule[0]] = rule;
		});
		else rulesDynamic.unshift(rule);
	}
	const autocomplete = {
		templates: uniq(sources.flatMap((p) => toArray(p.autocomplete?.templates))),
		extractors: sources.flatMap((p) => toArray(p.autocomplete?.extractors)).sort((a, b) => (a.order || 0) - (b.order || 0)),
		shorthands: mergeAutocompleteShorthands(sources.map((p) => p.autocomplete?.shorthands || {}))
	};
	let separators = getMerged("separators");
	if (!separators.length) separators = [":", "-"];
	const content = mergeContentOptions(getMerged("content"));
	const resolved = {
		mergeSelectors: true,
		warn: true,
		sortLayers: (layers) => layers,
		...config,
		blocklist: getMerged("blocklist"),
		presets: sortedPresets,
		envMode: config.envMode || "build",
		shortcutsLayer: config.shortcutsLayer || "shortcuts",
		layers,
		theme: mergeThemes(sources.map((p) => p.theme)),
		rules,
		rulesSize,
		rulesDynamic,
		rulesStaticMap,
		preprocess: getMerged("preprocess"),
		postprocess: getMerged("postprocess"),
		preflights: getMerged("preflights"),
		autocomplete,
		variants: getMerged("variants").map(normalizeVariant).sort((a, b) => (a.order || 0) - (b.order || 0)),
		shortcuts: resolveShortcuts(getMerged("shortcuts")).reverse(),
		extractors,
		safelist: getMerged("safelist"),
		separators,
		details: config.details ?? config.envMode === "dev",
		content,
		transformers: uniqueBy(getMerged("transformers"), (a, b) => a.name === b.name)
	};
	const extendThemes = getMerged("extendTheme");
	for (const extendTheme of extendThemes) resolved.theme = extendTheme(resolved.theme, resolved) || resolved.theme;
	for (const p of sources) p?.configResolved?.(resolved);
	return resolved;
}
/**
* Merge multiple configs into one, later ones have higher priority
*/
function mergeConfigs(configs) {
	const maybeArrays = [
		"shortcuts",
		"preprocess",
		"postprocess"
	];
	return configs.map((config) => Object.entries(config).reduce((acc, [key, value]) => ({
		...acc,
		[key]: maybeArrays.includes(key) ? toArray(value) : value
	}), {})).reduce(({ theme: themeA, content: contentA, ...a }, { theme: themeB, content: contentB, ...b }) => {
		const c = mergeDeep(a, b, true);
		if (themeA || themeB) c.theme = mergeThemes([themeA, themeB]);
		if (contentA || contentB) c.content = mergeContentOptions([contentA || {}, contentB || {}]);
		return c;
	}, {});
}
function mergeThemes(themes) {
	return themes.map((theme) => theme ? clone(theme) : {}).reduce((a, b) => mergeDeep(a, b), {});
}
function mergeAutocompleteShorthands(shorthands) {
	return shorthands.reduce((a, b) => {
		const rs = {};
		for (const key in b) {
			const value = b[key];
			if (Array.isArray(value)) rs[key] = `(${value.join("|")})`;
			else rs[key] = value;
		}
		return {
			...a,
			...rs
		};
	}, {});
}
function mergeFilterPatterns(...filterPatterns) {
	return filterPatterns.flatMap(flatternFilterPattern);
}
function flatternFilterPattern(pattern) {
	return Array.isArray(pattern) ? pattern : pattern ? [pattern] : [];
}
function definePreset(preset) {
	return preset;
}
//#endregion
//#region package.json
var version = "66.6.8";
//#endregion
//#region src/generator.ts
const symbols = {
	shortcutsNoMerge: "$$symbol-shortcut-no-merge",
	noMerge: "$$symbol-no-merge",
	noScope: "$$symbol-no-scope",
	variants: "$$symbol-variants",
	parent: "$$symbol-parent",
	selector: "$$symbol-selector",
	layer: "$$symbol-layer",
	sort: "$$symbol-sort",
	body: "$$symbol-body"
};
var UnoGeneratorInternal = class UnoGeneratorInternal {
	constructor(userConfig = {}, defaults = {}) {
		this.userConfig = userConfig;
		this.defaults = defaults;
		this.version = version;
		this.events = createNanoEvents();
		this.config = void 0;
		this.cache = /* @__PURE__ */ new Map();
		this.blocked = /* @__PURE__ */ new Set();
		this.parentOrders = /* @__PURE__ */ new Map();
		this.activatedRules = /* @__PURE__ */ new Set();
		this.resolveCSSResult = (raw, result, rule, context) => {
			const entries = normalizeCSSValues(result).filter((i) => i.length);
			if (entries.length) {
				if (this.config.details) context.rules.push(rule);
				context.generator.activatedRules.add(rule);
				const meta = rule[2];
				return entries.map((css) => {
					if (isString(css)) return [
						meta.__index,
						css,
						meta
					];
					let variants = context.variantHandlers;
					let entryMeta = meta;
					const setVariant = (variant) => {
						variants = [variant, ...variants];
					};
					const setMeta = (partial) => {
						entryMeta = {
							...entryMeta,
							...partial
						};
					};
					for (const entry of css) switch (entry[0]) {
						case symbols.variants:
							if (typeof entry[1] === "function") variants = entry[1](variants) || variants;
							else variants = [...toArray(entry[1]), ...variants];
							break;
						case symbols.parent:
							setVariant({ parent: entry[1] });
							break;
						case symbols.selector:
							setVariant({ selector: entry[1] });
							break;
						case symbols.layer:
							setVariant({ layer: entry[1] });
							break;
						case symbols.sort:
							setMeta({ sort: entry[1] });
							break;
						case symbols.noMerge:
							setMeta({ noMerge: entry[1] });
							break;
						case symbols.noScope:
							setMeta({ noScope: entry[1] });
							break;
						case symbols.body:
							entry[0] = VirtualKey;
							break;
					}
					return [
						meta.__index,
						raw,
						css,
						entryMeta,
						variants
					];
				});
			}
		};
	}
	static async create(userConfig = {}, defaults = {}) {
		const uno = new UnoGeneratorInternal(userConfig, defaults);
		uno.config = await resolveConfig(uno.userConfig, uno.defaults);
		uno.events.emit("config", uno.config);
		return uno;
	}
	async setConfig(userConfig, defaults) {
		if (!userConfig) return;
		if (defaults) this.defaults = defaults;
		this.userConfig = userConfig;
		this.blocked.clear();
		this.parentOrders.clear();
		this.activatedRules.clear();
		this.cache.clear();
		this.config = await resolveConfig(userConfig, this.defaults);
		this.events.emit("config", this.config);
	}
	async applyExtractors(code, id, extracted = /* @__PURE__ */ new Set()) {
		const context = {
			original: code,
			code,
			id,
			extracted,
			envMode: this.config.envMode
		};
		for (const extractor of this.config.extractors) {
			const result = await extractor.extract?.(context);
			if (!result) continue;
			if (isCountableSet(result) && isCountableSet(extracted)) for (const token of result) extracted.setCount(token, extracted.getCount(token) + result.getCount(token));
			else for (const token of result) extracted.add(token);
		}
		return extracted;
	}
	makeContext(raw, applied) {
		const context = {
			rawSelector: raw,
			currentSelector: applied[1],
			theme: this.config.theme,
			generator: this,
			symbols,
			variantHandlers: applied[2],
			constructCSS: (...args) => this.constructCustomCSS(context, ...args),
			variantMatch: applied
		};
		return context;
	}
	async parseToken(raw, alias) {
		if (this.blocked.has(raw)) return;
		const cacheKey = `${raw}${alias ? ` ${alias}` : ""}`;
		if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);
		const current = this.config.preprocess.reduce((acc, p) => p(acc) ?? acc, raw);
		if (this.isBlocked(current)) {
			this.blocked.add(raw);
			this.cache.set(cacheKey, null);
			return;
		}
		const variantResults = await this.matchVariants(raw, current);
		if (variantResults.every((i) => !i || this.isBlocked(i[1]))) {
			this.blocked.add(raw);
			this.cache.set(cacheKey, null);
			return;
		}
		const handleVariantResult = async (matched) => {
			const context = this.makeContext(raw, [
				alias || matched[0],
				matched[1],
				matched[2],
				matched[3]
			]);
			if (this.config.details) context.variants = [...matched[3]];
			const expanded = await this.expandShortcut(context.currentSelector, context);
			return expanded ? await this.stringifyShortcuts(context.variantMatch, context, expanded[0], expanded[1]) : (await this.parseUtil(context.variantMatch, context))?.flatMap((i) => this.stringifyUtil(i, context)).filter(notNull);
		};
		const result = (await Promise.all(variantResults.map((i) => handleVariantResult(i)))).flat().filter((x) => !!x);
		if (result?.length) {
			this.cache.set(cacheKey, result);
			return result;
		}
		this.cache.set(cacheKey, null);
	}
	async generate(input, options = {}) {
		const { id, scope, preflights = true, safelist = true, minify = false, extendedInfo = false } = options;
		const tokens = isString(input) ? await this.applyExtractors(input, id, extendedInfo ? new CountableSet() : /* @__PURE__ */ new Set()) : Array.isArray(input) ? new Set(input) : input;
		if (safelist) {
			const safelistContext = {
				generator: this,
				theme: this.config.theme
			};
			this.config.safelist.flatMap((s) => typeof s === "function" ? s(safelistContext) : s).forEach((s) => {
				const trimmedS = s.trim();
				if (trimmedS && !tokens.has(trimmedS)) tokens.add(trimmedS);
			});
		}
		const nl = minify ? "" : "\n";
		const layerSet = new Set([LAYER_DEFAULT]);
		const matched = extendedInfo ? /* @__PURE__ */ new Map() : /* @__PURE__ */ new Set();
		const sheet = /* @__PURE__ */ new Map();
		let preflightsMap = {};
		const tokenPromises = Array.from(tokens).map(async (raw) => {
			if (matched.has(raw)) return;
			const payload = await this.parseToken(raw);
			if (payload == null) return;
			if (matched instanceof Map) matched.set(raw, {
				data: payload,
				count: isCountableSet(tokens) ? tokens.getCount(raw) : -1
			});
			else matched.add(raw);
			for (const item of payload) {
				const parent = item[3] || "";
				const layer = item[4]?.layer;
				if (!sheet.has(parent)) sheet.set(parent, []);
				sheet.get(parent).push(item);
				if (layer) layerSet.add(layer);
			}
		});
		await Promise.all(tokenPromises);
		await (async () => {
			if (!preflights) return;
			const preflightContext = {
				generator: this,
				theme: this.config.theme
			};
			const preflightLayerSet = /* @__PURE__ */ new Set([]);
			this.config.preflights.forEach(({ layer = LAYER_PREFLIGHTS }) => {
				layerSet.add(layer);
				preflightLayerSet.add(layer);
			});
			preflightsMap = Object.fromEntries(await Promise.all(Array.from(preflightLayerSet).map(async (layer) => {
				return [layer, (await Promise.all(this.config.preflights.filter((i) => (i.layer || "preflights") === layer).map(async (i) => await i.getCSS(preflightContext)))).filter(Boolean).join(nl)];
			})));
		})();
		const sortLayers = (layers) => this.config.sortLayers(layers.sort((a, b) => (this.config.layers[a] ?? 0) - (this.config.layers[b] ?? 0) || a.localeCompare(b)));
		const layers = sortLayers(Array.from(layerSet));
		const layerCache = {};
		const outputCssLayers = this.config.outputToCssLayers;
		const getLayerAlias = (layer) => {
			let alias = layer;
			if (typeof outputCssLayers === "object") alias = outputCssLayers.cssLayerName?.(layer);
			return alias === null ? null : alias ?? layer;
		};
		const getLayer = (layer = LAYER_DEFAULT) => {
			if (layerCache[layer]) return layerCache[layer];
			let css = Array.from(sheet).sort((a, b) => (this.parentOrders.get(a[0]) ?? 0) - (this.parentOrders.get(b[0]) ?? 0) || a[0]?.localeCompare(b[0] || "") || 0).map(([parent, items]) => {
				const size = items.length;
				const sorted = items.filter((i) => (i[4]?.layer || "default") === layer).sort((a, b) => {
					return a[0] - b[0] || (a[4]?.sort || 0) - (b[4]?.sort || 0) || a[5]?.currentSelector?.localeCompare(b[5]?.currentSelector ?? "") || a[1]?.localeCompare(b[1] || "") || a[2]?.localeCompare(b[2] || "") || 0;
				}).map(([, selector, body, , meta, , variantNoMerge]) => {
					return [
						[[(selector && !meta?.noScope ? applyScope(selector, scope) : selector) ?? "", meta?.sort ?? 0]],
						body,
						!!(variantNoMerge ?? meta?.noMerge)
					];
				});
				if (!sorted.length) return void 0;
				const ruleLines = sorted.reverse().map(([selectorSortPair, body, noMerge], idx) => {
					if (!noMerge && this.config.mergeSelectors) for (let i = idx + 1; i < size; i++) {
						const current = sorted[i];
						if (current && !current[2] && (selectorSortPair && current[0] || selectorSortPair == null && current[0] == null) && current[1] === body) {
							if (selectorSortPair && current[0]) current[0].push(...selectorSortPair);
							return null;
						}
					}
					const selectors = selectorSortPair ? uniq(selectorSortPair.sort((a, b) => a[1] - b[1] || a[0]?.localeCompare(b[0] || "") || 0).map((pair) => pair[0]).filter(Boolean)) : [];
					return selectors.length ? `${selectors.join(`,${nl}`)}{${body}}` : body;
				}).filter(Boolean);
				const rules = Array.from(new Set(ruleLines)).reverse().join(nl);
				if (!parent) return rules;
				const parents = parent.split(" $$ ");
				return `${parents.join("{")}{${nl}${rules}${nl}${"}".repeat(parents.length)}`;
			}).filter(Boolean).join(nl);
			if (preflights) css = [preflightsMap[layer], css].filter(Boolean).join(nl);
			let alias;
			if (outputCssLayers && css) {
				alias = getLayerAlias(layer);
				if (alias !== null) css = `@layer ${alias}{${nl}${css}${nl}}`;
			}
			const layerMark = minify ? "" : `/* layer: ${layer}${alias && alias !== layer ? `, alias: ${alias}` : ""} */${nl}`;
			return layerCache[layer] = css ? layerMark + css : "";
		};
		const getLayers = (includes = layers, excludes) => {
			const layers = includes.filter((i) => !excludes?.includes(i));
			const css = layers.map(getLayer).filter(Boolean);
			if (outputCssLayers) {
				let layerNames = layers;
				if (typeof outputCssLayers === "object" && outputCssLayers.allLayers) layerNames = sortLayers(Object.keys(this.config.layers));
				if (layerNames.length > 0) css.unshift(`@layer ${layerNames.map(getLayerAlias).filter(notNull).join(", ")};`);
			}
			return css.join(nl);
		};
		const setLayer = async (layer, callback) => {
			const content = await callback(getLayer(layer));
			layerCache[layer] = content;
			return content;
		};
		return {
			get css() {
				return getLayers();
			},
			layers,
			matched,
			getLayers,
			getLayer,
			setLayer
		};
	}
	async matchVariants(raw, current) {
		const context = {
			rawSelector: raw,
			theme: this.config.theme,
			generator: this
		};
		const match = async (result) => {
			let applied = true;
			const [, , handlers, variants] = result;
			while (applied) {
				applied = false;
				const processed = result[1];
				for (const v of this.config.variants) {
					if (!v.multiPass && variants.has(v)) continue;
					let handler = await v.match(processed, context);
					if (!handler) continue;
					if (isString(handler)) {
						if (handler === processed) continue;
						handler = { matcher: handler };
					}
					if (Array.isArray(handler)) {
						if (!handler.length) continue;
						if (handler.length === 1) handler = handler[0];
						else {
							if (v.multiPass) throw new Error("multiPass can not be used together with array return variants");
							const clones = handler.map((h) => {
								const _processed = h.matcher ?? processed;
								const _handlers = [h, ...handlers];
								const _variants = new Set(variants);
								_variants.add(v);
								return [
									result[0],
									_processed,
									_handlers,
									_variants
								];
							});
							return (await Promise.all(clones.map((c) => match(c)))).flat();
						}
					}
					result[1] = handler.matcher ?? processed;
					handlers.unshift(handler);
					variants.add(v);
					applied = true;
					break;
				}
				if (!applied) break;
				if (handlers.length > 500) throw new Error(`Too many variants applied to "${raw}"`);
			}
			return [result];
		};
		return await match([
			raw,
			current || raw,
			[],
			/* @__PURE__ */ new Set()
		]);
	}
	applyVariants(parsed, variantHandlers = parsed[4], raw = parsed[1]) {
		const variantContextResult = variantHandlers.slice().sort((a, b) => (a.order || 0) - (b.order || 0)).reduceRight((previous, v) => (input) => {
			const entries = v.body?.(input.entries) || input.entries;
			const parents = Array.isArray(v.parent) ? v.parent : [v.parent, void 0];
			const selector = v.selector?.(input.selector, entries);
			return (v.handle ?? defaultVariantHandler)({
				...input,
				entries,
				selector: selector || input.selector,
				parent: parents[0] || input.parent,
				parentOrder: parents[1] || input.parentOrder,
				layer: v.layer || input.layer,
				sort: v.sort || input.sort
			}, previous);
		}, (input) => input)({
			prefix: "",
			selector: toEscapedSelector(raw),
			pseudo: "",
			entries: parsed[2]
		});
		const { parent, parentOrder } = variantContextResult;
		if (parent != null && parentOrder != null) this.parentOrders.set(parent, parentOrder);
		const obj = {
			selector: [
				variantContextResult.prefix,
				variantContextResult.selector,
				variantContextResult.pseudo
			].join(""),
			entries: variantContextResult.entries,
			parent,
			layer: variantContextResult.layer,
			sort: variantContextResult.sort,
			noMerge: variantContextResult.noMerge
		};
		return this.config.postprocess.reduce((utilities, p) => {
			const result = [];
			for (const util of utilities) {
				const processed = p(util);
				if (Array.isArray(processed)) result.push(...processed.filter(notNull));
				else result.push(processed || util);
			}
			return result;
		}, [obj]);
	}
	constructCustomCSS(context, body, overrideSelector) {
		const normalizedBody = normalizeCSSEntries(body);
		if (isString(normalizedBody)) return normalizedBody;
		return this.applyVariants([
			0,
			overrideSelector || context.rawSelector,
			normalizedBody,
			void 0,
			context.variantHandlers
		]).map(({ selector, entries, parent }) => {
			const cssBody = `${selector}{${entriesToCss(entries)}}`;
			if (parent) return `${parent}{${cssBody}}`;
			return cssBody;
		}).join("");
	}
	async parseUtil(input, context, internal = false, shortcutPrefix) {
		const variantResults = isString(input) ? await this.matchVariants(input) : [input];
		const parse = async ([raw, processed, variantHandlers]) => {
			if (this.config.details) context.rules = context.rules ?? [];
			const scopeContext = {
				...context,
				variantHandlers
			};
			const staticMatch = this.config.rulesStaticMap[processed];
			if (staticMatch) {
				if (staticMatch[1] && (internal || !staticMatch[2]?.internal)) return this.resolveCSSResult(raw, staticMatch[1], staticMatch, scopeContext);
			}
			for (const rule of this.config.rulesDynamic) {
				const [matcher, handler, meta] = rule;
				if (meta?.internal && !internal) continue;
				let unprefixed = processed;
				if (meta?.prefix) {
					const prefixes = toArray(meta.prefix);
					if (shortcutPrefix) {
						const shortcutPrefixes = toArray(shortcutPrefix);
						if (!prefixes.some((i) => shortcutPrefixes.includes(i))) continue;
					} else {
						const prefix = prefixes.find((i) => processed.startsWith(i));
						if (prefix == null) continue;
						unprefixed = processed.slice(prefix.length);
					}
				}
				const match = unprefixed.match(matcher);
				if (!match) continue;
				let result = await handler(match, scopeContext);
				if (!result) continue;
				if (typeof result !== "string") {
					if (Symbol.asyncIterator in result) {
						const entries = [];
						for await (const r of result) if (r) entries.push(r);
						result = entries;
					} else if (Symbol.iterator in result && !Array.isArray(result)) result = Array.from(result).filter(notNull);
				}
				const resolvedResult = this.resolveCSSResult(raw, result, rule, scopeContext);
				if (resolvedResult) return resolvedResult;
			}
		};
		const parsed = (await Promise.all(variantResults.map((i) => parse(i)))).flat().filter((x) => !!x);
		if (!parsed.length) return void 0;
		return parsed;
	}
	stringifyUtil(parsed, context) {
		if (!parsed) return;
		if (isRawUtil(parsed)) return [[
			parsed[0],
			void 0,
			parsed[1],
			void 0,
			parsed[2],
			this.config.details ? context : void 0,
			void 0
		]];
		const utilities = this.applyVariants(parsed);
		const result = [];
		for (const util of utilities) {
			const { selector, entries, parent, layer: variantLayer, sort: variantSort, noMerge } = util;
			const body = entriesToCss(entries);
			if (!body) continue;
			const { layer: metaLayer, sort: metaSort, ...meta } = parsed[3] ?? {};
			const ruleMeta = {
				...meta,
				layer: variantLayer ?? metaLayer,
				sort: variantSort ?? metaSort
			};
			result.push([
				parsed[0],
				selector,
				body,
				parent,
				ruleMeta,
				this.config.details ? context : void 0,
				noMerge
			]);
		}
		return result;
	}
	async expandShortcut(input, context, depth = 5) {
		if (depth === 0) return;
		const recordShortcut = this.config.details ? (s) => {
			context.shortcuts = context.shortcuts ?? [];
			context.shortcuts.push(s);
		} : noop;
		let meta;
		let result;
		let stringResult;
		let inlineResult;
		for (const s of this.config.shortcuts) {
			let unprefixed = input;
			if (s[2]?.prefix) {
				const prefix = toArray(s[2].prefix).find((i) => input.startsWith(i));
				if (prefix == null) continue;
				unprefixed = input.slice(prefix.length);
			}
			if (isStaticShortcut(s)) {
				if (s[0] === unprefixed) {
					meta = meta || s[2];
					result = s[1];
					recordShortcut(s);
					break;
				}
			} else {
				const match = unprefixed.match(s[0]);
				if (match) result = s[1](match, context);
				if (result) {
					meta = meta || s[2];
					recordShortcut(s);
					break;
				}
			}
		}
		if (result) {
			stringResult = uniq(toArray(result).filter(isString).map((s) => expandVariantGroup(s.trim()).split(/\s+/g)).flat());
			inlineResult = toArray(result).filter((i) => !isString(i)).map((i) => ({
				handles: [],
				value: i
			}));
		}
		if (!result) {
			const matched = isString(input) ? await this.matchVariants(input) : [input];
			for (const match of matched) {
				const [raw, inputWithoutVariant, handles] = match;
				if (raw !== inputWithoutVariant) {
					const expanded = await this.expandShortcut(inputWithoutVariant, context, depth - 1);
					if (expanded) {
						stringResult = expanded[0].filter(isString).map((item) => raw.replace(inputWithoutVariant, item));
						inlineResult = expanded[0].filter((i) => !isString(i)).map((item) => {
							return {
								handles: [...item.handles, ...handles],
								value: item.value
							};
						});
					}
				}
			}
		}
		if (!stringResult?.length && !inlineResult?.length) return;
		return [[await Promise.all(toArray(stringResult).map(async (s) => (await this.expandShortcut(s, context, depth - 1))?.[0] || [s])), inlineResult].flat(2).filter((x) => !!x), meta];
	}
	async stringifyShortcuts(parent, context, expanded, meta = { layer: this.config.shortcutsLayer }) {
		const layerMap = new BetterMap();
		const parsed = (await Promise.all(uniq(expanded).map(async (i) => {
			const result = isString(i) ? await this.parseUtil(i, context, true, meta.prefix) : [[
				Number.POSITIVE_INFINITY,
				"{inline}",
				normalizeCSSEntries(i.value),
				void 0,
				i.handles
			]];
			if (!result && this.config.warn) warnOnce(`unmatched utility "${i}" in shortcut "${parent[1]}"`);
			return result || [];
		}))).flat(1).filter(Boolean).sort((a, b) => a[0] - b[0]);
		const [raw, , parentVariants] = parent;
		const rawStringifiedUtil = [];
		for (const item of parsed) {
			if (isRawUtil(item)) {
				rawStringifiedUtil.push([
					item[0],
					void 0,
					item[1],
					void 0,
					item[2],
					context,
					void 0
				]);
				continue;
			}
			const isNoMerge = Object.fromEntries(item[2])[symbols.shortcutsNoMerge];
			const variants = [...item[4], ...!isNoMerge ? parentVariants : []];
			for (const { selector, entries, parent, sort, noMerge, layer } of this.applyVariants(item, variants, raw)) layerMap.getFallback(layer ?? meta.layer, new TwoKeyMap()).getFallback(selector, parent, [[], item[0]])[0].push([
				entries,
				!!(noMerge ?? item[3]?.noMerge),
				sort ?? 0
			]);
		}
		return rawStringifiedUtil.concat(layerMap.flatMap((selectorMap, layer) => selectorMap.map(([e, index], selector, joinedParents) => {
			const stringify = (flatten, noMerge, entrySortPair) => {
				const maxSort = Math.max(...entrySortPair.map((e) => e[1]));
				const entriesList = entrySortPair.map((e) => e[0]);
				return (flatten ? [entriesList.flat(1)] : entriesList).map((entries) => {
					const body = entriesToCss(entries);
					if (body) return [
						index,
						selector,
						body,
						joinedParents,
						{
							...meta,
							noMerge,
							sort: maxSort,
							layer
						},
						context,
						void 0
					];
				});
			};
			return [[e.filter(([, noMerge]) => noMerge).map(([entries, , sort]) => [entries, sort]), true], [e.filter(([, noMerge]) => !noMerge).map(([entries, , sort]) => [entries, sort]), false]].map(([e, noMerge]) => [...stringify(false, noMerge, e.filter(([entries]) => entries.some((entry) => entry[0] === symbols.shortcutsNoMerge))), ...stringify(true, noMerge, e.filter(([entries]) => entries.every((entry) => entry[0] !== symbols.shortcutsNoMerge)))]);
		}).flat(2).filter(Boolean)));
	}
	isBlocked(raw) {
		return !raw || this.config.blocklist.map((e) => Array.isArray(e) ? e[0] : e).some((e) => typeof e === "function" ? e(raw) : isString(e) ? e === raw : e.test(raw));
	}
	getBlocked(raw) {
		const rule = this.config.blocklist.find((e) => {
			const v = Array.isArray(e) ? e[0] : e;
			return typeof v === "function" ? v(raw) : isString(v) ? v === raw : v.test(raw);
		});
		return rule ? Array.isArray(rule) ? rule : [rule, void 0] : void 0;
	}
};
var UnoGenerator = class extends UnoGeneratorInternal {
	/**
	* @deprecated `new UnoGenerator` is deprecated, please use `createGenerator()` instead
	*/
	constructor(userConfig = {}, defaults = {}) {
		super(userConfig, defaults);
		console.warn("`new UnoGenerator()` is deprecated, please use `createGenerator()` instead");
	}
};
async function createGenerator(config, defaults) {
	return await UnoGeneratorInternal.create(config, defaults);
}
const regexScopePlaceholder = /\s\$\$\s+/g;
function hasScopePlaceholder(css) {
	return regexScopePlaceholder.test(css);
}
function applyScope(css, scope) {
	if (hasScopePlaceholder(css)) return css.replace(regexScopePlaceholder, scope ? ` ${scope} ` : " ");
	else return scope ? `${scope} ${css}` : css;
}
const attributifyRe = /^\[(.+?)(~?=)"(.*)"\]$/;
function toEscapedSelector(raw) {
	if (attributifyRe.test(raw)) return raw.replace(attributifyRe, (_, n, s, i) => `[${e(n)}${s}"${e(i)}"]`);
	return `.${e(raw)}`;
}
function defaultVariantHandler(input, next) {
	return next(input);
}
//#endregion
export { BetterMap, CountableSet, DEFAULT_LAYERS, LAYER_DEFAULT, LAYER_IMPORTS, LAYER_PREFLIGHTS, LAYER_SHORTCUTS, TwoKeyMap, UnoGenerator, VirtualKey, attributifyRE, clearIdenticalEntries, clone, collapseVariantGroup, createGenerator, createNanoEvents, cssIdRE, defaultSplitRE, definePreset, e, entriesToCss, escapeRegExp, escapeSelector, expandVariantGroup, extractorSplit as extractorDefault, extractorSplit, hasScopePlaceholder, isAttributifySelector, isCountableSet, isObject, isRawUtil, isStaticRule, isStaticShortcut, isString, isValidSelector, makeRegexClassGroup, mergeConfigs, mergeDeep, noop, normalizeCSSEntries, normalizeCSSValues, normalizeVariant, notNull, parseVariantGroup, regexScopePlaceholder, resolveConfig, resolvePreset, resolvePresets, resolveShortcuts, splitWithVariantGroupRE, symbols, toArray, toEscapedSelector, uniq, uniqueBy, validateFilterRE, warnOnce, withLayer };
