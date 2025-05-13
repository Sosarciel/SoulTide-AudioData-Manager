import { program } from "commander";
import { cmdRoute } from "./Command";

export async function cliRoute() {
    cmdRoute(program);
    program.parse(process.argv);
}
cliRoute();