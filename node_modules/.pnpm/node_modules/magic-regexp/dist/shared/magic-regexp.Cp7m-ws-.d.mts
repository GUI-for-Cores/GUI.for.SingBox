type Flag = 'd' | 'g' | 'i' | 'm' | 's' | 'u' | 'y';
/** Generate indices for substring matches */
declare const withIndices = "d";
/** Case-insensitive search */
declare const caseInsensitive = "i";
/** Global search */
declare const global = "g";
/** Multi-line search */
declare const multiline = "m";
/** Allows `.` to match newline characters */
declare const dotAll = "s";
/** Treat a pattern as a sequence of unicode code points */
declare const unicode = "u";
/** Perform a "sticky" search that matches starting at the current position in the target string */
declare const sticky = "y";

type Join<T extends string[], Prefix extends string = '', Joiner extends string = '|'> = T extends [infer F, ...infer R] ? F extends string ? `${Prefix}${F}${R extends string[] ? Join<R, Joiner, Joiner> : ''}` : '' : '';
type UnionToIntersection<Union> = (Union extends Union ? (a: Union) => any : never) extends (a: infer I) => any ? I : never;
type UnionToTuple<Union, Tuple extends any[] = []> = UnionToIntersection<Union extends any ? () => Union : never> extends () => infer Item ? UnionToTuple<Exclude<Union, Item>, [...Tuple, Item]> : Tuple;

declare const NamedGroupsS: unique symbol;
declare const ValueS: unique symbol;
declare const CapturedGroupsArrS: unique symbol;
declare const FlagsS: unique symbol;
type MagicRegExp<Value extends string, NamedGroups extends string | never = never, CapturedGroupsArr extends (string | undefined)[] = [], Flags extends string | never = never> = RegExp & {
    [NamedGroupsS]: NamedGroups;
    [CapturedGroupsArrS]: CapturedGroupsArr;
    [ValueS]: Value;
    [FlagsS]: Flags;
};
type ExtractGroups<T extends MagicRegExp<string, string, (string | undefined)[], string>> = T extends MagicRegExp<string, infer V, (string | undefined)[], string> ? V : never;
type StringWithHint<S extends string> = string & {
    _capturedBy: S;
};
type StringCapturedBy<S extends string> = StringWithHint<S>;
type MapToStringCapturedBy<Ar extends (string | undefined)[]> = {
    [K in keyof Ar]: Ar[K] extends string ? StringCapturedBy<Ar[K]> | undefined : undefined;
};
type MagicRegExpMatchArray<T extends MagicRegExp<string, string, any[], string>> = Omit<RegExpMatchArray, 'groups'> & {
    groups: Record<ExtractGroups<T>, string | undefined>;
} & {
    [index: number | string | symbol]: never;
} & (T extends MagicRegExp<string, string, infer CapturedGroupsArr, string> ? readonly [string | undefined, ...MapToStringCapturedBy<CapturedGroupsArr>] : {});

type IfUnwrapped<Value extends string, Yes, No> = Value extends `(${string})` ? No : StripEscapes<Value> extends `${infer A}${infer B}` ? A extends '' ? No : B extends '' ? No : Yes : never;

/** This matches any character in the string provided */
declare const charIn: (<T extends string>(chars: T) => CharInput<Escape<T, "^" | "]" | "\\" | "-">>) & CharInput<"">;
/** This matches any character that is not in the string provided */
declare const charNotIn: (<T extends string>(chars: T) => CharInput<`^${Escape<T, "^" | "]" | "\\" | "-">}`>) & CharInput<"^">;
/**
 * This takes a variable number of inputs and matches any of them
 * @example
 * anyOf('foo', maybe('bar'), 'baz') // => /(?:foo|(?:bar)?|baz)/
 * @argument inputs - arbitrary number of `string` or `Input`, where `string` will be escaped
 */
declare function anyOf<Inputs extends InputSource[]>(...inputs: Inputs): Input<`(?:${Join<MapToValues<Inputs>>})`, MapToGroups<Inputs>, MapToCapturedGroupsArr<Inputs>>;
declare const char: Input<".", never, []>;
declare const word: Input<"\\b\\w+\\b", never, []>;
declare const wordChar: Input<"\\w", never, []>;
declare const wordBoundary: Input<"\\b", never, []>;
declare const digit: Input<"\\d", never, []>;
declare const whitespace: Input<"\\s", never, []>;
declare const letter: Input<"[a-zA-Z]", never, []> & {
    lowercase: Input<"[a-z]", never, []>;
    uppercase: Input<"[A-Z]", never, []>;
};
declare const tab: Input<"\\t", never, []>;
declare const linefeed: Input<"\\n", never, []>;
declare const carriageReturn: Input<"\\r", never, []>;
declare const not: {
    word: Input<"\\W+", never, []>;
    wordChar: Input<"\\W", never, []>;
    wordBoundary: Input<"\\B", never, []>;
    digit: Input<"\\D", never, []>;
    whitespace: Input<"\\S", never, []>;
    letter: Input<"[^a-zA-Z]", never, []> & {
        lowercase: Input<"[^a-z]", never, []>;
        uppercase: Input<"[^A-Z]", never, []>;
    };
    tab: Input<"[^\\t]", never, []>;
    linefeed: Input<"[^\\n]", never, []>;
    carriageReturn: Input<"[^\\r]", never, []>;
};
/**
 * Equivalent to `?` - takes a variable number of inputs and marks them as optional
 * @example
 * maybe('foo', exactly('ba?r')) // => /(?:fooba\?r)?/
 * @argument inputs - arbitrary number of `string` or `Input`, where `string` will be escaped
 */
declare function maybe<Inputs extends InputSource[], Value extends string = Join<MapToValues<Inputs>, '', ''>>(...inputs: Inputs): Input<IfUnwrapped<Value, `(?:${Value})?`, `${Value}?`>, MapToGroups<Inputs>, MapToCapturedGroupsArr<Inputs>>;
/**
 * This takes a variable number of inputs and concatenate their patterns, and escapes string inputs to match it exactly
 * @example
 * exactly('fo?o', maybe('bar')) // => /fo\?o(?:bar)?/
 * @argument inputs - arbitrary number of `string` or `Input`, where `string` will be escaped
 */
declare function exactly<Inputs extends InputSource[]>(...inputs: Inputs): Input<Join<MapToValues<Inputs>, '', ''>, MapToGroups<Inputs>, MapToCapturedGroupsArr<Inputs>>;
/**
 * Equivalent to `+` - this takes a variable number of inputs and marks them as repeatable, any number of times but at least once
 * @example
 * oneOrMore('foo', maybe('bar')) // => /(?:foo(?:bar)?)+/
 * @argument inputs - arbitrary number of `string` or `Input`, where `string` will be escaped
 */
declare function oneOrMore<Inputs extends InputSource[], Value extends string = Join<MapToValues<Inputs>, '', ''>>(...inputs: Inputs): Input<IfUnwrapped<Value, `(?:${Value})+`, `${Value}+`>, MapToGroups<Inputs>, MapToCapturedGroupsArr<Inputs>>;

type Escape<T extends string, EscapeChar extends string> = T extends `${infer Start}${EscapeChar}${string}` ? Start extends `${string}${EscapeChar}${string}` ? never : T extends `${Start}${infer Char}${string}` ? Char extends EscapeChar ? T extends `${Start}${Char}${infer Rest}` ? `${Start}\\${Char}${Escape<Rest, EscapeChar>}` : never : never : never : T;
type EscapeChar<T extends string> = Escape<T, '\\' | '^' | '-' | ']'>;
type StripEscapes<T extends string> = T extends `${infer A}\\${infer B}` ? `${A}${B}` : T;
type ExactEscapeChar = '.' | '*' | '+' | '?' | '^' | '$' | '{' | '}' | '(' | ')' | '|' | '[' | ']' | '/';
type GetValue<T extends InputSource> = T extends string ? Escape<T, ExactEscapeChar> : T extends Input<infer R> ? R : never;

interface Input<V extends string, G extends string = never, C extends (string | undefined)[] = []> {
    /**
     * this  takes a variable number of inputs and adds them as new pattern to the current input, or you can use `and.referenceTo(groupName)` to adds a new pattern referencing to a named group
     * @example
     * exactly('foo').and('bar', maybe('baz')) // => /foobar(?:baz)?/
     * @argument inputs - arbitrary number of `string` or `Input`, where `string` will be escaped
     */
    and: {
        <I extends InputSource[], CG extends any[] = MapToCapturedGroupsArr<I>>(...inputs: I): Input<`${V}${Join<MapToValues<I>, '', ''>}`, G | MapToGroups<I>, [...C, ...CG]>;
        /** this adds a new pattern to the current input, with the pattern reference to a named group. */
        referenceTo: <N extends G>(groupName: N) => Input<`${V}\\k<${N}>`, G, C>;
    };
    /**
     * this takes a variable number of inputs and provides as an alternative to the current input
     * @example
     * exactly('foo').or('bar', maybe('baz')) // => /foo|bar(?:baz)?/
     * @argument inputs - arbitrary number of `string` or `Input`, where `string` will be escaped
     */
    or: <I extends InputSource[], CG extends any[] = MapToCapturedGroupsArr<I>>(...inputs: I) => Input<`(?:${V}|${Join<MapToValues<I>, '', ''>})`, G | MapToGroups<I>, [...C, ...CG]>;
    /**
     * this takes a variable number of inputs and activate a positive lookbehind. Make sure to check [browser support](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp#browser_compatibility) as not all browsers support lookbehinds (notably Safari)
     * @example
     * exactly('foo').after('bar', maybe('baz')) // => /(?<=bar(?:baz)?)foo/
     * @argument inputs - arbitrary number of `string` or `Input`, where `string` will be escaped
     */
    after: <I extends InputSource[], CG extends any[] = MapToCapturedGroupsArr<I>>(...inputs: I) => Input<`(?<=${Join<MapToValues<I>, '', ''>})${V}`, G | MapToGroups<I>, [...CG, ...C]>;
    /**
     * this takes a variable number of inputs and activate a positive lookahead
     * @example
     * exactly('foo').before('bar', maybe('baz')) // => /foo(?=bar(?:baz)?)/
     * @argument inputs - arbitrary number of `string` or `Input`, where `string` will be escaped
     */
    before: <I extends InputSource[], CG extends any[] = MapToCapturedGroupsArr<I>>(...inputs: I) => Input<`${V}(?=${Join<MapToValues<I>, '', ''>})`, G, [...C, ...CG]>;
    /**
     * these takes a variable number of inputs and activate a negative lookbehind. Make sure to check [browser support](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp#browser_compatibility) as not all browsers support lookbehinds (notably Safari)
     * @example
     * exactly('foo').notAfter('bar', maybe('baz')) // => /(?<!bar(?:baz)?)foo/
     * @argument inputs - arbitrary number of `string` or `Input`, where `string` will be escaped
     */
    notAfter: <I extends InputSource[], CG extends any[] = MapToCapturedGroupsArr<I, true>>(...inputs: I) => Input<`(?<!${Join<MapToValues<I>, '', ''>})${V}`, G, [...CG, ...C]>;
    /**
     * this takes a variable number of inputs and activate a negative lookahead
     * @example
     * exactly('foo').notBefore('bar', maybe('baz')) // => /foo(?!bar(?:baz)?)/
     * @argument inputs - arbitrary number of `string` or `Input`, where `string` will be escaped
     */
    notBefore: <I extends InputSource[], CG extends any[] = MapToCapturedGroupsArr<I, true>>(...inputs: I) => Input<`${V}(?!${Join<MapToValues<I>, '', ''>})`, G, [...C, ...CG]>;
    /** repeat the previous pattern an exact number of times */
    times: {
        <N extends number, NV extends string = IfUnwrapped<V, `(?:${V}){${N}}`, `${V}{${N}}`>>(number: N): Input<NV, G, C>;
        /** specify that the expression can repeat any number of times, _including none_ */
        any: <NV extends string = IfUnwrapped<V, `(?:${V})*`, `${V}*`>>() => Input<NV, G, C>;
        /** specify that the expression must occur at least `N` times */
        atLeast: <N extends number, NV extends string = IfUnwrapped<V, `(?:${V}){${N},}`, `${V}{${N},}`>>(number: N) => Input<NV, G, C>;
        /** specify that the expression must occur at most `N` times */
        atMost: <N extends number, NV extends string = IfUnwrapped<V, `(?:${V}){0,${N}}`, `${V}{0,${N}}`>>(number: N) => Input<NV, G, C>;
        /** specify a range of times to repeat the previous pattern */
        between: <Min extends number, Max extends number, NV extends string = IfUnwrapped<V, `(?:${V}){${Min},${Max}}`, `${V}{${Min},${Max}}`>>(min: Min, max: Max) => Input<NV, G, C>;
    };
    /** this defines the entire input so far as a named capture group. You will get type safety when using the resulting RegExp with `String.match()`. Alias for `groupedAs` */
    as: <K extends string>(key: K) => Input<V extends `(?:${infer S})` ? `(?<${K}>${S})` : `(?<${K}>${V})`, G | K, [
        V extends `(?:${infer S})` ? `(?<${K}>${S})` : `(?<${K}>${V})`,
        ...C
    ]>;
    /** this defines the entire input so far as a named capture group. You will get type safety when using the resulting RegExp with `String.match()` */
    groupedAs: <K extends string>(key: K) => Input<V extends `(?:${infer S})` ? `(?<${K}>${S})` : `(?<${K}>${V})`, G | K, [
        V extends `(?:${infer S})` ? `(?<${K}>${S})` : `(?<${K}>${V})`,
        ...C
    ]>;
    /** this capture the entire input so far as an anonymous group */
    grouped: () => Input<V extends `(?:${infer S})${infer E}` ? `(${S})${E}` : `(${V})`, G, [
        V extends `(?:${infer S})${'' | '?' | '+' | '*' | `{${string}}`}` ? `(${S})` : `(${V})`,
        ...C
    ]>;
    /** this allows you to match beginning/ends of lines with `at.lineStart()` and `at.lineEnd()` */
    at: {
        lineStart: () => Input<`^${V}`, G, C>;
        lineEnd: () => Input<`${V}$`, G, C>;
    };
    /** this allows you to mark the input so far as optional */
    optionally: <NV extends string = IfUnwrapped<V, `(?:${V})?`, `${V}?`>>() => Input<NV, G, C>;
    toString: () => string;
}
interface CharInput<T extends string> extends Input<`[${T}]`> {
    orChar: (<Or extends string>(chars: Or) => CharInput<`${T}${EscapeChar<Or>}`>) & CharInput<T>;
    from: <From extends string, To extends string>(charFrom: From, charTo: To) => CharInput<`${T}${EscapeChar<From>}-${EscapeChar<To>}`>;
}

type InputSource<S extends string = string, T extends string = never> = S | Input<any, T>;
type MapToValues<T extends InputSource[]> = T extends [
    infer First,
    ...infer Rest extends InputSource[]
] ? First extends InputSource ? [GetValue<First>, ...MapToValues<Rest>] : [] : [];
type MapToGroups<T extends InputSource[]> = T extends [
    infer First,
    ...infer Rest extends InputSource[]
] ? First extends Input<any, infer K> ? K | MapToGroups<Rest> : MapToGroups<Rest> : never;
type MapToCapturedGroupsArr<Inputs extends any[], MapToUndefined extends boolean = false, CapturedGroupsArr extends any[] = [], Count extends any[] = []> = Count['length'] extends Inputs['length'] ? CapturedGroupsArr : Inputs[Count['length']] extends Input<any, any, infer CaptureGroups> ? [CaptureGroups] extends [never] ? MapToCapturedGroupsArr<Inputs, MapToUndefined, [...CapturedGroupsArr], [...Count, '']> : MapToUndefined extends true ? MapToCapturedGroupsArr<Inputs, MapToUndefined, [
    ...CapturedGroupsArr,
    undefined
], [
    ...Count,
    ''
]> : MapToCapturedGroupsArr<Inputs, MapToUndefined, [
    ...CapturedGroupsArr,
    ...CaptureGroups
], [
    ...Count,
    ''
]> : MapToCapturedGroupsArr<Inputs, MapToUndefined, [...CapturedGroupsArr], [...Count, '']>;

export { maybe as A, exactly as B, oneOrMore as C, type MapToStringCapturedBy as D, type Flag as F, type InputSource as I, type Join as J, type MagicRegExp as M, type StringCapturedBy as S, type UnionToTuple as U, type MagicRegExpMatchArray as a, type MapToValues as b, type MapToGroups as c, type MapToCapturedGroupsArr as d, caseInsensitive as e, dotAll as f, global as g, type Input as h, charIn as i, charNotIn as j, anyOf as k, char as l, multiline as m, word as n, wordChar as o, wordBoundary as p, digit as q, whitespace as r, sticky as s, letter as t, unicode as u, tab as v, withIndices as w, linefeed as x, carriageReturn as y, not as z };
