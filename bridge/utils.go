package bridge

import (
	"fmt"
	"path/filepath"

	"golang.org/x/text/encoding/simplifiedchinese"
)

func GetPath(path string) (string, error) {
	if filepath.IsAbs(path) {
		return path, nil
	}
	path = filepath.Join(Env.BasePath, path)
	path = filepath.Clean(path)
	return path, nil
}

func ConvertByte2String(byte []byte) string {
	decodeBytes, _ := simplifiedchinese.GB18030.NewDecoder().Bytes(byte)
	return string(decodeBytes)
}

func (a *App) AbsolutePath(path string) FlagResult {
	fmt.Println("AbsolutePath:", path)

	path, err := GetPath(path)
	if err != nil {
		return FlagResult{false, err.Error()}
	}

	return FlagResult{true, path}
}
