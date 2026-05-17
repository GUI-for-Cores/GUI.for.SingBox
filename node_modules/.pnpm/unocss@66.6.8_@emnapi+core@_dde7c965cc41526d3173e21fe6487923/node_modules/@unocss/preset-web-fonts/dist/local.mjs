import "@unocss/core";
import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";
import fs from "node:fs";
import fsp from "node:fs/promises";
import { join, resolve } from "node:path";
import process from "node:process";
import { fetch } from "ofetch";
//#region ../../virtual-shared/integration/src/utils.ts
function replaceAsync(string, searchValue, replacer) {
	try {
		if (typeof replacer === "function") {
			const values = [];
			String.prototype.replace.call(string, searchValue, (...args) => {
				values.push(replacer(...args));
				return "";
			});
			return Promise.all(values).then((resolvedValues) => {
				return String.prototype.replace.call(string, searchValue, () => {
					return resolvedValues.shift() || "";
				});
			});
		} else return Promise.resolve(String.prototype.replace.call(string, searchValue, replacer));
	} catch (error) {
		return Promise.reject(error);
	}
}
//#endregion
//#region src/local.ts
const fontUrlRegex = /[-\w@:%+.~#?&/=]+\.(?:woff2?|eot|ttf|otf|svg)/gi;
const urlProtocolRegex = /^[\s\w\0+.-]{2,}:([/\\]{1,2})/;
function createLocalFontProcessor(options) {
	const cwd = options?.cwd || process.cwd();
	const cacheDir = resolve(cwd, options?.cacheDir || "node_modules/.cache/unocss/fonts");
	const fontAssetsDir = resolve(cwd, options?.fontAssetsDir || "public/assets/fonts");
	const fontServeBaseUrl = options?.fontServeBaseUrl || "/assets/fonts";
	async function _downloadFont(url, assetPath) {
		const response = await (options?.fetch ?? fetch)(url).then((r) => r.arrayBuffer());
		await fsp.mkdir(fontAssetsDir, { recursive: true });
		await fsp.writeFile(assetPath, Buffer.from(response));
	}
	const cache = /* @__PURE__ */ new Map();
	function downloadFont(url, assetPath) {
		if (!cache.has(url)) cache.set(url, _downloadFont(url, assetPath));
		return cache.get(url);
	}
	return {
		async getCSS(fonts, providers, getCSSDefault) {
			const cachePath = join(cacheDir, `${getHash(JSON.stringify(fonts))}.css`);
			if (fs.existsSync(cachePath)) return fsp.readFile(cachePath, "utf-8");
			const css = await getCSSDefault(fonts, providers);
			await fsp.mkdir(cacheDir, { recursive: true });
			await fsp.writeFile(cachePath, css, "utf-8");
			return css;
		},
		async transformCSS(css) {
			return await replaceAsync(css, fontUrlRegex, async (url) => {
				const hash = getHash(url);
				const ext = url.split(".").pop();
				let name = "";
				const match1 = url.match(/\/s\/([^/]+)\//);
				if (match1) name = match1[1].replace(/\W/g, " ").trim().replace(/\s+/, "-").toLowerCase();
				const filename = `${[name, hash].filter(Boolean).join("-")}.${ext}`;
				const assetPath = join(fontAssetsDir, filename);
				if (!fs.existsSync(assetPath)) await downloadFont(hasProtocol(url) ? url : withProtocol(url), assetPath);
				return `${fontServeBaseUrl}/${filename}`;
			});
		}
	};
}
function getHash(input, length = 8) {
	return createHash("sha256").update(input).digest("hex").slice(0, length);
}
function hasProtocol(input) {
	return urlProtocolRegex.test(input);
}
function withProtocol(input, protocol = "https://") {
	const match = input.match(/^\/{2,}/);
	if (!match) return protocol + input;
	return protocol + input.slice(match[0].length);
}
//#endregion
export { createLocalFontProcessor };
