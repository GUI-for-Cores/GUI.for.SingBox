package bridge

import (
	"encoding/base64"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

var serverMap = make(map[string]*http.Server)

type ResponseData struct {
	Status  int
	Headers map[string]string
	Body    string
}

func (a *App) StartServer(address string, serverID string, options ServerOptions) FlagResult {
	log.Printf("StartServer: %s", address)

	server := &http.Server{
		Addr: address,
		Handler: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			body, err := io.ReadAll(r.Body)
			if err != nil {
				w.WriteHeader(500)
				log.Printf("reading body error: %v", err)
				return
			}

			requestID := uuid.New().String()
			respChan := make(chan ResponseData)
			respBody := []byte{}

			defer close(respChan)

			runtime.EventsOn(a.Ctx, requestID, func(data ...any) {
				runtime.EventsOff(a.Ctx, requestID)
				resp := ResponseData{200, make(map[string]string), "A sample http server"}
				if len(data) >= 4 {
					if status, ok := data[0].(float64); ok {
						resp.Status = int(status)
					}
					if headers, ok := data[1].(string); ok {
						json.Unmarshal([]byte(headers), &resp.Headers)
					}
					if body, ok := data[2].(string); ok {
						resp.Body = body
						respBody = []byte(body)
					}
					if options, ok := data[3].(string); ok {
						ioOptions := IOOptions{Mode: "Text"}
						json.Unmarshal([]byte(options), &ioOptions)
						if ioOptions.Mode == Binary {
							body, err = base64.StdEncoding.DecodeString(resp.Body)
							if err != nil {
								resp.Status = 500
								respBody = []byte(err.Error())
							} else {
								respBody = body
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
			w.Write(respBody)
		}),
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

	serverMap[serverID] = server

	return FlagResult{true, "Success"}
}

func (a *App) StopServer(id string) FlagResult {
	log.Printf("StopServer: %s", id)

	server, ok := serverMap[id]
	if !ok {
		return FlagResult{false, "server not found"}
	}

	err := server.Close()
	if err != nil {
		return FlagResult{false, err.Error()}
	}

	delete(serverMap, id)

	return FlagResult{true, "Success"}
}

func (a *App) ListServer() FlagResult {
	log.Printf("ListServer: %v", serverMap)

	var servers []string

	for serverID := range serverMap {
		servers = append(servers, serverID)
	}

	return FlagResult{true, strings.Join(servers, "|")}
}
