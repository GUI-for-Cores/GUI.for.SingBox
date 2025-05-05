package bridge

import (
	"encoding/json"
	"errors"
	"log"
	"net"
	"sync"

	"github.com/oschwald/geoip2-golang"
)

type MMDBInstance = struct {
	Refs   map[string]bool
	Reader *geoip2.Reader
}

var (
	mu      sync.RWMutex
	mmdbMap = make(map[string]*MMDBInstance)
)

func (a *App) OpenMMDB(path string, id string) FlagResult {
	log.Printf("OpenMMDB: %s -> %s", id, path)

	mu.Lock()
	defer mu.Unlock()

	if db, exists := mmdbMap[path]; exists {
		db.Refs[id] = true
		return FlagResult{true, "Success"}
	}

	reader, err := geoip2.Open(GetPath(path))
	if err != nil {
		return FlagResult{false, "Failed to open mmdb: " + err.Error()}
	}

	mmdbMap[path] = &MMDBInstance{
		Refs:   map[string]bool{id: true},
		Reader: reader,
	}

	return FlagResult{true, "Success"}
}

func (a *App) CloseMMDB(path string, id string) FlagResult {
	log.Printf("CloseMMDB: %s -> %s", id, path)

	mu.Lock()
	defer mu.Unlock()

	db, exists := mmdbMap[path]

	if !exists {
		return FlagResult{false, "Database not open: " + path}
	}

	if !db.Refs[id] {
		return FlagResult{false, "Reference not found for: " + id}
	}

	delete(db.Refs, id)

	if len(db.Refs) == 0 {
		if err := db.Reader.Close(); err != nil {
			return FlagResult{false, "Failed to close reader: " + err.Error()}
		}
		delete(mmdbMap, path)
	}

	return FlagResult{true, "Success"}
}

func (a *App) QueryMMDB(path string, ip string, dataType string) FlagResult {
	log.Printf("QueryMMDB: %s -> %s", path, ip)

	parsedIP := net.ParseIP(ip)
	if parsedIP == nil {
		return FlagResult{false, "Invalid IP address"}
	}

	mu.RLock()
	db, exists := mmdbMap[path]
	mu.RUnlock()

	if !exists {
		return FlagResult{false, "Database not open: " + path}
	}

	record, err := queryByType(db.Reader, parsedIP, dataType)
	if err != nil {
		return FlagResult{false, err.Error()}
	}

	bytes, err := json.Marshal(record)
	if err != nil {
		return FlagResult{false, err.Error()}
	}

	return FlagResult{true, string(bytes)}
}

func queryByType(reader *geoip2.Reader, ip net.IP, dataType string) (any, error) {
	switch dataType {
	case "ASN":
		return reader.ASN(ip)
	case "AnonymousIP":
		return reader.AnonymousIP(ip)
	case "City":
		return reader.City(ip)
	case "ConnectionType":
		return reader.ConnectionType(ip)
	case "Country":
		return reader.Country(ip)
	case "Domain":
		return reader.Domain(ip)
	case "Enterprise":
		return reader.Enterprise(ip)
	default:
		return nil, errors.New("Unsupported query type: " + dataType)
	}
}
