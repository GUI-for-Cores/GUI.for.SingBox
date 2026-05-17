import regexpTree from 'regexp-tree';

function build(node) {
  if (node === null)
    return "";
  switch (node.type) {
    case "CharacterClass": {
      const exprs = combineContinuousSimpleChars(node.expressions);
      if (exprs.length === 1) {
        const first = exprs[0];
        if (typeof first === "string") {
          return node.negative ? `charNotIn(${first})` : `charIn(${first})`;
        } else if (first.type === "Char" && first.kind === "meta" && node.negative) {
          if (first.value === "\\t")
            return `not.tab`;
          if (first.value === "\\n")
            return `not.linefeed`;
          if (first.value === "\\r")
            return `not.carriageReturn`;
        } else {
          const range = normalizeClassRange(first);
          if (range === "A-Z")
            return node.negative ? `not.letter.uppercase` : `letter.uppercase`;
          else if (range === "a-z")
            return node.negative ? `not.letter.lowercase` : `letter.lowercase`;
        }
      } else if (exprs.length === 2) {
        if (typeof exprs[0] !== "string" && typeof exprs[1] !== "string") {
          const range1 = normalizeClassRange(exprs[0]);
          const range2 = normalizeClassRange(exprs[1]);
          if (range1 === "A-Z" && range2 === "a-z" || range1 === "a-z" && range2 === "A-Z")
            return node.negative ? `not.letter` : `letter`;
        }
      }
      throw new Error("Unsupported for Complex charactor class");
    }
    case "Disjunction":
      return chain(build(node.left), `or(${build(node.right)})`);
    case "Assertion":
      switch (node.kind) {
        case "\\b":
          return "wordBoundary";
        case "\\B":
          return "not.wordBoundary";
        case "^":
          return chain("", "at.lineStart()");
        case "$":
          return chain("", "at.lineEnd()");
        case "Lookbehind":
          return chain("", `${node.negative ? "notAfter" : "after"}(${build(node.assertion)})`);
        case "Lookahead":
          return chain("", `${node.negative ? "notBefore" : "before"}(${build(node.assertion)})`);
        /* v8 ignore next 2 */
        default:
          throw new TypeError(`Unknown Assertion kind: ${node.kind}`);
      }
    case "Char":
      if (node.kind === "meta") {
        switch (node.value) {
          case ".":
            return "char";
          case "\\w":
            return "wordChar";
          case "\\d":
            return "digit";
          case "\\s":
            return "whitespace";
          case "\\t":
            return "tab";
          case "\\n":
            return "linefeed";
          case "\\r":
            return "carriageReturn";
          case "\\W":
            return "not.wordChar";
          case "\\D":
            return "not.digit";
          case "\\S":
            return "not.whitespace";
          case "\f":
          case "\v":
          default:
            throw new Error(`Unsupported Meta Char: ${node.value}`);
        }
      } else {
        const char = getChar(node);
        if (char === null)
          throw new Error(`Unknown Char: ${node.value}`);
        return `'${char}'`;
      }
    case "Repetition": {
      const quantifier = node.quantifier;
      const expr = build(node.expression);
      const lazy = !quantifier.greedy;
      if (lazy)
        throw new Error("Unsupported for lazy quantifier");
      switch (quantifier.kind) {
        case "+":
          return `oneOrMore(${expr})`;
        case "?":
          return `maybe(${expr})`;
        case "*":
          return chain(expr, "times.any()");
        case "Range":
          if (quantifier.from === quantifier.to)
            return chain(expr, `times(${quantifier.from})`);
          else if (!quantifier.to)
            return chain(expr, `times.atLeast(${quantifier.from})`);
          else if (quantifier.from === 0)
            return chain(expr, `times.atMost(${quantifier.to})`);
          return chain(expr, `times.between(${quantifier.from}, ${quantifier.to})`);
        /* v8 ignore next 2 */
        default:
          return "";
      }
    }
    case "Alternative": {
      const alts = combineContinuousSimpleChars(node.expressions);
      const exprs = [];
      for (let i = 0; i < alts.length; i++) {
        const alt = alts[i];
        if (typeof alt === "string") {
          exprs.push(alt);
          continue;
        }
        if (alt.type === "Assertion") {
          switch (alt.kind) {
            case "^": {
              const next = alts[++i];
              if (next === void 0)
                throw new Error(`Unexpected assertion: ${JSON.stringify(alt)}`);
              exprs.push(chain(next, "at.lineStart()"));
              continue;
            }
            case "$": {
              const prev = exprs.pop();
              if (prev === void 0)
                throw new Error(`Unexpected assertion: ${JSON.stringify(alt)}`);
              exprs.push(chain(prev, "at.lineEnd()"));
              continue;
            }
            case "Lookbehind": {
              const next = alts[++i];
              if (next === void 0)
                throw new Error(`Unexpected assertion: ${JSON.stringify(alt)}`);
              const helper = alt.negative ? "notAfter" : "after";
              exprs.push(chain(next, `${helper}(${build(alt.assertion)})`));
              continue;
            }
            case "Lookahead": {
              const prev = exprs.pop();
              if (prev === void 0)
                throw new Error(`Unexpected assertion: ${JSON.stringify(alt)}`);
              const helper = alt.negative ? "notBefore" : "before";
              exprs.push(chain(prev, `${helper}(${build(alt.assertion)})`));
              continue;
            }
          }
        }
        if (alt.type === "Backreference") {
          if (alt.kind !== "name")
            throw new Error(`Unsupport for number reference`);
          const ref = chain(`exactly(${exprs.join(", ")})`, `and.referenceTo('${alt.reference}')`);
          exprs.length = 0;
          exprs.push(ref);
          continue;
        }
        exprs.push(build(alt));
      }
      return exprs.join(", ");
    }
    case "Group":
      if (node.capturing)
        return chain(build(node.expression), node.name ? `as('${node.name}')` : "grouped()");
      else return chain(build(node.expression));
    /* v8 ignore next 2 */
    case "Backreference":
      return chain("", `and.referenceTo('${node.reference}')`);
  }
}
function normalizeClassRange(node) {
  if (node.type === "ClassRange")
    return `${node.from.value}-${node.to.value}`;
}
function combineContinuousSimpleChars(expressions) {
  let simpleChars = "";
  const exprs = expressions.reduce(
    (acc, expr) => {
      const char = expr.type === "Char" ? getChar(expr) : null;
      if (char !== null) {
        simpleChars += char;
      } else {
        if (simpleChars) {
          acc.push(`'${simpleChars}'`);
          simpleChars = "";
        }
        acc.push(expr);
      }
      return acc;
    },
    []
  );
  if (simpleChars)
    exprs.push(`'${simpleChars}'`);
  return exprs;
}
function getChar(char) {
  function escapeSimpleChar(char2) {
    return char2 === "'" ? "\\'" : char2;
  }
  switch (char.kind) {
    case "simple":
      return escapeSimpleChar(char.value);
    case "oct":
    case "decimal":
    case "hex":
    case "unicode":
      if ("symbol" in char)
        return escapeSimpleChar(char.symbol);
  }
  return null;
}
function chain(expr, helper) {
  let _expr = "";
  if (typeof expr === "string") {
    if (expr === "")
      _expr = "exactly('')";
    else _expr = expr.startsWith("'") && expr.endsWith("'") ? `exactly(${expr})` : expr;
  } else {
    _expr = build(expr);
  }
  return helper ? `${_expr}.${helper}` : _expr;
}
function buildFlags(flags) {
  if (!flags)
    return "";
  const readableFlags = flags.split("").map((flag) => {
    return {
      d: "withIndices",
      i: "caseInsensitive",
      g: "global",
      m: "multiline",
      s: "dotAll",
      u: "unicode",
      y: "sticky"
    }[flag] || `'${flag}'`;
  });
  return `[${readableFlags.join(", ")}]`;
}
function convert(regex, { argsOnly = false } = {}) {
  const ast = regexpTree.parse(regex);
  if (ast.type !== "RegExp")
    throw new TypeError(`Unexpected RegExp AST: ${ast.type}`);
  const flags = buildFlags(ast.flags);
  const args = build(ast.body) + (flags ? `, ${flags}` : "");
  return argsOnly ? args : `createRegExp(${args})`;
}

export { convert };
