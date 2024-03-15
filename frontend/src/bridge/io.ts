import * as App from '@wails/go/bridge/App'

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

export const Removefile = async (path: string) => {
  const { flag, data } = await App.Removefile(path)
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

export const FileExists = async (path: string) => {
  const { flag, data } = await App.FileExists(path)
  if (!flag) {
    throw data
  }
  return data === 'true'
}

export const AbsolutePath = async (path: string) => {
  const { flag, data } = await App.AbsolutePath(path)
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

export const UnzipGZFile = async (path: string, output: string) => {
  const { flag, data } = await App.UnzipGZFile(path, output)
  if (!flag) {
    throw data
  }
  return data
}
