import { FastifyReply, FastifyRequest } from "fastify";
import { IWebServerFastifyInstance } from "../interfaces";
import * as fs from "fs";
import * as path from "path";
import * as mime from "mime-types";

export async function routeStatic(fastify: IWebServerFastifyInstance) {

    const handler = (request: FastifyRequest, reply: FastifyReply) => {

        const file_path = request.url.replace(/^\//,"").trim();
        
        if (file_path === undefined || file_path === "") {
            reply.code(404);
            reply.send("Not Found");
            return;
        }
      
        const full_file_path = path.resolve(process.cwd(), fastify.config.store.path, file_path.replace("..",""));
        const file_name = path.basename(full_file_path);

        if (file_name[0] === "." && fastify.config.store.hidden === false) {
            reply.code(404);
            reply.send("Not Found");
            return;
        }

        if (fs.existsSync(full_file_path) === false) {
            reply.code(404);
            reply.send("Not Found");
            return;
        }

        const stat = fs.statSync(full_file_path);

        if (stat.isDirectory() === true) {
            reply.code(404);
            reply.send("Not Found");
            return;
        }

        const stream = fs.createReadStream(full_file_path);

        reply.header("content-type", <string>mime.lookup(full_file_path));
        reply.send(stream);

    };

    fastify.route({
        url: "/*",
        handler: handler,
        method: "GET"
    });

}


