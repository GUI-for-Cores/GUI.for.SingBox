package bridge

import (
	"log"
	"strconv"

	"github.com/robfig/cron/v3"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

var tasks cron.Cron

func InitScheduledTasks() {
	tasks = *cron.New(cron.WithSeconds())
	tasks.Start()
}

func (a *App) AddScheduledTask(spec string, event string) FlagResult {
	log.Printf("AddScheduledTask: %s %s", spec, event)
	id, err := tasks.AddFunc(spec, func() {
		runtime.EventsEmit(a.Ctx, event)
	})
	if err != nil {
		return FlagResult{false, err.Error()}
	}
	return FlagResult{true, strconv.Itoa(int(id))}
}

func (a *App) RemoveScheduledTask(id int) {
	log.Printf("RemoveScheduledTask: %d", id)
	tasks.Remove(cron.EntryID(id))
}

func (a *App) ValidateCron(spec string) FlagResult {
	log.Printf("ValidateCron: %s", spec)

	id, err := tasks.AddFunc(spec, nil)
	if err != nil {
		return FlagResult{false, err.Error()}
	}

	tasks.Remove(id)

	return FlagResult{true, "Success"}
}
