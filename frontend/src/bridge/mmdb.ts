import * as App from '@wails/go/bridge/App'

type QueryType =
  | 'ASN'
  | 'AnonymousIP'
  | 'City'
  | 'ConnectionType'
  | 'Country'
  | 'Domain'
  | 'Enterprise'

export const OpenMMDB = async (path: string, id: string) => {
  const { flag, data } = await App.OpenMMDB(path, id)
  if (!flag) {
    throw data
  }
  return {
    close: () => CloseMMDB(path, id),
    query: (ip: string, type: QueryType) => QueryMMDB(path, ip, type),
  }
}

export const CloseMMDB = async (path: string, id: string) => {
  const { flag, data } = await App.CloseMMDB(path, id)
  if (!flag) {
    throw data
  }
  return data
}

export const QueryMMDB = async (path: string, ip: string, type: QueryType = 'Country') => {
  const { flag, data } = await App.QueryMMDB(path, ip, type)
  if (!flag) {
    throw data
  }
  return JSON.parse(data)
}
