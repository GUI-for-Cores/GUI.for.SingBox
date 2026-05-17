import { existsSync, promises } from "node:fs";
import process from "node:process";
import { createRecoveryConfigLoader } from "@unocss/config";
import { BetterMap, createGenerator, cssIdRE, toArray } from "@unocss/core";
import { createFilter } from "unplugin-utils";
import remapping from "@jridgewell/remapping";
import MagicString from "magic-string";
import { cyan, dim, green, yellow } from "colorette";
import consola, { consola as consola$1 } from "consola";
import { basename, dirname, normalize, relative, resolve } from "pathe";
import { debounce } from "perfect-debounce";
import { glob } from "tinyglobby";
const SKIP_START_COMMENT = "@unocss-skip-start";
const SKIP_END_COMMENT = "@unocss-skip-end";
const SKIP_COMMENT_RE = new RegExp(`(\/\/\\s*?${SKIP_START_COMMENT}\\s*?|\\/\\*\\s*?${SKIP_START_COMMENT}\\s*?\\*\\/|<!--\\s*?${SKIP_START_COMMENT}\\s*?-->)[\\s\\S]*?(\/\/\\s*?${SKIP_END_COMMENT}\\s*?|\\/\\*\\s*?${SKIP_END_COMMENT}\\s*?\\*\\/|<!--\\s*?${SKIP_END_COMMENT}\\s*?-->)`, "g");
//#endregion
//#region ../../virtual-shared/integration/src/defaults.ts
const defaultPipelineExclude = [cssIdRE];
const defaultPipelineInclude = [/\.(vue|svelte|[jt]sx|vine.ts|mdx?|astro|elm|php|phtml|marko|html)($|\?)/];
//#endregion
//#region ../../virtual-shared/integration/src/context.ts
function createContext(configOrPath, defaults = {}, extraConfigSources = [], resolveConfigResult = () => {}) {
	let root = process.cwd();
	let rawConfig = {};
	let configFileList = [];
	let uno;
	const _uno = createGenerator(rawConfig, defaults).then((r) => {
		uno = r;
		return r;
	});
	let rollupFilter = createFilter(defaultPipelineInclude, defaultPipelineExclude, { resolve: typeof configOrPath === "string" ? configOrPath : root });
	const invalidations = [];
	const reloadListeners = [];
	const modules = new BetterMap();
	const tokens = /* @__PURE__ */ new Set();
	const tasks = [];
	const affectedModules = /* @__PURE__ */ new Set();
	const loadConfig = createRecoveryConfigLoader();
	let ready = reloadConfig();
	async function reloadConfig() {
		var _rawConfig$content, _rawConfig$content2, _rawConfig$content3;
		await _uno;
		const result = await loadConfig(root, configOrPath, extraConfigSources, defaults);
		resolveConfigResult(result);
		result.config;
		rawConfig = result.config;
		configFileList = result.sources;
		await uno.setConfig(rawConfig);
		uno.config.envMode = "dev";
		rollupFilter = ((_rawConfig$content = rawConfig.content) === null || _rawConfig$content === void 0 ? void 0 : _rawConfig$content.pipeline) === false ? () => false : createFilter(((_rawConfig$content2 = rawConfig.content) === null || _rawConfig$content2 === void 0 || (_rawConfig$content2 = _rawConfig$content2.pipeline) === null || _rawConfig$content2 === void 0 ? void 0 : _rawConfig$content2.include) || defaultPipelineInclude, ((_rawConfig$content3 = rawConfig.content) === null || _rawConfig$content3 === void 0 || (_rawConfig$content3 = _rawConfig$content3.pipeline) === null || _rawConfig$content3 === void 0 ? void 0 : _rawConfig$content3.exclude) || defaultPipelineExclude, { resolve: typeof configOrPath === "string" ? configOrPath : root });
		tokens.clear();
		await Promise.all(modules.map((code, id) => uno.applyExtractors(code.replace(SKIP_COMMENT_RE, ""), id, tokens)));
		invalidate();
		dispatchReload();
		return result;
	}
	async function updateRoot(newRoot) {
		if (newRoot !== root) {
			root = newRoot;
			ready = reloadConfig();
		}
		return await ready;
	}
	function invalidate() {
		invalidations.forEach((cb) => cb());
	}
	function dispatchReload() {
		reloadListeners.forEach((cb) => cb());
	}
	async function extract(code, id) {
		const uno = await _uno;
		if (id) modules.set(id, code);
		const len = tokens.size;
		await uno.applyExtractors(code.replace(SKIP_COMMENT_RE, ""), id, tokens);
		if (tokens.size > len) invalidate();
	}
	function filter(code, id) {
		if (code.includes("@unocss-ignore")) return false;
		return code.includes("@unocss-include") || code.includes("@unocss-placeholder") || rollupFilter(id.replace(/\?v=\w+$/, ""));
	}
	async function getConfig() {
		await ready;
		return rawConfig;
	}
	async function flushTasks() {
		const _tasks = [...tasks];
		await Promise.all(_tasks);
		if (tasks[0] === _tasks[0]) tasks.splice(0, _tasks.length);
	}
	/**
	* Get regexes to match virtual module ids
	*/
	const vmpCache = /* @__PURE__ */ new Map();
	async function getVMPRegexes() {
		const prefix = (await getConfig()).virtualModulePrefix || "__uno";
		if (vmpCache.has(prefix)) return vmpCache.get(prefix);
		const regexes = {
			prefix,
			RESOLVED_ID_WITH_QUERY_RE: new RegExp(`[/\\\\]${prefix}(_.*?)?\\.css(\\?.*)?$`),
			RESOLVED_ID_RE: new RegExp(`[/\\\\]${prefix}(?:_(.*?))?\.css$`)
		};
		vmpCache.set(prefix, regexes);
		return regexes;
	}
	return {
		get ready() {
			return ready;
		},
		tokens,
		modules,
		affectedModules,
		tasks,
		flushTasks,
		invalidate,
		onInvalidate(fn) {
			invalidations.push(fn);
		},
		filter,
		reloadConfig,
		onReload(fn) {
			reloadListeners.push(fn);
		},
		get uno() {
			if (!uno) throw new Error("Run `await context.ready` before accessing `context.uno`");
			return uno;
		},
		extract,
		getConfig,
		get root() {
			return root;
		},
		updateRoot,
		getConfigFileList: () => configFileList,
		getVMPRegexes
	};
}
//#endregion
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
//#region ../../virtual-shared/integration/src/transformers.ts
async function applyTransformers(ctx, original, id, enforce = "default") {
	if (original.includes("@unocss-ignore")) return;
	const transformers = (ctx.uno.config.transformers || []).filter((i) => (i.enforce || "default") === enforce);
	if (!transformers.length) return;
	const skipMap = /* @__PURE__ */ new Map();
	let code = original;
	let s = new MagicString(transformSkipCode(code, skipMap, SKIP_COMMENT_RE, "@unocss-skip-placeholder-"));
	const maps = [];
	for (const t of transformers) {
		if (t.idFilter) {
			if (!t.idFilter(id)) continue;
		} else if (!ctx.filter(code, id)) continue;
		await t.transform(s, id, ctx);
		if (s.hasChanged()) {
			code = restoreSkipCode(s.toString(), skipMap);
			maps.push(s.generateMap({
				hires: true,
				source: id
			}));
			s = new MagicString(code);
		}
	}
	if (code !== original) return {
		code,
		map: remapping(maps, (_, ctx) => {
			ctx.content = code;
			return null;
		})
	};
}
//#endregion
//#region package.json
var version = "66.6.8";
//#endregion
//#region src/debug.ts
/**
* generate and print a debug details table
*
* Example:
*
* File Generation Details:
* ---------------------+----------------------
* | Output File        | Source Files (1)    |
* ---------------------+----------------------
* | src/styles/uno.css | src/styles/mock.css |
* ---------------------+----------------------
*/
function debugDetailsTable(options, outFile, files) {
	const table = [["Output File", `Source Files (${files.length})`]];
	files.forEach((f, i) => {
		table.push([i === 0 ? relative(options.cwd, outFile) : "", relative(options.cwd, f.id)]);
	});
	const colWidths = table[0].map((_, colIndex) => Math.max(...table.map((row) => row[colIndex].length)));
	const separator = colWidths.map((width) => "-".repeat(width + 3)).join("+");
	consola.log(yellow("File Generation Details:"));
	consola.log(separator);
	for (const row of table) {
		const rowStr = row.map((cell, index) => ` ${cell.padEnd(colWidths[index])} `).join("|");
		consola.log(`|${rowStr}|`);
		consola.log(separator);
	}
}
//#endregion
//#region src/errors.ts
var PrettyError = class extends Error {
	constructor(message) {
		super(message);
		this.name = this.constructor.name;
		if (typeof Error.captureStackTrace === "function") Error.captureStackTrace(this, this.constructor);
		else this.stack = new Error(message).stack;
	}
};
function handleError(error) {
	if (error instanceof PrettyError) consola$1.error(error.message);
	process.exitCode = 1;
}
//#endregion
//#region src/watcher.ts
let watcher;
async function getWatcher(options) {
	if (watcher && !options) return watcher;
	if (!options) return { close: () => {} };
	const { watch } = await import("chokidar");
	const ignored = ["**/{.git,node_modules}/**"];
	const cwd = (options === null || options === void 0 ? void 0 : options.cwd) || process.cwd();
	const newWatcher = watch((options === null || options === void 0 ? void 0 : options.patterns).map((p) => {
		const abs = resolve(cwd, p);
		if (abs.endsWith("/**/*")) return abs.slice(0, -5);
		return abs;
	}), {
		ignoreInitial: false,
		ignorePermissionErrors: true,
		ignored,
		usePolling: true,
		interval: 100
	});
	watcher = newWatcher;
	return newWatcher;
}
//#endregion
//#region src/index.ts
async function resolveOptions(options, userConfig) {
	var _options$patterns, _userConfig$cli;
	const resolvedOptions = {
		...options,
		entries: [],
		debug: options.debug || false
	};
	if ((_options$patterns = options.patterns) === null || _options$patterns === void 0 ? void 0 : _options$patterns.length) resolvedOptions.entries.push({
		patterns: options.patterns,
		outFile: options.outFile ?? resolve(options.cwd, "uno.css"),
		rewrite: (options.rewrite || options.writeTransformed) ?? false,
		splitCss: options.splitCss ?? true
	});
	const configEntries = toArray(((_userConfig$cli = userConfig.cli) === null || _userConfig$cli === void 0 ? void 0 : _userConfig$cli.entry) || []).map((entry) => ({
		...entry,
		rewrite: entry.rewrite !== void 0 ? entry.rewrite : (options.rewrite || options.writeTransformed) ?? false,
		splitCss: entry.splitCss !== void 0 ? entry.splitCss : options.splitCss ?? true
	}));
	resolvedOptions.entries.push(...configEntries);
	if (!resolvedOptions.entries.length) throw new PrettyError(`No glob patterns provided. Try ${cyan("unocss <path/to/**/*>")} or configure entries in ${cyan("uno.config")} file. See ${cyan("https://unocss.dev/integrations/cli#configurations")}`);
	if (resolvedOptions.writeTransformed) consola$1.warn(`--write-transformed is deprecated, please use ${yellow("--rewrite")} instead.`);
	return resolvedOptions;
}
async function initializeConfig(options) {
	const { cwd = process.cwd(), config: configPath, preset } = options;
	const ctx = createContext(configPath);
	if (!(await ctx.updateRoot(cwd)).sources.map(normalize).length) {
		const defaultPresets = {
			wind3: import("@unocss/preset-wind3").then((m) => m.default),
			wind4: import("@unocss/preset-wind4").then((m) => m.default)
		};
		if (preset && preset in defaultPresets) await ctx.uno.setConfig({
			presets: [await defaultPresets[preset]],
			transformers: [(await import("@unocss/transformer-directives").then((m) => m.default))()]
		});
	}
	return {
		ctx,
		config: ctx.uno.config
	};
}
async function parseEntries(options, cache) {
	const newCache = /* @__PURE__ */ new Map();
	for (const entry of options.entries) {
		const { outFile, rewrite } = entry;
		const files = await glob(entry.patterns, {
			cwd: options.cwd,
			absolute: true,
			expandDirectories: false
		});
		const cssFiles = files.filter((f) => f.endsWith(".css")).filter((f) => f !== resolve(options.cwd, outFile));
		const otherFiles = files.filter((f) => !f.endsWith(".css"));
		const singleKey = outFile.replace(/(\.css)?$/, "-merged.css");
		const addToCache = (file, code, key) => {
			const existing = newCache.get(key) || [];
			existing.push({
				id: file,
				code,
				rewrite
			});
			newCache.set(key, existing);
		};
		for (const file of otherFiles) addToCache(file, await promises.readFile(file, "utf-8"), outFile);
		for (const file of cssFiles) {
			const code = await promises.readFile(file, "utf-8");
			if (entry.splitCss === true) addToCache(file, code, outFile);
			else if (entry.splitCss === "single") addToCache(file, code, singleKey);
			else if (entry.splitCss === "multi") {
				const fileHash = hash(file);
				const currentOutFile = file.replace(/(\.css)?$/, `-${fileHash}.css`);
				addToCache(file, code, files.length > 1 ? currentOutFile : outFile);
			}
		}
	}
	cache.clear();
	for (const [key, value] of newCache) cache.set(key, value);
}
async function build(_options) {
	_options.cwd ?? (_options.cwd = process.cwd());
	/**
	* Cache of files to process
	*
	* key: output file path
	*
	* value: array of source files with their code
	*/
	const fileCache = /* @__PURE__ */ new Map();
	const configResult = await initializeConfig(_options);
	const options = await resolveOptions(_options, configResult.config);
	options.ctx = configResult.ctx;
	if (options.stdout && options.outFile) {
		consola$1.fatal(`Cannot use --stdout and --out-file at the same time`);
		return;
	}
	consola$1.log(green(`UnoCSS v${version}`));
	if (options.watch) consola$1.start(`UnoCSS in watch mode...`);
	else consola$1.start(`UnoCSS for production...`);
	await parseEntries(options, fileCache);
	if (fileCache.size === 0) {
		consola$1.warn("No files matched the provided patterns.");
		return;
	}
	if (!options.watch) return await generate(options);
	const debouncedBuild = debounce(async () => {
		generate(options).catch(handleError);
	}, 100);
	await startWatcher().catch(handleError);
	async function generate(options) {
		return Promise.all(Array.from(fileCache.entries()).map(([outFile, entries]) => generateSingle(options, outFile, entries)));
	}
	async function startWatcher() {
		if (!options.watch) return;
		const { ctx } = options;
		const watcher = await getWatcher(options);
		const watchedFiles = [...fileCache.values().flatMap((files) => files.map((f) => f.id)), ...ctx.getConfigFileList()];
		watcher.add(watchedFiles);
		watcher.on("all", async (type, file) => {
			const absolutePath = resolve(options.cwd, file);
			if (type === "addDir" || type === "unlinkDir") return;
			if (ctx.getConfigFileList().map(normalize).includes(absolutePath)) {
				await ctx.reloadConfig();
				const newOtions = await resolveOptions(_options, ctx.uno.config);
				Object.assign(options, newOtions);
				await parseEntries(options, fileCache);
				const configSources = ctx.getConfigFileList().map(normalize);
				if (configSources.length) watcher.add(configSources);
				if (type === "change") consola$1.info(`${cyan(basename(file))} changed, setting new config`);
				consola$1.info(`Watching for changes in ${[...options.entries.flatMap((i) => i.patterns), ...configSources].map(cyan).join(", ")}`);
			} else if (type === "change") {
				consola$1.log(`${green(type)} ${dim(file)}`);
				const content = await promises.readFile(absolutePath, "utf8");
				if (fileCache.keys().find((outfile) => outfile === absolutePath)) return;
				for (const [, files] of fileCache.entries()) {
					const fileEntry = files.find((f) => f.id === absolutePath);
					if (fileEntry) fileEntry.code = content;
				}
			} else if (type === "unlink") {
				consola$1.log(`${green(type)} ${dim(file)}`);
				for (const [, files] of fileCache.entries()) {
					const index = files.findIndex((f) => f.id === absolutePath);
					if (index !== -1) files.splice(index, 1);
				}
			} else if (type === "add") {
				consola$1.log(`${green(type)} ${dim(file)}`);
				await parseEntries(options, fileCache);
			}
			debouncedBuild();
		});
	}
}
async function transformFiles(ctx, sources) {
	const run = (sources, enforce) => Promise.all(sources.map((source) => new Promise((resolve) => {
		applyTransformers(ctx, source.transformedCode ?? source.code, source.id, enforce).then((transformsRes) => {
			resolve({
				...source,
				transformedCode: (transformsRes === null || transformsRes === void 0 ? void 0 : transformsRes.code) ?? source.transformedCode
			});
		});
	})));
	return await run(await run(await run(sources, "pre"), "default"), "post");
}
async function generateSingle(options, outFile, files) {
	const start = performance.now();
	const { ctx } = options;
	const transformedFiles = await transformFiles(ctx, files);
	const tokens = /* @__PURE__ */ new Set();
	const rewriter = [];
	const css = [];
	let matchedLen = 0;
	for (const file of transformedFiles) {
		const input = (file.transformedCode || file.code).replace(SKIP_COMMENT_RE, "");
		if (!input) continue;
		if (file.id.endsWith(".css")) css.push(process.env.CI || process.env.VITEST ? input : `/* Source: ${file.id} */\n${input}`.trim());
		else (await ctx.uno.generate(input, {
			preflights: false,
			minify: true,
			id: file.id
		})).matched.forEach((i) => tokens.add(i));
		if (file.rewrite && file.transformedCode) rewriter.push(promises.writeFile(file.id, file.transformedCode, "utf-8"));
	}
	await Promise.all(rewriter);
	if (tokens.size > 0) {
		const result = await ctx.uno.generate(tokens, {
			preflights: options.preflights,
			minify: options.minify
		});
		css.push(result.css);
		matchedLen = result.matched.size;
	}
	const finalCss = css.join("\n");
	if (options.stdout) {
		process.stdout.write(finalCss);
		return;
	}
	if (options.debug) debugDetailsTable(options, outFile, files);
	const outFileResolved = resolve(options.cwd, outFile);
	const dir = dirname(outFileResolved);
	if (!existsSync(dir)) await promises.mkdir(dir, { recursive: true });
	await promises.writeFile(outFileResolved, finalCss, "utf-8");
	if (!options.watch) {
		const duration = (performance.now() - start).toFixed(2);
		if (rewriter.length > 0) consola$1.success(`${rewriter.length} file${rewriter.length > 1 ? "s" : ""} rewritten in ${green(duration)}ms`);
		if (matchedLen > 0) consola$1.success(`${matchedLen} utilities generated to ${cyan(relative(process.cwd(), outFileResolved))} in ${green(duration)}ms\n`);
	}
}
//#endregion
export { handleError as n, version as r, build as t };
