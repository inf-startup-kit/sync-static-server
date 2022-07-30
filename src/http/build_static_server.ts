import { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import Fastify from "fastify";
import chalk from "chalk";
import * as fs from "fs";
import * as path from "path";
import { IWebServerConfig } from "../lib/config.interfaces";
import { getByteSize } from "../lib/tools/get_byte_size";
import { ILoggerEventEmitter } from "logger-event-emitter";
import { routeStatic } from "./routes/static";
import { IWebServerFastifyInstance } from "./interfaces";

export function buildWebServer (config: IWebServerConfig, logger: ILoggerEventEmitter): FastifyInstance {

    const full_static_folder_path = path.resolve(process.cwd(), config.store.path);

    if (fs.existsSync(full_static_folder_path) === false) {
        fs.mkdirSync(full_static_folder_path, {
            recursive: true
        });
        logger.info(`Folder ${chalk.cyan(full_static_folder_path)} created`);
    }

    const stat = fs.statSync(full_static_folder_path);

    if (stat.isDirectory() === false) {
        logger.fatal(`Path ${chalk.red(full_static_folder_path)} not folder`);
        process.exit(1);
    }

    const server = Fastify({
        logger: false,
        trustProxy: config.trust_proxy,
        connectionTimeout: config.connection_timeout,
        bodyLimit: getByteSize(config.body_limit),
        keepAliveTimeout: config.keep_alive_timeout
    });

    server.addHook("onRoute", async (route) => {
        logger.debug(`Registered route: ${chalk.yellow(route.method)} ${chalk.cyan(route.url)}`);
    });

    server.addHook("onClose", async () => {
        logger.debug("Server closed");
    });

    if (config.logging === true) {

        logger.debug(`Logging ${chalk.cyan("enabled")}`);

        const ignore_regexp_request = /(_ping|healthcheck|healthcheck\/readiness|healthcheck\/liveness)$/;

        server.addHook("onRequest", async (request: FastifyRequest) => {

            if (ignore_regexp_request.test(request.url) === true) {
                return;
            }

            if (request.body === null || request.body === undefined) {
                logger.debug(`Request ID ${chalk.green(request.id)} ${chalk.gray("-->")} ${chalk.yellow(request.method)} ${chalk.cyan(request.url)}`);
            } else {
                let body = request.body;
                if (typeof body === "object") {
                    body = JSON.stringify(body, null, 2);
                }
                logger.debug(`Request ID ${request.id}, ${chalk.yellow(request.method)} ${chalk.cyan(request.url)}\nBODY:\n${body}`);
            }
        });

        server.addHook("onResponse", async (request: FastifyRequest, reply: FastifyReply) => {
            if (ignore_regexp_request.test(request.url) === true) {
                return;
            }
            logger.debug(`Response ID ${chalk.green(request.id)} ${chalk.gray("<--")} ${chalk.yellow(request.method)} ${chalk.cyan(request.url)}, status: ${chalk.yellow(reply.statusCode)}, time: ${chalk.green(reply.getResponseTime())} ms`);
        });

    }

    server.setErrorHandler(function (error: FastifyError, request: FastifyRequest, reply: FastifyReply) {

        logger.error(`Request ID ${chalk.red(request.id)} error. Error: ${chalk.red(error.message)}`);
        logger.trace(error);

        reply.status(500).send({
            status: "error",
            message: "Internal Server Error"
        });

    });

    server.setNotFoundHandler(function (request: FastifyRequest, reply: FastifyReply) {
        reply.status(404).send({
            status: "Not Found",
            message: `Route ${request.method} ${request.url} not found`
        });
    });

    const prefix = config.prefix.replace(/\/$/,"");
    const route_options = {
        prefix: prefix
    };

    server.register( async function (fastify: IWebServerFastifyInstance) {

        fastify.decorate("logger", logger);
        fastify.decorate("config", config);

        routeStatic(fastify);

    }, route_options);

    return server;

}