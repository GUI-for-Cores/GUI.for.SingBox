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

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

func NewHTTPRequest(method string, url string, headers map[string]string, body string, options RequestOptions) HTTPResult {
	req, err := http.NewRequest(method, url, strings.NewReader(body))
	if err != nil {
		return HTTPResult{false, 500, nil, err.Error()}
	}

	req.Header = GetHeader(headers)

	client := withRequestOptionsClient(options)

	resp, err := client.Do(req)
	if err != nil {
		return HTTPResult{false, 500, nil, err.Error()}
	}
	defer resp.Body.Close()

	b, err := io.ReadAll(resp.Body)
	if err != nil {
		return HTTPResult{false, 500, nil, err.Error()}
	}

	return HTTPResult{true, resp.StatusCode, resp.Header, string(b)}
}

func (a *App) HttpGet(url string, headers map[string]string, options RequestOptions) HTTPResult {
	log.Printf("HttpGet: %v %v %v", url, headers, options)
	return NewHTTPRequest("GET", url, headers, "", options)
}

func (a *App) HttpPost(url string, headers map[string]string, body string, options RequestOptions) HTTPResult {
	log.Printf("HttpPost: %v %v %v %v", url, headers, body, options)
	return NewHTTPRequest("POST", url, headers, body, options)
}

func (a *App) HttpDelete(url string, headers map[string]string, options RequestOptions) HTTPResult {
	log.Printf("HttpDelete: %v %v %v", url, headers, options)
	return NewHTTPRequest("DELETE", url, headers, "", options)
}

func (a *App) HttpPut(url string, headers map[string]string, body string, options RequestOptions) HTTPResult {
	log.Printf("HttpPut: %v %v %v %v", url, headers, body, options)
	return NewHTTPRequest("PUT", url, headers, body, options)
}

func (a *App) HttpHead(url string, header map[string]string, options RequestOptions) HTTPResult {
	log.Printf("HttpHead: %v %v %v", url, header, options)
	return NewHTTPRequest("HEAD", url, header, "", options)
}

func (a *App) HttpPatch(url string, headers map[string]string, body string, options RequestOptions) HTTPResult {
	log.Printf("HttpPatch: %v %v %v %v", url, headers, body, options)
	return NewHTTPRequest("PATCH", url, headers, body, options)
}

func (a *App) Requests(method string, url string, headers map[string]string, body string, options RequestOptions) HTTPResult {
	log.Printf("Requests: %v %v %v %v %v", method, url, headers, body, options)
	return NewHTTPRequest(method, url, headers, body, options)
}

func (a *App) Download(url string, path string, headers map[string]string, event string, options RequestOptions) HTTPResult {
	log.Printf("Download: %v %v %v, %v", url, path, headers, options)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return HTTPResult{false, 500, nil, err.Error()}
	}

	req.Header = GetHeader(headers)

	client := withRequestOptionsClient(options)

	resp, err := client.Do(req)
	if err != nil {
		return HTTPResult{false, 500, nil, err.Error()}
	}
	defer resp.Body.Close()

	path = GetPath(path)

	err = os.MkdirAll(filepath.Dir(path), os.ModePerm)
	if err != nil {
		return HTTPResult{false, 500, nil, err.Error()}
	}

	file, err := os.Create(path)
	if err != nil {
		return HTTPResult{false, 500, nil, err.Error()}
	}
	defer file.Close()

	reader := io.TeeReader(resp.Body, &WriteTracker{Total: resp.ContentLength, ProgressChange: event, App: a})

	_, err = io.Copy(file, reader)
	if err != nil {
		return HTTPResult{false, 500, nil, err.Error()}
	}

	return HTTPResult{true, resp.StatusCode, resp.Header, "Success"}
}

func (a *App) Upload(url string, path string, headers map[string]string, event string, options RequestOptions) HTTPResult {
	log.Printf("Upload: %v %v %v %v", url, path, headers, options)

	path = GetPath(path)

	file, err := os.Open(path)
	if err != nil {
		return HTTPResult{false, 500, nil, err.Error()}
	}
	defer file.Close()

	fileStat, err := file.Stat()
	if err != nil {
		return HTTPResult{false, 500, nil, err.Error()}
	}

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	part, err := writer.CreateFormFile("file", path)
	if err != nil {
		return HTTPResult{false, 500, nil, err.Error()}
	}

	reader := io.TeeReader(file, &WriteTracker{Total: fileStat.Size(), ProgressChange: event, App: a})

	_, err = io.Copy(part, reader)
	if err != nil {
		return HTTPResult{false, 500, nil, err.Error()}
	}

	err = writer.Close()
	if err != nil {
		return HTTPResult{false, 500, nil, err.Error()}
	}

	req, err := http.NewRequest("POST", url, body)
	if err != nil {
		return HTTPResult{false, 500, nil, err.Error()}
	}

	req.Header = GetHeader(headers)
	req.Header.Set("Content-Type", writer.FormDataContentType())

	client := withRequestOptionsClient(options)

	resp, err := client.Do(req)
	if err != nil {
		return HTTPResult{false, 500, nil, err.Error()}
	}
	defer resp.Body.Close()

	b, err := io.ReadAll(resp.Body)
	if err != nil {
		return HTTPResult{false, 500, nil, err.Error()}
	}

	return HTTPResult{true, resp.StatusCode, resp.Header, string(b)}
}

func (wt *WriteTracker) Write(p []byte) (n int, err error) {
	wt.Progress += int64(len(p))
	if wt.ProgressChange != "" {
		runtime.EventsEmit(wt.App.Ctx, wt.ProgressChange, wt.Progress, wt.Total)
	}
	return
}

func withRequestOptionsClient(options RequestOptions) *http.Client {
	return &http.Client{
		Timeout: GetTimeout(options.Timeout),
		Transport: &http.Transport{
			Proxy: GetProxy(options.Proxy),
			TLSClientConfig: &tls.Config{
				InsecureSkipVerify: options.Insecure,
			},
		},
	}
}
