import { t as toArray } from "./dist-DBY4ctBk.mjs";
import { quansync } from "quansync/macro";

//#region src/presets.ts
/**
* Rewrite the config file and extract the options passed to plugin factory
* (e.g. Vite and Rollup plugins)
*/
function sourcePluginFactory(options) {
	const targetModulePattern = new RegExp(`import (.+?) from (['"])${options.targetModule}\\2`);
	return {
		...options,
		transform: (source) => {
			if (!targetModulePattern.test(source)) return "export default undefined;";
			const prefix = `
let __unconfig_data;
let __unconfig_stub = function (data = {}) { __unconfig_data = data };
__unconfig_stub.default = (data = {}) => { __unconfig_data = data };
`;
			const suffix = "export default __unconfig_data;";
			let code = source.replace(targetModulePattern, "const $1 = __unconfig_stub;").replace("export default", "const __unconfig_default = ");
			if (code.includes("__unconfig_default")) code += `\nif (typeof __unconfig_default === "function") __unconfig_default(...${JSON.stringify(options.parameters || [])});`;
			return `${prefix}${code}${suffix}`;
		}
	};
}
function sourceVitePluginConfig(options) {
	const plugins = toArray(options.plugins);
	return {
		files: ["vite.config"],
		rewrite: quansync(function* (obj) {
			const config = yield typeof obj === "function" ? obj(...options.parameters || [{ env: {} }, {}]) : obj;
			if (!config) return config;
			return config.plugins.find((i) => plugins.includes(i.name) && i?.api?.config)?.api?.config;
		})
	};
}
/**
* Get one field of the config object
*/
function sourceObjectFields(options) {
	const fields = toArray(options.fields);
	return {
		...options,
		rewrite: quansync(function* (obj) {
			const config = yield typeof obj === "function" ? obj(...options.parameters || []) : obj;
			if (!config) return config;
			for (const field of fields) if (field in config) return config[field];
		})
	};
}
/**
* Get one field of `package.json`
*/
function sourcePackageJsonFields(options) {
	return sourceObjectFields({
		files: ["package.json"],
		extensions: [],
		parser: "json",
		fields: options.fields
	});
}

//#endregion
export { sourceObjectFields, sourcePackageJsonFields, sourcePluginFactory, sourceVitePluginConfig };