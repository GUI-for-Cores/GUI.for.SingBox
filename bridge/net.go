package bridge

import (
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

func CreateHttpClient(a *App) *http.Client {
	systemProxy := a.GetSystemProxy()
	if systemProxy.Flag && len(systemProxy.Data) > 0 {
		if !strings.HasPrefix(systemProxy.Data, "http") {
			systemProxy.Data = "http://" + systemProxy.Data
		}
		proxyUrl, err := url.Parse(systemProxy.Data)
		if err == nil {
			return &http.Client{
				Timeout: 15 * time.Second,
				Transport: &http.Transport{
					Proxy: http.ProxyURL(proxyUrl),
				},
			}
		}
	}

	return &http.Client{
		Timeout: 15 * time.Second,
		Transport: &http.Transport{
			Proxy: http.ProxyFromEnvironment,
		},
	}
}

func (a *App) HttpGet(url string, headers map[string]string) HTTPResult {
	fmt.Println("HttpGet:", url, headers)

	client := CreateHttpClient(a)

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

func (a *App) Download(url string, path string, event string) FlagResult {
	fmt.Println("Download:", url, path)

	path, err := GetPath(path)
	if err != nil {
		return FlagResult{false, err.Error()}
	}

	err = os.MkdirAll(filepath.Dir(path), os.ModePerm)
	if err != nil {
		return FlagResult{false, err.Error()}
	}

	client := CreateHttpClient(a)

	header := make(http.Header)
	header.Set("User-Agent", Config.UserAgent)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return FlagResult{false, err.Error()}
	}

	req.Header = header

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
