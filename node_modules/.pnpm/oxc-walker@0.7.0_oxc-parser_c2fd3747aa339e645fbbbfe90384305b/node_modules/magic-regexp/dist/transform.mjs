import { pathToFileURL } from 'node:url';
import { createContext, runInContext } from 'node:vm';
import { walk } from 'estree-walker';
import * as magicRegExp from 'magic-regexp';
import MagicString from 'magic-string';
import { findStaticImports, parseStaticImport } from 'mlly';
import { parseURL, parseQuery } from 'ufo';
import { createUnplugin } from 'unplugin';

const MagicRegExpTransformPlugin = createUnplugin(() => {
  return {
    name: "MagicRegExpTransformPlugin",
    enforce: "post",
    transformInclude(id) {
      const { pathname, search } = parseURL(decodeURIComponent(pathToFileURL(id).href));
      const { type } = parseQuery(search);
      if (pathname.endsWith(".vue") && (type === "script" || !search))
        return true;
      if (pathname.match(/\.((c|m)?j|t)sx?$/g))
        return true;
      return false;
    },
    transform(code, id) {
      if (!code.includes("magic-regexp"))
        return;
      const statements = findStaticImports(code).filter(
        (i) => i.specifier === "magic-regexp" || i.specifier === "magic-regexp/further-magic"
      );
      if (!statements.length)
        return;
      const contextMap = { ...magicRegExp };
      const wrapperNames = [];
      let namespace;
      for (const i of statements.flatMap((i2) => parseStaticImport(i2))) {
        if (i.namespacedImport) {
          namespace = i.namespacedImport;
          contextMap[i.namespacedImport] = magicRegExp;
        }
        if (i.namedImports) {
          for (const key in i.namedImports)
            contextMap[i.namedImports[key]] = magicRegExp[key];
          if (i.namedImports.createRegExp)
            wrapperNames.push(i.namedImports.createRegExp);
        }
      }
      const context = createContext(contextMap);
      const s = new MagicString(code);
      walk(this.parse(code), {
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
            const value = runInContext(code.slice(start, end), context);
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

export { MagicRegExpTransformPlugin };
