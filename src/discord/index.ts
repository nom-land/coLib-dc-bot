import {
    Client,
    Events,
    GatewayIntentBits,
    Interaction,
    Message,
} from "discord.js";
import {
    handleCurationMsg,
    handleDiscussionMsg,
    isDiscussion,
    maybeCuration,
} from "./handle";
import { Curation } from "../curation/types";
import { Record } from "../record/types";
import { loadKeyValuePairs } from "../utils/keyValueStore";
import commands from "./commands";
import { BotConfig } from "../config";
const threadIds = new Map<string, string>();
const discussionMsgIds = new Map<string, string>();
const curationMsgIds = new Map<string, string>();

export function start(
    cfg: BotConfig,
    processCuration: (
        c: Curation,
        url: string,
        adminPrivateKey: `0x${string}`
    ) => Promise<{
        rid: string;
        cid: string;
        record: Record;
        curatorId: string;
        noteId: string;
    }>
) {
    loadKeyValuePairs(threadIds, "threads");
    loadKeyValuePairs(discussionMsgIds, "discussionMsgs");
    loadKeyValuePairs(curationMsgIds, "curationMsgs");

    const client = new Client({
        /*
    https://discordjs.guide/popular-topics/intents.html#enabling-intents
    - If you need your bot to receive messages (MESSAGE_CREATE - "messageCreate" in discord.js), you need the Guilds and GuildMessages intent, plus the MessageContent privileged intent to receive the content, attachments, embeds and components fields of the message.
    - If you want your bot to post welcome messages for new members (GUILD_MEMBER_ADD - "guildMemberAdd" in discord.js), you need the GuildMembers privileged intent, and so on.
    */
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
        ],
    });

    client.on("ready", () => {
        console.log(`Logged in as ${client.user?.tag}!`);
    });

    client.on("messageCreate", async (message: Message) => {
        // get parent id of the channel
        const d = await message.channel.fetch();

        console.log("message channel", JSON.stringify(message.channel));
        if (isDiscussion(message, threadIds, curationMsgIds)) {
            console.log("this is a discussion message");

            handleDiscussionMsg(
                message,
                cfg.adminPrivateKey,
                discussionMsgIds,
                curationMsgIds,
                threadIds
            );
        } else if (maybeCuration(message, cfg.clientId)) {
            console.log("this is a curation message");
            handleCurationMsg(
                message,
                cfg,
                processCuration,
                threadIds,
                curationMsgIds
            );
        }
    });

    // register a "/help" command
    client.on(Events.InteractionCreate, async (interaction: Interaction) => {
        if (!interaction.isCommand()) return;
        commands[interaction.commandName].execute(interaction);
    });

    client.login(cfg.botToken);
}
