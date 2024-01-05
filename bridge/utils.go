package bridge

import (
	"errors"
	"fmt"
	"path/filepath"
	"strings"

	"golang.org/x/text/encoding/simplifiedchinese"
)

func GetPath(path string) (string, error) {
	if(filepath.IsAbs(path)){
		return path, nil
	}
	path = filepath.Join(Env.BasePath, path)
	path = filepath.Clean(path)
	if !strings.HasPrefix(path, Env.BasePath) {
		fmt.Println("Error Path: " + path)
		return "", errors.New("Path error:" + path)
	}
	return path, nil
}

func ConvertByte2String(byte []byte) string {
	decodeBytes, _ := simplifiedchinese.GB18030.NewDecoder().Bytes(byte)
	return string(decodeBytes)
}
