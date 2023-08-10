import { config } from "dotenv";
let prod = false;
let envPath = ".env.test";
if (process.env.PROD === "true") {
    prod = true;
    envPath = ".env";
}

config({
    path: envPath,
});

export interface BotConfig {
    prod: boolean;
    botToken: string;
    clientId: string;
    adminPrivateKey: `0x${string}`;
}

const adminKey = () => {
    let adminPrivateKey = process.env.adminPrivateKey || "";
    if (!adminPrivateKey.startsWith("0x")) {
        adminPrivateKey = `0x${adminPrivateKey}`;
    }
    return adminPrivateKey;
};

const botConfig = {
    prod,
    botToken: process.env.botToken,
    clientId: process.env.clientId,
    adminPrivateKey: adminKey(),
} as BotConfig;

export const settings = {
    appName: "nunti", //will be used in the "sources" of metadata
    curationCategoryName: "colib lists", //will be used in the new created category in discord server
    defaultCurationList: "general", //will be used in the new created linklist in the community
    botConfig,
    loadingPrompt:
        "⛏️ Processing...(I'm a little slow for now - but all my content is stored decentrally using blockchain so it's worth it)",
    curatorUsageMsg: `
    {{url}} reason to share... <@${botConfig.clientId}> #tag1 #tag2 #curation-list

    Note: tags and curation list are optional.
    `,
    prodAddr: "0x82D071484572125A30e6190F79c2e746c160CDfC" as `0x${string}`,
};
