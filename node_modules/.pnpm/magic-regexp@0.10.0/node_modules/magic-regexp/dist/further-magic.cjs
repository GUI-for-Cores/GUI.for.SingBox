'use strict';

const flags = require('./shared/magic-regexp.DNdg2jII.cjs');
const regexp = require('type-level-regexp/regexp');

const createRegExp = (...inputs) => {
  const flags$1 = inputs.length > 1 && (Array.isArray(inputs[inputs.length - 1]) || inputs[inputs.length - 1] instanceof Set) ? inputs.pop() : void 0;
  return new RegExp(flags.exactly(...inputs).toString(), [...flags$1 || ""].join(""));
};

exports.anyOf = flags.anyOf;
exports.carriageReturn = flags.carriageReturn;
exports.caseInsensitive = flags.caseInsensitive;
exports.char = flags.char;
exports.charIn = flags.charIn;
exports.charNotIn = flags.charNotIn;
exports.digit = flags.digit;
exports.dotAll = flags.dotAll;
exports.exactly = flags.exactly;
exports.global = flags.global;
exports.letter = flags.letter;
exports.linefeed = flags.linefeed;
exports.maybe = flags.maybe;
exports.multiline = flags.multiline;
exports.not = flags.not;
exports.oneOrMore = flags.oneOrMore;
exports.sticky = flags.sticky;
exports.tab = flags.tab;
exports.unicode = flags.unicode;
exports.whitespace = flags.whitespace;
exports.withIndices = flags.withIndices;
exports.word = flags.word;
exports.wordBoundary = flags.wordBoundary;
exports.wordChar = flags.wordChar;
exports.spreadRegExpIterator = regexp.spreadRegExpIterator;
exports.spreadRegExpMatchArray = regexp.spreadRegExpMatchArray;
exports.createRegExp = createRegExp;
