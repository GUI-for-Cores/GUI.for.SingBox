package bridge

import (
	"archive/tar"
	"archive/zip"
	"compress/gzip"
	"encoding/base64"
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
	"strings"

	"github.com/pkg/browser"
)

const (
	Binary = "Binary"
	Text   = "Text"
)

func (a *App) WriteFile(path string, content string, options IOOptions) FlagResult {
	log.Printf("WriteFile [%s %s]: %s", options.Mode, options.Range, path)

	fullPath := GetPath(path)

	if err := os.MkdirAll(filepath.Dir(fullPath), os.ModePerm); err != nil {
		return FlagResult{false, err.Error()}
	}

	var data []byte
	var err error

	switch options.Mode {
	case Text:
		data = []byte(content)
	case Binary:
		data, err = base64.StdEncoding.DecodeString(content)
		if err != nil {
			return FlagResult{false, err.Error()}
		}
	default:
		return FlagResult{false, "Unsupported IO mode: " + options.Mode}
	}

	file, err := os.OpenFile(fullPath, os.O_RDWR|os.O_CREATE, 0644)
	if err != nil {
		return FlagResult{false, err.Error()}
	}
	defer file.Close()

	stat, err := file.Stat()
	if err != nil {
		return FlagResult{false, err.Error()}
	}
	fileSize := stat.Size()

	var start, end int64

	if options.Range == "" {
		start = 0
		end = int64(len(data)) - 1

		if err := file.Truncate(0); err != nil {
			return FlagResult{false, err.Error()}
		}
	} else {
		start, end, err = ParseRange(options.Range, fileSize)
		if err != nil {
			return FlagResult{false, err.Error()}
		}

		writeLength := int64(len(data))
		if writeLength != end-start+1 {
			return FlagResult{false, "data length does not match range length"}
		}
	}

	_, err = file.WriteAt(data, start)
	if err != nil {
		return FlagResult{false, err.Error()}
	}

	return FlagResult{true, "Success"}
}

func (a *App) ReadFile(path string, options IOOptions) FlagResult {
	log.Printf("ReadFile [%s %s]: %s", options.Mode, options.Range, path)

	fullPath := GetPath(path)

	file, err := os.Open(fullPath)
	if err != nil {
		return FlagResult{false, err.Error()}
	}
	defer file.Close()

	stat, err := file.Stat()
	if err != nil {
		return FlagResult{false, err.Error()}
	}
	fileSize := stat.Size()

	start, end, err := ParseRange(options.Range, fileSize)
	if err != nil {
		return FlagResult{false, err.Error()}
	}

	length := end - start + 1
	buf := make([]byte, length)

	n, err := file.ReadAt(buf, start)
	if err != nil && err != io.EOF {
		return FlagResult{false, err.Error()}
	}
	buf = buf[:n]

	switch options.Mode {
	case Text:
		return FlagResult{true, string(buf)}
	case Binary:
		return FlagResult{true, base64.StdEncoding.EncodeToString(buf)}
	default:
		return FlagResult{false, "Unsupported IO mode: " + options.Mode}
	}
}

func (a *App) MoveFile(source string, target string) FlagResult {
	log.Printf("MoveFile: %s -> %s", source, target)

	fullSource := GetPath(source)
	fullTarget := GetPath(target)

	if err := os.MkdirAll(filepath.Dir(fullTarget), os.ModePerm); err != nil {
		return FlagResult{false, err.Error()}
	}

	if err := os.Rename(fullSource, fullTarget); err != nil {
		return FlagResult{false, err.Error()}
	}

	return FlagResult{true, "Success"}
}

func (a *App) RemoveFile(path string) FlagResult {
	log.Printf("RemoveFile: %s", path)

	fullPath := GetPath(path)

	if err := os.RemoveAll(fullPath); err != nil {
		return FlagResult{false, err.Error()}
	}

	return FlagResult{true, "Success"}
}

func (a *App) CopyFile(src string, dst string) FlagResult {
	log.Printf("CopyFile: %s -> %s", src, dst)

	srcPath := GetPath(src)
	dstPath := GetPath(dst)

	srcFile, err := os.Open(srcPath)
	if err != nil {
		return FlagResult{false, err.Error()}
	}
	defer srcFile.Close()

	if err := os.MkdirAll(filepath.Dir(dstPath), os.ModePerm); err != nil {
		return FlagResult{false, err.Error()}
	}

	dstFile, err := os.Create(dstPath)
	if err != nil {
		return FlagResult{false, err.Error()}
	}
	defer dstFile.Close()

	if _, err := io.Copy(dstFile, srcFile); err != nil {
		return FlagResult{false, err.Error()}
	}

	return FlagResult{true, "Success"}
}

func (a *App) MakeDir(path string) FlagResult {
	log.Printf("MakeDir: %s", path)

	fullPath := GetPath(path)

	if err := os.MkdirAll(fullPath, os.ModePerm); err != nil {
		return FlagResult{false, err.Error()}
	}

	return FlagResult{true, "Success"}
}

func (a *App) ReadDir(path string) FlagResult {
	log.Printf("ReadDir: %s", path)

	fullPath := GetPath(path)

	files, err := os.ReadDir(fullPath)
	if err != nil {
		return FlagResult{false, err.Error()}
	}

	var result []string

	for _, file := range files {
		if info, err := file.Info(); err == nil {
			result = append(result, fmt.Sprintf("%v,%v,%v", info.Name(), info.Size(), info.IsDir()))
		}
	}

	return FlagResult{true, strings.Join(result, "|")}
}

func (a *App) OpenDir(path string) FlagResult {
	log.Printf("OpenDir: %s", path)

	fullPath := GetPath(path)

	err := browser.OpenURL(fullPath)
	if err != nil {
		return FlagResult{false, err.Error()}
	}

	return FlagResult{true, "Success"}
}

func (a *App) OpenURI(uri string) FlagResult {
	log.Printf("OpenURI: %s", uri)

	err := browser.OpenURL(uri)
	if err != nil {
		return FlagResult{false, err.Error()}
	}

	return FlagResult{true, "Success"}
}

func (a *App) AbsolutePath(path string) FlagResult {
	log.Printf("AbsolutePath: %s", path)

	absPath := GetPath(path)

	return FlagResult{true, absPath}
}

func (a *App) UnzipZIPFile(path string, output string) FlagResult {
	log.Printf("UnzipZIPFile: %s -> %s", path, output)

	fullPath := GetPath(path)
	outputPath := GetPath(output)

	archive, err := zip.OpenReader(fullPath)
	if err != nil {
		return FlagResult{false, err.Error()}
	}
	defer archive.Close()

	cleanOutputPath := outputPath + "/"

	for _, f := range archive.File {
		filePath := filepath.ToSlash(filepath.Clean(filepath.Join(outputPath, f.Name)))

		if !strings.HasPrefix(filePath, cleanOutputPath) {
			continue
		}

		if f.FileInfo().IsDir() {
			os.MkdirAll(filePath, os.ModePerm)
			continue
		}

		if err := os.MkdirAll(filepath.Dir(filePath), os.ModePerm); err != nil {
			continue
		}

		fileInArchive, err := f.Open()
		if err != nil {
			continue
		}

		dstFile, err := os.OpenFile(filePath, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, f.Mode())
		if err != nil {
			fileInArchive.Close()
			continue
		}

		if _, err := io.Copy(dstFile, fileInArchive); err != nil {
			fileInArchive.Close()
			dstFile.Close()
			continue
		}

		fileInArchive.Close()
		dstFile.Close()
	}

	return FlagResult{true, "Success"}
}

func (a *App) UnzipTarGZFile(path string, output string) FlagResult {
	log.Printf("UnzipTarGZFile: %s -> %s", path, output)

	fullPath := GetPath(path)
	outputPath := GetPath(output)

	gzipFile, err := os.Open(fullPath)
	if err != nil {
		return FlagResult{false, err.Error()}
	}
	defer gzipFile.Close()

	gzipReader, err := gzip.NewReader(gzipFile)
	if err != nil {
		return FlagResult{false, err.Error()}
	}
	defer gzipReader.Close()

	tarReader := tar.NewReader(gzipReader)

	cleanOutputPath := outputPath + "/"

	for {
		header, err := tarReader.Next()
		if err == io.EOF {
			break
		}
		if err != nil {
			return FlagResult{false, err.Error()}
		}

		filePath := filepath.ToSlash(filepath.Clean(filepath.Join(outputPath, header.Name)))

		if !strings.HasPrefix(filePath, cleanOutputPath) {
			continue
		}

		if header.Typeflag == tar.TypeDir {
			os.MkdirAll(filePath, os.ModePerm)
			continue
		}

		if err := os.MkdirAll(filepath.Dir(filePath), os.ModePerm); err != nil {
			continue
		}

		dstFile, err := os.OpenFile(filePath, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, header.FileInfo().Mode())
		if err != nil {
			continue
		}

		if _, err := io.Copy(dstFile, tarReader); err != nil {
			dstFile.Close()
			continue
		}

		dstFile.Close()
	}

	return FlagResult{true, "Success"}
}

func (a *App) UnzipGZFile(path string, output string) FlagResult {
	log.Printf("UnzipGZFile: %s -> %s", path, output)

	fullPath := GetPath(path)
	outputPath := GetPath(output)

	gzipFile, err := os.Open(fullPath)
	if err != nil {
		return FlagResult{false, err.Error()}
	}
	defer gzipFile.Close()

	outputFile, err := os.Create(outputPath)
	if err != nil {
		return FlagResult{false, err.Error()}
	}
	defer outputFile.Close()

	gzipReader, err := gzip.NewReader(gzipFile)
	if err != nil {
		return FlagResult{false, err.Error()}
	}
	defer gzipReader.Close()

	if _, err := io.Copy(outputFile, gzipReader); err != nil {
		return FlagResult{false, err.Error()}
	}

	return FlagResult{true, "Success"}
}

func (a *App) FileExists(path string) FlagResult {
	log.Printf("FileExists: %s", path)

	path = GetPath(path)

	_, err := os.Stat(path)
	if err == nil {
		return FlagResult{true, "true"}
	}

	if os.IsNotExist(err) {
		return FlagResult{true, "false"}
	}

	return FlagResult{false, err.Error()}
}
