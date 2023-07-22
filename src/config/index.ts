import { config } from "dotenv";
config();

export interface BotConfig {
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
    botToken: process.env.botToken,
    clientId: process.env.clientId,
    adminPrivateKey: adminKey(),
} as BotConfig;

export const settings = {
    appName: "coLib", //will be used in the "sources" of metadata
    curationCategoryName: "colib lists", //will be used in the new created category in discord server
    defaultCurationList: "general", //will be used in the new created linklist in the community
    botConfig,
    loadingPrompt:
        "⛏️ Processing...(I know I am slow, but decentralization has paid off. And I will be fast!)",
    curatorUsageMsg: `
    {{url}} reason to share... <@${botConfig.clientId}> #tag1 #tag2 #curation-list

    Note: tags and curation list are optional.
    `,
};
