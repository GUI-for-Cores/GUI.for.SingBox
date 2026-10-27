package bridge

import (
	"log"
	"os"
	"os/signal"
	"sync"
	"syscall"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

const exitSignalTimeout = 15 * time.Second

var exitSignals = []os.Signal{os.Interrupt, syscall.SIGTERM}

// HandleExitSignals routes SIGINT/SIGTERM through the same exit flow as the Exit menu,
// so the frontend can stop the core, clear the system proxy and run plugin hooks.
// The returned function must be called once the frontend is loaded (OnDomReady).
func HandleExitSignals(a *App) (ready func()) {
	sigChan := make(chan os.Signal, 2)
	readyChan := make(chan struct{})

	signal.Notify(sigChan, exitSignals...)

	go func() {
		sig := <-sigChan
		log.Printf("Received signal: %v", sig)

		select {
		case <-readyChan:
		default:
			// The frontend has not started anything yet
			os.Exit(1)
		}

		runtime.EventsEmit(a.Ctx, "onExitApp")

		select {
		case sig = <-sigChan:
			log.Printf("Received signal again: %v, force exit", sig)
			os.Exit(1)
		case <-time.After(exitSignalTimeout):
			log.Printf("Exit timeout, force exit")
			a.ExitApp()
		}

		select {
		case <-sigChan:
		case <-time.After(3 * time.Second):
		}
		os.Exit(1)
	}()

	var once sync.Once
	return func() {
		once.Do(func() {
			// Wails v2 installs its own handler that only reads the first signal and
			// routes it to OnBeforeClose, which may just hide the window. Replace it.
			signal.Reset(exitSignals...)
			signal.Notify(sigChan, exitSignals...)
			close(readyChan)
		})
	}
}
