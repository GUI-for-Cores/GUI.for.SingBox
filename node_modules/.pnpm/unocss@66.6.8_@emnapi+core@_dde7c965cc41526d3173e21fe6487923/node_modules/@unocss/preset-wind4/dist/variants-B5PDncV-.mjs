import { D as h, N as cssMathFnRE, P as cssVarFnRE, g as hasParseableColor, w as resolveBreakpoints } from "./utils-B60b98El.mjs";
import { toArray } from "@unocss/core";
import { calcMaxWidthBySize, createPartClasses, createPseudoClassFunctions, createPseudoClassesAndElements, createTaggedPseudoClasses, getBracket, getStringComponent, hasThemeFn, transformThemeFn, variantGetBracket, variantGetParameter, variantMatcher, variantParentMatcher } from "@unocss/rule-utils";
//#region src/variants/aria.ts
const variantAria = {
	name: "aria",
	match(matcher, ctx) {
		const variant = variantGetParameter("aria-", matcher, ctx.generator.config.separators);
		if (variant) {
			const [match, rest] = variant;
			const aria = h.bracket(match) ?? ctx.theme.aria?.[match] ?? "";
			if (aria) return {
				matcher: rest,
				selector: (s) => `${s}[aria-${aria}]`
			};
		}
	},
	multiPass: true,
	autocomplete: "aria-$aria"
};
function taggedAria(tagName) {
	return {
		name: `${tagName}-aria`,
		match(matcher, ctx) {
			const variant = variantGetParameter(`${tagName}-aria-`, matcher, ctx.generator.config.separators);
			if (variant) {
				const [match, rest, label] = variant;
				const ariaAttribute = h.bracket(match) ?? ctx.theme.aria?.[match] ?? "";
				if (ariaAttribute) {
					const tagSelectorMap = {
						group: `&:is(:where(.group${label ? `\\/${label}` : ""})[aria-${ariaAttribute}] *)`,
						peer: `&:is(:where(.peer${label ? `\\/${label}` : ""})[aria-${ariaAttribute}] ~ *)`,
						previous: `:where(*[aria-${ariaAttribute}] + &)`,
						parent: `:where(*[aria-${ariaAttribute}] > &)`,
						has: `&:has(*[aria-${ariaAttribute}])`,
						in: `:where(*[aria-${ariaAttribute}]) &`
					};
					return {
						matcher: rest,
						handle: (input, next) => next({
							...input,
							parent: `${input.parent ? `${input.parent} $$ ` : ""}${input.selector}`,
							selector: tagSelectorMap[tagName]
						})
					};
				}
			}
		},
		multiPass: true
	};
}
const variantTaggedAriaAttributes = [
	taggedAria("group"),
	taggedAria("peer"),
	taggedAria("parent"),
	taggedAria("previous"),
	taggedAria("has"),
	taggedAria("in")
];
//#endregion
//#region src/variants/breakpoints.ts
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
							parent: `${input.parent ? `${input.parent} $$ ` : ""}@media (max-width: ${calcMaxWidthBySize(size)})`,
							parentOrder: order
						})
					};
				}
				order += idx + 1;
				if (isAtPrefix && idx < variantEntries.length - 1) return {
					matcher: m,
					handle: (input, next) => next({
						...input,
						parent: `${input.parent ? `${input.parent} $$ ` : ""}@media (min-width: ${size}) and (max-width: ${calcMaxWidthBySize(variantEntries[idx + 1][1])})`,
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
		autocomplete: "(at-|lt-|max-|)$breakpoint:"
	};
}
//#endregion
//#region src/variants/children.ts
const variantChildren = [variantMatcher("*", (input) => ({ selector: `${input.selector} > *` }), { order: -1 }), variantMatcher("**", (input) => ({ selector: `${input.selector} *` }), { order: -1 })];
//#endregion
//#region src/variants/combinators.ts
function scopeMatcher(name, combinator) {
	return {
		name: `combinator:${name}`,
		match(matcher, ctx) {
			if (!matcher.startsWith(name)) return;
			const separators = ctx.generator.config.separators;
			let body = variantGetBracket(`${name}-`, matcher, separators);
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
const variantSvgCombinators = [variantMatcher("svg", (input) => ({ selector: `${input.selector} svg` }))];
//#endregion
//#region src/variants/container.ts
const variantContainerQuery = {
	name: "@",
	match(matcher, ctx) {
		if (matcher.startsWith("@container")) return;
		const variant = variantGetParameter("@", matcher, ctx.generator.config.separators);
		if (variant) {
			const [match, rest, label] = variant;
			const unbracket = h.bracket(match);
			let container;
			if (unbracket) container = h.numberWithUnit(unbracket);
			else container = ctx.theme.container?.[match] ?? "";
			if (container) {
				let order = 1e3 + Object.keys(ctx.theme.container ?? {}).indexOf(match);
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
//#region src/variants/dark.ts
function variantColorsMediaOrClass(options = {}) {
	if (options?.dark === "class" || typeof options.dark === "object") {
		const { dark = ".dark", light = ".light" } = typeof options.dark === "string" ? {} : options.dark;
		return [variantMatcher("dark", (input) => ({ prefix: `${dark} $$ ${input.prefix}` })), variantMatcher("light", (input) => ({ prefix: `${light} $$ ${input.prefix}` }))];
	}
	return [variantParentMatcher("dark", "@media (prefers-color-scheme: dark)"), variantParentMatcher("light", "@media (prefers-color-scheme: light)")];
}
const variantColorsScheme = [
	variantMatcher(".dark", (input) => ({ prefix: `.dark $$ ${input.prefix}` })),
	variantMatcher(".light", (input) => ({ prefix: `.light $$ ${input.prefix}` })),
	variantParentMatcher("@dark", "@media (prefers-color-scheme: dark)"),
	variantParentMatcher("@light", "@media (prefers-color-scheme: light)"),
	variantParentMatcher("not-dark", "@media not (prefers-color-scheme: dark)")
];
//#endregion
//#region src/variants/data.ts
const variantDataAttribute = {
	name: "data",
	match(matcher, ctx) {
		const variant = variantGetParameter("data-", matcher, ctx.generator.config.separators);
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
function taggedData(tagName) {
	return {
		name: `${tagName}-data`,
		match(matcher, ctx) {
			const variant = variantGetParameter(`${tagName}-data-`, matcher, ctx.generator.config.separators);
			if (variant) {
				const [match, rest, label] = variant;
				const dataAttribute = h.bracket(match) ?? ctx.theme.data?.[match] ?? "";
				if (dataAttribute) {
					const tagSelectorMap = {
						group: `&:is(:where(.group${label ? `\\/${label}` : ""})[data-${dataAttribute}] *)`,
						peer: `&:is(:where(.peer${label ? `\\/${label}` : ""})[data-${dataAttribute}] ~ *)`,
						previous: `:where(*[data-${dataAttribute}] + &)`,
						parent: `:where(*[data-${dataAttribute}] > &)`,
						has: `&:has(*[data-${dataAttribute}])`,
						in: `:where(*[data-${dataAttribute}]) &`
					};
					return {
						matcher: rest,
						handle: (input, next) => next({
							...input,
							parent: `${input.parent ? `${input.parent} $$ ` : ""}${input.selector}`,
							selector: tagSelectorMap[tagName]
						})
					};
				}
			}
		},
		multiPass: true
	};
}
const variantTaggedDataAttributes = [
	taggedData("group"),
	taggedData("peer"),
	taggedData("parent"),
	taggedData("previous"),
	taggedData("has"),
	taggedData("in")
];
//#endregion
//#region src/variants/directions.ts
const variantLanguageDirections = [variantMatcher("rtl", (input) => ({ prefix: `[dir="rtl"] $$ ${input.prefix}` })), variantMatcher("ltr", (input) => ({ prefix: `[dir="ltr"] $$ ${input.prefix}` }))];
//#endregion
//#region src/variants/important.ts
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
//#region src/variants/inert.ts
const variantInert = variantMatcher("inert", (input) => ({
	parent: `${input.parent ? `${input.parent} $$ ` : ""}${input.selector}`,
	selector: "&:is([inert],[inert] *)"
}));
//#endregion
//#region src/variants/media.ts
const variantNoscript = variantParentMatcher("noscript", "@media (scripting: none)");
const variantScripting = {
	name: "scripting",
	match(matcher, ctx) {
		const variant = variantGetParameter(["script-", "scripting-"], matcher, ctx.generator.config.separators);
		if (variant) {
			const [match, rest] = variant;
			if ([
				"none",
				"initial-only",
				"enabled"
			].includes(match)) return {
				matcher: rest,
				handle: (input, next) => next({
					...input,
					parent: `${input.parent ? `${input.parent} $$ ` : ""}@media (scripting: ${match})`
				})
			};
		}
	},
	multiPass: true,
	autocomplete: ["(scripting|script)-(none|initial-only|enabled)"]
};
const variantPrint = variantParentMatcher("print", "@media print");
const variantCustomMedia = {
	name: "media",
	match(matcher, ctx) {
		const variant = variantGetParameter("media-", matcher, ctx.generator.config.separators);
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
	multiPass: true,
	autocomplete: "media-$media"
};
const variantContrasts = [variantParentMatcher("contrast-more", "@media (prefers-contrast: more)"), variantParentMatcher("contrast-less", "@media (prefers-contrast: less)")];
const variantMotions = [variantParentMatcher("motion-reduce", "@media (prefers-reduced-motion: reduce)"), variantParentMatcher("motion-safe", "@media (prefers-reduced-motion: no-preference)")];
const variantOrientations = [variantParentMatcher("landscape", "@media (orientation: landscape)"), variantParentMatcher("portrait", "@media (orientation: portrait)")];
const variantForcedColors = [variantParentMatcher("forced-colors", "@media (forced-colors: active)")];
//#endregion
//#region src/variants/misc.ts
const variantSelector = {
	name: "selector",
	match(matcher, ctx) {
		const variant = variantGetBracket("selector-", matcher, ctx.generator.config.separators);
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
		const variant = variantGetParameter("layer-", matcher, ctx.generator.config.separators);
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
		const variant = variantGetParameter("uno-layer-", matcher, ctx.generator.config.separators);
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
		const variant = variantGetBracket("scope-", matcher, ctx.generator.config.separators);
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
		const [match, rest] = getBracket(matcher, "[", "]") ?? [];
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
		if (!hasThemeFn(matcher)) return;
		return {
			matcher,
			handle(input, next) {
				return next({
					...input,
					entries: JSON.parse(transformThemeFn(JSON.stringify(input.entries), ctx.theme))
				});
			}
		};
	}
};
const variantStickyHover = [variantMatcher("@hover", (input) => ({
	parent: `${input.parent ? `${input.parent} $$ ` : ""}@media (hover: hover) and (pointer: fine)`,
	selector: `${input.selector || ""}:hover`
}))];
const variantImplicitGroup = {
	name: "implicit-group",
	match(matcher, ctx) {
		const variant = variantGetParameter("in-", matcher, ctx.generator.config.separators);
		if (variant) {
			const [match, rest] = variant;
			const group = h.bracket(match) ?? match;
			if (group) return {
				matcher: rest,
				handle: (input, next) => next({
					...input,
					parent: `${input.parent ? `${input.parent} $$ ` : ""}${input.selector}`,
					selector: `:where(*:is(${group})) &`
				})
			};
		}
	}
};
//#endregion
//#region src/variants/negative.ts
const anchoredNumberRE = /^-?[0-9.]+(?:[a-z]+|%)?$/;
const numberRE = /-?[0-9.]+(?:[a-z]+|%)?/;
const spacingMultiplyRE = /var\(--spacing(?:-[\w-]+)?\)\s*\*\s*(-?[0-9.]+(?:[a-z]+|%)?)/;
const ignoreProps = [/\b(opacity|color|flex|backdrop-filter|^filter|^scale|transform|mask-image)\b/];
function negateMathFunction(value) {
	const match = value.match(cssMathFnRE) || value.match(cssVarFnRE);
	if (match) {
		const [fnBody, rest] = getStringComponent(`(${match[2]})${match[3]}`, "(", ")", " ") ?? [];
		if (fnBody) {
			const spacingMultiplyMatch = fnBody.match(spacingMultiplyRE);
			if (spacingMultiplyMatch) {
				const num = spacingMultiplyMatch[1];
				const nextNum = num.startsWith("-") ? num.slice(1) : `-${num}`;
				const nextFnBody = fnBody.replace(spacingMultiplyRE, (segment) => {
					return segment.replace(num, nextNum);
				});
				return `${match[1]}${nextFnBody}${rest ? ` ${rest}` : ""}`;
			}
			return `calc(${match[1]}${fnBody} * -1)${rest ? ` ${rest}` : ""}`;
		}
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
				for (const v of body) {
					const [prop, rawValue, meta] = v;
					if (typeof rawValue === "object") continue;
					if (meta && toArray(meta).includes("$$mini-no-negative")) continue;
					const value = rawValue?.toString();
					if (!value || value === "0" || ignoreProps.some((i) => i.test(prop))) continue;
					const nextValue = negateMathFunction(value) ?? negateFunctionBody(value) ?? (anchoredNumberRE.test(value) ? value.replace(numberRE, (i) => i.startsWith("-") ? i.slice(1) : `-${i}`) : void 0);
					if (!nextValue || nextValue === value) continue;
					v[1] = nextValue;
					changed = true;
				}
				if (changed) return body;
				return [];
			}
		};
	}
};
//#endregion
//#region src/variants/placeholder.ts
const placeholderModifier = (input, { theme }) => {
	const m = input.match(/^(.*)\b(placeholder-)(.+)$/);
	if (m) {
		const [, pre = "", p, body] = m;
		if (hasParseableColor(body, theme) || hasOpacityValue(body)) return { matcher: `${pre}placeholder-$ ${p}${body}` };
	}
};
function hasOpacityValue(body) {
	const match = body.match(/^op(?:acity)?-?(.+)$/);
	if (match && match[1] != null) return h.bracket.percent(match[1]) != null;
	return false;
}
//#endregion
//#region src/variants/pseudo.ts
function variantPseudoClassesAndElements() {
	return createPseudoClassesAndElements({
		getBracket,
		h,
		variantGetBracket
	});
}
function variantPseudoClassFunctions() {
	return createPseudoClassFunctions({
		getBracket,
		h,
		variantGetBracket
	});
}
function variantTaggedPseudoClasses(options = {}) {
	return createTaggedPseudoClasses(options, {
		getBracket,
		h,
		variantGetBracket
	});
}
const variantPartClasses = createPartClasses();
//#endregion
//#region src/variants/startingstyle.ts
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
//#region src/variants/supports.ts
const variantSupports = {
	name: "supports",
	match(matcher, ctx) {
		const variant = variantGetParameter("supports-", matcher, ctx.generator.config.separators);
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
//#region src/variants/default.ts
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
		variantNoscript,
		variantScripting,
		variantPrint,
		variantCustomMedia,
		...variantContrasts,
		...variantMotions,
		...variantOrientations,
		...variantForcedColors,
		variantBreakpoints(),
		...variantCombinators,
		...variantSvgCombinators,
		placeholderModifier,
		...variantPseudoClassesAndElements(),
		variantPseudoClassFunctions(),
		...variantTaggedPseudoClasses(options),
		variantPartClasses,
		...variantColorsMediaOrClass(options),
		...variantColorsScheme,
		...variantLanguageDirections,
		variantScope,
		...variantChildren,
		variantInert,
		variantContainerQuery,
		variantVariables,
		...variantTaggedDataAttributes,
		...variantTaggedAriaAttributes,
		variantTheme,
		...variantStickyHover,
		variantImplicitGroup
	].flat();
}
//#endregion
export { variantColorsMediaOrClass as A, variantOrientations as C, variantLanguageDirections as D, variantImportant as E, variantChildren as F, variantBreakpoints as I, variantAria as L, variantContainerQuery as M, variantCombinators as N, variantDataAttribute as O, variantSvgCombinators as P, variantTaggedAriaAttributes as R, variantNoscript as S, variantScripting as T, variantVariables as _, variantPseudoClassFunctions as a, variantForcedColors as b, placeholderModifier as c, variantImplicitGroup as d, variantInternalLayer as f, variantTheme as g, variantStickyHover as h, variantPartClasses as i, variantColorsScheme as j, variantTaggedDataAttributes as k, variantNegative as l, variantSelector as m, variantSupports as n, variantPseudoClassesAndElements as o, variantScope as p, variantStartingStyle as r, variantTaggedPseudoClasses as s, variants as t, variantCssLayer as u, variantContrasts as v, variantPrint as w, variantMotions as x, variantCustomMedia as y };
