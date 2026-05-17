import { Node, Program, IdentifierName, IdentifierReference, BindingIdentifier, LabelIdentifier, TSIndexSignatureName, ParseResult, ParserOptions, Function, ArrowFunctionExpression, VariableDeclaration, ImportDeclarationSpecifier, ImportDeclaration, CatchClause } from 'oxc-parser';

interface WalkerCallbackContext {
    /**
     * The key of the current node within its parent node object, if applicable.
     *
     * For instance, when processing a `VariableDeclarator` node, this would be the `declarations` key of the parent `VariableDeclaration` node.
     * @example
     * {
     *   type: 'VariableDeclaration',
     *   declarations: [[Object]],
     *   // ...
     * },
     *   {  // <-- when processing this, the key would be 'declarations'
     *     type: 'VariableDeclarator',
     *     // ...
     *   },
     */
    key: string | number | symbol | null | undefined;
    /**
     * The zero-based index of the current node within its parent's children array, if applicable.
     * For instance, when processing a `VariableDeclarator` node,
     * this would be the index of the current `VariableDeclarator` node within the `declarations` array.
     *
     * This is `null` when the node is not part of an array.
     *
     * @example
     * {
     *   type: 'VariableDeclaration',
     *   declarations: [[Object]],
     *   // ...
     * },
     *   {  // <-- when processing this, the index would be 0
     *     type: 'VariableDeclarator',
     *     // ...
     *   },
     */
    index: number | null;
    /**
     * The full Abstract Syntax Tree (AST) that is being walked, starting from the root node.
     */
    ast: Program | Node;
}
interface WalkerThisContextLeave {
    /**
     * Remove the current node from the AST.
     * @remarks
     * - The `ScopeTracker` currently does not support node removal
     * @see ScopeTracker
     */
    remove: () => void;
    /**
     * Replace the current node with another node.
     * After replacement, the walker will continue with the next sibling of the replaced node.
     *
     * In case the current node was removed in the `enter` phase, this will put the new node in
     * the place of the removed node - essentially undoing the removal.
     * @remarks
     * - The `ScopeTracker` currently does not support node replacement
     * @see ScopeTracker
     */
    replace: (node: Node) => void;
}
interface WalkerThisContextEnter extends WalkerThisContextLeave {
    /**
     * Skip traversing the child nodes of the current node.
     */
    skip: () => void;
    /**
     * Remove the current node and all of its children from the AST.
     * @remarks
     * - The `ScopeTracker` currently does not support node removal
     * @see ScopeTracker
     */
    remove: () => void;
    /**
     * Replace the current node with another node.
     * After replacement, the walker will continue to traverse the children of the new node.
     *
     * If you want to replace the current node and skip traversing its children, call `this.skip()` after calling `this.replace(newNode)`.
     * @remarks
     * - The `ScopeTracker` currently does not support node replacement
     * @see this.skip
     * @see ScopeTracker
     */
    replace: (node: Node) => void;
}
type WalkerCallback<T extends WalkerThisContextLeave> = (this: T, node: Node, parent: Node | null, ctx: WalkerCallbackContext) => void;
type WalkerEnter = WalkerCallback<WalkerThisContextEnter>;
type WalkerLeave = WalkerCallback<WalkerThisContextLeave>;

interface _WalkOptions {
    /**
     * The instance of `ScopeTracker` to use for tracking declarations and references.
     * @see ScopeTracker
     * @default undefined
     */
    scopeTracker: ScopeTracker;
}
interface WalkOptions extends Partial<_WalkOptions> {
    /**
     * The function to be called when entering a node.
     */
    enter: WalkerEnter;
    /**
     * The function to be called when leaving a node.
     */
    leave: WalkerLeave;
}

type Identifier = IdentifierName | IdentifierReference | BindingIdentifier | LabelIdentifier | TSIndexSignatureName;
/**
 * Walk the AST with the given options.
 * @param input The AST to walk.
 * @param options The options to be used when walking the AST. Here you can specify the callbacks for entering and leaving nodes, as well as other options.
 */
declare function walk(input: Program | Node, options: Partial<WalkOptions>): Node | null;
interface ParseAndWalkOptions extends WalkOptions {
    /**
     * The options for `oxc-parser` to use when parsing the code.
     */
    parseOptions: ParserOptions;
}
/**
 * Parse the code and walk the AST with the given callback, which is called when entering a node.
 * @param code The string with the code to parse and walk. This can be JavaScript, TypeScript, jsx, or tsx.
 * @param sourceFilename The filename of the source code. This is used to determine the language of the code, unless
 * it is specified in the parse options.
 * @param callback The callback to be called when entering a node.
 */
declare function parseAndWalk(code: string, sourceFilename: string, callback: WalkerEnter): ParseResult;
/**
 * Parse the code and walk the AST with the given callback(s).
 * @param code The string with the code to parse and walk. This can be JavaScript, TypeScript, jsx, or tsx.
 * @param sourceFilename The filename of the source code. This is used to determine the language of the code, unless
 * it is specified in the parse options.
 * @param options The options to be used when walking the AST. Here you can specify the callbacks for entering and leaving nodes, as well as other options.
 */
declare function parseAndWalk(code: string, sourceFilename: string, options: Partial<ParseAndWalkOptions>): ParseResult;

interface ScopeTrackerProtected {
    processNodeEnter: (node: Node) => void;
    processNodeLeave: (node: Node) => void;
}
/**
 * Tracks variable scopes and identifier declarations within a JavaScript AST.
 *
 * Maintains a stack of scopes, each represented as a map from identifier names to their declaration nodes,
 * enabling efficient lookup of the declaration.
 *
 * The ScopeTracker is designed to integrate with the `walk` function,
 * it automatically manages scope creation and identifier tracking,
 * so only query and inspection methods are exposed for external use.
 *
 * ### Scope tracking
 * A new scope is created when entering blocks, function parameters, loop variables, etc.
 * Note that this representation may split a single JavaScript lexical scope into multiple internal scopes,
 * meaning it doesn't mirror JavaScript’s scoping 1:1.
 *
 * Scopes are represented using a string-based index like `"0-1-2"`, which tracks depth and ancestry.
 *
 * #### Root scope
 * The root scope is represented by an empty string `""`.
 *
 * #### Scope key format
 * Scope keys are hierarchical strings that uniquely identify each scope and its position in the tree.
 * They are constructed using a depth-based indexing scheme, where:
 *
 * - the root scope is represented by an empty string `""`.
 * - the first child scope is `"0"`.
 * - a parallel sibling of `"0"` becomes `"1"`, `"2"`, etc.
 * - a nested scope under `"0"` is `"0-0"`, then its sibling is `"0-1"`, and so on.
 *
 * Each segment in the key corresponds to the zero-based index of the scope at that depth level in
 * the order of AST traversal.
 *
 * ### Additional features
 * - supports freezing the tracker to allow for second passes through the AST without modifying the scope data
 * (useful for doing a pre-pass to collect all identifiers before walking).
 *
 * @example
 * ```ts
 * const scopeTracker = new ScopeTracker()
 * walk(code, {
 *   scopeTracker,
 *   enter(node) {
 *     // ...
 *   },
 * })
 * ```
 *
 * @see parseAndWalk
 * @see walk
 */
declare class ScopeTracker {
    protected scopeIndexStack: number[];
    protected scopeIndexKey: string;
    protected scopes: Map<string, Map<string, ScopeTrackerNode>>;
    protected options: Partial<ScopeTrackerOptions>;
    protected isFrozen: boolean;
    constructor(options?: ScopeTrackerOptions);
    protected updateScopeIndexKey(): void;
    protected pushScope(): void;
    protected popScope(): void;
    protected declareIdentifier(name: string, data: ScopeTrackerNode): void;
    protected declareFunctionParameter(param: Node, fn: Function | ArrowFunctionExpression): void;
    protected declarePattern(pattern: Node, parent: VariableDeclaration | ArrowFunctionExpression | CatchClause | Function): void;
    protected processNodeEnter: ScopeTrackerProtected["processNodeEnter"];
    protected processNodeLeave: ScopeTrackerProtected["processNodeLeave"];
    /**
     * Check if an identifier is declared in the current scope or any parent scope.
     * @param name the identifier name to check
     */
    isDeclared(name: string): boolean;
    /**
     * Get the declaration node for a given identifier name.
     * @param name the identifier name to look up
     */
    getDeclaration(name: string): ScopeTrackerNode | null;
    /**
     * Get the current scope key.
     */
    getCurrentScope(): string;
    /**
     * Check if the current scope is a child of a specific scope.
     * @example
     * ```ts
     * // current scope is 0-1
     * isCurrentScopeUnder('0') // true
     * isCurrentScopeUnder('0-1') // false
     * ```
     *
     * @param scope the parent scope key to check against
     * @returns `true` if the current scope is a child of the specified scope, `false` otherwise (also when they are the same)
     */
    isCurrentScopeUnder(scope: string): boolean;
    /**
     * Freezes the ScopeTracker, preventing further modifications to its state.
     * It also resets the scope index stack to its initial state so that the tracker can be reused.
     *
     * This is useful for second passes through the AST.
     */
    freeze(): void;
}
declare function isBindingIdentifier(node: Node, parent: Node | null): boolean;
declare function getUndeclaredIdentifiersInFunction(node: Function | ArrowFunctionExpression): string[];
declare abstract class BaseNode<T extends Node = Node> {
    abstract type: string;
    readonly scope: string;
    node: T;
    constructor(node: T, scope: string);
    /**
     * The starting position of the entire node relevant for code transformation.
     * For instance, for a reference to a variable (ScopeTrackerVariable -> Identifier), this would refer to the start of the VariableDeclaration.
     */
    abstract get start(): number;
    /**
     * The ending position of the entire node relevant for code transformation.
     * For instance, for a reference to a variable (ScopeTrackerVariable -> Identifier), this would refer to the end of the VariableDeclaration.
     */
    abstract get end(): number;
    /**
     * Check if the node is defined under a specific scope.
     * @param scope
     */
    isUnderScope(scope: string): boolean;
}
declare class ScopeTrackerIdentifier extends BaseNode<Identifier> {
    type: "Identifier";
    get start(): number;
    get end(): number;
}
declare class ScopeTrackerFunctionParam extends BaseNode {
    type: "FunctionParam";
    fnNode: Function | ArrowFunctionExpression;
    constructor(node: Node, scope: string, fnNode: Function | ArrowFunctionExpression);
    /**
     * @deprecated The representation of this position may change in the future. Use `.fnNode.start` instead for now.
     */
    get start(): number;
    /**
     * @deprecated The representation of this position may change in the future. Use `.fnNode.end` instead for now.
     */
    get end(): number;
}
declare class ScopeTrackerFunction extends BaseNode<Function | ArrowFunctionExpression> {
    type: "Function";
    get start(): number;
    get end(): number;
}
declare class ScopeTrackerVariable extends BaseNode<Identifier> {
    type: "Variable";
    variableNode: VariableDeclaration;
    constructor(node: Identifier, scope: string, variableNode: VariableDeclaration);
    get start(): number;
    get end(): number;
}
declare class ScopeTrackerImport extends BaseNode<ImportDeclarationSpecifier> {
    type: "Import";
    importNode: ImportDeclaration;
    constructor(node: ImportDeclarationSpecifier, scope: string, importNode: ImportDeclaration);
    get start(): number;
    get end(): number;
}
declare class ScopeTrackerCatchParam extends BaseNode {
    type: "CatchParam";
    catchNode: CatchClause;
    constructor(node: Node, scope: string, catchNode: CatchClause);
    get start(): number;
    get end(): number;
}
type ScopeTrackerNode = ScopeTrackerFunctionParam | ScopeTrackerFunction | ScopeTrackerVariable | ScopeTrackerIdentifier | ScopeTrackerImport | ScopeTrackerCatchParam;
interface ScopeTrackerOptions {
    /**
     * If true, the scope tracker will preserve exited scopes in memory.
     * This is necessary when you want to do a pre-pass to collect all identifiers before walking, for example.
     * @default false
     */
    preserveExitedScopes?: boolean;
}

export { ScopeTracker, ScopeTrackerCatchParam, ScopeTrackerFunction, ScopeTrackerFunctionParam, ScopeTrackerIdentifier, ScopeTrackerImport, ScopeTrackerVariable, getUndeclaredIdentifiersInFunction, isBindingIdentifier, parseAndWalk, walk };
export type { Identifier, ScopeTrackerNode, ScopeTrackerOptions, WalkOptions, WalkerCallbackContext, WalkerEnter, WalkerLeave, WalkerThisContextEnter, WalkerThisContextLeave };
