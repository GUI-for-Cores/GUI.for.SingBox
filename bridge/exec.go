package bridge

import (
	"bufio"
	"fmt"
	"os"
	"os/exec"
	"strconv"
	"sync"
	"syscall"

	"github.com/shirou/gopsutil/process"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

func (a *App) Exec(path string, args []string, convert bool) FlagResult {
	fmt.Println("Exec:", path, args)

	exe_path, err := GetPath(path)

	if err != nil {
		return FlagResult{false, err.Error()}
	}

	if a.FileExists(exe_path).Data != "true" {
		exe_path = path
	}

	cmd := exec.Command(exe_path, args...)
	HideExecWindow(cmd)

	out, err := cmd.CombinedOutput()
	if err != nil {
		return FlagResult{false, err.Error()}
	}

	output := ""
	if convert {
		output = ConvertByte2String(out)
	} else {
		output = string(out)
	}

	return FlagResult{true, output}
}

func (a *App) ExecBackground(path string, args []string, outEvent string, endEvent string) FlagResult {
	fmt.Println("ExecBackground:", path, args)

	exe_path, err := GetPath(path)

	if err != nil {
		return FlagResult{false, err.Error()}
	}

	if a.FileExists(exe_path).Data != "true" {
		exe_path = path
	}

	cmd := exec.Command(exe_path, args...)
	HideExecWindow(cmd)

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
		wg := sync.WaitGroup{}
		wg.Add(2)

		outScanner := bufio.NewScanner(stdout)
		go func() {
			defer wg.Done()
			for outScanner.Scan() {
				text := outScanner.Text()
				runtime.EventsEmit(a.Ctx, outEvent, ""+text)
			}
		}()

		errScanner := bufio.NewScanner(stderr)
		go func() {
			defer wg.Done()
			for errScanner.Scan() {
				text := errScanner.Text()
				runtime.EventsEmit(a.Ctx, outEvent, ""+text)
			}
		}()

		go func() {
			wg.Wait()
			if endEvent != "" {
				runtime.EventsEmit(a.Ctx, endEvent, "")
			}
		}()
	}

	pid := cmd.Process.Pid

	return FlagResult{true, strconv.Itoa(pid)}
}

func (a *App) ProcessInfo(pid int32) FlagResult {
	fmt.Println("ProcessInfo:", pid)

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
	fmt.Println("KillProcess:", pid)

	process, err := os.FindProcess(pid)
	if err != nil {
		return FlagResult{false, err.Error()}
	}

	err = process.Signal(syscall.SIGKILL)
	if err != nil {
		return FlagResult{false, err.Error()}
	}

	return FlagResult{true, "Success"}
}
