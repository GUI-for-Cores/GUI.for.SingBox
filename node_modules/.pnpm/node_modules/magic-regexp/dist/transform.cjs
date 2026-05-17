'use strict';

const node_url = require('node:url');
const node_vm = require('node:vm');
const estreeWalker = require('estree-walker');
const magicRegExp = require('magic-regexp');
const MagicString = require('magic-string');
const mlly = require('mlly');
const ufo = require('ufo');
const unplugin = require('unplugin');

function _interopDefaultCompat (e) { return e && typeof e === 'object' && 'default' in e ? e.default : e; }

function _interopNamespaceCompat(e) {
  if (e && typeof e === 'object' && 'default' in e) return e;
  const n = Object.create(null);
  if (e) {
    for (const k in e) {
      n[k] = e[k];
    }
  }
  n.default = e;
  return n;
}

const magicRegExp__namespace = /*#__PURE__*/_interopNamespaceCompat(magicRegExp);
const MagicString__default = /*#__PURE__*/_interopDefaultCompat(MagicString);

const MagicRegExpTransformPlugin = unplugin.createUnplugin(() => {
  return {
    name: "MagicRegExpTransformPlugin",
    enforce: "post",
    transformInclude(id) {
      const { pathname, search } = ufo.parseURL(decodeURIComponent(node_url.pathToFileURL(id).href));
      const { type } = ufo.parseQuery(search);
      if (pathname.endsWith(".vue") && (type === "script" || !search))
        return true;
      if (pathname.match(/\.((c|m)?j|t)sx?$/g))
        return true;
      return false;
    },
    transform(code, id) {
      if (!code.includes("magic-regexp"))
        return;
      const statements = mlly.findStaticImports(code).filter(
        (i) => i.specifier === "magic-regexp" || i.specifier === "magic-regexp/further-magic"
      );
      if (!statements.length)
        return;
      const contextMap = { ...magicRegExp__namespace };
      const wrapperNames = [];
      let namespace;
      for (const i of statements.flatMap((i2) => mlly.parseStaticImport(i2))) {
        if (i.namespacedImport) {
          namespace = i.namespacedImport;
          contextMap[i.namespacedImport] = magicRegExp__namespace;
        }
        if (i.namedImports) {
          for (const key in i.namedImports)
            contextMap[i.namedImports[key]] = magicRegExp__namespace[key];
          if (i.namedImports.createRegExp)
            wrapperNames.push(i.namedImports.createRegExp);
        }
      }
      const context = node_vm.createContext(contextMap);
      const s = new MagicString__default(code);
      estreeWalker.walk(this.parse(code), {
        enter(_node) {
          if (_node.type !== "CallExpression")
            return;
          const node = _node;
          if (
            // Normal call
            !wrapperNames.includes(node.callee.name) && (node.callee.type !== "MemberExpression" || node.callee.object.type !== "Identifier" || node.callee.object.name !== namespace || node.callee.property.type !== "Identifier" || node.callee.property.name !== "createRegExp")
          ) {
            return;
          }
          const { start, end } = node;
          try {
            const value = node_vm.runInContext(code.slice(start, end), context);
            s.overwrite(start, end, value.toString());
          } catch {
          }
        }
      });
      if (s.hasChanged()) {
        return {
          code: s.toString(),
          map: s.generateMap({ includeContent: true, source: id })
        };
      }
    }
  };
});

exports.MagicRegExpTransformPlugin = MagicRegExpTransformPlugin;
