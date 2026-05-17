import process from "node:process";
import { createRecoveryConfigLoader } from "@unocss/config";
import { BetterMap, LAYER_IMPORTS, LAYER_PREFLIGHTS, createGenerator, cssIdRE, notNull, toEscapedSelector } from "@unocss/core";
import { createFilter } from "unplugin-utils";
import UnocssInspector from "@unocss/inspector";
import fs from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import fs$1 from "node:fs/promises";
import { glob } from "tinyglobby";
import remapping from "@jridgewell/remapping";
import MagicString from "magic-string";
import { resolve as resolve$1 } from "pathe";
import crypto from "node:crypto";
import { Buffer } from "node:buffer";
const CSS_PLACEHOLDER = "@unocss-placeholder";
const SKIP_START_COMMENT = "@unocss-skip-start";
const SKIP_END_COMMENT = "@unocss-skip-end";
const SKIP_COMMENT_RE = new RegExp(`(\/\/\\s*?${SKIP_START_COMMENT}\\s*?|\\/\\*\\s*?${SKIP_START_COMMENT}\\s*?\\*\\/|<!--\\s*?${SKIP_START_COMMENT}\\s*?-->)[\\s\\S]*?(\/\/\\s*?${SKIP_END_COMMENT}\\s*?|\\/\\*\\s*?${SKIP_END_COMMENT}\\s*?\\*\\/|<!--\\s*?${SKIP_END_COMMENT}\\s*?-->)`, "g");
const VIRTUAL_ENTRY_ALIAS = [/^(?:virtual:)?uno(?::(.+))?\.css(\?.*)?$/];
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
		await _uno;
		const result = await loadConfig(root, configOrPath, extraConfigSources, defaults);
		resolveConfigResult(result);
		result.config;
		rawConfig = result.config;
		configFileList = result.sources;
		await uno.setConfig(rawConfig);
		uno.config.envMode = "dev";
		rollupFilter = rawConfig.content?.pipeline === false ? () => false : createFilter(rawConfig.content?.pipeline?.include || defaultPipelineInclude, rawConfig.content?.pipeline?.exclude || defaultPipelineExclude, { resolve: typeof configOrPath === "string" ? configOrPath : root });
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
//#region src/config-hmr.ts
function ConfigHMRPlugin(ctx) {
	const { ready } = ctx;
	return {
		name: "unocss:config",
		async configResolved(config) {
			await ctx.updateRoot(config.root);
		},
		async configureServer(server) {
			const { sources } = await ready;
			ctx.uno.config.envMode = "dev";
			if (!sources.length) return;
			server.watcher.add(sources);
			server.watcher.on("change", async (p) => {
				if (!sources.includes(p)) return;
				await ctx.reloadConfig();
				server.ws.send({
					type: "custom",
					event: "unocss:config-changed"
				});
			});
		}
	};
}
//#endregion
//#region src/devtool.ts
const _dirname = typeof __dirname !== "undefined" ? __dirname : dirname(fileURLToPath(import.meta.url));
const DEVTOOLS_MODULE_ID = "virtual:unocss-devtools";
const MOCK_CLASSES_MODULE_ID = "virtual:unocss-mock-classes";
const MOCK_CLASSES_PATH = "/@unocss/mock-classes";
const DEVTOOLS_PATH = "/@unocss/devtools";
const DEVTOOLS_CSS_PATH = "/@unocss/devtools.css";
const devtoolCss = /* @__PURE__ */ new Set();
const MODULES_MAP = {
	[DEVTOOLS_MODULE_ID]: DEVTOOLS_PATH,
	[MOCK_CLASSES_MODULE_ID]: MOCK_CLASSES_PATH
};
const BASE_POST_PATH = "/@unocss-devtools-update";
function getBodyJson(req) {
	return new Promise((resolve, reject) => {
		let body = "";
		req.on("data", (chunk) => body += chunk);
		req.on("error", reject);
		req.on("end", () => {
			try {
				resolve(JSON.parse(body) || {});
			} catch (e) {
				reject(e);
			}
		});
	});
}
function createDevtoolsPlugin(ctx, pluginConfig) {
	let config;
	let server;
	let clientCode = "";
	let devtoolTimer;
	let lastUpdate = Date.now();
	let postPath = BASE_POST_PATH;
	function toClass(name) {
		return `${toEscapedSelector(name)}{}`;
	}
	function updateDevtoolClass() {
		clearTimeout(devtoolTimer);
		devtoolTimer = setTimeout(() => {
			lastUpdate = Date.now();
			if (!server) return;
			const mod = server.moduleGraph.getModuleById(DEVTOOLS_CSS_PATH);
			if (!mod) return;
			server.moduleGraph.invalidateModule(mod);
			server.ws.send({
				type: "update",
				updates: [{
					acceptedPath: DEVTOOLS_CSS_PATH,
					path: DEVTOOLS_CSS_PATH,
					timestamp: lastUpdate,
					type: "js-update"
				}]
			});
		}, 100);
	}
	async function getMockClassesInjector() {
		const suggest = Object.keys(ctx.uno.config.rulesStaticMap);
		const comment = "/* unocss CSS mock class names for devtools auto-completion */\n";
		const css = suggest.map(toClass).join("");
		return `
  const style = document.createElement('style')
  style.setAttribute('type', 'text/css')
  style.innerHTML = ${JSON.stringify(comment + css)}
  document.head.prepend(style)
  `;
	}
	return [{
		name: "unocss:devtools",
		configResolved(_config) {
			config = _config;
			postPath = `${config.base?.replace(/\/$/, "") ?? ""}${BASE_POST_PATH}`;
		},
		configureServer(_server) {
			server = _server;
			server.middlewares.use(async (req, res, next) => {
				if (req.url !== postPath) return next();
				try {
					const data = await getBodyJson(req);
					const type = data?.type;
					let changed = false;
					switch (type) {
						case "add-classes":
							data.data.forEach((key) => {
								if (!devtoolCss.has(key)) {
									devtoolCss.add(key);
									changed = true;
								}
							});
							if (changed) updateDevtoolClass();
					}
					res.statusCode = 200;
				} catch (e) {
					console.error(e);
					res.statusCode = 500;
				}
				res.end();
			});
		},
		resolveId(id) {
			if (id === DEVTOOLS_CSS_PATH) return DEVTOOLS_CSS_PATH;
			return MODULES_MAP[id];
		},
		async load(id) {
			if (id === DEVTOOLS_PATH) {
				if (!clientCode) clientCode = [
					await fs.promises.readFile(resolve(_dirname, "client.mjs"), "utf-8"),
					`import('${MOCK_CLASSES_MODULE_ID}')`,
					`import('${DEVTOOLS_CSS_PATH}')`
				].join("\n").replace("__POST_PATH__", `${config.server?.origin ?? ""}${postPath}`).replace("__POST_FETCH_MODE__", pluginConfig.fetchMode ?? "cors");
				return config.command === "build" ? "" : clientCode;
			} else if (id === MOCK_CLASSES_PATH) return await getMockClassesInjector();
			else if (id === DEVTOOLS_CSS_PATH) {
				const { css } = await ctx.uno.generate(devtoolCss);
				return css;
			}
		}
	}];
}
//#endregion
//#region src/modes/chunk-build.ts
function ChunkModeBuildPlugin(ctx) {
	let cssPlugin;
	const files = {};
	return {
		name: "unocss:chunk",
		apply: "build",
		enforce: "pre",
		configResolved(config) {
			cssPlugin = config.plugins.find((i) => i.name === "vite:css-post");
		},
		async transform(code, id) {
			await ctx.ready;
			if (!ctx.filter(code, id)) return;
			files[id] = code;
			return null;
		},
		async renderChunk(_, chunk) {
			const chunks = Object.keys(chunk.modules).map((i) => files[i]).filter(Boolean);
			if (!chunks.length) return null;
			await ctx.ready;
			const tokens = /* @__PURE__ */ new Set();
			await Promise.all(chunks.map((c) => ctx.uno.applyExtractors(c, void 0, tokens)));
			const { css } = await ctx.uno.generate(tokens);
			const cssPostTransformHandler = "handler" in cssPlugin.transform ? cssPlugin.transform.handler : cssPlugin.transform;
			const fakeCssId = `${chunk.fileName}.css`;
			await cssPostTransformHandler.call(this, css, fakeCssId);
			chunk.modules[fakeCssId] = {
				code: null,
				originalLength: 0,
				removedExports: [],
				renderedExports: [],
				renderedLength: 0
			};
			return null;
		},
		async transformIndexHtml(code) {
			await ctx.ready;
			const { css } = await ctx.uno.generate(code);
			if (css) return `${code}<style>${css}</style>`;
		}
	};
}
//#endregion
//#region ../../virtual-shared/integration/src/utils.ts
function getPath(id) {
	return id.replace(/\?.*$/, "");
}
function hash$1(str) {
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
		const withHashKey = `${keyFlag}${hash$1(matched)}`;
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
//#region ../../virtual-shared/integration/src/content.ts
async function setupContentExtractor(ctx, shouldWatch = false) {
	const { content } = await ctx.getConfig();
	const { extract, tasks, root, filter } = ctx;
	if (content?.inline) await Promise.all(content.inline.map(async (c, idx) => {
		if (typeof c === "function") c = await c();
		if (typeof c === "string") c = { code: c };
		return extract(c.code, c.id ?? `__plain_content_${idx}__`);
	}));
	if (content?.filesystem) {
		const files = await glob(content.filesystem, {
			cwd: root,
			expandDirectories: false
		});
		async function extractFile(file) {
			file = isAbsolute(file) ? file : resolve(root, file);
			const code = await fs$1.readFile(file, "utf-8");
			if (!filter(code, file)) return;
			const preTransform = await applyTransformers(ctx, code, file, "pre");
			await applyTransformers(ctx, (await applyTransformers(ctx, preTransform?.code || code, file))?.code || preTransform?.code || code, file, "post");
			return await extract(preTransform?.code || code, file);
		}
		if (shouldWatch) {
			const { watch } = await import("chokidar");
			watch(files, {
				ignorePermissionErrors: true,
				ignored: ["**/{.git,node_modules}/**"],
				cwd: root,
				ignoreInitial: true
			}).on("all", (type, file) => {
				if (type === "add" || type === "change") {
					const absolutePath = resolve(root, file);
					tasks.push(extractFile(absolutePath));
				}
			});
		}
		await Promise.all(files.map(extractFile));
	}
}
//#endregion
//#region ../../virtual-shared/integration/src/layers.ts
async function resolveId(ctx, id, importer) {
	const { RESOLVED_ID_WITH_QUERY_RE, prefix } = await ctx.getVMPRegexes();
	if (id.match(RESOLVED_ID_WITH_QUERY_RE)) return id;
	for (const alias of VIRTUAL_ENTRY_ALIAS) {
		const match = id.match(alias);
		if (match) {
			let virtual = match[1] ? `${prefix}_${match[1]}.css` : `${prefix}.css`;
			virtual += match[2] || "";
			if (importer) virtual = resolve$1(importer, "..", virtual);
			else virtual = `/${virtual}`;
			return virtual;
		}
	}
}
async function resolveLayer(ctx, id) {
	const { RESOLVED_ID_RE } = await ctx.getVMPRegexes();
	const match = id.match(RESOLVED_ID_RE);
	if (match) return match[1] || "__ALL__";
}
function getLayerPlaceholder(layer) {
	return `#--unocss--{layer:${layer};escape-view:\\"\\'\\\`\\\\}`;
}
//#endregion
//#region src/modes/global/shared.ts
const MESSAGE_UNOCSS_ENTRY_NOT_FOUND = "[unocss] Entry module not found. Did you add `import 'uno.css'` in your main entry?";
//#endregion
//#region src/modes/global/build.ts
function GlobalModeBuildPlugin(ctx) {
	const { ready, extract, tokens, filter, getConfig, tasks, flushTasks } = ctx;
	const vfsLayers = /* @__PURE__ */ new Map();
	const resolveContexts = /* @__PURE__ */ new Map();
	const unocssImporters = /* @__PURE__ */ new Set();
	let viteConfig;
	const cssPostPlugins = /* @__PURE__ */ new Map();
	const cssPlugins = /* @__PURE__ */ new Map();
	async function applyCssTransform(css, id, dir, ctx) {
		const { postcss = true } = await getConfig();
		if (!cssPlugins.get(dir) || !postcss) return css;
		const cssPlugin = cssPlugins.get(dir);
		const result = await ("handler" in cssPlugin.transform ? cssPlugin.transform.handler : cssPlugin.transform).call(ctx, css, id);
		if (!result) return css;
		if (typeof result === "string") css = result;
		else if (result.code) css = result.code.toString();
		css = css.replace(/[\n\r]/g, "");
		return css;
	}
	let lastTokenSize = 0;
	let lastResult;
	async function generateAll() {
		await flushTasks();
		if (lastResult && lastTokenSize === tokens.size) return lastResult;
		lastResult = await ctx.uno.generate(tokens, { minify: true });
		lastTokenSize = tokens.size;
		return lastResult;
	}
	const cssContentCache = /* @__PURE__ */ new Map();
	return [
		{
			name: "unocss:global:build:scan",
			apply: "build",
			enforce: "pre",
			async buildStart() {
				vfsLayers.clear();
				cssContentCache.clear();
				tasks.length = 0;
				lastTokenSize = 0;
				lastResult = void 0;
			},
			transform(code, id) {
				if (filter(code, id)) tasks.push(extract(code, id));
				return null;
			},
			transformIndexHtml: {
				order: "pre",
				handler(code, { filename }) {
					tasks.push(extract(code, filename));
				},
				enforce: "pre",
				transform(code, { filename }) {
					tasks.push(extract(code, filename));
				}
			},
			async resolveId(id, importer) {
				const entry = await resolveId(ctx, id, importer);
				if (entry) {
					const layer = await resolveLayer(ctx, entry);
					if (layer) {
						if (importer) unocssImporters.add(importer);
						if (vfsLayers.has(layer)) {
							this.warn(`[unocss] ${JSON.stringify(id)} is being imported multiple times in different files, using the first occurrence: ${JSON.stringify(vfsLayers.get(layer))}`);
							return vfsLayers.get(layer);
						}
						vfsLayers.set(layer, entry);
						resolveContexts.set(layer, this);
					}
					return entry;
				}
			},
			async load(id) {
				const layer = await resolveLayer(ctx, getPath(id));
				if (layer) {
					if (!vfsLayers.has(layer)) this.error(`[unocss] layer ${JSON.stringify(id)} is imported but not being resolved before, it might be an internal bug of UnoCSS`);
					return {
						code: getLayerPlaceholder(layer),
						map: null,
						moduleSideEffects: true
					};
				}
			},
			shouldTransformCachedModule({ id }) {
				return unocssImporters.delete(id);
			},
			async configResolved(config) {
				const distDirs = [resolve(config.root, config.build.outDir)];
				if (config.build.rollupOptions.output) {
					const outputOptions = config.build.rollupOptions.output;
					(Array.isArray(outputOptions) ? outputOptions.map((option) => option.dir).filter(Boolean) : outputOptions.dir ? [outputOptions.dir] : []).forEach((dir) => {
						distDirs.push(dir);
						if (!isAbsolute(dir)) distDirs.push(resolve(config.root, dir));
					});
				}
				const cssPostPlugin = config.plugins.find((i) => i.name === "vite:css-post");
				const cssPlugin = config.plugins.find((i) => i.name === "vite:css");
				if (cssPostPlugin) distDirs.forEach((dir) => cssPostPlugins.set(dir, cssPostPlugin));
				if (cssPlugin) distDirs.forEach((dir) => cssPlugins.set(dir, cssPlugin));
				await ready;
			}
		},
		{
			name: "unocss:global:content",
			enforce: "pre",
			configResolved(config) {
				viteConfig = config;
			},
			buildStart() {
				tasks.push(setupContentExtractor(ctx, viteConfig.mode !== "test" && viteConfig.command === "serve"));
			}
		},
		{
			name: "unocss:global:build:generate",
			apply: "build",
			async renderChunk(_, chunk, options) {
				const { RESOLVED_ID_RE } = await ctx.getVMPRegexes();
				const entryModules = Object.keys(chunk.modules).filter((id) => RESOLVED_ID_RE.test(id));
				if (!entryModules.length) return null;
				const cssPost = cssPostPlugins.get(options.dir);
				if (!cssPost) {
					this.warn("[unocss] failed to find vite:css-post plugin. It might be an internal bug of UnoCSS");
					return null;
				}
				const cssPostTransformHandler = "handler" in cssPost.transform ? cssPost.transform.handler : cssPost.transform;
				const result = await generateAll();
				const fakeCssId = `${viteConfig.root}/${chunk.fileName}-unocss-hash.css`;
				const preflightLayers = ctx.uno.config.preflights?.map((i) => i.layer).concat(LAYER_PREFLIGHTS).filter(Boolean);
				await Promise.all(preflightLayers.map((i) => result.setLayer(i, async (layerContent) => {
					const preTransform = await applyTransformers(ctx, layerContent, fakeCssId, "pre");
					const defaultTransform = await applyTransformers(ctx, preTransform?.code || layerContent, fakeCssId);
					return (await applyTransformers(ctx, defaultTransform?.code || preTransform?.code || layerContent, fakeCssId, "post"))?.code || defaultTransform?.code || preTransform?.code || layerContent;
				})));
				for (const mod of entryModules) {
					const layer = RESOLVED_ID_RE.exec(mod)?.[1] || "__ALL__";
					const css = await applyCssTransform(layer === "__ALL__" ? result.getLayers(void 0, [LAYER_IMPORTS, ...vfsLayers.keys()]) : result.getLayer(layer) || "", mod, options.dir, resolveContexts.get(layer) || this);
					await cssPostTransformHandler.call(this, css, mod);
				}
			},
			async buildEnd() {
				if (!vfsLayers.size) {
					if ((await getConfig()).checkImport) this.warn(MESSAGE_UNOCSS_ENTRY_NOT_FOUND);
				}
			}
		}
	];
}
//#endregion
//#region ../../virtual-shared/integration/src/hash.ts
const hash = crypto.hash ?? ((algorithm, data, outputEncoding) => crypto.createHash(algorithm).update(data).digest(outputEncoding));
function getHash(input, length = 8) {
	return hash("sha256", input, "hex").substring(0, length);
}
//#endregion
//#region src/modes/global/dev.ts
const WARN_TIMEOUT = 2e4;
const WS_EVENT_PREFIX = "unocss:hmr";
const HASH_LENGTH = 6;
function GlobalModeDevPlugin(ctx) {
	const { tokens, tasks, flushTasks, affectedModules, onInvalidate, extract, filter, getConfig } = ctx;
	const servers = [];
	const entries = /* @__PURE__ */ new Set();
	let invalidateTimer;
	const lastServedHash = /* @__PURE__ */ new Map();
	let lastServedTime = Date.now();
	let resolved = false;
	let resolvedWarnTimer;
	async function generateCSS(layer) {
		await flushTasks();
		let result;
		let tokensSize = tokens.size;
		do {
			result = await ctx.uno.generate(tokens);
			if (tokensSize === tokens.size) break;
			tokensSize = tokens.size;
		} while (true);
		const css = layer === "__ALL__" ? result.getLayers(void 0, await Promise.all(Array.from(entries).map((i) => resolveLayer(ctx, i))).then((layers) => layers.filter((i) => !!i))) : result.getLayer(layer);
		const hash = getHash(css || "", HASH_LENGTH);
		lastServedHash.set(layer, hash);
		lastServedTime = Date.now();
		return {
			hash,
			css
		};
	}
	function invalidate(timer = 10, ids = entries) {
		for (const server of servers) for (const id of ids) {
			const mod = server.moduleGraph.getModuleById(id);
			if (!mod) continue;
			server.moduleGraph.invalidateModule(mod);
		}
		clearTimeout(invalidateTimer);
		invalidateTimer = setTimeout(() => {
			lastServedHash.clear();
			sendUpdate(ids);
		}, timer);
	}
	function sendUpdate(ids) {
		for (const server of servers) server.ws.send({
			type: "update",
			updates: Array.from(ids).map((id) => {
				const mod = server.moduleGraph.getModuleById(id);
				if (!mod) return null;
				return {
					acceptedPath: mod.url,
					path: mod.url,
					timestamp: lastServedTime,
					type: "js-update"
				};
			}).filter(notNull)
		});
	}
	async function setWarnTimer() {
		if (!resolved && !resolvedWarnTimer && (await getConfig()).checkImport) resolvedWarnTimer = setTimeout(() => {
			if (process.env.TEST || process.env.NODE_ENV === "test") return;
			if (!resolved) {
				console.warn(MESSAGE_UNOCSS_ENTRY_NOT_FOUND);
				servers.forEach(({ ws }) => ws.send({
					type: "error",
					err: {
						message: MESSAGE_UNOCSS_ENTRY_NOT_FOUND,
						stack: ""
					}
				}));
			}
		}, WARN_TIMEOUT);
	}
	function clearWarnTimer() {
		if (resolvedWarnTimer) {
			clearTimeout(resolvedWarnTimer);
			resolvedWarnTimer = void 0;
		}
	}
	onInvalidate(() => {
		invalidate(10, new Set([...entries, ...affectedModules]));
	});
	return [{
		name: "unocss:global",
		apply: "serve",
		enforce: "pre",
		async configureServer(_server) {
			servers.push(_server);
			_server.ws.on(WS_EVENT_PREFIX, async ([layer]) => {
				const preHash = lastServedHash.get(layer);
				await generateCSS(layer);
				if (lastServedHash.get(layer) !== preHash) sendUpdate(entries);
			});
		},
		buildStart() {
			ctx.uno.generate([], { preflights: true });
		},
		transform(code, id) {
			if (filter(code, id)) tasks.push(extract(code, id));
			return null;
		},
		transformIndexHtml: {
			order: "pre",
			handler(code, { filename }) {
				setWarnTimer();
				tasks.push(extract(code, filename));
			},
			enforce: "pre",
			transform(code, { filename }) {
				setWarnTimer();
				tasks.push(extract(code, filename));
			}
		},
		async resolveId(id) {
			const entry = await resolveId(ctx, id);
			if (entry) {
				resolved = true;
				clearWarnTimer();
				entries.add(entry);
				return entry;
			}
		},
		async load(id) {
			const layer = await resolveLayer(ctx, getPath(id));
			if (!layer) return null;
			const { hash, css } = await generateCSS(layer);
			return {
				code: `${css}__uno_hash_${hash}{--:'';}`,
				map: { mappings: "" }
			};
		},
		closeBundle() {
			clearWarnTimer();
		}
	}, {
		name: "unocss:global:post",
		apply(config, env) {
			return env.command === "serve" && !config.build?.ssr;
		},
		enforce: "post",
		async transform(code, id) {
			const layer = await resolveLayer(ctx, getPath(id));
			if (layer && code.includes("import.meta.hot")) {
				let hmr = `
try {
  let hash = __vite__css.match(/__uno_hash_(\\w{${HASH_LENGTH}})/)
  hash = hash && hash[1]
  if (!hash)
    console.warn('[unocss-hmr]', 'failed to get unocss hash, hmr might not work')
  else
    await import.meta.hot.send('${WS_EVENT_PREFIX}', ['${layer}']);
} catch (e) {
  console.warn('[unocss-hmr]', e)
}
if (!import.meta.url.includes('?'))
  await new Promise(resolve => setTimeout(resolve, 100))`;
				if ((await getConfig()).hmrTopLevelAwait === false) hmr = `;(async function() {${hmr}\n})()`;
				hmr = `\nif (import.meta.hot) {${hmr}}`;
				const s = new MagicString(code);
				s.append(hmr);
				return {
					code: s.toString(),
					map: s.generateMap()
				};
			}
		}
	}];
}
//#endregion
//#region src/modes/global/index.ts
function GlobalModePlugin(ctx) {
	return [...GlobalModeBuildPlugin(ctx), ...GlobalModeDevPlugin(ctx)];
}
//#endregion
//#region src/modes/per-module.ts
const VIRTUAL_PREFIX = "/@unocss/";
const SCOPE_IMPORT_RE = / from (['"])(@unocss\/scope)\1/;
function PerModuleModePlugin(ctx) {
	const moduleMap = /* @__PURE__ */ new Map();
	let server;
	const invalidate = (hash) => {
		if (!server) return;
		const id = `${VIRTUAL_PREFIX}${hash}.css`;
		const mod = server.moduleGraph.getModuleById(id);
		if (!mod) return;
		server.moduleGraph.invalidateModule(mod);
		server.ws.send({
			type: "update",
			updates: [{
				acceptedPath: id,
				path: id,
				timestamp: +Date.now(),
				type: "js-update"
			}]
		});
	};
	return [{
		name: "unocss:module-scope:pre",
		enforce: "pre",
		async resolveId(id) {
			const entry = await resolveId(ctx, id);
			if (entry) return entry;
		},
		async load(id) {
			if (!await resolveLayer(ctx, getPath(id))) return null;
			await ctx.ready;
			const { css } = await ctx.uno.generate("", { preflights: true });
			if (!css) return null;
			return {
				code: css,
				map: null
			};
		},
		async transform(code, id) {
			await ctx.ready;
			if (!ctx.filter(code, id)) return;
			const hash = getHash(id);
			const hasScope = SCOPE_IMPORT_RE.test(code);
			const { css } = await ctx.uno.generate(code, {
				id,
				scope: hasScope ? `.${hash}` : void 0,
				preflights: false
			});
			if (!css && !hasScope) return null;
			if (hasScope) code = code.replace(SCOPE_IMPORT_RE, ` from 'data:text/javascript;base64,${Buffer.from(`export default () => "${hash}"`).toString("base64")}'`);
			moduleMap.set(hash, [id, css]);
			invalidate(hash);
			return null;
		}
	}, {
		name: "unocss:module-scope",
		enforce: "post",
		configureServer(_server) {
			server = _server;
		},
		async transform(code, id) {
			await ctx.ready;
			if (!ctx.filter(code, id)) return;
			const hash = getHash(id);
			invalidate(hash);
			if ((moduleMap.get(hash) || []).length) return {
				code: `import "${VIRTUAL_PREFIX}${hash}.css";${code}`,
				map: null
			};
		},
		resolveId(id) {
			return id.startsWith(VIRTUAL_PREFIX) ? id : null;
		},
		load(id) {
			if (!id.startsWith(VIRTUAL_PREFIX)) return null;
			const hash = id.slice(9, -4);
			const [source, css] = moduleMap.get(hash) || [];
			if (source) this.addWatchFile(source);
			return `\n/* unocss ${source} */\n${css}`;
		}
	}];
}
//#endregion
//#region src/modes/shadow-dom.ts
function ShadowDomModuleModePlugin(ctx) {
	const partExtractorRegex = /^part-\[(.+)\]:/;
	const nameRegexp = /<([^\s^!>]+)\s*([^>]*)>/;
	const vueSFCStyleRE = /<style[^>]*>[\s\S]*@unocss-placeholder[\s\S]*<\/style>/;
	const checkElement = (useParts, idxResolver, element) => {
		if (!element) return null;
		const applyParts = useParts.filter((p) => element[2].includes(p.rule));
		if (applyParts.length === 0) return null;
		const name = element[1];
		const idx = idxResolver(name);
		return {
			name,
			entries: applyParts.map(({ rule, part }) => [`.${rule.replace(/[:[\]]/g, "\\$&")}::part(${part})`, `${name}:nth-of-type(${idx})::part(${part})`])
		};
	};
	const idxMapFactory = () => {
		const elementIdxMap = /* @__PURE__ */ new Map();
		return {
			idxResolver: (name) => {
				let idx = elementIdxMap.get(name);
				if (!idx) {
					idx = 1;
					elementIdxMap.set(name, idx);
				}
				return idx;
			},
			incrementIdx: (name) => {
				elementIdxMap.set(name, elementIdxMap.get(name) + 1);
			}
		};
	};
	const transformWebComponent = async (code, id) => {
		if (!code.match("@unocss-placeholder")) return code;
		await ctx.ready;
		let { css, matched } = await ctx.uno.generate(code, {
			preflights: true,
			safelist: true
		});
		if (css && matched) {
			const useParts = Array.from(matched).reduce((acc, rule) => {
				const matcher = rule.match(partExtractorRegex);
				if (matcher) acc.push({
					part: matcher[1],
					rule
				});
				return acc;
			}, new Array());
			if (useParts.length > 0) {
				let useCode = code;
				let element;
				const partsToApply = /* @__PURE__ */ new Map();
				const { idxResolver, incrementIdx } = idxMapFactory();
				while (element = nameRegexp.exec(useCode)) {
					const result = checkElement(useParts, idxResolver, element);
					if (result) {
						result.entries.forEach(([name, replacement]) => {
							let list = partsToApply.get(name);
							if (!list) {
								list = [];
								partsToApply.set(name, list);
							}
							list.push(replacement);
						});
						incrementIdx(result.name);
					}
					useCode = useCode.slice(element[0].length + 1);
				}
				if (partsToApply.size > 0) css = Array.from(partsToApply.entries()).reduce((k, [r, name]) => {
					return k.replace(r, name.join(",\n"));
				}, css);
			}
		}
		if (id.includes("?vue&type=style") || id.endsWith(".vue") && vueSFCStyleRE.test(code)) return code.replace(new RegExp(`(\\/\\*\\s*)?${CSS_PLACEHOLDER}(\\s*\\*\\/)?`), css || "");
		return code.replace(CSS_PLACEHOLDER, css?.replace(/\\/g, "\\\\")?.replace(/`/g, "\\`") ?? "");
	};
	return {
		name: "unocss:shadow-dom",
		enforce: "pre",
		async transform(code, id) {
			return {
				code: await transformWebComponent(code, id),
				map: null
			};
		},
		handleHotUpdate(ctx) {
			const read = ctx.read;
			ctx.read = async () => {
				return await transformWebComponent(await read(), ctx.file);
			};
		}
	};
}
//#endregion
//#region src/modes/vue-scoped.ts
function VueScopedPlugin(ctx) {
	let filter = createFilter([/\.vue$/], defaultPipelineExclude);
	async function transformSFC(code) {
		await ctx.ready;
		const { css } = await ctx.uno.generate(code);
		if (!css) return null;
		return `${code}\n<style scoped>${css}</style>`;
	}
	return {
		name: "unocss:vue-scoped",
		enforce: "pre",
		async configResolved() {
			const { config } = await ctx.ready;
			filter = config.content?.pipeline === false ? () => false : createFilter(config.content?.pipeline?.include ?? [/\.vue$/], config.content?.pipeline?.exclude ?? defaultPipelineExclude);
		},
		async transform(code, id) {
			if (!filter(id) || !id.endsWith(".vue")) return;
			const css = await transformSFC(code);
			if (css) return {
				code: css,
				map: null
			};
		},
		handleHotUpdate(ctx) {
			const read = ctx.read;
			if (filter(ctx.file)) ctx.read = async () => {
				const code = await read();
				return await transformSFC(code) || code;
			};
		}
	};
}
//#endregion
//#region src/transformers.ts
function createTransformerPlugins(ctx) {
	return [
		"default",
		"pre",
		"post"
	].map((_order) => {
		const order = _order === "default" ? void 0 : _order;
		const htmlHandler = (code) => {
			return applyTransformers(ctx, code, "index.html", order).then((t) => t?.code);
		};
		return {
			name: `unocss:transformers:${_order}`,
			enforce: order,
			transform(code, id) {
				return applyTransformers(ctx, code, id, order);
			},
			transformIndexHtml: {
				order,
				handler: htmlHandler,
				enforce: order,
				transform: htmlHandler
			}
		};
	});
}
//#endregion
//#region src/index.ts
function defineConfig(config) {
	return config;
}
function UnocssPlugin(configOrPath, defaults = {}) {
	const ctx = createContext(configOrPath, {
		envMode: process.env.NODE_ENV === "development" ? "dev" : "build",
		...defaults,
		legacy: typeof configOrPath !== "string" ? configOrPath?.legacy || { renderModernChunks: true } : { renderModernChunks: true }
	});
	const inlineConfig = configOrPath && typeof configOrPath !== "string" ? configOrPath : {};
	const mode = inlineConfig.mode ?? "global";
	const plugins = [
		ConfigHMRPlugin(ctx),
		...createTransformerPlugins(ctx),
		...createDevtoolsPlugin(ctx, inlineConfig),
		{
			name: "unocss:api",
			api: {
				getContext: () => ctx,
				getMode: () => mode
			}
		}
	];
	if (inlineConfig.inspector !== false) plugins.push(UnocssInspector(ctx));
	if (mode === "per-module") plugins.push(...PerModuleModePlugin(ctx));
	else if (mode === "vue-scoped") plugins.push(VueScopedPlugin(ctx));
	else if (mode === "svelte-scoped") throw new Error("[unocss] svelte-scoped mode is now its own package, please use @unocss/svelte-scoped according to the docs");
	else if (mode === "shadow-dom") plugins.push(ShadowDomModuleModePlugin(ctx));
	else if (mode === "global") plugins.push(...GlobalModePlugin(ctx));
	else if (mode === "dist-chunk") plugins.push(ChunkModeBuildPlugin(ctx), ...GlobalModeDevPlugin(ctx));
	else throw new Error(`[unocss] unknown mode "${mode}"`);
	return plugins.filter(Boolean);
}
//#endregion
export { ChunkModeBuildPlugin, GlobalModeBuildPlugin, GlobalModeDevPlugin, GlobalModePlugin, PerModuleModePlugin, VueScopedPlugin, UnocssPlugin as default, defineConfig };
