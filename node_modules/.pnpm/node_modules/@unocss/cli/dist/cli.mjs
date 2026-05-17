import { n as handleError, r as version, t as build } from "./src-8qD2Z7Td.mjs";
import process from "node:process";
import { green } from "colorette";
import { resolve } from "pathe";
import { cac } from "cac";
//#region src/cli-start.ts
async function startCli(cwd = process.cwd(), argv = process.argv, options = {}) {
	const cli = cac("unocss");
	cli.command("[...patterns]", "Glob patterns", { ignoreOptionDefaultValue: true }).option("-o, --out-file <file>", "Output file", { default: resolve(cwd, "uno.css") }).option("--stdout", "Output to STDOUT", { default: false }).option("-c, --config [file]", "Config file").option("-w, --watch", "Watch for file changes").option("--rewrite", "Update source files with transformed utilities", { default: false }).option("--write-transformed", "Update source files with transformed utilities (deprecated, use --rewrite)", { default: false }).option("--preflights", "Enable preflights", { default: true }).option("-m, --minify", "Minify generated CSS", { default: false }).option("--debug", "Enable debug mode", { default: false }).option("--split-css [mode]", `Whether to output CSS files scanned from patterns to outFile. Options: ${green("true")}, ${green("false")}, ${green("multi")}, ${green("single")}`, { default: true }).option("--preset [default-preset]", `Switch ${green("wind3")} or ${green("wind4")} preset as default. If you have configured uno.config, this option will be ignored.`, { default: "wind4" }).action(async (patterns, flags) => {
		Object.assign(options, {
			cwd,
			...flags
		});
		if (String(options.splitCss) === "true") options.splitCss = true;
		if (String(options.splitCss) === "false") options.splitCss = false;
		if (patterns) options.patterns = patterns;
		await build(options);
	});
	cli.help();
	cli.version(version);
	cli.parse(argv, { run: false });
	await cli.runMatchedCommand();
}
//#endregion
//#region src/cli.ts
startCli().catch(handleError);
//#endregion
export {};
