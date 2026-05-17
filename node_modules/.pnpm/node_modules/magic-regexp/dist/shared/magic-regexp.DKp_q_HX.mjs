const NO_WRAP_RE = /^(?:\(.*\)|\\?.)$/;
function wrap(s) {
  const v = s.toString();
  return NO_WRAP_RE.test(v) ? v : `(?:${v})`;
}

const GROUPED_AS_REPLACE_RE = /^(?:\(\?:(.+)\)|(.+))$/;
const GROUPED_REPLACE_RE = /^(?:\(\?:(.+)\)([?+*]|\{[\d,]+\})?|(.+))$/;
function createInput(s) {
  const groupedAsFn = (key) => createInput(`(?<${key}>${`${s}`.replace(GROUPED_AS_REPLACE_RE, "$1$2")})`);
  return {
    toString: () => s.toString(),
    and: Object.assign((...inputs) => createInput(`${s}${exactly(...inputs)}`), {
      referenceTo: (groupName) => createInput(`${s}\\k<${groupName}>`)
    }),
    or: (...inputs) => createInput(`(?:${s}|${inputs.map((v) => exactly(v)).join("|")})`),
    after: (...input) => createInput(`(?<=${exactly(...input)})${s}`),
    before: (...input) => createInput(`${s}(?=${exactly(...input)})`),
    notAfter: (...input) => createInput(`(?<!${exactly(...input)})${s}`),
    notBefore: (...input) => createInput(`${s}(?!${exactly(...input)})`),
    times: Object.assign((number) => createInput(`${wrap(s)}{${number}}`), {
      any: () => createInput(`${wrap(s)}*`),
      atLeast: (min) => createInput(`${wrap(s)}{${min},}`),
      atMost: (max) => createInput(`${wrap(s)}{0,${max}}`),
      between: (min, max) => createInput(`${wrap(s)}{${min},${max}}`)
    }),
    optionally: () => createInput(`${wrap(s)}?`),
    as: groupedAsFn,
    groupedAs: groupedAsFn,
    grouped: () => createInput(`${s}`.replace(GROUPED_REPLACE_RE, "($1$3)$2")),
    at: {
      lineStart: () => createInput(`^${s}`),
      lineEnd: () => createInput(`${s}$`)
    }
  };
}

const ESCAPE_REPLACE_RE = /[.*+?^${}()|[\]\\/]/g;
function createCharInput(raw) {
  const input = createInput(`[${raw}]`);
  const from = (charFrom, charTo) => createCharInput(`${raw}${escapeCharInput(charFrom)}-${escapeCharInput(charTo)}`);
  const orChar = Object.assign((chars) => createCharInput(`${raw}${escapeCharInput(chars)}`), { from });
  return Object.assign(input, { orChar, from });
}
function escapeCharInput(raw) {
  return raw.replace(/[-\\^\]]/g, "\\$&");
}
const charIn = Object.assign((chars) => {
  return createCharInput(escapeCharInput(chars));
}, createCharInput(""));
const charNotIn = Object.assign((chars) => {
  return createCharInput(`^${escapeCharInput(chars)}`);
}, createCharInput("^"));
function anyOf(...inputs) {
  return createInput(`(?:${inputs.map((a) => exactly(a)).join("|")})`);
}
const char = createInput(".");
const word = createInput("\\b\\w+\\b");
const wordChar = createInput("\\w");
const wordBoundary = createInput("\\b");
const digit = createInput("\\d");
const whitespace = createInput("\\s");
const letter = Object.assign(createInput("[a-zA-Z]"), {
  lowercase: createInput("[a-z]"),
  uppercase: createInput("[A-Z]")
});
const tab = createInput("\\t");
const linefeed = createInput("\\n");
const carriageReturn = createInput("\\r");
const not = {
  word: createInput("\\W+"),
  wordChar: createInput("\\W"),
  wordBoundary: createInput("\\B"),
  digit: createInput("\\D"),
  whitespace: createInput("\\S"),
  letter: Object.assign(createInput("[^a-zA-Z]"), {
    lowercase: createInput("[^a-z]"),
    uppercase: createInput("[^A-Z]")
  }),
  tab: createInput("[^\\t]"),
  linefeed: createInput("[^\\n]"),
  carriageReturn: createInput("[^\\r]")
};
function maybe(...inputs) {
  return createInput(`${wrap(exactly(...inputs))}?`);
}
function exactly(...inputs) {
  return createInput(
    inputs.map((input) => typeof input === "string" ? input.replace(ESCAPE_REPLACE_RE, "\\$&") : input).join("")
  );
}
function oneOrMore(...inputs) {
  return createInput(`${wrap(exactly(...inputs))}+`);
}

const withIndices = "d";
const caseInsensitive = "i";
const global = "g";
const multiline = "m";
const dotAll = "s";
const unicode = "u";
const sticky = "y";

export { charIn as a, charNotIn as b, caseInsensitive as c, dotAll as d, exactly as e, anyOf as f, global as g, char as h, word as i, wordChar as j, wordBoundary as k, digit as l, multiline as m, whitespace as n, letter as o, linefeed as p, carriageReturn as q, not as r, sticky as s, tab as t, unicode as u, maybe as v, withIndices as w, oneOrMore as x };
