import { EventEmitter } from "events";

export interface ISourceEvent {
    type: "add" | "delete" | "change"
    id: string
    path: string
    hash: string
}

export interface ISource extends EventEmitter {
    run: () => Promise<void>
    close: () => Promise<void>
}

export type TSourceConfigType = "git"

export interface ISourceConfig {
    type: TSourceConfigType
}

export interface IGitSourceConfig extends ISourceConfig {
    include_regexp: string
    exclude_regexp: string
    size: string
    tmp: string
    cron: {
        enable: boolean
        jitter: number
        interval: string,
        time_zone: string
    }
    commit_count: number
    repository: string
    branch: string
    target: string
}