function createRegExp(pattern, flags) {
  return new RegExp(pattern, [...flags || ""].join(""));
}
function spreadRegExpMatchArray(matchArray) {
  return matchArray ? [...matchArray] : null;
}
function spreadRegExpIterator(iterableIterator) {
  return iterableIterator ? [...iterableIterator] : null;
}

export { createRegExp, spreadRegExpIterator, spreadRegExpMatchArray };
