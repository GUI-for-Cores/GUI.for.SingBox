package bridge

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

func getProxy(_proxy string) func(*http.Request) (*url.URL, error) {
	proxy := http.ProxyFromEnvironment

	if _proxy != "" {
		if !strings.HasPrefix(_proxy, "http") {
			_proxy = "http://" + _proxy
		}
		proxyUrl, err := url.Parse(_proxy)
		if err == nil {
			proxy = http.ProxyURL(proxyUrl)
		}
	}

	return proxy
}

func (a *App) HttpGet(url string, headers map[string]string, proxy string) HTTPResult {
	log.Printf("HttpGet: %s %v %v", url, headers, proxy)

	header := make(http.Header)
	header.Set("User-Agent", Config.UserAgent)

	for key, value := range headers {
		header.Set(key, value)
	}

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return HTTPResult{false, nil, err.Error()}
	}

	req.Header = header

	client := &http.Client{
		Timeout: 15 * time.Second,
		Transport: &http.Transport{
			Proxy: getProxy(proxy),
		},
	}

	resp, err := client.Do(req)
	if err != nil {
		return HTTPResult{false, nil, err.Error()}
	}
	defer resp.Body.Close()

	b, err := io.ReadAll(resp.Body)
	if err != nil {
		return HTTPResult{false, nil, err.Error()}
	}

	return HTTPResult{true, resp.Header, string(b)}
}

func (a *App) HttpPost(url string, headers map[string]string, body string, proxy string) HTTPResult {
	log.Printf("HttpPost: %s %v %v", url, headers, body)

	header := make(http.Header)
	header.Set("User-Agent", Config.UserAgent)
	header.Set("Content-Type", "application/json; charset=UTF-8")

	for key, value := range headers {
		header.Set(key, value)
	}

	req, err := http.NewRequest("POST", url, strings.NewReader(body))
	if err != nil {
		return HTTPResult{false, nil, err.Error()}
	}

	req.Header = header

	client := &http.Client{
		Timeout: 15 * time.Second,
		Transport: &http.Transport{
			Proxy: getProxy(proxy),
		},
	}

	resp, err := client.Do(req)
	if err != nil {
		return HTTPResult{false, nil, err.Error()}
	}
	defer resp.Body.Close()

	b, err := io.ReadAll(resp.Body)
	if err != nil {
		return HTTPResult{false, nil, err.Error()}
	}

	return HTTPResult{true, resp.Header, string(b)}
}

func (a *App) Download(url string, path string, event string, proxy string) FlagResult {
	log.Printf("Download: %s %s %s", url, path, proxy)

	path = GetPath(path)

	err := os.MkdirAll(filepath.Dir(path), os.ModePerm)
	if err != nil {
		return FlagResult{false, err.Error()}
	}

	header := make(http.Header)
	header.Set("User-Agent", Config.UserAgent)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return FlagResult{false, err.Error()}
	}

	req.Header = header

	client := &http.Client{
		Timeout: 10 * time.Minute,
		Transport: &http.Transport{
			Proxy: getProxy(proxy),
		},
	}

	resp, err := client.Do(req)
	if err != nil {
		return FlagResult{false, err.Error()}
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return FlagResult{true, fmt.Sprintf("Code: %d", resp.StatusCode)}
	}

	file, err := os.Create(path)
	if err != nil {
		return FlagResult{false, err.Error()}
	}
	defer file.Close()

	reader := io.TeeReader(resp.Body, &DownloadTracker{Total: resp.ContentLength, ProgressChange: event, App: a})

	_, err = io.Copy(file, reader)
	if err != nil {
		return FlagResult{false, err.Error()}
	}

	return FlagResult{true, "Success"}
}

func (dt *DownloadTracker) Write(p []byte) (n int, err error) {
	dt.Progress += int64(len(p))
	if dt.ProgressChange != "" {
		runtime.EventsEmit(dt.App.Ctx, dt.ProgressChange, dt.Progress, dt.Total)
	}
	return
}
