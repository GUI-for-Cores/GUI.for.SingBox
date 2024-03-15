import { stringify, parse } from 'yaml'

import * as Utils from '@/utils'
import * as Stores from '@/stores'
import * as Bridge from '@/bridge'

// global method
window.Plugins = {
  ...Bridge,
  ...Utils,
  ...Stores,
  YAML: {
    parse,
    stringify
  }
}
