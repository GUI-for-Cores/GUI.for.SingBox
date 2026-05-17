# oxc-walker

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![Github Actions][github-actions-src]][github-actions-href]
[![Codecov][codecov-src]][codecov-href]

A strongly-typed ESTree AST walker built on top of [oxc-parser](https://github.com/oxc-project/oxc).

## Usage

Install package:

```sh
# npm
npm install oxc-walker

# pnpm
pnpm install oxc-walker
```

### Walk a parsed AST

```ts
import { parseSync } from "oxc-parser";
import { walk } from "oxc-walker";

const ast = parseSync("example.js", "const x = 1");

walk(ast.program, {
  enter(node, parent, ctx) {
    // ...
  },
});
```

### Parse and walk directly

```js
import { parseAndWalk } from "oxc-walker";

parseAndWalk("const x = 1", "example.js", (node, parent, ctx) => {
  // ...
});
```

## ⚙️ API

### `walk(ast, options)`

Walk an AST.

```ts
// options
interface WalkOptions {
  /**
   * The function to be called when entering a node.
   */
  enter?: (node: Node, parent: Node | null, ctx: CallbackContext) => void;
  /**
   * The function to be called when leaving a node.
   */
  leave?: (node: Node, parent: Node | null, ctx: CallbackContext) => void;
  /**
   * The instance of `ScopeTracker` to use for tracking declarations and references.
   */
  scopeTracker?: ScopeTracker;
}

interface CallbackContext {
  /**
   * The key of the current node within its parent node object, if applicable.
   */
  key: string | number | symbol | null | undefined;
  /**
   * The zero-based index of the current node within its parent's children array, if applicable.
   */
  index: number | null;
  /**
   * The full Abstract Syntax Tree (AST) that is being walked, starting from the root node.
   */
  ast: Program | Node;
}
```

#### `this.skip()`

When called inside an `enter` callback, prevents the node's children from being walked.
It is not available in `leave`.

#### `this.replace(newNode)`

Replaces the current node with `newNode`. When called inside `enter`, the **new node's children** will be walked.
The leave callback will still be called with the original node.

> ⚠️ When a `ScopeTracker` is provided, calling `this.replace()` will not update its declarations.

#### `this.remove()`

Removes the current node from its parent. When called inside `enter`, the removed node's children
will not be walked.

_This has a higher precedence than `this.replace()`, so if both are called, the node will be removed._

> ⚠️ When a `ScopeTracker` is provided, calling `this.remove()` will not update its declarations.

### `parseAndWalk(source, filename, callback, options?)`

Parse the source code using `oxc-parser`, walk the resulting AST and return the `ParseResult`.

Overloads:

- `parseAndWalk(code, filename, enter)`
- `parseAndWalk(code, filename, options)`

```ts
interface ParseAndWalkOptions {
  /**
   * The function to be called when entering a node.
   */
  enter?: (node: Node, parent: Node | null, ctx: CallbackContext) => void;
  /**
   * The function to be called when leaving a node.
   */
  leave?: (node: Node, parent: Node | null, ctx: CallbackContext) => void;
  /**
   * The instance of `ScopeTracker` to use for tracking declarations and references.
   */
  scopeTracker?: ScopeTracker;
  /**
   * The options for `oxc-parser` to use when parsing the code.
   */
  parseOptions?: ParserOptions;
}
```

### `ScopeTracker`

A utility to track scopes and declarations while walking an AST. It is designed to be used with the `walk`
function from this library.

```ts
interface ScopeTrackerOptions {
  /**
   * If true, the scope tracker will preserve exited scopes in memory.
   * @default false
   */
  preserveExitedScopes?: boolean;
}
```

#### Example usage:

```ts
import { parseAndWalk, ScopeTracker } from "oxc-walker";

const scopeTracker = new ScopeTracker();

parseAndWalk("const x = 1; function foo() { console.log(x) }", "example.js", {
  scopeTracker,
  enter(node, parent) {
    if (node.type === "Identifier" && node.name === "x" && parent?.type === "CallExpression") {
      const declaration = scopeTracker.getDeclaration(node.name);
      console.log(declaration); // ScopeTrackerVariable
    }
  },
});
```

```ts
import { parseAndWalk, ScopeTracker, walk } from "oxc-walker";

const code = `
function foo() {
  console.log(a)
}

const a = 1
`;

const scopeTracker = new ScopeTracker({
  preserveExitedScopes: true,
});

// pre-pass to collect hoisted declarations
const { program } = parseAndWalk(code, "example.js", {
  scopeTracker,
});

// freeze the scope tracker to prevent further modifications
// and prepare it for second pass
scopeTracker.freeze();

// main pass to analyze references
walk(program, {
  scopeTracker,
  enter(node) {
    if (node.type === "CallExpression" && node.callee.type === "MemberExpression" /* ... */) {
      const declaration = scopeTracker.getDeclaration("a");
      console.log(declaration); // ScopeTrackerVariable; would be `null` without the pre-pass
    }
  },
});
```

#### Helpers:

- `scopeTracker.isDeclared(name: string): boolean` - check if an identifier is declared in reference to the current scope
- `scopeTracker.getDeclaration(name: string): ScopeTrackerNode | null` - get the scope tracker node with metadata for a given identifier name in reference to the current scope
- `scopeTracker.freeze()` - freeze the scope tracker to prevent further modifications and prepare for second pass (useful for multi-pass analysis)
- `scopeTracker.getCurrentScope(): string` - get the key of the current scope (a unique identifier for the scope, do not rely on its format)
- `scopeTracker.isCurrentScopeUnder(scopeKey: string): boolean` - check if the current scope is a child of the given scope key

## 💻 Development

- Clone this repository
- Enable [Corepack](https://github.com/nodejs/corepack) using `corepack enable`
- Install dependencies using `pnpm install`
- Run interactive tests using `pnpm dev`

## License

Made with ❤️

Published under [MIT License](./LICENCE).

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/oxc-walker?style=flat-square
[npm-version-href]: https://npmjs.com/package/oxc-walker
[npm-downloads-src]: https://img.shields.io/npm/dm/oxc-walker?style=flat-square
[npm-downloads-href]: https://npm.chart.dev/oxc-walker
[github-actions-src]: https://img.shields.io/github/actions/workflow/status/danielroe/oxc-walker/ci.yml?branch=main&style=flat-square
[github-actions-href]: https://github.com/danielroe/oxc-walker/actions?query=workflow%3Aci
[codecov-src]: https://img.shields.io/codecov/c/gh/danielroe/oxc-walker/main?style=flat-square
[codecov-href]: https://codecov.io/gh/danielroe/oxc-walker
