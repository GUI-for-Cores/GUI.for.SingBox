import { stringify, parse } from 'yaml'

import * as Bridge from '@/bridge'
import * as Stores from '@/stores'
import * as Utils from '@/utils'

/**
 * Expose methods to be used by the plugin system
 */
window.Plugins = {
  ...Bridge,
  ...Utils,
  ...Stores,
  YAML: {
    parse,
    stringify,
  },
}

window.AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
