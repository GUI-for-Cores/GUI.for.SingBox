package bridge

import (
	"bufio"
	"context"
	"errors"
	"fmt"
	"io"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	sysruntime "runtime"
	"slices"
	"strconv"
	"strings"
	"time"

	"github.com/shirou/gopsutil/v3/process"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

func (a *App) Exec(path string, args []string, options ExecOptions) FlagResult {
	log.Printf("Exec: %s %s %v", path, args, options)

	exePath := resolvePath(path)

	if _, err := os.Stat(exePath); os.IsNotExist(err) {
		exePath = path
	}

	cmd := exec.Command(exePath, args...)
	SetCmdWindowHidden(cmd)

	cmd.Dir = options.WorkingDirectory
	cmd.Env = os.Environ()

	for key, value := range options.Env {
		cmd.Env = append(cmd.Env, key+"="+value)
	}

	out, err := cmd.CombinedOutput()

	var output string
	if options.Convert {
		output = strings.TrimSpace(decodeGB18030(out))
	} else {
		output = strings.TrimSpace(string(out))
	}

	if err != nil {
		if output == "" {
			output = err.Error()
		}
		return FlagResult{false, output}
	}

	return FlagResult{true, output}
}

func (a *App) ExecBackground(path string, args []string, outEvent string, endEvent string, options ExecOptions) FlagResult {
	log.Printf("ExecBackground: %s %s %s %s %v", path, args, outEvent, endEvent, options)

	exePath := resolvePath(path)
	pidPath := ""
	logPath := ""

	if _, err := os.Stat(exePath); os.IsNotExist(err) {
		exePath = path
	}

	if options.PidFile != "" {
		pidPath = resolvePath(options.PidFile)
	}

	done := make(chan struct{})
	outputDone := make(chan struct{})
	cmd := exec.Command(exePath, args...)
	SetCmdWindowHidden(cmd)

	cmd.Dir = options.WorkingDirectory
	cmd.Env = os.Environ()

	for key, value := range options.Env {
		cmd.Env = append(cmd.Env, key+"="+value)
	}

	var stdout io.ReadCloser
	var err error
	var logFile *os.File

	switch {
	case options.LogFile != "":
		logPath = resolvePath(options.LogFile)
		if err := os.MkdirAll(filepath.Dir(logPath), os.ModePerm); err != nil {
			return FlagResult{false, err.Error()}
		}

		logFile, err = os.OpenFile(logPath, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0644)
		if err != nil {
			return FlagResult{false, err.Error()}
		}
		defer logFile.Close()

		cmd.Stdout = logFile
		cmd.Stderr = logFile

	case outEvent != "":
		stdout, err = cmd.StdoutPipe()
		if err != nil {
			return FlagResult{false, err.Error()}
		}
		cmd.Stderr = cmd.Stdout
	}

	if err := cmd.Start(); err != nil {
		return FlagResult{false, err.Error()}
	}

	pid := strconv.Itoa(cmd.Process.Pid)

	if pidPath != "" {
		if err := os.WriteFile(pidPath, []byte(pid), os.ModePerm); err != nil {
			_ = SendExitSignal(cmd.Process)
			_ = waitForProcessExitWithTimeout(cmd.Process, 10)
			_ = cmd.Wait()
			return FlagResult{false, err.Error()}
		}
	}

	if outEvent != "" {
		if logPath != "" {
			go tailAndEmitLogFile(a, logPath, outEvent, options, done, outputDone)
		} else {
			go scanAndEmitOutput(a, stdout, outEvent, options, outputDone)
		}
	} else {
		close(outputDone)
	}

	go func() {
		err := cmd.Wait()
		close(done)
		<-outputDone

		if pidPath != "" {
			_ = os.Remove(pidPath)
		}
		if endEvent != "" {
			if err != nil {
				runtime.EventsEmit(a.Ctx, endEvent, err.Error())
				return
			}
			runtime.EventsEmit(a.Ctx, endEvent)
		}
	}()

	return FlagResult{true, pid}
}

func (a *App) ProcessInfo(pid int32) FlagResult {
	log.Printf("ProcessInfo: %d", pid)

	proc, err := process.NewProcess(pid)
	if err != nil {
		return FlagResult{false, err.Error()}
	}

	name, err := proc.Name()
	if err == nil && name != "" {
		return FlagResult{true, name}
	}

	exePath, exeErr := proc.Exe()
	if exeErr == nil && exePath != "" {
		return FlagResult{true, filepath.Base(exePath)}
	}

	cmdline, cmdlineErr := proc.CmdlineSlice()
	if cmdlineErr == nil && len(cmdline) > 0 && cmdline[0] != "" {
		return FlagResult{true, filepath.Base(cmdline[0])}
	}

	errs := []string{}
	if err != nil {
		errs = append(errs, "name: "+err.Error())
	}
	if exeErr != nil {
		errs = append(errs, "exe: "+exeErr.Error())
	}
	if cmdlineErr != nil {
		errs = append(errs, "cmdline: "+cmdlineErr.Error())
	}

	if len(errs) == 0 {
		return FlagResult{false, "failed to resolve process info"}
	}

	return FlagResult{false, strings.Join(errs, "; ")}
}

func (a *App) ProcessMemory(pid int32) FlagResult {
	log.Printf("ProcessMemory: %d", pid)

	proc, err := process.NewProcess(pid)
	if err != nil {
		return FlagResult{false, err.Error()}
	}

	memInfo, err := proc.MemoryInfo()
	if err == nil && memInfo != nil {
		return FlagResult{true, strconv.FormatUint(memInfo.RSS, 10)}
	}

	if sysruntime.GOOS == "darwin" {
		rss, fallbackErr := getDarwinProcessRSS(pid)
		if fallbackErr == nil {
			return FlagResult{true, strconv.FormatUint(rss, 10)}
		}
		return FlagResult{false, fmt.Sprintf("memory info: %v; ps fallback: %v", err, fallbackErr)}
	}

	return FlagResult{false, err.Error()}
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

func getDarwinProcessRSS(pid int32) (uint64, error) {
	out, err := exec.Command("ps", "-o", "rss=", "-p", strconv.Itoa(int(pid))).CombinedOutput()
	if err != nil {
		output := strings.TrimSpace(string(out))
		if output == "" {
			return 0, err
		}
		return 0, fmt.Errorf("%v: %s", err, output)
	}

	rssKB := strings.TrimSpace(string(out))
	if rssKB == "" {
		return 0, fmt.Errorf("empty rss output")
	}

	rss, err := strconv.ParseUint(rssKB, 10, 64)
	if err != nil {
		return 0, err
	}

	return rss * 1024, nil
}

func scanAndEmitOutput(a *App, reader io.Reader, outEvent string, options ExecOptions, outputDone chan<- struct{}) {
	defer close(outputDone)

	scanner := bufio.NewScanner(reader)
	scanner.Buffer(make([]byte, 64*1024), 1024*1024)
	stopOutput := false

	for scanner.Scan() {
		var text string
		if options.Convert {
			text = decodeGB18030(scanner.Bytes())
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

func tailAndEmitLogFile(a *App, path string, outEvent string, options ExecOptions, done <-chan struct{}, outputDone chan<- struct{}) {
	defer close(outputDone)

	offset := int64(0)
	pending := ""
	ticker := time.NewTicker(100 * time.Millisecond)
	defer ticker.Stop()

	emitLine := func(text string) bool {
		if options.Convert {
			text = decodeGB18030([]byte(text))
		}
		text = strings.TrimRight(text, "\r")

		if text == "" {
			return false
		}

		runtime.EventsEmit(a.Ctx, outEvent, text)
		return options.StopOutputKeyword != "" && strings.Contains(text, options.StopOutputKeyword)
	}

	readNewContent := func(flush bool) bool {
		data, nextOffset, err := readFileRange(path, offset)
		if err != nil {
			if !errors.Is(err, os.ErrNotExist) {
				log.Printf("Failed to read log file %s: %v", path, err)
			}
			return false
		}

		if len(data) == 0 {
			if flush && pending != "" {
				return emitLine(pending)
			}
			offset = nextOffset
			return false
		}

		offset = nextOffset
		chunk := pending + string(data)
		lines := strings.Split(chunk, "\n")
		pending = lines[len(lines)-1]

		if slices.ContainsFunc(lines[:len(lines)-1], emitLine) {
			pending = ""
			return true
		}

		if flush && pending != "" {
			if emitLine(pending) {
				pending = ""
				return true
			}
			pending = ""
		}

		return false
	}

	for {
		select {
		case <-done:
			_ = readNewContent(true)
			return
		case <-ticker.C:
			if readNewContent(false) {
				return
			}
		}
	}
}

func readFileRange(path string, offset int64) ([]byte, int64, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, offset, err
	}
	defer file.Close()

	stat, err := file.Stat()
	if err != nil {
		return nil, offset, err
	}

	size := stat.Size()
	if offset > size {
		offset = size
	}
	if size == offset {
		return nil, offset, nil
	}

	buf := make([]byte, size-offset)
	n, err := file.ReadAt(buf, offset)
	if err != nil && err != io.EOF {
		return nil, offset, err
	}

	return buf[:n], offset + int64(n), nil
}
