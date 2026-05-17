import { e as exactly } from './shared/magic-regexp.DKp_q_HX.mjs';
export { f as anyOf, q as carriageReturn, c as caseInsensitive, h as char, a as charIn, b as charNotIn, l as digit, d as dotAll, g as global, o as letter, p as linefeed, v as maybe, m as multiline, r as not, x as oneOrMore, s as sticky, t as tab, u as unicode, n as whitespace, w as withIndices, i as word, k as wordBoundary, j as wordChar } from './shared/magic-regexp.DKp_q_HX.mjs';
export { spreadRegExpIterator, spreadRegExpMatchArray } from 'type-level-regexp/regexp';

const createRegExp = (...inputs) => {
  const flags = inputs.length > 1 && (Array.isArray(inputs[inputs.length - 1]) || inputs[inputs.length - 1] instanceof Set) ? inputs.pop() : void 0;
  return new RegExp(exactly(...inputs).toString(), [...flags || ""].join(""));
};

export { createRegExp, exactly };
