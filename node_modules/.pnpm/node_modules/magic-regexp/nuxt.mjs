import { addImportsSources, addVitePlugin, addWebpackPlugin, defineNuxtModule } from '@nuxt/kit'
import * as magicRegexp from 'magic-regexp'
import { MagicRegExpTransformPlugin } from 'magic-regexp/transform'

export default defineNuxtModule({
  setup(_options, nuxt) {
    addImportsSources({
      from: 'magic-regexp',
      imports: Object.keys(magicRegexp),
    })

    // Disable RegExp code transformation in development mode
    if (nuxt.options.dev)
      return

    addWebpackPlugin(MagicRegExpTransformPlugin.webpack())
    addVitePlugin(MagicRegExpTransformPlugin.vite())
  },
})
