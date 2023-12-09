import { crossbell } from "crossbell/network";
import { start } from "./discord";
import fetch from "isomorphic-fetch"; // 或者 'cross-fetch'
import { settings } from "./config";
import { log } from "./utils/log";

//Localhost
if (process.env.CROSSBELL_RPC_ADDRESS === "http://127.0.0.1:8545") {
    (crossbell.id as any) = 31337;
}
//Localhost End

// I don't know why but I have to...
global.fetch = fetch;
globalThis.fetch = fetch;

function main() {
    if (!process.env.botToken) {
        log.error("Invalid botToken");
        return;
    }
    if (!process.env.clientId) {
        log.error("Invalid clientId");
        return;
    }
    if (!process.env.adminPrivateKey) {
        log.error("Invalid admin private key");
        return;
    }

    //TODO: setup app character
    start(settings.botConfig);
}

main();
