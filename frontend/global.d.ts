export {}

declare global {
  interface Window {
    Plugins: any
  }
  /**
   * The variable is initialized in `globalMethods.ts:20`
   */
  var AsyncFunction: FunctionConstructor
}
