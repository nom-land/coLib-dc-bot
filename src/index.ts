import { crossbell } from "crossbell/network";
import { processCuration } from "./curation";
import { BotConfig, start } from "./discord";
import { config } from "dotenv";
import fetch from "isomorphic-fetch"; // 或者 'cross-fetch'

config();

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
        console.error("Invalid botToken");
        return;
    }
    if (!process.env.clientId) {
        console.error("Invalid clientId");
        return;
    }
    if (!process.env.adminPrivateKey) {
        console.error("Invalid admin private key");
        return;
    }

    let adminPrivateKey = process.env.adminPrivateKey;
    if (!adminPrivateKey.startsWith("0x")) {
        adminPrivateKey = `0x${adminPrivateKey}`;
    }

    const cfg = {
        botToken: process.env.botToken,
        clientId: process.env.clientId,
        adminPrivateKey,
    } as BotConfig;
    //TODO: setup app character
    start(cfg, processCuration);
}

main();
