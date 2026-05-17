import { $ as $Fetch } from './shared/ofetch.BbrTaNPp.mjs';
export { C as CreateFetchOptions, j as Fetch, d as FetchContext, F as FetchError, e as FetchHook, f as FetchHooks, b as FetchOptions, k as FetchRequest, i as FetchResponse, G as GlobalOptions, I as IFetchError, M as MappedResponseType, R as ResolvedFetchOptions, g as ResponseMap, h as ResponseType, S as SearchParameters, c as createFetch, a as createFetchError } from './shared/ofetch.BbrTaNPp.mjs';
import 'undici';

declare function createNodeFetch(): (input: RequestInfo, init?: RequestInit) => any;
declare const fetch: typeof globalThis.fetch;
declare const Headers: {
    new (init?: HeadersInit): Headers;
    prototype: Headers;
};
declare const AbortController: {
    new (): AbortController;
    prototype: AbortController;
};
declare const ofetch: $Fetch;
declare const $fetch: $Fetch;

export { $Fetch, $fetch, AbortController, Headers, createNodeFetch, fetch, ofetch };
