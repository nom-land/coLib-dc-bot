import { ClientUser, Message } from "discord.js";
import { expect, it } from "vitest";
import { parseAsCurationMsg } from "../src/discord/handle";
import { mentionsBot } from "../src/discord/utils";

const mockMentionBotMsg = (botId: string) => {
    const users = new Map();
    users.set(botId, {
        bot: true,
        id: botId,
    } as ClientUser);
    return {
        mentions: {
            users,
        },
    } as Message;
};

const message = {
    channelId: "1045396775214788628",
    guildId: "902542811273003069",
    id: "1114183303092777004",
    createdTimestamp: 1685712399982,
    type: 0,
    system: false,
    content:
        "<@1037378110951264336>  <#1114173683058102282>  https://saltad.xlog.app/tutorial-how-to-sync-wechat-articles-onchain 一篇很详细的介绍如何备份自己的微信公众号的文章",
    authorId: "1079592245428244540",
    pinned: false,
    tts: false,
    nonce: "1114183302199115776",
    embeds: [],
    components: [],
    attachments: [],
    stickers: [],
    position: null,
    roleSubscriptionData: null,
    editedTimestamp: null,
    mentions: {
        everyone: false,
        users: ["1037378110951264336"],
        roles: [],
        crosspostedChannels: [],
        repliedUser: null,
        members: ["1037378110951264336"],
        channels: ["1114173683058102282"],
    },
    webhookId: null,
    groupActivityApplicationId: null,
    applicationId: null,
    activity: null,
    flags: 0,
    reference: null,
    interaction: null,
    cleanContent:
        "@test-bot  #test-forum  https://saltad.xlog.app/tutorial-how-to-sync-wechat-articles-onchain 一篇很详细的介绍如何备份自己的微信公众号的文章",
};
const mockClientId = "1234567890123456789";

it("mention bot works", (ctx) => {
    const msg = mockMentionBotMsg(mockClientId || "");
    expect(mentionsBot(msg, mockClientId)).toBeTruthy();
});

it("parse content works", () => {
    console.log(parseAsCurationMsg(message as any));
});
