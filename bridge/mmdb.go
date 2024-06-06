package bridge

import (
	"encoding/json"
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
	mutex   sync.Mutex
	mmdbMap = make(map[string]*MMDBInstance)
)

func (a *App) OpenMMDB(path string, id string) FlagResult {
	log.Printf("OpenMMDB: %s -> %s", id, path)

	mutex.Lock()
	defer mutex.Unlock()

	if db, isOpened := mmdbMap[path]; isOpened {
		if _, ref := db.Refs[id]; !ref {
			db.Refs[id] = true
		}
		return FlagResult{true, "Success"}
	}

	reader, err := geoip2.Open(GetPath(path))
	if err != nil {
		return FlagResult{false, err.Error()}
	}

	refs := make(map[string]bool)
	refs[id] = true

	mmdbMap[path] = &MMDBInstance{
		Refs:   refs,
		Reader: reader,
	}

	return FlagResult{true, "Success"}
}

func (a *App) CloseMMDB(path string, id string) FlagResult {
	log.Printf("CloseMMDB: %s -> %s", id, path)

	mutex.Lock()
	defer mutex.Unlock()

	db, isOpened := mmdbMap[path]

	if !isOpened {
		return FlagResult{false, "Database file is not open: " + path}
	}

	if _, ref := db.Refs[id]; !ref {
		return FlagResult{false, "The current database is not referenced by: " + id}
	}

	delete(db.Refs, id)

	if len(db.Refs) == 0 {
		err := db.Reader.Close()
		if err != nil {
			return FlagResult{false, err.Error()}
		}
		delete(mmdbMap, path)
	}

	return FlagResult{true, "Success"}
}

func (a *App) QueryMMDB(path string, ip string, types string) FlagResult {
	log.Printf("QueryMMDB: %s -> %s", path, ip)

	_ip := net.ParseIP(ip)

	db, isOpened := mmdbMap[path]

	if !isOpened {
		return FlagResult{false, "Database file is not open: " + path}
	}

	var record interface{}
	var err error
	switch types {
	case "ASN":
		record, err = db.Reader.ASN(_ip)
	case "AnonymousIP":
		record, err = db.Reader.AnonymousIP(_ip)
	case "City":
		record, err = db.Reader.City(_ip)
	case "ConnectionType":
		record, err = db.Reader.ConnectionType(_ip)
	case "Country":
		record, err = db.Reader.Country(_ip)
	case "Domain":
		record, err = db.Reader.Domain(_ip)
	case "Enterprise":
		record, err = db.Reader.Enterprise(_ip)
	}
	if err != nil {
		return FlagResult{false, err.Error()}
	}

	str, err := json.Marshal(record)
	if err != nil {
		return FlagResult{false, err.Error()}
	}

	return FlagResult{true, string(str)}
}
