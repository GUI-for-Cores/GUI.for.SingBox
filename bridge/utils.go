package bridge

import (
	"log"
	"net/http"
	"net/url"
	"os"
	"path"
	"path/filepath"
	"time"

	"golang.org/x/text/encoding/simplifiedchinese"
)

func GetPath(path string) string {
	if !filepath.IsAbs(path) {
		path = filepath.Join(Env.BasePath, path)
	}
	return filepath.Clean(path)
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

func GetTimeout(_timeout int) time.Duration {
	if _timeout == 0 {
		return time.Second * 15
	}
	return time.Second * time.Duration(_timeout)
}

func GetHeader(headers map[string]string) http.Header {
	header := make(http.Header)
	for key, value := range headers {
		header.Set(key, value)
	}
	return header
}

func ConvertByte2String(byte []byte) string {
	decodeBytes, _ := simplifiedchinese.GB18030.NewDecoder().Bytes(byte)
	return string(decodeBytes)
}

func RollingRelease(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !Config.RollingRelease {
			next.ServeHTTP(w, r)
			return
		}

		url := r.URL.Path
		if url == "/" {
			url = "/index.html"
		}

		log.Printf("[Rolling Release] %v %v\n", r.Method, url)

		file := GetPath("data/rolling-release" + url)

		bytes, err := os.ReadFile(file)
		if err != nil {
			next.ServeHTTP(w, r)
			return
		}

		ext := path.Ext(url)
		mime := "application/octet-stream"

		switch ext {
		case ".html":
			mime = "text/html"
		case ".ico":
			mime = "image/x-icon"
		case ".png":
			mime = "image/png"
		case ".css":
			mime = "text/css"
		case ".js":
			mime = "text/javascript"
		}

		w.Header().Set("Content-Type", mime)
		w.Write(bytes)
	})
}
