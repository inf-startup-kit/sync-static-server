import { ValidateFunction } from "ajv";
import chalk from "chalk";

export function AjvErrorHelper (validate: ValidateFunction): string {

    let result = "";

    for (const item of validate.errors) {
        result = `${result}  - Key ${chalk.yellow(item.instancePath.replace(/^\//, ""))} ${item.message}\n`;
    }

    return result;

}