import { b as cssMathFnRE, f as resolveBreakpoints, g as h, n as _utils_exports, t as utils_exports, x as cssVarFnRE } from "./utils-BtCNpQqm.mjs";
import { escapeRegExp, escapeSelector, toArray } from "@unocss/core";
import { createPartClasses, createPseudoClassFunctions, createPseudoClassesAndElements, createTaggedPseudoClasses, getStringComponent } from "@unocss/rule-utils";
//#region src/_variants/aria.ts
const variantAria = {
	name: "aria",
	match(matcher, ctx) {
		const variant = (0, utils_exports.variantGetParameter)("aria-", matcher, ctx.generator.config.separators);
		if (variant) {
			const [match, rest] = variant;
			const aria = h.bracket(match) ?? ctx.theme.aria?.[match] ?? "";
			if (aria) return {
				matcher: rest,
				selector: (s) => `${s}[aria-${aria}]`
			};
		}
	},
	multiPass: true
};
function taggedAria(tagName, combinator, options = {}) {
	return {
		name: `${tagName}-aria`,
		match(matcher, ctx) {
			const variant = (0, utils_exports.variantGetParameter)(`${tagName}-aria-`, matcher, ctx.generator.config.separators);
			if (variant) {
				const [match, rest, label] = variant;
				const ariaAttribute = h.bracket(match) ?? ctx.theme.aria?.[match] ?? "";
				if (ariaAttribute) {
					const attributify = !!options?.attributifyPseudo;
					let firstPrefix = options?.prefix ?? "";
					firstPrefix = (Array.isArray(firstPrefix) ? firstPrefix : [firstPrefix]).filter(Boolean)[0] ?? "";
					const parent = `${attributify ? `[${firstPrefix}${tagName}=""]` : `.${firstPrefix}${tagName}`}`;
					const escapedLabel = escapeSelector(label ? `/${label}` : "");
					return {
						matcher: rest,
						handle: (input, next) => {
							const regexp = new RegExp(`${escapeRegExp(parent)}${escapeRegExp(escapedLabel)}(?:\\[.+?\\])+`);
							const match = input.prefix.match(regexp);
							let nextPrefix;
							if (match) {
								const insertIndex = (match.index ?? 0) + parent.length + escapedLabel.length;
								nextPrefix = [
									input.prefix.slice(0, insertIndex),
									`[aria-${ariaAttribute}]`,
									input.prefix.slice(insertIndex)
								].join("");
							} else {
								const prefixGroupIndex = Math.max(input.prefix.indexOf(parent), 0);
								nextPrefix = [
									input.prefix.slice(0, prefixGroupIndex),
									parent,
									escapedLabel,
									`[aria-${ariaAttribute}]`,
									combinator,
									input.prefix.slice(prefixGroupIndex)
								].join("");
							}
							return next({
								...input,
								prefix: nextPrefix
							});
						}
					};
				}
			}
		},
		multiPass: true
	};
}
function taggedHasAria() {
	return {
		name: "has-aria",
		match(matcher, ctx) {
			const variant = (0, utils_exports.variantGetParameter)("has-aria-", matcher, ctx.generator.config.separators);
			if (variant) {
				const [match, rest] = variant;
				const ariaAttribute = h.bracket(match) ?? ctx.theme.aria?.[match] ?? "";
				if (ariaAttribute) return {
					matcher: rest,
					handle: (input, next) => next({
						...input,
						pseudo: `${input.pseudo}:has([aria-${ariaAttribute}])`
					})
				};
			}
		},
		multiPass: true
	};
}
function variantTaggedAriaAttributes(options = {}) {
	return [
		taggedAria("group", " ", options),
		taggedAria("peer", "~", options),
		taggedAria("parent", ">", options),
		taggedAria("previous", "+", options),
		taggedHasAria()
	];
}
//#endregion
//#region src/_variants/breakpoints.ts
const sizePseudo = /(max|min)-\[([^\]]*)\]:/;
function variantBreakpoints() {
	const regexCache = {};
	return {
		name: "breakpoints",
		match(matcher, context) {
			if (sizePseudo.test(matcher)) {
				const match = matcher.match(sizePseudo);
				return {
					matcher: matcher.replace(match[0], ""),
					handle: (input, next) => next({
						...input,
						parent: `${input.parent ? `${input.parent} $$ ` : ""}@media (${match[1]}-width: ${match[2]})`
					})
				};
			}
			const variantEntries = (resolveBreakpoints(context) ?? []).map(({ point, size }, idx) => [
				point,
				size,
				idx
			]);
			for (const [point, size, idx] of variantEntries) {
				if (!regexCache[point]) regexCache[point] = new RegExp(`^((?:([al]t-|[<~]|max-))?${point}(?:${context.generator.config.separators.join("|")}))`);
				const match = matcher.match(regexCache[point]);
				if (!match) continue;
				const [, pre] = match;
				const m = matcher.slice(pre.length);
				if (m === "container") continue;
				const isLtPrefix = pre.startsWith("lt-") || pre.startsWith("<") || pre.startsWith("max-");
				const isAtPrefix = pre.startsWith("at-") || pre.startsWith("~");
				let order = 3e3;
				if (isLtPrefix) {
					order -= idx + 1;
					return {
						matcher: m,
						handle: (input, next) => next({
							...input,
							parent: `${input.parent ? `${input.parent} $$ ` : ""}@media (max-width: ${(0, utils_exports.calcMaxWidthBySize)(size)})`,
							parentOrder: order
						})
					};
				}
				order += idx + 1;
				if (isAtPrefix && idx < variantEntries.length - 1) return {
					matcher: m,
					handle: (input, next) => next({
						...input,
						parent: `${input.parent ? `${input.parent} $$ ` : ""}@media (min-width: ${size}) and (max-width: ${(0, utils_exports.calcMaxWidthBySize)(variantEntries[idx + 1][1])})`,
						parentOrder: order
					})
				};
				return {
					matcher: m,
					handle: (input, next) => next({
						...input,
						parent: `${input.parent ? `${input.parent} $$ ` : ""}@media (min-width: ${size})`,
						parentOrder: order
					})
				};
			}
		},
		multiPass: true,
		autocomplete: "(at-|lt-|max-|)$breakpoints:"
	};
}
//#endregion
//#region src/_variants/children.ts
const variantChildren = [(0, utils_exports.variantMatcher)("*", (input) => ({ selector: `${input.selector} > *` }), { order: -1 })];
//#endregion
//#region src/_variants/combinators.ts
function scopeMatcher(name, combinator) {
	return {
		name: `combinator:${name}`,
		match(matcher, ctx) {
			if (!matcher.startsWith(name)) return;
			const separators = ctx.generator.config.separators;
			let body = (0, utils_exports.variantGetBracket)(`${name}-`, matcher, separators);
			if (!body) {
				for (const separator of separators) if (matcher.startsWith(`${name}${separator}`)) {
					body = ["", matcher.slice(name.length + separator.length)];
					break;
				}
				if (!body) return;
			}
			let bracketValue = h.bracket(body[0]) ?? "";
			if (bracketValue === "") bracketValue = "*";
			return {
				matcher: body[1],
				selector: (s) => `${s}${combinator}${bracketValue}`
			};
		},
		multiPass: true
	};
}
const variantCombinators = [
	scopeMatcher("all", " "),
	scopeMatcher("children", ">"),
	scopeMatcher("next", "+"),
	scopeMatcher("sibling", "+"),
	scopeMatcher("siblings", "~")
];
//#endregion
//#region src/_variants/container.ts
const variantContainerQuery = {
	name: "@",
	match(matcher, ctx) {
		if (matcher.startsWith("@container")) return;
		const variant = (0, utils_exports.variantGetParameter)("@", matcher, ctx.generator.config.separators);
		if (variant) {
			const [match, rest, label] = variant;
			const unbracket = h.bracket(match);
			let container;
			if (unbracket) container = h.numberWithUnit(unbracket);
			else container = ctx.theme.containers?.[match] ?? "";
			if (container) {
				let order = 1e3 + Object.keys(ctx.theme.containers ?? {}).indexOf(match);
				if (label) order += 1e3;
				return {
					matcher: rest,
					handle: (input, next) => next({
						...input,
						parent: `${input.parent ? `${input.parent} $$ ` : ""}@container${label ? ` ${label} ` : " "}(min-width: ${container})`,
						parentOrder: order
					})
				};
			}
		}
	},
	multiPass: true
};
//#endregion
//#region src/_variants/dark.ts
function variantColorsMediaOrClass(options = {}) {
	if (options?.dark === "class" || typeof options.dark === "object") {
		const { dark = ".dark", light = ".light" } = typeof options.dark === "string" ? {} : options.dark;
		return [(0, utils_exports.variantMatcher)("dark", toArray(dark).map((dark) => (input) => ({ prefix: `${dark} $$ ${input.prefix}` }))), (0, utils_exports.variantMatcher)("light", toArray(light).map((light) => (input) => ({ prefix: `${light} $$ ${input.prefix}` })))];
	}
	return [(0, utils_exports.variantParentMatcher)("dark", "@media (prefers-color-scheme: dark)"), (0, utils_exports.variantParentMatcher)("light", "@media (prefers-color-scheme: light)")];
}
//#endregion
//#region src/_variants/data.ts
const variantDataAttribute = {
	name: "data",
	match(matcher, ctx) {
		const variant = (0, utils_exports.variantGetParameter)("data-", matcher, ctx.generator.config.separators);
		if (variant) {
			const [match, rest] = variant;
			const dataAttribute = h.bracket(match) ?? ctx.theme.data?.[match] ?? "";
			if (dataAttribute) return {
				matcher: rest,
				selector: (s) => `${s}[data-${dataAttribute}]`
			};
		}
	},
	multiPass: true
};
function taggedData(tagName, combinator, options = {}) {
	return {
		name: `${tagName}-data`,
		match(matcher, ctx) {
			const variant = (0, utils_exports.variantGetParameter)(`${tagName}-data-`, matcher, ctx.generator.config.separators);
			if (variant) {
				const [match, rest, label] = variant;
				const dataAttribute = h.bracket(match) ?? ctx.theme.data?.[match] ?? "";
				if (dataAttribute) {
					const attributify = !!options?.attributifyPseudo;
					let firstPrefix = options?.prefix ?? "";
					firstPrefix = (Array.isArray(firstPrefix) ? firstPrefix : [firstPrefix]).filter(Boolean)[0] ?? "";
					const parent = `${attributify ? `[${firstPrefix}${tagName}=""]` : `.${firstPrefix}${tagName}`}`;
					const escapedLabel = escapeSelector(label ? `/${label}` : "");
					return {
						matcher: rest,
						handle: (input, next) => {
							const regexp = new RegExp(`${escapeRegExp(parent)}${escapeRegExp(escapedLabel)}(?:\\[.+?\\])+`);
							const match = input.prefix.match(regexp);
							let nextPrefix;
							if (match) {
								const insertIndex = (match.index ?? 0) + parent.length + escapedLabel.length;
								nextPrefix = [
									input.prefix.slice(0, insertIndex),
									`[data-${dataAttribute}]`,
									input.prefix.slice(insertIndex)
								].join("");
							} else {
								const prefixGroupIndex = Math.max(input.prefix.indexOf(parent), 0);
								nextPrefix = [
									input.prefix.slice(0, prefixGroupIndex),
									parent,
									escapedLabel,
									`[data-${dataAttribute}]`,
									combinator,
									input.prefix.slice(prefixGroupIndex)
								].join("");
							}
							return next({
								...input,
								prefix: nextPrefix
							});
						}
					};
				}
			}
		},
		multiPass: true
	};
}
function taggedHasData() {
	return {
		name: "has-data",
		match(matcher, ctx) {
			const variant = (0, utils_exports.variantGetParameter)("has-data-", matcher, ctx.generator.config.separators);
			if (variant) {
				const [match, rest] = variant;
				const dataAttribute = h.bracket(match) ?? ctx.theme.data?.[match] ?? "";
				if (dataAttribute) return {
					matcher: rest,
					handle: (input, next) => next({
						...input,
						pseudo: `${input.pseudo}:has([data-${dataAttribute}])`
					})
				};
			}
		},
		multiPass: true
	};
}
function variantTaggedDataAttributes(options = {}) {
	return [
		taggedData("group", " ", options),
		taggedData("peer", "~", options),
		taggedData("parent", ">", options),
		taggedData("previous", "+", options),
		taggedHasData()
	];
}
//#endregion
//#region src/_variants/directions.ts
const variantLanguageDirections = [(0, utils_exports.variantMatcher)("rtl", (input) => ({ prefix: `[dir="rtl"] $$ ${input.prefix}` })), (0, utils_exports.variantMatcher)("ltr", (input) => ({ prefix: `[dir="ltr"] $$ ${input.prefix}` }))];
//#endregion
//#region src/_variants/important.ts
function variantImportant() {
	let re;
	return {
		name: "important",
		match(matcher, ctx) {
			if (!re) re = new RegExp(`^(important(?:${ctx.generator.config.separators.join("|")})|!)`);
			let base;
			const match = matcher.match(re);
			if (match) base = matcher.slice(match[0].length);
			else if (matcher.endsWith("!")) base = matcher.slice(0, -1);
			if (base) return {
				matcher: base,
				body: (body) => {
					body.forEach((v) => {
						if (v[1] != null) v[1] += " !important";
					});
					return body;
				}
			};
		}
	};
}
//#endregion
//#region src/_variants/media.ts
const variantPrint = (0, utils_exports.variantParentMatcher)("print", "@media print");
const variantCustomMedia = {
	name: "media",
	match(matcher, ctx) {
		const variant = (0, utils_exports.variantGetParameter)("media-", matcher, ctx.generator.config.separators);
		if (variant) {
			const [match, rest] = variant;
			let media = h.bracket(match) ?? "";
			if (media === "") media = ctx.theme.media?.[match] ?? "";
			if (media) return {
				matcher: rest,
				handle: (input, next) => next({
					...input,
					parent: `${input.parent ? `${input.parent} $$ ` : ""}@media ${media}`
				})
			};
		}
	},
	multiPass: true
};
//#endregion
//#region src/_variants/misc.ts
const variantSelector = {
	name: "selector",
	match(matcher, ctx) {
		const variant = (0, utils_exports.variantGetBracket)("selector-", matcher, ctx.generator.config.separators);
		if (variant) {
			const [match, rest] = variant;
			const selector = h.bracket(match);
			if (selector) return {
				matcher: rest,
				selector: () => selector
			};
		}
	}
};
const variantCssLayer = {
	name: "layer",
	match(matcher, ctx) {
		const variant = (0, utils_exports.variantGetParameter)("layer-", matcher, ctx.generator.config.separators);
		if (variant) {
			const [match, rest] = variant;
			const layer = h.bracket(match) ?? match;
			if (layer) return {
				matcher: rest,
				handle: (input, next) => next({
					...input,
					parent: `${input.parent ? `${input.parent} $$ ` : ""}@layer ${layer}`
				})
			};
		}
	}
};
const variantInternalLayer = {
	name: "uno-layer",
	match(matcher, ctx) {
		const variant = (0, utils_exports.variantGetParameter)("uno-layer-", matcher, ctx.generator.config.separators);
		if (variant) {
			const [match, rest] = variant;
			const layer = h.bracket(match) ?? match;
			if (layer) return {
				matcher: rest,
				layer
			};
		}
	}
};
const variantScope = {
	name: "scope",
	match(matcher, ctx) {
		const variant = (0, utils_exports.variantGetBracket)("scope-", matcher, ctx.generator.config.separators);
		if (variant) {
			const [match, rest] = variant;
			const scope = h.bracket(match);
			if (scope) return {
				matcher: rest,
				selector: (s) => `${scope} $$ ${s}`
			};
		}
	}
};
const variantVariables = {
	name: "variables",
	match(matcher, ctx) {
		if (!matcher.startsWith("[")) return;
		const [match, rest] = (0, utils_exports.getBracket)(matcher, "[", "]") ?? [];
		if (!(match && rest)) return;
		let newMatcher;
		for (const separator of ctx.generator.config.separators) if (rest.startsWith(separator)) {
			newMatcher = rest.slice(separator.length);
			break;
		}
		if (newMatcher == null) return;
		const variant = h.bracket(match) ?? "";
		const useParent = variant.startsWith("@");
		if (!(useParent || variant.includes("&"))) return;
		return {
			matcher: newMatcher,
			handle(input, next) {
				const updates = useParent ? { parent: `${input.parent ? `${input.parent} $$ ` : ""}${variant}` } : { selector: variant.replace(/&/g, input.selector) };
				return next({
					...input,
					...updates
				});
			}
		};
	},
	multiPass: true
};
const variantTheme = {
	name: "theme-variables",
	match(matcher, ctx) {
		if (!(0, utils_exports.hasThemeFn)(matcher)) return;
		return {
			matcher,
			handle(input, next) {
				return next({
					...input,
					entries: JSON.parse((0, utils_exports.transformThemeFn)(JSON.stringify(input.entries), ctx.theme))
				});
			}
		};
	}
};
//#endregion
//#region src/_variants/negative.ts
const anchoredNumberRE = /^-?[0-9.]+(?:[a-z]+|%)?$/;
const numberRE = /-?[0-9.]+(?:[a-z]+|%)?/;
const ignoreProps = [/\b(opacity|color|flex|backdrop-filter|^filter|transform)\b/];
function negateMathFunction(value) {
	const match = value.match(cssMathFnRE) || value.match(cssVarFnRE);
	if (match) {
		const [fnBody, rest] = getStringComponent(`(${match[2]})${match[3]}`, "(", ")", " ") ?? [];
		if (fnBody) return `calc(${match[1]}${fnBody} * -1)${rest ? ` ${rest}` : ""}`;
	}
}
const negateFunctionBodyRE = /\b(hue-rotate)\s*(\(.*)/;
function negateFunctionBody(value) {
	const match = value.match(negateFunctionBodyRE);
	if (match) {
		const [fnBody, rest] = getStringComponent(match[2], "(", ")", " ") ?? [];
		if (fnBody) {
			const body = anchoredNumberRE.test(fnBody.slice(1, -1)) ? fnBody.replace(numberRE, (i) => i.startsWith("-") ? i.slice(1) : `-${i}`) : `(calc(${fnBody} * -1))`;
			return `${match[1]}${body}${rest ? ` ${rest}` : ""}`;
		}
	}
}
const variantNegative = {
	name: "negative",
	match(matcher) {
		if (!matcher.startsWith("-")) return;
		return {
			matcher: matcher.slice(1),
			body: (body) => {
				if (body.some((v) => v[0] === "$$mini-no-negative")) return;
				let changed = false;
				body.forEach((v) => {
					const value = v[1]?.toString();
					if (!value || value === "0") return;
					if (ignoreProps.some((i) => i.test(v[0]))) return;
					const negatedFn = negateMathFunction(value);
					if (negatedFn) {
						v[1] = negatedFn;
						changed = true;
						return;
					}
					const negatedBody = negateFunctionBody(value);
					if (negatedBody) {
						v[1] = negatedBody;
						changed = true;
						return;
					}
					if (anchoredNumberRE.test(value)) {
						v[1] = value.replace(numberRE, (i) => i.startsWith("-") ? i.slice(1) : `-${i}`);
						changed = true;
					}
				});
				if (changed) return body;
				return [];
			}
		};
	}
};
//#endregion
//#region src/_variants/pseudo.ts
function variantPseudoClassesAndElements() {
	return createPseudoClassesAndElements({
		getBracket: _utils_exports.getBracket,
		h,
		variantGetBracket: _utils_exports.variantGetBracket
	});
}
function variantPseudoClassFunctions() {
	return createPseudoClassFunctions({
		getBracket: _utils_exports.getBracket,
		h,
		variantGetBracket: _utils_exports.variantGetBracket
	});
}
function variantTaggedPseudoClasses(options = {}) {
	return createTaggedPseudoClasses(options, {
		getBracket: _utils_exports.getBracket,
		h,
		variantGetBracket: _utils_exports.variantGetBracket
	});
}
const variantPartClasses = createPartClasses();
//#endregion
//#region src/_variants/startingstyle.ts
const variantStartingStyle = {
	name: "starting",
	match(matcher) {
		if (!matcher.startsWith("starting:")) return;
		return {
			matcher: matcher.slice(9),
			handle: (input, next) => next({
				...input,
				parent: `@starting-style`
			})
		};
	}
};
//#endregion
//#region src/_variants/supports.ts
const variantSupports = {
	name: "supports",
	match(matcher, ctx) {
		const variant = (0, utils_exports.variantGetParameter)("supports-", matcher, ctx.generator.config.separators);
		if (variant) {
			const [match, rest] = variant;
			let supports = h.bracket(match) ?? "";
			if (supports === "") supports = ctx.theme.supports?.[match] ?? "";
			if (supports) {
				if (!(supports.startsWith("(") && supports.endsWith(")"))) supports = `(${supports})`;
				return {
					matcher: rest,
					handle: (input, next) => next({
						...input,
						parent: `${input.parent ? `${input.parent} $$ ` : ""}@supports ${supports}`
					})
				};
			}
		}
	},
	multiPass: true
};
//#endregion
//#region src/_variants/default.ts
function variants(options) {
	return [
		variantAria,
		variantDataAttribute,
		variantCssLayer,
		variantSelector,
		variantInternalLayer,
		variantNegative,
		variantStartingStyle,
		variantImportant(),
		variantSupports,
		variantPrint,
		variantCustomMedia,
		variantBreakpoints(),
		...variantCombinators,
		...variantPseudoClassesAndElements(),
		variantPseudoClassFunctions(),
		...variantTaggedPseudoClasses(options),
		variantPartClasses,
		...variantColorsMediaOrClass(options),
		...variantLanguageDirections,
		variantScope,
		...variantChildren,
		variantContainerQuery,
		variantVariables,
		...variantTaggedDataAttributes(options),
		...variantTaggedAriaAttributes(options),
		variantTheme
	];
}
//#endregion
export { variantAria, variantBreakpoints, variantChildren, variantColorsMediaOrClass, variantCombinators, variantContainerQuery, variantCssLayer, variantCustomMedia, variantDataAttribute, variantImportant, variantInternalLayer, variantLanguageDirections, variantNegative, variantPartClasses, variantPrint, variantPseudoClassFunctions, variantPseudoClassesAndElements, variantScope, variantSelector, variantStartingStyle, variantSupports, variantTaggedAriaAttributes, variantTaggedDataAttributes, variantTaggedPseudoClasses, variantTheme, variantVariables, variants };
