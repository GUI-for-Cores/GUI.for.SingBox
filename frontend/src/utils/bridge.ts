import * as App from '@wails/go/bridge/App'
export * from '@wails/runtime/runtime'

export const Writefile = async (path: string, content: string) => {
  const { flag, data } = await App.Writefile(path, content)
  if (!flag) {
    throw data
  }
  return data
}

export const Readfile = async (path: string) => {
  const { flag, data } = await App.Readfile(path)
  if (!flag) {
    throw data
  }
  return data
}

export const Movefile = async (source: string, target: string) => {
  const { flag, data } = await App.Movefile(source, target)
  if (!flag) {
    throw data
  }
  return data
}

export const Copyfile = async (source: string, target: string) => {
  const { flag, data } = await App.Copyfile(source, target)
  if (!flag) {
    throw data
  }
  return data
}

export const Removefile = async (path: string) => {
  const { flag, data } = await App.Removefile(path)
  if (!flag) {
    throw data
  }
  return data
}

export const Makedir = async (path: string) => {
  const { flag, data } = await App.Makedir(path)
  if (!flag) {
    throw data
  }
  return data
}

export const UnzipZIPFile = async (path: string, output: string) => {
  const { flag, data } = await App.UnzipZIPFile(path, output)
  if (!flag) {
    throw data
  }
  return data
}

export const FileExists = async (path: string,) => {
  const { flag, data } = await App.FileExists(path)
  if (!flag) {
    throw data
  }
  return data === 'true'
}

export const Download = async (url: string, path: string) => {
  const { flag, data } = await App.Download(url, path)
  if (!flag) {
    throw data
  }
  return data
}

export const HttpGet = async (url: string, headers = {}) => {
  const { flag, header, body } = await App.HttpGet(url, headers)
  if (!flag) {
    throw body
  }
  return { header, body }
}

export const HttpGetJSON = async (url: string, headers = {}) => {
  const { flag, header, body } = await App.HttpGet(url, headers)
  if (!flag) {
    throw body
  }
  try {
    const json = JSON.parse(body)
    return { header, json }
  } catch {
    throw 'Wrong data format'
  }
}

export const Exec = async (path: string, ...args: string[]) => {
  const { flag, data } = await App.Exec(path, args)
  if (!flag) {
    throw data
  }
  return data
}

export const StartKernel = async (path: string, directory: string) => {
  const { flag, data } = await App.StartKernel(path, directory)
  if (!flag) {
    throw data
  }
  return Number(data)
}

export const KernelRunning = async (pid: number) => {
  if (pid === 0) return false
  const { flag, data } = await App.ProcessInfo(pid)
  if (!flag) {
    throw data
  }
  return data.startsWith('sing-box')
}

export const KillProcess = async (pid: number) => {
  const { flag, data } = await App.KillProcess(pid)
  if (!flag) {
    throw data
  }
  return data
}

export const SetSystemProxy = async (port: number) => {
  const proxyServer = '127.0.0.1' + ':' + port
  const { flag, data } = await App.SetSystemProxy(true, proxyServer)
  if (!flag) {
    throw data
  }
  return data
}

export const ClearSystemProxy = async () => {
  const { flag, data } = await App.SetSystemProxy(false, '')
  if (!flag) {
    throw data
  }
  return data
}

export const GetSystemProxy = async () => {
  const { flag, data } = await App.GetSystemProxy()
  if (!flag) {
    throw data
  }
  return data
}

export const GetInterfaces = async () => {
  const { flag, data } = await App.GetInterfaces()
  if (!flag) {
    throw data
  }
  return data.split('|')
}

export const GetEnv = App.GetEnv

export const CheckPermissions = async () => {
  const { basePath, appName } = await GetEnv()
  const path = basePath + '\\' + appName
  const { data } = await App.CheckPermissions(path)
  return data === 'RunAsAdmin'
}

export const SwitchPermissions = async (enable: boolean) => {
  const { basePath, appName } = await GetEnv()
  const path = basePath + '\\' + appName
  const { flag, data } = await App.SwitchPermissions(enable, path)
  if (!flag) {
    throw data
  }
  return data
}

export const QuerySchTask = async (taskName: string) => {
  const { flag, data } = await App.QuerySchTask(taskName)
  if (!flag) {
    throw data
  }
  return data
}

export const CreateSchTask = async (taskName: string, xmlPath: string) => {
  const { flag, data } = await App.CreateSchTask(taskName, xmlPath)
  if (!flag) {
    throw data
  }
  return data
}

export const DeleteSchTask = async (taskName: string) => {
  const { flag, data } = await App.DeleteSchTask(taskName)
  if (!flag) {
    throw data
  }
  return data
}

export const RestartApp = async () => {
  const { flag, data } = await App.RestartApp()
  if (!flag) {
    throw data
  }
  return data
}
