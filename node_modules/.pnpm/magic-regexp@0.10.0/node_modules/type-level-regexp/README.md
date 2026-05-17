# 🔤🔍 Type-Level RegExp (WIP)
[![npm version][npm-version-src]][npm-version-href]

> TypeScript type-level RegExp parser and matcher implemented using template literals.

![Demo](https://user-images.githubusercontent.com/29917252/224330392-daeee9a5-d448-4f00-baf2-29365bdfa4b5.png)


[![Open in Codeflow](https://developer.stackblitz.com/img/open_in_codeflow.svg)](https://stackblitz.com/~/github.com/didavid61202/type-level-regexp)

👉 [Try on TypeScript Playground](https://www.typescriptlang.org/play?target=99&jsx=0#code/PQKhCgAIUqYMQPYCdIFsUFNKYB4EM0AHAG0wGdJ8A7AEypJMnIFciiUAXTegJUwDmAUVxFIRfJ27JqlGvRbl8AzABo44svnLYdmAFyQAFlKLl9wYAICWnIywBGAOgDGiNMFrXa+AG7eANgBGACYABhDgTgBPIkwAWjJfTBJ45EE8Ig04YHBwS0gAIW1rF0hFZQNIa2IuKjpynUgAAxd0yUx+YVEACgByAB4ukTEJKUwZAD4+gEpm6upNfBdsRAAzSGjEFlRqFDR8JmAhwRHxSWlqSeBIYdFIRAcAK0wXTidwGo5kTkgAb0gbUwHTuYgAvpA1sh3JAAEQxOKJTDJVLpFSiWEAblgBQAhPjIAAFLRNADu+FskMwpOYr0QdEoaxQkAAKgBlJbRATQlgNTiIKmcFxGSB9BEJJIpNIZUR9SHQtCQahERXySDpKEUEV2bDihZrCaYagrSD43F5UAQaCQNmcZDWagCJwHIVGHozHAEYhkHLgNyyX5os4AXkB7W4oJ6sKZiB6AH4BgIgpMHPgANoCNIAXRm8f0PVTAC8ZgAfByIRAzOPx4MARxYuBmsNUkDTsOssJzmPyN0gfcgAD043l-eRfi7hfxWCRfqH4RROIY1gB5R74XjlxAARQbsOdkmFPSDohm3YK-cHw-AE6MU5YM7TYSzZ97F4vQ7yN7vD6Cz57b7fD8vwoe9ODTEI-3PAC+yAg9bxAh8AGZINfaDYNdb93gdWg8BfaD+3QycEPeMhHTsPD8Mva84MwpxuW2MwKPwj98jADRbXtR0nHSUhlkwd1PUIUhMF9Udfh8bgOIdARIFDPpYRZIxsB8aJICCABOdSgniMJ1PiIIAFZqjkG1eRU2E+m4zBeJWHooEgKCqL7IEQVOXp7L7WF4wGYMAB1fIAdVzBMiA1axcEmPN-NJEt-PIGYQDjYKBmiYFkEmfzaD+AAWMEZnibyMGoOwMt8rKQjygqExU0ryry7zWDWNZwsiuN9Gi2LfPikAZn8gLYXsmZ1D7OyLxvYb+1CzBmtwCa+wKD8L1S-BkDmhybkW-sirsNaVLWxqZrW9YDR0Tg1oW4cLwdIgWDOjzIHothyHui7BtkyZ7uaABJRY0wAEj+a7brBLMWxvSAAZvCFJAWHDcEMAHjooTBOAhaxKC+tll0gAAOAIwiCJxARoBhyAFJlkBdKhzAhv4ppmsEAceswnBUsFgEh+k7HZpmeRZ5bkEZv4DvCiEehU2TabZ+p6AFyWAYFvLmnAU8LTY612RwZBoVQawNgdXxDm8W43LEchomK-BZuMRBklQflaWUlGKSYCYdfQCglBUD5oFyMSFkNkhvFBSWXIjU2oxjAsVthVXHKooA)
or see examples in `Playground` and `test` folders.

 🚧 Work In Progress, PRs and issues are welcome 🚧 

## Quick Setup

1. Add `type-level-regexp` dependency to your project

```bash
# Using pnpm
pnpm i -D type-level-regexp

# Using npm
npm i -D type-level-regexp
```

2. Import `createRegExp` function, pass in a RegExp string pattern to it creates a `TypedRegExp`, passing this `TypedRegExp` to `String.match()`, `String.matchAll()` or `String.replace()` functions to get fully typed match result.

## Basic Usage
match result will be fully typed if match against a literal stirng, or shows emumerated results if match against a dynamic string.
```ts
import { createRegExp, spreadRegExpIterator } from 'type-level-regexp'

/** string.match() */
const regExp = createRegExp('foO(?<g1>b[a-g]r)(?:BAz|(?<g2>qux))', ['i'])
const matchResult = 'prefix foobarbaz suffix'.match(regExp) // matching literal string
matchResult[0] // 'foobarbaz'
matchResult[1] // 'bar'
matchResult[3] // show type error `type '3' can't be used to index type 'RegExpMatchResult<...>`
matchResult.length // 3
matchResult.index // 7
matchResult.groups // { g1: "bar"; g2: undefined; }

/** string.replace() */
const regExp2 = createRegExp('(\\d{4})[-.](?<month>\\w{3,4})[-.](\\d{1,2})')
const replaceResult = '1991-Sept-15'.replace(regExp2, '$<month> $3, $1')
replaceResult // 'Sept 15, 1991'

/** string.matchAll() */
const regExp3 = createRegExp('c[a-z]{2}', ['g'])
const matchALlIterator = 'cat car caw cay caw cay'.matchAll(regExp3)
const spreadedResult = spreadRegExpIterator(matchALlIterator)
spreadedResult[2][0] // 'caw'
spreadedResult[3].index // 12

const InvalidRegExp = createRegExp('foo(bar')
// TypeScript error: Argument of type 'string' is not assignable to parameter of type 'RegExpSyntaxError<"Invalid regular expression, missing closing \`)\`">'
```

For TypeScript library authors, you can also import individual generic types to parse and match RegExp string at type-level and combine with your library's type-level features.

```ts
import { ParseRegExp, MatchRegExp } from 'type-level-regexp'

type MatchResult = MatchRegExp<'fooBAR42', ParseRegExp<'Fo[a-z](Bar)\\d{2}'>, 'i'>

type Matched = MatchResult[0] // 'fooBAR42'
type First = MatchResult[1] // 'BAR'

type RegExpAST = ParseRegExp<'foo(?<g1>bar)'>
// [{
//     type: "string";
//     value: "foo";
// }, {
//     type: "namedCapture";
//     name: "g1";
//     value: [{
//         type: "string";
//         value: "bar";
//     }];
// }]

```


## Origin & Notice
The main purpose of this project is to test and demonstrate the possibility and limitations of writing a RegExp parser/matcher in TypeScript's type-level. Note that this may not be practically useful, but rather an interesting showcase.

The idea for this project originated while I was working on improving the type hints of string.match and replace in [magic-regexp](https://github.com/danielroe/magic-regexp) (created by the most inspiring, resourceful, and kind [Daniel Roe](https://github.com/danielroe) from [Nuxt](https://nuxt.com), definitely check it out if you are working with RegExp and TypeScript!).

As the complexity grows, I start working on this separated repo to increase development speed and try out different iterations. It will be incorporate and use in [magic-regexp](https://github.com/danielroe/magic-regexp), and [Gabriel Vergnaud](https://github.com/gvergnaud)'s awesome [hotscript](https://github.com/gvergnaud/hotscript) very soon.

❤️ Testing, feedbacks and PRs are welcome!
 
## Features

- Export `createRegExp` function to create a`TypedRegExp` that replace your original `/regex_pattern/` regex object, which can be pass to  `String.match()`, `String.matchAll()` and `String.replace()` functions and gets fully typed result.
- Shows `RegExpSyntaxError` if the provided RegExp pattern is invalid.
- Enhance types of RegExp related `String` functions (`.match`, `matchAll`, `.replace`...) for literal or dynamic typed string.
- Result of `String` functions matched exactly as runtime result.
- Support all common RegExp tokens (incl. Lookarounds, Backreferences...etc), quantifiers (incl. greedy/lazy) and (`g`,`i`) flags.
- Export helper functions `spreadRegExpMatchArray` and `spreadRegExpIterator` to get tuple type of match results and iterators.
- Provide generic type `ParseRegExp` to parse and RegExp string to AST.
- Provide generic type `MatchRegExp` to match giving string with a parsed RegExp.
- Provide generic type `ResolvePermutation` to permutation all possible matching string of given RegExp if possible (due to TypeScript type-level limitation)
- More details please [try on TypeScript Playground](https://www.typescriptlang.org/play?target=99&jsx=0#code/PQKhCgAIUqYMQPYCdIFsUFNKYB4EM0AHAG0wGdJ8A7AEypJMnIFciiUAXTegJUwDmAUVxFIRfJ27JqlGvRbl8AzABo44svnLYdmAFyQAFlKLl9wYAICWnIywBGAOgDGiNMFrXa+AG7eANgBGACYABhDgTgBPIkwAWjJfTBJ45EE8Ig04YHBwS0gAIW1rF0hFZQNIa2IuKjpynUgAAxd0yUx+YVEACgByAB4ukTEJKUwZAD4+gEpm6upNfBdsRAAzSGjEFlRqFDR8JmAhwRHxSWlqSeBIYdFIRAcAK0wXTidwGo5kTkgAb0gbUwHTuYgAvpA1sh3JAAEQxOKJTDJVLpFSiWEAblgBQAhPjIAAFLRNADu+FskMwpOYr0QdEoaxQkAAKgBlJbRATQlgNTiIKmcFxGSB9BEJJIpNIZUR9SHQtCQahERXySDpKEUEV2bDihZrCaYagrSD43F5UAQaCQNmcZDWagCJwHIVGHozHAEYhkHLgNyyX5os4AXkB7W4oJ6sKZiB6AH4BgIgpMHPgANoCNIAXRm8f0PVTAC8ZgAfByIRAzOPx4MARxYuBmsNUkDTsOssJzmPyN0gfcgAD043l-eRfi7hfxWCRfqH4RROIY1gB5R74XjlxAARQbsOdkmFPSDohm3YK-cHw-AE6MU5YM7TYSzZ97F4vQ7yN7vD6Cz57b7fD8vwoe9ODTEI-3PAC+yAg9bxAh8AGZINfaDYNdb93gdWg8BfaD+3QycEPeMhHTsPD8Mva84MwpxuW2MwKPwj98jADRbXtR0nHSUhlkwd1PUIUhMF9Udfh8bgOIdARIFDPpYRZIxsB8aJICCABOdSgniMJ1PiIIAFZqjkG1eRU2E+m4zBeJWHooEgKCqL7IEQVOXp7L7WF4wGYMAB1fIAdVzBMiA1axcEmPN-NJEt-PIGYQDjYKBmiYFkEmfzaD+AAWMEZnibyMGoOwMt8rKQjygqExU0ryry7zWDWNZwsiuN9Gi2LfPikAZn8gLYXsmZ1D7OyLxvYb+1CzBmtwCa+wKD8L1S-BkDmhybkW-sirsNaVLWxqZrW9YDR0Tg1oW4cLwdIgWDOjzIHothyHui7BtkyZ7uaABJRY0wAEj+a7brBLMWxvSAAZvCFJAWHDcEMAHjooTBOAhaxKC+tll0gAAOAIwiCJxARoBhyAFJlkBdKhzAhv4ppmsEAceswnBUsFgEh+k7HZpmeRZ5bkEZv4DvCiEehU2TabZ+p6AFyWAYFvLmnAU8LTY612RwZBoVQawNgdXxDm8W43LEchomK-BZuMRBklQflaWUlGKSYCYdfQCglBUD5oFyMSFkNkhvFBSWXIjU2oxjAsVthVXHKooA), or see tests files in [Tests](./test) and [Stackblitz](https://stackblitz.com/~/github.com/didavid61202/type-level-regexp). (examples in index.test-d.ts)


#### Example - type-safe args in replacing function of `string.replace()`
![replaceRegexp](https://user-images.githubusercontent.com/29917252/224333879-50d51207-f63c-4ac6-b561-34ace9ebb7d4.JPG)

#### Example - spreaded `string.matchAll()` with union of RegExp pattern remain as tuple
![type-level-matchAll-with-union](https://user-images.githubusercontent.com/29917252/224666590-0bfdc22b-ac5d-4b8e-94e3-545fd57a8233.png)


### RegExp Tokens & Flags

| Tokens | Description | Support |
| --- | --- | --- |
|  `.` | Matches any single character. | ✅ |
|  `*`, `*?` | Matches zero or more occurrences (Greedy/Lazy). | ✅ |
|  `+`, `*?` | Matches one or more occurrences (Greedy/Lazy). | ✅ |
|  `?`, `??` | Matches zero or one occurrence (Greedy/Lazy). | ✅ |
|  `^` | Matches the start of a line. | ✅ |
|  `$` | Matches the end of a line. | ✅ |
|  `\s`, `\S` | Matches any whitespace, non-whitespace character. | ✅ |
|  `\d`, `\D` | Matches any digit, non-digit character. | ✅ |
|  `\w`, `\W` | Matches any word, non-word character. | ✅ |
|  `\b`, `\B` | Matches a word-boundary, non-word-boundary. | ✅ |
|  `[abc]` | Matches any character in the set. | ✅ |
|  `[^abc]` | Matches any character not in the set. | ✅ |
|  `()` | Creates a capturing group. | ✅ |
|  `(?:)` | Creates a non-capturing group. | ✅ |
|  `(?<name>)` | Creates a named-capturing group. | ✅ |
|  `\|` | Matches either the expression before or after the vertical bar. | ✅ |
|  `{n}` | Matches exactly `n` occurrences. | ✅ |
|  `{n,}` | Matches at least `n` occurrences. | ✅ |
|  `{n,m}` | Matches between `n` and `m` occurrences. | ✅ |
|  `(?=)`, `(?!)` | Positive/Negative lookahead. | ✅ |
|  `(?<=)`, `(?<!)` | Positive/Negative lookbehind. | ✅ |

| Flags | Description | Support |
| --- | --- | --- |
|  `g` | Global matching (matches all occurrences). | ✅ |
|  `i` | Case-insensitive matching. | ✅ |

## 💻 Development

- Clone this repository
- Enable [Corepack](https://github.com/nodejs/corepack) using `corepack enable` (use `npm i -g corepack` for Node.js < 16.10)
- Install dependencies using `pnpm install`
- Run interactive tests using `pnpm dev`

## License

Made with 🔥 and ❤️

Published under [MIT License](./LICENCE).

<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/type-level-regexp?style=flat-square
[npm-version-href]: https://npmjs.com/package/type-level-regexp