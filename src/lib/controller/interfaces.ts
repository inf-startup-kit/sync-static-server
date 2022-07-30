import { ISourceConfig } from "../source/interfaces";

export interface IController {
    run: () => Promise<void>
    close: () => Promise<void>
}

export interface IControllerConfig {
    enable: boolean
    source: ISourceConfig
}