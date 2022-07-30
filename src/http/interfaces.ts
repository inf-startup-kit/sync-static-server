import { FastifyInstance } from "fastify";
import { ILoggerEventEmitter } from "logger-event-emitter";
import { IWebServerConfig } from "../lib/config.interfaces";

export interface IApiServerFastifyInstance extends FastifyInstance {
    logger: ILoggerEventEmitter
}

export interface IWebServerFastifyInstance extends FastifyInstance {
    logger: ILoggerEventEmitter
    config: IWebServerConfig
}