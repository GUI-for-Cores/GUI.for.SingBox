//go:build linux

package bridge

import (
	"os"
	"path/filepath"
	"strings"
)

func setDataPath() {
	if _, err := os.Stat(filepath.Join(Env.BasePath, "data", "user.yaml")); err == nil {
		return
	}

	dataHome := os.Getenv("XDG_DATA_HOME")
	if !filepath.IsAbs(dataHome) {
		homeDir, err := os.UserHomeDir()
		if err != nil || homeDir == "" {
			return
		}
		dataHome = filepath.Join(homeDir, ".local", "share")
	}

	Env.DataPath = filepath.ToSlash(filepath.Join(dataHome, Env.AppName))
}

func resolvePath(path string) string {
	cleanPath := filepath.ToSlash(filepath.Clean(path))

	if filepath.IsAbs(cleanPath) {
		return cleanPath
	}

	basePath := Env.BasePath
	if isDataPath(cleanPath) {
		basePath = Env.DataPath
	}

	resolvedPath := filepath.Join(basePath, cleanPath)

	return resolvedPath
}

func isDataPath(path string) bool {
	return path == "data" || strings.HasPrefix(path, "data/")
}
