import { MatchRegExp, ParseRegExp, MatchAllRegExp, RegExpMatchResult, ReplaceWithRegExp } from 'type-level-regexp/regexp';
export { spreadRegExpIterator, spreadRegExpMatchArray } from 'type-level-regexp/regexp';
import { F as Flag, J as Join, I as InputSource, b as MapToValues, c as MapToGroups, U as UnionToTuple } from './shared/magic-regexp.Cp7m-ws-.cjs';
export { h as Input, a as MagicRegExpMatchArray, D as MapToStringCapturedBy, S as StringCapturedBy, k as anyOf, y as carriageReturn, e as caseInsensitive, l as char, i as charIn, j as charNotIn, q as digit, f as dotAll, B as exactly, g as global, t as letter, x as linefeed, A as maybe, m as multiline, z as not, C as oneOrMore, s as sticky, v as tab, u as unicode, r as whitespace, w as withIndices, n as word, p as wordBoundary, o as wordChar } from './shared/magic-regexp.Cp7m-ws-.cjs';

declare const NamedGroupsS: unique symbol;
declare const ValueS: unique symbol;
declare const FlagsS: unique symbol;
type MagicRegExp<Value extends string, NamedGroups extends string | never = never, Flags extends Flag[] | never = never> = RegExp & {
    [NamedGroupsS]: NamedGroups;
    [ValueS]: Value;
    [FlagsS]: Flags;
};
declare const createRegExp: {
    /** Create Magic RegExp from Input helpers and string (string will be sanitized) */
    <Inputs extends InputSource[]>(...inputs: Inputs): MagicRegExp<`/${Join<MapToValues<Inputs>, '', ''>}/`, MapToGroups<Inputs>, []>;
    <Inputs extends InputSource[], FlagUnion extends Flag | undefined = undefined, CloneFlagUnion extends Flag | undefined = FlagUnion, Flags extends Flag[] = CloneFlagUnion extends undefined ? [] : UnionToTuple<FlagUnion> extends infer F extends Flag[] ? F : never>(...inputs: [...Inputs, [...Flags] | string | Set<FlagUnion>]): MagicRegExp<`/${Join<MapToValues<Inputs>, '', ''>}/${Join<Flags, '', ''>}`, MapToGroups<Inputs>, Flags>;
};

declare global {
    interface String {
        match<InputString extends string, RegExpPattern extends string, Flags extends Flag[]>(this: InputString, regexp: MagicRegExp<`/${RegExpPattern}/${Join<Flags, '', ''>}`, string, Flags>): MatchRegExp<InputString, ParseRegExp<RegExpPattern>, Flag[] extends Flags ? never : Flags[number]>;
        /** @deprecated String.matchAll requires global flag to be set. */
        matchAll<R extends MagicRegExp<string, string, Exclude<Flag, 'g'>[]>>(regexp: R): never;
        matchAll<InputString extends string, RegExpPattern extends string, Flags extends Flag[]>(this: InputString, regexp: MagicRegExp<`/${RegExpPattern}/${Join<Flags, '', ''>}`, string, Flags>): MatchAllRegExp<InputString, ParseRegExp<RegExpPattern>, Flag[] extends Flags ? never : Flags[number]>;
        /** @deprecated String.matchAll requires global flag to be set. */
        matchAll<R extends MagicRegExp<string, string, never>>(regexp: R): never;
        replace<InputString extends string, RegExpPattern extends string, Flags extends Flag[], ReplaceValue extends string, RegExpParsedAST extends any[] = string extends RegExpPattern ? never : ParseRegExp<RegExpPattern>, MatchResult = MatchRegExp<InputString, RegExpParsedAST, Flags[number]>, Match extends any[] = MatchResult extends RegExpMatchResult<{
            matched: infer MatchArray extends any[];
            namedCaptures: [string, any];
            input: infer Input extends string;
            restInput: string | undefined;
        }, {
            index: infer Index extends number;
            groups: infer Groups;
            input: string;
            keys: (...arg: any) => any;
        }> ? [...MatchArray, Index, Input, Groups] : never>(this: InputString, regexp: MagicRegExp<`/${RegExpPattern}/${Join<Flags, '', ''>}`, string, Flags>, replaceValue: ReplaceValue | ((...match: Match) => ReplaceValue)): any[] extends RegExpParsedAST ? never : ReplaceWithRegExp<InputString, RegExpParsedAST, ReplaceValue, Flags[number]>;
        /** @deprecated String.replaceAll requires global flag to be set. */
        replaceAll<R extends MagicRegExp<string, string, never>>(searchValue: R, replaceValue: string | ((substring: string, ...args: any[]) => string)): never;
        /** @deprecated String.replaceAll requires global flag to be set. */
        replaceAll<R extends MagicRegExp<string, string, Exclude<Flag, 'g'>[]>>(searchValue: R, replaceValue: string | ((substring: string, ...args: any[]) => string)): never;
    }
}

export { Flag, type MagicRegExp, createRegExp };
