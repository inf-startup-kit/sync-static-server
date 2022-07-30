import { Command } from "commander";
import chalk from "chalk";
import * as fs from "fs";
import * as path from "path";
import Ajv from "ajv";
import jtomler from "jtomler";
import json_from_schema from "json-from-default-schema";
import * as source_git_schema from "./schemes/git-source.json";
import * as config_schema from "./schemes/config.json";
import { IAppConfig } from "./config.interfaces";
import { AjvErrorHelper } from "./tools/ajv_error_helper";
import { IGitSourceConfig } from "./source/interfaces";

type TPackage = {
    version: string
    name: string
    [key: string]: unknown
}

type TOptions = {
    config: string
}

const findPkg = (): TPackage => {

    const cwd_pkg_full_path = path.resolve(process.cwd(), "package.json");
    const dirname_pkg_full_path = path.resolve(__dirname, "package.json");
    const app_pkg_full_path = path.resolve(path.dirname(process.argv[1]), "package.json");
    const require_pkg_full_path = path.resolve(path.dirname(require.main.filename), "package.json"); 

    if (fs.existsSync(dirname_pkg_full_path) === true) {
        return <TPackage>JSON.parse(fs.readFileSync(dirname_pkg_full_path).toString());
    }
    if (fs.existsSync(app_pkg_full_path) === true) {
        return <TPackage>JSON.parse(fs.readFileSync(app_pkg_full_path).toString());
    }
    if (fs.existsSync(require_pkg_full_path) === true) {
        return <TPackage>JSON.parse(fs.readFileSync(require_pkg_full_path).toString());
    }   
    if (fs.existsSync(cwd_pkg_full_path) === true) {
        return <TPackage>JSON.parse(fs.readFileSync(cwd_pkg_full_path).toString());
    }

    return <TPackage>{
        version: "unknown",
        name: "template"
    };

};

const program = new Command();
const pkg = findPkg();

if (pkg === undefined) {
    console.error(`${chalk.bgRed(" FATAL ")} package.json not found`);
    process.exit(1);
}

program.version(`${pkg.name} version: ${pkg.version}`, "-v, --version", "output the current version.");
program.name(pkg.name);
program.option("-c, --config <type>", "Path to config file.");

program.parse(process.argv);

const options = program.opts<TOptions>();

if (process.env["SYNC_STATIC_SERVER_CONFIG_PATH"] === undefined) {
	if (options.config === undefined) {
		console.error(`${chalk.bgRed(" FATAL ")} Not set --config key`);
		process.exit(1);
	}
} else {
	options.config = process.env["SYNC_STATIC_SERVER_CONFIG_PATH"];
}

const full_config_path = path.resolve(process.cwd(), options.config);

if (!fs.existsSync(full_config_path)) {
    console.error(`${chalk.bgRed(" FATAL ")} Config file ${full_config_path} not found`);
    process.exit(1);
}

const config: IAppConfig = <IAppConfig>json_from_schema(jtomler.parseFileSync(full_config_path), config_schema);

const ajv = new Ajv({
    allErrors: true, 
    strict: false
});
const validate = ajv.compile(config_schema);

if (validate(config) === false) {
    const error_text = AjvErrorHelper(validate);
    console.error(`${chalk.bgRed(" FATAL ")} Config schema errors:\n${error_text}`);
    process.exit(1);
}

let validate_source;

if (config.web.synchronization.source.type === "git") {
    validate_source = ajv.compile(source_git_schema);
    config.web.synchronization.source = <IGitSourceConfig>json_from_schema(config.web.synchronization.source, source_git_schema);
}

if (validate_source === undefined) {
    console.error(`${chalk.bgRed(" FATAL ")} Config key config.web.synchronization.source.type must be "git"`);
    process.exit(1);
}

if (validate_source(config.web.synchronization.source) === false) {
    const error_text = AjvErrorHelper(validate_source);
    console.error(`${chalk.bgRed(" FATAL ")} Config key config.web.synchronization.source parsing error. Schema errors:\n${error_text}`);
    process.exit(1);
}

config.api.prefix = `/${config.api.prefix.replace(/(^\/|\/$)/g,"")}`;

export default config;