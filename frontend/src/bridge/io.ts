import * as App from '@wails/go/bridge/App'

interface IOOptions {
  Mode?: 'Binary' | 'Text'
}

export const WriteFile = async (path: string, content: string, options: IOOptions = {}) => {
  const { flag, data } = await App.WriteFile(path, content, { Mode: 'Text', ...options })
  if (!flag) {
    throw data
  }
  return data
}

export const ReadFile = async (path: string, options: IOOptions = {}) => {
  const { flag, data } = await App.ReadFile(path, { Mode: 'Text', ...options })
  if (!flag) {
    throw data
  }
  return data
}

export const MoveFile = async (source: string, target: string) => {
  const { flag, data } = await App.MoveFile(source, target)
  if (!flag) {
    throw data
  }
  return data
}

export const RemoveFile = async (path: string) => {
  const { flag, data } = await App.RemoveFile(path)
  if (!flag) {
    throw data
  }
  return data
}

export const CopyFile = async (source: string, target: string) => {
  const { flag, data } = await App.CopyFile(source, target)
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

export const MakeDir = async (path: string) => {
  const { flag, data } = await App.MakeDir(path)
  if (!flag) {
    throw data
  }
  return data
}

export const ReadDir = async (path: string) => {
  const { flag, data } = await App.ReadDir(path)
  if (!flag) {
    throw data
  }
  return data
    .split('|')
    .filter((v) => v)
    .map((v) => {
      const [name, size, isDir] = v.split(',')
      return { name, size: Number(size), isDir: isDir === 'true' }
    })
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

export const UnzipTarGZFile = async (path: string, output: string) => {
  const { flag, data } = await App.UnzipTarGZFile(path, output)
  if (!flag) {
    throw data
  }
  return data
}

export const Writefile = WriteFile
export const Readfile = ReadFile
export const Movefile = MoveFile
export const Removefile = RemoveFile
export const Copyfile = CopyFile
export const Makedir = MakeDir
export const Readdir = ReadDir
