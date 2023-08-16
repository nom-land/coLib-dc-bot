import {
    AnyThreadChannel,
    ChannelType,
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
import { BotConfig, settings } from "../config";
import { log } from "../utils/log";
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
        log.info(`Logged in as ${client.user?.tag}!`);
    });

    client.on("threadCreate", async (thread: AnyThreadChannel) => {
        if (thread.type == ChannelType.PublicThread) {
            // When a new forum post is created
            console.log("threadCreate", thread.parentId); // The forum channel ID
            console.log("threadCreate", thread.id); // The forum post ID
            console.log("threadCreate", thread.name); // The name of the forum post

            console.log(thread.parent?.type, ChannelType.GuildForum);
            const messages = await thread.messages.fetch();
            const message = messages.first();
            console.log(message?.id);
            if (message && maybeCuration(message, cfg.clientId)) {
                handleCurationMsg(
                    message,
                    cfg,
                    processCuration,
                    threadIds,
                    curationMsgIds,
                    thread
                );
            }
        }
    });

    client.on("messageCreate", async (message: Message) => {
        // get parent id of the channel
        const d = await message.channel.fetch();
        console.log(
            "messageCreate",
            message.channel.type,
            message.cleanContent
        );
        console.log(message.hasThread);
        if (isDiscussion(message, threadIds, curationMsgIds)) {
            handleDiscussionMsg(
                message,
                cfg.adminPrivateKey,
                discussionMsgIds,
                curationMsgIds
            );
        } else if (maybeCuration(message, cfg.clientId)) {
            const c = message.guild?.channels.cache.find((channel) => {
                if (channel.id == message.channel.id) {
                    return true;
                }
            });
            const pType = c?.parent?.type;
            if (pType == ChannelType.GuildForum) {
                // Handled in "threadCreate"
            } else if (pType == ChannelType.GuildText) {
                handleCurationMsg(
                    message,
                    cfg,
                    processCuration,
                    threadIds,
                    curationMsgIds
                );
            } else {
                await message.reply(
                    `Curation is not allowed in threads. Please post in the channel.

${settings.curatorUsageMsg}`
                );
            }
        }
    });

    // register a "/help" command
    client.on(Events.InteractionCreate, async (interaction: Interaction) => {
        if (!interaction.isCommand()) return;
        commands[interaction.commandName].execute(interaction);
    });

    client.login(cfg.botToken);
}
