//go:build !linux

package bridge

import (
	"path/filepath"
)

func setDataPath() {}

func resolvePath(path string) string {
	if !filepath.IsAbs(path) {
		path = filepath.Join(Env.BasePath, path)
	}
	return filepath.ToSlash(filepath.Clean(path))
}
