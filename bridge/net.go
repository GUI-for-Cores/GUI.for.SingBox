package bridge

import (
	"bufio"
	"context"
	"crypto/sha256"
	"fmt"
	"hash"
	"io"
	"log"
	"mime/multipart"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

func (a *App) Requests(method string, url string, headers map[string]string, body string, options RequestOptions) HTTPResult {
	log.Printf("Requests: %v %v %v %v %v", method, url, headers, body, options)

	client, ctx, cancel := withRequestOptionsClient(options)
	defer cancel()

	var headerTimeout *time.Timer
	if options.Stream != "" {
		client.Timeout = 0
		headerTimeout = time.AfterFunc(requestTimeout(options.Timeout), cancel)
	}

	req, err := http.NewRequestWithContext(ctx, method, url, strings.NewReader(body))
	if err != nil {
		return HTTPResult{false, 500, nil, err.Error()}
	}

	req.Header = requestHeaders(headers)
	if options.Stream != "" && req.Header.Get("Accept") == "" {
		req.Header.Set("Accept", "text/event-stream")
	}

	if options.CancelId != "" {
		runtime.EventsOn(a.Ctx, options.CancelId, func(data ...any) {
			log.Printf("Requests Canceled: %v %v", method, url)
			cancel()
		})
		defer runtime.EventsOff(a.Ctx, options.CancelId)
	}

	resp, err := client.Do(req)
	if headerTimeout != nil {
		headerTimeout.Stop()
	}
	if err != nil {
		return HTTPResult{false, 500, nil, err.Error()}
	}
	defer resp.Body.Close()

	if options.Stream != "" && strings.Contains(strings.ToLower(resp.Header.Get("Content-Type")), "text/event-stream") {
		runtime.EventsEmit(a.Ctx, options.Stream, map[string]any{
			"type":    "response",
			"status":  resp.StatusCode,
			"headers": resp.Header,
		})

		scanner := bufio.NewScanner(resp.Body)
		scanner.Buffer(make([]byte, 0, 64*1024), 10*1024*1024)

		firstLine := true
		eventName := ""
		dataLines := []string{}
		lastID := ""
		var retry *int

		dispatch := func() {
			defer func() {
				eventName = ""
				dataLines = nil
				retry = nil
			}()

			if len(dataLines) == 0 {
				return
			}

			if eventName == "" {
				eventName = "message"
			}

			payload := map[string]any{
				"type":  "message",
				"event": eventName,
				"data":  strings.Join(dataLines, "\n"),
			}
			if lastID != "" {
				payload["id"] = lastID
			}
			if retry != nil {
				payload["retry"] = *retry
			}
			runtime.EventsEmit(a.Ctx, options.Stream, payload)
		}

		for scanner.Scan() {
			line := strings.TrimSuffix(scanner.Text(), "\r")
			if firstLine {
				line = strings.TrimPrefix(line, "\xef\xbb\xbf")
				firstLine = false
			}

			if line == "" {
				dispatch()
				continue
			}

			if strings.HasPrefix(line, ":") {
				continue
			}

			field, value, found := strings.Cut(line, ":")
			if !found {
				value = ""
			} else {
				value = strings.TrimPrefix(value, " ")
			}

			switch field {
			case "event":
				eventName = value
			case "data":
				dataLines = append(dataLines, value)
			case "id":
				if !strings.Contains(value, "\x00") {
					lastID = value
				}
			case "retry":
				retryValue, err := strconv.Atoi(value)
				if err == nil && retryValue >= 0 {
					retry = &retryValue
				}
			}
		}

		if err := scanner.Err(); err != nil {
			runtime.EventsEmit(a.Ctx, options.Stream, map[string]any{
				"type":  "error",
				"error": err.Error(),
			})
			return HTTPResult{false, resp.StatusCode, resp.Header, err.Error()}
		}

		dispatch()
		runtime.EventsEmit(a.Ctx, options.Stream, map[string]any{"type": "done"})
		return HTTPResult{true, resp.StatusCode, resp.Header, ""}
	}

	var bodyTimeout *time.Timer
	if options.Stream != "" {
		bodyTimeout = time.AfterFunc(requestTimeout(options.Timeout), cancel)
		defer bodyTimeout.Stop()
	}

	b, err := io.ReadAll(resp.Body)
	if err != nil {
		return HTTPResult{false, 500, nil, err.Error()}
	}

	return HTTPResult{true, resp.StatusCode, resp.Header, string(b)}
}

func (a *App) TcpPing(address string, options NetOptions) FlagResult {
	log.Printf("TcpPing: %s %v", address, options)

	start := time.Now()
	conn, err := net.DialTimeout("tcp", address, requestTimeout(options.Timeout))
	latency := time.Since(start).Milliseconds()
	if err != nil {
		return FlagResult{false, err.Error()}
	}
	defer conn.Close()

	return FlagResult{true, strconv.FormatInt(latency, 10)}
}

func (a *App) TcpRequest(address string, payload string, options NetOptions) FlagResult {
	log.Printf("TcpRequest: %s %v", address, options)

	body, err := netPayloadBytes(payload, options)
	if err != nil {
		return FlagResult{false, err.Error()}
	}

	conn, err := net.DialTimeout("tcp", address, requestTimeout(options.Timeout))
	if err != nil {
		return FlagResult{false, err.Error()}
	}
	defer conn.Close()

	if err := conn.SetDeadline(time.Now().Add(requestTimeout(options.Timeout))); err != nil {
		return FlagResult{false, err.Error()}
	}

	if len(body) > 0 {
		_, err = conn.Write(body)
		if err != nil {
			return FlagResult{false, err.Error()}
		}
		if tcpConn, ok := conn.(*net.TCPConn); ok {
			_ = tcpConn.CloseWrite()
		}
	}

	resp, err := io.ReadAll(conn)
	if err != nil {
		if netErr, ok := err.(net.Error); !ok || !netErr.Timeout() || len(resp) == 0 {
			return FlagResult{false, err.Error()}
		}
	}

	return FlagResult{true, netPayloadString(resp, options)}
}

func (a *App) UdpRequest(address string, payload string, options NetOptions) FlagResult {
	log.Printf("UdpRequest: %s %v", address, options)

	body, err := netPayloadBytes(payload, options)
	if err != nil {
		return FlagResult{false, err.Error()}
	}

	conn, err := net.DialTimeout("udp", address, requestTimeout(options.Timeout))
	if err != nil {
		return FlagResult{false, err.Error()}
	}
	defer conn.Close()

	if err := conn.SetDeadline(time.Now().Add(requestTimeout(options.Timeout))); err != nil {
		return FlagResult{false, err.Error()}
	}

	_, err = conn.Write(body)
	if err != nil {
		return FlagResult{false, err.Error()}
	}

	buf := make([]byte, 65535)
	n, err := conn.Read(buf)
	if err != nil {
		return FlagResult{false, err.Error()}
	}

	return FlagResult{true, netPayloadString(buf[:n], options)}
}

func (a *App) Download(method string, url string, path string, headers map[string]string, event string, options RequestOptions) HTTPResult {
	log.Printf("Download: %s %s %s %v %s %v", method, url, path, headers, event, options)

	client, ctx, cancel := withRequestOptionsClient(options)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, method, url, nil)
	if err != nil {
		return HTTPResult{false, 500, nil, err.Error()}
	}

	req.Header = requestHeaders(headers)

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

	path = resolvePath(path)

	err = os.MkdirAll(filepath.Dir(path), os.ModePerm)
	if err != nil {
		return HTTPResult{false, 500, nil, err.Error()}
	}

	file, err := os.Create(path)
	if err != nil {
		return HTTPResult{false, 500, nil, err.Error()}
	}

	reader := wrapWithProgress(resp.Body, resp.ContentLength, event, a)
	writer := io.Writer(file)

	var hash hash.Hash
	if options.Sha256 != "" {
		hash = sha256.New()
		writer = io.MultiWriter(file, hash)
	}

	_, err = io.Copy(writer, reader)
	if err != nil {
		file.Close()
		return HTTPResult{false, 500, nil, err.Error()}
	}
	if err := file.Close(); err != nil {
		return HTTPResult{false, 500, nil, err.Error()}
	}

	if options.Sha256 != "" {
		actual := fmt.Sprintf("%x", hash.Sum(nil))
		if actual != options.Sha256 {
			_ = os.Remove(path)
			return HTTPResult{false, 500, nil, fmt.Sprintf("SHA256 mismatch: %s, expected %s, got %s", filepath.Base(path), options.Sha256, actual)}
		}
	}

	return HTTPResult{true, resp.StatusCode, resp.Header, "Success"}
}

func (a *App) Upload(method string, url string, path string, headers map[string]string, event string, options RequestOptions) HTTPResult {
	log.Printf("Upload: %s %s %s %v %s %v", method, url, path, headers, event, options)

	path = resolvePath(path)

	file, err := os.Open(path)
	if err != nil {
		return HTTPResult{false, 500, nil, err.Error()}
	}

	fileStat, err := file.Stat()
	if err != nil {
		file.Close()
		return HTTPResult{false, 500, nil, err.Error()}
	}

	bodyReader, bodyWriter := io.Pipe()
	writer := multipart.NewWriter(bodyWriter)
	copyErr := make(chan error, 1)

	go func() {
		defer file.Close()

		part, err := writer.CreateFormFile(options.FileField, filepath.Base(path))
		if err == nil {
			_, err = io.Copy(part, wrapWithProgress(file, fileStat.Size(), event, a))
		}
		if closeErr := writer.Close(); err == nil {
			err = closeErr
		}
		if err != nil {
			_ = bodyWriter.CloseWithError(err)
		} else {
			_ = bodyWriter.Close()
		}
		copyErr <- err
	}()

	client, ctx, cancel := withRequestOptionsClient(options)
	defer cancel()

	if options.CancelId != "" {
		runtime.EventsOn(a.Ctx, options.CancelId, func(data ...any) {
			log.Printf("Upload Canceled: %v %v", url, path)
			cancel()
		})
		defer runtime.EventsOff(a.Ctx, options.CancelId)
	}

	req, err := http.NewRequestWithContext(ctx, method, url, bodyReader)
	if err != nil {
		_ = bodyReader.CloseWithError(err)
		<-copyErr
		return HTTPResult{false, 500, nil, err.Error()}
	}

	req.Header = requestHeaders(headers)
	req.Header.Set("Content-Type", writer.FormDataContentType())

	resp, err := client.Do(req)
	if err != nil {
		_ = bodyReader.CloseWithError(err)
		<-copyErr
		return HTTPResult{false, 500, nil, err.Error()}
	}
	defer resp.Body.Close()

	if err := <-copyErr; err != nil {
		return HTTPResult{false, 500, nil, err.Error()}
	}

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
		Timeout:   requestTimeout(options.Timeout),
		Transport: requestTransport(options),
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
