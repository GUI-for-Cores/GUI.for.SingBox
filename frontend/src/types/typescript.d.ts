type Recordable<T = any> = { [x: string]: T }

type MaybePromise<T> = T | Promise<T>
