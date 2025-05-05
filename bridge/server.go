package bridge

import (
	"encoding/base64"
	"encoding/json"
	"io"
	"log"
	"net/http"
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
	log.Printf("StartServer: %s", address)

	server := &http.Server{
		Addr:    address,
		Handler: a.httpHandler(serverID),
	}

	var result error

	go func() {
		var err error
		if options.Cert != "" && options.Key != "" {
			err = server.ListenAndServeTLS(GetPath(options.Cert), GetPath(options.Key))
		} else {
			err = server.ListenAndServe()
		}
		if err != nil {
			result = err
		}
	}()

	time.Sleep(1 * time.Second)

	if result != nil {
		return FlagResult{false, result.Error()}
	}

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

func (a *App) httpHandler(serverID string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		body, err := io.ReadAll(r.Body)
		if err != nil {
			w.WriteHeader(500)
			log.Printf("reading body error: %v", err)
			return
		}

		count := atomic.AddUint64(&requestCounter, 1)
		requestID := serverID + strconv.FormatUint(count, 10)
		respChan := make(chan ResponseData, 1)

		defer close(respChan)

		runtime.EventsOn(a.Ctx, requestID, func(data ...any) {
			runtime.EventsOff(a.Ctx, requestID)
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
					ioOptions := IOOptions{Mode: "Text"}
					json.Unmarshal([]byte(optionsStr), &ioOptions)

					if ioOptions.Mode == Binary {
						body, err = base64.StdEncoding.DecodeString(resp.Body)
						if err != nil {
							resp.Status = 500
							resp.Body = err.Error()
						} else {
							resp.Body = string(body)
						}
					}
				}
			}

			respChan <- resp
		})

		runtime.EventsEmit(a.Ctx, serverID, requestID, r.Method, r.URL.RequestURI(), r.Header, body)

		res := <-respChan
		for key, value := range res.Headers {
			w.Header().Set(key, value)
		}
		w.WriteHeader(res.Status)
		w.Write([]byte(res.Body))
	}
}
