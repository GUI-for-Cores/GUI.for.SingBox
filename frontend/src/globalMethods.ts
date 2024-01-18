import { stringify, parse } from 'yaml'

import * as Utils from '@/utils'
import * as Store from '@/stores'
import * as Bridge from '@/utils/bridge'

// global method
window.Plugins = {
  ...Bridge,
  ...Utils,
  ...Store,
  YAML: {
    parse,
    stringify
  }
}
