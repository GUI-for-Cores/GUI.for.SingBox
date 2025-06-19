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

	if options.CancelId != "" {
		runtime.EventsOn(a.Ctx, options.CancelId, func(data ...any) {
			log.Printf("Requests Canceled: %v %v", method, url)
			cancel()
		})
		defer runtime.EventsOff(a.Ctx, options.CancelId)
	}

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

func (a *App) Download(method string, url string, path string, headers map[string]string, event string, options RequestOptions) HTTPResult {
	log.Printf("Download: %s %s %s %v %s %v", method, url, path, headers, event, options)

	client, ctx, cancel := withRequestOptionsClient(options)

	req, err := http.NewRequestWithContext(ctx, method, url, nil)
	if err != nil {
		return HTTPResult{false, 500, nil, err.Error()}
	}

	req.Header = GetHeader(headers)

	if options.CancelId != "" {
		runtime.EventsOn(a.Ctx, options.CancelId, func(data ...any) {
			log.Printf("Download Canceled: %v %v", url, path)
			cancel()
		})
		defer runtime.EventsOff(a.Ctx, options.CancelId)
	}

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

	reader := wrapWithProgress(resp.Body, resp.ContentLength, event, a)

	_, err = io.Copy(file, reader)
	if err != nil {
		return HTTPResult{false, 500, nil, err.Error()}
	}

	return HTTPResult{true, resp.StatusCode, resp.Header, "Success"}
}

func (a *App) Upload(method string, url string, path string, headers map[string]string, event string, options RequestOptions) HTTPResult {
	log.Printf("Upload: %s %s %s %v %s %v", method, url, path, headers, event, options)

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

	reader := wrapWithProgress(file, fileStat.Size(), event, a)

	_, err = io.Copy(part, reader)
	if err != nil {
		return HTTPResult{false, 500, nil, err.Error()}
	}

	err = writer.Close()
	if err != nil {
		return HTTPResult{false, 500, nil, err.Error()}
	}

	client, ctx, cancel := withRequestOptionsClient(options)

	if options.CancelId != "" {
		runtime.EventsOn(a.Ctx, options.CancelId, func(data ...any) {
			log.Printf("Upload Canceled: %v %v", url, path)
			cancel()
		})
		defer runtime.EventsOff(a.Ctx, options.CancelId)
	}

	req, err := http.NewRequestWithContext(ctx, method, url, body)
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

	shouldEmit := wt.Total <= 0 || wt.Progress-wt.LastEmitted >= wt.EmitThreshold || wt.Progress == wt.Total
	if shouldEmit {
		runtime.EventsEmit(wt.App.Ctx, wt.ProgressChange, wt.Progress, wt.Total)
		wt.LastEmitted = wt.Progress
	}

	return n, nil
}

func wrapWithProgress(r io.Reader, size int64, event string, a *App) io.Reader {
	if event == "" {
		return r
	}
	return io.TeeReader(r, &WriteTracker{
		Total:          size,
		EmitThreshold:  128 * 1024,
		ProgressChange: event,
		App:            a,
	})
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
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			if !options.Redirect {
				return http.ErrUseLastResponse
			}
			return nil
		},
	}

	ctx, cancel := context.WithCancel(context.Background())

	return client, ctx, cancel
}
