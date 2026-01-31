package bridge

import (
	"errors"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"golang.org/x/text/encoding/simplifiedchinese"
)

func GetPath(path string) string {
	if !filepath.IsAbs(path) {
		path = filepath.Join(Env.BasePath, path)
	}
	return filepath.ToSlash(filepath.Clean(path))
}

func GetProxy(_proxy string) func(*http.Request) (*url.URL, error) {
	proxy := http.ProxyFromEnvironment

	if _proxy != "" {
		proxyUrl, err := url.Parse(_proxy)
		if err == nil {
			proxy = http.ProxyURL(proxyUrl)
		}
	}

	return proxy
}

func GetTimeout(timeout int) time.Duration {
	if timeout <= 0 {
		return 15 * time.Second
	}
	return time.Duration(timeout) * time.Second
}

func GetHeader(headers map[string]string) http.Header {
	header := make(http.Header, len(headers))
	for key, value := range headers {
		header.Set(key, value)
	}
	return header
}

func ConvertByte2String(byte []byte) string {
	decodeBytes, _ := simplifiedchinese.GB18030.NewDecoder().Bytes(byte)
	return string(decodeBytes)
}

func ParseRange(s string, size int64) (start int64, end int64, err error) {
	if s == "" {
		return 0, size - 1, nil
	}

	s = strings.TrimSpace(s)

	// "bytes=100-200"
	s = strings.TrimPrefix(s, "bytes=")

	parts := strings.SplitN(s, "-", 2)
	if len(parts) != 2 {
		return 0, 0, errors.New("invalid range format")
	}

	startStr := strings.TrimSpace(parts[0])
	endStr := strings.TrimSpace(parts[1])

	// "-200" last 200 bytes
	if startStr == "" && endStr != "" {
		e, err2 := strconv.ParseInt(endStr, 10, 64)
		if err2 != nil || e < 0 {
			return 0, 0, errors.New("invalid range value")
		}
		if e > size {
			start = 0
		} else {
			start = size - e
		}
		end = size - 1
		return start, end, nil
	}

	// "100-" from start to EOF
	if startStr != "" && endStr == "" {
		start, err = strconv.ParseInt(startStr, 10, 64)
		if err != nil || start < 0 {
			return 0, 0, errors.New("invalid range value")
		}
		end = size - 1
		return start, end, nil
	}

	// "100-200"
	if startStr != "" && endStr != "" {
		start, err = strconv.ParseInt(startStr, 10, 64)
		if err != nil || start < 0 {
			return 0, 0, errors.New("invalid range value")
		}
		end, err = strconv.ParseInt(endStr, 10, 64)
		if err != nil || end < 0 {
			return 0, 0, errors.New("invalid range value")
		}
		if start > end {
			return 0, 0, errors.New("invalid range: start > end")
		}
		if end >= size {
			end = size - 1
		}
		return start, end, nil
	}

	return 0, 0, errors.New("invalid range format")
}

func RollingRelease(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		url := r.URL.Path
		isIndex := url == "/"

		if isIndex {
			w.Header().Set("Cache-Control", "no-cache")
		} else {
			w.Header().Set("Cache-Control", "max-age=31536000, immutable")
		}

		if !Config.RollingRelease {
			next.ServeHTTP(w, r)
			return
		}

		if isIndex {
			url = "/index.html"
		}

		filePath := GetPath("data/rolling-release" + url)
		if _, err := os.Stat(filePath); err != nil {
			next.ServeHTTP(w, r)
			return
		}

		http.ServeFile(w, r, filePath)
	})
}
