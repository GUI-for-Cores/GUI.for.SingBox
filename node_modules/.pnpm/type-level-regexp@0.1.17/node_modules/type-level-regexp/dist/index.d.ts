import { Matcher, Flag, TypedRegExp, MatchRegExp, MatchAllRegExp, RegExpMatchResult, ReplaceWithRegExp } from './regexp.js';
export { ExhaustiveMatch, GlobalMatch, ParseRegExp, RegExpIterableIterator, ResolvePermutation, ValidateRegExpSyntaxError, createRegExp, spreadRegExpIterator, spreadRegExpMatchArray } from './regexp.js';

declare global {
    interface String {
        match<InputString extends string, RegExpParsedAST extends Matcher[], Flags extends Flag>(this: InputString, regexp: TypedRegExp<string, Flags, RegExpParsedAST>): Matcher[] extends RegExpParsedAST ? never : MatchRegExp<InputString, RegExpParsedAST, Flags>;
        /** @deprecated String.matchAll requires global flag to be set. */
        matchAll<InputString extends string, RegExpParsedAST extends Matcher[], Flags extends Exclude<Flag, 'g'>>(this: InputString, regexp: TypedRegExp<string, Flags, RegExpParsedAST>): never;
        matchAll<InputString extends string, RegExpParsedAST extends Matcher[], Flags extends Flag>(this: InputString, regexp: TypedRegExp<any, Flags, RegExpParsedAST>): Matcher[] extends RegExpParsedAST ? never : MatchAllRegExp<InputString, RegExpParsedAST, Flags>;
        /** @deprecated String.matchAll requires global flag to be set. */
        matchAll(regexp: TypedRegExp<string, never, any>): never;
        replace<InputString extends string, RegExpParsedAST extends Matcher[], Flags extends Flag, ReplaceValue extends string, MatchResult = Matcher[] extends RegExpParsedAST ? never : MatchRegExp<InputString, RegExpParsedAST, Flags>, Match extends any[] = MatchResult extends RegExpMatchResult<{
            matched: infer MatchArray extends any[];
            namedCaptures: [string, any];
            input: infer Input extends string;
            restInput: string | undefined;
        }, {
            index: infer Index extends number;
            groups: infer Groups;
            input: string;
            keys: (...arg: any) => any;
        }> ? [...MatchArray, Index, Input, Groups] : never>(this: InputString, regexp: TypedRegExp<string, Flags, RegExpParsedAST>, replaceValue: ReplaceValue | ((...match: Match) => ReplaceValue)): Matcher[] extends RegExpParsedAST ? never : ReplaceWithRegExp<InputString, RegExpParsedAST, ReplaceValue, Flags>;
    }
}

export { Flag, MatchAllRegExp, MatchRegExp, Matcher, RegExpMatchResult, ReplaceWithRegExp, TypedRegExp };
