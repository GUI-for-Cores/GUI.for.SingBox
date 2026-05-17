import { n as Colors, r as Theme } from "./colors-DCBiEX2u.mjs";
import * as _$_unocss_core0 from "@unocss/core";

//#region src/_theme/default.d.ts
declare const theme: {
  width: {
    screen: string;
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
    '5xl': string;
    '6xl': string;
    '7xl': string;
    prose: string;
    auto: string;
  };
  height: {
    screen: string;
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
    '5xl': string;
    '6xl': string;
    '7xl': string;
    prose: string;
    auto: string;
  };
  maxWidth: {
    screen: string;
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
    '5xl': string;
    '6xl': string;
    '7xl': string;
    prose: string;
    none: string;
  };
  maxHeight: {
    screen: string;
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
    '5xl': string;
    '6xl': string;
    '7xl': string;
    prose: string;
    none: string;
  };
  minWidth: {
    screen: string;
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
    '5xl': string;
    '6xl': string;
    '7xl': string;
    prose: string;
    none: string;
  };
  minHeight: {
    screen: string;
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
    '5xl': string;
    '6xl': string;
    '7xl': string;
    prose: string;
    none: string;
  };
  inlineSize: {
    screen: string;
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
    '5xl': string;
    '6xl': string;
    '7xl': string;
    prose: string;
    auto: string;
  };
  blockSize: {
    screen: string;
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
    '5xl': string;
    '6xl': string;
    '7xl': string;
    prose: string;
    auto: string;
  };
  maxInlineSize: {
    screen: string;
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
    '5xl': string;
    '6xl': string;
    '7xl': string;
    prose: string;
    none: string;
  };
  maxBlockSize: {
    screen: string;
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
    '5xl': string;
    '6xl': string;
    '7xl': string;
    prose: string;
    none: string;
  };
  minInlineSize: {
    screen: string;
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
    '5xl': string;
    '6xl': string;
    '7xl': string;
    prose: string;
    none: string;
  };
  minBlockSize: {
    screen: string;
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
    '5xl': string;
    '6xl': string;
    '7xl': string;
    prose: string;
    none: string;
  };
  colors: {
    inherit: string;
    current: string;
    transparent: string;
    black: string;
    white: string;
    rose: {
      50: string;
      100: string;
      200: string;
      300: string;
      400: string;
      500: string;
      600: string;
      700: string;
      800: string;
      900: string;
      950: string;
    };
    pink: {
      50: string;
      100: string;
      200: string;
      300: string;
      400: string;
      500: string;
      600: string;
      700: string;
      800: string;
      900: string;
      950: string;
    };
    fuchsia: {
      50: string;
      100: string;
      200: string;
      300: string;
      400: string;
      500: string;
      600: string;
      700: string;
      800: string;
      900: string;
      950: string;
    };
    purple: {
      50: string;
      100: string;
      200: string;
      300: string;
      400: string;
      500: string;
      600: string;
      700: string;
      800: string;
      900: string;
      950: string;
    };
    violet: {
      50: string;
      100: string;
      200: string;
      300: string;
      400: string;
      500: string;
      600: string;
      700: string;
      800: string;
      900: string;
      950: string;
    };
    indigo: {
      50: string;
      100: string;
      200: string;
      300: string;
      400: string;
      500: string;
      600: string;
      700: string;
      800: string;
      900: string;
      950: string;
    };
    blue: {
      50: string;
      100: string;
      200: string;
      300: string;
      400: string;
      500: string;
      600: string;
      700: string;
      800: string;
      900: string;
      950: string;
    };
    sky: {
      50: string;
      100: string;
      200: string;
      300: string;
      400: string;
      500: string;
      600: string;
      700: string;
      800: string;
      900: string;
      950: string;
    };
    cyan: {
      50: string;
      100: string;
      200: string;
      300: string;
      400: string;
      500: string;
      600: string;
      700: string;
      800: string;
      900: string;
      950: string;
    };
    teal: {
      50: string;
      100: string;
      200: string;
      300: string;
      400: string;
      500: string;
      600: string;
      700: string;
      800: string;
      900: string;
      950: string;
    };
    emerald: {
      50: string;
      100: string;
      200: string;
      300: string;
      400: string;
      500: string;
      600: string;
      700: string;
      800: string;
      900: string;
      950: string;
    };
    green: {
      50: string;
      100: string;
      200: string;
      300: string;
      400: string;
      500: string;
      600: string;
      700: string;
      800: string;
      900: string;
      950: string;
    };
    lime: {
      50: string;
      100: string;
      200: string;
      300: string;
      400: string;
      500: string;
      600: string;
      700: string;
      800: string;
      900: string;
      950: string;
    };
    yellow: {
      50: string;
      100: string;
      200: string;
      300: string;
      400: string;
      500: string;
      600: string;
      700: string;
      800: string;
      900: string;
      950: string;
    };
    amber: {
      50: string;
      100: string;
      200: string;
      300: string;
      400: string;
      500: string;
      600: string;
      700: string;
      800: string;
      900: string;
      950: string;
    };
    orange: {
      50: string;
      100: string;
      200: string;
      300: string;
      400: string;
      500: string;
      600: string;
      700: string;
      800: string;
      900: string;
      950: string;
    };
    red: {
      50: string;
      100: string;
      200: string;
      300: string;
      400: string;
      500: string;
      600: string;
      700: string;
      800: string;
      900: string;
      950: string;
    };
    gray: {
      50: string;
      100: string;
      200: string;
      300: string;
      400: string;
      500: string;
      600: string;
      700: string;
      800: string;
      900: string;
      950: string;
    };
    slate: {
      50: string;
      100: string;
      200: string;
      300: string;
      400: string;
      500: string;
      600: string;
      700: string;
      800: string;
      900: string;
      950: string;
    };
    zinc: {
      50: string;
      100: string;
      200: string;
      300: string;
      400: string;
      500: string;
      600: string;
      700: string;
      800: string;
      900: string;
      950: string;
    };
    neutral: {
      50: string;
      100: string;
      200: string;
      300: string;
      400: string;
      500: string;
      600: string;
      700: string;
      800: string;
      900: string;
      950: string;
    };
    stone: {
      50: string;
      100: string;
      200: string;
      300: string;
      400: string;
      500: string;
      600: string;
      700: string;
      800: string;
      900: string;
      950: string;
    };
    light: {
      50: string;
      100: string;
      200: string;
      300: string;
      400: string;
      500: string;
      600: string;
      700: string;
      800: string;
      900: string;
      950: string;
    };
    dark: {
      50: string;
      100: string;
      200: string;
      300: string;
      400: string;
      500: string;
      600: string;
      700: string;
      800: string;
      900: string;
      950: string;
    };
    readonly lightblue: string | (Colors & {
      DEFAULT?: string;
    });
    readonly lightBlue: string | (Colors & {
      DEFAULT?: string;
    });
    readonly warmgray: string | (Colors & {
      DEFAULT?: string;
    });
    readonly warmGray: string | (Colors & {
      DEFAULT?: string;
    });
    readonly truegray: string | (Colors & {
      DEFAULT?: string;
    });
    readonly trueGray: string | (Colors & {
      DEFAULT?: string;
    });
    readonly coolgray: string | (Colors & {
      DEFAULT?: string;
    });
    readonly coolGray: string | (Colors & {
      DEFAULT?: string;
    });
    readonly bluegray: string | (Colors & {
      DEFAULT?: string;
    });
    readonly blueGray: string | (Colors & {
      DEFAULT?: string;
    });
  };
  fontFamily: {
    sans: string;
    serif: string;
    mono: string;
  };
  fontSize: Record<string, string | [string, string | _$_unocss_core0.CSSObject] | [string, string, string]> | undefined;
  fontWeight: {
    thin: string;
    extralight: string;
    light: string;
    normal: string;
    medium: string;
    semibold: string;
    bold: string;
    extrabold: string;
    black: string;
  };
  breakpoints: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
  };
  verticalBreakpoints: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
  };
  borderRadius: {
    DEFAULT: string;
    none: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    full: string;
  };
  lineHeight: {
    none: string;
    tight: string;
    snug: string;
    normal: string;
    relaxed: string;
    loose: string;
  };
  letterSpacing: {
    tighter: string;
    tight: string;
    normal: string;
    wide: string;
    wider: string;
    widest: string;
  };
  wordSpacing: {
    tighter: string;
    tight: string;
    normal: string;
    wide: string;
    wider: string;
    widest: string;
  };
  boxShadow: {
    DEFAULT: string[];
    none: string;
    sm: string;
    md: string[];
    lg: string[];
    xl: string[];
    '2xl': string;
    inner: string;
  };
  textIndent: Record<string, string> | undefined;
  textShadow: {
    DEFAULT: string[];
    none: string;
    sm: string;
    md: string[];
    lg: string[];
    xl: string[];
  };
  textStrokeWidth: Record<string, string> | undefined;
  blur: {
    DEFAULT: string;
    '0': string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
  };
  dropShadow: {
    DEFAULT: string[];
    sm: string;
    md: string[];
    lg: string[];
    xl: string[];
    '2xl': string;
    none: string;
  };
  easing: {
    DEFAULT: string;
    linear: string;
    in: string;
    out: string;
    'in-out': string;
  };
  transitionProperty: {
    none: string;
    all: string;
    colors: string;
    opacity: string;
    shadow: string;
    transform: string;
    readonly DEFAULT: string;
  };
  lineWidth: {
    DEFAULT: string;
    none: string;
  };
  spacing: {
    DEFAULT: string;
    none: string;
    xs: string;
    sm: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
    '5xl': string;
    '6xl': string;
    '7xl': string;
    '8xl': string;
    '9xl': string;
  };
  duration: {
    DEFAULT: string;
    none: string;
    75: string;
    100: string;
    150: string;
    200: string;
    300: string;
    500: string;
    700: string;
    1000: string;
  };
  ringWidth: {
    DEFAULT: string;
    none: string;
  };
  preflightBase: {
    '--un-ring-inset': string;
    '--un-ring-offset-width': string;
    '--un-ring-offset-color': string;
    '--un-ring-width': string;
    '--un-ring-color': string;
    '--un-shadow': string;
    '--un-ring-offset-shadow': string;
    '--un-ring-shadow': string;
    '--un-shadow-inset': string;
    '--un-rotate': number;
    '--un-rotate-x': number;
    '--un-rotate-y': number;
    '--un-rotate-z': number;
    '--un-scale-x': number;
    '--un-scale-y': number;
    '--un-scale-z': number;
    '--un-skew-x': number;
    '--un-skew-y': number;
    '--un-translate-x': number;
    '--un-translate-y': number;
    '--un-translate-z': number;
  };
  containers: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
    '5xl': string;
    '6xl': string;
    '7xl': string;
    prose: string;
  };
  zIndex: {
    auto: string;
  };
  media: {
    mouse: string;
  };
};
//#endregion
//#region src/_theme/filters.d.ts
declare const blur: {
  DEFAULT: string;
  '0': string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
};
declare const dropShadow: {
  DEFAULT: string[];
  sm: string;
  md: string[];
  lg: string[];
  xl: string[];
  '2xl': string;
  none: string;
};
//#endregion
//#region src/_theme/font.d.ts
declare const fontFamily: {
  sans: string;
  serif: string;
  mono: string;
};
declare const fontSize: Theme['fontSize'];
declare const textIndent: Theme['textIndent'];
declare const textStrokeWidth: Theme['textStrokeWidth'];
declare const textShadow: {
  DEFAULT: string[];
  none: string;
  sm: string;
  md: string[];
  lg: string[];
  xl: string[];
};
declare const lineHeight: {
  none: string;
  tight: string;
  snug: string;
  normal: string;
  relaxed: string;
  loose: string;
};
declare const letterSpacing: {
  tighter: string;
  tight: string;
  normal: string;
  wide: string;
  wider: string;
  widest: string;
};
declare const fontWeight: {
  thin: string;
  extralight: string;
  light: string;
  normal: string;
  medium: string;
  semibold: string;
  bold: string;
  extrabold: string;
  black: string;
};
declare const wordSpacing: {
  tighter: string;
  tight: string;
  normal: string;
  wide: string;
  wider: string;
  widest: string;
};
//#endregion
//#region src/_theme/misc.d.ts
declare const breakpoints: {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
};
declare const verticalBreakpoints: {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
};
declare const lineWidth: {
  DEFAULT: string;
  none: string;
};
declare const spacing: {
  DEFAULT: string;
  none: string;
  xs: string;
  sm: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
  '4xl': string;
  '5xl': string;
  '6xl': string;
  '7xl': string;
  '8xl': string;
  '9xl': string;
};
declare const duration: {
  DEFAULT: string;
  none: string;
  75: string;
  100: string;
  150: string;
  200: string;
  300: string;
  500: string;
  700: string;
  1000: string;
};
declare const borderRadius: {
  DEFAULT: string;
  none: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
  full: string;
};
declare const boxShadow: {
  DEFAULT: string[];
  none: string;
  sm: string;
  md: string[];
  lg: string[];
  xl: string[];
  '2xl': string;
  inner: string;
};
declare const ringWidth: {
  DEFAULT: string;
  none: string;
};
declare const zIndex: {
  auto: string;
};
declare const media: {
  mouse: string;
};
//#endregion
//#region src/_theme/preflight.d.ts
declare const preflightBase: {
  '--un-ring-inset': string;
  '--un-ring-offset-width': string;
  '--un-ring-offset-color': string;
  '--un-ring-width': string;
  '--un-ring-color': string;
  '--un-shadow': string;
  '--un-ring-offset-shadow': string;
  '--un-ring-shadow': string;
  '--un-shadow-inset': string;
  '--un-rotate': number;
  '--un-rotate-x': number;
  '--un-rotate-y': number;
  '--un-rotate-z': number;
  '--un-scale-x': number;
  '--un-scale-y': number;
  '--un-scale-z': number;
  '--un-skew-x': number;
  '--un-skew-y': number;
  '--un-translate-x': number;
  '--un-translate-y': number;
  '--un-translate-z': number;
};
//#endregion
//#region src/_theme/size.d.ts
declare const baseSize: {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
  '4xl': string;
  '5xl': string;
  '6xl': string;
  '7xl': string;
  prose: string;
};
declare const width: {
  screen: string;
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
  '4xl': string;
  '5xl': string;
  '6xl': string;
  '7xl': string;
  prose: string;
  auto: string;
};
declare const maxWidth: {
  screen: string;
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
  '4xl': string;
  '5xl': string;
  '6xl': string;
  '7xl': string;
  prose: string;
  none: string;
};
declare const blockSize: {
  screen: string;
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
  '4xl': string;
  '5xl': string;
  '6xl': string;
  '7xl': string;
  prose: string;
  auto: string;
};
declare const inlineSize: {
  screen: string;
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
  '4xl': string;
  '5xl': string;
  '6xl': string;
  '7xl': string;
  prose: string;
  auto: string;
};
declare const height: {
  screen: string;
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
  '4xl': string;
  '5xl': string;
  '6xl': string;
  '7xl': string;
  prose: string;
  auto: string;
};
declare const maxHeight: {
  screen: string;
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
  '4xl': string;
  '5xl': string;
  '6xl': string;
  '7xl': string;
  prose: string;
  none: string;
};
declare const maxBlockSize: {
  screen: string;
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
  '4xl': string;
  '5xl': string;
  '6xl': string;
  '7xl': string;
  prose: string;
  none: string;
};
declare const maxInlineSize: {
  screen: string;
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
  '4xl': string;
  '5xl': string;
  '6xl': string;
  '7xl': string;
  prose: string;
  none: string;
};
declare const containers: {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
  '4xl': string;
  '5xl': string;
  '6xl': string;
  '7xl': string;
  prose: string;
};
//#endregion
export { wordSpacing as A, fontSize as C, textIndent as D, lineHeight as E, dropShadow as M, theme as N, textShadow as O, fontFamily as S, letterSpacing as T, media as _, inlineSize as a, verticalBreakpoints as b, maxInlineSize as c, preflightBase as d, borderRadius as f, lineWidth as g, duration as h, height as i, blur as j, textStrokeWidth as k, maxWidth as l, breakpoints as m, blockSize as n, maxBlockSize as o, boxShadow as p, containers as r, maxHeight as s, baseSize as t, width as u, ringWidth as v, fontWeight as w, zIndex as x, spacing as y };