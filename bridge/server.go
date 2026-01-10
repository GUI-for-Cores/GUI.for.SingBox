package bridge

import (
	"context"
	"crypto/tls"
	"encoding/base64"
	"encoding/json"
	"io"
	"log"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

var requestCounter uint64
var serverMap sync.Map

type ResponseData struct {
	Status  int
	Headers map[string]string
	Body    string
}

func (a *App) StartServer(address string, serverID string, options ServerOptions) FlagResult {
	log.Printf("StartServer: %s %s %v", address, serverID, options)

	mux := http.NewServeMux()

	if options.StaticPath != "" && options.StaticRoute != "" {
		static := GetPath(options.StaticPath)
		fs := http.StripPrefix(options.StaticRoute, http.FileServer(http.Dir(static)))

		mux.HandleFunc(options.StaticRoute, func(w http.ResponseWriter, r *http.Request) {
			handleFileDownload(w, r, fs, options.StaticHeaders)
		})
	}

	if options.UploadPath != "" && options.UploadRoute != "" {
		uploadPath := GetPath(options.UploadPath)
		if err := os.MkdirAll(uploadPath, os.ModePerm); err != nil {
			return FlagResult{false, "Failed to create upload directory: " + err.Error()}
		}

		maxUploadSize := options.MaxUploadSize
		if maxUploadSize <= 0 {
			maxUploadSize = 50 * 1024 * 1024 // 50MB
		}

		mux.HandleFunc(options.UploadRoute, func(w http.ResponseWriter, r *http.Request) {
			handleFileUpload(w, r, uploadPath, maxUploadSize, options.UploadHeaders)
		})
	}

	var listener net.Listener
	if options.Cert != "" && options.Key != "" {
		cert, err := tls.LoadX509KeyPair(GetPath(options.Cert), GetPath(options.Key))
		if err != nil {
			return FlagResult{false, "Failed to load TLS cert: " + err.Error()}
		}
		tlsConfig := &tls.Config{Certificates: []tls.Certificate{cert}}
		ln, err := net.Listen("tcp", address)
		if err != nil {
			return FlagResult{false, "Failed to bind address: " + err.Error()}
		}
		listener = tls.NewListener(ln, tlsConfig)
	} else {
		ln, err := net.Listen("tcp", address)
		if err != nil {
			return FlagResult{false, "Failed to bind address: " + err.Error()}
		}
		listener = ln
	}

	mux.HandleFunc("/", handleHttpRequest(a, serverID))

	server := &http.Server{
		Addr:    address,
		Handler: mux,
	}

	go func() {
		if err := server.Serve(listener); err != nil && err != http.ErrServerClosed {
			log.Printf("Server error on %s: %v", address, err)
		}
	}()

	serverMap.Store(serverID, server)
	return FlagResult{true, "Success"}
}

func (a *App) StopServer(id string) FlagResult {
	log.Printf("StopServer: %s", id)

	val, ok := serverMap.Load(id)
	if !ok {
		return FlagResult{false, "server not found"}
	}

	server, ok := val.(*http.Server)
	if !ok {
		return FlagResult{false, "invalid server type"}
	}

	err := server.Close()
	if err != nil {
		return FlagResult{false, err.Error()}
	}

	serverMap.Delete(id)

	return FlagResult{true, "Success"}
}

func (a *App) ListServer() FlagResult {
	log.Printf("ListServer")

	var servers []string

	serverMap.Range(func(key, value any) bool {
		serverID, ok := key.(string)
		if ok {
			servers = append(servers, serverID)
		}
		return true
	})

	return FlagResult{true, strings.Join(servers, "|")}
}

func handleHttpRequest(a *App, serverID string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		r.Body = http.MaxBytesReader(w, r.Body, 20*1024*1024) // 20MB
		body, err := io.ReadAll(r.Body)
		if err != nil {
			http.Error(w, "Failed to read request body: "+err.Error(), 500)
			return
		}

		count := atomic.AddUint64(&requestCounter, 1)
		requestID := serverID + strconv.FormatUint(count, 10)
		respChan := make(chan ResponseData, 1)

		ctx, cancel := context.WithTimeout(a.Ctx, 60*time.Second) // 60s
		defer cancel()

		runtime.EventsOn(ctx, requestID, func(data ...any) {
			defer runtime.EventsOff(ctx, requestID)
			resp := buildResponse(data)
			respChan <- resp
		})

		runtime.EventsEmit(a.Ctx, serverID, requestID, r.Method, r.URL.RequestURI(), r.Header, body)

		select {
		case res := <-respChan:
			for k, v := range res.Headers {
				w.Header().Set(k, v)
			}
			w.WriteHeader(res.Status)
			w.Write([]byte(res.Body))
		case <-ctx.Done():
			http.Error(w, "Request timed out", http.StatusGatewayTimeout)
		}
	}
}

func buildResponse(data []any) ResponseData {
	resp := ResponseData{Status: 200, Headers: make(map[string]string), Body: "A sample http server"}
	if len(data) >= 4 {
		if status, ok := data[0].(float64); ok {
			resp.Status = int(status)
		}
		if headers, ok := data[1].(string); ok {
			json.Unmarshal([]byte(headers), &resp.Headers)
		}
		if body, ok := data[2].(string); ok {
			resp.Body = body
		}
		if optionsStr, ok := data[3].(string); ok {
			var ioOptions IOOptions
			json.Unmarshal([]byte(optionsStr), &ioOptions)
			if ioOptions.Mode == Binary {
				decoded, err := base64.StdEncoding.DecodeString(resp.Body)
				if err != nil {
					resp.Status = 500
					resp.Body = err.Error()
				} else {
					resp.Body = string(decoded)
				}
			}
		}
	}
	return resp
}

func handleFileDownload(w http.ResponseWriter, r *http.Request, fs http.Handler, headers map[string]string) {
	for key, value := range headers {
		w.Header().Set(key, value)
	}
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}
	fs.ServeHTTP(w, r)
}

func handleFileUpload(w http.ResponseWriter, r *http.Request, uploadPath string, maxUploadSize int64, headers map[string]string) {
	for key, value := range headers {
		w.Header().Set(key, value)
	}
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}
	if r.Method != http.MethodPost && r.Method != http.MethodPut {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}

	r.Body = http.MaxBytesReader(w, r.Body, maxUploadSize)

	contentType := r.Header.Get("Content-Type")

	if strings.HasPrefix(contentType, "multipart/form-data") {
		handleMultipartUpload(w, r, uploadPath)
	} else {
		handleRawUpload(w, r, uploadPath)
	}
}

func handleMultipartUpload(w http.ResponseWriter, r *http.Request, uploadPath string) {
	reader, err := r.MultipartReader()
	if err != nil {
		http.Error(w, "Invalid multipart form: "+err.Error(), http.StatusBadRequest)
		return
	}

	for {
		part, err := reader.NextPart()
		if err == io.EOF {
			break
		}
		if err != nil {
			http.Error(w, "Error reading upload stream: "+err.Error(), http.StatusInternalServerError)
			return
		}
		if part.FileName() == "" {
			part.Close()
			continue
		}

		dst, err := os.Create(filepath.Join(uploadPath, filepath.Base(part.FileName())))
		if err != nil {
			http.Error(w, "Error creating file: "+err.Error(), http.StatusInternalServerError)
			return
		}

		if _, err = io.Copy(dst, part); err != nil {
			dst.Close()
			part.Close()
			http.Error(w, "Error saving file: "+err.Error(), http.StatusInternalServerError)
			return
		}

		dst.Close()
		part.Close()
	}

	w.Write([]byte("File uploaded successfully"))
}

func handleRawUpload(w http.ResponseWriter, r *http.Request, uploadPath string) {
	name := r.Header.Get("X-Filename")
	if name == "" {
		http.Error(w, "Missing X-Filename", 400)
		return
	}

	dst, err := os.Create(filepath.Join(uploadPath, filepath.Base(name)))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer dst.Close()

	if _, err := io.Copy(dst, r.Body); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Write([]byte("File uploaded successfully"))
}
