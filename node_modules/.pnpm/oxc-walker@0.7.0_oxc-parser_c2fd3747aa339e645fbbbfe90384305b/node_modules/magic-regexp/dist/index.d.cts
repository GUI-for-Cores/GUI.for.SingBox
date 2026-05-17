import { M as MagicRegExp, F as Flag, a as MagicRegExpMatchArray, I as InputSource, J as Join, b as MapToValues, c as MapToGroups, d as MapToCapturedGroupsArr, U as UnionToTuple } from './shared/magic-regexp.Cp7m-ws-.cjs';
export { h as Input, D as MapToStringCapturedBy, S as StringCapturedBy, k as anyOf, y as carriageReturn, e as caseInsensitive, l as char, i as charIn, j as charNotIn, q as digit, f as dotAll, B as exactly, g as global, t as letter, x as linefeed, A as maybe, m as multiline, z as not, C as oneOrMore, s as sticky, v as tab, u as unicode, r as whitespace, w as withIndices, n as word, p as wordBoundary, o as wordChar } from './shared/magic-regexp.Cp7m-ws-.cjs';

declare const createRegExp: {
    /** Create Magic RegExp from Input helpers and string (string will be sanitized) */
    <Inputs extends InputSource[]>(...inputs: Inputs): MagicRegExp<`/${Join<MapToValues<Inputs>, '', ''>}/`, MapToGroups<Inputs>, MapToCapturedGroupsArr<Inputs>, never>;
    <Inputs extends InputSource[], Flags extends Flag[] = never[]>(...inputs: [...Inputs, [...Flags]]): MagicRegExp<`/${Join<MapToValues<Inputs>, '', ''>}/${Join<Flags, '', ''>}`, MapToGroups<Inputs>, MapToCapturedGroupsArr<Inputs>, Flags[number]>;
    <Inputs extends InputSource[], FlagUnion extends Flag = never, Flags extends Flag[] = UnionToTuple<FlagUnion> extends infer F extends Flag[] ? F : never>(...inputs: [...Inputs, Set<FlagUnion>]): MagicRegExp<`/${Join<MapToValues<Inputs>, '', ''>}/${Join<Flags, '', ''>}`, MapToGroups<Inputs>, MapToCapturedGroupsArr<Inputs>, Flags[number]>;
};

declare global {
    interface String {
        match<R extends MagicRegExp<string, string, (string | undefined)[], Exclude<Flag, 'g'>>>(regexp: R): MagicRegExpMatchArray<R> | null;
        match<R extends MagicRegExp<string, string, (string | undefined)[], 'g'>>(regexp: R): string[] | null;
        /** @deprecated String.matchAll requires global flag to be set. */
        matchAll<R extends MagicRegExp<string, string, (string | undefined)[], never>>(regexp: R): never;
        /** @deprecated String.matchAll requires global flag to be set. */
        matchAll<R extends MagicRegExp<string, string, (string | undefined)[], Exclude<Flag, 'g'>>>(regexp: R): never;
        matchAll<R extends MagicRegExp<string, string, (string | undefined)[], string>>(regexp: R): IterableIterator<MagicRegExpMatchArray<R>>;
        /** @deprecated String.replaceAll requires global flag to be set. */
        replaceAll<R extends MagicRegExp<string, string, (string | undefined)[], never>>(searchValue: R, replaceValue: string | ((substring: string, ...args: any[]) => string)): never;
        /** @deprecated String.replaceAll requires global flag to be set. */
        replaceAll<R extends MagicRegExp<string, string, (string | undefined)[], Exclude<Flag, 'g'>>>(searchValue: R, replaceValue: string | ((substring: string, ...args: any[]) => string)): never;
    }
}

export { Flag, MagicRegExp, MagicRegExpMatchArray, createRegExp };
