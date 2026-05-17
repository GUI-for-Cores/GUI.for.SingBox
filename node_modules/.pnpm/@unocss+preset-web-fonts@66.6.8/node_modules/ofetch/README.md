# ofetch

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![bundle][bundle-src]][bundle-href]
[![Codecov][codecov-src]][codecov-href]
[![License][license-src]][license-href]
[![JSDocs][jsdocs-src]][jsdocs-href]

A better fetch API. Works on node, browser, and workers.

<details>
  <summary>Spoiler</summary>
  <img src="https://media.giphy.com/media/Dn1QRA9hqMcoMz9zVZ/giphy.gif">
</details>

## 🚀 Quick Start

Install:

```bash
# npm
npm i ofetch

# yarn
yarn add ofetch
```

Import:

```js
// ESM / Typescript
import { ofetch } from "ofetch";

// CommonJS
const { ofetch } = require("ofetch");
```

## ✔️ Works with Node.js

We use [conditional exports](https://nodejs.org/api/packages.html#packages_conditional_exports) to detect Node.js
and automatically use [unjs/node-fetch-native](https://github.com/unjs/node-fetch-native). If `globalThis.fetch` is available, will be used instead. To leverage Node.js 17.5.0 experimental native fetch API use [`--experimental-fetch` flag](https://nodejs.org/dist/latest-v17.x/docs/api/cli.html#--experimental-fetch).

## ✔️ Parsing Response

`ofetch` will smartly parse JSON and native values using [destr](https://github.com/unjs/destr), falling back to the text if it fails to parse.

```js
const { users } = await ofetch("/api/users");
```

For binary content types, `ofetch` will instead return a `Blob` object.

You can optionally provide a different parser than `destr`, or specify `blob`, `arrayBuffer`, `text` or `stream` to force parsing the body with the respective `FetchResponse` method.

```js
// Use JSON.parse
await ofetch("/movie?lang=en", { parseResponse: JSON.parse });

// Return text as is
await ofetch("/movie?lang=en", { parseResponse: (txt) => txt });

// Get the blob version of the response
await ofetch("/api/generate-image", { responseType: "blob" });

// Get the stream version of the response
await ofetch("/api/generate-image", { responseType: "stream" });
```

## ✔️ JSON Body

If an object or a class with a `.toJSON()` method is passed to the `body` option, `ofetch` automatically stringifies it.

`ofetch` utilizes `JSON.stringify()` to convert the passed object. Classes without a `.toJSON()` method have to be converted into a string value in advance before being passed to the `body` option.

For `PUT`, `PATCH`, and `POST` request methods, when a string or object body is set, `ofetch` adds the default `"content-type": "application/json"` and `accept: "application/json"` headers (which you can always override).

Additionally, `ofetch` supports binary responses with `Buffer`, `ReadableStream`, `Stream`, and [compatible body types](https://developer.mozilla.org/en-US/docs/Web/API/fetch#body). `ofetch` will automatically set the `duplex: "half"` option for streaming support!

**Example:**

```js
const { users } = await ofetch("/api/users", {
  method: "POST",
  body: { some: "json" },
});
```

## ✔️ Handling Errors

`ofetch` Automatically throws errors when `response.ok` is `false` with a friendly error message and compact stack (hiding internals).

A parsed error body is available with `error.data`. You may also use `FetchError` type.

```ts
await ofetch("https://google.com/404");
// FetchError: [GET] "https://google/404": 404 Not Found
//     at async main (/project/playground.ts:4:3)
```

To catch error response:

```ts
await ofetch("/url").catch((error) => error.data);
```

To bypass status error catching you can set `ignoreResponseError` option:

```ts
await ofetch("/url", { ignoreResponseError: true });
```

## ✔️ Auto Retry

`ofetch` Automatically retries the request if an error happens and if the response status code is included in `retryStatusCodes` list:

**Retry status codes:**

- `408` - Request Timeout
- `409` - Conflict
- `425` - Too Early ([Experimental](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Early-Data))
- `429` - Too Many Requests
- `500` - Internal Server Error
- `502` - Bad Gateway
- `503` - Service Unavailable
- `504` - Gateway Timeout

You can specify the amount of retry and delay between them using `retry` and `retryDelay` options and also pass a custom array of codes using `retryStatusCodes` option.

The default for `retry` is `1` retry, except for `POST`, `PUT`, `PATCH`, and `DELETE` methods where `ofetch` does not retry by default to avoid introducing side effects. If you set a custom value for `retry` it will **always retry** for all requests.

The default for `retryDelay` is `0` ms.

```ts
await ofetch("http://google.com/404", {
  retry: 3,
  retryDelay: 500, // ms
  retryStatusCodes: [ 404, 500 ], // response status codes to retry
});
```

## ✔️ Timeout

You can specify `timeout` in milliseconds to automatically abort a request after a timeout (default is disabled).

```ts
await ofetch("http://google.com/404", {
  timeout: 3000, // Timeout after 3 seconds
});
```

## ✔️ Type Friendly

The response can be type assisted:

```ts
const article = await ofetch<Article>(`/api/article/${id}`);
// Auto complete working with article.id
```

## ✔️ Adding `baseURL`

By using `baseURL` option, `ofetch` prepends it for trailing/leading slashes and query search params for baseURL using [ufo](https://github.com/unjs/ufo):

```js
await ofetch("/config", { baseURL });
```

## ✔️ Adding Query Search Params

By using `query` option (or `params` as alias), `ofetch` adds query search params to the URL by preserving the query in the request itself using [ufo](https://github.com/unjs/ufo):

```js
await ofetch("/movie?lang=en", { query: { id: 123 } });
```

## ✔️ Interceptors

Providing async interceptors to hook into lifecycle events of `ofetch` call is possible.

You might want to use `ofetch.create` to set shared interceptors.

### `onRequest({ request, options })`

`onRequest` is called as soon as `ofetch` is called, allowing you to modify options or do simple logging.

```js
await ofetch("/api", {
  async onRequest({ request, options }) {
    // Log request
    console.log("[fetch request]", request, options);

    // Add `?t=1640125211170` to query search params
    options.query = options.query || {};
    options.query.t = new Date();
  },
});
```

### `onRequestError({ request, options, error })`

`onRequestError` will be called when the fetch request fails.

```js
await ofetch("/api", {
  async onRequestError({ request, options, error }) {
    // Log error
    console.log("[fetch request error]", request, error);
  },
});
```

### `onResponse({ request, options, response })`

`onResponse` will be called after `fetch` call and parsing body.

```js
await ofetch("/api", {
  async onResponse({ request, response, options }) {
    // Log response
    console.log("[fetch response]", request, response.status, response.body);
  },
});
```

### `onResponseError({ request, options, response })`

`onResponseError` is the same as `onResponse` but will be called when fetch happens but `response.ok` is not `true`.

```js
await ofetch("/api", {
  async onResponseError({ request, response, options }) {
    // Log error
    console.log(
      "[fetch response error]",
      request,
      response.status,
      response.body
    );
  },
});
```

### Passing array of interceptors

If necessary, it's also possible to pass an array of function that will be called sequentially.

```js
await ofetch("/api", {
  onRequest: [
    () => {
      /* Do something */
    },
    () => {
      /* Do something else */
    },
  ],
});
```

## ✔️ Create fetch with default options

This utility is useful if you need to use common options across several fetch calls.

**Note:** Defaults will be cloned at one level and inherited. Be careful about nested options like `headers`.

```js
const apiFetch = ofetch.create({ baseURL: "/api" });

apiFetch("/test"); // Same as ofetch('/test', { baseURL: '/api' })
```

## 💡 Adding headers

By using `headers` option, `ofetch` adds extra headers in addition to the request default headers:

```js
await ofetch("/movies", {
  headers: {
    Accept: "application/json",
    "Cache-Control": "no-cache",
  },
});
```

## 🍣 Access to Raw Response

If you need to access raw response (for headers, etc), you can use `ofetch.raw`:

```js
const response = await ofetch.raw("/sushi");

// response._data
// response.headers
// ...
```

## 🌿 Using Native Fetch

As a shortcut, you can use `ofetch.native` that provides native `fetch` API

```js
const json = await ofetch.native("/sushi").then((r) => r.json());
```

## 📡 SSE

**Example:** Handle SSE response:

```js
const stream = await ofetch("/sse")
const reader = stream.getReader();
const decoder = new TextDecoder()
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  // Here is the chunked text of the SSE response.
  const text = decoder.decode(value)
}
```

## 🕵️ Adding HTTP(S) Agent

In Node.js (>= 18) environments, you can provide a custom dispatcher to intercept requests and support features such as Proxy and self-signed certificates. This feature is enabled by [undici](https://undici.nodejs.org/) built-in Node.js. [read more](https://undici.nodejs.org/#/docs/api/Dispatcher) about the Dispatcher API.

Some available agents:

- `ProxyAgent`: A Proxy Agent class that implements the Agent API. It allows the connection through a proxy in a simple way. ([docs](https://undici.nodejs.org/#/docs/api/ProxyAgent))
- `MockAgent`: A mocked Agent class that implements the Agent API. It allows one to intercept HTTP requests made through undici and return mocked responses instead. ([docs](https://undici.nodejs.org/#/docs/api/MockAgent))
- `Agent`: Agent allows dispatching requests against multiple different origins. ([docs](https://undici.nodejs.org/#/docs/api/Agent))

**Example:** Set a proxy agent for one request:

```ts
import { ProxyAgent } from "undici";
import { ofetch } from "ofetch";

const proxyAgent = new ProxyAgent("http://localhost:3128");
const data = await ofetch("https://icanhazip.com", { dispatcher: proxyAgent });
```

**Example:** Create a custom fetch instance that has proxy enabled:

```ts
import { ProxyAgent, setGlobalDispatcher } from "undici";
import { ofetch } from "ofetch";

const proxyAgent = new ProxyAgent("http://localhost:3128");
const fetchWithProxy = ofetch.create({ dispatcher: proxyAgent });

const data = await fetchWithProxy("https://icanhazip.com");
```

**Example:** Set a proxy agent for all requests:

```ts
import { ProxyAgent, setGlobalDispatcher } from "undici";
import { ofetch } from "ofetch";

const proxyAgent = new ProxyAgent("http://localhost:3128");
setGlobalDispatcher(proxyAgent);

const data = await ofetch("https://icanhazip.com");
```

**Example:** Allow self-signed certificates (USE AT YOUR OWN RISK!)

```ts
import { Agent } from "undici";
import { ofetch } from "ofetch";

// Note: This makes fetch unsecure against MITM attacks. USE AT YOUR OWN RISK!
const unsecureAgent = new Agent({ connect: { rejectUnauthorized: false } });
const unsecureFetch = ofetch.create({ dispatcher: unsecureAgent });

const data = await unsecureFetch("https://www.squid-cache.org/");
```

On older Node.js version (<18), you might also use use `agent`:

```ts
import { HttpsProxyAgent } from "https-proxy-agent";

await ofetch("/api", {
  agent: new HttpsProxyAgent("http://example.com"),
});
```

### `keepAlive` support (only works for Node < 18)

By setting the `FETCH_KEEP_ALIVE` environment variable to `true`, an HTTP/HTTPS agent will be registered that keeps sockets around even when there are no outstanding requests, so they can be used for future requests without having to re-establish a TCP connection.

**Note:** This option can potentially introduce memory leaks. Please check [node-fetch/node-fetch#1325](https://github.com/node-fetch/node-fetch/pull/1325).

### 💪 Augment `FetchOptions` interface

You can augment the `FetchOptions` interface to add custom properties.

```ts
// Place this in any `.ts` or `.d.ts` file.
// Ensure it's included in the project's tsconfig.json "files".
declare module "ofetch" {
  interface FetchOptions {
    // Custom properties 
    requiresAuth?: boolean;
  }
}

export {}
```

This lets you pass and use those properties with full type safety throughout `ofetch` calls.

```ts
const myFetch = ofetch.create({
  onRequest(context) {
    //      ^? { ..., options: {..., requiresAuth?: boolean }}
    console.log(context.options.requiresAuth);
  },
});

myFetch("/foo", { requiresAuth: true })
```

## 📦 Bundler Notes

- All targets are exported with Module and CommonJS format and named exports
- No export is transpiled for the sake of modern syntax
  - You probably need to transpile `ofetch`, `destr`, and `ufo` packages with Babel for ES5 support
- You need to polyfill `fetch` global for supporting legacy browsers like using [unfetch](https://github.com/developit/unfetch)

## ❓ FAQ

**Why export is called `ofetch` instead of `fetch`?**

Using the same name of `fetch` can be confusing since API is different but still, it is a fetch so using the closest possible alternative. You can, however, import `{ fetch }` from `ofetch` which is auto-polyfill for Node.js and using native otherwise.

**Why not have default export?**

Default exports are always risky to be mixed with CommonJS exports.

This also guarantees we can introduce more utils without breaking the package and also encourage using `ofetch` name.

**Why not transpiled?**

By transpiling libraries, we push the web backward with legacy code which is unneeded for most of the users.

If you need to support legacy users, you can optionally transpile the library in your build pipeline.

## License

MIT. Made with 💖

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/ofetch?style=flat&colorA=18181B&colorB=F0DB4F
[npm-version-href]: https://npmjs.com/package/ofetch
[npm-downloads-src]: https://img.shields.io/npm/dm/ofetch?style=flat&colorA=18181B&colorB=F0DB4F
[npm-downloads-href]: https://npmjs.com/package/ofetch
[codecov-src]: https://img.shields.io/codecov/c/gh/unjs/ofetch/main?style=flat&colorA=18181B&colorB=F0DB4F
[codecov-href]: https://codecov.io/gh/unjs/ofetch
[bundle-src]: https://img.shields.io/bundlephobia/minzip/ofetch?style=flat&colorA=18181B&colorB=F0DB4F
[bundle-href]: https://bundlephobia.com/result?p=ofetch
[license-src]: https://img.shields.io/github/license/unjs/ofetch.svg?style=flat&colorA=18181B&colorB=F0DB4F
[license-href]: https://github.com/unjs/ofetch/blob/main/LICENSE
[jsdocs-src]: https://img.shields.io/badge/jsDocs.io-reference-18181B?style=flat&colorA=18181B&colorB=F0DB4F
[jsdocs-href]: https://www.jsdocs.io/package/ofetch
