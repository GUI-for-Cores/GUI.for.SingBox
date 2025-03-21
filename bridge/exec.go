package bridge

import (
	"bufio"
	"errors"
	"fmt"
	"io"
	"log"
	"os"
	"os/exec"
	"strconv"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"github.com/shirou/gopsutil/process"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

func (a *App) Exec(path string, args []string, options ExecOptions) FlagResult {
	log.Printf("Exec: %s %s %v", path, args, options)

	exe_path := GetPath(path)

	if _, err := os.Stat(exe_path); os.IsNotExist(err) {
		exe_path = path
	}

	cmd := exec.Command(exe_path, args...)
	HideExecWindow(cmd)

	for key, value := range options.Env {
		cmd.Env = append(cmd.Env, key+"="+value)
	}

	out, err := cmd.CombinedOutput()
	if err != nil {
		return FlagResult{false, err.Error()}
	}

	output := ""
	if options.Convert {
		output = ConvertByte2String(out)
	} else {
		output = string(out)
	}

	return FlagResult{true, output}
}

func (a *App) ExecBackground(path string, args []string, outEvent string, endEvent string, options ExecOptions) FlagResult {
	log.Printf("ExecBackground: %s %s %v", path, args, options)

	exe_path := GetPath(path)

	if _, err := os.Stat(exe_path); os.IsNotExist(err) {
		exe_path = path
	}

	cmd := exec.Command(exe_path, args...)
	HideExecWindow(cmd)

	for key, value := range options.Env {
		cmd.Env = append(cmd.Env, key+"="+value)
	}

	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return FlagResult{false, err.Error()}
	}

	stderr, err := cmd.StderrPipe()
	if err != nil {
		return FlagResult{false, err.Error()}
	}

	err = cmd.Start()
	if err != nil {
		return FlagResult{false, err.Error()}
	}

	if outEvent != "" {
		var keywordFound int32 = 0
		wg := &sync.WaitGroup{}
		wg.Add(2)

		scanAndEmit := func(reader io.Reader) {
			defer wg.Done()
			scanner := bufio.NewScanner(reader)
			for scanner.Scan() {
				if atomic.LoadInt32(&keywordFound) == 1 {
					continue
				}
				text := scanner.Text()
				if options.StopOutputKeyword != "" {
					if strings.Contains(text, options.StopOutputKeyword) {
						atomic.StoreInt32(&keywordFound, 1)
						runtime.EventsEmit(a.Ctx, outEvent, text)
						continue
					}
				}
				runtime.EventsEmit(a.Ctx, outEvent, text)
			}
		}

		go scanAndEmit(stdout)
		go scanAndEmit(stderr)

		go func() {
			wg.Wait()
			if endEvent != "" {
				runtime.EventsEmit(a.Ctx, endEvent)
			}
		}()
	}

	pid := cmd.Process.Pid

	return FlagResult{true, strconv.Itoa(pid)}
}

func (a *App) ProcessInfo(pid int32) FlagResult {
	log.Printf("ProcessInfo: %d", pid)

	proc, err := process.NewProcess(pid)
	if err != nil {
		return FlagResult{false, err.Error()}
	}

	name, err := proc.Name()
	if err != nil {
		return FlagResult{false, err.Error()}
	}

	return FlagResult{true, name}
}

func (a *App) KillProcess(pid int) FlagResult {
	log.Printf("KillProcess: %d", pid)

	process, err := os.FindProcess(pid)
	if err != nil {
		return FlagResult{false, err.Error()}
	}

	err = SendExitSignal(process)
	if err != nil {
		log.Printf("SendExitSignal Err: %s", err.Error())
	}

	err = waitForProcessExitWithTimeout(process, 10)
	if err != nil {
		return FlagResult{false, err.Error()}
	}

	return FlagResult{true, "Success"}
}

func waitForProcessExitWithTimeout(process *os.Process, timeoutSeconds int64) error {
	done := make(chan error, 1)
	go func() {
		_, err := process.Wait()
		done <- err
	}()

	timeout := time.After(time.Duration(timeoutSeconds) * time.Second)

	select {
	case err := <-done:
		return err
	case <-timeout:
		if killErr := process.Kill(); killErr != nil {
			return fmt.Errorf("timeout reached and failed to kill process: %w", killErr)
		}
		<-done
		return errors.New("timeout waiting for process to exit")
	}
}
