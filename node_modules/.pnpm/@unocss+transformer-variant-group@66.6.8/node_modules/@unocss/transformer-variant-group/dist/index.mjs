import { parseVariantGroup } from "@unocss/core";
//#region src/index.ts
function transformerVariantGroup(options = {}) {
	return {
		name: "@unocss/transformer-variant-group",
		enforce: "pre",
		transform(s) {
			const result = parseVariantGroup(s, options.separators);
			return { get highlightAnnotations() {
				return [...result.groupsByOffset.values()].flatMap((group) => group.items);
			} };
		}
	};
}
//#endregion
export { transformerVariantGroup as default };
