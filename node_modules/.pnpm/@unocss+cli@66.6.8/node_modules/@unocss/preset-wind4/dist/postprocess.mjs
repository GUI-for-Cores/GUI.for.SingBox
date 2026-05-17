//#region src/postprocess/important.ts
function important({ important: option }) {
	if (option == null || option === false) return [];
	const wrapWithIs = (selector) => {
		if (selector.startsWith(":is(") && selector.endsWith(")")) return selector;
		if (selector.includes("::")) return selector.replace(/(.*?)((?:\s\*)?::.*)/, ":is($1)$2");
		return `:is(${selector})`;
	};
	return [(util) => {
		if (util.layer === "properties") return;
		if (option === true) util.entries.forEach((i) => {
			if (i[1] != null && !String(i[1]).endsWith("!important")) i[1] += " !important";
		});
		else if (!util.selector.startsWith(option)) util.selector = `${option} ${wrapWithIs(util.selector)}`;
	}];
}
//#endregion
//#region src/postprocess/varPrefix.ts
function varPrefix({ variablePrefix: prefix }) {
	const processor = (obj) => {
		if (obj.layer === "properties") obj.selector = obj.selector.replace(/^@property --un-/, `@property --${prefix}`);
		obj.entries.forEach((i) => {
			i[0] = i[0].replace(/^--un-/, `--${prefix}`);
			if (typeof i[1] === "string") i[1] = i[1].replace(/var\(--un-/g, `var(--${prefix}`);
		});
	};
	return prefix !== "un-" ? [processor] : [];
}
//#endregion
//#region src/postprocess/default.ts
function postprocessors(options) {
	return [important, varPrefix].flatMap((i) => i(options));
}
//#endregion
export { important, postprocessors, varPrefix };
