import { ILoggerEventEmitterConfig } from "logger-event-emitter";
import { IControllerConfig } from "./controller/interfaces";

export interface IApiServerConfig {
    enable: boolean
    logging: boolean
    port: number
    hostname: string
    backlog: number
    prefix: string
    connection_timeout: number
    keep_alive_timeout: number
    body_limit: string
    trust_proxy: boolean
}

export interface IWebServerConfig {
    enable: boolean
    logging: boolean
    port: number
    hostname: string
    backlog: number
    prefix: string
    connection_timeout: number
    keep_alive_timeout: number
    body_limit: string
    trust_proxy: boolean
    store: IWebServerConfigStore
    synchronization: IControllerConfig
}

export interface IWebServerConfigStore {
    path: string
    hidden: boolean
}

export interface IAppConfig {
    logger: ILoggerEventEmitterConfig
    api: IApiServerConfig
    web: IWebServerConfig
}