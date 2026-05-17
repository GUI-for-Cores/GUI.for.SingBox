import * as undici from 'undici';

interface $Fetch {
    <T = any, R extends ResponseType = "json">(request: FetchRequest, options?: FetchOptions<R>): Promise<MappedResponseType<R, T>>;
    raw<T = any, R extends ResponseType = "json">(request: FetchRequest, options?: FetchOptions<R>): Promise<FetchResponse<MappedResponseType<R, T>>>;
    native: Fetch;
    create(defaults: FetchOptions, globalOptions?: CreateFetchOptions): $Fetch;
}
interface FetchOptions<R extends ResponseType = ResponseType, T = any> extends Omit<RequestInit, "body">, FetchHooks<T, R> {
    baseURL?: string;
    body?: RequestInit["body"] | Record<string, any>;
    ignoreResponseError?: boolean;
    /**
     * @deprecated use query instead.
     */
    params?: Record<string, any>;
    query?: Record<string, any>;
    parseResponse?: (responseText: string) => any;
    responseType?: R;
    /**
     * @experimental Set to "half" to enable duplex streaming.
     * Will be automatically set to "half" when using a ReadableStream as body.
     * @see https://fetch.spec.whatwg.org/#enumdef-requestduplex
     */
    duplex?: "half" | undefined;
    /**
     * Only supported in Node.js >= 18 using undici
     *
     * @see https://undici.nodejs.org/#/docs/api/Dispatcher
     */
    dispatcher?: InstanceType<typeof undici.Dispatcher>;
    /**
     * Only supported older Node.js versions using node-fetch-native polyfill.
     */
    agent?: unknown;
    /** timeout in milliseconds */
    timeout?: number;
    retry?: number | false;
    /** Delay between retries in milliseconds. */
    retryDelay?: number | ((context: FetchContext<T, R>) => number);
    /** Default is [408, 409, 425, 429, 500, 502, 503, 504] */
    retryStatusCodes?: number[];
}
interface ResolvedFetchOptions<R extends ResponseType = ResponseType, T = any> extends FetchOptions<R, T> {
    headers: Headers;
}
interface CreateFetchOptions {
    defaults?: FetchOptions;
    fetch?: Fetch;
    Headers?: typeof Headers;
    AbortController?: typeof AbortController;
}
type GlobalOptions = Pick<FetchOptions, "timeout" | "retry" | "retryDelay">;
interface FetchContext<T = any, R extends ResponseType = ResponseType> {
    request: FetchRequest;
    options: ResolvedFetchOptions<R>;
    response?: FetchResponse<T>;
    error?: Error;
}
type MaybePromise<T> = T | Promise<T>;
type MaybeArray<T> = T | T[];
type FetchHook<C extends FetchContext = FetchContext> = (context: C) => MaybePromise<void>;
interface FetchHooks<T = any, R extends ResponseType = ResponseType> {
    onRequest?: MaybeArray<FetchHook<FetchContext<T, R>>>;
    onRequestError?: MaybeArray<FetchHook<FetchContext<T, R> & {
        error: Error;
    }>>;
    onResponse?: MaybeArray<FetchHook<FetchContext<T, R> & {
        response: FetchResponse<T>;
    }>>;
    onResponseError?: MaybeArray<FetchHook<FetchContext<T, R> & {
        response: FetchResponse<T>;
    }>>;
}
interface ResponseMap {
    blob: Blob;
    text: string;
    arrayBuffer: ArrayBuffer;
    stream: ReadableStream<Uint8Array>;
}
type ResponseType = keyof ResponseMap | "json";
type MappedResponseType<R extends ResponseType, JsonType = any> = R extends keyof ResponseMap ? ResponseMap[R] : JsonType;
interface FetchResponse<T> extends Response {
    _data?: T;
}
interface IFetchError<T = any> extends Error {
    request?: FetchRequest;
    options?: FetchOptions;
    response?: FetchResponse<T>;
    data?: T;
    status?: number;
    statusText?: string;
    statusCode?: number;
    statusMessage?: string;
}
type Fetch = typeof globalThis.fetch;
type FetchRequest = RequestInfo;
interface SearchParameters {
    [key: string]: any;
}

declare function createFetch(globalOptions?: CreateFetchOptions): $Fetch;

declare class FetchError<T = any> extends Error implements IFetchError<T> {
    constructor(message: string, opts?: {
        cause: unknown;
    });
}
interface FetchError<T = any> extends IFetchError<T> {
}
declare function createFetchError<T = any>(ctx: FetchContext<T>): IFetchError<T>;

export { FetchError as F, createFetchError as a, createFetch as c };
export type { $Fetch as $, CreateFetchOptions as C, GlobalOptions as G, IFetchError as I, MappedResponseType as M, ResolvedFetchOptions as R, SearchParameters as S, FetchOptions as b, FetchContext as d, FetchHook as e, FetchHooks as f, ResponseMap as g, ResponseType as h, FetchResponse as i, Fetch as j, FetchRequest as k };
