package bridge

import (
	"context"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"strings"

	"github.com/google/uuid"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

var serverMap = make(map[string]*http.Server)

type ResponseData struct {
	Status  int
	Headers map[string]string
	Body    string
}

func (a *App) StartServer(address string, serverID string) FlagResult {
	log.Printf("StartServer: %s", address)

	server := &http.Server{
		Addr: address,
		Handler: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			requestID := uuid.New().String()
			responseChan := make(chan ResponseData)
			b, err := io.ReadAll(r.Body)
			if err != nil {
				w.WriteHeader(500)
				return
			}
			runtime.EventsEmit(a.Ctx, serverID, requestID, r.Method, r.URL.RequestURI(), r.Header, string(b))
			runtime.EventsOn(a.Ctx, requestID, func(data ...interface{}) {
				runtime.EventsOff(a.Ctx, requestID)
				resp := ResponseData{200, make(map[string]string), "A sample http server"}
				if len(data) >= 3 {
					if status, ok := data[0].(float64); ok {
						resp.Status = int(status)
					}
					if headers, ok := data[1].(string); ok {
						json.Unmarshal([]byte(headers), &resp.Headers)
					}
					if body, ok := data[2].(string); ok {
						resp.Body = body
					}
				}
				responseChan <- resp
			})
			res := <-responseChan
			for key, value := range res.Headers {
				w.Header().Set(key, value)
			}
			w.WriteHeader(res.Status)
			w.Write([]byte(res.Body))
		}),
	}

	go func() { server.ListenAndServe() }()

	serverMap[serverID] = server

	return FlagResult{true, "Success"}
}

func (a *App) StopServer(id string) FlagResult {
	log.Printf("StopServer: %s", id)

	server, ok := serverMap[id]
	if !ok {
		return FlagResult{false, "server not found"}
	}

	err := server.Shutdown(context.TODO())
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
