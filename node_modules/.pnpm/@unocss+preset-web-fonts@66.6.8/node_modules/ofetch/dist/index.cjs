'use strict';

const fetch$1 = require('./shared/ofetch.BBShr9Pz.cjs');
require('destr');
require('ufo');

const _globalThis = (function() {
  if (typeof globalThis !== "undefined") {
    return globalThis;
  }
  if (typeof self !== "undefined") {
    return self;
  }
  if (typeof window !== "undefined") {
    return window;
  }
  if (typeof global !== "undefined") {
    return global;
  }
  throw new Error("unable to locate global object");
})();
const fetch = _globalThis.fetch ? (...args) => _globalThis.fetch(...args) : () => Promise.reject(new Error("[ofetch] global.fetch is not supported!"));
const Headers = _globalThis.Headers;
const AbortController = _globalThis.AbortController;
const ofetch = fetch$1.createFetch({ fetch, Headers, AbortController });
const $fetch = ofetch;

exports.FetchError = fetch$1.FetchError;
exports.createFetch = fetch$1.createFetch;
exports.createFetchError = fetch$1.createFetchError;
exports.$fetch = $fetch;
exports.AbortController = AbortController;
exports.Headers = Headers;
exports.fetch = fetch;
exports.ofetch = ofetch;
