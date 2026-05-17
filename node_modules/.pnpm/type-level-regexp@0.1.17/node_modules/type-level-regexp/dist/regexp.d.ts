type UppercaseLetter = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
type LowercaseLetter = 'abcdefghijklmnopqrstuvwxyz';
type Digit = '0123456789';
type Alphanumeric = `_${Digit}${UppercaseLetter}${LowercaseLetter}`;
type Whitespace = ` \f\n\r\t\v\u00a0\u1680\u2000\u200a\u2028\u2029\u202f\u205f\u3000\ufeff`;
type CommonChar = `!"#$%&'()*+,-./${Digit}:;<=>?@${UppercaseLetter}[\\]^_\`${LowercaseLetter}{|}~ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡ΢ΣΤΥΦΧΨΩΪΫάέήίΰαβγδεζηθικλμνξοπρςστυφχψω`;
type CaseMap = {
    a: 'A';
    b: 'B';
    c: 'C';
    d: 'D';
    e: 'E';
    f: 'F';
    g: 'G';
    h: 'H';
    i: 'I';
    j: 'J';
    k: 'K';
    l: 'L';
    m: 'M';
    n: 'N';
    o: 'O';
    p: 'P';
    q: 'Q';
    r: 'R';
    s: 'S';
    t: 'T';
    u: 'U';
    v: 'V';
    w: 'W';
    x: 'X';
    y: 'Y';
    z: 'Z';
    A: 'a';
    B: 'b';
    C: 'c';
    D: 'd';
    E: 'e';
    F: 'f';
    G: 'g';
    H: 'h';
    I: 'i';
    J: 'j';
    K: 'k';
    L: 'l';
    M: 'm';
    N: 'n';
    O: 'o';
    P: 'p';
    Q: 'q';
    R: 'r';
    S: 's';
    T: 't';
    U: 'u';
    V: 'v';
    W: 'w';
    X: 'x';
    Y: 'y';
    Z: 'z';
};
interface CharSetMap<CharSet extends string = string, ResolvedCharSet extends string = ResolveCharSet<CharSet>> {
    step: CharSet;
    whitespace: Whitespace;
    nonWhitespace: Whitespace;
    char: Alphanumeric;
    nonChar: Alphanumeric;
    digit: Digit;
    nonDigit: Digit;
    charSet: ResolvedCharSet;
    notCharSet: ResolvedCharSet;
    boundary: string;
    nonBoundary: string;
}
type InvertCharSetMap = {
    any: 'any';
    whitespace: 'nonWhitespace';
    nonWhitespace: 'whitespace';
    char: 'nonChar';
    nonChar: 'char';
    digit: 'nonDigit';
    nonDigit: 'digit';
    charSet: 'notCharSet';
    notCharSet: 'charSet';
};
type ResolveCharSet<CharSet extends string, Result extends string = ''> = CharSet extends `${infer Before}-${infer To}${infer Rest}` ? LastCharOfOr<Before, ''> extends infer From extends string ? Before extends `${infer Set}${From}` ? ResolveCharSet<Rest, `${Result}${Set}${ResolveRangeSet<From, To>}`> : never : never : `${Result}${CharSet}`;
type ResolveRangeSet<From extends string, To extends string> = CommonChar extends `${string}${From}${infer Between}${To}${string}` ? `${From}${Between}${To}` : 'invalid range';
type Matcher = {
    type: 'string' | 'charSet' | 'notCharSet' | 'backreference';
    value: string;
} | {
    type: 'any' | Exclude<keyof CharSetMap, 'charSet' | 'notCharSet'> | 'endMark' | 'debug';
} | {
    type: 'capture' | 'startOf' | 'endOf' | 'captureLast' | 'not';
    value: Matcher[];
} | {
    type: 'optional';
    value: Matcher[];
    greedy: boolean;
    repeat?: [from: any[], to: string];
} | {
    type: 'zeroOrMore' | 'oneOrMore';
    value: Matcher[];
    greedy: boolean;
} | {
    type: 'namedCapture';
    value: Matcher[];
    name: string;
} | {
    type: 'lookahead' | 'lookbehind';
    value: Matcher[];
    positive: boolean;
} | {
    type: 'repeat';
    value: Matcher[];
    from: `${number}`;
    to: `${number}` | '' | string;
    greedy: boolean;
} | {
    type: 'or';
    value: Matcher[][];
};
type NamedCapturesTuple = [any, string | undefined];
interface MatchedResult<MatchedArray extends (string | undefined)[], RestInputString extends string, NamedCaptures extends NamedCapturesTuple = never> {
    matched: true;
    results: MatchedArray;
    namedCaptures: NamedCaptures;
    restInputString: RestInputString;
}
interface NullResult<PartialMatched extends string | undefined = undefined, DebugObj = unknown, Abort extends boolean = false> {
    matched: false;
    results: null;
    partialMatched: PartialMatched;
    abort: Abort;
    debugObj: DebugObj;
}
type LengthOfString<String extends string, Count extends any[] = [], Length extends number = Count['length']> = Length extends 990 ? number : String extends `${string}${infer R}` ? LengthOfString<R, [...Count, '']> : Length;
type ConcatParialMatched<PartialMatched extends string | undefined, NestedNullResult, NestedPartialMatched extends string = NestedNullResult extends NullResult<infer Partial extends string, any, any> ? Partial : never> = `${PartialMatched}${NestedPartialMatched}`;
type ConcatToFirstElement<Arr extends (string | undefined)[], AppendingString extends string | undefined> = Arr extends [infer First extends string, ...infer Rest] ? [`${First}${AppendingString}`, ...Rest] : [];
type IndexOf<Array extends any[], Item, Count extends any[] = []> = Array extends [
    infer First,
    ...infer Rest
] ? Item extends First ? Count : IndexOf<Rest, Item, [...Count, '']> : never;
type LastCharOfOr<InputString, Or extends string = ' '> = InputString extends `${infer First}${infer Rest}` ? Rest extends '' ? First : LastCharOfOr<Rest> : Or;
type StringToUnion<S extends string, Original extends string = S, Union extends string = never, Count extends any[] = []> = Count['length'] extends 13 ? `[ any char in [${Original}] ]` : S extends `${infer Char}${infer Rest}` ? StringToUnion<Rest, Original, Union | Char, [...Count, '']> : Union;
type SliceMatchers<Matchers extends Matcher[], Start extends any[], Result extends Matcher[] = []> = Start['length'] extends Matchers['length'] ? Result : SliceMatchers<Matchers, [...Start, ''], [...Result, Matchers[Start['length']]]>;
type TupleItemExtendsType<Tuple extends any[], Index extends any[], TargetType> = Tuple[Index['length']] extends TargetType ? true : false;
type Flatten<Source extends any[], Result extends any[] = []> = Source extends [infer X, ...infer Y] ? X extends any[] ? Flatten<[...X, ...Y], Result> : Flatten<[...Y], [...Result, X]> : Result;
type CountNumOfCaptureGroupsAs<Matchers extends Matcher[], As = undefined, Count extends any[] = []> = Matchers extends [] ? Count : Matchers extends [infer CurrentMatcher, ...infer RestMatchers extends Matcher[]] ? CurrentMatcher extends {
    type: infer Type;
    value: infer NestedMatchers extends Matcher[];
} ? CountNumOfCaptureGroupsAs<RestMatchers, As, [
    ...Count,
    ...CountNumOfCaptureGroupsAs<NestedMatchers>,
    ...(Type extends 'capture' | 'namedCapture' ? [As] : [])
]> : CurrentMatcher extends {
    type: infer Type;
    value: infer ArrayOfNestedMatchers extends Matcher[][];
} ? CountNumOfCaptureGroupsAs<RestMatchers, As, [
    ...Count,
    ...CountNumOfCaptureGroupsAs<Flatten<ArrayOfNestedMatchers>>,
    ...(Type extends 'capture' | 'namedCapture' ? [As] : [])
]> : CountNumOfCaptureGroupsAs<RestMatchers, As, Count> : never;
type ResolveOrCaptureTuple<AllPossibleMatchers extends Matcher[][], CapturedResults extends any[], CapturedIndex extends any[], Index extends any[] = [], ResultTuple extends any[] = []> = AllPossibleMatchers extends [] ? ResultTuple : AllPossibleMatchers extends [
    infer CurrentMatchers extends Matcher[],
    ...infer RestPossibleMatchers extends Matcher[][]
] ? Index['length'] extends CapturedIndex['length'] ? ResolveOrCaptureTuple<RestPossibleMatchers, CapturedResults, CapturedIndex, [
    ...Index,
    ''
], [
    ...ResultTuple,
    ...CapturedResults
]> : ResolveOrCaptureTuple<RestPossibleMatchers, CapturedResults, CapturedIndex, [
    ...Index,
    ''
], [
    ...ResultTuple,
    ...CountNumOfCaptureGroupsAs<CurrentMatchers>
]> : never;
type CollectCaptureNames<Matchers extends Matcher[], Names extends string = never> = Matchers extends [] ? Names : Matchers extends [infer CurrentMatcher, ...infer RestMatchers extends Matcher[]] ? CurrentMatcher extends {
    value: infer NestedMatchers extends Matcher[];
} ? CollectCaptureNames<RestMatchers, Names | CurrentMatcher extends {
    type: 'namedCapture';
    name: infer CurrentName extends string;
} ? CurrentName | CollectCaptureNames<NestedMatchers> : never | CollectCaptureNames<NestedMatchers>> : CurrentMatcher extends {
    value: infer NestedMatchersArray extends Matcher[][];
} ? CollectCaptureNames<RestMatchers, Names | ResolveNamedCaptureUnion<NestedMatchersArray, never>[0]> : CollectCaptureNames<RestMatchers, Names> : never;
type ResolveNamedCaptureUnion<AllPossibleMatchers extends Matcher[][], PreviousNamedCaptures extends NamedCapturesTuple, CollectedNames extends string = never> = AllPossibleMatchers extends [] ? [CollectedNames] extends [never] ? PreviousNamedCaptures : Exclude<CollectedNames, PreviousNamedCaptures[0]> extends infer UndefinedCaptureNames ? PreviousNamedCaptures | Exclude<[UndefinedCaptureNames, undefined], [never, undefined]> : never : AllPossibleMatchers extends [
    infer CurrentMatchers extends Matcher[],
    ...infer RestPossibleMatchers extends Matcher[][]
] ? ResolveNamedCaptureUnion<RestPossibleMatchers, PreviousNamedCaptures, CollectedNames | CollectCaptureNames<CurrentMatchers>> : never;
type DeepMatchersIncludeType<Matchers extends Matcher[], Type extends Matcher['type'], Count extends any[] = [], CurrentMatcher extends Matcher = Matchers[Count['length']]> = Count['length'] extends Matchers['length'] ? false : CurrentMatcher extends {
    type: Type;
} ? true : CurrentMatcher extends {
    value: infer NestMatchers extends Matcher[];
} ? DeepMatchersIncludeType<NestMatchers, Type> : CurrentMatcher extends {
    value: infer NestOrMatchers extends Matcher[][];
} ? Extract<DeepMatchersIncludeType<NestOrMatchers[number], Type>, true> extends never ? false : true : false;
type StepMatch<InputString extends string, MatchingString extends string, StartOf extends boolean, MatchingType extends keyof CharSetMap, CaseInsensitive extends boolean = false, AccMatchedString extends string = ''> = MatchingType extends 'step' ? InputString extends `${infer FirstChar}${infer Rest}` ? MatchingString extends `${infer FirstMatchingChar}${infer MatchingRest}` ? FirstChar extends FirstMatchingChar | (CaseInsensitive extends true ? FirstMatchingChar extends keyof CaseMap ? CaseMap[FirstMatchingChar] : never : never) ? StepMatch<Rest, MatchingRest, StartOf, MatchingType, CaseInsensitive, `${AccMatchedString}${FirstChar}`> : StartOf extends true ? NullResult<''> : InputString extends `${string}${infer Rest}` ? StepMatch<Rest, `${AccMatchedString}${MatchingString}`, StartOf, MatchingType, CaseInsensitive> : NullResult<''> : AccMatchedString extends '' ? NullResult<''> : MatchedResult<[AccMatchedString], InputString> : AccMatchedString extends '' ? NullResult<''> : MatchedResult<[AccMatchedString], ''> : MatchingType extends 'string' ? InputString extends `${infer Matched extends MatchingString}${infer Rest}` ? MatchedResult<[Matched], Rest> : StartOf extends true ? NullResult<''> : InputString extends `${string}${infer Rest}` ? StepMatch<Rest, MatchingString, StartOf, MatchingType, CaseInsensitive> : NullResult<''> : MatchingType extends 'boundary' | 'nonBoundary' ? InputString extends `${infer First}${infer Second}${infer Rest}` ? {
    o: NullResult<''>;
    r: NullResult<''>;
} extends {
    o: StepMatch<First | Second, CharSetMap['char'], true, 'char', CaseInsensitive>;
    r: StepMatch<Second | First, CharSetMap['nonChar'], true, 'nonChar', CaseInsensitive>;
} ? MatchedResult<[''], `${Second}${Rest}`> : MatchingType extends 'nonBoundary' ? MatchedResult<[''], `${Second}${Rest}`> : StartOf extends true ? NullResult<''> : StepMatch<`${Second}${Rest}`, MatchingString, StartOf, MatchingType, CaseInsensitive> : NullResult<''> : InputString extends `${infer FirstChar}${infer Rest}` ? MatchingString extends `${string}${FirstChar | (CaseInsensitive extends true ? FirstChar extends keyof CaseMap ? CaseMap[FirstChar] : never : never)}${string}` ? MatchingType extends 'notCharSet' | 'nonChar' | 'nonDigit' | 'nonWhitespace' ? StartOf extends true ? NullResult<''> : StepMatch<Rest, MatchingString, StartOf, MatchingType, CaseInsensitive> : MatchedResult<[FirstChar], Rest> : MatchingType extends 'notCharSet' | 'nonChar' | 'nonDigit' | 'nonWhitespace' ? MatchedResult<[FirstChar], Rest> : StartOf extends true ? NullResult<''> : StepMatch<Rest, MatchingString, StartOf, MatchingType, CaseInsensitive> : NullResult<''>;
type NameCaptureValue<NameCpatureUnion extends NamedCapturesTuple, Key extends string, Value = Extract<NameCpatureUnion, [Key, any]>[1]> = Value;
type ExpandOneOrMore<Matchers extends Matcher[], Greedy extends boolean> = [
    {
        type: 'captureLast';
        value: Matchers;
    },
    {
        type: 'captureLast';
        value: [
            {
                type: 'zeroOrMore';
                greedy: Greedy;
                value: Matchers;
            }
        ];
    }
];
type ExpandRepeat<Matchers extends Matcher[], From extends `${number}`, To extends `${number}` | '' | string, Greedy extends boolean, LargerThanFrom extends boolean = false, Count extends any[] = [], ExpandedMatchers extends Matcher[] = []> = Count['length'] extends 201 ? [] : To extends `${Count['length']}` ? ExpandedMatchers : From extends `${Count['length']}` ? string extends To ? ExpandedMatchers : To extends '' ? [
    ...ExpandedMatchers,
    {
        type: 'captureLast';
        value: [
            {
                type: 'zeroOrMore';
                greedy: Greedy;
                value: Matchers;
            }
        ];
    }
] : ExpandRepeat<Matchers, From, To, Greedy, true, [
    ...Count,
    ''
], [
    ...ExpandedMatchers,
    {
        type: 'captureLast';
        value: [
            {
                type: 'optional';
                greedy: Greedy;
                value: Matchers;
                repeat: [Count, To];
            }
        ];
    }
]> : LargerThanFrom extends true ? ExpandedMatchers : ExpandRepeat<Matchers, From, To, Greedy, LargerThanFrom, [
    ...Count,
    ''
], [
    ...ExpandedMatchers,
    {
        type: 'captureLast';
        value: Matchers;
    }
]>;
type RestMatchersBeforeBackReference<Matchers extends Matcher[], Index extends any[], ResultMatchers extends Matcher[] = []> = Index['length'] extends Matchers['length'] ? ResultMatchers extends infer R extends Matcher[] ? R : never : DeepMatchersIncludeType<[Matchers[Index['length']]], 'backreference'> extends true ? ResultMatchers extends infer R extends Matcher[] ? R : never : RestMatchersBeforeBackReference<Matchers, [
    ...Index,
    ''
], [
    ...ResultMatchers,
    Matchers[Index['length']]
]>;
type FlattenLookahead<Matchers extends Matcher[], ReduceOrMoreMatcher extends boolean = true, FlattenMatchers extends Matcher[] = [], Count extends any[] = [], CurrentMatcer extends Matcher = Matchers[Count['length']]> = Count['length'] extends Matchers['length'] ? FlattenMatchers : CurrentMatcer extends {
    type: 'or';
    value: infer NestedArrMatchers extends Matcher[][];
} ? FlattenLookahead<Matchers, ReduceOrMoreMatcher, [
    ...FlattenMatchers,
    {
        type: 'or';
        value: {
            [K in keyof NestedArrMatchers]: FlattenLookahead<NestedArrMatchers[K], ReduceOrMoreMatcher>;
        };
    }
], [
    ...Count,
    ''
]> : CurrentMatcer extends {
    type: 'lookahead';
    value: infer NestedMatchers extends Matcher[];
    positive: infer Positive extends boolean;
} ? FlattenLookahead<NestedMatchers, ReduceOrMoreMatcher> extends infer FlattenNestedMatchers extends Matcher[] ? Positive extends false ? FlattenLookahead<Matchers, ReduceOrMoreMatcher, [
    ...FlattenMatchers,
    {
        type: 'not';
        value: FlattenNestedMatchers;
    }
], [
    ...Count,
    ''
]> : FlattenLookahead<Matchers, ReduceOrMoreMatcher, [
    ...FlattenMatchers,
    ...FlattenNestedMatchers
], [
    ...Count,
    ''
]> : never : CurrentMatcer extends {
    type: 'capture';
    value: infer NestedMatchers extends Matcher[];
} ? FlattenLookahead<NestedMatchers, ReduceOrMoreMatcher> extends infer FlattenNestedMatchers extends Matcher[] ? FlattenLookahead<Matchers, ReduceOrMoreMatcher, [
    ...FlattenMatchers,
    ...FlattenNestedMatchers
], [
    ...Count,
    ''
]> : never : [ReduceOrMoreMatcher, CurrentMatcer] extends [
    true,
    {
        type: infer Type extends 'zeroOrMore' | 'oneOrMore';
        value: infer NestedMatchers extends [
            {
                type: keyof InvertCharSetMap;
                value?: string;
            }
        ];
    }
] ? NestedMatchers extends Matcher[] ? FlattenLookahead<Matchers, ReduceOrMoreMatcher, [
    ...FlattenMatchers,
    ...(Type extends 'zeroOrMore' ? [
        {
            type: 'optional';
            greedy: true;
            value: NestedMatchers;
        }
    ] : NestedMatchers)
], [
    ...Count,
    ''
]> : never : FlattenLookahead<Matchers, false, [...FlattenMatchers, CurrentMatcer], [...Count, '']>;

type ShorthandMap = {
    s: 'whitespace';
    S: 'nonWhitespace';
    w: 'char';
    W: 'nonChar';
    d: 'digit';
    D: 'nonDigit';
    b: 'boundary';
    B: 'nonBoundary';
};
type IgnoreEscapedChar = {
    '0': '\0';
    t: '\t';
    v: '\v';
    r: '\r';
    n: '\n';
    f: '\f';
};
type RegExpSyntaxError<Msg extends string = string> = {
    type: 'RegExpSyntaxError';
    message: Msg;
} & SyntaxError;
type ParseRegExp<InputString extends string, ParsedMatchers extends Matcher[] = [], ParseOrAsTupleOnly extends boolean = false, AccString extends string = ''> = InputString extends `${infer FirstChar}${infer Rest}` ? FirstChar extends '.' ? Rest extends `${'?' | '*' | '+' | '{'}${string}` ? ResolveQuantifierForSingleToken<[
    {
        type: 'any';
    }
], Rest, ParsedMatchers, AccString, ParseOrAsTupleOnly> : ParseRegExp<Rest, [
    ...ParsedMatchers,
    ...ResolvesAccStringMatcher<AccString>,
    {
        type: 'any';
    }
], ParseOrAsTupleOnly> : FirstChar extends '^' ? ParseRegExp<Rest> extends infer StarOfInnerMatchersOrError ? StarOfInnerMatchersOrError extends RegExpSyntaxError ? StarOfInnerMatchersOrError : [{
    type: 'startOf';
    value: StarOfInnerMatchersOrError;
}] : never : FirstChar extends '$' ? [
    {
        type: 'endOf';
        value: [...ParsedMatchers, ...ResolvesAccStringMatcher<AccString>];
    }
] : FirstChar extends '\\' ? Rest extends `k<${infer GroupName}>${infer RestAfterBackreference}` ? RestAfterBackreference extends `${'?' | '*' | '+' | '{'}${string}` ? ResolveQuantifierForSingleToken<[
    {
        type: 'backreference';
        value: GroupName;
    }
], RestAfterBackreference, ParsedMatchers, AccString, ParseOrAsTupleOnly> : ParseRegExp<RestAfterBackreference, [
    ...ParsedMatchers,
    ...ResolvesAccStringMatcher<AccString>,
    {
        type: 'backreference';
        value: GroupName;
    }
], ParseOrAsTupleOnly> : Rest extends `${infer EscapedChar}${infer RestAfterEscapedChar}` ? EscapedChar extends keyof IgnoreEscapedChar ? ParseRegExp<RestAfterEscapedChar, ParsedMatchers, ParseOrAsTupleOnly, `${AccString}${IgnoreEscapedChar[EscapedChar]}`> : EscapedChar extends keyof ShorthandMap ? RestAfterEscapedChar extends `${'?' | '*' | '+' | '{'}${string}` ? ResolveQuantifierForSingleToken<[
    {
        type: ShorthandMap[EscapedChar];
    }
], RestAfterEscapedChar, ParsedMatchers, AccString, ParseOrAsTupleOnly> : ParseRegExp<RestAfterEscapedChar, [
    ...ParsedMatchers,
    ...ResolvesAccStringMatcher<AccString>,
    {
        type: ShorthandMap[EscapedChar];
    }
], ParseOrAsTupleOnly> : ParseRegExp<RestAfterEscapedChar, ParsedMatchers, ParseOrAsTupleOnly, `${AccString}${EscapedChar}`> : never : FirstChar extends '|' ? ParseOrAsTupleOnly extends true ? ParseRegExp<Rest, [], true> extends infer RestOrMatchersTuple ? [
    [
        ...ParsedMatchers,
        ...ResolvesAccStringMatcher<AccString>
    ] extends infer CurrentOrMatchersTuple ? CurrentOrMatchersTuple extends [] ? [{
        type: 'string';
        value: '';
    }] : CurrentOrMatchersTuple : never,
    ...(RestOrMatchersTuple extends Matcher[][] ? RestOrMatchersTuple extends [] ? [[{
        type: 'string';
        value: '';
    }]] : RestOrMatchersTuple : [RestOrMatchersTuple])
] : never : ParseRegExp<Rest, [], true> extends infer RestOrMatchersTuple ? [
    {
        type: 'or';
        value: [
            [
                ...ParsedMatchers,
                ...ResolvesAccStringMatcher<AccString>
            ] extends infer CurrentOrMatchersTuple ? CurrentOrMatchersTuple extends [] ? [{
                type: 'string';
                value: '';
            }] : CurrentOrMatchersTuple : never,
            ...(RestOrMatchersTuple extends Matcher[][] ? RestOrMatchersTuple extends [] ? [[{
                type: 'string';
                value: '';
            }]] : RestOrMatchersTuple : [RestOrMatchersTuple])
        ];
    }
] : never : FirstChar extends '[' ? ParsePair<FirstChar, Rest> extends infer ParsePairResult ? ParsePairResult extends RegExpSyntaxError<any> ? ParsePairResult : ParsePairResult extends [
    `${infer SetFirstChar}${infer RestAfterSetFirstChar}`,
    infer Rest extends string
] ? Rest extends `${'?' | '*' | '+' | '{'}${string}` ? ResolveQuantifierForSingleToken<[
    {
        type: SetFirstChar extends '^' ? 'notCharSet' : 'charSet';
        value: SetFirstChar extends '^' ? RestAfterSetFirstChar : `${SetFirstChar}${RestAfterSetFirstChar}`;
    }
], Rest, ParsedMatchers, AccString, ParseOrAsTupleOnly> : ParseRegExp<Rest, [
    ...ParsedMatchers,
    ...ResolvesAccStringMatcher<AccString>,
    {
        type: SetFirstChar extends '^' ? 'notCharSet' : 'charSet';
        value: SetFirstChar extends '^' ? RestAfterSetFirstChar : `${SetFirstChar}${RestAfterSetFirstChar}`;
    }
], ParseOrAsTupleOnly> : never : never : FirstChar extends '(' ? ParsePair<FirstChar, Rest> extends infer ParsePairResult ? ParsePairResult extends RegExpSyntaxError<any> ? ParsePairResult : ParsePairResult extends [
    InnerResult<infer Inner extends string, [
        matcherType: infer Type extends Matcher['type'] | 'nonCaputre',
        positiveOrName: infer positiveOrName extends string | boolean | undefined
    ]>,
    RestResult<infer Rest extends string, [
        matcherType: infer Quantifier extends 'optional' | 'zeroOrMore' | 'oneOrMore' | 'repeat' | undefined,
        greedy: infer Greedy extends boolean,
        repeat: infer Repeat extends [`${number}`, `${number}` | '' | string] | undefined
    ]>
] ? ParseRegExp<Inner> extends infer ParsedInnerResult ? ParsedInnerResult extends Matcher[] ? ParseRegExp<Rest, [
    ...ParsedMatchers,
    ...ResolvesAccStringMatcher<AccString>,
    ...ResolveQuantifierTypeMatcher<Quantifier, Greedy, Repeat, ResolveEncloseTypeMatcher<Type, positiveOrName, ParsedInnerResult>>
], ParseOrAsTupleOnly> : ParsedInnerResult : never : never : never : Rest extends `${'?' | '*' | '+' | '{'}${string}` ? ResolveQuantifierForSingleToken<[
    {
        type: 'string';
        value: FirstChar;
    }
], Rest, ParsedMatchers, AccString, ParseOrAsTupleOnly> : InputString extends `${'*' | '+'}${string}` | `{${number}${'' | ',' | `,${number}`}}${string}` ? [{
    type: never;
}, ...ParsedMatchers][ParsedMatchers['length']]['type'] extends 'optional' | 'zeroOrMore' | 'oneOrMore' | 'repeat' ? RegExpSyntaxError<`Invalid regular expression, the preceding token to ${[
    FirstChar,
    Rest
] extends ['{', `${infer Repeat}}${string}`] ? `{${Repeat}}` : FirstChar} is not quantifiable`> : never : FirstChar extends ')' ? RegExpSyntaxError<`Invalid regular expression, missing opening \`(\``> : ParseRegExp<Rest, ParsedMatchers, ParseOrAsTupleOnly, `${AccString}${FirstChar}`> : [...ParsedMatchers, ...ResolvesAccStringMatcher<AccString>];
type ResolvesAccStringMatcher<AccString> = AccString extends '' ? [] : [{
    type: 'string';
    value: AccString;
}];
type ResolveQuantifierForSingleToken<CurrentTokenResolvedMatchers extends Matcher[], Rest extends string, ParsedMatchers extends Matcher[], AccString extends string, ParseOrAsTupleOnly extends boolean> = Rest extends `${infer Quantifier extends '?' | '*' | '+'}${infer RestAfterQuantifier}` ? ParseRegExp<RestAfterQuantifier extends `?${infer RestAfterGreedy}` ? RestAfterGreedy : RestAfterQuantifier, [
    ...ParsedMatchers,
    ...ResolvesAccStringMatcher<AccString>,
    ...ResolveQuantifierTypeMatcher<QuantifierMap[Quantifier], RestAfterQuantifier extends `?${string}` ? false : true, undefined, CurrentTokenResolvedMatchers>
], ParseOrAsTupleOnly> : Rest extends `{${infer RpeatQuantifierWRest}` ? ParsePair<'{', RpeatQuantifierWRest> extends [
    infer RepeatInner extends string,
    infer RestAfterRepeat extends string
] ? RepeatInner extends '{' ? ParseRegExp<`{${RestAfterRepeat}`, [
    ...ParsedMatchers,
    ...ResolvesAccStringMatcher<AccString>,
    ...CurrentTokenResolvedMatchers
], ParseOrAsTupleOnly> : ParseRegExp<RestAfterRepeat extends `?${infer RestAfterGreedy}` ? RestAfterGreedy : RestAfterRepeat, [
    ...ParsedMatchers,
    ...ResolvesAccStringMatcher<AccString>,
    ...ResolveQuantifierTypeMatcher<'repeat', RestAfterRepeat extends `?${string}` ? false : true, `{${RepeatInner}}` extends `{${infer From}${'' | `,${infer To}`}}` ? [Extract<From, `${number}`>, To] : undefined, CurrentTokenResolvedMatchers>
], ParseOrAsTupleOnly> : never : never;
type ResolveQuantifierTypeMatcher<Quantifier extends Matcher['type'] | undefined, Greedy extends boolean, Repeat extends [`${number}`, `${number}` | '' | string] | undefined, QuantifyPattern extends Matcher[]> = Quantifier extends undefined ? QuantifyPattern : Quantifier extends 'optional' | 'zeroOrMore' | 'oneOrMore' ? [
    {
        type: Quantifier;
        greedy: Greedy;
        value: QuantifyPattern;
    }
] : [Quantifier, Repeat] extends [
    'repeat',
    [
        infer From extends `${number}`,
        infer To extends `${number}` | '' | string
    ]
] ? [
    {
        type: Quantifier;
        greedy: Greedy;
        from: From;
        to: To;
        value: QuantifyPattern;
    }
] : never;
type ResolveEncloseTypeMatcher<Type extends Matcher['type'] | 'nonCaputre', positiveOrName extends string | boolean | undefined, ResovledInner extends Matcher[]> = Type extends 'capture' ? [
    {
        type: Type;
        value: ResovledInner;
    }
] : Type extends 'namedCapture' ? [
    {
        type: Type;
        name: positiveOrName extends string ? positiveOrName : never;
        value: ResovledInner;
    }
] : Type extends 'lookahead' | 'lookbehind' ? [
    {
        type: Type;
        positive: positiveOrName extends boolean ? positiveOrName : never;
        value: ResovledInner;
    }
] : ResovledInner;
type CloseBracketMap = {
    '(': ')';
    '[': ']';
    '{': '}';
};
type ParsePair<OpenBracket extends '(' | '[' | '{', InputRest extends string, OpenBracketCount extends any[] = [''], CloseBracketCount extends any[] = [], ResolvedInner extends string = ''> = InputRest extends `${infer Inner}${OpenBracket | CloseBracketMap[OpenBracket]}${string}` ? true extends Extract<Inner extends `${string}${OpenBracket}${string}` ? true : false, true> ? InputRest extends `${infer Inner}${OpenBracket}${infer InnerAfterOpenBracket}` ? ParsePair<OpenBracket, InnerAfterOpenBracket, [
    ...OpenBracketCount,
    ''
], CloseBracketCount, `${ResolvedInner}${Inner}${OpenBracket}`> : never : InputRest extends `${infer Inner}${CloseBracketMap[OpenBracket]}${infer InnerAfterCloseBracket}` ? Inner extends `${string}\\` ? ParsePair<OpenBracket, InnerAfterCloseBracket, OpenBracketCount, CloseBracketCount, `${ResolvedInner}${Inner}${CloseBracketMap[OpenBracket]}`> : [...CloseBracketCount, '']['length'] extends OpenBracketCount['length'] ? OpenBracket extends '[' ? [`${ResolvedInner}${Inner}`, InnerAfterCloseBracket] : OpenBracket extends '{' ? `${ResolvedInner}${Inner}` extends `${number}` | `${number},${number}` | `${number},` ? [`${ResolvedInner}${Inner}`, InnerAfterCloseBracket] : ['{', `${ResolvedInner}${InputRest}`] : ResolveInner<`${ResolvedInner}${Inner}`> extends infer ResolvedInner ? ResolvedInner extends InnerResult<any, any> ? [ResolvedInner, ResolveRest<InnerAfterCloseBracket>] : ResolvedInner : never : ParsePair<OpenBracket, InnerAfterCloseBracket, OpenBracketCount, [
    ...CloseBracketCount,
    ''
], `${ResolvedInner}${Inner}${CloseBracketMap[OpenBracket]}`> : never : OpenBracket extends '{' ? ['{', `${ResolvedInner}${InputRest}`] : RegExpSyntaxError<`Invalid regular expression, missing closing \`${CloseBracketMap[OpenBracket]}\``>;
type InnerResult<ResolvedInner extends string, Type extends [matcherType: Matcher['type'] | 'nonCaputre', positiveOrName: any]> = {
    resovledInner: ResolvedInner;
    type: Type;
};
type ResolveInner<Inner extends string> = Inner extends `?<${infer CaptureType extends '=' | '!'}${infer InnerAferLookBehind}` ? InnerResult<InnerAferLookBehind, ['lookbehind', CaptureType extends '=' ? true : false]> : Inner extends `?${infer CaptureType extends ':' | '=' | '!'}${infer InnerAferNonCapOrLookahead}` ? InnerResult<InnerAferNonCapOrLookahead, [
    CaptureType extends ':' ? 'nonCaputre' : 'lookahead',
    CaptureType extends ':' ? undefined : CaptureType extends '=' ? true : false
]> : Inner extends `?<${infer InnerIncludeClosingBracket}` ? Inner extends `?<${infer GroupName}>${infer InnerAferNamedGroup}` ? GroupName extends '' ? RegExpSyntaxError<`Invalid regular expression, capture group name can not be empty for capturing \`${InnerAferNamedGroup}\``> : InnerResult<InnerAferNamedGroup, ['namedCapture', GroupName]> : RegExpSyntaxError<`Invalid regular expression, invalid capture group name of \`${InnerIncludeClosingBracket}\`, possibly due to a missing closing '>' for group name`> : Inner extends `?${string}>${infer SyntaxErrorInner}` ? RegExpSyntaxError<`Invalid regular expression, invalid capture group name for capturing \`${SyntaxErrorInner}\`, possibly due to a missing opening '<' and group name`> : InnerResult<Inner, ['capture', undefined]>;
type RestResult<ResolvedRest extends string, Quantifier extends [
    matcherType: Matcher['type'] | undefined,
    greedy: boolean,
    repeat: [string, string] | undefined
]> = {
    resovledRest: ResolvedRest;
    quantifier: Quantifier;
};
type QuantifierMap = {
    '?': 'optional';
    '*': 'zeroOrMore';
    '+': 'oneOrMore';
};
type ResolveRest<Rest extends string> = Rest extends `${infer Quantifier extends '?' | '*' | '+'}${infer RestAfterQuantifier}` ? RestResult<RestAfterQuantifier extends `?${infer RestAfterGreedyOp}` ? RestAfterGreedyOp : RestAfterQuantifier, [
    QuantifierMap[Quantifier],
    RestAfterQuantifier extends `?${string}` ? false : true,
    undefined
]> : Rest extends `{${infer RpeatOpWRest}` ? ParsePair<'{', RpeatOpWRest> extends [
    infer RepeatInner extends string,
    infer RestAfterRepeat extends string
] ? RepeatInner extends '{' ? RestResult<Rest, [undefined, false, undefined]> : RestResult<RestAfterRepeat extends `?${infer RestAfterGreedyOp}` ? RestAfterGreedyOp : RestAfterRepeat, [
    'repeat',
    RestAfterRepeat extends `?${string}` ? false : true,
    `{${RepeatInner}}` extends `{${infer From}${'' | `,${infer To}`}}` ? [Exclude<From, `${string},${string}`>, To] : undefined
]> : never : RestResult<Rest, [undefined, false, undefined]>;

type GlobalMatch<InputString extends string, Matchers extends Matcher[], Flags extends Flag, MatchResultArray extends string[] = []> = ExhaustiveMatch<InputString, Matchers, Flags> extends infer Result ? Result extends MatchedResult<infer MatchArray extends any[], infer RestInputString extends string, any> ? GlobalMatch<RestInputString, Matchers, Flags, [...MatchResultArray, MatchArray[0]]> : MatchResultArray extends [] ? null : MatchResultArray : never;
type ExhaustiveMatch<InputString extends string, Matchers extends Matcher[], Flags extends Flag, SkippedString extends string = '', StartOf extends boolean = false> = Matchers extends Matchers ? EnumerateMatchers<InputString, Matchers, Flags, SkippedString, [
], [
    ''
], never, StartOf> extends infer Result ? Result extends MatchedResult<any, any, any> ? Result : Result extends NullResult<infer PartialMatched extends string, any, infer Abort> ? true extends Abort | StartOf ? Result : PartialMatched extends '' ? InputString extends `${infer FirstChar}${infer Rest}` ? Rest extends '' ? Result : ExhaustiveMatch<Rest, Matchers, Flags, `${SkippedString}${FirstChar}`, StartOf> : Result : InputString extends `${infer Prefix}${PartialMatched}${infer NextSection}` ? ExhaustiveMatch<NextSection, Matchers, Flags, `${SkippedString}${Prefix}${PartialMatched}`, StartOf> : never : never : never : never;
type MatchLast<InputString extends string, Matchers extends Matcher[], Flags extends Flag, NamedCaptures extends NamedCapturesTuple, SkippedString extends string = '', StepChar extends boolean = false, InvertMatcher extends Matcher = never, LastMatched extends MatchedResult<any, any, any> | NullResult<''> = NullResult<''>> = EnumerateMatchers<InputString, Matchers, Flags, SkippedString, [
], [
    ''
], NamedCaptures, false> extends infer Result ? Result extends MatchedResult<[
    infer CurrentMatch extends string,
    ...any[]
], infer RestInput, any> ? `${CurrentMatch}${RestInput}` extends '' ? MatchedResult<[''], ''> : StepChar extends true ? InputString extends `${infer Skipped}${CurrentMatch}${RestInput}` ? Match<`${SkippedString}${Skipped}`, Flags, '', '', [
    InvertMatcher
], [
], never, false> extends NullResult<any, any, any> ? InputString extends `${infer SkippedChar}${infer Rest}` ? MatchLast<Rest, Matchers, Flags, NamedCaptures, `${SkippedString}${SkippedChar}`, StepChar, InvertMatcher, Result> : MatchedResult<[''], '', never> : LastMatched : never : MatchLast<RestInput, Matchers, Flags, NamedCaptures, SkippedString, StepChar, InvertMatcher, Result> : Result extends NullResult<infer PartialMatched extends string, any, any> ? PartialMatched extends '' ? false extends StepChar | (InputString extends '' ? false : true) ? LastMatched : InputString extends `${infer Skipped}${infer Rest}` ? MatchLast<Rest, Matchers, Flags, NamedCaptures, `${SkippedString}${Skipped}`, StepChar, InvertMatcher, LastMatched> : LastMatched : InputString extends `${infer Skipped}${PartialMatched}${infer NextSeg}` ? MatchLast<NextSeg, Matchers, Flags, NamedCaptures, `${SkippedString}${Skipped}`, StepChar, InvertMatcher, LastMatched> : LastMatched : never : never;
type EnumerateMatchers<InputString extends string, Matchers extends Matcher[], Flags extends Flag, SkippedString extends string, OutMostRestMatchers extends Matcher[] = [], MatchResultArray extends (string | undefined)[] = [''], NamedCaptures extends NamedCapturesTuple = never, StartOf extends boolean = false, Count extends any[] = [], CurrentMatcher extends Matcher = Matchers[Count['length']], ResolvedNamedCaptures extends NamedCapturesTuple = CurrentMatcher extends {
    type: 'captureLast';
    value: infer CaptureLastMatchers extends Matcher[];
} ? Exclude<NamedCaptures, [CollectCaptureNames<CaptureLastMatchers>, any]> : NamedCaptures> = Count['length'] extends Matchers['length'] ? MatchedResult<MatchResultArray, InputString, NamedCaptures> : CurrentMatcher extends {
    type: infer Type extends 'endOf' | 'startOf';
    value: infer StartOrEndMatchers extends Matcher[];
} ? ExhaustiveMatch<InputString, Type extends 'endOf' ? [...StartOrEndMatchers, {
    type: 'endMark';
}] : StartOrEndMatchers, Flags, SkippedString, Type extends 'startOf' ? true : StartOf> extends infer Result ? Result extends MatchedResult<infer MatchArray, infer RestInputString, any> ? '' extends (Type extends 'endOf' ? false : '') | RestInputString ? Result : NullResult<MatchArray[0], {
    msg: `Not matching at the end of input string, remaining input: \`${RestInputString}\``;
}, true> : Result extends NullResult<infer PartialMatched extends string, infer DebugObj, any> ? NullResult<PartialMatched, DebugObj, true> : never : never : Match<CurrentMatcher['type'] extends 'boundary' | 'nonBoundary' ? `${LastCharOfOr<MatchResultArray[0], ' '>}${InputString}` : InputString, Flags, NonNullable<MatchResultArray[0]>, SkippedString, Matchers, OutMostRestMatchers, ResolvedNamedCaptures, StartOf, Count> extends infer Result ? Result extends MatchedResult<[
    infer CurrentMatched extends string,
    ...infer CurrentMatchedRestArray extends any[]
], infer RestInputString, infer NestNamedCaptures> ? EnumerateMatchers<RestInputString, Matchers, Flags, `${InputString extends `${infer FirstSkipString}${CurrentMatched}${string}` ? `${SkippedString}${FirstSkipString}` : SkippedString}`, OutMostRestMatchers, [
    ...([CurrentMatcher['type'], CurrentMatched extends '' ? false : true] extends [
        'captureLast',
        true
    ] ? [`${MatchResultArray[0]}${CurrentMatched}`] : ConcatToFirstElement<MatchResultArray, CurrentMatched>),
    ...(CurrentMatcher['type'] extends 'capture' | 'namedCapture' ? [CurrentMatched] : []),
    ...([CurrentMatcher['type'], CurrentMatched] extends ['captureLast', ''] ? [] : CurrentMatchedRestArray)
], (CurrentMatcher extends {
    type: 'namedCapture';
    name: infer CaptureName extends string;
} ? [CaptureName, CurrentMatched] : never) | ([CurrentMatcher['type'], CurrentMatched] extends ['captureLast', ''] ? NamedCaptures : ResolvedNamedCaptures | NestNamedCaptures), true, // ? Allway set startOf to `true` for following matchs
[
    ...Count,
    ''
]> : NullResult<ConcatParialMatched<MatchResultArray[0], Result>, Result extends NullResult<any, any, any> ? Result['debugObj'] : unknown, false> : never;
type Match<InputString extends string, Flags extends Flag, SkippedString extends string, PrevMatchedString extends string, Matchers extends Matcher[], OutMostRestMatchers extends Matcher[], NamedCaptures extends NamedCapturesTuple, StartOf extends boolean, Count extends any[] = [], PrefixType extends string = StartOf extends true ? '' : string, CurrentMatcher extends Matcher = Matchers[Count['length']], RestMatchers extends Matcher[] = SliceMatchers<Matchers, [
    ...Count,
    ''
]> extends infer RM extends Matcher[] ? RM : never> = CurrentMatcher extends {
    type: 'any';
} ? InputString extends `${infer AnyChar}${infer Rest}` ? MatchedResult<[AnyChar], Rest> : NullResult<InputString> : CurrentMatcher extends {
    type: infer Type extends 'string' | 'backreference';
    value: infer StringOrName extends string;
} ? ['backreference', undefined] extends [Type, NameCaptureValue<NamedCaptures, StringOrName>] ? MatchedResult<[''], InputString> : 'i' extends Flags ? StepMatch<InputString, `${Type extends 'string' ? StringOrName : NameCaptureValue<NamedCaptures, StringOrName>}`, StartOf, 'step', true> : InputString extends `${[Type, StringOrName] extends ['string', ''] ? '' : PrefixType}${Type extends 'string' ? StringOrName : NameCaptureValue<NamedCaptures, StringOrName>}${infer Rest}` ? MatchedResult<[
    Type extends 'string' ? StringOrName : NameCaptureValue<NamedCaptures, StringOrName>
], Rest> : NullResult<''> : CurrentMatcher extends {
    type: infer Type extends keyof CharSetMap;
    value?: infer CharSet extends string;
} ? StepMatch<InputString, CharSetMap<CharSet>[Type], StartOf, Type, 'i' extends Flags ? true : false> : CurrentMatcher extends {
    type: infer Type extends 'optional' | 'zeroOrMore';
    value: infer OptionalOrMoreMatchers extends Matcher[];
    greedy: infer Greedy extends boolean;
    repeat?: infer Repeat extends [from: any[], to: string];
} ? [
    Type,
    OptionalOrMoreMatchers
] extends [
    'zeroOrMore',
    [
        {
            type: infer OrMoreMatcherType extends keyof InvertCharSetMap;
            value?: infer MaybeCharSet extends string;
        }
    ]
] ? [...RestMatchers, ...OutMostRestMatchers] extends [] | [{
    type: 'endMark';
}] ? Greedy extends false ? MatchedResult<[''], InputString, never> : [
    OrMoreMatcherType extends 'any' ? false : true,
    Match<InputString, Flags, SkippedString, PrevMatchedString, OrMoreMatcherType extends 'charSet' | 'notCharSet' ? [{
        type: InvertCharSetMap[OrMoreMatcherType];
        value: MaybeCharSet;
    }] : [{
        type: InvertCharSetMap[OrMoreMatcherType];
    }], OutMostRestMatchers, NamedCaptures, false>
] extends [
    true,
    MatchedResult<[
        infer InvertOpMatch extends string,
        ...any[]
    ], infer RestInputString, never>
] ? InputString extends `${infer Match}${InvertOpMatch}${RestInputString}` ? MatchedResult<[Match], `${InvertOpMatch}${RestInputString}`, never> : never : MatchedResult<[InputString], '', never> : FlattenLookahead<RestMatchersBeforeBackReference<[...RestMatchers, ...OutMostRestMatchers], []>> extends infer ResolvedRestMatchers extends Matcher[] ? MatchLast<InputString, ResolvedRestMatchers, Flags, NamedCaptures, '', true, OrMoreMatcherType extends 'any' ? never : OrMoreMatcherType extends 'charSet' | 'notCharSet' ? {
    type: InvertCharSetMap[OrMoreMatcherType];
    value: MaybeCharSet;
} : {
    type: InvertCharSetMap[OrMoreMatcherType];
}> extends MatchedResult<[
    infer NextMatch extends string,
    ...any[]
], infer RestInputString, any> ? InputString extends `${infer PossibleMatch}${NextMatch}${RestInputString}` ? OrMoreMatcherType extends 'any' ? MatchedResult<[PossibleMatch], `${NextMatch}${RestInputString}`, never> : Match<PossibleMatch, Flags, SkippedString, PrevMatchedString, OrMoreMatcherType extends 'charSet' | 'notCharSet' ? [{
    type: InvertCharSetMap[OrMoreMatcherType];
    value: MaybeCharSet;
}] : [{
    type: InvertCharSetMap[OrMoreMatcherType];
}], OutMostRestMatchers, NamedCaptures, false> extends MatchedResult<[
    infer InvertOpMatch extends string,
    ...any[]
], infer RestPossibleMatch, never> ? PossibleMatch extends `${infer Match}${InvertOpMatch}${RestPossibleMatch}` ? MatchedResult<[
    Match
], `${InvertOpMatch}${RestPossibleMatch}${NextMatch}${RestInputString}`, never> : never : MatchedResult<[PossibleMatch], `${NextMatch}${RestInputString}`, never> : never : NullResult<''> : NullResult<''> : MatchOptionalOrMoreMatcher<InputString, Flags, SkippedString, Matchers, OutMostRestMatchers, OptionalOrMoreMatchers, Greedy, [
    never,
    string
] extends Repeat ? Type extends 'zeroOrMore' ? [[], 'infinite'] : [[], '1'] : Repeat, NamedCaptures, StartOf, Count> : CurrentMatcher extends {
    type: 'oneOrMore';
    value: infer OneOrMoreMatchers extends Matcher[];
    greedy: infer Greedy extends boolean;
} ? EnumerateMatchers<InputString, ExpandOneOrMore<OneOrMoreMatchers, Greedy>, Flags, SkippedString, [
    ...RestMatchers,
    ...OutMostRestMatchers
], [
    ''
], NamedCaptures, StartOf> : CurrentMatcher extends {
    type: 'capture' | 'namedCapture' | 'captureLast';
    value: infer GroupMatchers extends Matcher[];
} ? EnumerateMatchers<InputString, GroupMatchers, Flags, SkippedString, [
    ...RestMatchers,
    ...OutMostRestMatchers
], [
    ''
], NamedCaptures, StartOf> : CurrentMatcher extends {
    type: 'or';
    value: infer OrMatchersArray extends Matcher[][];
} ? MatchOrMatchers<InputString, Flags, SkippedString, OrMatchersArray, [
    ...RestMatchers,
    ...OutMostRestMatchers
], NamedCaptures, StartOf> : CurrentMatcher extends {
    type: 'repeat';
    value: infer RepeatMatchers extends Matcher[];
    from: infer From extends `${number}`;
    to: infer To extends `${number}` | '' | string;
    greedy: infer Greedy extends boolean;
} ? EnumerateMatchers<InputString, ExpandRepeat<RepeatMatchers, From, To, Greedy>, Flags, SkippedString, [
    ...RestMatchers,
    ...OutMostRestMatchers
], [
    ''
], NamedCaptures, StartOf> : CurrentMatcher extends {
    type: 'lookahead';
    value: infer LookaheadMatchers extends Matcher[];
    positive: infer Positive extends boolean;
} ? EnumerateMatchers<InputString, LookaheadMatchers, Flags, SkippedString, [
], [
    ''
], NamedCaptures, StartOf> extends MatchedResult<[any, ...infer Captures extends any[]], any, infer NestNamedCaptures> ? Positive extends true ? MatchedResult<['', ...Captures], InputString, NestNamedCaptures> : NullResult<''> : Positive extends true ? NullResult<''> : MatchedResult<[
    '',
    ...CountNumOfCaptureGroupsAs<LookaheadMatchers>
], InputString, ResolveNamedCaptureUnion<[LookaheadMatchers], never>> : CurrentMatcher extends {
    type: 'lookbehind';
    value: infer LookbehindMatchers extends Matcher[];
    positive: infer Positive extends boolean;
} ? MatchLast<`${PrevMatchedString}${SkippedString}`, LookbehindMatchers, Flags, NamedCaptures, SkippedString> extends MatchedResult<[
    any,
    ...infer Captures extends any[]
], infer RestInputString, infer NestNamedCaptures> ? RestInputString extends '' ? Positive extends true ? MatchedResult<['', ...Captures], InputString, NestNamedCaptures> : NullResult<''> : Positive extends true ? NullResult<''> : MatchedResult<[
    '',
    ...CountNumOfCaptureGroupsAs<LookbehindMatchers>
], InputString, ResolveNamedCaptureUnion<[LookbehindMatchers], never>> : Positive extends true ? NullResult<''> : MatchedResult<[
    '',
    ...CountNumOfCaptureGroupsAs<LookbehindMatchers>
], InputString, ResolveNamedCaptureUnion<[LookbehindMatchers], never>> : CurrentMatcher extends {
    type: 'not';
    value: infer NotMatchers extends Matcher[];
} ? ExhaustiveMatch<InputString, NotMatchers, Flags, SkippedString, StartOf> extends NullResult<any> ? MatchedResult<[''], Count['length'] extends Matchers['length'] ? '' : InputString, never> : NullResult<''> : CurrentMatcher extends {
    type: 'endMark';
} ? MatchedResult<[''], InputString, never> : never;
type MatchOrMatchers<InputString extends string, Flags extends Flag, SkippedString extends string, OrMatchersArray extends Matcher[][], OutMostRestMatchers extends Matcher[], NamedCaptures extends NamedCapturesTuple, StartOf extends boolean = false, Count extends any[] = [], BestMatchedWithPrefix extends [
    prefix: string | undefined,
    matchedResult: MatchedResult<any, any, any> | NullResult<any, any, any>
] = [undefined, NullResult<''>], CurrentOrMatchers extends Matcher[] = OrMatchersArray[Count['length']]> = Count['length'] extends OrMatchersArray['length'] ? BestMatchedWithPrefix[1] : (StartOf extends true ? EnumerateMatchers<InputString, CurrentOrMatchers, Flags, SkippedString, OutMostRestMatchers, [
    ''
], NamedCaptures, StartOf> : ExhaustiveMatch<InputString, CurrentOrMatchers, Flags, SkippedString, StartOf>) extends MatchedResult<[
    infer OrMatch extends string,
    ...infer OrCaptures extends any[]
], infer RestInputString, infer NestNamedCaptures> ? MatchOrMatchers<InputString, Flags, SkippedString, OrMatchersArray, OutMostRestMatchers, ResolveNamedCaptureUnion<OrMatchersArray, NamedCaptures>, StartOf, [
    ...Count,
    ''
], [
    OrMatch,
    [...Count, '']['length'] extends OrMatchersArray['length'] ? true : false
] extends [
    '',
    false
] ? [
    '',
    MatchedResult<[
        OrMatch,
        ...ResolveOrCaptureTuple<OrMatchersArray, OrCaptures, IndexOf<OrMatchersArray, CurrentOrMatchers>>
    ], RestInputString, ResolveNamedCaptureUnion<OrMatchersArray, NestNamedCaptures>>
] : InputString extends `${infer Prefix}${OrMatch}${string}` ? BestMatchedWithPrefix[0] extends Prefix ? BestMatchedWithPrefix : BestMatchedWithPrefix[0] extends undefined | `${string}${Prefix}${string}` ? [
    Prefix,
    MatchedResult<[
        OrMatch,
        ...ResolveOrCaptureTuple<OrMatchersArray, OrCaptures, IndexOf<OrMatchersArray, CurrentOrMatchers>>
    ], RestInputString, ResolveNamedCaptureUnion<OrMatchersArray, NestNamedCaptures>>
] : BestMatchedWithPrefix : never> : MatchOrMatchers<InputString, Flags, SkippedString, OrMatchersArray, OutMostRestMatchers, ResolveNamedCaptureUnion<[CurrentOrMatchers], NamedCaptures>, StartOf, [
    ...Count,
    ''
], BestMatchedWithPrefix>;
type BacktrackMatch<MatchedResultsTuple extends {
    matched: string;
    captures: (string | undefined)[];
    namedCaputres: NamedCapturesTuple;
}[], Flags extends Flag, SkippedString extends string, CurrentNestedMatchers extends Matcher[], RestMatchers extends Matcher[], NamedCaptures extends NamedCapturesTuple, CurrentMatcherIndex extends any[] = [], Count extends any[] = ['']> = Count['length'] extends MatchedResultsTuple['length'] ? NullResult<''> : MatchedResultsTuple[0]['matched'] extends `${MatchedResultsTuple[Count['length']]['matched']}${infer LastMatchSeg}` ? EnumerateMatchers<LastMatchSeg, RestMatchers, Flags, SkippedString, [
], // ! should we combined and pass down rest of matchers and OutMostRestMatchers ??
[
    ''
], NamedCaptures, true, [
    ...CurrentMatcherIndex,
    ''
]> extends MatchedResult<[infer Matched extends string, ...any[]], any, any> ? LastMatchSeg extends `${infer Prefix}${Matched}${string}` ? Prefix extends '' ? MatchedResult<[
    MatchedResultsTuple[Count['length']]['matched'],
    ...MatchedResultsTuple[Count['length']]['captures']
], LastMatchSeg, ResolveNamedCaptureUnion<[
    CurrentNestedMatchers
], MatchedResultsTuple[Count['length']]['namedCaputres']>> : EnumerateMatchers<Prefix, CurrentNestedMatchers, Flags, SkippedString, [
], // ! should we combined and pass down rest of matchers and OutMostRestMatchers ??
[
    ''
], NamedCaptures, true> extends MatchedResult<[
    any,
    ...infer LastCaptures extends any[]
], any, infer LastNamedCaptures> ? MatchedResult<[
    `${MatchedResultsTuple[Count['length']]['matched']}${Prefix}`,
    ...LastCaptures
], LastMatchSeg extends `${Prefix}${infer Rest}` ? Rest : never, ResolveNamedCaptureUnion<[CurrentNestedMatchers], LastNamedCaptures>> : never : never : BacktrackMatch<MatchedResultsTuple, Flags, SkippedString, CurrentNestedMatchers, RestMatchers, NamedCaptures, CurrentMatcherIndex, [
    ...Count,
    ''
]> : never;
type MatchOptionalOrMoreMatcher<InputString extends string, Flags extends Flag, SkippedString extends string, Matchers extends Matcher[], OutMostRestMatchers extends Matcher[], CurrentNestedMatchers extends Matcher[], Greedy extends boolean, Repeat extends [from: any[], to: string], NamedCaptures extends NamedCapturesTuple, StartOf extends boolean, CurrentMatcherIndex extends any[] = [], MatchedResultsTuple extends {
    matched: string;
    captures: (string | undefined)[];
    namedCaputres: NamedCapturesTuple;
}[] = [
    {
        matched: '';
        captures: CountNumOfCaptureGroupsAs<CurrentNestedMatchers>;
        namedCaputres: ResolveNamedCaptureUnion<[CurrentNestedMatchers], never>;
    }
], MatchNextMater extends boolean = Greedy extends true ? false : true, MatchedCount extends any[] = [
    ...(MatchedResultsTuple extends [any, ...infer OneLess] ? OneLess : []),
    ...Repeat[0]
], MaxRepeatReached extends boolean = `${MatchedCount['length']}` extends Repeat[1] ? true : false> = true extends Greedy | TupleItemExtendsType<[
    ...Matchers,
    ...OutMostRestMatchers
], [
    ...CurrentMatcherIndex,
    ''
], {
    type: 'endMark';
}> ? [
    MaxRepeatReached,
    EnumerateMatchers<InputString, CurrentNestedMatchers, Flags, SkippedString, [
    ], // ! should we combined and pass down rest of matchers and OutMostRestMatchers ??
    [
        ''
    ], NamedCaptures, StartOf>
] extends [
    false,
    MatchedResult<[
        infer CurrentMatched extends string,
        ...infer CurrentMatchedRestArray extends any[]
    ], infer CurrentRestInputString, infer CurrentNamedCaptures>
] ? MatchOptionalOrMoreMatcher<CurrentRestInputString, Flags, SkippedString, Matchers, OutMostRestMatchers, CurrentNestedMatchers, Greedy, Repeat, NamedCaptures, StartOf, CurrentMatcherIndex, [
    {
        matched: `${MatchedResultsTuple[0]['matched']}${CurrentMatched}`;
        captures: CurrentMatchedRestArray;
        namedCaputres: CurrentNamedCaptures;
    },
    ...MatchedResultsTuple
]> : TupleItemExtendsType<[
    ...Matchers,
    ...OutMostRestMatchers
], [
    ...CurrentMatcherIndex,
    ''
], Matcher> extends true ? EnumerateMatchers<InputString, RestMatchersBeforeBackReference<[
    ...Matchers,
    ...OutMostRestMatchers
], [
    ...CurrentMatcherIndex,
    ''
]>, Flags, SkippedString, [
], // ! should we combined and pass down rest of matchers and OutMostRestMatchers ??
[
    ''
], NamedCaptures, true> extends NullResult<any, any, any> ? BacktrackMatch<[
    {
        matched: `${MatchedResultsTuple[0]['matched']}${InputString}`;
        captures: [];
        namedCaputres: never;
    },
    ...MatchedResultsTuple
], Flags, SkippedString, CurrentNestedMatchers, [
    ...Matchers,
    ...OutMostRestMatchers
], NamedCaptures, CurrentMatcherIndex> : MatchedResult<[
    MatchedResultsTuple[0]['matched'],
    ...MatchedResultsTuple[0]['captures']
], InputString, ResolveNamedCaptureUnion<[CurrentNestedMatchers], MatchedResultsTuple[0]['namedCaputres']>> : MatchedResult<[
    MatchedResultsTuple[0]['matched'],
    ...MatchedResultsTuple[0]['captures']
], InputString, ResolveNamedCaptureUnion<[CurrentNestedMatchers], MatchedResultsTuple[0]['namedCaputres']>> : TupleItemExtendsType<[
    ...Matchers,
    ...OutMostRestMatchers
], [
    ...CurrentMatcherIndex,
    ''
], Matcher> extends true ? true extends MatchNextMater ? EnumerateMatchers<InputString, RestMatchersBeforeBackReference<[
    ...Matchers,
    ...OutMostRestMatchers
], [
    ...CurrentMatcherIndex,
    ''
]>, Flags, SkippedString, [
], // ! should we combined and pass down rest of matchers and OutMostRestMatchers ??
[
    ''
], NamedCaptures, // ? pass in zeroOrMore/optional match named capture?
true> extends MatchedResult<any, any, any> ? MatchedResult<[
    MatchedResultsTuple[0]['matched'],
    ...MatchedResultsTuple[0]['captures']
], InputString, ResolveNamedCaptureUnion<[CurrentNestedMatchers], MatchedResultsTuple[0]['namedCaputres']>> : MaxRepeatReached extends true ? NullResult<''> : MatchOptionalOrMoreMatcher<InputString, Flags, SkippedString, Matchers, OutMostRestMatchers, CurrentNestedMatchers, Greedy, Repeat, NamedCaptures, StartOf, CurrentMatcherIndex, MatchedResultsTuple, false> : EnumerateMatchers<InputString, CurrentNestedMatchers, Flags, SkippedString, [
], // ! should we combined and pass down rest of matchers and OutMostRestMatchers ??
[
    ''
], NamedCaptures, StartOf> extends MatchedResult<[
    infer CurrentMatched extends string,
    ...infer CurrentMatchedRestArray extends any[]
], infer CurrentRestInputString, infer CurrentNamedCaptures> ? MatchOptionalOrMoreMatcher<CurrentRestInputString, Flags, SkippedString, Matchers, OutMostRestMatchers, CurrentNestedMatchers, Greedy, Repeat, NamedCaptures, StartOf, CurrentMatcherIndex, [
    {
        matched: `${MatchedResultsTuple[0]['matched']}${CurrentMatched}`;
        captures: CurrentMatchedRestArray;
        namedCaputres: CurrentNamedCaptures;
    },
    ...MatchedResultsTuple
], true> : NullResult<''> : MatchedResult<[
    '',
    ...CountNumOfCaptureGroupsAs<CurrentNestedMatchers>
], InputString, ResolveNamedCaptureUnion<[CurrentNestedMatchers], never>>;

type PermutationResult<MatchArray extends (string | undefined)[], NamedCaptures extends NamedCapturesTuple> = {
    results: MatchArray;
    namedCapture: NamedCaptures;
};
type PrependAndUnionToAll<Arr extends (string | undefined)[], PrependingString extends string | undefined, Union, ResultArr extends any[] = [], Length extends number = Arr['length']> = ResultArr['length'] extends Length ? ResultArr : Arr extends [
    infer First extends string | undefined,
    ...infer Rest extends (string | undefined)[]
] ? PrependAndUnionToAll<Rest, PrependingString, Union, [
    ...ResultArr,
    First extends undefined ? undefined : `${PrependingString}${First}` | Union
], Length> : [];
type RepeatStringFromTo<RepeatingString extends string, From extends any[], To extends string, RepeatResult extends string = ''> = `${From['length']}` extends To ? RepeatResult : RepeatStringFromTo<RepeatingString, [...From, ''], To, `${RepeatResult}${RepeatingString}`>;
interface LiteralCharSetMap<CharSet extends string = string, ResolvedCharSet extends string = ResolveCharSet<CharSet>> {
    whitespace: ' ';
    nonWhitespace: '[non-whitespace]';
    any: '[any char]';
    char: '[any word char]';
    nonChar: '[any non-char]';
    digit: `${number}` | '[any digit]';
    nonDigit: '[non-digit]';
    charSet: StringToUnion<ResolvedCharSet>;
    notCharSet: `[any char NOT in [${CharSet}]]`;
    boundary: '[boundary]';
    nonBoundary: '[non-boundary]';
}
type ConcateRestMatchers<CurrentMatchers extends Matcher[], OutMostRestMatchers extends Matcher[], CurrentIndex extends any[]> = [
    ...(SliceMatchers<CurrentMatchers, [...CurrentIndex, '']> extends infer RM extends Matcher[] ? RM : never),
    ...OutMostRestMatchers
];
type ResolvePermutation<Matchers extends Matcher[], OutMostRestMatchers extends Matcher[] = [], MatchResultArray extends (string | undefined)[] = [''], NamedCaptures extends NamedCapturesTuple = never, CurrentIndex extends any[] = [], CurrentMatcher extends Matcher = Matchers[CurrentIndex['length']]> = CurrentMatcher extends {
    type: infer Type extends 'string' | 'backreference';
    value: infer StringValue extends string;
} ? ResolvePermutation<Matchers, OutMostRestMatchers, ConcatToFirstElement<MatchResultArray, Type extends 'backreference' ? NameCaptureValue<NamedCaptures, StringValue> : StringValue>, NamedCaptures, [
    ...CurrentIndex,
    ''
]> : CurrentMatcher extends {
    type: infer Type extends keyof LiteralCharSetMap;
    value?: infer CharSet extends string;
} ? ResolvePermutation<Matchers, OutMostRestMatchers, ConcatToFirstElement<MatchResultArray, LiteralCharSetMap<CharSet>[Type]>, NamedCaptures, [
    ...CurrentIndex,
    ''
]> : CurrentMatcher extends {
    type: infer Type extends 'startOf' | 'endOf';
    value: infer StartEndMatchers extends Matcher[];
} ? ResolvePermutation<StartEndMatchers> extends PermutationResult<[
    infer ResultString extends string,
    ...infer Captures extends any[]
], infer NextedNamedCapture> ? ResolvePermutation<Matchers, OutMostRestMatchers, [
    ...ConcatToFirstElement<MatchResultArray, Exclude<ResultString, `End with${string}`> | (Extract<`${Type extends 'startOf' ? 'Start' : 'End'} with [${ResultString}]`, `Start with [End with${string}`> extends never ? `${Type extends 'startOf' ? 'Start' : 'End'} with [${ResultString}]` : Extract<`${Type extends 'startOf' ? 'Start' : 'End'} with [${ResultString}]`, `Start with [End with${string}`>)>,
    ...Captures
], NamedCaptures | NextedNamedCapture, [
    ...CurrentIndex,
    ''
]> : never : CurrentMatcher extends {
    type: infer Type extends 'lookahead' | 'lookbehind';
    positive: infer Positive extends boolean;
    value: infer LookaroundMatchers extends Matcher[];
} ? ResolvePermutation<LookaroundMatchers, ConcateRestMatchers<Matchers, OutMostRestMatchers, CurrentIndex>, [
    ''
], NamedCaptures> extends PermutationResult<[
    infer ResultString extends string,
    ...infer Captures extends any[]
], infer NextedNamedCapture> ? ResolvePermutation<Matchers, OutMostRestMatchers, [
    ...ConcatToFirstElement<MatchResultArray, `[${Type extends 'lookahead' ? 'following' : 'previous'} pattern${Positive extends true ? '' : ' not'} contain: [${ResultString}] ]` | ''>,
    ...(Positive extends true ? Captures : CountNumOfCaptureGroupsAs<LookaroundMatchers>)
], NamedCaptures | (Positive extends true ? NextedNamedCapture : ResolveNamedCaptureUnion<[LookaroundMatchers], NamedCaptures>), [
    ...CurrentIndex,
    ''
]> : never : CurrentMatcher extends {
    type: infer Type extends 'capture' | 'namedCapture';
    value: infer GroupMatchers extends Matcher[];
    name?: infer GroupName extends string;
} ? ResolvePermutation<GroupMatchers, ConcateRestMatchers<Matchers, OutMostRestMatchers, CurrentIndex>, [
    ''
], NamedCaptures> extends infer Result ? Result extends PermutationResult<[
    infer ResultString extends string,
    ...infer Captures extends any[]
], infer NextedNamedCapture> ? ResultString extends ResultString ? ResolvePermutation<Matchers, OutMostRestMatchers, [
    ...ConcatToFirstElement<MatchResultArray, ResultString>,
    ...[ResultString],
    ...Captures
], NamedCaptures | NextedNamedCapture | (Type extends 'namedCapture' ? [GroupName, ResultString] : never), [
    ...CurrentIndex,
    ''
]> : never : never : never : CurrentMatcher extends {
    type: 'captureLast';
    value: infer GroupMatchers extends Matcher[];
} ? ResolvePermutation<GroupMatchers, OutMostRestMatchers, [''], NamedCaptures> extends infer Result ? Result extends PermutationResult<[
    infer ResultString extends string,
    ...infer Captures extends any[]
], infer NextedNamedCapture> ? Captures extends Captures ? ResolvePermutation<Matchers, OutMostRestMatchers, [
    ...(Captures[number] extends undefined ? ConcatToFirstElement<MatchResultArray, ResultString> : [`${MatchResultArray[0]}${ResultString}`]),
    ...(MatchResultArray['length'] extends 1 ? Captures : Captures[number] extends undefined ? [] : Captures)
], NamedCaptures | Exclude<NextedNamedCapture, [Extract<NamedCaptures, [string, string]>[0], undefined]>, [
    ...CurrentIndex,
    ''
]> : never : never : never : CurrentMatcher extends {
    type: 'optional';
    value: infer OptionalMatchers extends Matcher[];
    greedy: infer Greedy extends boolean;
    repeat?: infer Repeat extends [from: any[], to: string];
} ? ResolvePermutation<OptionalMatchers, ConcateRestMatchers<Matchers, OutMostRestMatchers, CurrentIndex>, [
    ''
], NamedCaptures> extends PermutationResult<[
    infer ResultString extends string,
    ...infer Captures extends any[]
], infer NextedNamedCapture> ? ResolvePermutation<Matchers, OutMostRestMatchers, [
    ...ConcatToFirstElement<MatchResultArray, Greedy extends true ? [never, string] extends Repeat ? ResultString | '' : RepeatStringFromTo<ResultString | '', Repeat[0], Repeat[1]> : TupleItemExtendsType<[
        ...Matchers,
        ...OutMostRestMatchers
    ], [
        ...CurrentIndex,
        ''
    ], Matcher> extends true ? [never, string] extends Repeat ? ResultString | '' : RepeatStringFromTo<ResultString | '', Repeat[0], Repeat[1]> : ''>,
    ...(Greedy extends true ? Captures | CountNumOfCaptureGroupsAs<OptionalMatchers> : TupleItemExtendsType<[
        ...Matchers,
        ...OutMostRestMatchers
    ], [
        ...CurrentIndex,
        ''
    ], Matcher> extends true ? Captures : CountNumOfCaptureGroupsAs<OptionalMatchers>)
], NamedCaptures | (Greedy extends true ? NextedNamedCapture | ResolveNamedCaptureUnion<[OptionalMatchers], never> : TupleItemExtendsType<[
    ...Matchers,
    ...OutMostRestMatchers
], [
    ...CurrentIndex,
    ''
], Matcher> extends true ? NextedNamedCapture : ResolveNamedCaptureUnion<[OptionalMatchers], NamedCaptures>), [
    ...CurrentIndex,
    ''
]> : never : CurrentMatcher extends {
    type: 'or';
    value: infer OrMatchersArray extends Matcher[][];
} ? OrMatchersArray[number] extends infer OrMatchers extends Matcher[] ? OrMatchers extends OrMatchers ? ResolvePermutation<OrMatchers, ConcateRestMatchers<Matchers, OutMostRestMatchers, CurrentIndex>, [
    ''
], NamedCaptures> extends PermutationResult<[
    infer ResultString extends string,
    ...infer Captures extends any[]
], infer NextedNamedCapture> ? ResolvePermutation<Matchers, OutMostRestMatchers, [
    ...ConcatToFirstElement<MatchResultArray, ResultString>,
    ...ResolveOrCaptureTuple<OrMatchersArray, Captures, IndexOf<OrMatchersArray, OrMatchers>>
], NamedCaptures | ResolveNamedCaptureUnion<OrMatchersArray, NextedNamedCapture>, [
    ...CurrentIndex,
    ''
]> : never : never : never : CurrentMatcher extends {
    type: infer Type extends 'zeroOrMore' | 'oneOrMore';
    value: infer AnyOrMoreMatchers extends Matcher[];
    greedy: infer Greedy extends boolean;
} ? ResolvePermutation<AnyOrMoreMatchers, ConcateRestMatchers<Matchers, OutMostRestMatchers, CurrentIndex>, [
    ''
], NamedCaptures> extends infer Result ? Result extends PermutationResult<[
    infer ResultString extends string,
    ...infer Captures extends any[]
], infer NextedNamedCapture> ? ResultString extends ResultString ? ResolvePermutation<Matchers, OutMostRestMatchers, [
    ...ConcatToFirstElement<MatchResultArray, true extends Greedy | TupleItemExtendsType<[
        ...Matchers,
        ...OutMostRestMatchers
    ], [
        ...CurrentIndex,
        ''
    ], Matcher> ? (Type extends 'zeroOrMore' ? '' : never) | ResultString | `${ResultString}${string}${ResultString}` | `[ ${Type extends 'zeroOrMore' ? 'zero' : 'one'} or more of \`${ResultString}\` ]` : Type extends 'zeroOrMore' ? '' : ResultString>,
    ...(true extends Greedy | TupleItemExtendsType<[
        ...Matchers,
        ...OutMostRestMatchers
    ], [
        ...CurrentIndex,
        ''
    ], Matcher> ? Type extends 'zeroOrMore' ? CountNumOfCaptureGroupsAs<AnyOrMoreMatchers> | Captures : Captures : Type extends 'zeroOrMore' ? CountNumOfCaptureGroupsAs<AnyOrMoreMatchers> : Captures)
], NamedCaptures | (true extends Greedy | TupleItemExtendsType<[
    ...Matchers,
    ...OutMostRestMatchers
], [
    ...CurrentIndex,
    ''
], Matcher> ? Type extends 'zeroOrMore' ? ResolveNamedCaptureUnion<[AnyOrMoreMatchers], never> | NextedNamedCapture : NextedNamedCapture : Type extends 'zeroOrMore' ? ResolveNamedCaptureUnion<[AnyOrMoreMatchers], never> : NextedNamedCapture), [
    ...CurrentIndex,
    ''
]> : never : never : never : CurrentMatcher extends {
    type: 'repeat';
    value: infer RepeatMatchers extends Matcher[];
    from: infer From extends `${number}`;
    to: infer To extends `${number}` | '' | string;
    greedy: infer Greedy extends boolean;
} ? ResolvePermutation<ExpandRepeat<RepeatMatchers, From, To, Greedy>, ConcateRestMatchers<Matchers, OutMostRestMatchers, CurrentIndex>, [
    ''
], NamedCaptures> extends infer Result ? Result extends PermutationResult<[
    infer ResultString extends string,
    ...infer Captures extends any[]
], infer NextedNamedCapture> ? ResolvePermutation<Matchers, OutMostRestMatchers, [
    ...ConcatToFirstElement<MatchResultArray, true extends Greedy | TupleItemExtendsType<[
        ...Matchers,
        ...OutMostRestMatchers
    ], [
        ...CurrentIndex,
        ''
    ], Matcher> ? ResultString extends `${string}zero${string}\`${infer RepeatString}\`${string}` ? `[ repeat \`${RepeatString}\` ${From} to unlimited times ]` : ResultString : [From, To] extends ['0', ''] ? '' : ResultString | (string extends To ? `[ repeat \`${ResultString}\` ${From} times ]` : never)>,
    ...(true extends Greedy | TupleItemExtendsType<[
        ...Matchers,
        ...OutMostRestMatchers
    ], [
        ...CurrentIndex,
        ''
    ], Matcher> ? Captures : From extends '0' ? CountNumOfCaptureGroupsAs<RepeatMatchers> : Captures)
], NamedCaptures | NextedNamedCapture, [
    ...CurrentIndex,
    ''
]> : never : never : PermutationResult<MatchResultArray, NamedCaptures>;

type ResolveRepalceValue<ReplaceValue extends string, Precedes extends string, MatchArray extends (string | undefined)[], RestInputString extends string, NamedCaptures extends NamedCapturesTuple, ResultRepalceString extends string = ''> = ReplaceValue extends `${infer Before}$${infer After}` ? After extends `${infer FirstChar extends '$' | '&' | '`' | "'" | '0' | Extract<keyof MatchArray, `${number}`>}${infer Rest}` ? ResolveRepalceValue<Rest, Precedes, MatchArray, RestInputString, NamedCaptures, `${ResultRepalceString}${Before}${({
    $: '$';
    '&': MatchArray[0];
    '`': Precedes;
    "'": RestInputString;
    '0': '$0';
} & {
    [K in keyof MatchArray]: K extends '0' ? '$0' : MatchArray[K];
})[FirstChar]}`> : After extends `<${infer Name extends NamedCaptures[0]}>${infer Rest}` ? ResolveRepalceValue<Rest, Precedes, MatchArray, RestInputString, NamedCaptures, `${ResultRepalceString}${Before}${{
    [K in NamedCaptures[0]]: Extract<NamedCaptures, [K, any]>[1];
}[Name]}`> : ResolveRepalceValue<After, Precedes, MatchArray, RestInputString, NamedCaptures, `${ResultRepalceString}${Before}$`> : `${ResultRepalceString}${ReplaceValue}`;
type GlobalReplace<InputString extends string, Matchers extends Matcher[], ReplaceValue extends string, Flags extends Flag, AccPrecedes extends string = '', ResultString extends string = ''> = ExhaustiveMatch<InputString, Matchers, Flags> extends infer Result ? Result extends MatchedResult<infer MatchArray extends any[], infer RestInputString extends string, infer NamedCaptures extends NamedCapturesTuple> ? InputString extends `${infer Precedes}${MatchArray[0]}${RestInputString}` ? GlobalReplace<RestInputString, Matchers, ReplaceValue, Flags, Precedes, `${ResultString}${Precedes}${ResolveRepalceValue<ReplaceValue, `${AccPrecedes}${MatchArray[0]}${Precedes}`, MatchArray, RestInputString, NamedCaptures>}`> : never : `${ResultString}${InputString}` : never;

type Flag = 'd' | 'g' | 'i' | 'm' | 's' | 'u' | 'y';
type TypedRegExp<RegExpPattern extends string, Flags extends Flag, ParsedRegExpAST extends Matcher[]> = RegExp & {
    regexp: RegExpPattern;
    flags: Flags;
    parsedRegExpAST: ParsedRegExpAST;
};
type RegExpIterableIterator<MatchedTuple extends any[]> = Omit<IterableIterator<MatchedTuple[number]>, 'next'> & {
    _matchedTuple: MatchedTuple;
    next: () => IteratorResult<MatchedTuple[number], MatchedTuple[number] | undefined>;
};
type ValidateRegExpSyntaxError<RawRegExpPattern extends string, RegExpParsedResult extends Matcher[] | RegExpSyntaxError<any> = ParseRegExp<RawRegExpPattern>> = RegExpParsedResult extends RegExpSyntaxError<any> ? RegExpParsedResult : RawRegExpPattern;
declare function createRegExp<RegExpPattern extends string, Flags extends Flag = never, RegExpParsedResult extends Matcher[] = ParseRegExp<RegExpPattern>>(pattern: ValidateRegExpSyntaxError<RegExpPattern>, flags?: Flags[] | Set<Flags>): TypedRegExp<RegExpPattern, Flags, RegExpParsedResult>;
declare function spreadRegExpMatchArray<MatchArray extends {
    [Symbol.iterator]: () => IterableIterator<any>;
    _matchArray: any[];
} | null | undefined>(matchArray: MatchArray): MatchArray extends {
    _matchArray: any[];
    [Symbol.iterator]: () => IterableIterator<any>;
} ? MatchArray["_matchArray"] : null;
declare function spreadRegExpIterator<Iter extends (Iterable<any> & {
    _matchedTuple: any;
}) | null>(iterableIterator: Iter): Iter extends {
    _matchedTuple: infer Tuple;
} ? Tuple : null;
type MatchRegExp<InputString extends string, ParsedRegExpAST extends Matcher[], Flags extends Flag> = Matcher[] extends ParsedRegExpAST ? RegExpMatchArray | null : string extends InputString ? ResolvePermutation<ParsedRegExpAST> extends PermutationResult<infer MatchArray, infer NamedCaptures extends NamedCapturesTuple> ? 'g' extends Flags ? MatchArray[0][] : RegExpMatchResult<{
    matched: 'i' extends Flags ? PrependAndUnionToAll<MatchArray, '[Case Insensitive] ', string & {
        all: true;
    }> : MatchArray;
    namedCaptures: NamedCaptures;
    input: InputString;
    restInput: undefined;
}> | null : never : 'g' extends Flags ? GlobalMatch<InputString, ParsedRegExpAST, Flags> : ExhaustiveMatch<InputString, ParsedRegExpAST, Flags> extends infer Result ? Result extends MatchedResult<infer MatchArray extends any[], infer RestInputString extends string, infer NamedCaptures extends NamedCapturesTuple> ? RegExpMatchResult<{
    matched: MatchArray;
    namedCaptures: NamedCaptures;
    input: InputString;
    restInput: RestInputString;
}> : Result extends NullResult<any, any, any> ? Result['results'] : never : never;
type RegExpMatchResult<Result extends {
    matched: any[];
    namedCaptures: [string, any];
    input: string;
    restInput: string | undefined;
}, MatchObject = {
    index: Result['restInput'] extends undefined ? number : Result['input'] extends `${infer Precedes}${Result['matched'][0]}${Result['restInput']}` ? LengthOfString<Precedes> : never;
    input: Result['input'];
    groups: (() => Result['namedCaptures']) extends () => never ? undefined : {
        [K in Result['namedCaptures'][0]]: Extract<Result['namedCaptures'], [K, any]>[1];
    };
    keys: () => IterableIterator<Extract<keyof Result['matched'], `${number}`>>;
    _matchArray: Result['matched'];
}> = {
    [K in Exclude<keyof Result['matched'], number | string> | keyof MatchObject]: K extends keyof MatchObject ? MatchObject[K] : K extends keyof Result['matched'] ? Result['matched'][K] : never;
} & Pick<Result['matched'], Exclude<Extract<keyof Result['matched'], string>, keyof MatchObject>>;
type MatchAllRegExp<InputString extends string, ParsedRegExpAST extends Matcher[], Flags extends Flag, MatchedResultTuple extends any[] = [], InitialInputString extends string = InputString> = Matcher[] extends ParsedRegExpAST ? RegExpMatchArray[] : ParsedRegExpAST extends ParsedRegExpAST ? string extends InputString ? ResolvePermutation<ParsedRegExpAST> extends PermutationResult<infer MatchArray, infer NamedCaptures extends NamedCapturesTuple> ? RegExpIterableIterator<(RegExpMatchResult<{
    matched: 'i' extends Flags ? PrependAndUnionToAll<MatchArray, '[Case Insensitive] ', string & {
        all: true;
    }> : MatchArray;
    namedCaptures: NamedCaptures;
    input: InputString;
    restInput: undefined;
}> | null)[]> : never : ExhaustiveMatch<InputString, ParsedRegExpAST, Flags> extends infer Result ? Result extends MatchedResult<infer MatchArray extends any[], infer RestInputString extends string, infer NamedCaptures extends NamedCapturesTuple> ? MatchAllRegExp<RestInputString, ParsedRegExpAST, Flags, [
    ...MatchedResultTuple,
    RegExpMatchResult<{
        matched: MatchArray;
        namedCaptures: NamedCaptures;
        input: InitialInputString;
        restInput: RestInputString;
    }>
], InitialInputString> : MatchedResultTuple extends [] ? null : RegExpIterableIterator<MatchedResultTuple> : never : never;
type ReplaceWithRegExp<InputString extends string, ParsedRegExpAST extends Matcher[], ReplaceValue extends string, Flags extends Flag> = 'g' extends Flags ? GlobalReplace<InputString, ParsedRegExpAST, ReplaceValue, Flags> : ExhaustiveMatch<InputString, ParsedRegExpAST, Flags> extends infer Result ? Result extends MatchedResult<infer MatchArray extends any[], infer RestInputString extends string, infer NamedCaptures extends NamedCapturesTuple> ? InputString extends `${infer Precedes}${MatchArray[0]}${RestInputString}` ? `${Precedes}${ResolveRepalceValue<ReplaceValue, Precedes, MatchArray, RestInputString, NamedCaptures>}${RestInputString}` : never : InputString : never;

export { ExhaustiveMatch, Flag, GlobalMatch, MatchAllRegExp, MatchRegExp, Matcher, ParseRegExp, RegExpIterableIterator, RegExpMatchResult, ReplaceWithRegExp, ResolvePermutation, TypedRegExp, ValidateRegExpSyntaxError, createRegExp, spreadRegExpIterator, spreadRegExpMatchArray };
