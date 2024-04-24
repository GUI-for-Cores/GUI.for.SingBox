package bridge

import (
	"bytes"
	"crypto/tls"
	"io"
	"log"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

func NewHTTPRequest(method string, url string, headers map[string]string, body string, options RequestOptions) HTTPResult {
	req, err := http.NewRequest(method, url, strings.NewReader(body))
	if err != nil {
		return HTTPResult{false, nil, err.Error()}
	}

	header := make(http.Header)

	for key, value := range headers {
		header.Set(key, value)
	}

	req.Header = header

	client := &http.Client{
		Timeout: 15 * time.Second,
		Transport: &http.Transport{
			Proxy: GetProxy(options.Proxy),
			TLSClientConfig: &tls.Config{
				InsecureSkipVerify: options.Insecure,
			},
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

func (a *App) HttpGet(url string, header map[string]string, options RequestOptions) HTTPResult {
	log.Printf("HttpGet: %s %v %v", url, header, options)
	return NewHTTPRequest("GET", url, header, "", options)
}

func (a *App) HttpPost(url string, header map[string]string, body string, options RequestOptions) HTTPResult {
	log.Printf("HttpPost: %s %v %v", url, header, body)
	return NewHTTPRequest("POST", url, header, body, options)
}

func (a *App) HttpDelete(url string, header map[string]string, options RequestOptions) HTTPResult {
	log.Printf("HttpDelete: %s %v", url, header)
	return NewHTTPRequest("DELETE", url, header, "", options)
}

func (a *App) HttpPut(url string, header map[string]string, body string, options RequestOptions) HTTPResult {
	log.Printf("HttpPut: %s %v %v", url, header, body)
	return NewHTTPRequest("PUT", url, header, body, options)
}

func (a *App) Download(url string, path string, headers map[string]string, event string, options RequestOptions) HTTPResult {
	log.Printf("Download: %s %s %v, %v", url, path, headers, options)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return HTTPResult{false, nil, err.Error()}
	}

	header := make(http.Header)

	req.Header = header

	client := &http.Client{
		Timeout: 10 * time.Minute,
		Transport: &http.Transport{
			Proxy: GetProxy(options.Proxy),
			TLSClientConfig: &tls.Config{
				InsecureSkipVerify: options.Insecure,
			},
		},
	}

	resp, err := client.Do(req)
	if err != nil {
		return HTTPResult{false, nil, err.Error()}
	}
	defer resp.Body.Close()

	path = GetPath(path)

	err = os.MkdirAll(filepath.Dir(path), os.ModePerm)
	if err != nil {
		return HTTPResult{false, nil, err.Error()}
	}

	file, err := os.Create(path)
	if err != nil {
		return HTTPResult{false, nil, err.Error()}
	}
	defer file.Close()

	reader := io.TeeReader(resp.Body, &WriteTracker{Total: resp.ContentLength, ProgressChange: event, App: a})

	_, err = io.Copy(file, reader)
	if err != nil {
		return HTTPResult{false, nil, err.Error()}
	}

	return HTTPResult{true, resp.Header, "Success"}
}

func (a *App) Upload(url string, path string, headers map[string]string, event string, options RequestOptions) HTTPResult {
	log.Printf("Upload: %s %s %v %v", url, path, headers, options)

	path = GetPath(path)

	file, err := os.Open(path)
	if err != nil {
		return HTTPResult{false, nil, err.Error()}
	}
	defer file.Close()

	fileStat, err := file.Stat()
	if err != nil {
		return HTTPResult{false, nil, err.Error()}
	}

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	part, err := writer.CreateFormFile("file", path)
	if err != nil {
		return HTTPResult{false, nil, err.Error()}
	}

	reader := io.TeeReader(file, &WriteTracker{Total: fileStat.Size(), ProgressChange: event, App: a})

	_, err = io.Copy(part, reader)
	if err != nil {
		return HTTPResult{false, nil, err.Error()}
	}

	err = writer.Close()
	if err != nil {
		return HTTPResult{false, nil, err.Error()}
	}

	req, err := http.NewRequest("POST", url, body)
	if err != nil {
		return HTTPResult{false, nil, err.Error()}
	}

	header := make(http.Header)

	for key, value := range headers {
		header.Set(key, value)
	}

	req.Header = header
	req.Header.Set("Content-Type", writer.FormDataContentType())

	client := &http.Client{
		Timeout: 10 * time.Minute,
		Transport: &http.Transport{
			Proxy: GetProxy(options.Proxy),
			TLSClientConfig: &tls.Config{
				InsecureSkipVerify: options.Insecure,
			},
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

func (wt *WriteTracker) Write(p []byte) (n int, err error) {
	wt.Progress += int64(len(p))
	if wt.ProgressChange != "" {
		runtime.EventsEmit(wt.App.Ctx, wt.ProgressChange, wt.Progress, wt.Total)
	}
	return
}
