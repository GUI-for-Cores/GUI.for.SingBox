import { t as toArray } from "./dist-DBY4ctBk.mjs";
import { createRequire } from "node:module";
import { basename, dirname, join } from "node:path";
import { readFile, unlink, writeFile } from "@quansync/fs";
import defu from "defu";
import { quansync } from "quansync/macro";
import { createConfigCoreLoader } from "unconfig-core";

export * from "unconfig-core"

//#region src/interop.ts
function interopDefault(mod) {
	if (mod == null || typeof mod !== "object" || !("default" in mod) || mod.default == null) return mod;
	const defaultValue = mod.default;
	if (typeof defaultValue !== "object") return defaultValue;
	for (const key in mod) try {
		if (key in defaultValue || key === "default" || mod[key] === defaultValue) continue;
		Object.defineProperty(defaultValue, key, {
			configurable: true,
			enumerable: true,
			get() {
				return mod[key];
			}
		});
	} catch {}
	return defaultValue;
}

//#endregion
//#region src/types.ts
const defaultExtensions = [
	"mts",
	"cts",
	"ts",
	"mjs",
	"cjs",
	"js",
	"json",
	""
];

//#endregion
//#region src/index.ts
const require = createRequire(import.meta.url);
const loadConfigFile = quansync(function* (filepath, source) {
	let config;
	let parser = source.parser || "auto";
	let bundleFilepath = filepath;
	let code;
	let dependencies;
	const read = quansync(function* () {
		if (code == null) code = yield readFile(filepath, "utf8");
		return code;
	});
	const importModule = quansync({
		sync: () => {
			const { createJiti } = require("jiti");
			const jiti = createJiti(import.meta.url, {
				fsCache: false,
				moduleCache: false,
				interopDefault: true
			});
			config = interopDefault(jiti(bundleFilepath));
			dependencies = Object.values(jiti.cache).map((i) => i.filename).filter(Boolean);
		},
		async: async () => {
			const { createJiti } = await import("jiti");
			const jiti = createJiti(import.meta.url, {
				fsCache: false,
				moduleCache: false,
				interopDefault: true
			});
			config = interopDefault(await jiti.import(bundleFilepath, { default: true }));
			dependencies = Object.values(jiti.cache).map((i) => i.filename).filter(Boolean);
		}
	});
	if (source.transform) {
		const transformed = yield source.transform(yield read(), filepath);
		if (transformed) {
			bundleFilepath = join(dirname(filepath), `__unconfig_${basename(filepath)}`);
			yield writeFile(bundleFilepath, transformed, "utf8");
			code = transformed;
		}
	}
	if (parser === "auto") try {
		config = JSON.parse(yield read());
		parser = "json";
	} catch {
		parser = "import";
	}
	try {
		if (!config) {
			if (typeof parser === "function") config = yield parser(filepath);
			else if (parser === "import") yield importModule();
			else if (parser === "json") config = JSON.parse(yield read());
		}
		if (!config) return;
		const rewritten = source.rewrite ? yield source.rewrite(config, filepath) : config;
		if (!rewritten) return void 0;
		return [rewritten, dependencies];
	} finally {
		if (bundleFilepath !== filepath) try {
			yield unlink(bundleFilepath);
		} catch {}
	}
});
function createConfigLoader(options) {
	const { merge, defaults, sources, ...coreOptions } = options;
	const coreSources = toArray(sources || []).map((source) => {
		return {
			...source,
			files: toArray(source.files),
			extensions: source.extensions || defaultExtensions,
			parser: (filepath) => loadConfigFile(filepath, source)
		};
	});
	const core = createConfigCoreLoader({
		...coreOptions,
		multiple: merge,
		sources: coreSources
	});
	return {
		load: quansync(function* (force = false) {
			const results = yield core.load(force);
			if (!results.length) return {
				config: defaults,
				sources: []
			};
			if (!merge) return {
				config: results[0].config[0],
				sources: [results[0].source],
				dependencies: results[0].config[1]
			};
			return {
				config: applyDefaults(...results.map((i) => i.config[0]), defaults),
				sources: results.map((i) => i.source),
				dependencies: results.flatMap((i) => i.config[1] || [])
			};
		}),
		findConfigs: core.findConfigs
	};
}
function applyDefaults(...args) {
	return defu(...args.map((i) => ({ config: i }))).config;
}
const loadConfig = quansync(function* (options) {
	return createConfigLoader(options).load();
});
const loadConfigSync = loadConfig.sync;

//#endregion
export { createConfigLoader, defaultExtensions, loadConfig, loadConfigSync };