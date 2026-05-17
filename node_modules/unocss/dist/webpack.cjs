const require_chunk = require("./chunk-CKQMccvm.cjs");
let _unocss_preset_uno = require("@unocss/preset-uno");
_unocss_preset_uno = require_chunk.__toESM(_unocss_preset_uno);
let _unocss_webpack = require("@unocss/webpack");
_unocss_webpack = require_chunk.__toESM(_unocss_webpack);
//#region src/webpack.ts
function UnocssWebpackPlugin(configOrPath) {
	return (0, _unocss_webpack.default)(configOrPath, { presets: [(0, _unocss_preset_uno.default)()] });
}
//#endregion
module.exports = UnocssWebpackPlugin;
Object.keys(_unocss_webpack).forEach(function(k) {
	if (k !== "default" && !Object.prototype.hasOwnProperty.call(exports, k)) Object.defineProperty(exports, k, {
		enumerable: true,
		get: function() {
			return _unocss_webpack[k];
		}
	});
});
