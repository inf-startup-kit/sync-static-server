import { EventEmitter } from "events";
import chalk from "chalk";
import { ILoggerEventEmitter } from "logger-event-emitter";
import { IGitSourceConfig, ISource, ISourceConfig, ISourceEvent } from "./interfaces";
import { GitSource } from "./lib/git-source";

export class Source extends EventEmitter implements ISource {

    private readonly _source: ISource;

    constructor (
        config: ISourceConfig,
        logger: ILoggerEventEmitter
    ) {

        super();

        if (config.type === "git") {
            this._source = new GitSource(<IGitSourceConfig>config, logger);
        }

        if (this._source === undefined) {
            logger.fatal(`Source type ${chalk.red(config.type)} not support`);
            process.exit(1);
        }

        this._source.on("change", (data: ISourceEvent[]) => {
            this.emit("change", data);
        });

    }

    run (): Promise<void> {
        return this._source.run();
    }

    close (): Promise<void> {
        return this._source.close();
    }

}