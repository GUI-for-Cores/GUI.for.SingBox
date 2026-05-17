//#region src/client.ts
function post(data, config) {
	return fetch("__POST_PATH__", {
		...config,
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(data)
	});
}
function include(set, v) {
	for (const i of v) set.add(i);
}
console.log("%c[unocss] devtools support enabled %c\nread more at https://windicss.org", "background:#0ea5e9; color:white; padding: 1px 4px; border-radius: 3px;", "");
const visitedClasses = /* @__PURE__ */ new Set();
const pendingClasses = /* @__PURE__ */ new Set();
let _timer;
function schedule() {
	if (_timer != null) clearTimeout(_timer);
	_timer = setTimeout(() => {
		if (pendingClasses.size) {
			post({
				type: "add-classes",
				data: Array.from(pendingClasses)
			}, { mode: "__POST_FETCH_MODE__" });
			include(visitedClasses, pendingClasses);
			pendingClasses.clear();
		}
	}, 10);
}
new MutationObserver((mutations) => {
	mutations.forEach((mutation) => {
		if (mutation.attributeName === "class" && mutation.target) {
			Array.from(mutation.target.classList || []).forEach((i) => {
				if (!visitedClasses.has(i)) pendingClasses.add(i);
			});
			schedule();
		}
	});
}).observe(document.documentElement || document.body, {
	childList: true,
	subtree: true,
	attributes: true
});
//#endregion
export {};
