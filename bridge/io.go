package bridge

import (
	"archive/zip"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
)

func (a *App) Writefile(path string, content string) FlagResult {
	fmt.Println("Writefile:", path)

	path, err := GetPath(path)
	if err != nil {
		return FlagResult{false, err.Error()}
	}

	err = os.MkdirAll(filepath.Dir(path), os.ModePerm)
	if err != nil {
		return FlagResult{false, err.Error()}
	}

	err = os.WriteFile(path, []byte(content), 0644)
	if err != nil {
		return FlagResult{false, err.Error()}
	}

	return FlagResult{true, "Success"}
}

func (a *App) Readfile(path string) FlagResult {
	fmt.Println("Readfile:", path)

	path, err := GetPath(path)
	if err != nil {
		return FlagResult{false, err.Error()}
	}

	b, err := os.ReadFile(path)
	if err != nil {
		return FlagResult{false, err.Error()}
	}

	return FlagResult{true, string(b)}
}

func (a *App) Movefile(source string, target string) FlagResult {
	fmt.Println("Movefile:", source, target)

	source, err := GetPath(source)
	if err != nil {
		return FlagResult{false, err.Error()}
	}

	target, err = GetPath(target)
	if err != nil {
		return FlagResult{false, err.Error()}
	}

	err = os.Rename(source, target)
	if err != nil {
		return FlagResult{false, err.Error()}
	}

	return FlagResult{true, "Success"}
}

func UNUSED(x ...interface{}) {}

func (a *App) Copyfile(source string, target string) FlagResult {
	fmt.Println("Copyfile:", source, target)

	source, err := GetPath(source)
	if err != nil {
		return FlagResult{false, err.Error()}
	}

	target, err = GetPath(target)
	if err != nil {
		return FlagResult{false, err.Error()}
	}
	fmt.Println("Copyfile:", source, target)
	
	src, err := os.Open(source)
	if err != nil {
		return FlagResult{false, err.Error()}
	}
	defer src.Close()

	dest, err := os.Create(target)
	if err != nil {
		return FlagResult{false, err.Error()}
	}
	defer dest.Close()
	nBytes, err := io.Copy(dest, src)
	UNUSED(nBytes)
	if err != nil {
		return FlagResult{false, err.Error()}
	}
	return FlagResult{true, "Success"}
}

func (a *App) Removefile(path string) FlagResult {
	fmt.Println("RemoveFile:", path)
	path, err := GetPath(path)
	if err != nil {
		return FlagResult{false, err.Error()}
	}

	fmt.Println(path)

	err = os.RemoveAll(path)
	if err != nil {
		return FlagResult{false, err.Error()}
	}

	return FlagResult{true, "Success"}
}

func (a *App) Makedir(path string) FlagResult {
	fmt.Println("Makedir:", path)
	path, err := GetPath(path)
	if err != nil {
		return FlagResult{false, err.Error()}
	}

	err = os.MkdirAll(path, os.ModePerm)
	if err != nil {
		return FlagResult{false, err.Error()}
	}
	return FlagResult{true, "Success"}
}

func (a *App) UnzipZIPFile(path string, output string) FlagResult {
	fmt.Println("UnzipZIPFile:", path, output)

	path, err := GetPath(path)
	if err != nil {
		return FlagResult{false, err.Error()}
	}

	output, err = GetPath(output)
	if err != nil {
		return FlagResult{false, err.Error()}
	}

	archive, err := zip.OpenReader(path)
	if err != nil {
		return FlagResult{false, err.Error()}
	}
	defer archive.Close()

	for _, f := range archive.File {
		filePath := filepath.Join(output, f.Name)

		if !strings.HasPrefix(filePath, filepath.Clean(output)+string(os.PathSeparator)) {
			fmt.Println("invalid file path")
			return FlagResult{false, err.Error()}
		}
		if f.FileInfo().IsDir() {
			os.MkdirAll(filePath, os.ModePerm)
			continue
		}

		if err := os.MkdirAll(filepath.Dir(filePath), os.ModePerm); err != nil {
			return FlagResult{false, err.Error()}
		}

		dstFile, err := os.OpenFile(filePath, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, f.Mode())
		if err != nil {
			return FlagResult{false, err.Error()}
		}
		defer dstFile.Close()

		fileInArchive, err := f.Open()
		if err != nil {
			return FlagResult{false, err.Error()}
		}
		defer fileInArchive.Close()

		if _, err := io.Copy(dstFile, fileInArchive); err != nil {
			return FlagResult{false, err.Error()}
		}
	}
	return FlagResult{true, "Success"}
}
