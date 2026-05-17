import { createRegExp, exactly, anyOf } from 'magic-regexp/further-magic';
import { parseSync } from 'oxc-parser';

function isNode(v) {
  return v !== null && typeof v === "object" && v.type != null && typeof v.type === "string";
}

class WalkerBase {
  scopeTracker;
  enter;
  leave;
  contextEnter = {
    skip: () => {
      this._skip = true;
    },
    remove: () => {
      this._remove = true;
    },
    replace: (node) => {
      this._replacement = node;
    }
  };
  contextLeave = {
    remove: this.contextEnter.remove,
    replace: this.contextEnter.replace
  };
  _skip = false;
  _remove = false;
  _replacement = null;
  constructor(handler, options) {
    this.enter = handler.enter;
    this.leave = handler.leave;
    this.scopeTracker = options?.scopeTracker;
  }
  replace(parent, key, index, node) {
    if (!parent || key === null) {
      return;
    }
    if (index !== null) {
      parent[key][index] = node;
    } else {
      parent[key] = node;
    }
  }
  insert(parent, key, index, node) {
    if (!parent || key === null) return;
    if (index !== null) {
      parent[key].splice(index, 0, node);
    } else {
      parent[key] = node;
    }
  }
  remove(parent, key, index) {
    if (!parent || key === null) {
      return;
    }
    if (index !== null) {
      parent[key].splice(index, 1);
    } else {
      delete parent[key];
    }
  }
}

class WalkerSync extends WalkerBase {
  constructor(handler, options) {
    super(handler, options);
  }
  traverse(input, key, index, parent) {
    const ast = input;
    const ctx = { key: null, index: index ?? null, ast };
    const hasScopeTracker = !!this.scopeTracker;
    const _walk = (input2, parent2, key2, index2, skip) => {
      if (!isNode(input2)) {
        return null;
      }
      this.scopeTracker?.processNodeEnter(input2);
      let currentNode = input2;
      let removedInEnter = false;
      let skipChildren = skip;
      if (this.enter && !skip) {
        const _skip = this._skip;
        const _remove = this._remove;
        const _replacement = this._replacement;
        this._skip = false;
        this._remove = false;
        this._replacement = null;
        ctx.key = key2;
        ctx.index = index2;
        this.enter.call(this.contextEnter, input2, parent2, ctx);
        if (this._replacement && !this._remove) {
          currentNode = this._replacement;
          this.replace(parent2, key2, index2, this._replacement);
        }
        if (this._remove) {
          removedInEnter = true;
          currentNode = null;
          this.remove(parent2, key2, index2);
        }
        if (this._skip) {
          skipChildren = true;
        }
        this._skip = _skip;
        this._remove = _remove;
        this._replacement = _replacement;
      }
      if ((!skipChildren || hasScopeTracker) && currentNode) {
        for (const k in currentNode) {
          const node = currentNode[k];
          if (!node || typeof node !== "object") {
            continue;
          }
          if (Array.isArray(node)) {
            for (let i = 0; i < node.length; i++) {
              const child = node[i];
              if (isNode(child)) {
                if (_walk(child, currentNode, k, i, skipChildren) === null) {
                  i--;
                }
              }
            }
          } else if (isNode(node)) {
            _walk(node, currentNode, k, null, skipChildren);
          }
        }
      }
      this.scopeTracker?.processNodeLeave(input2);
      if (this.leave && !skip) {
        const _replacement = this._replacement;
        const _remove = this._remove;
        this._replacement = null;
        this._remove = false;
        ctx.key = key2;
        ctx.index = index2;
        this.leave.call(this.contextLeave, input2, parent2, ctx);
        if (this._replacement && !this._remove) {
          currentNode = this._replacement;
          if (removedInEnter) {
            this.insert(parent2, key2, index2, this._replacement);
          } else {
            this.replace(parent2, key2, index2, this._replacement);
          }
        }
        if (this._remove) {
          currentNode = null;
          this.remove(parent2, key2, index2);
        }
        this._replacement = _replacement;
        this._remove = _remove;
      }
      return currentNode;
    };
    return _walk(input, parent ?? null, key ?? null, index ?? null, false);
  }
}

function walk(input, options) {
  return new WalkerSync(
    {
      enter: options.enter,
      leave: options.leave
    },
    {
      scopeTracker: options.scopeTracker
    }
  ).traverse(input);
}
const LANG_RE = createRegExp(
  exactly("jsx").or("tsx").or("js").or("ts").groupedAs("lang").after(exactly(".").and(anyOf("c", "m").optionally())).at.lineEnd()
);
function parseAndWalk(code, sourceFilename, arg3) {
  const lang = sourceFilename?.match(LANG_RE)?.groups?.lang;
  const { parseOptions: _parseOptions = {}, ...options } = typeof arg3 === "function" ? { enter: arg3 } : arg3;
  const parseOptions = {
    sourceType: "module",
    lang,
    ..._parseOptions
  };
  const ast = parseSync(sourceFilename, code, parseOptions);
  walk(ast.program, options);
  return ast;
}

class ScopeTracker {
  scopeIndexStack = [];
  scopeIndexKey = "";
  scopes = /* @__PURE__ */ new Map();
  options;
  isFrozen = false;
  constructor(options = {}) {
    this.options = options;
  }
  updateScopeIndexKey() {
    this.scopeIndexKey = this.scopeIndexStack.slice(0, -1).join("-");
  }
  pushScope() {
    this.scopeIndexStack.push(0);
    this.updateScopeIndexKey();
  }
  popScope() {
    this.scopeIndexStack.pop();
    if (this.scopeIndexStack[this.scopeIndexStack.length - 1] !== void 0) {
      this.scopeIndexStack[this.scopeIndexStack.length - 1]++;
    }
    if (!this.options.preserveExitedScopes) {
      this.scopes.delete(this.scopeIndexKey);
    }
    this.updateScopeIndexKey();
  }
  declareIdentifier(name, data) {
    if (this.isFrozen) {
      return;
    }
    let scope = this.scopes.get(this.scopeIndexKey);
    if (!scope) {
      scope = /* @__PURE__ */ new Map();
      this.scopes.set(this.scopeIndexKey, scope);
    }
    scope.set(name, data);
  }
  declareFunctionParameter(param, fn) {
    if (this.isFrozen) {
      return;
    }
    const identifiers = getPatternIdentifiers(param);
    for (const identifier of identifiers) {
      this.declareIdentifier(
        identifier.name,
        new ScopeTrackerFunctionParam(identifier, this.scopeIndexKey, fn)
      );
    }
  }
  declarePattern(pattern, parent) {
    if (this.isFrozen) {
      return;
    }
    const identifiers = getPatternIdentifiers(pattern);
    for (const identifier of identifiers) {
      this.declareIdentifier(
        identifier.name,
        parent.type === "VariableDeclaration" ? new ScopeTrackerVariable(identifier, this.scopeIndexKey, parent) : parent.type === "CatchClause" ? new ScopeTrackerCatchParam(identifier, this.scopeIndexKey, parent) : new ScopeTrackerFunctionParam(identifier, this.scopeIndexKey, parent)
      );
    }
  }
  processNodeEnter = (node) => {
    switch (node.type) {
      case "Program":
      case "BlockStatement":
      case "StaticBlock":
        this.pushScope();
        break;
      case "FunctionDeclaration":
        if (node.id?.name) {
          this.declareIdentifier(node.id.name, new ScopeTrackerFunction(node, this.scopeIndexKey));
        }
        this.pushScope();
        for (const param of node.params) {
          this.declareFunctionParameter(param, node);
        }
        break;
      case "FunctionExpression":
        this.pushScope();
        if (node.id?.name) {
          this.declareIdentifier(node.id.name, new ScopeTrackerFunction(node, this.scopeIndexKey));
        }
        this.pushScope();
        for (const param of node.params) {
          this.declareFunctionParameter(param, node);
        }
        break;
      case "ArrowFunctionExpression":
        this.pushScope();
        for (const param of node.params) {
          this.declareFunctionParameter(param, node);
        }
        break;
      case "VariableDeclaration":
        for (const decl of node.declarations) {
          this.declarePattern(decl.id, node);
        }
        break;
      case "ClassDeclaration":
        if (node.id?.name) {
          this.declareIdentifier(
            node.id.name,
            new ScopeTrackerIdentifier(node.id, this.scopeIndexKey)
          );
        }
        break;
      case "ClassExpression":
        this.pushScope();
        if (node.id?.name) {
          this.declareIdentifier(
            node.id.name,
            new ScopeTrackerIdentifier(node.id, this.scopeIndexKey)
          );
        }
        break;
      case "ImportDeclaration":
        for (const specifier of node.specifiers) {
          this.declareIdentifier(
            specifier.local.name,
            new ScopeTrackerImport(specifier, this.scopeIndexKey, node)
          );
        }
        break;
      case "CatchClause":
        this.pushScope();
        if (node.param) {
          this.declarePattern(node.param, node);
        }
        break;
      case "ForStatement":
      case "ForOfStatement":
      case "ForInStatement":
        this.pushScope();
        if (node.type === "ForStatement" && node.init?.type === "VariableDeclaration") {
          for (const decl of node.init.declarations) {
            this.declarePattern(decl.id, node.init);
          }
        } else if ((node.type === "ForOfStatement" || node.type === "ForInStatement") && node.left.type === "VariableDeclaration") {
          for (const decl of node.left.declarations) {
            this.declarePattern(decl.id, node.left);
          }
        }
        break;
    }
  };
  processNodeLeave = (node) => {
    switch (node.type) {
      case "Program":
      case "BlockStatement":
      case "CatchClause":
      case "FunctionDeclaration":
      case "ArrowFunctionExpression":
      case "StaticBlock":
      case "ClassExpression":
      case "ForStatement":
      case "ForOfStatement":
      case "ForInStatement":
        this.popScope();
        break;
      case "FunctionExpression":
        this.popScope();
        this.popScope();
        break;
    }
  };
  /**
   * Check if an identifier is declared in the current scope or any parent scope.
   * @param name the identifier name to check
   */
  isDeclared(name) {
    if (!this.scopeIndexKey) {
      return this.scopes.get("")?.has(name) || false;
    }
    const indices = this.scopeIndexKey.split("-").map(Number);
    for (let i = indices.length; i >= 0; i--) {
      if (this.scopes.get(indices.slice(0, i).join("-"))?.has(name)) {
        return true;
      }
    }
    return false;
  }
  /**
   * Get the declaration node for a given identifier name.
   * @param name the identifier name to look up
   */
  getDeclaration(name) {
    if (!this.scopeIndexKey) {
      return this.scopes.get("")?.get(name) ?? null;
    }
    const indices = this.scopeIndexKey.split("-").map(Number);
    for (let i = indices.length; i >= 0; i--) {
      const node = this.scopes.get(indices.slice(0, i).join("-"))?.get(name);
      if (node) {
        return node;
      }
    }
    return null;
  }
  /**
   * Get the current scope key.
   */
  getCurrentScope() {
    return this.scopeIndexKey;
  }
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
  isCurrentScopeUnder(scope) {
    return isChildScope(this.scopeIndexKey, scope);
  }
  /**
   * Freezes the ScopeTracker, preventing further modifications to its state.
   * It also resets the scope index stack to its initial state so that the tracker can be reused.
   *
   * This is useful for second passes through the AST.
   */
  freeze() {
    this.isFrozen = true;
    this.scopeIndexStack = [];
    this.updateScopeIndexKey();
  }
}
function getPatternIdentifiers(pattern) {
  const identifiers = [];
  function collectIdentifiers(pattern2) {
    switch (pattern2.type) {
      case "Identifier":
        identifiers.push(pattern2);
        break;
      case "AssignmentPattern":
        collectIdentifiers(pattern2.left);
        break;
      case "RestElement":
        collectIdentifiers(pattern2.argument);
        break;
      case "ArrayPattern":
        for (const element of pattern2.elements) {
          if (element) {
            collectIdentifiers(element.type === "RestElement" ? element.argument : element);
          }
        }
        break;
      case "ObjectPattern":
        for (const property of pattern2.properties) {
          collectIdentifiers(property.type === "RestElement" ? property.argument : property.value);
        }
        break;
    }
  }
  collectIdentifiers(pattern);
  return identifiers;
}
function isBindingIdentifier(node, parent) {
  if (!parent || node.type !== "Identifier") {
    return false;
  }
  switch (parent.type) {
    case "FunctionDeclaration":
    case "FunctionExpression":
    case "ArrowFunctionExpression":
      if (parent.type !== "ArrowFunctionExpression" && parent.id === node) {
        return true;
      }
      if (parent.params.length) {
        for (const param of parent.params) {
          const identifiers = getPatternIdentifiers(param);
          if (identifiers.includes(node)) {
            return true;
          }
        }
      }
      return false;
    case "ClassDeclaration":
    case "ClassExpression":
      return parent.id === node;
    case "MethodDefinition":
      return parent.key === node;
    case "PropertyDefinition":
      return parent.key === node;
    case "VariableDeclarator":
      return getPatternIdentifiers(parent.id).includes(node);
    case "CatchClause":
      if (!parent.param) {
        return false;
      }
      return getPatternIdentifiers(parent.param).includes(node);
    case "Property":
      return parent.key === node && parent.value !== node;
    case "MemberExpression":
      return parent.property === node;
  }
  return false;
}
function getUndeclaredIdentifiersInFunction(node) {
  const scopeTracker = new ScopeTracker({
    preserveExitedScopes: true
  });
  const undeclaredIdentifiers = /* @__PURE__ */ new Set();
  function isIdentifierUndeclared(node2, parent) {
    return !isBindingIdentifier(node2, parent) && !scopeTracker.isDeclared(node2.name);
  }
  walk(node, {
    scopeTracker
  });
  scopeTracker.freeze();
  walk(node, {
    scopeTracker,
    enter(node2, parent) {
      if (node2.type === "Identifier" && isIdentifierUndeclared(node2, parent)) {
        undeclaredIdentifiers.add(node2.name);
      }
    }
  });
  return Array.from(undeclaredIdentifiers);
}
function isChildScope(a, b) {
  return a.startsWith(b) && a.length > b.length;
}
class BaseNode {
  scope;
  node;
  constructor(node, scope) {
    this.node = node;
    this.scope = scope;
  }
  /**
   * Check if the node is defined under a specific scope.
   * @param scope
   */
  isUnderScope(scope) {
    return isChildScope(this.scope, scope);
  }
}
class ScopeTrackerIdentifier extends BaseNode {
  type = "Identifier";
  get start() {
    return this.node.start;
  }
  get end() {
    return this.node.end;
  }
}
class ScopeTrackerFunctionParam extends BaseNode {
  type = "FunctionParam";
  fnNode;
  constructor(node, scope, fnNode) {
    super(node, scope);
    this.fnNode = fnNode;
  }
  /**
   * @deprecated The representation of this position may change in the future. Use `.fnNode.start` instead for now.
   */
  get start() {
    return this.fnNode.start;
  }
  /**
   * @deprecated The representation of this position may change in the future. Use `.fnNode.end` instead for now.
   */
  get end() {
    return this.fnNode.end;
  }
}
class ScopeTrackerFunction extends BaseNode {
  type = "Function";
  get start() {
    return this.node.start;
  }
  get end() {
    return this.node.end;
  }
}
class ScopeTrackerVariable extends BaseNode {
  type = "Variable";
  variableNode;
  constructor(node, scope, variableNode) {
    super(node, scope);
    this.variableNode = variableNode;
  }
  get start() {
    return this.variableNode.start;
  }
  get end() {
    return this.variableNode.end;
  }
}
class ScopeTrackerImport extends BaseNode {
  type = "Import";
  importNode;
  constructor(node, scope, importNode) {
    super(node, scope);
    this.importNode = importNode;
  }
  get start() {
    return this.importNode.start;
  }
  get end() {
    return this.importNode.end;
  }
}
class ScopeTrackerCatchParam extends BaseNode {
  type = "CatchParam";
  catchNode;
  constructor(node, scope, catchNode) {
    super(node, scope);
    this.catchNode = catchNode;
  }
  get start() {
    return this.catchNode.start;
  }
  get end() {
    return this.catchNode.end;
  }
}

export { ScopeTracker, ScopeTrackerCatchParam, ScopeTrackerFunction, ScopeTrackerFunctionParam, ScopeTrackerIdentifier, ScopeTrackerImport, ScopeTrackerVariable, getUndeclaredIdentifiersInFunction, isBindingIdentifier, parseAndWalk, walk };
