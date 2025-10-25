package bridge

import (
	"bufio"
	"context"
	"fmt"
	"io"
	"log"
	"os"
	"os/exec"
	"strconv"
	"strings"
	"time"

	"github.com/shirou/gopsutil/v3/process"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

func (a *App) Exec(path string, args []string, options ExecOptions) FlagResult {
	log.Printf("Exec: %s %s %v", path, args, options)

	exePath := GetPath(path)

	if _, err := os.Stat(exePath); os.IsNotExist(err) {
		exePath = path
	}

	cmd := exec.Command(exePath, args...)
	SetCmdWindowHidden(cmd)

	for key, value := range options.Env {
		cmd.Env = append(cmd.Env, key+"="+value)
	}

	out, err := cmd.CombinedOutput()
	if err != nil {
		return FlagResult{false, err.Error()}
	}

	var output string
	if options.Convert {
		output = ConvertByte2String(out)
	} else {
		output = string(out)
	}

	return FlagResult{true, output}
}

func (a *App) ExecBackground(path string, args []string, outEvent string, endEvent string, options ExecOptions) FlagResult {
	log.Printf("ExecBackground: %s %s %s %s %v", path, args, outEvent, endEvent, options)

	exePath := GetPath(path)

	if _, err := os.Stat(exePath); os.IsNotExist(err) {
		exePath = path
	}

	cmd := exec.Command(exePath, args...)
	SetCmdWindowHidden(cmd)

	for key, value := range options.Env {
		cmd.Env = append(cmd.Env, key+"="+value)
	}

	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return FlagResult{false, err.Error()}
	}

	cmd.Stderr = cmd.Stdout

	if err := cmd.Start(); err != nil {
		return FlagResult{false, err.Error()}
	}

	if outEvent != "" {
		scanAndEmit := func(reader io.Reader) {
			scanner := bufio.NewScanner(reader)
			stopOutput := false
			for scanner.Scan() {
				var text string
				if options.Convert {
					text = ConvertByte2String(scanner.Bytes())
				} else {
					text = scanner.Text()
				}

				if !stopOutput {
					runtime.EventsEmit(a.Ctx, outEvent, text)

					if options.StopOutputKeyword != "" && strings.Contains(text, options.StopOutputKeyword) {
						stopOutput = true
					}
				}
			}
		}

		go scanAndEmit(stdout)
	}

	if endEvent != "" {
		go func() {
			cmd.Wait()
			runtime.EventsEmit(a.Ctx, endEvent)
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

func (a *App) ProcessMemory(pid int32) FlagResult {
	log.Printf("ProcessMemory: %d", pid)

	proc, err := process.NewProcess(pid)
	if err != nil {
		return FlagResult{false, err.Error()}
	}

	memInfo, err := proc.MemoryInfo()
	if err != nil {
		return FlagResult{false, err.Error()}
	}

	return FlagResult{true, strconv.FormatUint(memInfo.RSS, 10)}
}

func (a *App) KillProcess(pid int, timeout int) FlagResult {
	log.Printf("KillProcess: %d %d", pid, timeout)

	process, err := os.FindProcess(pid)
	if err != nil {
		return FlagResult{false, err.Error()}
	}

	if err := SendExitSignal(process); err != nil {
		log.Printf("SendExitSignal Err: %s", err.Error())
	}

	if err := waitForProcessExitWithTimeout(process, timeout); err != nil {
		return FlagResult{false, err.Error()}
	}

	return FlagResult{true, "Success"}
}

func waitForProcessExitWithTimeout(process *os.Process, timeoutSeconds int) error {
	ctx, cancel := context.WithTimeout(context.Background(), time.Duration(timeoutSeconds)*time.Second)
	defer cancel()

	interval := 10 * time.Millisecond
	maxInterval := 1000 * time.Millisecond

	for {
		select {
		case <-ctx.Done():
			if killErr := process.Kill(); killErr != nil {
				return fmt.Errorf("timed out after %d seconds waiting for process %d, and failed to kill it: %w", timeoutSeconds, process.Pid, killErr)
			}
			return nil

		default:
			alive, err := IsProcessAlive(process)
			if err != nil {
				return fmt.Errorf("failed to check status of process %d: %w", process.Pid, err)
			}
			if !alive {
				return nil
			}

			time.Sleep(interval)
			interval = min(time.Duration(interval*2), maxInterval)
		}
	}
}
