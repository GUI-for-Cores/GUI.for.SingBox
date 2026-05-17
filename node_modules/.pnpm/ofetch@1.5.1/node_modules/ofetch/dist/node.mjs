import http from 'node:http';
import https from 'node:https';
import nodeFetch, { AbortController as AbortController$1, Headers as Headers$1 } from 'node-fetch-native';
import { c as createFetch } from './shared/ofetch.CWycOUEr.mjs';
export { F as FetchError, a as createFetchError } from './shared/ofetch.CWycOUEr.mjs';
import 'destr';
import 'ufo';

function createNodeFetch() {
  const useKeepAlive = JSON.parse(process.env.FETCH_KEEP_ALIVE || "false");
  if (!useKeepAlive) {
    return nodeFetch;
  }
  const agentOptions = { keepAlive: true };
  const httpAgent = new http.Agent(agentOptions);
  const httpsAgent = new https.Agent(agentOptions);
  const nodeFetchOptions = {
    agent(parsedURL) {
      return parsedURL.protocol === "http:" ? httpAgent : httpsAgent;
    }
  };
  return function nodeFetchWithKeepAlive(input, init) {
    return nodeFetch(input, { ...nodeFetchOptions, ...init });
  };
}
const fetch = globalThis.fetch ? (...args) => globalThis.fetch(...args) : createNodeFetch();
const Headers = globalThis.Headers || Headers$1;
const AbortController = globalThis.AbortController || AbortController$1;
const ofetch = createFetch({ fetch, Headers, AbortController });
const $fetch = ofetch;

export { $fetch, AbortController, Headers, createFetch, createNodeFetch, fetch, ofetch };
