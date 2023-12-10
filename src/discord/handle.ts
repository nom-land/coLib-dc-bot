import { AnyThreadChannel, Guild, Message, User } from "discord.js";
import { feedbackUrl, hashOf } from "../utils";
import { addKeyValue } from "../utils/keyValueStore";
import { settings } from "../config";
import { NoteMetadata } from "crossbell";
import { mentionsBot } from "./utils";
import { GuildChannelManager } from "discord.js";
import { log } from "../utils/log";
import Nomland, { Account, Curation } from "nomland.js";

export function maybeCuration(message: Message, clientId: string) {
    return !message.author.bot && mentionsBot(message, clientId);
}

export function parseCommunity(guild: Guild) {
    const { name, id } = guild;
    return {
        platform: "Discord",
        nickname: name,
        handle: hashOf(id, 12),
        dao: true,
    } as Account;
}

export function parsePoster(author: User) {
    return {
        nickname: author.username,
        banner: author.bannerURL(),
        avatar: author.avatarURL(),
        platform: "Discord",
        handle: hashOf(author.id, 12),
    } as Account;
}

async function parseMessage(message: Message) {
    const { guild, guildId, channelId, author } = message;
    if (!guild || !guildId) {
        log.error("Fail to parse message guild.");
        return null;
    }
    const guildName = guild.name;
    const channelName = (await guild.channels.fetch(channelId))?.name;
    return {
        poster: parsePoster(author),
        message: {
            content: message.cleanContent,
            sources: [guildName, channelName],
            date_published: new Date(message.createdTimestamp).toISOString(),
        } as NoteMetadata,
        community: parseCommunity(guild),
    };
}

async function extractTagsOrLists(
    channels: GuildChannelManager,
    cleanContent: string
) {
    const tagsOrList = [] as string[];

    const mentionChannelPattern = /<#\d+>/g;

    // Extract all #channel patterns, and get name from the id
    const mentionIds = cleanContent.match(mentionChannelPattern);
    if (mentionIds) {
        for (let mentionId of mentionIds) {
            // mentionId is <#xxxx>, slice only the id
            mentionId = mentionId.slice(2, -1);
            const channel = await channels.fetch(mentionId);
            if (channel?.name) tagsOrList.push(`#${channel.name}`);
        }
    }

    // Replace all #channel patterns with ""
    cleanContent = cleanContent.replace(mentionChannelPattern, "");

    // Get #string patterns
    const tagsOrListPattern = /#[^\s]+/g;
    const tags = cleanContent.match(tagsOrListPattern);

    tags?.map((tag) => tagsOrList.push(tag));
    return tagsOrList;
}

function getContentBeforeAndAfterBot(botId: string, content: string) {
    const contentAfterBot = content
        .slice(content.indexOf(botId) + botId.length)
        .trim();

    const contentBeforeBot = content.slice(0, content.indexOf(botId) - 2);
    return { contentAfterBot, contentBeforeBot };
}

// Extract the first URL
function extractFirstUrl(content: string) {
    const urlPattern = /(http[s]?:\/\/[^<\s]+|ipfs:\/\/[^<\s]+)/g;

    const urls = content.match(urlPattern);
    if (!urls) {
        return { url: null, cleanedContent: content };
    }

    const url = urls[0];

    return { url, cleanedContent: content.replace(urlPattern, "").trim() };
}

export async function parseAsCurationMsg(message: Message) {
    const data = await parseMessage(message);
    if (!data) {
        return null;
    }

    if (!message.guild?.channels) {
        return null;
    }
    // Suggested tags and list is after the @bot
    const botId = settings.botConfig.clientId;
    // TODO: use message.cleancontent...

    const { contentBeforeBot, contentAfterBot } = getContentBeforeAndAfterBot(
        botId,
        message.content
    );

    const { url, cleanedContent } = extractFirstUrl(contentBeforeBot);
    if (!url) return null;

    const tagsOrList = await extractTagsOrLists(
        message.guild?.channels,
        contentAfterBot
    );

    return {
        rawCuration: {
            raw: data.message,
            curator: data.poster,
            reason: {
                comment: cleanedContent,
                tagSuggestions: tagsOrList,
            },
            community: data.community,
        } as Curation,
        url,
    };
}

/* handle the message as a curation */
export async function handleCurationMsg(
    message: Message,
    threadIds: Map<string, string>,
    curationMsgIds: Map<string, string>,
    thread?: AnyThreadChannel<boolean>
) {
    const data = await parseAsCurationMsg(message);
    if (!data) {
        await message.reply(settings.curatorUsageMsg);
        return;
    }
    const { url, rawCuration } = data;

    let hasTitle = !!thread?.name;
    if (hasTitle) rawCuration.reason.titleSuggestion = thread!.name;

    if (!thread) {
        thread = await message.startThread({
            name: message.cleanContent.slice(0, 20) + "...",
        });
    }

    const hdl = await thread.send(settings.loadingPrompt);

    if (!rawCuration) {
        log.error("parsed error"); //TODO: reply on discord
        hdl.reply("curation is not successfully parsed");
        return;
    }
    try {
        const nomland = new Nomland(
            settings.appName,
            settings.botConfig.adminPrivateKey
        );

        const { cid, rid, record, curatorId, noteId } =
            await nomland.processCuration(rawCuration, url, "elephant");

        if (!hasTitle && record.title)
            thread.edit({
                name: record.title.slice(0, 100),
            });

        if (addKeyValue(thread.id, rid, "threads")) {
            threadIds.set(thread.id, rid);
        } else {
            log.error(
                "addKeyValue failed. thread id: " +
                    thread.id +
                    " record id: " +
                    rid
            );
        }

        if (addKeyValue(message.id, curatorId + "-" + noteId, "curationMsgs")) {
            curationMsgIds.set(message.id, curatorId + "-" + noteId);
        } else {
            log.error(
                "addKeyValue failed. message id: " +
                    message.id +
                    " curator id: " +
                    curatorId +
                    " note id: " +
                    noteId
            );
        }

        hdl.edit(
            `🎉 Curation is successfully processed. See: ${feedbackUrl(
                cid,
                rid,
                curatorId,
                noteId
            )}
✉️ Attention: all messages in this thread or replies to this curation will be recorded on chain`
        );
    } catch (error) {
        log.error(error); //TODO: reply on discord
        hdl.edit("😢 Curation is not successfully processed");
    }
}

// Check if the message is a discussion towards a curation
export function isDiscussion(
    message: Message,
    threadIds: Map<string, string>,
    curationMsgIds: Map<string, string>
) {
    const channelId = message.channelId;
    const inCurationThread = threadIds.get(channelId);
    const isReply2Curation = curationMsgIds.has(
        message.reference?.messageId || ""
    );
    const authorIsNotBot = !message.author.bot;
    return authorIsNotBot && (inCurationThread || isReply2Curation);
}

export function getDiscussingCuration(
    discussion: Message,
    curationMsgIds: Map<string, string>
) {
    // the created thread and the message it originated from shares the same id
    const threadId = discussion.channelId;
    if (threadId) return curationMsgIds.get(threadId);
    return null;
}

// Post the message on Crossbell
export async function handleDiscussionMsg(
    message: Message,
    adminPrivateKey: `0x${string}`,
    discussionMsgIds: Map<string, string>,
    curationMsgIds: Map<string, string>
) {
    const data = await parseMessage(message);
    if (!data) {
        return;
    }
    let noteIds = null;

    // if this message is replying to another message
    if (message.reference) {
        const refMsgId = message.reference.messageId;
        log.info("[DEBUG] there's refNote: ", refMsgId);
        if (refMsgId) {
            const note =
                discussionMsgIds.get(refMsgId) || curationMsgIds.get(refMsgId);
            if (note) noteIds = note;
        }
    } else {
        const discussingRecordId = getDiscussingCuration(
            message,
            curationMsgIds
        );
        if (discussingRecordId) noteIds = discussingRecordId;
    }

    if (!noteIds) {
        return;
    }

    const nomland = new Nomland(
        settings.appName,
        settings.botConfig.adminPrivateKey
    );

    const { characterId, noteId } = await nomland.processDiscussion(
        data.poster,
        data.community,
        data.message,
        noteIds
    );

    const noteIdStr = characterId + "-" + noteId;
    if (addKeyValue(message.id, noteIdStr, "discussionMsgs")) {
        discussionMsgIds.set(message.id, noteIdStr);
    }

    log.info(
        "[DEBUG] handleDiscussionMsg done, noteID: " +
            characterId +
            "-" +
            noteId
    );
}
