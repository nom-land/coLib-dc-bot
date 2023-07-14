import { Message } from "discord.js";
import { Curation, NoteId } from "../curation/types";
import { feedbackUrl, hashOf } from "../utils";
import { BotConfig } from ".";
import { Record } from "../record/types";
import { addKeyValue } from "../utils/keyValueStore";
import { settings } from "../config";
import { processDiscussion } from "../curation";
import { Account } from "../crossbell/types";
import { NoteMetadata } from "crossbell";
import { mentionsBot } from "./utils";

export function maybeCuration(message: Message, clientId: string) {
    return mentionsBot(message, clientId);
}

async function parseMessage(message: Message) {
    const { guild, guildId, channelId, content, author } = message;
    if (!guild || !guildId) {
        console.log("Fail to parse message guild.");
        return null;
    }
    const guildName = guild.name;
    const channelName = (await guild.channels.fetch(channelId))?.name;
    return {
        poster: {
            nickname: author.username,
            banner: author.bannerURL(),
            avatar: author.avatarURL(),
            platform: "Discord",
            handle: hashOf(author.id, 12),
        } as Account,
        message: {
            content: message.cleanContent,
            sources: [guildName, channelName],
            date_published: new Date(message.createdTimestamp).toISOString(),
        } as NoteMetadata,
        community: {
            platform: "Discord",
            nickname: guildName,
            handle: hashOf(guildId, 12),
            dao: true,
        } as Account,
    };
}
export async function parseAsCurationMsg(message: Message) {
    const data = await parseMessage(message);
    if (!data) {
        return null;
    }

    const urlPattern = /(http[s]?:\/\/[^<\s]+|ipfs:\/\/[^<\s]+)/g;

    //TODO: <#xxx> and parse forum name
    const mentionPattern = /<@\d+>/g;

    // Extract the first URL
    const urls = message.content.match(urlPattern);
    if (!urls) {
        return null;
    }

    const url = urls[0];

    // Clean the content
    const cleanedContent = message.content
        .replace(urlPattern, "")
        .replace(mentionPattern, "")
        .trim();

    return {
        rawCuration: {
            raw: data.message,
            curator: data.poster,
            list: "general", //TODO
            reason: {
                comment: cleanedContent,
                tagSuggestions: [],
            },
            community: data.community,
        } as Curation,
        url,
    };
}

/* handle the message as a curation */
export async function handleCurationMsg(
    message: Message,
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
    }>,
    threadIds: Map<string, string>,
    curationMsgIds: Map<string, string>
) {
    console.log(JSON.stringify(message));
    const data = await parseAsCurationMsg(message);
    if (!data) {
        await message.reply("Hi! I am " + settings.appName);
        return;
    }
    const { url, rawCuration } = data;

    const thread = await message.startThread({
        name: message.cleanContent.slice(0, 20) + "...",
    });

    const hdl = await thread.send("⛏️ Processing...");

    if (!rawCuration) {
        console.log("parsed error"); //TODO: reply on discord
        hdl.reply("curation is not successfully parsed");
        return;
    }
    try {
        const { cid, rid, record, curatorId, noteId } = await processCuration(
            rawCuration,
            url,
            cfg.adminPrivateKey
        );
        if (record.title)
            thread.edit({
                name: record.title.slice(0, 100),
            });

        if (addKeyValue(thread.id, rid, "threads")) {
            threadIds.set(thread.id, rid);
        } else {
            console.error(
                "addKeyValue failed. thread id: " +
                    thread.id +
                    " record id: " +
                    rid
            );
        }

        if (addKeyValue(message.id, curatorId + "-" + noteId, "curationMsgs")) {
            curationMsgIds.set(message.id, curatorId + "-" + noteId);
        } else {
            console.error(
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
                rid
            )}`
        );
    } catch (error) {
        console.log(error); //TODO: reply on discord
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
    console.log(message.reference?.messageId, isReply2Curation);
    return inCurationThread || isReply2Curation;
}

// Post the message on Crossbell
export async function handleDiscussionMsg(
    message: Message,
    adminPrivateKey: `0x${string}`,
    discussionMsgIds: Map<string, string>,
    curationMsgIds: Map<string, string>
) {
    console.log("handling discussion message...");
    const data = await parseMessage(message);
    if (!data) {
        return;
    }
    // if this message is replying to another message
    let refNote: NoteId | null = null;
    if (message.reference) {
        const refMsgId = message.reference.messageId;
        console.log("[DEBUG] there's refNote: ", refMsgId);

        if (refMsgId) {
            const note =
                discussionMsgIds.get(refMsgId) || curationMsgIds.get(refMsgId);
            if (note) {
                const noteIds = note.split("-"); // characterId-noteId
                const characterId = Number(noteIds[0]);
                const noteId = Number(noteIds[1]);
                refNote = {
                    characterId,
                    noteId,
                };
                console.log(
                    "[DEBUG] refNote parsed as: " + characterId + "-" + noteId
                );
            }
        }
    }
    const noteId = await processDiscussion(
        data.poster,
        data.message,
        refNote,
        adminPrivateKey
    );

    const noteIdStr =
        noteId.characterId.toString() + "-" + noteId.noteId.toString();
    if (addKeyValue(message.id, noteIdStr, "discussionMsgs")) {
        discussionMsgIds.set(message.id, noteIdStr);
    }
    console.log(
        "[DEBUG] handleDiscussionMsg done, noteID: " +
            noteId.characterId +
            "-" +
            noteId.noteId
    );
}
