import config from "./lib/init";
import chalk from "chalk";
import { LoggerEventEmitter } from "logger-event-emitter";
import { buildApiServer } from "./http/build_api_server";
import { buildWebServer } from "./http/build_static_server";
import { Controller } from "./lib/controller";

const logger = new LoggerEventEmitter(config.logger);

logger.debug(`\nCONFIG:\n${JSON.stringify(config, null, 4)}`);

const controller = new Controller(config.web.store.path, config.web.synchronization, logger.child("controller"));

const bootstrap = async () => {

    try {

        const api_server_logger = logger.child("api-server");
        const api_server = buildApiServer(config.api, api_server_logger);
        const web_server_logger = logger.child("web-server");
        const web_server = buildWebServer(config.web, web_server_logger);

        controller.run();

        if (config.api.enable === true) {

            api_server.listen({
                port: config.api.port,
                host: config.api.hostname,
                backlog: config.api.backlog
            }, (error: Error, address: string) => {
                if (error !== null) {
                    api_server_logger.fatal(`Error start server. Error: ${chalk.red(error)}`);
                    process.exit(1);
                }
                api_server_logger.info(`Server listening on ${chalk.cyan(address)}`);
            });
        }

        if (config.web.enable === true) {

            web_server.listen({
                port: config.web.port,
                host: config.web.hostname,
                backlog: config.web.backlog
            }, (error: Error, address: string) => {
                if (error !== null) {
                    web_server_logger.fatal(`Error start server. Error: ${chalk.red(error)}`);
                    process.exit(1);
                }
                web_server_logger.info(`Server listening on ${chalk.cyan(address)}`);
            });
        }

        const stop_app = () => {
            api_server.close();
            web_server.close();
            controller.close();
            setImmediate( () => {
                process.exit();
            });
        };

        process.on("SIGTERM", () => {
            logger.info(`Signal ${chalk.cyan("SIGTERM")} received`);
            stop_app();
        });

        process.on("SIGINT", () => {
            logger.info(`Signal ${chalk.cyan("SIGINT")} received`);
            stop_app();
        });

    } catch (error) {
        logger.fatal(`Error application start.\n${error.stack}`);
        process.exit(1);
    }

};

bootstrap();