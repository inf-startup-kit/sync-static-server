import { ISource, ISourceEvent } from "../source/interfaces";
import { IController, IControllerConfig } from "./interfaces";
import { ILoggerEventEmitter } from "logger-event-emitter";
import * as fs from "fs";
import * as path from "path";
import { sync as sync_del } from "rimraf";
import chalk from "chalk";
import { Source } from "../source";

export class Controller implements IController {

    private readonly _source: ISource;
    private readonly _full_folder_path: string;

    constructor (
        folder: string,
        private readonly _config: IControllerConfig,
        private readonly _logger: ILoggerEventEmitter
    ) {
        
        this._source = new Source(this._config.source, this._logger.child(`${this._logger.name}:source`));
        this._full_folder_path = path.resolve(process.cwd(), folder);

        if (fs.existsSync(this._full_folder_path) === true) {
            sync_del(this._full_folder_path);
            this._logger.debug(`Delete old folder ${chalk.gray(this._full_folder_path)}`);
        }

        fs.mkdirSync(this._full_folder_path, {
            recursive: true
        });
        
        this._logger.info(`Folder ${chalk.cyan(this._full_folder_path)} created`);

        this._source.on("change", (data: ISourceEvent[]) => {

            for (const event of data) {
                if (event.type === "add") {
                    this._add(event);
                }
                if (event.type === "change") {
                    this._change(event);
                }
                if (event.type === "delete") {
                    this._delete(event);
                }
            }

        });

    }

    async run (): Promise<void> {
        if (this._config.enable === false) {
            return;
        }
        this._source.run();
    }

    async close (): Promise<void> {
        if (this._config.enable === false) {
            return;
        }
        this._source.close();
    }

    async _add (event: ISourceEvent): Promise<void> {
        const full_file_path = path.resolve(this._full_folder_path, event.id);
        const dirname = path.dirname(full_file_path);
        try {
            if (fs.existsSync(dirname) === false) {
                fs.mkdirSync(dirname, {
                    recursive: true
                });
            }
            fs.copyFileSync(event.path, full_file_path);
        } catch (error) {
            this._logger.error(`Error add path ${chalk.red(full_file_path)}. Error: ${chalk.red(error)}`);
            this._logger.trace(error.trace);
        }
    }

    async _delete (event: ISourceEvent): Promise<void> {
        const full_file_path = path.resolve(this._full_folder_path, event.id);
        try {
            if (fs.existsSync(full_file_path) === true) {
                fs.unlinkSync(full_file_path);
            }
        } catch (error) {
            this._logger.error(`Error deleting path ${chalk.red(full_file_path)}. Error: ${chalk.red(error)}`);
            this._logger.trace(error.trace);
        }
    }

    async _change (event: ISourceEvent): Promise<void> {
        const full_file_path = path.resolve(this._full_folder_path, event.id);
        try {
            if (fs.existsSync(full_file_path) === true) {
                fs.unlinkSync(full_file_path);
            }
            fs.copyFileSync(event.path, full_file_path);
        } catch (error) {
            this._logger.error(`Error copy path ${chalk.red(full_file_path)}. Error: ${chalk.red(error)}`);
            this._logger.trace(error.trace);
        }
    }
   
}