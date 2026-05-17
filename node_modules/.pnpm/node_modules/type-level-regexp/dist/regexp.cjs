'use strict';

function createRegExp(pattern, flags) {
  return new RegExp(pattern, [...flags || ""].join(""));
}
function spreadRegExpMatchArray(matchArray) {
  return matchArray ? [...matchArray] : null;
}
function spreadRegExpIterator(iterableIterator) {
  return iterableIterator ? [...iterableIterator] : null;
}

exports.createRegExp = createRegExp;
exports.spreadRegExpIterator = spreadRegExpIterator;
exports.spreadRegExpMatchArray = spreadRegExpMatchArray;
