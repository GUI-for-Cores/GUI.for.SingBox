import { Arrayable, CSSObject } from "@unocss/core";

//#region src/_theme/types.d.ts
interface ThemeAnimation {
  keyframes?: Record<string, string>;
  durations?: Record<string, string>;
  timingFns?: Record<string, string>;
  properties?: Record<string, object>;
  counts?: Record<string, string | number>;
  category?: Record<string, string>;
}
interface Colors {
  [key: string]: Colors & {
    DEFAULT?: string;
  } | string;
}
interface Theme {
  width?: Record<string, string>;
  height?: Record<string, string>;
  maxWidth?: Record<string, string>;
  maxHeight?: Record<string, string>;
  minWidth?: Record<string, string>;
  minHeight?: Record<string, string>;
  inlineSize?: Record<string, string>;
  blockSize?: Record<string, string>;
  maxInlineSize?: Record<string, string>;
  maxBlockSize?: Record<string, string>;
  minInlineSize?: Record<string, string>;
  minBlockSize?: Record<string, string>;
  borderRadius?: Record<string, string>;
  breakpoints?: Record<string, string>;
  verticalBreakpoints?: Record<string, string>;
  colors?: Colors;
  borderColor?: Colors;
  backgroundColor?: Colors;
  textColor?: Colors;
  shadowColor?: Colors;
  accentColor?: Colors;
  fontFamily?: Record<string, string>;
  fontSize?: Record<string, string | [string, string | CSSObject] | [string, string, string]>;
  fontWeight?: Record<string, string>;
  lineHeight?: Record<string, string>;
  letterSpacing?: Record<string, string>;
  wordSpacing?: Record<string, string>;
  boxShadow?: Record<string, string | string[]>;
  textIndent?: Record<string, string>;
  textShadow?: Record<string, string | string[]>;
  textStrokeWidth?: Record<string, string>;
  ringWidth?: Record<string, string>;
  lineWidth?: Record<string, string>;
  spacing?: Record<string, string>;
  duration?: Record<string, string>;
  aria?: Record<string, string>;
  data?: Record<string, string>;
  zIndex?: Record<string, string>;
  blur?: Record<string, string>;
  dropShadow?: Record<string, string | string[]>;
  easing?: Record<string, string>;
  transitionProperty?: Record<string, string>;
  media?: Record<string, string>;
  supports?: Record<string, string>;
  containers?: Record<string, string>;
  animation?: ThemeAnimation;
  gridAutoColumn?: Record<string, string>;
  gridAutoRow?: Record<string, string>;
  gridColumn?: Record<string, string>;
  gridRow?: Record<string, string>;
  gridTemplateColumn?: Record<string, string>;
  gridTemplateRow?: Record<string, string>;
  container?: {
    center?: boolean;
    padding?: string | Record<string, string>;
    maxWidth?: Record<string, string>;
  };
  /** Used to generate CSS custom properties placeholder in preflight */
  preflightRoot?: Arrayable<string>;
  preflightBase?: Record<string, string | number>;
}
//#endregion
//#region src/_theme/colors.d.ts
declare const colors: {
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
//#endregion
export { ThemeAnimation as i, Colors as n, Theme as r, colors as t };