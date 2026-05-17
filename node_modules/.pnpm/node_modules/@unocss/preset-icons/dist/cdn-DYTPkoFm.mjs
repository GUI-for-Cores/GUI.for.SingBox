import { n as createCDNFetchLoader } from "./core-DIrlUwzK.mjs";
//#region src/cdn.ts
async function createCDNLoader(cdnBase) {
	const { $fetch } = await import("ofetch");
	return createCDNFetchLoader($fetch, cdnBase);
}
//#endregion
export { createCDNLoader as t };
