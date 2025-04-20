package bridge

import (
	"bytes"
	"context"
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

func (a *App) Requests(method string, url string, headers map[string]string, body string, options RequestOptions) HTTPResult {
	log.Printf("Requests: %v %v %v %v %v", method, url, headers, body, options)

	client, ctx, cancel := withRequestOptionsClient(options)

	req, err := http.NewRequestWithContext(ctx, method, url, strings.NewReader(body))
	if err != nil {
		return HTTPResult{false, 500, nil, err.Error()}
	}

	req.Header = GetHeader(headers)

	runtime.EventsOn(a.Ctx, options.CancelId, func(data ...any) {
		log.Printf("Requests Canceled: %v %v", method, url)
		cancel()
	})
	defer runtime.EventsOff(a.Ctx, options.CancelId)

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

func (a *App) Download(url string, path string, headers map[string]string, event string, options RequestOptions) HTTPResult {
	log.Printf("Download: %v %v %v, %v", url, path, headers, options)

	client, ctx, cancel := withRequestOptionsClient(options)

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return HTTPResult{false, 500, nil, err.Error()}
	}

	req.Header = GetHeader(headers)

	runtime.EventsOn(a.Ctx, options.CancelId, func(data ...any) {
		log.Printf("Download Canceled: %v %v", url, path)
		cancel()
	})
	defer runtime.EventsOff(a.Ctx, options.CancelId)

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

	reader := io.TeeReader(resp.Body, &WriteTracker{
		Total:          resp.ContentLength,
		EmitThreshold:  128 * 1024, // 128KB
		ProgressChange: event,
		App:            a,
	})

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

	part, err := writer.CreateFormFile(options.FileField, path)
	if err != nil {
		return HTTPResult{false, 500, nil, err.Error()}
	}

	reader := io.TeeReader(file, &WriteTracker{
		Total:          fileStat.Size(),
		EmitThreshold:  128 * 1024, // 128KB
		ProgressChange: event,
		App:            a,
	})

	_, err = io.Copy(part, reader)
	if err != nil {
		return HTTPResult{false, 500, nil, err.Error()}
	}

	err = writer.Close()
	if err != nil {
		return HTTPResult{false, 500, nil, err.Error()}
	}

	client, ctx, cancel := withRequestOptionsClient(options)

	runtime.EventsOn(a.Ctx, options.CancelId, func(data ...any) {
		log.Printf("Upload Canceled: %v %v", url, path)
		cancel()
	})
	defer runtime.EventsOff(a.Ctx, options.CancelId)

	req, err := http.NewRequestWithContext(ctx, "POST", url, body)
	if err != nil {
		return HTTPResult{false, 500, nil, err.Error()}
	}

	req.Header = GetHeader(headers)
	req.Header.Set("Content-Type", writer.FormDataContentType())

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
	n = len(p)
	wt.Progress += int64(n)

	if wt.ProgressChange == "" {
		return n, nil
	}

	shouldEmit := wt.Total <= 0 || wt.Progress-wt.LastEmitted >= wt.EmitThreshold || wt.Progress == wt.Total
	if shouldEmit {
		runtime.EventsEmit(wt.App.Ctx, wt.ProgressChange, wt.Progress, wt.Total)
		wt.LastEmitted = wt.Progress
	}

	return n, nil
}

func withRequestOptionsClient(options RequestOptions) (*http.Client, context.Context, context.CancelFunc) {
	client := &http.Client{
		Timeout: GetTimeout(options.Timeout),
		Transport: &http.Transport{
			Proxy: GetProxy(options.Proxy),
			TLSClientConfig: &tls.Config{
				InsecureSkipVerify: options.Insecure,
			},
		},
	}

	ctx, cancel := context.WithCancel(context.Background())

	return client, ctx, cancel
}
