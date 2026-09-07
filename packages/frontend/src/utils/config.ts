export type Config = {
  [key: string]: string | undefined
}

type GetConfig = () => Config

let appConfig = {}
export const getConfig: GetConfig = () => appConfig
export const setConfig = (config: Config) => {
  appConfig = config
}
